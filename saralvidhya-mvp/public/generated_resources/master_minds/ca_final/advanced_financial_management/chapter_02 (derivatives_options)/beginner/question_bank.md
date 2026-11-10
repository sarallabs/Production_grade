# Study Resource: Question Bank
## Chapter: Derivatives - Options (Beginner Level)

This question bank contains conceptual questions, definitions, formula recall, and simple numerical examples to build a strong foundation in Options.

---

### Question 1: Futures vs. Options Contracts
**Question:**
Explain the key differences between a Futures contract and an Options contract. Summarize the differences in a table based on obligation, payoff symmetry, mark-to-market margins, upfront payments, and risk profile.

**Answer:**
A futures contract and an options contract are both derivative instruments, but they differ fundamentally in the rights and obligations they create for the counterparties:

1. **Obligation vs. Right:** 
   * In a **futures contract**, both the buyer and the seller are under a binding obligation to perform the contract (buy or sell) at the agreed price on the settlement date.
   * In an **options contract**, the buyer purchases the *right* but has *no obligation* to buy (call option) or sell (put option) the underlying asset. The seller (writer), however, is under a binding *obligation* to fulfill the contract if the buyer chooses to exercise their right.

2. **Payoff Symmetry:**
   * **Futures** offer symmetrical payoffs. If the price moves in favor of the buyer, the buyer profits and the seller loses; if it moves against the buyer, the buyer loses and the seller profits. The potential profit and loss are theoretically unlimited for both.
   * **Options** offer asymmetrical payoffs. The buyer's downside is strictly limited to the premium paid, while the upside can be unlimited (for a call) or very large (for a put). Conversely, the seller's upside is limited to the premium received, while their downside is unlimited or very large.

3. **Margins & Mark-to-Market (MTM):**
   * **Futures** contracts involve daily mark-to-market margins, which means gains and losses are settled daily, leading to cash flow liabilities during the contract's life.
   * **Options** contracts do not involve daily mark-to-market margin liabilities for the buyer, as the buyer pays the full premium upfront. (Note: Writers/sellers of options must maintain margins to cover risk, but the contract itself does not impose MTM cash outflows on the buyer).

4. **Upfront Cost:**
   * **Futures** do not require any upfront payment (except for initial margin deposits, which are refundable).
   * **Options** require the buyer to pay an upfront, non-refundable fee called the **premium** to the seller.

| Feature | Futures Contract | Options Contract |
| :--- | :--- | :--- |
| **Obligation** | Both buyer and seller are obligated. | Buyer has the right (no obligation); Seller is obligated. |
| **Payoff** | Symmetrical (Linear profit/loss profile). | Asymmetrical (Non-linear profit/loss profile). |
| **Upfront Fee** | No premium paid; only refundable margin deposits. | Option buyer pays a non-refundable **Premium** to the seller. |
| **Mark-to-Market (MTM)**| Daily settlement of profits/losses. | No daily MTM settlement for the buyer. |
| **Maximum Loss** | Unlimited for both buyer and seller. | For Buyer: Limited to premium paid.<br>For Seller: Unlimited (Call) or high (Put). |

---

### Question 2: Call and Put Options Definitions
**Question:**
Define the following terms:
1. Call Option (from Buyer's and Writer's perspective)
2. Put Option (from Buyer's and Writer's perspective)
3. Strike Price ($X$)
4. Underlying Asset
5. Option Premium ($p$ or $c$)

**Answer:**

1. **Call Option:**
   * **Buyer's Perspective (Long Call):** The buyer of a call option acquires the right, but not the obligation, to buy a specified quantity of the underlying asset at a pre-determined strike price on or before a specified expiry date. The buyer pays a premium for this right and expects the price of the asset to rise.
   * **Writer's/Seller's Perspective (Short Call):** The writer of a call option receives the premium upfront and assumes the obligation to sell the underlying asset at the strike price if the buyer decides to exercise the option. The writer expects the price of the asset to remain below the strike price.

2. **Put Option:**
   * **Buyer's Perspective (Long Put):** The buyer of a put option acquires the right, but not the obligation, to sell a specified quantity of the underlying asset at a pre-determined strike price on or before a specified expiry date. The buyer pays a premium and expects the price of the asset to fall.
   * **Writer's/Seller's Perspective (Short Put):** The writer of a put option receives the premium upfront and assumes the obligation to buy the underlying asset at the strike price if the buyer decides to exercise the option. The writer expects the price of the asset to remain above the strike price.

3. **Strike Price (Exercise Price - $X$):**
   * The pre-determined fixed price at which the underlying asset can be bought (in a call) or sold (in a put) when the option is exercised.

4. **Underlying Asset:**
   * The financial asset (such as shares, indices, commodities, currencies, or interest rates) upon which the option contract is valued. The price of the option is derived from the price movement of this asset.

5. **Option Premium:**
   * The price paid by the option buyer to the option seller (writer) for acquiring the rights under the option contract. It is a non-refundable upfront payment.

---

### Question 3: American vs. European Options
**Question:**
Distinguish between American-style options and European-style options. Which style is primarily used in the Indian stock market for index and stock options?

**Answer:**
The key distinction lies in **when** the option can be exercised:

* **American Options:**
  These options can be exercised by the buyer at any point in time between the date of purchase and the expiration date. They offer maximum flexibility to the holder.
  
* **European Options:**
  These options can only be exercised on the expiration date itself, not before.

**Indian Market Practice:**
In India, exchange-traded equity derivatives (both Index options and Stock options) are **European-style** options. They are cash-settled (for indices) or physically settled (for stocks) strictly on the expiration date, which is the last Thursday of the respective contract month.

---

### Question 4: Covered vs. Naked Option Writing
**Question:**
Explain the terms "Covered Call Writing" and "Uncovered (Naked) Call Writing". Why does a naked writer face higher risk?

**Answer:**

* **Covered Call Writing:**
  This occurs when an investor writes (sells) a call option on a stock that they already own. If the buyer exercises the call option, the writer can simply deliver the shares they already hold in their portfolio. The risk is limited because they own the physical asset.

* **Uncovered (Naked) Call Writing:**
  This occurs when an investor writes a call option on a stock they do not own. If the buyer exercises the option, the writer is forced to buy the shares in the open market at the prevailing market price (which could be extremely high) and sell them at the lower strike price.

**Why Naked Writing Faces Higher Risk:**
If the stock price rises dramatically, the naked call writer's potential loss is theoretically unlimited because there is no limit to how high a stock's price can go, and they must purchase the stock at that high price to fulfill their obligation.

---

### Question 5: Moneyness of Options
**Question:**
Explain the concepts of **In-the-Money (ITM)**, **At-the-Money (ATM)**, and **Out-of-the-Money (OTM)** for both Call and Put options. Provide a summary table using Spot Price ($S_T$) and Strike Price ($X$).

**Answer:**
Moneyness describes the relationship between the strike price ($X$) of an option and the current market price (spot price, $S_T$) of the underlying asset.

1. **In-the-Money (ITM):**
   * An option is ITM if exercising it immediately would result in a positive cash flow (disregarding the premium paid).
   * **Call Option is ITM** when Spot Price is greater than Strike Price ($S_T > X$).
   * **Put Option is ITM** when Spot Price is less than Strike Price ($S_T < X$).

2. **At-the-Money (ATM):**
   * An option is ATM if the spot price is equal to the strike price ($S_T = X$). Exercising it would yield zero cash flow (disregarding premium).
   * **Call and Put Options are ATM** when Spot Price equals Strike Price ($S_T = X$).

3. **Out-of-the-Money (OTM):**
   * An option is OTM if exercising it immediately would result in a negative cash flow (making exercise irrational).
   * **Call Option is OTM** when Spot Price is less than Strike Price ($S_T < X$).
   * **Put Option is OTM** when Spot Price is greater than Strike Price ($S_T > X$).

| Moneyness | Call Option | Put Option |
| :--- | :--- | :--- |
| **In-the-Money (ITM)** | Spot Price > Strike Price ($S_T > X$) | Spot Price < Strike Price ($S_T < X$) |
| **At-the-Money (ATM)** | Spot Price = Strike Price ($S_T = X$) | Spot Price = Strike Price ($S_T = X$) |
| **Out-of-the-Money (OTM)**| Spot Price < Strike Price ($S_T < X$) | Spot Price > Strike Price ($S_T > X$) |

---

### Question 6: Intrinsic Value and Time Value
**Question:**
1. Define the terms **Intrinsic Value** and **Time Value**.
2. State the formulas for calculating the Intrinsic Value of a Call and a Put option.
3. Calculate the Intrinsic Value and Time Value of a Call option where:
   * Current Spot Price ($S$) = ₹420
   * Strike Price ($X$) = ₹400
   * Call Premium = ₹35

**Answer:**

1. **Definitions:**
   * **Intrinsic Value:** The value that an option would have if it were exercised immediately. It represents the positive difference between the stock price and the strike price. It can never be negative (if the calculation is negative, the intrinsic value is set to zero).
   * **Time Value:** The portion of the option premium that exceeds its intrinsic value. It represents the premium buyers are willing to pay for the possibility that the option will gain value before it expires. At expiration, the time value of an option becomes exactly zero.

2. **Formulas:**
   * **Intrinsic Value of a Call** = $\max(0, S - X)$
   * **Intrinsic Value of a Put** = $\max(0, X - S)$
   * **Time Value** = Option Premium - Intrinsic Value

3. **Numerical Example Calculation:**
   * Given: Spot ($S$) = ₹420, Strike ($X$) = ₹400, Premium = ₹35
   * **Intrinsic Value of Call** = $\max(0, S - X)$ = $\max(0, 420 - 400)$ = **₹20**
   * **Time Value** = Premium - Intrinsic Value = ₹35 - ₹20 = **₹15**
   * *Conclusion:* Out of the total premium of ₹35, ₹20 is the intrinsic value and ₹15 is the time value.

---

### Question 7: Factors Affecting Option Pricing
**Question:**
Explain how the following five factors affect the price (premium) of both Call and Put options:
1. Stock Price ($S$)
2. Strike Price ($X$)
3. Time to Expiration ($T$)
4. Volatility of the Underlying ($\sigma$)
5. Risk-Free Interest Rate ($r$)

**Answer:**

| Variable | Call Option Premium | Put Option Premium | Rationale / Explanation |
| :--- | :---: | :---: | :--- |
| **Increase in Stock Price ($S$)** | **Increases** ($\uparrow$) | **Decreases** ($\downarrow$) | A higher stock price increases the payoff potential for a call (right to buy cheap) and reduces it for a put (right to sell dear). |
| **Increase in Strike Price ($X$)** | **Decreases** ($\downarrow$) | **Increases** ($\uparrow$) | A higher strike price makes it more expensive to buy under a call, lowering its value. For a put, a higher strike price means you can sell at a higher price, increasing its value. |
| **Increase in Time to Expiry ($T$)**| **Increases** ($\uparrow$) | **Increases** ($\uparrow$)* | More time gives a greater probability that the stock will move favorably. (*Note: For European puts, there are rare exceptions where time increase can reduce value if the option is deep ITM, but generally, it increases value for both). |
| **Increase in Volatility ($\sigma$)** | **Increases** ($\uparrow$) | **Increases** ($\uparrow$) | Options benefit from price fluctuations. High volatility increases the chance of large favorable movements, while downside risk remains capped by the premium paid. |
| **Increase in Interest Rate ($r$)** | **Increases** ($\uparrow$) | **Decreases** ($\downarrow$) | Buying a call is a substitute for buying the stock now (saving immediate cash outflow which earns interest). Buying a put delays receiving cash from selling stock, resulting in interest forgone. |

---

### Question 8: Payoff Calculations - Call Option
**Question:**
An investor buys a 3-month Call option on the shares of IDFC Ltd. with a strike price ($X$) of ₹100 for a premium of ₹10. 
1. State the formula for the payoff and profit of the Call buyer (Long Call).
2. State the formula for the payoff and profit of the Call seller (Short Call).
3. Compute the net profit/loss for both the buyer and seller if the stock price at expiry is:
   * ₹75, ₹90, ₹100, ₹110, ₹120, ₹125.
4. Identify the breakeven price.

**Answer:**

1. **Formulas for Call Buyer (Long Call):**
   * **Payoff** = $\max(0, S_T - X)$
   * **Net Profit / (Loss)** = Payoff - Premium Paid = $\max(0, S_T - X) - \text{Premium}$

2. **Formulas for Call Seller (Short Call):**
   * **Payoff** = $-\max(0, S_T - X)$
   * **Net Profit / (Loss)** = Payoff + Premium Received = $\text{Premium} - \max(0, S_T - X)$
   * *(Note: Seller profit is exactly the opposite of the buyer's profit).*

3. **Payoff and Profit Table:**

| Stock Price at Expiry ($S_T$) | Buyer's Payoff (₹) | Buyer's Net Profit/Loss (₹) | Seller's Payoff (₹) | Seller's Net Profit/Loss (₹) | Exercise decision? |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **₹75** | 0 | -10 | 0 | +10 | No (Lapses) |
| **₹90** | 0 | -10 | 0 | +10 | No (Lapses) |
| **₹100** | 0 | -10 | 0 | +10 | No / Indifferent|
| **₹110** | 10 | 0 | -10 | 0 | Yes (Breakeven) |
| **₹120** | 20 | +10 | -20 | -10 | Yes |
| **₹125** | 25 | +15 | -25 | -15 | Yes |

4. **Breakeven Price:**
   * **Breakeven Price for Call** = $\text{Strike Price } (X) + \text{Premium}$ = $100 + 10$ = **₹110**
   * At ₹110, the buyer recovers their ₹10 premium, resulting in zero net profit/loss.

---

### Question 9: Payoff Calculations - Put Option
**Question:**
An investor buys a Put option on XYZ Ltd. with a strike price ($X$) of ₹100 for a premium of ₹10.
1. State the formula for the payoff and profit of the Put buyer (Long Put).
2. State the formula for the payoff and profit of the Put seller (Short Put).
3. Compute the net profit/loss for both the buyer and seller if the stock price at expiry is:
   * ₹75, ₹85, ₹90, ₹100, ₹110, ₹120.
4. Identify the breakeven price.

**Answer:**

1. **Formulas for Put Buyer (Long Put):**
   * **Payoff** = $\max(0, X - S_T)$
   * **Net Profit / (Loss)** = Payoff - Premium Paid = $\max(0, X - S_T) - \text{Premium}$

2. **Formulas for Put Seller (Short Put):**
   * **Payoff** = $-\max(0, X - S_T)$
   * **Net Profit / (Loss)** = Payoff + Premium Received = $\text{Premium} - \max(0, X - S_T)$

3. **Payoff and Profit Table:**

| Stock Price at Expiry ($S_T$) | Buyer's Payoff (₹) | Buyer's Net Profit/Loss (₹) | Seller's Payoff (₹) | Seller's Net Profit/Loss (₹) | Exercise decision? |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **₹75** | 25 | +15 | -25 | -15 | Yes |
| **₹85** | 15 | +5 | -15 | -5 | Yes |
| **₹90** | 10 | 0 | -10 | 0 | Yes (Breakeven) |
| **₹100** | 0 | -10 | 0 | +10 | No / Indifferent|
| **₹110** | 0 | -10 | 0 | +10 | No (Lapses) |
| **₹120** | 0 | -10 | 0 | +10 | No (Lapses) |

4. **Breakeven Price:**
   * **Breakeven Price for Put** = $\text{Strike Price } (X) - \text{Premium}$ = $100 - 10$ = **₹90**
   * At ₹90, the buyer recovers their ₹10 premium, resulting in zero net profit/loss.

---

### Question 10: Option Greeks Definitions
**Question:**
Define the five option Greeks: Delta, Gamma, Theta, Vega, and Rho. Include their values/signs for standard positions.

**Answer:**

1. **Delta ($\Delta$):**
   * **Definition:** Measures the change in the option premium for a ₹1 change in the price of the underlying asset.
   * **Values:** 
     * Call options have a **positive Delta** (between 0 and +1). As stock price rises, call value rises.
     * Put options have a **negative Delta** (between -1 and 0). As stock price rises, put value falls.
     * An ATM option typically has a Delta close to +0.50 (for calls) or -0.50 (for puts).

2. **Gamma ($\Gamma$):**
   * **Definition:** Measures the rate of change in Delta for a ₹1 change in the price of the underlying asset. It represents the acceleration of Delta.
   * **Values:** Gamma is **positive** for both long calls and long puts. It reaches its maximum when the option is At-the-Money (ATM).

3. **Theta ($\theta$):**
   * **Definition:** Measures the rate of change of the option value with respect to the passage of time (time decay), assuming all other factors remain constant. It represents the value lost per day.
   * **Values:** Theta is **negative** for buyers of options (as time decay erodes the option's value daily) and **positive** for sellers of options. It accelerates as the option approaches expiration.

4. **Vega ($\nu$):**
   * **Definition:** Measures the change in the option premium for a 1% change in the implied volatility (IV) of the underlying asset.
   * **Values:** Vega is **positive** for buyers of both calls and puts. A rise in volatility increases option premiums; a fall decreases them.

5. **Rho ($\rho$):**
   * **Definition:** Measures the change in the option premium for a 1% change in the risk-free rate of interest.
   * **Values:** Rho is **positive** for call options and **negative** for put options.

---

### Question 11: Black-Scholes Model Assumptions
**Question:**
List the primary assumptions of the classic Black-Scholes Model for option pricing.

**Answer:**
The classic Black-Scholes Model is built on several simplifying assumptions:
1. **Dividend-free stock:** The stock pays no dividends during the option’s life.
2. **European exercise:** The option can only be exercised at maturity (European-style).
3. **No transaction costs:** There are no transaction commissions, execution fees, or taxes.
4. **No short-selling restrictions:** Short selling is permitted without any restrictions or penalties, and assets can be traded continuously.
5. **Constant interest rate:** The risk-free interest rate ($r$) remains constant and known throughout the life of the option.
6. **Lognormal distribution of stock prices:** Stock price returns are normally distributed, meaning that stock prices follow a lognormal distribution and cannot be negative.
7. **Constant volatility:** The volatility ($\sigma$) of the underlying stock remains constant throughout the option's life.

---

### Question 12: Simple Expectation Payoff Calculation
**Question:**
An investor buys a 3-month call option on Satya Ltd. for a premium of ₹30. The current market price of the share is ₹560, and the exercise price is ₹590. The expected share prices at the end of 3 months with their respective probabilities are as follows:

| Share Price ($S_T$) | Probability ($P$) |
| :---: | :---: |
| ₹540 | 0.10 |
| ₹560 | 0.20 |
| ₹580 | 0.20 |
| ₹600 | 0.30 |
| ₹620 | 0.15 |
| ₹640 | 0.05 |

**Calculate:**
1. The expected share price at the end of 3 months.
2. The expected value (payoff) of the call option at maturity.
3. The expected net profit/loss for the buyer of the option.

**Answer:**

**1. Expected Share Price at the end of 3 months:**
$$\text{Expected Price} = \sum (S_T \times P)$$
* $\text{Expected Price} = (540 \times 0.10) + (560 \times 0.20) + (580 \times 0.20) + (600 \times 0.30) + (620 \times 0.15) + (640 \times 0.05)$
* $\text{Expected Price} = 54 + 112 + 116 + 180 + 93 + 32$
* $\text{Expected Price} = \mathbf{₹587}$

**2. Expected Value (Payoff) of Call Option at Maturity:**
The call buyer only exercises the option if $S_T > X$ (i.e., $S_T > 590$).
The payoff is $\max(0, S_T - 590)$.

Let's calculate the payoff at each price node:
* At ₹540: Payoff = ₹0 (Option Lapses)
* At ₹560: Payoff = ₹0 (Option Lapses)
* At ₹580: Payoff = ₹0 (Option Lapses)
* At ₹600: Payoff = $600 - 590$ = ₹10
* At ₹620: Payoff = $620 - 590$ = ₹30
* At ₹640: Payoff = $640 - 590$ = ₹50

Now, calculate the expected payoff:
$$\text{Expected Payoff} = \sum (\text{Payoff} \times P)$$
* $\text{Expected Payoff} = (0 \times 0.10) + (0 \times 0.20) + (0 \times 0.20) + (10 \times 0.30) + (30 \times 0.15) + (50 \times 0.05)$
* $\text{Expected Payoff} = 0 + 0 + 0 + 3 + 4.5 + 2.5$
* $\text{Expected Payoff} = \mathbf{₹10}$

**3. Expected Net Profit/Loss for Call Buyer:**
* $\text{Expected Net Profit/Loss} = \text{Expected Payoff} - \text{Premium Paid}$
* $\text{Expected Net Profit/Loss} = 10 - 30$ = **-₹20** (Expected loss of ₹20)
