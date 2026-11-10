Welcome to today's quick session on CA Final Advanced Financial Management. Today, we are dissecting some of the most challenging concepts in Derivatives - Futures, Derivatives and Futures. How is your revision going?

Honestly, it is a bit intense. I am looking at marking to market and margins right now. I get the basic idea that margins are like security deposits, but the advanced calculation using Value at Risk is throwing me off. Why does the exchange use VaR instead of just a flat percentage?

That is a great question. A flat percentage is arbitrary and does not reflect actual market risk. The clearing house wants to guarantee that even if a trader defaults, there is enough cash in the margin account to cover the maximum likely loss over a single day. That is why they use the Value at Risk framework, specifically aiming for a ninety-nine point seven percent confidence level.

Ninety-nine point seven percent? That sounds like three standard deviations in a normal distribution, right?

Exactly. The formula for the initial margin percentage is the mean of the absolute daily returns, which we call mu, plus three times the daily volatility, which is sigma. By setting the initial margin at mu plus three sigma, the exchange covers itself against almost all possible daily price movements.

Okay, that makes sense. So if a stock has a mean daily return of one point five percent and a daily volatility of three point five percent, the initial margin is one point five plus three times three point five, which is twelve percent.

Spot on. And that margin is monitored daily through marking to market. Now, tell me, what happens if the stock price moves against the trader? Do they get a margin call immediately?

No, not immediately. There is a buffer called the maintenance margin, which is usually seventy to eighty percent of the initial margin. The broker only issues a margin call if the account balance falls below this maintenance level. But here is where a lot of students make a mistake in the exam. When a margin call is made, how much money does the trader have to deposit? Is it just enough to get back above the maintenance margin?

That is the most common exam trap. The answer is no. The trader must deposit variation margin to bring the account balance all the way back to the initial margin level, not just the maintenance level. If your initial margin was one hundred thousand rupees and your maintenance margin was seventy thousand, and your balance fell to sixty-five thousand, you do not just deposit five thousand to get to seventy. You must deposit thirty-five thousand to get back to one hundred thousand.

That is a crucial distinction. Now let us talk about arbitrage. In the exams, we calculate the theoretical futures price using formulas like the cost of carry. But in reality, actual market prices often deviate from this theoretical price. Why does this happen, and why doesn't arbitrage immediately erase the difference?

It comes down to market frictions, which define what we call the arbitrage-free corridor. In our theoretical formulas, we assume zero transaction costs, equal borrowing and lending rates, and no taxes. But in the real world, an arbitrageur has to pay brokerage fees, GST on those fees, Securities Transaction Tax, and clearing charges. 

Plus, there is the interest rate spread. You borrow at a higher rate to buy the spot stock in a cash and carry trade, but if you do a reverse cash and carry trade, you only earn the lower deposit rate on your short proceeds.

Precisely. And in a reverse cash and carry trade, you also have stock borrowing costs from the Securities Lending and Borrowing desk, and you have to pass through any dividends to the stock lender. All these costs create a range around the theoretical price. As long as the market futures price remains inside this corridor, executing the arbitrage is unprofitable because the costs exceed the mispricing. 

So an arbitrage opportunity only exists when the market price breaks out of this corridor, either above the upper bound for cash and carry, or below the lower bound for reverse cash and carry.

Yes, that is when riskless profits can actually be locked in. It is all about comparing the net returns after accounting for every single transactional friction.

This has made the concept so much clearer. Thanks, Bot.

You are welcome. Keep practicing those margin tables and arbitrage cash flows. See you next time.
