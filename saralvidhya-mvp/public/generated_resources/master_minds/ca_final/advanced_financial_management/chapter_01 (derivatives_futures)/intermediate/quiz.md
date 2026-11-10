Question 1
An index is currently trading at 8,000. The risk-free interest rate is 12% per annum, and the index dividend yield is 3% per annum, both continuously compounded. What is the theoretical price of a 3-month futures contract? (Assume $e^{0.0225} \approx 1.02276$)
A. 8,240
B. 8,182
C. 8,000
D. 8,060

Correct Answer: B
Explanation: For an index with continuous dividend yield, the pricing formula under continuous compounding is $F_0 = S_0 \times e^{(r - d) \times T}$. Here, $S_0 = 8,000$, $r = 12\% = 0.12$, $d = 3\% = 0.03$, and $T = 3/12 = 0.25$ years. Therefore, $(r - d) \times T = (0.12 - 0.03) \times 0.25 = 0.09 \times 0.25 = 0.0225$. The theoretical price is $F_0 = 8,000 \times e^{0.0225} = 8,000 \times 1.02276 = 8,182.08 \approx 8,182$.

Question 2
A stock is trading in the spot market at ₹500. A 3-month futures contract on the stock is currently quoting at ₹520. The borrowing rate is 12% per annum simple interest, and no dividend is expected before expiration. Which of the following statements is correct?
A. The theoretical futures price is ₹515, and Cash and Carry Arbitrage is profitable.
B. The theoretical futures price is ₹515, and Reverse Cash and Carry Arbitrage is profitable.
C. The theoretical futures price is ₹520, and no arbitrage is possible.
D. The theoretical futures price is ₹503, and Cash and Carry Arbitrage is profitable.

Correct Answer: A
Explanation: Under simple interest, the theoretical futures price is $F_0 = S_0 \times (1 + r \times T/12) = 500 \times (1 + 0.12 \times 3/12) = 500 \times 1.03 = ₹515$. Since the actual market futures price ($F_{\text{mkt}} = ₹520$) is greater than the theoretical futures price ($F_0 = ₹515$), the futures contract is overpriced. An arbitrageur can generate a risk-free profit by executing Cash and Carry Arbitrage (borrowing money to buy the spot stock and shorting the futures contract).

Question 3
An investor takes a long position in 1 lot (consisting of 75 units) of Nifty futures at 18,000. The initial margin requirement is 10% of the contract value, and the maintenance margin is 8% of the contract value. The next day, the futures closing price drops to 17,500. What is the variation margin required to be deposited by the investor?
A. No margin call is triggered
B. ₹10,500
C. ₹27,000
D. ₹37,500

Correct Answer: D
Explanation: 
1. Initial Contract Value = $75 \times 18,000 = ₹13,500,000$.
2. Initial Margin (IM) = $10\% \times 13,500,000 = ₹135,000$.
3. Maintenance Margin (MM) = $8\% \times 13,500,000 = ₹108,000$.
4. Daily MTM loss = $(18,000 - 17,500) \times 75 = ₹37,500$.
5. Margin Account Balance after Day 1 = $135,000 - 37,500 = ₹97,500$.
Since the closing balance (₹97,500) is less than the maintenance margin (₹108,000), a margin call is triggered. The variation margin required is the amount needed to restore the account balance back to the Initial Margin level: $135,000 - 97,500 = ₹37,500$.

Question 4
A stock is trading at ₹300, and a 3-month futures contract is trading at ₹305. The risk-free rate is 8% per annum simple interest. The stock is expected to pay a dividend of ₹5 in 2 months. Which of the following actions should an arbitrageur take?
A. Short sell the stock, invest the proceeds at the risk-free rate, and buy the futures contract.
B. Borrow ₹300, buy the stock in the spot market, and short (sell) the futures contract.
C. Buy the stock, buy the futures contract, and borrow the stock from a lender.
D. Do nothing as no arbitrage is possible because the market is efficient.

Correct Answer: B
Explanation: The theoretical futures price with simple interest and dividend is $F_0 = S_0 \times (1 + r \times T/12) - D \times (1 + r \times (T - t_d)/12)$. 
Interest cost = $300 \times 0.08 \times 3/12 = ₹6$. 
Future value of dividend at month 3 = $5 \times (1 + 0.08 \times 1/12) \approx 5.033$. 
Theoretical futures price = $300 + 6 - 5.033 = 300.97$. 
Since the actual market futures price ($F_{\text{mkt}} = 305$) is greater than the theoretical futures price ($F_0 = 300.97$), the futures are overvalued. The correct arbitrage strategy is Cash and Carry, which involves borrowing funds to buy the spot stock and shorting the futures contract.

Question 5
If interest rates are uncertain and futures prices are negatively correlated with interest rates, how will the futures price compare to the forward price for the same underlying asset and maturity?
A. The futures price will be equal to the forward price.
B. The futures price will be higher than the forward price.
C. The futures price will be lower than the forward price.
D. There is no relationship between the two prices.

Correct Answer: C
Explanation: When futures prices are negatively correlated with interest rates, a decline in futures prices (losses for long positions) tends to coincide with a rise in interest rates. This means the long position holder has to finance their daily MTM losses at higher borrowing rates. Conversely, when futures prices rise (gains for long positions), interest rates fall, meaning MTM gains are reinvested at lower rates. To compensate for this disadvantage relative to forward contracts (which are not settled daily), the futures price must be lower than the forward price.
