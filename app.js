import { emails } from './emails.js';
import { extract } from './extract.js';

const IC = {"box": "M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z", "star": "M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z", "back": "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z", "archive": "M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z", "trash": "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z", "more": "M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"};
const ic = (n, c = "i") => `<svg class="${c}" viewBox="0 0 24 24"><path d="${IC[n]}"/></svg>`;

const COLS = ['Customer', 'Qty', 'Product', 'Deliver by', 'Ref', 'Received', 'Email'];
const KEYS = ['customer', 'qty', 'product', 'deliverBy', 'ref', 'received', 'email'];
const MIN_ROWS = 18;
const FILM = new URLSearchParams(location.search).has('film');
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const orders = () => Object.values(state.done).filter(d => d.isOrder).length;

let state, runId = 0, running = false, onStep = () => {};

function reset() {
  runId++; running = false;
  state = { done: {}, rows: [] };
  $('run').disabled = false;
  $('status').innerHTML = '10 emails are waiting in the inbox. Press <b>Run automation</b>.';
  closeEmail(); renderList(); renderGrid(); renderStats();
}

function chip(d, active) {
  if (d) return d.isOrder ? '<span class="chip ok">Orders</span>' : '<span class="chip skip">Not an order</span>';
  return active ? '<span class="chip work">Reading…</span>' : '';
}

function renderList(active) {
  $('list').innerHTML = emails.map(e => {
    const d = state.done[e.id];
    const snippet = e.body.replace(/\s+/g, ' ').slice(0, 90);
    return `<div class="row ${d ? '' : 'unread'} ${active === e.id ? 'active' : ''}" data-id="${e.id}">
      <span class="lead">${ic('box', 'i sm')}${ic('star', 'i sm')}</span>
      <span class="from">${esc(e.from_name)}</span>
      <span class="subj">${chip(d, active === e.id)}<b>${esc(e.subject)}</b><span class="snip"> - ${esc(snippet)}</span></span>
      <span class="time">${e.time}</span></div>`;
  }).join('');
  const unread = emails.filter(e => !state.done[e.id]).length;
  $('unread').textContent = unread || '';
  $('nOrders').textContent = orders() || '';
  $('nSkip').textContent = (Object.keys(state.done).length - orders()) || '';
}

function renderGrid(flashFrom = -1) {
  const head = '<tr><th class="corner"></th>' + COLS.map((_, i) => `<th>${String.fromCharCode(65 + i)}</th>`).join('') + '</tr>';
  const title = '<tr><th>1</th>' + COLS.map(c => `<td class="h">${c}</td>`).join('') + '</tr>';
  const n = Math.max(MIN_ROWS, state.rows.length + 3);
  let body = '';
  for (let i = 0; i < n; i++) {
    const r = state.rows[i];
    body += `<tr class="${r && flashFrom >= 0 && i >= flashFrom ? 'flash' : ''}"><th>${i + 2}</th>` +
      KEYS.map(k => `<td class="${k === 'qty' ? 'num' : ''}">${r ? esc(r[k]) : ''}</td>`).join('') + '</tr>';
  }
  $('grid').innerHTML = head + title + body;
}

function renderStats() {
  $('sOrders').textContent = orders();
  $('sRows').textContent = state.rows.length;
  $('sSaved').textContent = orders() * 6 + ' min';
}

async function run(speed = 1) {
  const my = ++runId;
  $('run').disabled = true; running = true;
  closeEmail();
  for (const e of emails) {
    if (state.done[e.id]) continue;
    onStep(e);
    $('status').innerHTML = `Reading <b>${esc(e.subject)}</b> from ${esc(e.from_name)}…`;
    renderList(e.id);
    document.querySelector('.row.active')?.scrollIntoView({ block: 'nearest' });
    await sleep(900 * speed); if (my !== runId) return;
    const res = extract(e);
    state.done[e.id] = res;
    const from = state.rows.length;
    state.rows.push(...res.rows);
    renderList(); renderGrid(from); renderStats();
    const g = $('grid').parentElement, tr = [...g.querySelectorAll('tr.flash')].at(-1); // follow new rows only when they fall off screen
    if (tr && tr.offsetTop + tr.offsetHeight > g.scrollTop + g.clientHeight) g.scrollTop = tr.offsetTop + tr.offsetHeight - g.clientHeight;
    if (res.isOrder) {
      $('cellref').textContent = 'E' + (state.rows.length + 1); $('fx').textContent = res.rows.at(-1).ref;
      $('status').innerHTML = `<b>${esc(e.from_name)}</b>: order found → ${res.rows.length} row${res.rows.length > 1 ? 's' : ''} written to the sheet.`;
    } else {
      $('status').innerHTML = `<b>${esc(e.subject)}</b> is not an order → skipped, nothing written.`;
    }
    await sleep(700 * speed); if (my !== runId) return;
  }
  running = false;
  $('status').innerHTML = `Done. ${orders()} orders, ${state.rows.length} rows, 0 typed by hand. Click any email to see what was read.`;
}

function openEmail(id) {
  const e = emails.find(x => x.id === id);
  const res = extract(e);
  const lines = e.body.split('\n').map(l => {
    const hit = res.isOrder && /^\s*(\d+\s*(x|st|pcs)\s|deliver by|leverans|delivery|our ref|ref|vår referens|referens)/i.test(l);
    return `<div class="${hit ? 'hit' : ''}">${esc(l) || '&nbsp;'}</div>`;
  }).join('');
  $('read').innerHTML = `<div class="rtool"><button class="ib" id="back" aria-label="Back to Inbox">${ic('back')}</button>${ic('archive')}${ic('trash')}${ic('more')}</div>
    <h2>${esc(e.subject)} ${chip(res)}</h2>
    <div class="sender"><span class="avatar s">${esc(e.from_name[0])}</span><div><b>${esc(e.from_name)}</b> <span class="addr">&lt;${esc(e.from_addr)}&gt;</span><div class="tome">to me</div></div><span class="rtime">${e.time}</span></div>
    <div class="body">${lines}</div>
    <p class="note">${res.isOrder ? 'Yellow = what the automation read and wrote to the sheet.' : 'No order lines found, so nothing was written.'}</p>`;
  $('list').hidden = $('tabs').hidden = $('tool').hidden = true; $('read').hidden = false;
  $('back').onclick = closeEmail;
}
function closeEmail() { $('read').hidden = true; $('list').hidden = $('tabs').hidden = $('tool').hidden = false; }

$('list').addEventListener('click', ev => {
  const row = ev.target.closest('.row');
  if (row && !running) openEmail(Number(row.dataset.id));
});
$('run').onclick = () => run();
$('reset').onclick = reset;
reset();

// Film mode (?film): the same page, run by itself with captions, for the screen recording.
async function film() {
  document.body.classList.add('film');
  const cap = t => { $('cap').hidden = !t; $('cap').innerHTML = t || ''; };
  const card = async (html, ms) => { $('card').innerHTML = html; $('card').hidden = false; await sleep(ms); $('card').hidden = true; };
  await sleep(400);
  await card('<p class="k">Every day, someone types order emails into a spreadsheet.</p><p class="s">By hand. One by one.</p>', 3800);
  cap('10 new emails. Some are orders. Some are not.'); await sleep(3200);
  cap('One click. The automation reads every email.');
  onStep = e => {
    if (e.id === 1) cap('An order → each product becomes a row: customer, quantity, date, reference.');
    if (e.id === 2) cap('A newsletter → not an order. Skipped, nothing written.');
    if (e.id === 3) cap('Swedish email? Same result.');
    if (e.id === 6) cap('Three products → three rows.');
    if (e.id === 8) cap('Not an order either. The sheet stays clean.');
    if (e.id === 9) cap('Nobody typed anything.');
  };
  await sleep(1200);
  await run(0.85);
  cap(`Done: ${orders()} orders, ${state.rows.length} rows, 0 typed by hand.`); await sleep(3200);
  openEmail(6);
  cap('Yellow = exactly what it read.'); await sleep(3600);
  closeEmail(); cap('');
  await card('<p class="k">0 orders typed by hand.<br>About 42 minutes saved today.</p><p class="s">Built for a real 12-person company. Shown here with sample data.</p>', 4200);
  await card('<p class="logo big">ΛD</p><p class="k">AI-Driven</p><p class="s">Automations for small businesses · Göteborg<br>calendly.com/anas-aidriven/15min</p>', 4000);
  document.title = 'FILM DONE';
}
if (FILM) film();
