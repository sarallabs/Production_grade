Hello and welcome to another episode of the AFM Masterclass. Today, we are taking on one of the most challenging topics in the CA Final syllabus: Derivatives, specifically Option Valuation Models and Arbitrage. I am joined by Bot, our resident expert. Ready for a deep dive, Bot?

Absolutely. Options are fascinating because they require both mathematical precision and economic intuition. We will go through the Binomial Model, the Black-Scholes-Merton Model, and Put-Call Parity arbitrage.

Fantastic. Let's start with the Binomial Option Pricing Model. This is where most students begin, but at the advanced level, the exam demands a clear understanding of the two different ways to value options in a binomial state: the Replicating Portfolio approach and the Risk-Neutral Valuation approach. Bot, can you break down the Replicating Portfolio method first?

The key idea behind option pricing is replication. If you can build a portfolio of traded assets that has the exact same cash flows as the option in every possible future state, then the price of the option today must equal the cost of setting up that replicating portfolio. If it did not, there would be an arbitrage opportunity. 

Right. And in a simple one-period binomial world, the stock can only do two things: go up to a high price or down to a low price. So, to replicate a call option, we buy some amount of the underlying stock, which we call Delta, and we borrow some amount of cash, which we call B, at the risk-free rate.

Exactly. Let's write down the payoffs at maturity. In the up-state, the value of our replicating portfolio is Delta times the up-state stock price, minus the borrowed cash plus interest. This must equal the call option payoff in the up-state. In the down-state, Delta times the down-state stock price, minus the borrowed cash plus interest, must equal the call option payoff in the down-state. When you solve these two simultaneous equations, you get Delta equals the difference in option payoffs divided by the difference in stock prices. Mathematically, Delta equals call-up minus call-down, divided by stock-up minus stock-down.

And once we have Delta, how do we find the borrowing amount, B?

You substitute Delta back into either equation. This gives us B equals Delta times the down-state stock price, minus the call option payoff in the down-state, all discounted back to today at the risk-free rate. Once you have Delta and B, the value of the option today is simply Delta times the current stock price, minus the borrowed amount B.

That is the replicating portfolio method. Now, let's talk about the Risk-Neutral Valuation approach. This is the one students use most often because the math feels simpler, but there is a major conceptual trap. Students often think the risk-neutral probability is the actual probability of the stock going up or down. Is that true?

No, it is not. The risk-neutral probability, which we denote as p, is a synthetic probability. It is the probability that would exist in a hypothetical world where all investors are risk-neutral and do not require a risk premium. In such a world, the expected return on the stock must equal the risk-free rate.

So we calculate p by setting the expected return of the stock over the period equal to the risk-free rate. The formula is p equals e to the power of r t, minus the down-factor d, all divided by the up-factor u minus the down-factor d. Here, u is the ratio of the up-price to the spot price, and d is the ratio of the down-price to the spot price.

Correct. And once you have this risk-neutral probability p, the value of the option today is the expected payoff under these probabilities, discounted back to today at the risk-free rate. That is, call price today equals e to the minus r t, multiplied by the quantity p times the up-state call payoff, plus one minus p times the down-state call payoff. The beauty of this is that the option price calculated using risk-neutral valuation is exactly the same as the price calculated using the replicating portfolio method. 

Yes, they are mathematically equivalent. But what happens when we move from a single-period model to a multi-period model? Say, a two-year binomial tree with one-year intervals. How do we value an American option versus a European option in that setup?

That is a classic exam question. For a European option, you only care about the terminal payoffs at the very end of the tree, in year two. You calculate those payoffs, and then you work backward step-by-step using the risk-neutral valuation formula at each node until you reach year zero. You never check for early exercise because European options can only be exercised at maturity.

But for an American option, the buyer has the right to exercise at any time. So, at each intermediate node in the tree, we must check if it is better to exercise the option immediately or to continue holding it.

Exactly. At each node, you compare the holding value with the intrinsic value. The holding value is the discounted expected value of the option from the next step, calculated using the risk-neutral probabilities. The intrinsic value is the payoff from immediate exercise, which is stock price minus strike price for a call, or strike price minus stock price for a put. The actual option value at that node is the maximum of those two values. 

This is particularly important for American put options. Since the maximum value of a put is capped at the strike price when the stock price falls to zero, there is a strong incentive to exercise early if the stock price drops significantly. If you exercise early, you get the cash today and can start earning interest on it, rather than waiting for maturity.

Spot on. That interest-earning potential is why American puts are frequently exercised early when they are deep in-the-money. For call options on non-dividend-paying stocks, early exercise is never optimal because you would rather hold the option and keep your cash earning interest, rather than exercising early and holding a depreciating stock.

Let's move on to the Black-Scholes-Merton Model, or BSM. This model assumes continuous time, unlike the discrete steps of the Binomial Model. The formula is Call price equals spot stock price times N of d1, minus the strike price times e to the minus r T, times N of d2. Bot, what do N of d1 and N of d2 actually mean?

In the BSM model, N of d1 and N of d2 are cumulative probabilities from the standard normal distribution. N of d1 is the delta of the call option under continuous trading. It tells you how many shares of stock you need to buy to replicate the call option in continuous time. N of d2 represents the risk-neutral probability that the option will expire in-the-money, meaning the probability that the call will be exercised.

That is a great conceptual point. And the term strike price times e to the minus r T, times N of d2, is the present value of the expected cost of exercising the option at maturity. So the call option price is essentially the expected stock value received minus the expected exercise cost.

Yes, that is the core intuition. Now, the formula for d1 is the natural log of spot price over strike price, plus the quantity interest rate r plus volatility squared over two, all multiplied by time T, divided by volatility times the square root of T. And d2 is simply d1 minus volatility times the square root of T.

In exams, we often get questions where a stock pays a dividend during the life of the option. The standard BSM model assumes no dividends. How do we adjust the model to handle this?

If the stock pays a discrete dividend, say D, at a specific day in the future, we must subtract the present value of that dividend from the current spot stock price. The adjusted stock price, which we write as S zero star, equals S zero minus D times e to the minus r t d, where t d is the time to the dividend payment. We then use this adjusted stock price S zero star in place of the spot stock price in the formulas for d1 and the call option price.

Why does this adjustment happen?

Because when a stock goes ex-dividend, its price falls by the amount of the dividend. Since the call option holder does not receive the dividend, this drop in stock price hurts the call holder. By subtracting the present value of the dividend today, we reflect this upcoming drop in the stock price, which reduces the call premium today.

That makes sense. Now, what are the assumptions and limitations of the Black-Scholes-Merton model? This is a popular theory topic in the exam.

BSM assumes that the risk-free rate and volatility are constant throughout the life of the option. In reality, both interest rates and volatility fluctuate constantly. BSM also assumes stock prices move continuously and returns are normally distributed, which ignores the reality of sudden price jumps, like those after merger announcements or regulatory changes. Finally, BSM assumes no transaction costs or taxes, and that short selling is permitted without restrictions. In the real world, these friction points exist and affect prices.

And traders deal with these limitations by adjusting their volatility estimates, which leads to concepts like the volatility smile or volatility skew, where options with different strikes have different implied volatilities.

Exactly. Implied volatility is the volatility that, when put into the BSM model, yields the actual market price of the option. If the BSM model were perfect, all options on the same stock would have the same implied volatility. But they do not, which proves the market adjusts for the model's limitations.

Let's shift our focus to Put-Call Parity. This is one of the most powerful relationships in options trading. The formula is Call option premium plus the present value of the strike price equals the Spot stock price plus the Put option premium. Bot, why must this parity hold?

It holds because you can construct two portfolios today that have the exact same payoff at maturity, regardless of the stock price. Portfolio A, which we call a Fiduciary Call, consists of buying a European call option and investing the present value of the strike price at the risk-free rate. Portfolio B, which we call a Protective Put, consists of buying one share of the stock and buying a European put option.

Let's check the payoffs at expiration. If the stock price is higher than the strike price, the call in Portfolio A is exercised, giving us the stock, while the cash has grown to cover the strike price. So Portfolio A is worth the stock price. In Portfolio B, the put expires worthless, so the portfolio is also worth the stock price. 

And if the stock price is lower than the strike price, the call in Portfolio A expires worthless, but our cash has grown to the strike price. So Portfolio A is worth the strike price. In Portfolio B, we exercise the put to sell our stock for the strike price. So Portfolio B is also worth the strike price. In both cases, the portfolios have identical payoffs: the maximum of the stock price or the strike price. Therefore, by the law of one price, they must cost the same today.

What happens if this parity is violated in the market? That is where arbitrage comes in. Let's look at the first violation: what if the Call side is more expensive than the Put side? That is, Call plus the present value of the strike is greater than Spot stock plus Put.

If the Call side is overpriced, you sell the Call option and borrow the present value of the strike price. To balance the trade, you buy the cheaper side: you buy the Put option and buy the underlying stock. This strategy is called Conversion Arbitrage. 

Let's trace the cash flows today for Conversion Arbitrage. We receive the call premium and borrow the present value of the strike. We spend cash to buy the put option and the stock. Because the call side was overpriced, we will have a net cash inflow today. We lend this surplus cash at the risk-free rate.

Right. Now let's see what happens at maturity. If the stock price is above the strike price, the call option we sold will be exercised against us. We are forced to sell the stock we own for the strike price. If the stock price is below the strike price, we exercise our put option to sell our stock for the strike price. In either case, we sell the stock for the strike price, which gives us exactly the cash needed to pay off our loan. The surplus cash we lent today is our risk-free arbitrage profit.

That is conversion arbitrage. Now let's look at the reverse case: what if the Call side is undervalued compared to the Put side? That is, Call plus the present value of the strike is less than Spot stock plus Put.

In this case, the Put and the stock are overpriced, and the Call is cheap. So you sell the Put option and short-sell the stock. With the cash proceeds, you buy the call option and lend the rest. This strategy is called Reversal Arbitrage.

Let's look at the cash flows for Reversal Arbitrage. Short-selling the stock and writing the put gives us a lot of cash today. We buy the call option and invest the rest of the proceeds. At maturity, the investment grows. If the stock price is above the strike price, we exercise our call option to buy the stock for the strike price. If the stock price is below the strike price, the put option we wrote is exercised against us, forcing us to buy the stock for the strike price.

In both cases, we buy the stock for the strike price to cover our short position. The money we lent at the start of the trade has grown to be more than the strike price we have to pay, leaving us with a guaranteed risk-free profit.

Reversal and conversion arbitrage are excellent illustrations of how options markets maintain equilibrium. If there is a price mismatch, arbitrageurs step in, buy the undervalued asset, sell the overvalued asset, and push the prices back into alignment.

Yes, and in the exam, students must show the exact cash flows today and at maturity under different stock price scenarios to prove that the arbitrage profit is locked in, just like we did.

This has been an incredibly comprehensive review. We covered the binomial replicating portfolio and risk-neutral methods, the Black-Scholes-Merton model with its dividend adjustments, and the mechanics of Put-Call Parity arbitrage. Thank you, Bot, for breaking down these complex topics.

My pleasure. Options valuation might seem intimidating, but once you master the underlying replication logic and the formulas, it becomes one of the most scoring areas in the AFM paper.

Absolutely. Thank you all for listening, and we will see you next time on the AFM Masterclass. Keep practicing those calculations.
