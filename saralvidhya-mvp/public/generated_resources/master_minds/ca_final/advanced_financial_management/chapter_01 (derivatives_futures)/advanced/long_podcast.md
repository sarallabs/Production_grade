Hello everyone, and welcome to this deep-dive podcast on Derivatives - Futures of the CA Final Advanced Financial Management syllabus, Derivatives and Futures. Today, we are going to unpack the advanced quantitative and conceptual frameworks that are essential for the exam. Joining me as always is our diligent student who has been grinding through the practice manuals.

Thanks, Bot. I have to say, the futures chapter is one of those sections where you think you understand the basics, but then the advanced exam questions throw in continuously compounded interest rates, time-varying dividend yields, Securities Lending and Borrowing fees, and transaction costs, and suddenly it is a math maze. I am really looking forward to breaking this down.

That is the right attitude. In AFM, the key is to move past rote memorization of formulas and understand the economic intuition. Let us start with the core pricing mechanism. Can you explain the cost of carry model in simple terms?

Surely. The cost of carry model is based on the idea of replication and the no-arbitrage principle. If I want to own a stock three months from now, I have two choices. I can either buy the stock today in the spot market and hold it for three months, or I can enter into a long futures contract today to buy the stock in three months. 

Excellent. Now, what are the cash flow differences between these two strategies?

If I buy the stock today, I have to pay for it immediately, which means I either borrow the money and pay interest, or I use my own money and lose the interest I could have earned. That interest expense is the cost of carrying the stock. On the other hand, if I hold the physical stock, I am entitled to any dividends paid during those three months. Since the dividend is cash coming in, it reduces my net carrying cost.

Exactly. And if you choose the second strategy, buying the futures contract, you do not pay the full stock price today, so you do not incur that interest cost, but you also do not get the dividend. Therefore, for the two strategies to have the same economic value at the end of three months, the futures price must equal the spot price plus the interest cost, minus the dividend received. If they do not match, an arbitrageur can exploit the difference for a risk-free profit.

That is simple interest. But in the advanced section, we see continuous compounding. The formula becomes F zero equals S zero times e to the power of r T. Why do we use continuous compounding, and how do we derive the dividend adjustment in that case?

Continuous compounding is the standard in financial mathematics because cash flows and interest in institutional markets accrue continuously. The term e to the power of r T represents the future value of one rupee invested for time T at a continuously compounded risk-free rate r. Now, when a stock pays a discrete dividend, say D, at a specific point in time, say t d, we have to adjust our formula. Since the dividend is received at t d, we discount it back to the present using the risk-free rate. So the present value of the dividend is D times e to the power of negative r times t d.

Ah, so we subtract this present value of the dividend from the spot price before compounding it to expiry. The formula is F zero equals the quantity S zero minus D times e to the power of negative r times t d, all multiplied by e to the power of r T.

Correct. If you expand that formula, it is equivalent to compounding the spot price to maturity and subtracting the future value of the dividend at maturity. The mathematics works out perfectly. Now, what if we are pricing index futures like Nifty or Sensex instead of individual stock futures?

That is different because an index consists of many stocks paying dividends at various times. We cannot track every single discrete dividend. Instead, we use an average annual dividend yield, represented by the letter d, and assume it flows continuously. Under continuous compounding, the index futures formula becomes S zero times e to the power of the quantity r minus d, multiplied by T.

Yes. The term r minus d is the net cost of carry. If the interest rate is higher than the dividend yield, the futures price will be higher than the spot price. We call this a contango market. If the dividend yield is higher than the interest rate, the futures price will be lower than the spot price, which is a backwardation market.

Wait, I was reading about contango and backwardation in the context of commodity markets too. Is the definition the same?

The definitions are the same, but the drivers are different. In commodities, contango happens when storage costs, insurance, and interest rates are high. Backwardation happens when there is an acute shortage of the physical commodity today, so the immediate benefit of holding the asset, which we call the convenience yield, is extremely high. The convenience yield acts just like a dividend yield, driving the futures price below the spot price.

That makes sense. Let us move to the risk management side. In the question bank, I solved a problem where the initial margin was calculated as mu plus three sigma. What is the significance of this?

In statistics, if daily returns are normally distributed, ninety-nine point seven percent of all daily price movements will fall within three standard deviations of the mean. By setting the initial margin percentage as the mean of absolute daily returns, mu, plus three times the standard deviation, sigma, the exchange guarantees that the margin deposit will cover the daily price fluctuation ninety-nine point seven percent of the time. This virtually eliminates the risk of a trader defaulting on their daily settlement obligation.

That is very clever. And the daily settlement is called marking to market. Let us walk through a numerical example because this is a common sixteen-mark question in the exam. Suppose I buy stock futures at one thousand rupees. The lot size is one hundred shares, and I buy two contracts, so that is two hundred shares. The initial margin is fifteen percent, and the maintenance margin is seventy percent of the initial margin.

Let us calculate the initial values. The total contract value is two hundred shares times one thousand rupees, which is two hundred thousand rupees. Your initial margin deposit at day zero is fifteen percent of that, which is thirty thousand rupees. The maintenance margin is seventy percent of thirty thousand, which is twenty-one thousand rupees. Now, let us say on day one, the price falls to nine hundred and eighty rupees. What happens to your margin account?

Since I am long, a price fall is a loss for me. The price went down by twenty rupees. For two hundred shares, that is an MTM loss of four thousand rupees. My margin account balance falls from thirty thousand to twenty-six thousand rupees. Since twenty-six thousand is still above the maintenance margin of twenty-one thousand, there is no margin call. I just carry the position.

Exactly. Now let us say on day two, the price drops further to nine hundred and fifty rupees.

The price fell from nine hundred and eighty to nine hundred and fifty, which is another thirty-rupee drop. For two hundred shares, that is a loss of six thousand rupees. My margin account balance drops from twenty-six thousand to twenty thousand rupees. Since twenty thousand is below the maintenance margin of twenty-one thousand, a margin call is triggered.

Correct. And this is where the exam trap lies. How much variation margin must you deposit?

I must deposit enough to bring the balance back to the initial margin level of thirty thousand rupees. Since my current balance is twenty thousand, I must deposit ten thousand rupees of variation margin. My account balance is now restored to thirty thousand.

Perfect. What if on day three, the price jumps to nine hundred and ninety rupees?

The price rose by forty rupees, from nine hundred and fifty to nine hundred and ninety. For two hundred shares, that is an MTM gain of eight thousand rupees. My margin account balance rises from thirty thousand to thirty-eight thousand rupees. Since this is above the initial margin level of thirty thousand, I can withdraw the excess eight thousand rupees if the exchange allows it. If I do, my balance goes back to thirty thousand.

Yes, that is the standard marking to market cycle. If the question says the trader withdraws all excess margin immediately, you show that outflow in your table and start the next day with the initial margin balance.

Now let us talk about portfolio hedging and beta management. This is another major exam area. If a fund manager holds a portfolio of twenty-five crore rupees with a beta of one point two five, and they expect the market to fall, they can use Nifty futures to adjust the portfolio's beta. What is the logic behind the formula?

The formula is the number of contracts equals the target beta minus the portfolio beta, divided by the beta of futures, which is always one, multiplied by the ratio of the portfolio value to the contract value of the futures. The contract value of the futures is the futures price times the lot size. The logic is that we are using the futures contracts to either add or subtract systematic risk. If you want to reduce your beta from one point two five to zero point seven five, the difference is negative zero point five. This means you need to short futures to cancel out half a unit of market beta.

And if we want to hedge the portfolio completely, the target beta is zero. The formula gives us a negative number of contracts, confirming we must short. But what if we want to make the portfolio more aggressive? Say, we expect a market rally and want to increase the beta to one point six.

Then the target beta minus portfolio beta is positive point three five. The formula will yield a positive number of contracts, indicating you should buy, or go long on, Nifty futures. This leverages up your systematic risk exposure without you having to buy individual stocks in the spot market.

In the exam, they often ask us to prove the effectiveness of the hedge if the index falls by a certain percentage, say twelve percent. To solve this, we have to calculate the expected return of the unhedged portfolio using the Capital Asset Pricing Model, right?

Yes, that is a critical cross-concept integration. You calculate the risk-free rate for the holding period, and then apply the CAPM formula. The expected portfolio return is the risk-free rate plus the portfolio's original beta times the quantity market return minus the risk-free rate. Remember that if the market falls, the market return is negative, so the portfolio will have a large negative return.

Right. So we calculate the loss on the physical equity portfolio. Then we calculate the gain on our short futures position. The futures contract gains because the index fell, and we shorted it. When we add the physical portfolio value and the futures gain together at expiry, the net return of the combined portfolio should match the return expected from a portfolio with the target beta.

Precisely. If you targeted a beta of zero, the net return of your combined portfolio should exactly equal the risk-free rate, achieving a perfect hedge. If you targeted a beta of zero point seven five, the net return should match the CAPM return calculated using a beta of zero point seven five. It is a beautiful mathematical harmony, and verifying this in the exam proves your answer is correct.

That is a great tip. Now let us dive into the details of arbitrage. We discussed cash and carry and reverse cash and carry, but how do transaction costs like brokerage, GST, and STT affect the pricing bounds? Let us look at a cash and carry arbitrage first.

In a cash and carry arbitrage, you believe the market futures price is too high. So you buy the stock in the spot market today and sell the futures. To buy the stock, you must borrow the spot price amount. But you also have to pay brokerage, GST on brokerage, and Securities Transaction Tax on the purchase. All these transaction costs must be added to your initial borrowing. This increases your effective spot cost at day zero.

And when we compound this effective spot cost to expiry, we use the borrowing interest rate. What about the dividend?

Since you hold the physical stock, you receive the dividend. If you receive it before expiry, you can invest it at the deposit interest rate until expiry. The future value of this dividend reduces your carrying cost, so we subtract it at maturity.

Okay. What about the transaction costs at expiry?

At expiry, you deliver the stock, which is a spot sale, so you pay brokerage, GST, and STT on the sale. You also pay brokerage and GST to close your short futures contract. Additionally, you must account for the opportunity cost of the margin deposit. Since you had to deposit ten percent of the futures value as margin, and that margin does not earn interest, you lose the deposit interest on that money for three months. All these expenses must be added to the theoretical price to find the upper boundary of the arbitrage-free corridor.

Wow, that is a lot of costs. So the upper bound is the theoretical futures price plus all buying costs compounded, plus margin interest opportunity cost, plus all expiry selling costs. If the market futures price is higher than this upper bound, cash and carry arbitrage is profitable.

Yes. Now let us look at the reverse cash and carry arbitrage, which is when the market futures price is too low. In this case, you buy the futures and short sell the stock. To short sell, you must borrow the stock from a Securities Lending and Borrowing desk.

And the SLB desk charges a stock borrowing fee, which we have to pay upfront at day zero. Since we pay it upfront, we must compound this fee to expiry using our lending rate and add it to our costs.

Correct. Also, when you short sell the stock, you receive the cash proceeds today. You invest these proceeds at the risk-free deposit rate. However, because you shorted the stock, when the company pays a dividend during the holding period, you do not receive it. Instead, you have to pay that dividend out of your pocket to the stock lender. This dividend pass-through is a cost that you must finance.

That is a key point. The dividend is a cash outflow for the arbitrageur in a reverse cash and carry trade. We have to borrow money to pay the dividend to the lender, and compound that borrowing to expiry.

Exactly. At expiry, you collect your matured investment from the short sale proceeds, pay the locked-in futures price to buy the stock, and return the stock to the lender. If the matured investment proceeds are greater than the futures price, the compounded stock borrowing fee, the compounded dividend pass-through, and the transaction costs, then you make a risk-free profit. This sets the lower boundary of the arbitrage-free corridor.

This is incredibly comprehensive. It shows that in advanced finance, every single cash flow, transaction fee, and interest rate differential must be mapped out across a timeline.

Yes. If you construct a clear cash flow timeline in the exam, showing exactly what happens at day zero, at the dividend date, and at expiry, the examiner can easily follow your logic, and you are guaranteed to score full marks.

Thanks, Bot. I feel much more confident about derivatives and futures now. I am ready to practice these advanced problems.

Excellent. Keep studying hard, and we will see you in the next session. Good luck.
