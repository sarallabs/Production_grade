# Derivatives - Options

### Learning objectives

- Define options versus futures (rights vs obligations) and explain premium, strike, and expiry.
- Interpret call and put payoffs, moneyness, intrinsic value, and time value.
- Name the primary Greeks and state what each measures at introductory level.
- List the main Black–Scholes assumptions and relate them to typical examination critiques.

---

## 1. Core Vocabulary and Definitions

An **Option** is a derivative contract that gives the buyer the **right, but not the obligation**, to buy or sell a specified quantity of an underlying asset at a pre-determined price (Strike Price) on or before a specified date (Expiry Date). The seller of the option is called the **writer** and has a binding **obligation** to perform if the buyer exercises their right.

### Key Components:
* **Underlying Asset ($S$):** The asset (e.g., share, index, currency) from which the option derives its value.
* **Strike Price / Exercise Price ($X$):** The fixed price at which the underlying asset is bought or sold if the option is exercised.
* **Expiration Date ($T$):** The final date on which the option can be exercised.
* **Option Premium ($p$ or $c$):** The price paid by the buyer to the seller to purchase the option contract. This fee is non-refundable.
* **Option Buyer (Holder / Long Position):** The party who pays the premium and holds the right to exercise. Their risk is limited to the premium paid.
* **Option Seller (Writer / Short Position):** The party who receives the premium and assumes the obligation. Their risk is theoretically unlimited (for calls) or highly significant (for puts).

---

## 2. Option Types: Call vs. Put

Option contracts are divided into two main categories:

### A. Call Option (Right to Buy)
* **Long Call (Buyer):** Buys the right to purchase the underlying asset at the strike price ($X$).
  * *Market View:* Bullish (expects price to rise).
  * *Max Loss:* Limited to the premium paid.
  * *Max Profit:* Unlimited as the stock price rises.
* **Short Call (Seller/Writer):** Assumes the obligation to sell the underlying asset if the buyer exercises.
  * *Market View:* Bearish or Neutral (expects price to fall or stay flat).
  * *Max Loss:* Unlimited (since stock price can rise infinitely).
  * *Max Profit:* Limited to the premium received.

### B. Put Option (Right to Sell)
* **Long Put (Buyer):** Buys the right to sell the underlying asset at the strike price ($X$).
  * *Market View:* Bearish (expects price to fall).
  * *Max Loss:* Limited to the premium paid.
  * *Max Profit:* Substantial (limited only by the stock price falling to zero).
* **Short Put (Seller/Writer):** Assumes the obligation to buy the underlying asset if the buyer exercises.
  * *Market View:* Bullish or Neutral (expects price to rise or stay flat).
  * *Max Loss:* Substantial (Strike price minus premium, if stock falls to zero).
  * *Max Profit:* Limited to the premium received.

---

## 3. American vs. European Exercise Styles

Options are also classified by when they can be exercised:

| Feature | American Option | European Option |
| :--- | :--- | :--- |
| **Exercise Time** | Can be exercised at **any time** on or before the expiration date. | Can be exercised **only on the expiration date**. |
| **Flexibility** | Higher (more valuable due to early exercise capability). | Lower (valued strictly based on maturity payoff). |
| **Indian Markets** | Not used for index/stock options in India. | All stock and index options in India are European-style. |

---

## 4. Moneyness of Options

Moneyness refers to the profitability of immediate exercise based on the current Spot Price ($S_T$) relative to the Strike Price ($X$).

### 1. In-the-Money (ITM)
Exercising the option immediately results in a positive payoff.
* **Call Option:** $S_T > X$ (Stock price is higher than strike price).
* **Put Option:** $S_T < X$ (Stock price is lower than strike price).

### 2. At-the-Money (ATM)
Exercising the option yields zero payoff (excluding premium).
* **Call and Put Options:** $S_T = X$ (Stock price equals strike price).

### 3. Out-of-the-Money (OTM)
Exercising the option yields a negative payoff. It is irrational to exercise; the option will be left to lapse.
* **Call Option:** $S_T < X$ (Stock price is lower than strike price).
* **Put Option:** $S_T > X$ (Stock price is higher than strike price).

---

## 5. Intrinsic Value vs. Time Value

An option's premium consists of two components:
$$\text{Option Premium} = \text{Intrinsic Value} + \text{Time Value}$$

### A. Intrinsic Value
The absolute value of the cash flow generated if the option were exercised immediately. It represents the "real" value and can never be negative.
* **Call Intrinsic Value** = $\max(0, S - X)$
* **Put Intrinsic Value** = $\max(0, X - S)$
* *Note:* ATM and OTM options always have an intrinsic value of **zero**.

### B. Time Value (Extrinsic Value)
The premium paid by the buyer over and above the intrinsic value. It reflects the probability that the option's value will increase before expiration due to stock volatility.
$$\text{Time Value} = \text{Option Premium} - \text{Intrinsic Value}$$
* **Time Decay:** As the option approaches its expiration date ($T$), the probability of a favorable price move decreases. Consequently, the time value decays, reaching exactly **zero** at expiration.

---

## 6. Detailed Option Payoffs and Breakeven Points

### A. Long Call (Buy Call)
* **Payoff Formula:** $\max(0, S_T - X)$
* **Net Profit/Loss Formula:** $\max(0, S_T - X) - \text{Premium}$
* **Breakeven Price:** $X + \text{Premium}$
* **Payoff Profile:**
  * If $S_T \le X$, the option lapses. Loss is capped at the premium.
  * If $S_T > X$, the option is exercised. Net profit rises linearly above the breakeven point.

### B. Short Call (Write/Sell Call)
* **Payoff Formula:** $-\max(0, S_T - X)$
* **Net Profit/Loss Formula:** $\text{Premium} - \max(0, S_T - X)$
* **Breakeven Price:** $X + \text{Premium}$
* **Payoff Profile:**
  * If $S_T \le X$, the option lapses. The writer gains the full premium.
  * If $S_T > X$, the option is exercised against the writer. Losses increase linearly as stock price rises.

### C. Long Put (Buy Put)
* **Payoff Formula:** $\max(0, X - S_T)$
* **Net Profit/Loss Formula:** $\max(0, X - S_T) - \text{Premium}$
* **Breakeven Price:** $X - \text{Premium}$
* **Payoff Profile:**
  * If $S_T \ge X$, the option lapses. Loss is capped at the premium.
  * If $S_T < X$, the option is exercised. Net profit rises as the stock price falls, maximizing when stock hits zero.

### D. Short Put (Write/Sell Put)
* **Payoff Formula:** $-\max(0, X - S_T)$
* **Net Profit/Loss Formula:** $\text{Premium} - \max(0, X - S_T)$
* **Breakeven Price:** $X - \text{Premium}$
* **Payoff Profile:**
  * If $S_T \ge X$, the option lapses. The writer gains the full premium.
  * If $S_T < X$, the option is exercised. Losses increase as the stock price falls, reaching a maximum loss of $X - \text{Premium}$ if the stock price drops to zero.

---

## 7. Variables Affecting Option Prices

Five major market variables influence the premium of an option:

1. **Underlying Stock Price ($S$):**
   * *Calls:* Direct relationship. When $S$ increases, call premium increases.
   * *Puts:* Inverse relationship. When $S$ increases, put premium decreases.

2. **Strike Price ($X$):**
   * *Calls:* Inverse relationship. A higher $X$ means buying at a higher price, which lowers the call value.
   * *Puts:* Direct relationship. A higher $X$ means selling at a higher price, which increases the put value.

3. **Time to Expiry ($T$):**
   * *Calls and Puts:* Direct relationship. The longer the time to expiration, the higher the option premium for both. This is because there is a higher probability of profitable stock price movements.

4. **Volatility ($\sigma$):**
   * *Calls and Puts:* Direct relationship. Volatility measures the price dispersion. Because options have capped downside risk and unlimited/high upside risk, both calls and puts become more valuable as volatility increases.

5. **Risk-Free Interest Rate ($r$):**
   * *Calls:* Direct relationship. A higher interest rate increases the call premium because it reduces the present value of the strike price that the buyer must pay at expiration.
   * *Puts:* Inverse relationship. A higher interest rate decreases the put premium because it reduces the present value of the strike price that the writer pays at expiration.

---

## 8. The Option Greeks

Option Greeks measure the sensitivity of an option's premium to changes in the underlying pricing variables.

### 1. Delta ($\Delta$)
* **Definition:** The rate of change of the option premium with respect to a change in the price of the underlying asset.
* **Formula:** $\Delta = \frac{\Delta \text{ Option Premium}}{\Delta \text{ Stock Price}}$
* **Key Characteristics:**
  * Call Delta is **positive** ($0 \le \Delta_{call} \le 1$).
  * Put Delta is **negative** ($-1 \le \Delta_{put} \le 0$).
  * ATM options have a Delta of approximately $+0.50$ (calls) and $-0.50$ (puts).
  * Delta acts as a rough proxy for the probability that the option will expire In-the-Money.

### 2. Gamma ($\Gamma$)
* **Definition:** The rate of change of Delta with respect to a change in the price of the underlying asset.
* **Formula:** $\Gamma = \frac{\Delta \text{ Delta}}{\Delta \text{ Stock Price}}$
* **Key Characteristics:**
  * Gamma is **positive** for both long calls and long puts.
  * It measures the stability of Delta. A high Gamma means Delta is highly sensitive to stock price moves.
  * Gamma is highest when the option is At-the-Money (ATM).

### 3. Theta ($\theta$)
* **Definition:** The rate of change of the option value with respect to the passage of time (time decay).
* **Formula:** $\theta = \frac{\Delta \text{ Option Premium}}{\Delta \text{ Time to Expiry}}$
* **Key Characteristics:**
  * Theta is **negative** for option buyers (long positions) because options lose value as time passes.
  * It is **positive** for option sellers (short positions).
  * Time decay accelerates as the option gets closer to its expiration date.

### 4. Vega ($\nu$)
* **Definition:** The rate of change of the option premium with respect to a 1% change in implied volatility.
* **Formula:** $\nu = \frac{\Delta \text{ Option Premium}}{\Delta \text{ Implied Volatility (IV)}}$
* **Key Characteristics:**
  * Vega is **positive** for both long calls and long puts.
  * An increase in volatility increases the premiums of all options, while a decrease in volatility decreases them.

### 5. Rho ($\rho$)
* **Definition:** The rate of change of the option premium with respect to a 1% change in the risk-free interest rate.
* **Formula:** $\rho = \frac{\Delta \text{ Option Premium}}{\Delta \text{ Risk-Free Interest Rate}}$
* **Key Characteristics:**
  * Rho is **positive** for calls and **negative** for puts.

---

## 9. Theoretical Models (Brief Introduction)

For CA Final AFM, options are valued using mathematical models:

### A. Binomial Model (Risk-Neutral Valuation)
Assumes that the stock price can move to only two possible values (up or down) in the next time period. By creating a riskless portfolio of shares and options, or by using risk-neutral probabilities, we can discount future payoffs to find the option's value today.

### B. Black-Scholes Model
A continuous-time model that uses five inputs ($S$, $X$, $T$, $\sigma$, $r$) to determine the theoretical value of a European option.

#### Key Assumptions:
1. Dividend-free stock during the option's life.
2. European exercise terms.
3. No transaction costs or taxes.
4. Continuous trading and unrestricted short selling.
5. Constant and known risk-free interest rate.
6. Constant volatility of returns.
7. Lognormal distribution of stock prices.

#### Key Limitations:
* Real-world volatility and interest rates are not constant; they fluctuate.
* Stock prices can experience large jumps (e.g., corporate announcements), which violates the continuity assumption.
* Many stocks pay dividends, which the classic model ignores unless adjusted.
* Volatility is unobservable and must be estimated.
* The model tends to misprice deep ITM or deep OTM options.
