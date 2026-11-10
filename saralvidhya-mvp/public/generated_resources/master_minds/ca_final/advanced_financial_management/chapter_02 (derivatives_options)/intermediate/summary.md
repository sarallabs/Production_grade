# Derivatives - Options

### 1. Options vs. Futures Core Distinctions
* **Rights vs. Obligations:** Option buyer has a right, no obligation. Option seller (writer) has an obligation. Futures counterparties both have obligations.
* **Payoff Structure:** Options have asymmetrical payoffs (capped downside risk for buyer). Futures have symmetrical linear payoffs.
* **Premium:** Option buyers pay upfront premiums. Futures require no premium, only margins.

---

### 2. Primary Option Formulas

#### Intrinsic & Time Value
* **Intrinsic Value (Call):** $\text{IV}_c = \max(0, S_t - X)$
* **Intrinsic Value (Put):** $\text{IV}_p = \max(0, X - S_t)$
* **Time Value:** $\text{TV} = \text{Premium} - \text{Intrinsic Value}$

#### Put-Call Parity (PCP)
* **Discrete / Simple Interest:**
  $$C_0 + \frac{X}{1 + r \cdot t} = P_0 + S_0$$
* **Continuous Compounding:**
  $$C_0 + X \cdot e^{-rt} = P_0 + S_0$$

#### Discrete Binomial Pricing (1-Period)
* **Hedge Ratio / Delta ($\Delta$):**
  $$\Delta = \frac{C_u - C_d}{S_u - S_d}$$
* **Hedge Portfolio Setup:** Buy $\Delta$ shares, Sell $1$ option.
* **Risk-Neutral Probability ($p$):**
  * Simple compounding: $p = \frac{(1+r) - d}{u - d}$ where $u = S_u/S_0$, $d = S_d/S_0$.
  * Continuous compounding: $p = \frac{e^{rt} - d}{u - d}$
* **Option Valuation:**
  $$C_0 = e^{-rt} [p \cdot C_u + (1-p) \cdot C_d]$$

#### Black-Scholes-Merton (BSM) Model
* **Call Price ($C_0$):** $S_0 \cdot N(d_1) - X \cdot e^{-rt} \cdot N(d_2)$
* **Put Price ($P_0$):** $X \cdot e^{-rt} \cdot N(-d_2) - S_0 \cdot N(-d_1)$
* **Where:**
  $$d_1 = \frac{\ln(S_0 / X) + \left(r + \frac{\sigma^2}{2}\right) \cdot t}{\sigma \cdot \sqrt{t}}$$
  $$d_2 = d_1 - \sigma \cdot \sqrt{t}$$
* **Dividend Adjustment:**
  $$S_0^* = S_0 - D \cdot e^{-r \cdot t_d} \quad \text{(Substitute } S_0^* \text{ for } S_0 \text{ in BSM formulas)}$$

---

### 3. Option Greeks Quick Reference

| Greek | Represents | Formula Representation | Call Option Sign | Put Option Sign | Peak Sensitivity |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Delta ($\Delta$)** | Sensitivity to stock price | $\frac{\partial V}{\partial S}$ | $+$ ($0$ to $+1$) | $-$ ($-1$ to $0$) | Deep ITM $\approx \pm 1$; ATM $\approx \pm 0.5$ |
| **Gamma ($\Gamma$)** | Sensitivity of Delta to stock price | $\frac{\partial^2 V}{\partial S^2}$ | $+$ | $+$ | At-the-Money (ATM) |
| **Theta ($\theta$)** | Sensitivity to time decay | $\frac{\partial V}{\partial t}$ | $-$ | $-$ | At-the-Money (ATM) close to expiry |
| **Vega ($\nu$)** | Sensitivity to implied volatility | $\frac{\partial V}{\partial \sigma}$ | $+$ | $+$ | At-the-Money (ATM) |
| **Rho ($\rho$)** | Sensitivity to interest rate | $\frac{\partial V}{\partial r}$ | $+$ | $-$ | Deep ITM; long-dated options |

---

### 4. Basic Option Strategies

#### Long Straddle
* **Setup:** Buy $1$ ATM Call + Buy $1$ ATM Put (same strike $X$, same expiry).
* **View:** High volatility expected (direction neutral).
* **Net Debit:** $C_0 + P_0$
* **Max Loss:** limited to premium paid ($C_0 + P_0$) when $S_t = X$.
* **Max Profit:** Unlimited (on upside), substantial (on downside).
* **Breakeven Points:** Upper $X + (C_0 + P_0)$ and Lower $X - (C_0 + P_0)$.

#### Covered Call
* **Setup:** Long Stock + Short Call (typically OTM).
* **View:** Neutral to mildly bullish. Yield-enhancing.
* **Max Profit:** $(X - S_0) + C_0$ (limited upside).
* **Max Loss:** $S_0 - C_0$ (downside protection is limited to premium received).

---

### 5. Critical Exam Notes & Trap Alerts
* **Compounding Mode:** Check if interest rate is continuous or simple. If the question gives $e^{rt}$ or continuous rates, use $e^{-rt}$ discounting. Otherwise, use standard simple/discrete discounting.
* **Dividend Treatment:** Check if the dividend falls within the option's life. If so, discount the dividend back to today and subtract it from the stock price *before* applying the BSM or Binomial model.
* **Sum of Probabilities:** In expectation problems (e.g. Satya Ltd style), verify if the probabilities sum to exactly 1. If they don't, scale them or check for exam printing errors.
* **Payoff Valuation:** When evaluating a seller's payoff, first calculate the buyer's payoff and then multiply by $-1$.
