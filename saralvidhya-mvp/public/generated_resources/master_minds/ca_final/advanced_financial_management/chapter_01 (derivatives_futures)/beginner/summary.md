# Derivatives - Futures

---

## 1. Core Concepts & Definitions
*   **Derivative:** A financial contract that derives its value from an underlying asset (e.g., stocks, indices, currencies, commodities).
*   **Underlying Asset:** The reference asset on which a derivative is written. If the underlying asset's price moves, the derivative's value moves dynamically.
*   **Zero-Sum Game:** A market condition where the financial gain of one participant is exactly equal to the financial loss of their counterparty (Gains + Losses = 0). Futures are zero-sum games.
*   **Contango:** A market state where the futures price is trading higher than the spot price ($F > S$).
*   **Backwardation:** A market state where the futures price is trading lower than the spot price ($F < S$).

---

## 2. Core Differences at a Glance

### Forwards vs. Futures
*   **Forwards:** Private contracts, Over-the-Counter (OTC), customized specifications, high counterparty risk, settled only on the maturity date.
*   **Futures:** Standardized contracts, traded on public exchanges (like NSE/BSE), zero counterparty risk (guaranteed by clearing house), margins required, marked-to-market daily.

### Spot Market vs. Futures Market
*   **Spot:** Buy 1 or more shares; results in ownership of the underlying; pays dividends; requires paying 100% of the share value upfront.
*   **Futures:** Buy/sell in standardized lots; no direct ownership or voting rights; no dividend rights; requires only a small margin deposit (leverage).

### Stock Futures vs. Index Futures
*   **Stock Futures:** Single stock underlying; higher volatility; margins vary by stock; physically settled (in India) or cash-settled.
*   **Index Futures:** Basket of stocks underlying; lower volatility (diversified); uniform margins; always cash-settled.

---

## 3. Formula Cheat Sheet

### 3.1 Individual Stock Futures (Simple Interest)
$$\text{No Dividends: } F = S \times \left(1 + \frac{r \times T}{1200}\right)$$
$$\text{With Dividend } D \text{ (on or before expiry): } F = S \times \left(1 + \frac{r \times T}{1200}\right) - D$$

### 3.2 Index Futures (Simple Interest)
$$\text{With Annualized Dividend Yield } d\%: F = S \times \left(1 + \frac{(r - d) \times T}{1200}\right)$$

### 3.3 Continuous Compounding Model
$$\text{No Dividends: } F = S \times e^{r \times t}$$
$$\text{With Annualized Dividend Yield } d\%: F = S \times e^{(r - d) \times t}$$
$$\text{With Discrete Dividend } D \text{ (at time } t_d\text{): } F = (S - D \times e^{-r \times t_d}) \times e^{r \times t}$$

*   **Variable Legend:**
    *   $F$ = Theoretical Futures Price
    *   $S$ = Spot price of the underlying
    *   $r$ = Risk-free rate of interest per annum (%)
    *   $T$ = Time to expiry in months
    *   $t$ = Time to expiry in years ($T / 12$)
    *   $D$ = Dividend amount (in ₹) paid before contract expiry
    *   $d$ = Annual dividend yield of the index (%)

---

## 4. Margin Mechanics & Workflow

### 4.1 Margin Account Rules
1.  **Initial Margin (IM):** The starting deposit to open a trade.
2.  **Maintenance Margin (MM):** The minimum threshold the account balance can reach without triggering a call (usually 70% to 80% of IM).
3.  **Variation Margin (VM):** The cash needed to top up the account **back to the Initial Margin level** if the balance falls below the Maintenance Margin limit.

### 4.2 Mark-to-Market (MTM) Daily Settlement Flow

```
Daily Closing Price is Published by the Exchange
                   │
                   ▼
         Calculate MTM Gain/Loss:
  Long:  (Current Close - Previous Close) x Lot Size
  Short: (Previous Close - Current Close) x Lot Size
                   │
                   ▼
  Adjust Margin Account Balance (Credit Gain / Debit Loss)
                   │
                   ▼
      Is Margin Balance < Maintenance Margin?
         /                           \
       YES                            NO
       /                               \
Trigger Margin Call             Position continues
Deposit Variation Margin        normally.
to restore balance to IM level
```
---

## 5. Revision Checklist
- [ ] Understand why derivatives have no intrinsic value of their own.
- [ ] List the three types of players: Hedgers (risk-reducers), Speculators (risk-takers), Arbitrageurs (mispricing-exploiters).
- [ ] Contrast how cash settlements work versus physical delivery of futures contracts.
- [ ] Differentiate Contango and Backwardation.
- [ ] Memorize the Cost of Carry pricing formula with and without dividends.
- [ ] Perform a basic daily MTM statement calculation showing when a margin call is triggered.
