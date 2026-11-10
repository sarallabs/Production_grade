Question 1
An investor buys a European Call option on a stock quoting at ₹200 with a strike price of ₹195 at a premium of ₹10, and a European Put option on the same stock with a strike price of ₹205 at a premium of ₹6. If the share price at maturity is ₹220, what is the investor's overall net profit or loss at expiry?
A. ₹25 Net Profit
B. ₹9 Net Profit
C. ₹6 Net Loss
D. ₹16 Net Loss

Correct Answer: B
Explanation: 
1. **Calculate Call Payoff:** Since the ending price $S_t = ₹220$ is greater than the call strike $X_c = ₹195$, the call is exercised. 
   $$\text{Call Payoff} = \max(0, 220 - 195) = ₹25$$
2. **Calculate Put Payoff:** Since the ending price $S_t = ₹220$ is greater than the put strike $X_p = ₹205$, the put expires worthless.
   $$\text{Put Payoff} = \max(0, 205 - 220) = ₹0$$
3. **Calculate Total Payoff:** $₹25 + ₹0 = ₹25$
4. **Calculate Total Premium Paid:** $₹10 \text{ (Call)} + ₹6 \text{ (Put)} = ₹16$
5. **Calculate Net Profit:** $\text{Total Payoff} - \text{Total Premium} = ₹25 - ₹16 = ₹9 \text{ Net Profit}$.

Question 2
The current market price of an equity share of X Ltd. is ₹400. In three months, the stock price is expected to either rise to ₹432 or fall to ₹360. If the risk-free interest rate is $12\%$ per annum continuously compounded (given $e^{0.03} = 1.0305$), what is the risk-neutral probability of a down-move in the stock price?
A. 0.725
B. 0.500
C. 0.275
D. 0.800

Correct Answer: C
Explanation: 
1. **Identify parameters:** $S_0 = 400$, $S_u = 432$, $S_d = 360$, $r = 0.12$, $t = 3/12 = 0.25$ years.
2. **Calculate risk-free factor:** $e^{rt} = e^{0.12 \times 0.25} = e^{0.03} = 1.0305$.
3. **Set up the risk-neutral valuation equation for stock price:**
   $$S_0 \cdot e^{rt} = p \cdot S_u + (1-p) \cdot S_d$$
   $$400 \times 1.0305 = p \times 432 + (1-p) \times 360$$
   $$412.2 = 432p + 360 - 360p$$
   $$412.2 - 360 = 72p$$
   $$52.2 = 72p \implies p = $\frac{52.2}{72} = 0.725$$
4. **Calculate probability of down-move:**
   $$\text{Probability of down-move} = 1 - p = 1 - 0.725 = 0.275$$.

Question 3
A stock's market price rose from ₹40 to ₹45, while the price of a corresponding 3-month Call option on that stock rose from ₹8.00 to ₹12.90. What is the Delta of the Call option?
A. -0.98
B. +0.98
C. +0.50
D. +0.60

Correct Answer: B
Explanation: 
1. **Recall Delta definition:** Delta ($\Delta$) measures the sensitivity of the option premium to changes in the underlying stock price.
   $$\text{Delta } (\Delta) = $\frac{\text{Change in Option Premium } (\Delta C)}{\text{Change in Stock Price } (\Delta S)}$$
2. **Calculate changes:**
   * $\Delta C = 12.90 - 8.00 = ₹4.90$
   * $\Delta S = 45.00 - 40.00 = ₹5.00$
3. **Calculate Delta:**
   $$\Delta = \frac{4.90}{5.00} = +0.98$$.
   Since it is a call option, the change in option price moves in the same direction as the stock price, resulting in a positive sign (+0.98).

Question 4
A 3-month European Call option with a strike price of ₹400 is trading in the market at ₹12. The current spot price of the underlying stock is ₹400. If the risk-free rate of interest is $8\%$ p.a. continuously compounded (given $e^{-0.02} = 0.9802$), what is the theoretical value of a 3-month European Put option on the same stock with a strike price of ₹400?
A. ₹2.24
B. ₹4.08
C. ₹12.00
D. ₹0.00

Correct Answer: B
Explanation: 
1. **Apply Put-Call Parity (PCP):**
   $$C_0 + X \cdot e^{-rt} = P_0 + S_0$$
2. **Rearrange for Put ($P_0$):**
   $$P_0 = C_0 + X \cdot e^{-rt} - S_0$$
3. **Substitute parameters:** $C_0 = 12$, $S_0 = 400$, $X = 400$, $e^{-rt} = e^{-0.08 \times 0.25} = e^{-0.02} = 0.9802$.
   $$P_0 = 12 + (400 \times 0.9802) - 400$$
   $$P_0 = 12 + 392.08 - 400$$
   $$P_0 = 404.08 - 400 = ₹4.08$$.

Question 5
Which of the following is NOT an assumption of the classic Black-Scholes-Merton (BSM) option pricing model?
A. Returns of the underlying stock are continuously compounded and normally distributed.
B. The options are of European exercise style.
C. The underlying stock pays a constant, predictable dividend over the option's life.
D. Short selling of stocks is permitted without any restrictions or borrowing costs.

Correct Answer: C
Explanation: 
The classic Black-Scholes-Merton model assumes that the underlying stock **does not pay any dividends** during the option's life. If the stock pays dividends, the formula must be modified (e.g., by adjusting the stock price downwards by the present value of the dividends), making statement C false as an assumption of the classic model. All other statements (A, B, and D) represent standard BSM assumptions.
