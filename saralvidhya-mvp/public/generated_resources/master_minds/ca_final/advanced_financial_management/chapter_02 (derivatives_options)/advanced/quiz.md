# Derivatives - Options

Question 1
A stock is currently trading at ₹400. In 3 months, it is expected to either rise to ₹432 or fall to ₹360. The risk-free interest rate is 12% per annum with continuous compounding. What is the value of a European Call option today with a strike price of ₹388 using the single-period binomial model? (Take $e^{0.03} \approx 1.0305$)
A. ₹31.90
B. ₹30.96
C. ₹7.47
D. ₹7.70

Correct Answer: B
Explanation: Under the Risk-Neutral Valuation Method:
1. Calculate the Risk-Free growth factor: $e^{r \times t} = e^{0.12 \times 0.25} = e^{0.03} = 1.0305$.
2. The up-move factor $u = 432 / 400 = 1.08$. The down-move factor $d = 360 / 400 = 0.90$.
3. Calculate the risk-neutral probability of an up-move ($p$):
   $$p = \frac{e^{r \times t} - d}{u - d} = \frac{1.0305 - 0.90}{1.08 - 0.90} = \frac{0.1305}{0.18} = 0.725$$
4. Calculate the option payoffs at maturity ($T$ = 3 months):
   - At $S_u$ = 432: Call Payoff ($C_u$) = $\max(432 - 388, 0)$ = ₹44.00.
   - At $S_d$ = 360: Call Payoff ($C_d$) = $\max(360 - 388, 0)$ = ₹0.00.
5. Discount the expected payoff back to today ($T$ = 0):
   $$C_0 = e^{-r \times t} \times [p \times C_u + (1-p) \times C_d]$$
   $$C_0 = \left(\frac{1}{1.0305}\right) \times [0.725 \times 44 + 0.275 \times 0] = \frac{31.90}{1.0305} = ₹30.96$$

---

Question 2
Using the data from Question 1 (where the spot price is ₹400, strike price is ₹388, risk-free factor $e^{-0.03} \approx 0.9704$, and the Call option price is ₹30.96), what is the value of a European Put option today with the same strike price and expiration date?
A. ₹31.90
B. ₹30.96
C. ₹7.47
D. ₹7.70

Correct Answer: C
Explanation: We can calculate the value of the Put option today using Put-Call Parity:
$$C_0 + X \times e^{-r \times T} = S_0 + P_0$$
From Question 1, we know $C_0 = ₹30.96$.
The strike price $X = ₹388$, $S_0 = ₹400$, and $e^{-r \times T} = e^{-0.03} = 1 / 1.0305 = 0.9704$.
Substitute these values:
$$30.96 + 388 \times 0.9704 = 400 + P_0$$
$$30.96 + 376.51 = 400 + P_0$$
$$407.47 = 400 + P_0 \implies P_0 = ₹7.47$$

Alternatively, via direct Risk-Neutral pricing:
- Put payoff at up-state = $\max(388 - 432, 0)$ = ₹0.
- Put payoff at down-state = $\max(388 - 360, 0)$ = ₹28.
- Expected Put payoff = $0.725 \times 0 + 0.275 \times 28$ = ₹7.70.
- Discounted Put value $P_0 = 7.70 / 1.0305 = ₹7.47$.

---

Question 3
An investor is analyzing a European Call option. If the underlying stock price rises from ₹40 to ₹45, and the call option price increases from ₹8.00 to ₹12.90, what is the Delta ($\Delta$) of this call option?
A. -0.98
B. +0.98
C. ₹4.90
D. Can't be determined

Correct Answer: B
Explanation: Option Delta ($\Delta$) measures the sensitivity of the option premium to changes in the underlying stock price:
$$\Delta = \frac{\text{Change in Option Price}}{\text{Change in Stock Price}}$$
$$\Delta = \frac{C_u - C_d}{S_u - S_d}$$
Given:
- Stock price changes from $S_d = ₹40$ to $S_u = ₹45$ (Change in stock price = 45 - 40 = ₹5)
- Call option price changes from $C_d = ₹8$ to $C_u = ₹12.90$ (Change in option price = 12.90 - 8 = ₹4.90)
$$\Delta = \frac{4.90}{5} = +0.98$$
Since it is a call option, the delta is positive.

---

Question 4
For a European Call option, the current stock price is ₹100, the strike price is ₹80, the risk-free rate of interest is 4% per annum, the volatility of the stock is 20% per annum, and the time to expiration is 6 months. Using the Black-Scholes-Merton model, calculate the values of $d_1$ and $d_2$. (Take $\ln(1.25) \approx 0.2231$ and $\sqrt{0.5} \approx 0.7071$)
A. d1 = 1.7724, d2 = 1.6310
B. d1 = 1.7897, d2 = 1.6483
C. d1 = 1.7548, d2 = 1.6134
D. d1 = 1.7195, d2 = 1.5781

Correct Answer: B
Explanation: According to the Black-Scholes-Merton Model:
$$d_1 = \frac{\ln(S_0 / X) + \left(r + \sigma^2 / 2\right) \times T}{\sigma \times \sqrt{T}}$$
Given:
- $S_0 = 100$, $X = 80 \implies S_0 / X = 1.25$
- $\ln(S_0 / X) = \ln(1.25) = 0.2231$
- $r = 0.04$, $\sigma = 0.20 \implies \sigma^2 = 0.04$
- $T = 6 \text{ months} = 0.5 \text{ years}$

Calculate components:
- $\left(r + \sigma^2 / 2\right) \times T = (0.04 + 0.02) \times 0.5 = 0.06 \times 0.5 = 0.03$
- $\sigma \times \sqrt{T} = 0.20 \times \sqrt{0.5} = 0.20 \times 0.7071 = 0.14142$

Now solve for $d_1$:
$$d_1 = \frac{0.2231 + 0.03}{0.14142} = \frac{0.2531}{0.14142} = 1.7897$$
Now solve for $d_2$:
$$d_2 = d_1 - \sigma \times \sqrt{T} = 1.7897 - 0.14142 = 1.6483$$
Thus, $d_1 = 1.7897$ and $d_2 = 1.6483$.

---

Question 5
Under a two-period binomial lattice for an American Call option, the stock price at the Year 1 Up-Node ($N_u$) is ₹135 and the option strike price is ₹128. If the option is held, the expected risk-neutral payoff discounted to Year 1 is ₹13.89. If the option is exercised immediately at Year 1, what is its intrinsic value, and what will be the final option value at this node ($N_u$)?
A. ₹7.00
B. ₹17.80
C. ₹13.89
D. ₹10.84

Correct Answer: C
Explanation: To find the option value at Year 1 Up-Node ($N_u$) for an American option, we must compare the Hold Value (discounted expected value of Year 2 nodes) with the Intrinsic Value (immediate exercise value).
1. Calculate risk-neutral probability $p$:
   $$p = \frac{e^{r \times t} - d}{u - d} = \frac{1.05127 - 0.92}{1.08 - 0.92} = \frac{0.13127}{0.16} = 0.8204$$
   $$1 - p = 0.1796$$
2. Calculate the Hold Value at $N_u$:
   $$\text{Hold Value} = e^{-r \times t} \times [p \times C_{uu} + (1 - p) \times C_{ud}]$$
   Given $C_{uu} = ₹17.80$ and $C_{ud} = ₹0.00$:
   $$\text{Hold Value} = 0.95123 \times [0.8204 \times 17.80 + 0.1796 \times 0] = 0.95123 \times 14.603 = ₹13.89$$
3. Calculate the Intrinsic Value of immediate exercise at $N_u$:
   $$\text{Intrinsic Value} = S_u - X = 135 - 128 = ₹7.00$$
4. Option Value at Node $N_u = \max(\text{Intrinsic Value}, \text{Hold Value}) = \max(₹7.00, ₹13.89) = ₹13.89$.
Since the Hold Value is greater than the Intrinsic Value, the option value at node $N_u$ is ₹13.89 and early exercise is not optimal.
