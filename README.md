# ValueSite

**Free Interactive IB Valuation Dashboard**

> Build the valuation. Defend the assumptions.

ValueSite is a self-service valuation workspace for learning and fast analysis. Enter a small set of financial data, choose one or more valuation methods, and stress-test the key assumptions in real time. The dashboard deliberately presents ranges rather than a single “correct” answer.

## What is included

- Quick and Advanced valuation modes
- Editable historical and forecast financial table (`A` = Actual, `E` = Estimate)
- DCF engine with Gordon Growth and Exit Multiple terminal value methods
- Interactive WACC, terminal growth, exit multiple, and target multiple controls
- Advanced WACC build-up: risk-free rate, beta, ERP, cost of debt, tax rate, and capital structure
- EV / EBITDA, P / E, P / B, and EV / Revenue valuation
- Editable Trading Comps with automatic quartiles, median, mean, and maximum/minimum
- Rule-based “Why this multiple?” explanation
- EV-to-Equity bridge and implied share price
- Live Football Field chart for selected methods
- Industry-based commonly used method suggestions
- Sanity checks for invalid or economically weak assumptions
- Demo Manufacturing Co. dataset
- LocalStorage persistence
- Responsive desktop and mobile layouts

## MVP flow

```mermaid
flowchart LR
    A[Financial Input] --> B[Method Selection]
    B --> C[Interactive Assumptions]
    C --> D[Live Valuation]
    D --> E[EV Bridge]
    E --> F[Summary & Football Field]
```

## Tech stack

- Next.js App Router
- TypeScript (strict mode)
- Zustand with persistence middleware
- CSS design system optimized for financial tables and dashboards
- Vitest for valuation engine tests
- Vercel-compatible server routes

The calculation engine is separate from UI code under `lib/valuation/`:

```text
lib/valuation/
├── assumptions.ts
├── dcf.ts
├── evBridge.ts
├── footballField.ts
├── multiples.ts
├── sanityCheck.ts
├── tradingComps.ts
└── wacc.ts
```

## Local setup

```bash
git clone <repository-url>
cd ValueSite
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Quality checks:

```bash
npm run lint
npm test
npm run build
```

## Environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

```env
OPEN_DART_API_KEY=
```

The API key is optional. Without it, ValueSite runs normally in manual-input mode. Never commit `.env.local` or an actual API key.

## OpenDART integration design

ValueSite includes a browser-safe `DartDataSource` interface in `lib/dart/client.ts` and a server-only configuration status route. This keeps the future API key out of browser code.

Planned production data flow:

1. Search company name or stock code.
2. Match it to OpenDART `corp_code` on the server.
3. Request the latest three annual financial statements.
4. Normalize Revenue, Operating Profit, Net Income, Assets, Liabilities, and Equity.
5. Populate historical periods while preserving manual forecast inputs.

The current MVP intentionally leaves external financial data as an opt-in integration. It never presents estimated or demo values as actual company data.

## Valuation methods

| Method | Common use | Important limitation |
|---|---|---|
| DCF | Businesses with reasonably forecastable cash flow | Sensitive to WACC and terminal assumptions |
| EV / EBITDA | Manufacturing, industrials, telecom, capital-intensive sectors | Can obscure recurring capex and working capital needs |
| P / E | Profitable listed companies | Not meaningful for loss-making companies |
| P / B | Banks, insurers, balance-sheet-driven financial companies | Less useful for intangible-heavy companies |
| EV / Revenue | High-growth businesses before positive earnings | Ignores margin and profitability differences |
| Trading Comps | Companies with a credible public peer set | Peer selection and market conditions materially affect results |

Industry recommendations are shown as **commonly used methods**, not as absolute prescriptions. Users can select any combination.

## Default and estimated assumptions

Quick Mode applies clearly labelled defaults for tax, D&A, CAPEX, change in NWC, WACC, and terminal growth. Advanced Mode lets the user override each driver. Values calculated from a default are identified as `Default assumption` or `Estimated` in the interface.

Default cash flow structure:

```text
NOPAT = EBIT × (1 − Tax Rate)
UFCF = NOPAT + D&A − CAPEX − Change in NWC
```

## Important notice

ValueSite is provided solely for educational and analytical purposes. It is not investment advice, a fairness opinion, or a substitute for professional due diligence. Outputs depend on user inputs and assumptions and may differ materially from actual market value.
