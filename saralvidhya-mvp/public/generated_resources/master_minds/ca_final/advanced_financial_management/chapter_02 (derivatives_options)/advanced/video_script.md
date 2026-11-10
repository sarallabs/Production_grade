### Scene 1: The Asymmetry of Options

**Visual Prompt:**
A sleek, dark-themed trading room. On a large holographic screen in the center, a white line represents a futures payoff, rising at a 45-degree angle to the right and falling at the same angle to the left. Suddenly, a bright gold line appears, tracing the hockey-stick payoff of a long call option: flat along the horizontal axis, then bending sharply upward at the strike price. The text "Futures: Symmetrical" and "Options: Asymmetrical" fades in with clean typography.

**Narration:**
In financial markets, futures and options represent two entirely different risk dimensions. While futures lock in linear, symmetrical payoffs, options introduce asymmetry—giving the buyer uncapped profit potential while strictly capping the downside to the premium paid.

---

### Scene 2: The Dashboard of Option Greeks

**Visual Prompt:**
Close-up of a high-tech terminal screen. Five glowing icons represent the Option Greeks: Delta ($\Delta$), Gamma ($\Gamma$), Theta ($\Theta$), Vega ($\nu$), and Rho ($\rho$). The camera pans across each Greek, showing its mathematical definition. Delta is highlighted first, showing $\Delta = \frac{\partial C}{\partial S}$, followed by Gamma, showing $\Gamma = \frac{\partial^2 C}{\partial S^2}$. The background displays floating candlestick charts.

**Narration:**
To analyse non-linear option payoffs and hedge ratios, practitioners use the standard Greeks: Delta (price sensitivity), Gamma (rate of change of Delta), Theta (time decay), Vega (implied volatility sensitivity), and Rho (interest-rate sensitivity). Together they summarise how model price moves when inputs shift.

---

### Scene 3: The Binomial Pricing Tree

**Visual Prompt:**
A glowing, three-dimensional binomial tree branches out against a dark blue background. The root node shows the current stock price, $S_0$. Two branches extend forward to $S_u$ and $S_d$. Formulas for the option Delta ($\Delta = \frac{C_u - C_d}{S_u - S_d}$) and the risk-neutral probability ($p = \frac{e^{rt} - d}{u - d}$) emerge from the branches in glowing blue text. The camera moves along the tree, tracing the backward induction process from maturity back to the present.

**Narration:**
To value an option, the Binomial model assumes discrete price movements. By constructing a replicating portfolio—buying shares of stock and borrowing cash at the risk-free rate—we create a synthetic option. In equilibrium, the option price today must exactly equal the cost of this replicating portfolio, which is mathematically identical to the discounted expected payoff under risk-neutral probabilities.

---

### Scene 4: The Black-Scholes-Merton Model & Dividends

**Visual Prompt:**
A camera slowly dollying forward as the complex Black-Scholes-Merton formula is written out in gold text: $C_0 = S_0 N(d_1) - X e^{-rT} N(d_2)$. The screen shifts to a timeline showing a stock paying a discrete dividend. The spot price $S_0$ on the screen gets replaced by $S_0^* = S_0 - D e^{-r t_d}$. The text "Dividend Adjustment" glows red, illustrating the present value of the dividend being subtracted from the spot stock price.

**Narration:**
In continuous time, the Black-Scholes-Merton model provides a closed-form solution. However, when a stock pays a dividend during the option's life, the ex-dividend drop reduces the call option's value. To adjust the BSM model, we must subtract the present value of the dividend from the spot stock price today, ensuring the option is priced accurately.

---

### Scene 5: Put-Call Parity & Conversion Arbitrage

**Visual Prompt:**
An elegant digital balance scale appears. On the left scale sits a Call Option and a Treasury Bond. On the right scale sits a Put Option and a Share of Stock. The scale tips to the left, showing that the Call side is overpriced: $C + X e^{-rT} > S + P$. The screen displays the arbitrage actions: "Sell Call, Buy Put, Buy Stock, Borrow Cash." The scale slowly balances out as trades are executed.

**Narration:**
Put-Call Parity is a fundamental market law. When this balance is violated, arbitrageurs step in. If the Call side is overvalued, a trader executes Conversion Arbitrage—selling the Call, buying the Put, buying the stock, and borrowing the present value of the strike. This combination locks in a risk-free profit at maturity, regardless of market direction.

---

### Scene 6: The Advanced AFM Exam Checklist

**Visual Prompt:**
A clean, minimalist checklist appears on the screen with subtle neon green highlights. The points read: "Check if probabilities sum to 1.00", "Evaluate early exercise at every binomial node for American options", "Apply ex-dividend timing adjustments". The video concludes with the text "Master the Mechanics. Ace AFM" fading in as the background fades to black.

**Narration:**
Success in advanced AFM options questions lies in the details. Always verify that probabilities sum to one, evaluate early exercise at every node for American options, and apply ex-dividend adjustments correctly. Understand the replication logic, and you will master the exam.
