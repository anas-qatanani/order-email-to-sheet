# Order email → spreadsheet

A live demo of an automation I built for a small company: order emails turn into spreadsheet rows by themselves. Nobody types orders in by hand.

**Try it:** https://anas-qatanani.github.io/order-email-to-sheet/

**Watch it (38 s):** [demo.mp4](https://anas-qatanani.github.io/order-email-to-sheet/demo.mp4)

All emails, names and companies here are made up. No client data.

## What it does
1. Reads each new email in the inbox.
2. Decides: is this an order? Newsletters, questions and lunch invites are skipped.
3. Pulls out customer, product, quantity, delivery date and order reference.
4. Writes one row per product to the sheet.

## How it maps to a real company
| Demo | Real setup |
|---|---|
| Sample inbox (`emails.js`) | Gmail or Outlook (API, read-only) |
| Rule-based reader (`extract.js`) | An AI model that reads free-form text, with these rules as a check |
| On-page sheet | Google Sheets, Excel or Fortnox |
| Runs on a button | Runs every few minutes, by itself |

The parts that change per company are the inbox, the fields and where the rows go. The steps stay the same.

## How it was built
A static page: the inbox, the reader and the sheet all run in your browser. The demo reader uses fixed rules so it runs free and offline. The version for a real firm reads emails with an AI model and connects to the real inbox and sheet. The source code is private; ask on a call if you want to see it.

Gmail and Google Sheets are trademarks of Google LLC. This page only looks like them to show where the automation works; it is not connected to Google.

---
Built by Anas Qatanani · [AI-Driven](https://www.linkedin.com/company/ai-driven-tech) · [Book a 15-min call](https://calendly.com/anas-aidriven/15min)
