// Turns one order email into spreadsheet rows. Pure function: same email in, same rows out.
// shortcut: rule-based for the demo's sample emails (English + Swedish); the client version uses an LLM for free-form text.
const ITEM = /^\s*(\d+)\s*(?:x|st|pcs)\s+(.+?)\s*$/i;
const DATE = /^\s*(?:deliver by|leverans senast|delivery)\s*:\s*(\d{4}-\d{2}-\d{2})/im;
const REF = /^\s*(?:our ref|ref|vår referens|referens)\s*:\s*([A-Z0-9-]+)/im;

export function extract(email) {
  const items = email.body.split('\n').map(l => l.match(ITEM)).filter(Boolean)
    .map(m => ({ qty: Number(m[1]), product: m[2] }));
  if (!items.length) return { isOrder: false, rows: [] };
  const deliverBy = (email.body.match(DATE) || [])[1] || '';
  const ref = (email.body.match(REF) || [])[1] || '';
  return {
    isOrder: true,
    rows: items.map(i => ({ received: email.time, customer: email.from_name, email: email.from_addr,
      product: i.product, qty: i.qty, deliverBy, ref })),
  };
}
