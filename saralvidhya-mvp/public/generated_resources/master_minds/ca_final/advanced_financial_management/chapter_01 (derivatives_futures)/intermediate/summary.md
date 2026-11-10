# Derivatives - Futures

## 1. Core Concepts & Definitions
* **Derivative:** A financial instrument whose value is derived from an underlying asset (e.g., stocks, bonds, indices, currencies).
* **Underlying Asset:** An asset whose price determines the price of the linked derivative. Without the underlying, the derivative has no value.
* **Futures Contract:** A standardized, exchange-traded agreement to buy or sell an asset at a predetermined price on a specified future date.
* **Forward Contract:** A customized, Over-the-Counter (OTC) agreement to buy or sell an asset at a predetermined price on a future date.

---

## 2. Key Differences

### 2.1 Cash vs. Derivatives Market
* **Cash Market:** Requires 100% capital outlay; results in immediate transfer of ownership and dividend rights; shares can be held indefinitely.
* **Derivatives Market:** Requires fractional margin deposit (10-20%); no ownership or dividend rights; contracts must be settled by expiration.

### 2.2 Forwards vs. Futures
* **Forwards:** Custom-tailored, traded OTC, high counterparty risk, settled only at maturity, illiquid.
* **Futures:** Standardized contracts, traded on exchange, clearing corporation guarantees trades (no default risk), daily Mark-to-Market (MTM) settlement, highly liquid.

---

## 3. Margin Terms and MTM
* **Marking to Market (MTM):** The daily settlement process where open positions are revalued against the closing market futures price. Gains are credited and losses are debited.
* **Initial Margin (IM):** Upfront deposit required to open a position. Based on Value-at-Risk (VaR), designed to cover a single day's maximum potential loss (usually $\mu + 3\sigma$).
* **Maintenance Margin (MM):** The minimum balance required to keep a position open (typically 70%-80% of IM).
* **Variation Margin:** The cash deposit required to restore the margin account to the **Initial Margin** level when the balance falls below the Maintenance Margin.

---

## 4. Futures Pricing Cheat Sheet

| Situation | Simple Interest Model | Continuous Compounding Model |
| :--- | :--- | :--- |
| **No Dividend** | $F_0 = S_0 \times \left(1 + r \times \frac{T}{12}\right)$ | $F_0 = S_0 \times e^{r \times T}$ |
| **Discrete Dividend ($D$ at time $t_d$)** | $F_0 = S_0 \times \left(1 + r \times \frac{T}{12}\right) - D \times \left(1 + r \times \frac{T - t_d}{12}\right)$ | $F_0 = (S_0 - D \times e^{-r \times t_d}) \times e^{r \times T}$ |
| **Dividend Yield ($d$)** | $F_0 = S_0 \times \left(1 + (r - d) \times \frac{T}{12}\right)$ | $F_0 = S_0 \times e^{(r - d) \times T}$ |

*Note: In the continuous compounding formulas, $T$ and $t_d$ are expressed in years (e.g., 3 months = 0.25 years).*

---

## 5. Arbitrage Decision Rules
Let $F_{\text{mkt}}$ be the actual market price and $F_0$ be the calculated theoretical futures price:

### 5.1 Cash and Carry Arbitrage
* **Condition:** $F_{\text{mkt}} > F_0$ (Futures is overpriced)
* **Strategy:**
  1. **At $T = 0$:** Borrow funds at risk-free rate $r$, buy the underlying stock at spot price $S_0$, and short (sell) the futures contract at $F_{\text{mkt}}$.
  2. **During Tenure:** Collect dividends ($D$) and invest them.
  3. **At Expiry:** Deliver the stock, receive $F_{\text{mkt}}$, collect matured dividend investments, and repay the loan.
  * **Risk-free Profit:** $(F_{\text{mkt}} + \text{FV of Dividends}) - \text{Loan Repayment Amount}$.

### 5.2 Reverse Cash and Carry Arbitrage
* **Condition:** $F_{\text{mkt}} < F_0$ (Futures is underpriced)
* **Strategy:**
  1. **At $T = 0$:** Short-sell the underlying stock at spot price $S_0$, invest the proceeds at risk-free rate $r$, and buy (long) the futures contract at $F_{\text{mkt}}$.
  2. **During Tenure:** Pay dividends to the stock lender.
  3. **At Expiry:** Collect matured investment, pay dividends, and purchase stock via the futures contract at $F_{\text{mkt}}$ to return to the lender.
  * **Risk-free Profit:** $(\text{Matured Investment} - \text{Dividends Paid}) - F_{\text{mkt}}$.

---

## 6. Key Market States
* **Contango:** Futures Price > Spot Price ($F_0 > S_0$). Occurs when the cost of carry is positive.
* **Backwardation:** Futures Price < Spot Price ($F_0 < S_0$). Occurs when the convenience yield or dividend payout exceeds interest cost.

---

## 7. Relationship with Interest Rates
* **Constant Interest Rates:** Futures Price = Forward Price.
* **Uncertain Interest Rates:**
  * Positive correlation between futures price and interest rates: Futures Price > Forward Price.
  * Negative correlation between futures price and interest rates: Futures Price < Forward Price.
  * Uncorrelated: Futures Price = Forward Price.
