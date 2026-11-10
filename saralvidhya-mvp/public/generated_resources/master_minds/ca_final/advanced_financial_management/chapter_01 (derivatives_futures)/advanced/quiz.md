# Derivatives - Futures

Question 1
What is the theoretical fair value of a 3-month index futures contract if the spot index is 15,000, the risk-free interest rate is 8% per annum, and the dividend yield on the index is 2% per annum, assuming continuous compounding? (Take $e^{0.015} pprox 1.015113$)
A. 15,226.70
B. 15,302.10
C. 15,000.00
D. 15,150.00

Correct Answer: A
Explanation: Under continuous compounding, the fair value of an index futures contract is given by:
$$F_0 = S_0 \times e^{(r - d) \times T}$$
Given:
- Spot Index ($S_0$) = 15,000
- Risk-free rate ($r$) = 8% = 0.08 p.a.
- Dividend yield ($d$) = 2% = 0.02 p.a.
- Time to maturity ($T$) = 3 months = 3/12 = 0.25 years

Substitute the values:
$$F_0 = 15,000 \times e^{(0.08 - 0.02) \times 0.25}$$
$$F_0 = 15,000 \times e^{0.06 \times 0.25}$$
$$F_0 = 15,000 \times e^{0.015}$$

Using $e^{0.015} \approx 1.015113$:
$$F_0 = 15,000 \times 1.015113 = 15,226.70$$

---

Question 2
A stock is trading in the spot market at ₹800. A dividend of ₹10 per share is expected to be paid in 2 months. The risk-free interest rate is 12% per annum with continuous compounding. What is the theoretical price of a 3-month futures contract on this stock? (Take $e^{-0.02} \approx 0.980199$ and $e^{0.03} \approx 1.030455$)
A. ₹824.36
B. ₹814.26
C. ₹800.00
D. ₹804.46

Correct Answer: B
Explanation: The dividend is paid during the contract life, so its present value must be deducted from the spot price:
$$F_0 = (S_0 - \text{PV}(D)) \times e^{r \times T}$$
Given:
- Spot price ($S_0$) = ₹800
- Dividend ($D$) = ₹10 at $t_d$ = 2 months = 2/12 = 0.1667 years
- Interest rate ($r$) = 12% = 0.12 p.a.
- Expiry ($T$) = 3 months = 3/12 = 0.25 years

First, calculate $	ext{PV}(D)$:
$$	ext{PV}(D) = D \times e^{-r \times t_d} = 10 \times e^{-0.12 \times 2/12} = 10 \times e^{-0.02}$$
Using $e^{-0.02} \approx 0.980199$:
$$	ext{PV}(D) = 10 \times 0.980199 = ₹9.80$$

Next, calculate the net stock price:
$$S_0 - \text{PV}(D) = 800 - 9.80 = ₹790.20$$

Now, calculate the futures price:
$$F_0 = 790.20 \times e^{0.12 \times 0.25} = 790.20 \times e^{0.03}$$
Using $e^{0.03} \approx 1.030455$:
$$F_0 = 790.20 \times 1.030455 = ₹814.26$$

---

Question 3
An investor sells 2 stock futures contracts (lot size = 100 shares each) at a price of ₹1,000 per share. The broker requires an initial margin of 15% and a maintenance margin of 70% of the initial margin. At what closing price on Day 1 will a margin call be triggered for this short position?
A. ₹1,045.00
B. ₹955.00
C. ₹1,030.00
D. ₹1,060.00

Correct Answer: A
Explanation: For a short position, the investor gains when the price falls and loses when the price rises.
Given:
- Entry Price = ₹1,000
- Contracts = 2
- Lot Size = 100
- Total position size = 200 units
- Initial Margin = 15% of contract value = 15% * (1,000 * 200) = ₹30,000
- Maintenance Margin = 70% of Initial Margin = 70% * ₹30,000 = ₹21,000

Let the closing price on Day 1 be X.
The MTM loss on a short position is:
$$	ext{Loss} = (X - 1,000) \times 200$$

The margin account balance at the end of Day 1 will be:
$$	ext{Ending Balance} = \text{Initial Margin} - \text{MTM Loss}$$
$$	ext{Ending Balance} = 30,000 - (X - 1,000) \times 200$$

A margin call is triggered when the ending balance falls below the Maintenance Margin (₹21,000):
$$30,000 - (X - 1,000) \times 200 < 21,000$$
$$9,000 < (X - 1,000) \times 200$$
$$X - 1,000 > 9,000 / 200$$
$$X - 1,000 > 45$$
$$X > ₹1,045.00$$

Therefore, a margin call is triggered if the price closes above ₹1,045.00.

---

Question 4
A fund manager has an equity portfolio valued at ₹50 crores with a beta of 1.40. The manager wishes to reduce the portfolio beta to 0.60 using index futures. The index futures contract is currently trading at 18,300, and the lot size is 50 shares. Assuming the beta of the index futures is 1.00, what trading action should the fund manager take to achieve the target beta?
A. Buy 437 contracts
B. Sell 437 contracts
C. Sell 328 contracts
D. Buy 328 contracts

Correct Answer: B
Explanation: The number of futures contracts needed to adjust a portfolio's beta is given by:
$$N = \left(\frac{\beta_{\text{target}} - \beta_{\text{portfolio}}}{\beta_{\text{futures}}}\right) \times \left(\frac{\text{Portfolio Value}}{\text{Futures Price} \times \text{Lot Size}}\right)$$
Given:
- $\beta_{\text{portfolio}} = 1.40$
- $\beta_{\text{target}} = 0.60$
- $\beta_{\text{futures}} = 1.00$
- Portfolio Value = ₹50,00,00,000 (₹50 Crores)
- Futures Price = 18,300
- Lot Size = 50

Substitute the values:
$$N = \left(\frac{0.60 - 1.40}{1.00}\right) \times \left(\frac{50,00,00,000}{18,300 \times 50}\right)$$
$$N = -0.80 \times \left(\frac{50,00,00,000}{9,15,000}\right)$$
$$N = -0.80 \times 546.448$$
$$N = -437.16 \text{ contracts} \approx -437 \text{ contracts}$$

The negative sign indicates that the manager needs to short (sell) futures. Therefore, the strategy is to Sell 437 contracts.

---

Question 5
A stock is trading in the spot market at ₹500. A 3-month futures contract on the stock is currently quoting at ₹520. If the risk-free borrowing rate is 12% per annum simple interest and no dividends are expected, what is the riskless arbitrage profit per share that can be earned using a Cash & Carry Arbitrage strategy?
A. ₹20.00
B. ₹5.00
C. ₹15.00
D. ₹0.00

Correct Answer: B
Explanation: An arbitrage profit can be made if the actual market futures price deviates from the theoretical futures price.
Given:
- Spot price ($S_0$) = ₹500
- Market futures price ($F_{\text{market}}$) = ₹520
- Borrowing rate ($r$) = 12% p.a. (simple interest)
- Time ($T$) = 3 months = 3/12 = 0.25 years
- Dividend = ₹0

First, calculate the theoretical futures price:
$$F_{\text{theoretical}} = S_0 \times (1 + r \times T)$$
$$F_{\text{theoretical}} = 500 \times (1 + 0.12 \times 0.25)$$
$$F_{\text{theoretical}} = 500 \times (1 + 0.03) = 500 \times 1.03 = ₹515$$

Since $F_{\text{market}}$ (₹520) > $F_{\text{theoretical}}$ (₹515), the futures are overvalued.
An arbitrageur can execute Cash & Carry Arbitrage by buying the stock in the spot market (funded by borrowing at 12%) and selling futures at ₹520.
At expiry, the arbitrageur delivers the stock for ₹520 and repays the borrow of ₹515.
Arbitrage Profit per share = $F_{\text{market}} - F_{\text{theoretical}} = 520 - 515 = ₹5.00$.
