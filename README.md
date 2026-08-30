<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/eecc020f-00b9-4462-80cc-f0b3a1babf1f

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Pattaya Rent a Car operations API

The authenticated PRAC dashboard uses a read-only server-side API. It never exposes the PRAC Firebase service account to the browser.

- `GET /api/prac/fleet` is available to authorised PRAC staff, managers, accounts, and administrators.
- `GET /api/prac/finance/monthly?month=YYYY-MM` and `GET /api/prac/payroll/summary?month=YYYY-MM` are limited to accounts and administrators.
- `GET /api/prac/capabilities` describes the available read-only API surface for a future MCP adapter.

The service tries the default collection names shown in `.env.example`. Set the optional GitHub secrets `PRAC_FLEET_COLLECTIONS`, `PRAC_FINANCE_COLLECTIONS`, and `PRAC_PAYROLL_COLLECTIONS` if the PRAC Firebase project uses different names. Each value is a comma-separated collection list.
