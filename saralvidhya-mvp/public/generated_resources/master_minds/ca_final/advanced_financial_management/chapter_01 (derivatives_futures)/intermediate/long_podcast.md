Hey Bot! I am back for a much deeper dive into Derivatives - Futures of Advanced Financial Management. We covered the basics of futures and margins in our short session, but I want to master the complex numerical scenarios and theoretical nuances now. Can we go through everything in detail?

Absolutely, Girl. I'm glad you're looking for a deep dive because Derivatives - Futures is a cornerstone of the AFM syllabus. The ICAI loves to test both the computational aspects of futures pricing and the practical mechanics of arbitrage. Where should we start?

Let's start right at the beginning with the difference between the cash market and the derivatives market. I know the basic differences, like ownership and lot sizes. But what is the exact economic purpose of these two markets? Why do we need a derivatives market if we already have a cash market?

That is a fundamental question. The cash market is primarily for investment or consumption. If you buy shares of a company in the cash market, you pay the full price because you want to own a piece of that business, collect dividends, and participate in its long-term growth. But what if you are a fund manager who owns a huge portfolio of stocks, and you expect the market to crash next month? Selling all your stocks in the cash market would incur massive transaction costs, taxes, and impact cost.

Ah! So instead of selling the actual stocks, I can just hedge the systematic risk using index futures!

Exactly. You enter a short position in index futures. If the market falls, your futures contract will gain value, offsetting the losses in your stock portfolio. This highlights the primary functions of the derivatives market: risk management, which we call hedging; price discovery, where future supply and demand are reflected in current futures prices; and leverage, which allows participants to take large positions with relatively small capital.

Speaking of leverage, let's talk about the margin system. In our last chat, we discussed initial margin, maintenance margin, and variation margin. Can we walk through a real daily mark-to-market numbers scenario? That will help me visualize the actual margin account adjustments.

Let's do it. Suppose an investor, let's call him Mr. R, takes a long position in two lots of Nifty Futures at a price of seventeen thousand three hundred. Let's say one lot of Nifty is fifty units, which means Mr. R has a total position of one hundred units. Now, suppose the initial margin is ten percent of the contract value, and the maintenance margin is eighty percent of the initial margin. First, let's calculate the initial contract value and the initial margin.

Okay. If he buys one hundred units at seventeen thousand three hundred, the initial contract value is seventeen thousand three hundred multiplied by one hundred, which is seventeen lakh thirty thousand rupees. Ten percent of that is one lakh seventy-three thousand rupees. So, his initial margin deposit is one lakh seventy-three thousand.

Perfect. And what is the maintenance margin limit?

It is eighty percent of the initial margin. So, eighty percent of one lakh seventy-three thousand is one lakh thirty-eight thousand four hundred rupees. This means his account balance should never fall below this level. If it does, he gets a margin call.

Excellent. Now let's trace the next five days of closing prices. On Day one, the futures price closes at seventeen thousand two hundred. On Day two, it closes at seventeen thousand. On Day three, it drops further to sixteen thousand nine hundred. On Day four, it recovers to seventeen thousand one hundred. And on Day five, it closes at seventeen thousand four hundred. Let's calculate the daily margins step-by-step.

Let's do Day one first. The price fell from seventeen thousand three hundred to seventeen thousand two hundred. That is a drop of one hundred points. With a lot size of one hundred units, the daily mark-to-market loss is ten thousand rupees. So, his opening margin of one lakh seventy-three thousand is reduced by ten thousand, leaving a closing balance of one lakh sixty-three thousand.

Does he get a margin call on Day one?

Let's check. One lakh sixty-three thousand is still higher than the maintenance margin of one lakh thirty-eight thousand four hundred. So no, there is no margin call on Day one.

Correct. Now calculate Day two.

On Day two, the closing price drops from seventeen thousand daily close to seventeen thousand. That is a drop of two hundred points. The daily mark-to-market loss is two hundred points times one hundred units, which is twenty thousand rupees. His opening balance on Day two was one lakh sixty-three thousand. Subtracting the twenty thousand loss leaves a closing balance of one lakh forty-three thousand.

And is there a margin call?

One lakh forty-three thousand is still above one lakh thirty-eight thousand four hundred. So, still no margin call. He is safe for now!

What about Day three? The price drops to sixteen thousand nine hundred.

The price falls by one hundred points from seventeen thousand. The loss is one hundred times one hundred, which is ten thousand rupees. The margin account balance drops from one lakh forty-three thousand by ten thousand, bringing the balance down to one lakh thirty-three thousand.

Ah, now look at the balance. One lakh thirty-three thousand is below the maintenance margin limit of one lakh thirty-eight thousand four hundred. What happens now?

A margin call is triggered! The broker will call Mr. R and ask him to deposit variation margin. But wait, does he deposit just enough to get back to the maintenance margin of one lakh thirty-eight thousand four hundred, or does he go all the way back to the initial margin of one lakh seventy-three thousand?

He must deposit enough to restore the balance to the initial margin level of one lakh seventy-three thousand. This is the golden rule of margins. So, how much cash must he deposit?

The initial margin is one lakh seventy-three thousand, and his current balance is one lakh thirty-three thousand. So he must deposit forty thousand rupees as the variation margin. That brings his closing balance on Day three back to one lakh seventy-three thousand.

Perfect. Now let's calculate Day four, where the closing price recovers to seventeen thousand one hundred.

The price rose from sixteen thousand nine hundred to seventeen thousand one hundred. That is a gain of two hundred points. The daily mark-to-market gain is two hundred points times one hundred units, which is twenty thousand rupees. So his balance increases from one lakh seventy-three thousand by twenty thousand, making the closing balance on Day four one lakh ninety-three thousand. No margin call is needed, obviously.

Correct. And finally, Day five, where the price closes at seventeen thousand four hundred.

The price rose by three hundred points, from seventeen thousand one hundred to seventeen thousand four hundred. The daily mark-to-market gain is three hundred times one hundred, which is thirty thousand rupees. The margin balance increases from one lakh ninety-three thousand by thirty thousand, giving a final closing balance of two lakh twenty-three thousand.

Excellent. Now, if Mr. R decides to square off his position at the end of Day five, what is his net gain or loss? Let's calculate it using two different methods to verify.

Method one is using the entry and exit prices. He went long at seventeen thousand three hundred and squared off at seventeen thousand four hundred. That is a net gain of one hundred points. With one hundred units, his net profit is ten thousand rupees.

And what about Method two, using the cash flows in the margin account?

Let's see. He deposited one lakh seventy-three thousand initially. Then on Day three, he deposited another forty thousand as variation margin. So his total cash outflow was two lakh thirteen thousand. His final account balance is two lakh twenty-three thousand. The net profit is the final balance of two lakh twenty-three thousand minus his total deposits of two lakh thirteen thousand, which gives exactly ten thousand rupees! The math matches perfectly!

Fantastic! Walking through a real table makes the concept of marking to market and variation margins so much clearer. Now, let's talk about how the exchange actually decides the initial margin percentage. They don't just pick a random number like ten percent. Do you remember the Value-at-Risk formula we discussed?

Yes. It is based on the mean daily return and the standard deviation of daily returns over the last year, or about two hundred days. The formula is Initial Margin equals mean daily return, which is mu, plus three times the standard deviation, which is sigma. Why three standard deviations?

Under the assumption that daily price returns are normally distributed, three standard deviations from the mean cover ninety-nine point seven percent of all possible daily price movements. This ensures that the exchange is protected against default in ninety-nine point seven percent of market scenarios. Only a very extreme event, beyond three standard deviations, would exceed the initial margin.

That is a very robust risk management system. Let's move on to pricing futures contracts. We talked about the cost of carry model. Can you explain the difference between simple interest and continuous compounding in futures pricing? Because I see both formulas in the ICAI material.

Good point. In practical Indian markets and basic simple interest problems, we calculate the interest cost using simple interest over the contract tenure. For example, the futures price equals spot price plus spot price times interest rate times time divided by twelve hundred, where time is in months. But for institutional pricing, and in many advanced exam questions, the ICAI uses continuous compounding. The base formula there is futures price equals spot price times e raised to the power of r times T, where r is the annualized risk-free rate, and T is the time to maturity expressed in years.

And if there are dividends, they reduce the cost of carrying the asset. If the stock pays a discrete dividend of D rupees at time t-d, the continuous compounding formula is Futures price equals spot price minus the present value of the dividend, all multiplied by e raised to the power of r times T. The present value of the dividend is calculated as D times e raised to the power of negative r times t-d. Let's make sure I have this right. The dividend is discounted from the day it is paid, which is t-d, back to today.

That is exactly right. Let's test this with a quick mental calculation. Suppose the spot price of a stock is four hundred rupees. It is expected to pay a dividend of fifteen rupees in two months. The risk-free rate is ten percent per annum with continuous compounding. We want to find the price of a three-month futures contract. Here, the time to dividend, t-d, is two divided by twelve, which is zero point one six six seven years. The time to maturity, T, is three divided by twelve, which is zero point two five years. First, how do we find the present value of the dividend?

The dividend is fifteen. The interest rate is ten percent, or zero point one. The time to dividend is two-twelfths, which is one-sixth. So the exponent for discounting is negative zero point one times one-sixth, which is negative zero point zero one six seven. If the problem gives us e raised to the power of negative zero point zero one six seven as zero point nine eight three five, then the present value of the dividend is fifteen multiplied by zero point nine eight three five, which is fourteen point seven five rupees.

Spot on. Now, what is the dividend-adjusted spot price?

That is the spot price of four hundred minus the present value of the dividend of fourteen point seven five, which gives three hundred eighty-five point two five rupees.

And how do we carry that adjusted spot price forward to the expiration date?

We multiply three hundred eighty-five point two five by e raised to the power of r times T. Here, r is zero point one, and T is three-twelfths, or zero point two five. So the exponent is zero point one times zero point two five, which is zero point zero two five. If the problem gives us e raised to the power of zero point zero two five as one point zero two five three, then the futures price is three hundred eighty-five point two five multiplied by one point zero two five three, which equals three hundred ninety-five rupees and zero point zero four paise. Let's round it to three hundred ninety-five rupees.

Perfect. That is exactly how you solve these problems. It is a step-by-step process: discount the dividend, subtract it from the spot price, and compound the net amount to maturity. Now, let's talk about the exciting part: what happens if the actual market price of the futures contract deviates from this theoretical price?

That is where arbitrage comes in! If the market price is different from the theoretical price, a risk-free profit opportunity exists. There are two scenarios: Cash and Carry Arbitrage and Reverse Cash and Carry Arbitrage. Let's discuss Cash and Carry first. When does this happen?

Cash and Carry Arbitrage occurs when the actual market futures price is greater than the theoretical futures price. This means the futures contract is overpriced in the market. Since it is overpriced, the arbitrageur wants to sell the futures contract and buy the underlying asset in the spot market to deliver later. Let's trace the cash flows of a Cash and Carry Arbitrage.

Let's use an example with numbers. Suppose a stock is selling for three hundred rupees. The risk-free rate is zero point eight percent per month. A three-month futures contract is selling for three hundred twelve rupees in the market. The stock is expected to pay a dividend of four rupees and twenty paise within the next three months, say at the end of the second month. First, let's calculate the theoretical futures price using simple interest, since the interest is stated per month.

Go ahead. What is the formula?

Under simple interest, the theoretical price is Spot price times one plus interest rate for three months, minus the future value of the dividend at maturity. The interest rate is zero point eight percent per month. For three months, that is two point four percent. So, three hundred multiplied by one point zero two four is three hundred seven rupees and twenty paise. Now, the dividend is four rupees and twenty paise, paid at the end of the second month. It will earn interest at zero point eight percent for the remaining one month until the end of the third month. So the future value of the dividend is four point two zero multiplied by one point zero zero eight, which is four rupees and twenty-three paise.

Correct. So, what is the theoretical futures price?

It is three hundred seven point two zero minus four point two three, which equals three hundred two rupees and ninety-seven paise.

And what is the actual market price of the futures?

The actual market price is three hundred twelve rupees. Since three hundred twelve is greater than three hundred two point nine seven, the market price is overvalued. This means we can execute a Cash and Carry Arbitrage.

Exactly. Walk me through the transactions the arbitrageur makes today, at Month zero.

Today, the arbitrageur borrows three hundred rupees at zero point eight percent per month for three months. With this borrowed money, she buys one share of the stock in the spot market for three hundred rupees. At the same time, she sells one futures contract in the market at the overpriced rate of three hundred twelve rupees. Her net cash flow today is zero because the three hundred rupees borrowed was immediately spent on buying the stock.

Excellent. Now, what happens at Month two?

At the end of Month two, the company pays a dividend of four rupees and twenty paise. Since the arbitrageur physically owns the stock, she receives this dividend. She immediately invests it at the risk-free rate of zero point eight percent per month for the remaining one month.

Very good. Now, let's look at the final day, the end of Month three. What happens then?

First, the futures contract expires. The arbitrageur delivers the share of the stock she has been holding. In return, she receives the pre-agreed futures price of three hundred twelve rupees. Second, her dividend investment matures. She receives the dividend of four point two zero plus interest of three paise, which is four rupees and twenty-three paise. So, her total cash inflow at Month three is three hundred twelve plus four point two three, which is three hundred sixteen rupees and twenty-three paise.

And what is her cash outflow to repay the loan?

She has to repay the borrowed three hundred rupees plus interest at zero point eight percent per month for three months. That is three hundred multiplied by one point zero two four, which equals three hundred seven rupees and twenty paise.

So what is her final riskless profit?

Her profit is the total cash inflow of three hundred sixteen rupees and twenty-three paise minus the loan repayment of three hundred seven rupees and twenty paise, which equals exactly nine rupees and three paise! She made a risk-free profit without investing any of her own money. This is beautiful!

It is a perfect zero-investment, risk-free strategy. Now, what if the opposite happens? What if the market futures price is lower than the theoretical futures price? For example, if the market futures price was two hundred ninety-five rupees instead of three hundred twelve?

In that case, the futures contract is undervalued. We would execute a Reverse Cash and Carry Arbitrage. Since the futures are cheap, we buy the futures contract today. And since the spot stock is relatively expensive, we short sell the stock in the spot market today.

Exactly. When you short sell the stock today, you receive the spot price of three hundred rupees. What do you do with that money?

We invest the three hundred rupees at the risk-free rate of zero point eight percent per month for three months.

Correct. But what about the dividend that is paid at Month two? Remember, you shorted the stock, which means you borrowed it from a lender.

Ah! Since I shorted the stock, I don't own it. The lender of the stock is the one entitled to the dividend. So, when the dividend of four rupees and twenty paise is paid at Month two, I must pay that dividend out of my pocket to the lender.

Yes! That is a key cash outflow. And at Month three, how do you close the transaction?

At Month three, my investment of three hundred rupees matures. I collect the principal plus interest, which is three hundred seven rupees and twenty paise. I also buy the stock back using my long futures contract at the cheap market price of two hundred ninety-five rupees, and return the share to the lender.

Let's calculate the net profit. You received three hundred seven rupees and twenty paise from the matured investment. You had to pay the dividend of four rupees and twenty paise at Month two, which has a future value of four point two three at Month three. And you paid two hundred ninety-five rupees to buy the stock.

Let's see. The matured investment is three hundred seven point two zero. The cost of buying the stock is two hundred ninety-five. The dividend payout value is four point two three. So the net cash remaining is three hundred seven point two zero minus two hundred ninety-five minus four point two three, which equals seven rupees and ninety-seven paise! That is my riskless profit.

Brilliant. You have mastered both arbitrage mechanisms. But in real life, can arbitrageurs always make these profits? What limits them?

Transaction costs, definitely. In the real market, we have brokerage fees on buying and selling, Securities Transaction Tax, stock borrowing fees for short selling, and bid-ask spreads on interest rates. If the mispricing between the actual and theoretical futures price is less than these transaction costs, the arbitrage is not profitable.

Exactly. There is an arbitrage-free band around the theoretical price. Only when the market price moves outside this band does arbitrage become profitable. Now, let's talk about the relationship between forward and futures prices. We know that if interest rates are constant and certain, the forward price and futures price are identical. But what happens when interest rates are uncertain and volatile?

That depends on the correlation between the futures price and interest rates, right?

Yes. Let's explain the logic. If futures prices are positively correlated with interest rates, it means when the asset price rises, interest rates also rise. If you are long in a futures contract and the price rises, you receive daily mark-to-market profits. Because interest rates are high, you can reinvest these profits at a higher rate of return. On the other hand, if the asset price falls, you suffer MTM losses, but because interest rates are low, you can fund those losses by borrowing at lower interest rates. This daily settlement feature makes futures more attractive than forwards, so the futures price will be higher than the forward price.

That is a very neat explanation! So, if they are negatively correlated, the opposite is true, and the futures price will be lower than the forward price. And if they are uncorrelated, they are equal.

Correct. Finally, let's touch upon Contango and Backwardation. What do these terms mean for futures contracts?

Contango is when the futures price is higher than the spot price. This is normal because of the positive cost of carry, like interest and storage costs. Backwardation is when the futures price is lower than the spot price, which can happen if there is a high convenience yield, like a shortage of the physical asset, or a high dividend payout.

You have a complete grasp of this topic, Girl. These concepts are exactly what you need for the AFM exam.

Thank you, Bot! Discussing these calculations and the underlying logic has made everything click. I'm ready to tackle any question on futures now!

You've got this. Good luck with your studies, and I'll see you for the next topic.
