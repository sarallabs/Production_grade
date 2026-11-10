Welcome back to our advanced AFM prep session. Today, we are focusing on Option Greeks. Bot, why are these sensitivities so critical for anyone looking to clear the CA Final exam?

Well, in spot or futures markets, risk is linear. If a stock goes up by one rupee, your position value moves by one rupee. But options are non-linear contracts. Their values don't move in a simple one-to-one ratio with the underlying asset. Option Greeks are the mathematical derivatives of option pricing models that help us isolate and measure how option prices react to changes in underlying parameters like stock price, time, volatility, and interest rates.

That is a crucial distinction. Let's start with the most famous Greek, Delta. Everyone knows it is the hedge ratio, but how should we think about Delta at an advanced level?

Delta is the first derivative of the option price with respect to the stock price. For a call option, it ranges from zero to positive one, and for a put, it ranges from negative one to zero. In practice, Delta represents three things: first, the sensitivity of the option price; second, the number of shares needed to replicate the option payoff; and third, a rough approximation of the probability that the option will expire in-the-money.

So if a call option has a Delta of zero-point-six, it behaves like owning sixty percent of a share of stock. To hedge a short call position, we would buy zero-point-six shares of stock. But Delta changes as the stock price moves, right? That brings us to Gamma.

Exactly. Gamma is the rate of change of Delta. It is the second derivative of the option price with respect to the stock price. Gamma measures the acceleration of Delta. When you are long an option, whether it is a call or a put, your Gamma is positive. This means as the stock price rises, your Delta becomes more positive, and as the stock price falls, your Delta becomes less positive. In other words, Gamma works in your favor.

But Gamma also makes hedging difficult. If Gamma is high, a delta-hedged portfolio will quickly become unhedged when the stock price moves, forcing the trader to constantly buy and sell stock to rebalance. Where is Gamma risk the highest?

Gamma is highest for at-the-money options that are very close to expiration. At that stage, a minor tick in the stock price can instantly flip the option from being out-of-the-money to in-the-money, causing the Delta to swing violently between zero and one.

That makes perfect sense. Now, let's talk about the trade-off. If options buyers benefit from positive Gamma, what is the cost they pay?

The cost is Theta, or time decay. Theta is the rate at which the option's value declines as it gets closer to expiration, assuming all other factors remain constant. Since options have a fixed expiration date, their time value continuously decays. Theta is negative for option buyers and positive for option sellers. This is the fundamental trade-off: you pay Theta decay to stay long Gamma.

And just like Gamma, Theta decay accelerates rapidly close to expiration, especially for at-the-money options. Now, what about volatility? That is measured by Vega.

Vega measures the sensitivity of the option price to a one percent change in implied volatility. Unlike traditional assets where risk is penalized, options become more valuable as volatility increases. This is because high volatility increases the probability of large price swings, which benefits the option holder who has capped downside risk. Therefore, Vega is positive for both long calls and long puts, and it peaks for at-the-money options with longer times to expiration.

Finally, we have Rho. Rho measures interest rate sensitivity. Why does a higher interest rate increase call option prices but decrease put option prices?

Think of this in terms of cost of carry. When you buy a call option, you have the right to purchase the stock later. This allows you to conserve your cash and earn interest on it today. So, higher interest rates make this cash conservation more valuable, increasing the call premium. For a put option, you are waiting to sell the stock and receive cash. Higher interest rates discount the present value of that future cash receipt, which reduces the put premium.

That is a very intuitive way to remember the interest rate effect. Thanks, Bot. That is a wrap for today's session on the Greeks. Keep revising, and we will see you in the next episode.
