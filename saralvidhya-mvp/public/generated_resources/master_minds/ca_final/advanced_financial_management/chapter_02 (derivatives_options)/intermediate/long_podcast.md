Hello and welcome back! Today, we are doing a deep dive into chapter nine of the CA Final Advanced Financial Management syllabus. We are focusing on Derivatives, specifically Options analysis and valuation. I have Bot here with me to break down these complex models, Greeks, and formulas. Bot, option valuation seems like a mountain of math. Where is the best place to start?

The best place to start is always at the foundation: understanding what option pricing is trying to achieve. Unlike a stock or a futures contract, which you can value based on future cash flows or cost of carry, an option's value is non-linear and asymmetrical. That means standard valuation methods don't work. We need models that handle uncertainty. The two main frameworks we study are the discrete Binomial Model and the continuous Black-Scholes-Merton Model.

Let's start with the Binomial Model. The study material talks about two main ways to solve it: the Delta Hedging approach and the Risk-Neutral Valuation approach. Are they just two ways of doing the same thing?

Yes, they are mathematically equivalent and yield the exact same option price. The Delta Hedging approach is the conceptual foundation. It is built on the replicating portfolio principle. Imagine you write one call option on a stock. To hedge your risk, you buy a certain number of shares of the underlying stock. We call this number of shares Delta. If the stock goes up, you make money on the shares, which covers your loss on the short call. If the stock goes down, the shares lose money, but the call option expires worthless or cheaper, offsetting the loss.

So you choose a specific number of shares to buy so that the total value of your portfolio is identical whether the stock goes up or down.

Exactly. That is a riskless portfolio. Since the portfolio is riskless, it must earn the risk-free rate of interest. If it earned more or less, arbitrageurs would exploit the difference. By setting the value of the portfolio today, compounded at the risk-free rate, equal to the certain payoff at maturity, we can solve for the option's value today. The formula for that hedge ratio, or Delta, is the change in option payoff divided by the change in stock price. That is, call payoff up minus call payoff down, divided by stock price up minus stock price down.

That is incredibly clear. But in the exam, the Risk-Neutral method seems much faster to calculate. How does that work?

The Risk-Neutral method is a mathematical simplification of the replicating portfolio. Instead of calculating the shares to buy, we calculate what the probabilities of the up and down stock price movements would be if investors were completely neutral to risk. in a risk-neutral world, the expected return on the stock must equal the risk-free rate. So, today's stock price times the risk-free factor must equal the probability of an up-move times the up-state stock price, plus the probability of a down-move times the down-state stock price. 

And we can solve that equation to find the probability of the up-move. Let's see: the formula is risk-free factor minus the down-factor, divided by the up-factor minus the down-factor.

Correct. Under simple interest for a period t, the risk-free factor is one plus the interest rate for that period. Under continuous compounding, it is e to the power of r times t. Once you find that up-move probability, which we call p, the probability of the down-move is just one minus p. Then, you calculate the expected option payoff at maturity by multiplying the up-payoff by p and the down-payoff by one minus p. Finally, you discount that expected payoff back to today using the risk-free rate.

So if we have a two-period binomial model, we just apply this process step-by-step, starting from the end of the tree and working backward?

Exactly. In a two-period model, you have three nodes at maturity: the up-up node, the up-down node, and the down-down node. You calculate the call payoffs at each of these three nodes. Then, you use your risk-neutral probabilities to discount the up-up and up-down payoffs back to the up-node at the end of year one. You do the same for the up-down and down-down payoffs to get the value at the down-node at the end of year one. Finally, you use the year-one node values as your new payoffs and discount them back one more step to get the value of the option today at node zero.

I see. It is just a recursive process. You work from right to left across the binomial tree. Now, what happens when we move from discrete steps to a continuous flow? That is where the Black-Scholes-Merton model comes in, right?

Yes. If you divide the time to expiration into infinitely small steps, the binomial model converges to the Black-Scholes-Merton model. The BSM formula is famous: Call price equals stock price times N of d1, minus strike price times e to the negative r t times N of d2. It looks intimidating, but we can break down what it actually represents.

Yes, please. What do N of d1 and N of d2 actually mean?

Think of N of d2 as the probability that the option will be exercised, or finish in-the-money, in a risk-neutral world. So, strike price times e to the negative r t times N of d2 represents the present value of the expected strike price payment.

And what about the first term? Stock price times N of d1?

N of d1 is the option's Delta under the Black-Scholes model. So, stock price times N of d1 represents the expected value of the stock you will receive if the option is exercised, also discounted back. When you subtract the present value of the strike price from the expected stock value, you get the fair value of the call option today.

That is beautiful. It is just the present value of what you expect to receive minus what you expect to pay. But what about the assumptions of the model? The ICAI exams love to ask about the assumptions and limitations of the Black-Scholes model.

Indeed. The key assumptions are: first, the stock pays no dividends during the option's life. Second, the option is European-style. Third, there are no transaction costs, commissions, or taxes. Fourth, the risk-free interest rate and the stock's volatility are constant and known. Fifth, short selling is allowed with no restrictions. And finally, stock returns are normally distributed, which means stock prices follow a lognormal distribution.

But in reality, almost none of these assumptions hold. Volatility is not constant; it changes daily. And many stocks pay dividends. How do we adjust for dividends in the Black-Scholes model for our exams?

For the CA Final exam, if a stock pays a dividend during the option's life, we use the dividend-adjusted BSM model. Stock prices fall on the ex-dividend date by the amount of the dividend. So, a dividend reduces the value of a call option because it lowers the stock price at maturity. To adjust, we calculate the present value of the expected dividend, discounted at the risk-free rate from the dividend payment date back to today. Then, we subtract this present value from the current stock price.

Ah! So we get an adjusted stock price, say, S star, which is the current stock price minus the present value of the dividend.

Exactly. Then you use this adjusted stock price in place of the normal stock price in all the BSM formulas, including the calculations for d1 and d2. This gives you the dividend-adjusted call option price.

That makes sense. What about Put options? Can we value them using Black-Scholes too?

Yes, there is a direct formula for puts: strike price times e to the negative r t times N of negative d2, minus stock price times N of negative d1. But in practice, and in exams, it is often much easier to calculate the call price first and then find the put price using Put-Call Parity.

Put-Call Parity is a lifesaver. Let's talk about that relationship. The formula is Call plus the present value of Strike equals Put plus the stock price. Why must this relationship hold?

It is based on a simple arbitrage argument. Imagine two portfolios. Portfolio A has a European call option and a zero-coupon bond that pays the strike price at expiration. Portfolio B has a European put option and one share of the stock. At expiration, if the stock price is above the strike price, the call in Portfolio A is exercised, giving you the stock, while the bond pays the strike price. If the stock price is below the strike price, the put in Portfolio B is exercised, allowing you to sell the stock for the strike price. In either case, both portfolios end up being worth exactly the stock price or the strike price, whichever is higher.

Wow. So because both portfolios have identical values at expiration under any market condition, they must cost the same to set up today.

Precisely. If they didn't cost the same, there would be a riskless arbitrage opportunity. For example, if Portfolio A was more expensive than Portfolio B, you would sell the components of Portfolio A, buy the components of Portfolio B, and pocket the difference today. At expiration, the positions would perfectly offset, leaving you with zero liability and a guaranteed profit. We call this arbitrage trade a Reversal if you sell the call and buy the put, and a Conversion if you buy the call and sell the put.

I love that. Conversion and Reversal. So in a Conversion, you buy the underpriced call, write the overpriced put, short the stock, and invest the proceeds. In a Reversal, you write the overpriced call, buy the underpriced put, buy the stock, and borrow money.

You nailed it. It is all about buying the cheap portfolio and selling the expensive one.

Let's move on to Option Greeks. We touched on them briefly, but they are critical for intermediate and advanced risk management. Let's go through them one by one. First, Delta. Why is Call Delta positive while Put Delta is negative?

Delta measures the rate of change of the option price with respect to the stock price. Since a call option becomes more valuable when the stock price rises, its price moves in the same direction, so the delta is positive. A put option becomes more valuable when the stock price falls, so its price moves in the opposite direction, making the delta negative. For calls, Delta ranges from zero to one. For puts, it ranges from negative one to zero.

And Gamma? I know it is the rate of change of Delta. But why is it so important for someone who is delta-hedging?

If you are delta-hedging a short call option, you buy Delta shares of stock. But as the stock price moves, Delta changes. Gamma measures how fast it changes. If Gamma is very small, Delta changes slowly, so you don't need to adjust your stock position very often. But if Gamma is high, Delta is highly sensitive to stock price movements. A small change in the stock price will cause your Delta to jump, meaning you have to buy or sell a large number of shares to stay hedged. This is called Gamma risk, and it makes delta-hedging expensive due to transaction costs.

Where is Gamma the highest?

Gamma peaks when the option is At-the-Money and close to expiration. That is when the option's moneyness is most sensitive to stock price changes. If the stock moves even slightly, the option could change from being completely worthless to being highly in-the-money.

That makes complete sense. And Theta? That is time decay. Why does time decay accelerate as we get closer to expiry?

An option is a derivative that has a time-limited window of opportunity. The time value of an option represents the premium for the possibility that the stock price will move in your favor. As each day passes, that window of opportunity shrinks. In the beginning, say ninety days from expiry, the loss of one day doesn't change the probability of exercise very much. But when you are only ten days from expiry, every single day represents a huge chunk of the remaining time, so the option loses value rapidly.

So if you are an option buyer, Theta is working against you. If you are an option writer, Theta is your friend, because the option you sold is losing value every day, allowing you to keep the premium.

Exactly. Option writers are essentially sellers of time. They profit from the steady erosion of the option's time value.

What about Vega? That measures sensitivity to implied volatility. Why do both calls and puts have positive Vega?

Because volatility represents the dispersion of potential stock prices. Since option buyers have limited downside but unlimited upside, they benefit from a wider spread of outcomes. Whether it is a call or a put, higher volatility increases the chance of the option finishing deep in-the-money, while the worst-case scenario remains just losing the premium. Therefore, an increase in volatility always makes both calls and puts more valuable.

Okay, and Rho is the last Greek. It is interest rate sensitivity. In our exams, we often see that higher interest rates increase call prices but decrease put prices. Why is that?

Think of buying a call option as buying the stock on credit. Instead of paying the full price of the stock today, you pay a small premium and defer paying the strike price until maturity. When interest rates are high, the value of deferring that payment is higher because you can earn interest on your money in the meantime. That makes the call option more valuable. For a put option, it is the opposite. You are waiting to receive the strike price when you sell the stock. Deferring the receipt of cash is costly when interest rates are high, which reduces the put's value.

That is a brilliant way to visualize it. Buying a call is like deferring payment, and buying a put is like deferring receipt of cash. That makes the Rho signs so intuitive.

Yes. It is all about the time value of money.

Bot, this has been an incredible deep dive. We covered the binomial model, delta-hedging, risk-neutral probabilities, the Black-Scholes model, dividend adjustments, Put-Call parity, and all the Option Greeks. I feel much more confident about these concepts now.

I am glad to hear that. Option valuation is all about understanding these interrelated components. Once you see how they connect, the formulas start to make sense instead of just being things you memorize.

Absolutely. Thanks for joining me today, Bot.

Anytime. Good luck with your study preparation.
