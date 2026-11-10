Hello and welcome back to the AFM Masterclass Podcast. Today, we are diving deep into the advanced quantitative frameworks of Mutual Funds. We'll be unpacking portfolio risk decomposition, performance evaluation indexes, ETF arbitrage mechanics, and the complex world of hedge fund fee structures. 

That is a massive lineup. I think we should start with performance evaluation. Every year in the CA Final AFM exam, we see problems testing Sharpe, Treynor, and Jensen's Alpha. But students often struggle to understand why these metrics sometimes rank the same portfolios differently. 

Ah, yes. The famous ranking conflicts. To understand this, we first have to break down what risk means under each ratio. Let's look at the Sharpe ratio first. The formula is the portfolio's average return minus the risk-free rate, divided by the portfolio's standard deviation. The standard deviation represents the total risk of the portfolio. 

Right. Total risk includes both systematic risk—which is market risk that you can't get rid of—and unsystematic risk, which is the risk specific to individual companies in that portfolio. 

Exactly. Now compare that with the Treynor ratio. The numerator is the same: the portfolio's excess return. But the denominator is Beta. Beta measures systematic risk only. It completely ignores unsystematic risk. 

So if a portfolio is not well-diversified, it will have a lot of unsystematic risk. This means its standard deviation will be high relative to its Beta. 

Yes. If you rank portfolios using Sharpe, a poorly diversified portfolio will be heavily penalized because of its high total risk. But if you rank that same portfolio using Treynor, it won't be penalized for that unsystematic risk because Treynor only cares about Beta. 

I see! So a poorly diversified portfolio might look amazing under Treynor but look terrible under Sharpe. 

Spot on. Mathematically, we can see this by looking at risk decomposition. The total variance of a portfolio is equal to Beta squared times the market variance, plus the residual variance. The residual variance is the unsystematic risk. 

And if we look at the coefficient of determination, which is R-squared, it tells us the percentage of total risk explained by the market. If R-squared is close to one, it means the portfolio is well-diversified and has almost no unsystematic risk. In that case, Sharpe and Treynor rankings will be identical. 

That's a beautiful mathematical proof. In fact, if the portfolio is perfectly diversified, the portfolio's standard deviation is simply Beta times the market standard deviation. If you substitute that into the Sharpe ratio, it becomes the Treynor ratio divided by the market standard deviation. Since the market standard deviation is a constant, the rankings must align. 

That is so clear. But what about Jensen's Alpha? That's an absolute measure of return premium, right?

Yes. Jensen's Alpha calculates how much excess return a portfolio generates compared to what it *should* have generated under the Capital Asset Pricing Model, or CAPM, for its level of Beta. The formula is the actual portfolio return minus the sum of the risk-free rate plus Beta times the market risk premium. 

Since Alpha is expressed as a percentage return rather than a ratio, it doesn't scale the return by risk. So a fund could have a very high Jensen's Alpha in absolute terms, but because it took on massive total risk, its Sharpe ratio could be lower than a conservative fund with a smaller Alpha. 

Exactly. That's why institutional investors use all three. If you're a retail investor putting all your money into one fund, Sharpe is your best friend because you care about total risk. If you're a pension fund adding a mutual fund to a highly diversified multi-asset portfolio, you care about systematic risk, so Treynor and Jensen's Alpha are the right tools.

That makes perfect sense. Now, let's switch gears to another fascinating mechanism: Exchange Traded Funds, or ETFs. Unlike traditional open-ended mutual funds where you buy and redeem units directly with the fund house at the end of the day, ETFs trade on stock exchanges in real-time. 

That's right. And this raises an important question: how does the market price of an ETF stay so close to the actual value of its underlying assets, the NAV? In closed-ended funds, we often see shares trading at a ten or twenty percent discount to NAV. Why doesn't that happen to ETFs?

The secret lies in a special group of institutional players called Authorized Participants, or APs. They are the only ones who can create or redeem ETF units, and they do it through an in-kind creation-redemption process. 

In-kind? Meaning they don't transact in cash?

Exactly. They deal in baskets of shares. Let's look at how they arbitrage price differences. Suppose an ETF is trading at a premium on the exchange. The ETF market price is one hundred and five rupees, but the NAV is only one hundred rupees. 

So the ETF is overvalued relative to the actual stocks it holds. 

Yes. To exploit this, the Authorized Participant buys the underlying stocks in the spot market for one hundred rupees. They pack these stocks into a basket and deliver them to the ETF sponsor. In exchange, the sponsor issues a large block of new ETF units—called a Creation Unit—to the AP. 

And then the AP immediately sells these new ETF units on the stock exchange at the market price of one hundred and five rupees. 

Right. They make a risk-free profit of five rupees per unit. But more importantly, by selling those ETF units on the exchange, they increase the market supply of the ETF. This extra supply drives the market price back down from one hundred and five to one hundred rupees, aligning it with the NAV.

That's incredibly elegant. What happens if the ETF trades at a discount? Say, market price is ninety-five rupees and NAV is one hundred rupees.

The reverse happens. The AP buys the cheap ETF units on the stock exchange for ninety-five rupees. They bundle them into a Creation Unit and deliver them to the ETF sponsor for redemption. The sponsor cancels the ETF units and hands the AP the underlying stock basket worth one hundred rupees. The AP then sells the stocks in the spot market for one hundred rupees, locking in a five-rupee profit. 

And by buying up the cheap ETF units on the exchange, the AP reduces the supply of the ETF. That buying pressure pushes the market price back up to its NAV. 

That is how the creation-redemption mechanism works. It's a continuous, self-correcting arbitrage loop that keeps ETF market prices tightly aligned with their underlying asset values. 

It's like a decentralized stabilization system. Now, let's look at another crisis-management tool: side-pocketing. This is something we've seen a lot in recent years, especially when debt funds face sudden credit defaults. 

Side-pocketing is a crucial accounting practice. When a debt security in a mutual fund scheme defaults or gets severely downgraded, it becomes highly illiquid. If the fund doesn't do anything, panic-stricken investors will start redeeming their units. 

Right. And to pay those redeeming investors, the fund manager would be forced to sell the good, liquid assets in the portfolio. That leaves the remaining, loyal investors holding a portfolio full of toxic, uncollectible debt. 

Exactly. To prevent this, the AMC can create a "side pocket." They segregate the distressed debt asset from the main portfolio into a separate, new scheme. The NAV of the original scheme is split. For example, if the original NAV was twenty-five rupees, it might split into a main liquid portfolio with an NAV of twenty-two rupees, and a side-pocketed portfolio with an NAV of three rupees.

Existing investors receive units in the side-pocketed scheme on a pro-rata basis. But the key is that these side-pocketed units are locked. No one can buy new units, and no one can redeem them. 

Yes. The main portfolio remains open and fully liquid. The toxic assets are isolated, giving the fund manager time to work on recovering the default debt without hurting the daily operations of the main fund. As the AMC recovers cash from the defaulted issuer, they pay it out to the side-pocketed unit holders and cancel the units. It's a vital tool to prevent runs on debt funds.

It really protects the investors who choose to stay in the fund. Let's move to our final topic for today: hedge funds and their incentive fee calculations. Unlike mutual funds, which charge a simple expense ratio, hedge funds operate on a performance-based fee structure, often called the two-and-twenty structure. 

That means a flat two percent management fee and a twenty percent incentive fee. But calculating that twenty percent isn't always straightforward. We have to account for hurdle rates and the high-water mark rule. 

Let's define the high-water mark first. It is the highest historical valuation that the hedge fund has reached at the end of any previous performance period. The manager cannot charge any performance fee unless the fund's current valuation beats this mark. 

Right. It prevents managers from getting paid twice for the same performance. If the fund drops from one hundred crores to ninety crores in Year 1, and then recovers to one hundred crores in Year 2, the manager cannot charge an incentive fee in Year 2 because they haven't created any *new* wealth. They must exceed the high-water mark of one hundred crores first. 

And then we have the hurdle rate. A hard hurdle means the manager only charges the twenty percent fee on returns *above* the hurdle rate. A soft hurdle means that once the fund passes the hurdle, the manager can charge the fee on the entire return. 

Let's walk through a multi-year calculation to see how these interact. Suppose a hedge fund starts Year 1 with one hundred crores. The management fee is one and a half percent, and the incentive fee is twenty percent above a hard hurdle of eight percent, with a high-water mark rule. 

In Year 1, the fund does great and generates an eighteen percent return before fees. 

First, we calculate the management fee: one and a half percent of one hundred crores is one point five crores. The fund value before incentive fees is one hundred plus eighteen minus the one point five crore fee, which is one hundred and sixteen point five crores. 

The hurdle return is eight percent of the opening assets, which is eight crores. So the hurdle threshold value is one hundred and eight crores. 

Since the fund value of one hundred and sixteen point five crores exceeds the hurdle of one hundred and eight, the manager is eligible for an incentive fee. The eligible profit is the value above the hurdle: one hundred and sixteen point five minus one hundred and eight, which is eight point five crores. 

Twenty percent of eight point five crores is one point seven crores. So the closing net assets of the fund after all fees is one hundred and sixteen point five minus one point seven, which is one hundred and fourteen point eight crores. 

And that one hundred and fourteen point eight crores becomes the new high-water mark. 

Now, what happens in Year 2 if the fund loses six percent? 

The opening AUM is one hundred and fourteen point eight crores. The management fee is one and a half percent of that, which is one point seven two crores. The gross return is minus six percent, which reduces the portfolio by six point eight nine crores. So the fund value before incentive fees is one hundred and fourteen point eight minus six point eight nine minus the one point seven two management fee, which is one hundred and six point one nine crores. 

Since this is way below the high-water mark of one hundred and fourteen point eight crores, the incentive fee is zero. The closing net assets are one hundred and six point one nine crores, and the high-water mark remains unchanged at one hundred and fourteen point eight. 

Exactly. Now let's look at Year 3. The fund recovers and returns fifteen percent gross. 

Opening AUM is one hundred and six point one nine crores. The management fee is one point five nine crores. The gross return of fifteen percent adds fifteen point nine three crores. So the fund value before incentive fees is one hundred and six point one nine plus fifteen point nine three minus one point five nine, which is one hundred and twenty point five three crores. 

Now we must check the constraints. The high-water mark to beat is one hundred and fourteen point eight crores. The hurdle rate of eight percent on the opening assets of one hundred and six point one nine crores is eight point five crores, making the hurdle threshold one hundred and fourteen.six nine crores. 

Since the high-water mark of one hundred and fourteen point eight is higher than the hurdle threshold of one hundred and fourteen point six nine, the high-water mark is the binding constraint. The manager only gets paid on the profit that exceeds the high-water mark. 

That is the crucial point. The eligible profit is one hundred and twenty point five three minus the high-water mark of one hundred and fourteen point eight, which is five point seven three crores. The incentive fee is twenty percent of that: one point one five crores. 

And the final closing net assets for Year 3 are one hundred and twenty point five three minus one point one five, which is one hundred and nineteen point three eight crores. This becomes the new high-water mark. 

This multi-year case demonstrates the mathematical rigor of the high-water mark rule. It protects investor capital and aligns the manager's incentives with true value creation. 

That was a brilliant walk-through. It covers everything from portfolio ratios to the operational plumbing of ETFs and hedge funds. Thank you for joining us today, and happy studying to all the CA Final AFM aspirants out there!