# Chapter 9: Derivatives - Options
## Advanced Level Question Bank

---

### Question 1: Black-Scholes-Merton Model with Dividend Adjustment
**Problem Statement:**
A stock is currently trading at ₹550. A call option exercisable in 92 days has an exercise price of ₹500. The standard deviation of the continuously compounded returns of the stock is estimated to be $17.94\%$ per year ($\sigma = 0.1794$). The annualized risk-free Treasury bill rate corresponding to this option life is $6\%$ p.a. ($r = 0.06$). 
1. Calculate the value of the 92-day Call Option and Put Option today using the Black-Scholes-Merton (BSM) model assuming no dividends.
2. If a dividend of ₹11.50 is expected to be paid in 30 days from today, recalculate the value of the 92-day Call Option today.

*Given data:*
*   $T = 92 / 365 = 0.2520$ years
*   Time to dividend $t_d = 30 / 365 = 0.0822$ years
*   $e^{-r T} = e^{-0.06 \times 0.2520} = e^{-0.01512} \approx 0.9850$
*   $e^{-r t_d} = e^{-0.06 \times 0.0822} = e^{-0.00493} \approx 0.9951$
*   $\ln(1.10) = 0.0953$, $\ln(1.0771) = 0.07427$
*   $N(1.18) = 0.8810$, $N(1.00) = 0.8413$, $N(1.27) = 0.8980$, $N(1.09) = 0.8621$
*   $N(1.04) = 0.8508$, $N(0.95) = 0.8289$ (using cumulative normal distribution values: $1 - \text{one-tail value}$)

---

#### Solution:

#### Part 1: Valuation of Call and Put Option (No Dividends)
The Black-Scholes formula for a European Call option ($C_0$) is:
$$C_0 = S_0 \cdot N(d_1) - X \cdot e^{-r T} \cdot N(d_2)$$

Where:
$$d_1 = \frac{\ln(S_0 / X) + \left(r + \frac{\sigma^2}{2}\right)T}{\sigma \sqrt{T}}$$
$$d_2 = d_1 - \sigma \sqrt{T}$$

**Step 1: Compute $d_1$ and $d_2$**
*   $\ln(S_0 / X) = \ln(550 / 500) = \ln(1.10) = 0.0953$
*   $\sigma^2 = 0.1794^2 = 0.03218$
*   $r + \frac{\sigma^2}{2} = 0.06 + \frac{0.03218}{2} = 0.06 + 0.01609 = 0.07609$
*   $\left(r + \frac{\sigma^2}{2}\right)T = 0.07609 \times 0.2520 = 0.01917$
*   $\sigma \sqrt{T} = 0.1794 \times \sqrt{0.2520} = 0.1794 \times 0.5020 = 0.09006$

Now, substitute these into the formula for $d_1$:
$$d_1 = \frac{0.0953 + 0.01917}{0.09006} = $\frac{0.11447}{0.09006} \approx 1.27$$

Calculate $d_2$:
$$d_2 = d_1 - \sigma \sqrt{T} = 1.27 - 0.09006 \approx 1.18$$

**Step 2: Obtain Cumulative Normal Probabilities**
From the given data:
*   $N(d_1) = N(1.27) = 0.8980$
*   $N(d_2) = N(1.18) = 0.8810$

**Step 3: Calculate the Call Option Value ($C_0$)**
$$C_0 = 550 \times 0.8980 - 500 \times e^{-0.06 \times 0.2520} \times 0.8810$$
$$C_0 = 493.90 - 500 \times 0.9850 \times 0.8810$$
$$C_0 = 493.90 - 492.50 \times 0.8810$$
$$C_0 = 493.90 - 433.89 = ₹60.01$$

**Step 4: Calculate the Put Option Value ($P_0$) using Put-Call Parity**
Under Put-Call Parity:
$$C_0 + X \cdot e^{-r T} = S_0 + P_0$$
$$P_0 = C_0 + X \cdot e^{-r T} - S_0$$
$$P_0 = 60.01 + 500 \times 0.9850 - 550$$
$$P_0 = 60.01 + 492.50 - 550 = 552.51 - 550 = ₹2.51$$

*(Alternatively, calculating directly using BSM Put formula gives the same result: $P_0 = X e^{-r T} N(-d_2) - S_0 N(-d_1)$ where $N(-1.18) = 1 - 0.8810 = 0.1190$ and $N(-1.27) = 1 - 0.8980 = 0.1020$.)*

---

#### Part 2: Valuation of Call Option with Dividend Adjustment
When a discrete dividend $D$ is paid during the life of the option, we must adjust the stock price by subtracting the present value of the dividend from the current stock price.
$$S_0^* = S_0 - D \cdot e^{-r t_d}$$

Where:
*   $D = ₹11.50$
*   $t_d = 30/365 = 0.0822$ years
*   $e^{-r t_d} = 0.9951$

**Step 1: Compute Adjusted Stock Price ($S_0^*$)**
$$S_0^* = 550 - 11.50 \times 0.9951 = 550 - 11.44 = ₹538.56$$

**Step 2: Compute new $d_1$ and $d_2$ using $S_0^*$**
$$d_1 = \frac{\ln(S_0^* / X) + \left(r + \frac{\sigma^2}{2}\right)T}{\sigma \sqrt{T}}$$
*   $\ln(S_0^* / X) = \ln(538.56 / 500) = \ln(1.0771) = 0.07427$
*   $\left(r + \frac{\sigma^2}{2}\right)T = 0.01917$
*   $\sigma \sqrt{T} = 0.09006$

$$d_1 = \frac{0.07427 + 0.01917}{0.09006} = $\frac{0.09344}{0.09006} \approx 1.04$$
$$d_2 = d_1 - \sigma \sqrt{T} = 1.04 - 0.09006 \approx 0.95$$

**Step 3: Obtain Cumulative Normal Probabilities**
*   $N(d_1) = N(1.04) = 0.8508$
*   $N(d_2) = N(0.95) = 0.8289$

**Step 4: Calculate Adjusted Call Option Value ($C_0^*$)**
$$C_0^* = S_0^* \cdot N(d_1) - X \cdot e^{-r T} \cdot N(d_2)$$
$$C_0^* = 538.56 \times 0.8508 - 500 \times 0.9850 \times 0.8289$$
$$C_0^* = 458.21 - 492.50 \times 0.8289$$
$$C_0^* = 458.21 - 408.23 = ₹49.98$$

**Conclusion:**
The dividend payment of ₹11.50 reduces the stock price on the ex-dividend date, which consequently lowers the call option value today from ₹60.01 to ₹49.98.

---

### Question 2: Two-Period American Call Option Valuation (Binomial Tree)
**Problem Statement:**
Consider a two-year American call option on the stock of ABC Ltd. with a strike price of ₹98. The current market price of the stock is ₹100. The risk-free rate of interest is $5\%$ per annum with continuous compounding ($r = 0.05$). Assume two time periods of one year each ($t = 1$ year per step). The stock price can either increase by $10\%$ ($u = 1.10$) or decrease by $10\%$ ($d = 0.90$) at each node. 
1. Construct the binomial stock price tree.
2. Determine the probability of an up-move ($p$) and down-move ($1-p$) under the Risk-Neutral framework.
3. Calculate the value of the American call option today using the binomial model, keeping in mind the possibility of early exercise.
*Given:* $e^{0.05} = 1.05127$, $e^{-0.05} = 0.95123$.

---

#### Solution:

#### Step 1: Construct the Binomial Stock Price Tree
*   **Today (Year 0):** $S_0 = ₹100$
*   **Year 1 Nodes:**
    *   Up node ($S_u$): $S_0 \times u = 100 \times 1.10 = ₹110$
    *   Down node ($S_d$): $S_0 \times d = 100 \times 0.90 = ₹90$
*   **Year 2 Nodes (Maturity):**
    *   Double Up node ($S_{uu}$): $S_u \times u = 110 \times 1.10 = ₹121$
    *   Up-Down node ($S_{ud}$ or $S_{du}$): $S_u \times d = 110 \times 0.90 = ₹99$
    *   Double Down node ($S_{dd}$): $S_d \times d = 90 \times 0.90 = ₹81$

#### Step 2: Compute Risk-Neutral Probabilities
The risk-neutral probability of an up-move $p$ is calculated as:
$$p = \frac{e^{r t} - d}{u - d}$$

Substitute $e^{r t} = e^{0.05 \times 1} = 1.05127$, $u = 1.10$, and $d = 0.90$:
$$p = \frac{1.05127 - 0.90}{1.10 - 0.90} = $\frac{0.15127}{0.20} = 0.75635 \text{ (or } 75.64\% \text{)}$$
$$1 - p = 1 - 0.75635 = 0.24365 \text{ (or } 24.36\% \text{)}$$

#### Step 3: Value the Option at Maturity (Year 2 Nodes)
Since it is a call option with strike $X = 98$, the value at maturity is $C_2 = \max(S_2 - X, 0)$:
*   **Node $N_{uu}$ (S = 121):** $C_{uu} = \max(121 - 98, 0) = ₹23.00$
*   **Node $N_{ud}$ (S = 99):** $C_{ud} = \max(99 - 98, 0) = ₹1.00$
*   **Node $N_{dd}$ (S = 81):** $C_{dd} = \max(81 - 98, 0) = ₹0.00$

#### Step 4: Backward Induction to Year 1 (Check for Early Exercise)
Since the option is **American**, at each intermediate node we compare the value from holding the option (discounted expected payoff) with the value of immediate exercise.
Option Value at Node $= \max(\text{Intrinsic Value}, \text{Hold Value})$

*   **At Node $N_u$ (S = 110):**
    *   **Intrinsic Value (Immediate Exercise):** $S_u - X = 110 - 98 = ₹12.00$
    *   **Hold Value (Discounted expected value of Year 2 nodes):**
        $$Hold_u = e^{-r t} \cdot [p \cdot C_{uu} + (1 - p) \cdot C_{ud}]$$
        $$Hold_u = 0.95123 \times [0.75635 \times 23.00 + 0.24365 \times 1.00]$$
        $$Hold_u = 0.95123 \times [17.396 + 0.244] = 0.95123 \times 17.640 = ₹16.78$$
    *   **Decision at $N_u$:** Compare Intrinsic Value (₹12.00) vs Hold Value (₹16.78). 
    *   Since Hold Value is higher, the option value at $N_u$ is **₹16.78** (Do not exercise early).

*   **At Node $N_d$ (S = 90):**
    *   **Intrinsic Value (Immediate Exercise):** $S_d - X = 90 - 98 = -₹8.00 \rightarrow ₹0.00$
    *   **Hold Value:**
        $$Hold_d = e^{-r t} \cdot [p \cdot C_{ud} + (1 - p) \cdot C_{dd}]$$
        $$Hold_d = 0.95123 \times [0.75635 \times 1.00 + 0.24365 \times 0.00]$$
        $$Hold_d = 0.95123 \times 0.75635 = ₹0.72$$
    *   **Decision at $N_d$:** Compare Intrinsic Value (₹0.00) vs Hold Value (₹0.72).
    *   The option value at $N_d$ is **₹0.72** (Do not exercise early).

#### Step 5: Value the Option Today (Year 0)
*   **Intrinsic Value (Immediate Exercise):** $S_0 - X = 100 - 98 = ₹2.00$
*   **Hold Value:**
    $$Hold_0 = e^{-r t} \cdot [p \cdot C_u + (1 - p) \cdot C_d]$$
    $$Hold_0 = 0.95123 \times [0.75635 \times 16.78 + 0.24365 \times 0.72]$$
    $$Hold_0 = 0.95123 \times [12.692 + 0.175] = 0.95123 \times 12.867 = ₹12.24$$
*   **Decision today:** Compare Intrinsic Value (₹2.00) vs Hold Value (₹12.24).
*   The option value today is **₹12.24** (Do not exercise early).

**Conclusion:**
The value of the 2-year American call option today is ₹12.24. Early exercise is not optimal at any node.

---

### Question 3: Delta Hedging, Replicating Portfolio, and Risk-Neutral Equivalency
**Problem Statement:**
The current market price of an equity share of OMNI Ltd is ₹420. Within a period of 3 months, the price is expected to either rise to ₹525 or fall to ₹378. A call option is available with a strike price of ₹450. The continuously compounded risk-free rate of interest is $8\%$ p.a. ($r = 0.08$).
1. Calculate the value of the 3-month call option today using the Binomial Replicating Portfolio (Delta Hedging) method. Clearly show:
    *   The option delta ($\Delta$).
    *   The amount of risk-free borrowing required to replicate the option.
2. Value the call option using the Risk-Neutral Valuation method and show that the two approaches yield identical results.
3. Show how an investor can set up a riskless hedge today, and demonstrate how this hedge remains riskless regardless of whether the stock price rises or falls.
*Given:* $e^{0.02} = 1.0202$, $e^{-0.02} = 0.9802$.

---

#### Solution:

#### Part 1: Binomial Replicating Portfolio Method
A replicating portfolio consists of buying $\Delta$ shares of stock and borrowing $B$ at the risk-free rate to replicate the option's payoffs at maturity.
*   $S_u = 525 \Rightarrow C_u = \max(525 - 450, 0) = ₹75$
*   $S_d = 378 \Rightarrow C_d = \max(378 - 450, 0) = ₹0$

**Step 1: Calculate Delta ($\Delta$)**
The hedge ratio or delta is:
$$\Delta = \frac{C_u - C_d}{S_u - S_d} = $\frac{75 - 0}{525 - 378} = $\frac{75}{147} \approx 0.5102$$
This means the replicating portfolio requires buying $0.5102$ shares of stock.

**Step 2: Calculate Borrowing ($B$)**
The portfolio value must equal the option payoff at maturity under both states:
1.  In Up State: $\Delta \cdot S_u - B \cdot e^{r t} = C_u \Rightarrow 0.5102 \times 525 - B \cdot e^{0.02} = 75$
    $$267.86 - B \times 1.0202 = 75 \Rightarrow B \times 1.0202 = 192.86 \Rightarrow B = $\frac{192.86}{1.0202} \approx ₹189.04$$
2.  In Down State (Verification): $\Delta \cdot S_d - B \cdot e^{r t} = C_d \Rightarrow 0.5102 \times 378 - B \cdot e^{0.02} = 0$
    $$192.86 - B \times 1.0202 = 0 \Rightarrow B = $\frac{192.86}{1.0202} \approx ₹189.04$$

**Step 3: Calculate the Value of the Call Option Today ($C_0$)**
The cost of establishing the replicating portfolio is:
$$C_0 = \Delta \cdot S_0 - B$$
$$C_0 = 0.5102 \times 420 - 189.04 = 214.28 - 189.04 = ₹25.24$$

---

#### Part 2: Risk-Neutral Valuation Method
Under the risk-neutral approach, we calculate the probability of an up-move ($p$):
$$p = \frac{e^{r t} - d}{u - d}$$

First, calculate $u$ and $d$:
*   $u = \frac{S_u}{S_0} = $\frac{525}{420} = 1.25$
*   $d = \frac{S_d}{S_0} = $\frac{378}{420} = 0.90$
*   $e^{r t} = e^{0.08 \times 0.25} = e^{0.02} = 1.0202$

Now calculate $p$:
$$p = \frac{1.0202 - 0.90}{1.25 - 0.90} = $\frac{0.1202}{0.35} \approx 0.3434$$
$$1 - p = 1 - 0.3434 = 0.6566$$

Discount the expected payoff:
$$C_0 = e^{-r t} \cdot [p \cdot C_u + (1-p) \cdot C_d]$$
$$C_0 = 0.9802 \times [0.3434 \times 75 + 0.6566 \times 0]$$
$$C_0 = 0.9802 \times 25.755 = ₹25.24$$

**Conclusion:** Both methods yield exactly **₹25.24**.

---

#### Part 3: Maintaining the Delta Hedge
To construct a riskless hedge, an investor writes (sells) 1 call option and purchases $\Delta$ shares of stock. 
*   **Initial Cash Flow (T=0):**
    *   Buy $0.5102$ shares at ₹420: $-₹214.28$
    *   Sell 1 Call Option at premium ₹25.24: $+₹25.24$
    *   Net cash outflow: $-₹189.04$ (financed by borrowing ₹189.04 at risk-free rate of $8\%$).

*   **Payoff at Maturity (T = 3 Months):**
    *   The borrowing of ₹189.04 grows to: $189.04 \times e^{0.02} = ₹192.86$.

Let us examine the net payoff at maturity under both states:

| Portfolio Component | Up State ($S_T = ₹525$) | Down State ($S_T = ₹378$) |
| :--- | :--- | :--- |
| **Value of 0.5102 shares** | $0.5102 \times 525 = +₹267.86$ | $0.5102 \times 378 = +₹192.86$ |
| **Payoff on Short Call Option** | $-C_u = -₹75.00$ | $-C_d = ₹0.00$ |
| **Repayment of Borrowing** | $-₹192.86$ | $-₹192.86$ |
| **Net Portfolio Value** | **₹0.00** | **₹0.00** |

As demonstrated, the portfolio payoff is exactly ₹0.00 in both states, making the position riskless.

---

### Question 4: Put-Call Parity, Mispricing, and Arbitrage
**Problem Statement:**
The shares of Alpha Ltd are currently quoting at ₹400 in the spot market. A 3-month Call option with a strike price of ₹400 is trading at a premium of ₹12. The continuously compounded risk-free rate is $8\%$ p.a.
1. Determine the theoretical value of a 3-month Put option with a strike price of ₹400 using the Put-Call Parity theorem.
2. If the 3-month Put option is actually trading at ₹9 in the market:
    *   Identify if an arbitrage opportunity exists.
    *   Formulate a detailed arbitrage strategy today.
    *   Construct a cash-flow statement today and at maturity (across various possible stock prices) to demonstrate the arbitrage profit.
*Given:* $e^{-0.02} = 0.9802$.

---

#### Solution:

#### Part 1: Theoretical Value of the Put Option
Using the Put-Call Parity formula:
$$C_0 + X \cdot e^{-r T} = S_0 + P_0$$

Where:
*   $S_0 = 400$
*   $X = 400$
*   $C_0 = 12$
*   $r = 0.08$
*   $T = 0.25$
*   $X \cdot e^{-r T} = 400 \times e^{-0.08 \times 0.25} = 400 \times e^{-0.02} = 400 \times 0.9802 = ₹392.08$

Calculate theoretical $P_0$:
$$12 + 392.08 = 400 + P_0$$
$$404.08 = 400 + P_0 \Rightarrow P_0 = ₹4.08$$

---

#### Part 2: Arbitrage Strategy & Analysis
The market price of the Put option ($P_{mkt} = ₹9$) is higher than the theoretical price ($P_{theo} = ₹4.08$). The Put option is **overvalued** in the market.
Therefore, we must **sell the Put option** (overvalued asset) and buy the replicating portfolio.

**Arbitrage Strategy Today (T=0):**
1.  **Sell (Write) the Put Option** at $₹9$ (receive premium).
2.  **Buy the Call Option** at $₹12$ (pay premium).
3.  **Sell (Short) the Stock** in the spot market at $₹400$ (receive cash).
4.  **Lend** the net cash proceeds at the risk-free rate of $8\%$ p.a. for 3 months.

**Net Cash Inflow today (to be lent):**
*   Short Stock: $+₹400.00$
*   Write Put: $+₹9.00$
*   Buy Call: $-₹12.00$
*   **Net Cash Invested (Lent):** $+₹397.00$

At maturity (T = 3 months), the lent funds grow to:
$$\text{Lent Amount Value} = 397.00 \times e^{0.08 \times 0.25} = 397.00 \times e^{0.02} = 397.00 \times 1.0202 = ₹405.02$$

---

#### Cash Flow Analysis at Maturity (T = 3 Months)
Let us evaluate the cash flows under two possible market outcomes: $S_T < ₹400$ and $S_T \ge ₹400$.

#### Case A: Stock Price falls to $S_T = ₹350$ (Below Strike Price)
*   **Lent Investment Maturity Value:** $+₹405.02$
*   **Long Call Option (Strike 400):** Expires worthless ($₹0.00$).
*   **Short Put Option (Strike 400):** The buyer will exercise the put. You must buy the stock from him at the strike price of $₹400$. Cash outflow is $-₹400.00$. You now own the stock.
*   **Cover Short Stock Position:** Deliver the stock you just purchased to close out your short stock position. Cash outflow is $₹0.00$.
*   **Net Cash Flow at Maturity:** $405.02 - 400.00 = +₹5.02$.

#### Case B: Stock Price rises to $S_T = ₹450$ (Above Strike Price)
*   **Lent Investment Maturity Value:** $+₹405.02$
*   **Short Put Option (Strike 400):** Expires worthless ($₹0.00$).
*   **Long Call Option (Strike 400):** You exercise the call. You buy the stock at the strike price of $₹400$. Cash outflow is $-₹400.00$. You now own the stock.
*   **Cover Short Stock Position:** Deliver the stock you just purchased to close out your short stock position. Cash outflow is $₹0.00$.
*   **Net Cash Flow at Maturity:** $405.02 - 400.00 = +₹5.02$.

**Arbitrage Summary Table:**

| Transaction / Position | Cash Flow Today (T=0) | Cash Flow at Maturity (T=3m) if $S_T < 400$ | Cash Flow at Maturity (T=3m) if $S_T \ge 400$ |
| :--- | :--- | :--- | :--- |
| **Short Spot Stock** | $+₹400.00$ | Deliver Share | Deliver Share |
| **Buy Call Option ($X=400$)** | $-₹12.00$ | Expires Worthless ($0$) | Exercise Call (Buy Stock at $-₹400.00$) |
| **Write Put Option ($X=400$)** | $+₹9.00$ | Put Exercised (Buy Stock at $-₹400.00$) | Expires Worthless ($0$) |
| **Lend / Borrow net proceeds** | $-₹397.00$ | $+₹405.02$ | $+₹405.02$ |
| **Net Arbitrage Profit** | **₹0.00** | **+₹5.02** | **+₹5.02** |

The arbitrageur locks in a guaranteed risk-free profit of **₹5.02** per share today, payable at maturity.

---

### Question 5: Advanced Options Strategy - Long Strangle
**Problem Statement:**
Fresh Bakery Ltd's share price is currently ₹51. The market expects high volatility due to a potential merger announcement. If the merger is approved, the share price will skyrocket. If rejected, it will crash. 
To profit from this, an option trader establishes a **Strangle** by purchasing:
1.  One 3-month Call option with a strike price of ₹52 at a premium of ₹2.
2.  One 3-month Put option with a strike price of ₹50 at a premium of ₹1.
The contract size (lot size) is 50 shares.

**Required:**
1.  Define a Strangle strategy and explain why it is chosen over a Straddle.
2.  Calculate the total initial cost of the strategy for 1 lot.
3.  Determine the breakeven points for this strategy.
4.  Compute the net payoff and profit/loss of the trader at maturity if the stock price ends at:
    *   ₹40 (Merger fails and stock crashes)
    *   ₹46
    *   ₹50 (No movement)
    *   ₹53 (Marginal upward movement)
    *   ₹60 (Merger succeeds and stock surges)

---

#### Solution:

#### Part 1: Strategy Definition
*   **Strangle Strategy:** A long strangle involves buying an out-of-the-money (OTM) call and an out-of-the-money (OTM) put simultaneously on the same underlying asset with the same expiration date but different strike prices (Put strike < Call strike).
*   **Comparison with Straddle:** A Straddle involves buying an at-the-money (ATM) call and put with the same strike price. A Strangle is cheaper to construct because both options are OTM, meaning the total premium outlay is lower. However, it requires a larger price move in the underlying stock to reach profitability.

#### Part 2: Total Initial Cost (1 Lot)
*   Call Premium paid = ₹2 per share
*   Put Premium paid = ₹1 per share
*   Total Premium per share = $2 + 1 = ₹3$
*   Total Cost for 1 Lot (50 shares) = $50 \times ₹3 = ₹150$

#### Part 3: Breakeven Points
A strangle has two breakeven points because the stock can move sharply in either direction.
1.  **Upper Breakeven Point (UBEP):**
    $$\text{UBEP} = \text{Call Strike} + \text{Total Premium} = 52 + 3 = ₹55$$
2.  **Lower Breakeven Point (LBEP):**
    $$\text{LBEP} = \text{Put Strike} - \text{Total Premium} = 50 - 3 = ₹47$$

The trade is profitable if the stock price at maturity is either **above ₹55** or **below ₹47**.

---

#### Part 4: Payoff and Net Profit/Loss Table at Maturity

Let us calculate the net payoff per share and the total lot profit/loss for the given stock prices ($S_T$).
*   Call Payoff $= \max(S_T - 52, 0)$
*   Put Payoff $= \max(50 - S_T, 0)$
*   Net Payoff $= \text{Call Payoff} + \text{Put Payoff}$
*   Net Profit/Loss per Share $= \text{Net Payoff} - \text{Total Premium (₹3)}$
*   Total Profit/Loss per Lot $= \text{Net Profit/Loss per Share} \times 50$

| Stock Price at Expiry ($S_T$) | Call Payoff (₹) | Put Payoff (₹) | Net Payoff (₹) | Net Profit per Share (₹) | Total Profit/Loss for Lot (₹) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **₹40** | 0 | 10 | 10 | $+7$ | $+350$ (Profit) |
| **₹46** | 0 | 4 | 4 | $+1$ | $+50$ (Profit) |
| **₹50** | 0 | 0 | 0 | $-3$ | $-150$ (Max Loss) |
| **₹53** | 1 | 0 | 1 | $-2$ | $-100$ (Loss) |
| **₹60** | 8 | 0 | 8 | $+5$ | $+250$ (Profit) |

**Key Observations:**
*   At **₹50**, both options expire worthless, resulting in the maximum loss of the premium paid (₹150).
*   At **₹46**, the put pays off ₹4, yielding a net profit of ₹50 for the lot.
*   At **₹53**, the call pays off ₹1, but this does not cover the premium, leading to a net loss of ₹100 for the lot.
