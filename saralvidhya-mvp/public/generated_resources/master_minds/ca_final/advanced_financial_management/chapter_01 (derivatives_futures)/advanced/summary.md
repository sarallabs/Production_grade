# Derivatives - Futures

## 1. Mathematical Formulas Quick Reference

### 1.1 Equity Stock Futures Pricing

| Compounding Method | Without Dividend | With Discrete Dividend ($D$ at time $t_d$) |
| :--- | :--- | :--- |
| **Simple Compounding** | $F_0 = S_0 \times \left(1 + r \times \frac{t}{12}\right)$ | $F_0 = (S_0 - \text{PV}(D)) \times \left(1 + r \times \frac{t}{12}\right)$<br>$\text{where } \text{PV}(D) = $\frac{D}{1 + r \times \frac{t_d}{12}}$ |
| **Continuous Compounding** | $F_0 = S_0 \times e^{r \times T}$ | $F_0 = (S_0 - \text{PV}(D)) \times e^{r \times T}$<br>$\text{where } \text{PV}(D) = D \times e^{-r \times t_d}$ |

---

### 1.2 Stock Index Futures Pricing

| Compounding Method | Formula | Key Inputs |
| :--- | :--- | :--- |
| **Simple Compounding** | $F_0 = S_0 \times \left(1 + (r - d) \times \frac{t}{12}\right)$ | $d$ = Annual dividend yield (average) |
| **Continuous Compounding** | $F_0 = S_0 \times e^{(r - d) \times T}$ | $T = \text{Time to expiry in years}$ |

---

### 1.3 Margin Mathematics
*   **Initial Margin % (VaR-based):**
    $$\text{Initial Margin \%} = \text{Daily Return Mean } (\mu) + 3 \times \text{Daily Return Volatility } (\sigma)$$
*   **Maintenance Margin:**
    $$\text{Maintenance Margin} = \theta \times \text{Initial Margin} \quad (\text{usually } \theta = 0.70 \text{ to } 0.80)$$
*   **Variation Margin (Triggered only if account balance falls below Maintenance Margin):**
    $$\text{Variation Margin} = \text{Initial Margin Balance} - \text{Current Account Balance}$$

---

### 1.4 Beta Management (Portfolio Hedging)
*   **Number of Index Futures Contracts ($N$):**
    $$N = \frac{\beta_{\text{target}} - \beta_{\text{portfolio}}}{\beta_{\text{futures}}} \times \frac{\text{Value of Portfolio } (V_p)}{\text{Futures Price } (F) \times \text{Lot Size } (M)}$$
*   *Note:* $\beta_{\text{futures}} = 1.00$. A negative result indicates a short position (selling contracts), while a positive result indicates a long position (buying contracts).

---

## 2. Key Comparison Tables

### 2.1 Index Futures vs. Stock Futures

| Feature | Index Futures | Stock Futures |
| :--- | :--- | :--- |
| **Systematic Risk** | Hedges systematic risk of a diversified portfolio | Hedges unsystematic (business-specific) risk of a stock |
| **Volatility** | Less volatile due to diversification of the basket | Highly volatile; subject to company-specific news |
| **Settlement** | Compulsory cash settlement | Physical delivery of shares (in India) or cash-settled |
| **Leverage** | Generally higher leverage (lower margin % required) | Lower leverage (higher margin % due to unsystematic risk) |
| **Dividend Modeling** | Modeled continuously as a dividend yield ($d$) | Modeled as discrete cash dividends ($D$) |
| **Margin Standards** | Identical margin percentages for long and short | Margin percentages vary based on individual stock volatility |
| **Market Manipulation** | Highly resistant to manipulation | Susceptible to cornering/manipulation in low-liquidity scripts |

---

## 3. Arbitrage Decision Matrix & Execution Algorithms

```
                          Compare F_mkt with F_theoretical
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
       F_mkt > F_theoretical                         F_mkt < F_theoretical
       (Futures Overvalued)                          (Futures Undervalued)
                 │                                             │
                 ▼                                             ▼
      [Cash & Carry Arbitrage]                     [Reverse Cash & Carry]
  - Buy Spot Stock (borrow at r_borrow)         - Short Spot Stock (SLB desk)
  - Sell Futures at F_mkt                       - Buy Futures at F_mkt
  - Deliver stock at expiry                     - Collect interest on short proceeds
  - Pay off loan & collect profit               - Settle futures & return stock
```

### 3.1 Cash & Carry Arbitrage Algorithm
1.  **Check Condition:** Is $F_{\text{mkt}} > F_{\text{theoretical}} + \text{Transaction Costs}$? If yes, proceed.
2.  **Borrow Funds:** Borrow spot purchase amount $S_0$ + initial transaction costs at $r_{\text{borrow}}$.
3.  **Buy Spot:** Buy the physical asset in the spot market.
4.  **Sell Futures:** Sell (Go Short) the futures contract at $F_{\text{mkt}}$.
5.  **Collect Dividend:** Reinvest any dividends received during the holding period at the deposit rate $r_{\text{deposit}}$.
6.  **Settle at Expiry ($t = T$):** Deliver the spot asset against the short futures contract to receive $F_{\text{mkt}}$. Repay the borrowed funds with accumulated interest.
7.  **Calculate Profit:** Net Profit = $F_{\text{mkt}} + \text{Reinvested Dividends} - S_0(1+r_{\text{borrow}}T) - \text{Total Transaction Costs & Margin financing costs}$.

### 3.2 Reverse Cash & Carry Arbitrage Algorithm
1.  **Check Condition:** Is $F_{\text{mkt}} < F_{\text{theoretical}} - \text{Transaction and SLB Costs}$? If yes, proceed.
2.  **Borrow Stock:** Borrow the asset from the Securities Lending & Borrowing (SLB) desk by paying the upfront borrowing fee.
3.  **Short Spot:** Sell the borrowed stock at $S_0$ in the spot market.
4.  **Invest Proceeds:** Invest the sale proceeds at the risk-free rate $r_{\text{deposit}}$.
5.  **Buy Futures:** Buy (Go Long) the futures contract at $F_{\text{mkt}}$.
6.  **Pay Dividend:** Pay any dividend to the stock lender (borrow funds to pay this if necessary).
7.  **Settle at Expiry ($t = T$):** Receive the cash from the matured investment. Buy the stock via the long futures contract at the locked-in price $F_{\text{mkt}}$ and return it to the stock lender.
8.  **Calculate Profit:** Net Profit = $\text{Matured Investment Proceeds} - F_{\text{mkt}} - \text{Stock Borrowing Fee with Interest} - \text{Reinvested Dividend Pass-throughs} - \text{Other Transaction Costs}$.

---

## 4. LDR (Last Day Revision) Core Pointers

*   **Dividend Timeline Rule:** A dividend is relevant for futures pricing **only** if the ex-dividend date falls **on or before the futures expiry date**. If the dividend is paid after expiry, ignore it.
*   **Simple vs. Continuous Compounding:** Use continuous compounding ($e^{rT}$) **only** if terms like "continuously compounded" are explicitly mentioned, or if $e^x$ values are provided in the question. Otherwise, default to simple interest.
*   **SLB Fee Treatment:** In Reverse Cash & Carry, the stock borrowing fee is paid upfront. Its opportunity cost (interest) must be compounded to expiry and added to the total cost.
*   **Index Composition Changes:** For index futures, do not track individual dividends. Always use the average annual dividend yield ($d$) provided.
*   **Zero-Sum Game:** Remember that futures contracts are a zero-sum game. The dollar gain of the long position exactly equals the dollar loss of the short position (and vice versa) at the end of each daily mark-to-market cycle.
*   **Margin Top-up Target:** When a margin call is triggered because the balance has dropped below the maintenance margin, the investor must deposit enough variation margin to bring the balance back to the **Initial Margin** level, not just the maintenance margin level.
