# Derivatives - Options

## 1. Options vs. Futures Cheat Sheet

* **Obligation:** Futures = Both parties obligated. Options = Buyer has right, Seller has obligation.
* **Payoff:** Futures = Symmetrical (Linear P/L). Options = Asymmetrical (Non-linear P/L).
* **Upfront Cost:** Futures = No premium (only margins). Options = Buyer pays upfront non-refundable **Premium**.
* **Risk/Reward Profile:**
  * **Option Buyer:** Loss limited to Premium paid. Profit potential is unlimited (Call) or substantial (Put).
  * **Option Seller:** Profit limited to Premium received. Loss potential is unlimited (Call) or substantial (Put).

---

## 2. Option Types and Payoff Formulas

Let:
* $S_T$ = Spot Price of the underlying asset at expiration
* $X$ = Strike Price / Exercise Price
* $P$ = Option Premium paid/received

| Position | Right / Obligation | Expiry Payoff Formula | Net Profit/Loss Formula | Breakeven Price |
| :--- | :--- | :--- | :--- | :--- |
| **Long Call** (Buy Call) | Right to BUY | $\max(0, S_T - X)$ | $\max(0, S_T - X) - P$ | $X + P$ |
| **Short Call** (Write Call)| Obligation to SELL | $-\max(0, S_T - X)$ | $P - \max(0, S_T - X)$ | $X + P$ |
| **Long Put** (Buy Put) | Right to SELL | $\max(0, X - S_T)$ | $\max(0, X - S_T) - P$ | $X - P$ |
| **Short Put** (Write Put) | Obligation to BUY | $-\max(0, X - S_T)$ | $P - \max(0, X - S_T)$ | $X - P$ |

---

## 3. Option Moneyness Matrix

Moneyness compares the Spot Price ($S_T$) with the Strike Price ($X$):

| Type | In-the-Money (ITM) | At-the-Money (ATM) | Out-of-the-Money (OTM) |
| :--- | :--- | :--- | :--- |
| **Call Option** | $S_T > X$ | $S_T = X$ | $S_T < X$ |
| **Put Option** | $S_T < X$ | $S_T = X$ | $S_T > X$ |

* **Intrinsic Value (IV):** The value of the option if exercised immediately.
  * $\text{Call IV} = \max(0, S_T - X)$
  * $\text{Put IV} = \max(0, X - S_T)$
  * *Note:* ATM and OTM options always have **zero** Intrinsic Value.
* **Time Value (TV):** The extra premium paid for the time remaining until expiry.
  * $\text{Time Value} = \text{Option Premium} - \text{Intrinsic Value}$
  * At expiration, Time Value decays to **zero**.

---

## 4. Option Pricing Variables (Impact Summary)

What happens to the option premium when these variables increase?

| Variable | Call Premium | Put Premium |
| :--- | :---: | :---: |
| **Stock Price ($S$) $\uparrow$** | **Increases** ($\uparrow$) | **Decreases** ($\downarrow$) |
| **Strike Price ($X$) $\uparrow$** | **Decreases** ($\downarrow$) | **Increases** ($\uparrow$) |
| **Time to Expiry ($T$) $\uparrow$**| **Increases** ($\uparrow$) | **Increases** ($\uparrow$) |
| **Volatility ($\sigma$) $\uparrow$** | **Increases** ($\uparrow$) | **Increases** ($\uparrow$) |
| **Interest Rate ($r$) $\uparrow$** | **Increases** ($\uparrow$) | **Decreases** ($\downarrow$) |

---

## 5. Option Greeks Cheat Sheet

* **Delta ($\Delta$):** Sensitivity of premium to a change in underlying price.
  * $\text{Call Delta} = 0 \text{ to } +1$ (Positive relationship)
  * $\text{Put Delta} = -1 \text{ to } 0$ (Negative relationship)
  * $\text{ATM Delta} \approx \pm 0.50$
* **Gamma ($\Gamma$):** Sensitivity of Delta to a change in underlying price. (Always positive for long options, highest at ATM).
* **Theta ($\theta$):** Sensitivity of premium to the passage of time (Time Decay). (Always negative for option buyers, accelerates near expiry).
* **Vega ($\nu$):** Sensitivity of premium to a 1% change in implied volatility. (Always positive for long options).
* **Rho ($\rho$):** Sensitivity of premium to a 1% change in risk-free interest rates. (Positive for Calls, negative for Puts).

---

## 6. Black-Scholes Model Key Points

* **Assumptions:**
  1. No dividends paid during option life.
  2. European-style options.
  3. Zero transaction costs/taxes.
  4. Constant and known risk-free rate ($r$) and volatility ($\sigma$).
  5. Stock returns are normally distributed (stock prices are lognormally distributed).
  6. Continuous trading, unrestricted short selling.
* **Core Limitation:** Real-world markets violate these assumptions (volatility is dynamic, interest rates change, stock prices can jump, dividends are paid).
