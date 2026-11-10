# Derivatives - Options

## 1. Options vs. Futures Comparison Cheat Sheet
*   **Futures:** Linear payoff, symmetric risk, zero initial cash flow, daily mark-to-market.
*   **Options:** Non-linear payoff, asymmetric risk, upfront premium paid (buyer) or received (writer), no daily mark-to-market for buyers.
*   **Covered vs. Naked Calls:** Writing a call while owning the underlying stock is **covered** (upside limited, downside partially hedged by stock). Writing a call without owning the stock is **naked** (unlimited upside risk).

---

## 2. Core Formula Cheat Sheet

### A. Binomial Model (BOPM) - Single Period
1.  **Risk-Neutral Probability of Up-move ($p$):**
    $$p = \frac{e^{r t} - d}{u - d}$$
    *(Where $u = \text{up-factor } S_u/S_0$, $d = \text{down-factor } S_d/S_0$, $r = \text{continuously compounded rate}$, $t = \text{period in years}$)*
2.  **Option Price today ($C_0$):**
    $$C_0 = e^{-r t} \cdot [p \cdot C_u + (1-p) \cdot C_d]$$
3.  **Option Delta ($\Delta$):**
    $$\Delta = \frac{C_u - C_d}{S_u - S_d}$$
4.  **Replicating Portfolio Borrowing ($B$):**
    $$B = \frac{\Delta \cdot S_d - C_d}{e^{r t}}$$
5.  **Option Value today via Replicating Portfolio:**
    $$C_0 = \Delta \cdot S_0 - B$$

### B. Black-Scholes-Merton (BSM) Model
1.  **Call Option Price ($C_0$):**
    $$C_0 = S_0 \cdot N(d_1) - X \cdot e^{-r T} \cdot N(d_2)$$
2.  **Put Option Price ($P_0$):**
    $$P_0 = X \cdot e^{-r T} \cdot N(-d_2) - S_0 \cdot N(-d_1)$$
3.  **Values of $d_1$ and $d_2$:**
    $$d_1 = \frac{\ln(S_0 / X) + \left(r + \frac{\sigma^2}{2}\right)T}{\sigma \sqrt{T}}, \quad d_2 = d_1 - \sigma \sqrt{T}$$
4.  **Dividend Adjustment ($S_0^*$):**
    $$S_0^* = S_0 - D \cdot e^{-r t_d}$$
    *(Where $D = \text{dividend amount}$, $t_d = \text{time to dividend in years}$)*

### C. Put-Call Parity
$$C_0 + X \cdot e^{-r T} = S_0 + P_0$$
*   **Conversion Arbitrage (when $C + X e^{-r T} > S + P$):** Short Call, Buy Put, Buy Stock, Lend Proceeds.
*   **Reversal Arbitrage (when $C + X e^{-r T} < S + P$):** Buy Call, Short Put, Short Stock, Lend Proceeds.

---

## 3. Option Greeks Summary Reference

```
┌───────┬─────────────────┬───────────┬───────────┬────────────────────────────────┐
│ Greek │ Measures        │ Call Sign │ Put Sign  │ Key Properties                 │
├───────┼─────────────────┼───────────┼───────────┼────────────────────────────────┤
│ Delta │ Price Sensitivity│ Positive  │ Negative  │ ATM Call ≈ 0.5, ATM Put ≈ -0.5 │
│ Gamma │ Δ Sensitivity   │ Positive  │ Positive  │ Peaks ATM; measures stability │
│ Theta │ Time Decay      │ Negative  │ Negative  │ Accelerates near expiration    │
│ Vega  │ Vol. Sensitivity│ Positive  │ Positive  │ Peaks ATM; higher for long-term│
│ Rho   │ Rate Sensitivity│ Positive  │ Negative  │ Minimal impact except for LEAPs│
└───────┴─────────────────┴───────────┴───────────┴────────────────────────────────┘
```

---

## 4. Critical Exam Checklist & Mistakes to Avoid

*   [ ] **Probability Check:** For probability-weighted questions (e.g., Problem 9), verify if the sum of probabilities equals exactly $1.00$. If not, normalize the probabilities or check for errors.
*   [ ] **American vs. European Exercise (Binomial Tree):** 
    *   For American-style options, check for early exercise at **every single node** during backward induction: $\max(\text{Intrinsic Value}, \text{Hold Value})$. 
    *   For European-style options, **never** exercise early; simply discount the terminal payoffs back to the present.
*   [ ] **Compounding Style:** Pay close attention to the interest rate type.
    *   If "continuously compounded" is mentioned, use $e^{rt}$ and $e^{-rt}$.
    *   If simple compounding is used, use $(1 + r \cdot t)$ or $(1+r)^t$.
*   [ ] **Dividend Timing:** Ensure that the dividend discount time ($t_d$) matches the dividend payment date, NOT the option expiration date ($T$). Only adjust the stock price if the ex-dividend date falls **within** the option’s life.
*   [ ] **Greeks Sign Conventions:** Remember that Option buyers are always **Long Gamma** and **Long Vega**, but **Short Theta**. Option sellers are **Short Gamma** and **Short Vega**, but **Long Theta** (they benefit from time decay).
*   [ ] **Normal Distribution Values ($N(d_1)$ / $N(d_2)$):** Pay attention to the sign. 
    *   If $d$ is positive, $N(d)$ is typically $> 0.5$.
    *   If $d$ is negative, $N(-d) = 1 - N(d)$.
    *   In exams, check if the table provides cumulative one-tail probabilities or cumulative distribution values ($N(x)$). If one-tail values from the mean are given, $N(x) = 0.5 + \text{one-tail value}$.
