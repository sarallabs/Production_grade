# CA Final AFM Study Resource: Derivatives - Options
## Intermediate Level Question Bank

---

### Section A: Conceptual & Theoretical Questions

#### Question 1
**Distinguish between a Futures Contract and an Options Contract based on the following parameters:**
1. Obligation of counterparties
2. Payoff symmetry
3. Mark-to-Market (MTM) requirements
4. Upfront premium flows
5. Maximum risk exposure

**Answer:**
| Parameter | Futures Contract | Options Contract |
| :--- | :--- | :--- |
| **Obligation** | Both buyer and seller are under a binding obligation to perform the contract. | The buyer has the right but no obligation. The seller (writer) has a binding obligation if the buyer exercises. |
| **Payoff Symmetry** | Symmetric payoff (linear profit/loss profile for both parties). | Asymmetric payoff (limited loss for buyer, unlimited upside; limited profit for seller, unlimited downside). |
| **Mark-to-Market (MTM)** | Subject to daily MTM margin adjustments and margin calls. | No MTM margins for the buyer (only premium paid). Sellers must maintain margins, but no daily MTM settlement of the contract value occurs. |
| **Upfront Premium** | No upfront premium is exchanged; only initial margin is deposited. | The buyer pays an upfront premium to the seller. |
| **Maximum Risk** | Potential loss is unlimited for both the buyer and the seller (dependent on price movement). | For the buyer, maximum loss is restricted to the premium paid. For the seller, potential loss can be unlimited (calls) or substantial (puts). |

---

#### Question 2
**State the key assumptions of the classic Black-Scholes Option Pricing Model (BSM) and discuss three practical limitations when applying this model to real-world financial markets.**

**Answer:**
##### Key Assumptions of the Black-Scholes Model:
1. **Dividend Policy:** The underlying stock pays no dividends during the option’s life.
2. **Exercise Style:** The option is a European option (can only be exercised at expiration).
3. **Short Selling:** There are no restrictions, penalties, or borrowing costs associated with short selling.
4. **Transaction Costs & Taxes:** There are no transaction costs, commissions, or taxes.
5. **Interest Rates:** The risk-free rate of interest remains constant and is known.
6. **Stock Price Distribution:** Stock returns are continuously compounded and follow a normal distribution (meaning stock prices follow a lognormal distribution), with constant volatility.

##### Practical Limitations in Real-World Application:
1. **Constant Volatility & Interest Rates:** BSM assumes volatility ($\sigma$) and risk-free rates ($r$) are constant. In reality, volatility fluctuates (implied volatility smile/smirk), and interest rates vary over time.
2. **No Dividends:** Many stocks pay dividends during the life of the option. Failing to account for dividends leads to overvaluation of call options.
3. **No Jumps (Continuous Trading):** BSM assumes stock price paths are continuous. It fails to account for sudden gap-ups or gap-downs (jumps) due to earnings announcements, mergers, or macroeconomic shocks.
4. **Parameter Estimation:** Volatility is not directly observable and must be estimated historically or implied, introducing estimation errors.

---

#### Question 3
**Explain the concept of 'Option Greeks' and define the significance of Delta, Gamma, Theta, Vega, and Rho.**

**Answer:**
Option Greeks are mathematical measures that quantify the sensitivity of an option’s price to changes in its underlying parameters (underlying asset price, volatility, time to expiration, and risk-free interest rate).

1. **Delta ($\Delta$):** Measures the rate of change of the option price with respect to a change in the price of the underlying asset ($\Delta = \frac{\partial C}{\partial S}$). Deltas for calls are positive ($0$ to $+1$), and for puts are negative ($-1$ to $0$).
2. **Gamma ($\Gamma$):** Measures the rate of change in the option's Delta with respect to a change in the underlying asset's price ($\Gamma = \frac{\partial^2 C}{\partial S^2}$). It indicates the acceleration of Delta and is highest for at-the-money options.
3. **Theta ($\theta$):** Represents time decay. It measures the change in option value with respect to a decrease in the time to expiration ($\theta = \frac{\partial C}{\partial t}$). Theta is generally negative, showing that options lose value as time passes.
4. **Vega ($\nu$):** Measures the sensitivity of the option price to a $1\%$ change in the implied volatility of the underlying asset ($\nu = \frac{\partial C}{\partial \sigma}$). Higher volatility increases the value of both calls and puts.
5. **Rho ($\rho$):** Measures the sensitivity of the option price to a $1\%$ change in the risk-free interest rate ($\rho = \frac{\partial C}{\partial r}$). Higher interest rates increase call values and decrease put values.

---

### Section B: Computational & Practical Problems

#### Problem 1 (Option Combinations - Straddle/Strangle style)
Fresh Bakery Ltd.’s share price is currently trading at ₹50. There is an upcoming announcement regarding a potential collaboration with a multinational company. If the collaboration is approved, the share price is expected to rise significantly; if rejected, the price will crash. 

To hedge this uncertainty, an investor builds a strategy by purchasing:
* One 3-month Call Option with a strike price ($X$) of ₹52 at a premium of ₹2.
* One 3-month Put Option with a strike price ($X$) of ₹50 at a premium of ₹1.

The lot size is 50 shares. Determine the investor's net payoff and net profit/loss (for the total lot) if at the end of 3 months, the share price is:
1. **₹53**
2. **₹46**
3. **₹51**

##### Solution:
##### 1) Setup and Initial Outlay
* **Call Option:** $X_c = ₹52$, Premium paid ($P_c$) = ₹2
* **Put Option:** $X_p = ₹50$, Premium paid ($P_p$) = ₹1
* **Total Premium paid per share** = $P_c + P_p = ₹2 + ₹1 = ₹3$
* **Total Premium for Lot** (50 shares) = $₹3 \times 50 = ₹150$

##### 2) Analysis under different scenarios:

###### Scenario 1: Ending Share Price ($S_t$) = ₹53
* **Call Option Payoff:** Since $S_t > X_c$ ($53 > 52$), the investor exercises the call option.
  $$\text{Call Payoff per share} = \max(0, S_t - X_c) = \max(0, 53 - 52) = ₹1$$
* **Put Option Payoff:** Since $S_t > X_p$ ($53 > 50$), the put option expires out-of-the-money (worthless).
  $$\text{Put Payoff per share} = \max(0, X_p - S_t) = \max(0, 50 - 53) = ₹0$$
* **Net Payoff per share** = $₹1 + ₹0 = ₹1$
* **Net Profit/Loss per share** = Net Payoff - Total Premium = $₹1 - ₹3 = -₹2$
* **Total Net Profit/Loss for the Lot** = $-₹2 \times 50 = -₹100$ (Net Loss of ₹100)

###### Scenario 2: Ending Share Price ($S_t$) = ₹46
* **Call Option Payoff:** Since $S_t < X_c$ ($46 < 52$), the call option expires worthless.
  $$\text{Call Payoff per share} = \max(0, S_t - X_c) = 0$$
* **Put Option Payoff:** Since $S_t < X_p$ ($46 < 50$), the investor exercises the put option.
  $$\text{Put Payoff per share} = \max(0, X_p - S_t) = \max(0, 50 - 46) = ₹4$$
* **Net Payoff per share** = $₹0 + ₹4 = ₹4$
* **Net Profit/Loss per share** = Net Payoff - Total Premium = $₹4 - ₹3 = +₹1$
* **Total Net Profit/Loss for the Lot** = $+₹1 \times 50 = +₹50$ (Net Profit of ₹50)

###### Scenario 3: Ending Share Price ($S_t$) = ₹51
* **Call Option Payoff:** Since $S_t < X_c$ ($51 < 52$), the call option expires worthless.
  $$\text{Call Payoff per share} = 0$$
* **Put Option Payoff:** Since $S_t > X_p$ ($51 > 50$), the put option expires worthless.
  $$\text{Put Payoff per share} = 0$$
* **Net Payoff per share** = $₹0 + ₹0 = ₹0$
* **Net Profit/Loss per share** = Net Payoff - Total Premium = $0 - ₹3 = -₹3$
* **Total Net Profit/Loss for the Lot** = $-₹3 \times 50 = -₹150$ (Net Loss of ₹150)

---

#### Problem 2 (Expected Payoff with Probabilities)
You purchased a 3-month European call option on the equity shares of Satya Ltd. for a premium of ₹30. The current market price of the share is ₹560 and the strike price is ₹590. You expect the ending share price to range between ₹540 and ₹640. 

The probability distribution of the share price at maturity is as follows:
| Share Price at Expiry ($S_t$) (₹) | Probability |
| :--- | :--- |
| 540 | 0.10 |
| 560 | 0.20 |
| 580 | 0.25 |
| 600 | 0.15 |
| 620 | 0.20 |
| 640 | 0.10 |

**Calculate:**
1. Expected share price at the end of 3 months.
2. The expected value (payoff) of the call option at maturity.
3. The net expected profit/loss for the option buyer.
4. The share price required at maturity for the option buyer to break even.

##### Solution:
##### 1) Expected Share Price at the end of 3 months:
$$\text{Expected Price } E(S_t) = \sum (S_t \times \text{Probability})$$
$$E(S_t) = (540 \times 0.10) + (560 \times 0.20) + (580 \times 0.25) + (600 \times 0.15) + (620 \times 0.20) + (640 \times 0.10)$$
$$E(S_t) = 54 + 112 + 145 + 90 + 124 + 64 = ₹589$$

##### 2) Expected Value (Payoff) of Call Option at Maturity:
The call option payoff at maturity is given by $\text{Payoff} = \max(0, S_t - X)$, where strike price $X = ₹590$.

| $S_t$ (₹) | Probability ($P$) | Payoff ($V_t$) = $\max(0, S_t - 590)$ (₹) | Expected Payoff ($V_t \times P$) (₹) |
| :--- | :--- | :--- | :--- |
| 540 | 0.10 | 0 | 0.00 |
| 560 | 0.20 | 0 | 0.00 |
| 580 | 0.25 | 0 | 0.00 |
| 600 | 0.15 | $600 - 590 = 10$ | $10 \times 0.15 = 1.50$ |
| 620 | 0.20 | $620 - 590 = 30$ | $30 \times 0.20 = 6.00$ |
| 640 | 0.10 | $640 - 590 = 50$ | $50 \times 0.10 = 5.00$ |
| **Total** | **1.00** | | **₹12.50** |

**Expected Call Option Payoff at Maturity = ₹12.50**

##### 3) Net Expected Profit/Loss for the Option Buyer:
$$\text{Net Expected Profit} = \text{Expected Payoff} - \text{Premium Paid}$$
$$\text{Net Expected Profit} = ₹12.50 - ₹30.00 = -₹17.50 \text{ (Expected Net Loss of ₹17.50 per option)}$$

##### 4) Breakeven Share Price for the Call Option Buyer:
$$\text{Breakeven Price} = X + \text{Premium} = 590 + 30 = ₹620$$

---

#### Problem 3 (1-Period Risk Neutral Binomial Valuation)
Mr. Dayal wants to value a Call option on the shares of ABC Ltd. The current stock price is ₹600. In three months, the price is expected to either rise to ₹780 or fall to ₹480. A call option can be exercised at the end of three months at a strike price of ₹630. The risk-free rate of interest is $10\%$ p.a. 

**Determine the value of the Call option today using the Risk-Neutral Valuation Approach.**

##### Solution:
##### 1) Identify Inputs
* Current Stock Price ($S_0$) = ₹600
* Up-state Stock Price ($S_u$) = ₹780
* Down-state Stock Price ($S_d$) = ₹480
* Strike Price ($X$) = ₹630
* Risk-free Rate ($r$) = $10\%$ p.a.
* Time to Expiry ($t$) = 3 months = 0.25 years
* Continuous compounding factor or simple compounding? Since not specified, we can use simple compounding or continuous. Standard ICAI intermediate questions often use simple compounding unless $e^{rt}$ values are given. Let's use standard discrete compounding for 3 months:
  $$r_{3m} = 10\% \times \frac{3}{12} = 2.5\% \text{ or } 0.025$$
  $\text{Discounting Factor} = 1 + r_{3m} = 1.025$

##### 2) Calculate Payoffs at Expiry (3 Months)
* **At Up-state ($S_u = 780$):**
  $$C_u = \max(0, S_u - X) = \max(0, 780 - 630) = ₹150$$
* **At Down-state ($S_d = 480$):**
  $$C_d = \max(0, S_d - X) = \max(0, 480 - 630) = ₹0$$

##### 3) Calculate Risk-Neutral Probability of Up-move ($p$)
Let $p$ be the risk-neutral probability of an up-move:
$$S_0 \times (1 + r_{3m}) = p \times S_u + (1 - p) \times S_d$$
$$600 \times 1.025 = p \times 780 + (1 - p) \times 480$$
$$615 = 780p + 480 - 480p$$
$$135 = 300p \implies p = $\frac{135}{300} = 0.45$$
Hence, risk-neutral probability of down-move ($1-p$) = $0.55$.

##### 4) Value of Call Option Today ($C_0$)
$$C_0 = \frac{p \times C_u + (1-p) \times C_d}{1 + r_{3m}}$$
$$C_0 = \frac{(0.45 \times 150) + (0.55 \times 0)}{1.025} = $\frac{67.50}{1.025} \approx ₹65.85$$

---

#### Problem 4 (1-Period Risk Neutral with Continuous Compounding)
The current market price of an equity share of Penchant Ltd. is ₹150. Within a period of 3 months, the stock price is expected to rise by $20\%$ or fall by $20\%$. The risk-free rate of interest is $8\%$ p.a. continuously compounded (given $e^{0.02} = 1.0202$). 

**Find the value of a 3-month Call option under the Risk-Neutral method at a strike price of ₹160.**

##### Solution:
##### 1) Identify Inputs
* Current Stock Price ($S_0$) = ₹150
* Up-state price: $S_u = 150 \times (1 + 0.20) = ₹180$
* Down-state price: $S_d = 150 \times (1 - 0.20) = ₹120$
* Strike Price ($X$) = ₹160
* Risk-free Rate ($r$) = $8\%$ p.a. = $0.08$
* Time ($t$) = 3 months = 0.25 years
* Continuous compounding discount factor: $e^{rt} = e^{0.08 \times 0.25} = e^{0.02} = 1.0202$

##### 2) Calculate Payoffs at Expiry
* $C_u = \max(0, 180 - 160) = ₹20$
* $C_d = \max(0, 120 - 160) = ₹0$

##### 3) Calculate Risk-Neutral Probability of Up-move ($p$)
Using continuous compounding:
$$p = \frac{e^{rt} - d}{u - d}$$
Here, the up-factor $u = 1.20$ and down-factor $d = 0.80$.
Alternatively, using prices:
$$S_0 \cdot e^{rt} = p \cdot S_u + (1-p) \cdot S_d$$
$$150 \times 1.0202 = p \times 180 + (1-p) \times 120$$
$$153.03 = 180p + 120 - 120p$$
$$33.03 = 60p \implies p = $\frac{33.03}{60} = 0.5505$$
Thus, probability of down-move ($1-p$) = $1 - 0.5505 = 0.4495$.

##### 4) Calculate Option Price Today ($C_0$)
$$C_0 = e^{-rt} \times [p \cdot C_u + (1-p) \cdot C_d]$$
$$C_0 = \frac{1}{1.0202} \times [(0.5505 \times 20) + (0.4495 \times 0)]$$
$$C_0 = \frac{11.01}{1.0202} \approx ₹10.79$$

---

#### Problem 5 (Put-Call Parity Valuation)
Determine the value of a 3-month Put option on a stock when:
* The current stock price is ₹400.
* A 3-month Call option with a strike price ($X$) of ₹400 is trading at ₹12 in the market.
* Evaluate the Put option value under two interest rate structures:
  1. Risk-free interest rate is $10\%$ p.a. (using simple discrete interest).
  2. Continuous risk-free rate is $8\%$ p.a. (given $e^{-0.02} = 0.9802$).

##### Solution:
The Put-Call Parity (PCP) theorem states:
$$\text{Value of Call} + P.V. \text{ of Strike Price } (X) = \text{Value of Put} + \text{Stock Price } (S_0)$$
Rearranging to solve for Put ($P_0$):
$$P_0 = C_0 + P.V.(X) - S_0$$

##### Case 1: Simple Interest Rate of $10\%$ p.a.
* $C_0 = ₹12$, $S_0 = ₹400$, $X = ₹400$
* Time ($t$) = 3/12 = 0.25 years
* $P.V.(X) = $\frac{X}{1 + r \cdot t} = $\frac{400}{1 + (0.10 \times 0.25)} = $\frac{400}{1.025} \approx ₹390.24$
* Apply PCP:
  $$P_0 = 12 + 390.24 - 400 = ₹2.24$$

##### Case 2: Continuous Risk-Free Rate of $8\%$ p.a.
* $C_0 = ₹12$, $S_0 = ₹400$, $X = ₹400$, $r = 0.08$, $t = 0.25$
* $P.V.(X) = X \cdot e^{-rt} = 400 \cdot e^{-(0.08 \times 0.25)} = 400 \cdot e^{-0.02}$
* Given $e^{-0.02} = 0.9802$ (or $1/1.0202 \approx 0.9802$):
  $$P.V.(X) = 400 \times 0.9802 = ₹392.08$$
* Apply PCP:
  $$P_0 = 12 + 392.08 - 400 = ₹4.08$$

---

#### Problem 6 (2-Period Binomial Model)
Consider a two-period European call option on the stock of ABC Ltd. with a strike price of ₹98. The current price of the stock is ₹100. Over each of the next two years, the stock price is expected to either increase by $10\%$ or decrease by $10\%$. The risk-free rate of interest is $5\%$ per annum continuously compounded. Given $e^{0.05} = 1.05127$.

**Calculate:**
1. The stock prices at each node of the 2-period binomial tree.
2. The risk-neutral probabilities for up and down movements.
3. The expected option payoffs at year 2.
4. The value of the option today (at Node 0).

##### Solution:
##### 1) Create Stock Price Tree
* $S_0 = 100$
* Year 1:
  * Up-state: $S_u = 100 \times 1.10 = ₹110$
  * Down-state: $S_d = 100 \times 0.90 = ₹90$
* Year 2:
  * Node $S_{uu}$ (two up moves): $110 \times 1.10 = ₹121$
  * Node $S_{ud}$ (one up, one down): $110 \times 0.90 = ₹99$
  * Node $S_{dd}$ (two down moves): $90 \times 0.90 = ₹81$

##### 2) Calculate Risk-Neutral Probability ($p$)
The up-factor $u = 1.10$, down-factor $d = 0.90$. Continuous risk-free rate factor $e^{rt} = e^{0.05 \times 1} = 1.05127$.
$$p = \frac{e^{rt} - d}{u - d} = $\frac{1.05127 - 0.90}{1.10 - 0.90} = $\frac{0.15127}{0.20} = 0.75635$$
Therefore, risk-neutral probability of down-move ($1-p$) = $1 - 0.75635 = 0.24365$.

##### 3) Calculate Option Payoffs at Maturity (Year 2)
Strike price $X = ₹98$.
* At Node $S_{uu} = ₹121$:
  $$C_{uu} = \max(0, 121 - 98) = ₹23.00$$
* At Node $S_{ud} = ₹99$:
  $$C_{ud} = \max(0, 99 - 98) = ₹1.00$$
* At Node $S_{dd} = ₹81$:
  $$C_{dd} = \max(0, 81 - 98) = ₹0.00$$

##### 4) Discount Back to Year 1 (Nodes $N_u$ and $N_d$)
* **Value of option at Node $N_u$ (where Stock price is ₹110):**
  $$C_u = e^{-rt} \times [p \cdot C_{uu} + (1-p) \cdot C_{ud}]$$
  $$C_u = e^{-0.05} \times [(0.75635 \times 23.00) + (0.24365 \times 1.00)]$$
  $$C_u = \frac{1}{1.05127} \times [17.39605 + 0.24365] = $\frac{17.6397}{1.05127} \approx ₹16.78$$
* **Value of option at Node $N_d$ (where Stock price is ₹90):**
  $$C_d = e^{-rt} \times [p \cdot C_{ud} + (1-p) \cdot C_{dd}]$$
  $$C_d = e^{-0.05} \times [(0.75635 \times 1.00) + (0.24365 \times 0)]$$
  $$C_d = \frac{0.75635}{1.05127} \approx ₹0.72$$

##### 5) Discount Back to Today (Node 0)
* **Value of option today ($C_0$):**
  $$C_0 = e^{-rt} \times [p \cdot C_u + (1-p) \cdot C_d]$$
  $$C_0 = e^{-0.05} \times [(0.75635 \times 16.78) + (0.24365 \times 0.72)]$$
  $$C_0 = \frac{1}{1.05127} \times [12.69155 + 0.17543] = $\frac{12.86698}{1.05127} \approx ₹12.24$$

**Value of Call Option Today = ₹12.24**

---

#### Problem 7 (Replicating Portfolio / Delta Hedging vs Risk Neutral)
The following information is available for OMNI Ltd.:
* Current stock price ($S_0$) = ₹420
* Strike price ($X$) = ₹450
* Expected stock price in 3 months: Up-state ($S_u$) = ₹525, Down-state ($S_d$) = ₹378.
* Continuous risk-free rate of interest = $8\%$ p.a. (given $e^{0.02} = 1.0202$, $e^{-0.02} = 0.9802$).

**Required:**
1. Calculate the value of the 3-month Call option today using the Binomial Delta Hedging Method. Show how an investor can set up a risk-free portfolio (Hedge Ratio) and maintain a riskless position.
2. Value the option using the Risk-Neutral Method and verify if the values are identical.

##### Solution:
##### 1) Binomial Delta Hedging (Replicating Portfolio)
The Delta ($\Delta$) or Hedge Ratio is the number of shares of stock to buy per short option to make the portfolio risk-free.
$$\Delta = \frac{C_u - C_d}{S_u - S_d}$$

###### Step A: Calculate Payoffs at Expiry
* $C_u = \max(0, 525 - 450) = ₹75$
* $C_d = \max(0, 378 - 450) = ₹0$

###### Step B: Calculate Hedge Ratio ($\Delta$)
$$\Delta = \frac{75 - 0}{525 - 378} = $\frac{75}{147} \approx 0.5102 \text{ shares}$$
This means the investor creates a riskless hedge by:
* Buying $0.5102$ shares of stock.
* Writing (selling) $1$ Call option.

###### Step C: Prove Portfolio Value is Riskless at Expiry
* **If stock goes up to ₹525:**
  $$\text{Portfolio Value } (V_u) = \text{Value of shares} - \text{Option payoff}$$
  $$V_u = (0.5102 \times 525) - 75 = 267.855 - 75 = ₹192.86$$
* **If stock goes down to ₹378:**
  $$\text{Portfolio Value } (V_d) = \text{Value of shares} - \text{Option payoff}$$
  $$V_d = (0.5102 \times 378) - 0 = ₹192.86$$
Since the portfolio payoff is ₹192.86 in both states, it is riskless.

###### Step D: Present Value of the Hedge Portfolio
The present value of the risk-free portfolio must be discounted at the risk-free rate:
$$V_0 = V_{expiry} \times e^{-rt} = 192.86 \times e^{-0.08 \times 0.25} = 192.86 \times 0.9802 \approx ₹189.04$$

###### Step E: Calculate Option Value Today ($C_0$)
The cost to set up the hedge portfolio today is:
$$V_0 = (\Delta \times S_0) - C_0$$
$$189.04 = (0.5102 \times 420) - C_0$$
$$189.04 = 214.28 - C_0 \implies C_0 = 214.28 - 189.04 = ₹25.24$$

##### 2) Risk-Neutral Method Verification
###### Step A: Find Risk-Neutral Probability ($p$)
$$S_0 \cdot e^{rt} = p \cdot S_u + (1-p) \cdot S_d$$
$$420 \times 1.0202 = p \times 525 + (1-p) \times 378$$
$$428.484 = 525p + 378 - 378p$$
$$50.484 = 147p \implies p = $\frac{50.484}{147} \approx 0.3434$$
Probability of down-move ($1-p$) = $1 - 0.3434 = 0.6566$.

###### Step B: Calculate option price today ($C_0$)
$$C_0 = e^{-rt} \times [p \cdot C_u + (1-p) \cdot C_d]$$
$$C_0 = 0.9802 \times [(0.3434 \times 75) + (0.6566 \times 0)]$$
$$C_0 = 0.9802 \times 25.755 \approx ₹25.24$$
**Conclusion:** Both methods yield the identical Call option price of **₹25.24**.

---

#### Problem 8 (Black-Scholes Model with Dividend Adjustment)
A stock is currently trading at ₹550. A European call option exercisable in 92 days has a strike price of ₹500. The standard deviation of continuously compounded returns of the stock is estimated to be $17.94\%$ per year. The annualized Treasury bill rate (risk-free rate) is $6\%$ p.a.

**Calculate the value of the Call option and Put option today, assuming:**
1. No dividends are paid during the option's life.
2. A dividend of ₹11.50 is expected to be paid in 30 days.

*Given data:*
* $t = 92 \text{ days} = 0.252$ years
* $e^{-rt} = e^{-0.06 \times 0.252} = e^{-0.0151} = 0.985$
* $\ln(1.1) = 0.0953$, $\ln(1.0771) = 0.07427$
* For No Dividend case: $d_1 = 1.27 \implies N(d_1) = 0.8980$, $d_2 = 1.18 \implies N(d_2) = 0.8810$
* For Dividend case: $d_1 = 0.95 \implies N(d_1) = 0.8289$ (using one tail value $0.1711$ as $1 - 0.1711 = 0.8289$), $d_2 = 0.86 \implies N(d_2) = 0.8051$ (using one tail value $0.1949$ as $1 - 0.1949 = 0.8051$).

##### Solution:

##### Case 1: No Dividend Paid during Option Life
Using standard BSM formula:
$$C_0 = S_0 \cdot N(d_1) - X \cdot e^{-rt} \cdot N(d_2)$$
* $S_0 = 550$
* $X = 500$
* $e^{-rt} = 0.985$
* $N(d_1) = 0.8980$
* $N(d_2) = 0.8810$

###### Step A: Calculate Call Price ($C_0$)
$$C_0 = [550 \times 0.8980] - [500 \times 0.985 \times 0.8810]$$
$$C_0 = 493.90 - [492.50 \times 0.8810]$$
$$C_0 = 493.90 - 433.89 = ₹60.01$$

###### Step B: Calculate Put Price ($P_0$) using Put-Call Parity
$$P_0 = C_0 + X \cdot e^{-rt} - S_0$$
$$P_0 = 60.01 + (500 \times 0.985) - 550$$
$$P_0 = 60.01 + 492.50 - 550 = ₹2.51$$

---

##### Case 2: Dividend of ₹11.50 Paid in 30 Days
When a dividend is paid during the option's life, we must deduct the present value of the dividend ($PV(D)$) from the current stock price ($S_0$) to get the adjusted stock price ($S_0^*$).

###### Step A: Calculate Present Value of Dividend ($PV(D)$)
The dividend is paid in 30 days. Let $t_d = 30/365 \approx 0.0822$ years.
$$PV(D) = D \cdot e^{-r \cdot t_d} = 11.50 \cdot e^{-0.06 \times 0.0822} = 11.50 \cdot e^{-0.0049}$$
Given $e^{-0.0049} = 0.9951$:
$$PV(D) = 11.50 \times 0.9951 = ₹11.44$$

###### Step B: Calculate Adjusted Stock Price ($S_0^*$)
$$S_0^* = S_0 - PV(D) = 550 - 11.44 = ₹538.56$$

###### Step C: Calculate Adjusted Call Price ($C_0^*$)
Using the adjusted parameters (where adjusted $d_1 = 0.95$, $d_2 = 0.86$, $N(d_1) = 0.8289$, $N(d_2) = 0.8051$):
$$C_0^* = S_0^* \cdot N(d_1) - X \cdot e^{-rt} \cdot N(d_2)$$
$$C_0^* = [538.56 \times 0.8289] - [500 \times 0.985 \times 0.8051]$$
$$C_0^* = 446.41 - [492.50 \times 0.8051] = 446.41 - 396.51 = ₹49.90$$

###### Step D: Calculate Adjusted Put Price ($P_0^*$)
Using Put-Call Parity with adjusted stock price:
$$P_0^* = C_0^* + X \cdot e^{-rt} - S_0^*$$
$$P_0^* = 49.90 + 492.50 - 538.56 = ₹3.84$$

**Summary of Prices:**
* **No Dividend Case:** Call = ₹60.01, Put = ₹2.51
* **Dividend Case:** Call = ₹49.90, Put = ₹3.84
