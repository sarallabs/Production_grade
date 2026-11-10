# Topic 4: Methods

---

### 📋 Summary View

### 🔹 Sub-topic: Pricing Methods

#### 🔸 Contango Market Structure
- **Concept:** Contango is a market situation where the future price of an asset is higher than its current spot price. This is normal because holding an asset over time involves costs like interest and storage.
- **Analogy:** Buying a train ticket. Booking a ticket for a journey three months from now is often more expensive than buying a ticket for a train leaving today, due to booking fees and time premiums.
- **Key Takeaway:** Contango is the normal market state where futures prices are higher than spot prices.

#### 🔸 Backwardation Market Structure
- **Concept:** Backwardation is when the future price of an asset is lower than its current spot price. This usually happens when there is a sudden shortage of the asset today, making people willing to pay a premium for immediate delivery.
- **Analogy:** Imagine an onion shortage in Delhi. Today, onions cost ₹100/kg because they are scarce. But everyone expects new crops to arrive next month, so you can book onions for delivery next month at only ₹40/kg.
- **Key Takeaway:** Backwardation occurs when spot prices are higher than futures prices, indicating a current supply shortage.

#### 🔸 Cost of Carry Fundamentals
- **Concept:** The price of a futures contract is equal to the current spot price of the asset plus the cost of holding that asset until the contract expires (the Cost of Carry).
- **Analogy:** Buying a ticket to a concert in another city. The total cost is the ticket price (spot price) plus your travel and hotel expenses (cost of carry).
- **Key Takeaway:** Futures Price is Spot Price plus the cost to hold the asset over time.

#### 🔸 Simple Interest Formula
- **Concept:** This formula calculates the futures price using simple interest. It adds the spot price to the interest cost calculated over the contract period.
- **Analogy:** Borrowing money from a friend who charges you a flat interest fee at the end of the loan, without compounding.
- **Key Takeaway:** Simple interest pricing is used for short-term contracts or simple calculations.

#### 🔸 Continuous Compounding Formula
- **Concept:** This formula uses continuous compounding, which assumes interest is calculated and added back constantly, second by second. This is the standard method used by professionals.
- **Analogy:** Like a snowball rolling down a hill, gathering more snow continuously as it moves, rather than growing only in steps.
- **Key Takeaway:** Continuous compounding is the standard mathematical model for pricing futures contracts.

#### 🔸 Adjusting for Dividends Paid Before Expiry
- **Concept:** If a company pays a dividend before the futures contract expires, the value of that dividend is deducted from the futures price. This is because futures holders do not receive the dividend.
- **Analogy:** If you buy a fruit tree that will drop its fruit (dividend) before you take delivery next month, you expect to pay less for the tree because the seller will keep the fruit.
- **Key Takeaway:** Dividends reduce the futures price because they reduce the value of the company when paid.

#### 🔸 Relevance of Dividend Timing
- **Concept:** Only dividends paid during the life of the futures contract affect its price. Dividends paid after the contract expires are not included in the calculation.
- **Analogy:** If you rent an apartment for the month of January, you only care about utility bills or maintenance work scheduled for January. You do not pay for repairs scheduled for February.
- **Key Takeaway:** Dividends paid after the contract's expiry date have zero effect on its price.

#### 🔸 Index Dividends and Dividend Yield
- **Concept:** Since a market index like Nifty 50 contains 50 different stocks, they pay dividends at different times. Instead of tracking each dividend, professionals use an average 'dividend yield' (a percentage rate) to price index futures.
- **Analogy:** Instead of counting every individual drop of rain, you measure the average rainfall in inches per hour to plan your crops.
- **Key Takeaway:** Index futures use a continuous dividend yield percentage rather than discrete cash dividend amounts.

#### 🔸 Index Futures Pricing Formula
- **Concept:** This formula calculates the price of an index futures contract by taking the spot price and multiplying it by the interest rate minus the dividend yield, compounded continuously.
- **Analogy:** Like a savings account that pays you interest (r) but charges you a maintenance fee (d). Your money grows at the net rate of interest minus the fee.
- **Key Takeaway:** The index futures price is spot price compounded at the net rate of interest minus dividend yield.

#### 🔸 Net Cost of Carry Definition
- **Concept:** The Net Cost of Carry is the interest rate you pay to borrow money to buy the index, minus the dividend income you receive from holding those shares.
- **Analogy:** If you buy a house with a home loan at 8% interest (r), and rent it out to a tenant for a 3% rental yield (d), your net cost to hold the house is 8% - 3% = 5% per year.
- **Key Takeaway:** Net Cost of Carry is the net financial rate (interest cost minus dividend return) of holding an index position.

### 🔹 Sub-topic: Expiry & Rollover Methods

#### 🔸 Expiry Cycle & Last Thursday Rule
- **Concept:** Every derivative contract has a deadline (expiry) after which it ceases to trade. In India, equity contracts expire on the last Thursday of their month.
- **Analogy:** Think of it like a monthly train pass which is valid only until the last day of the month; you must renew it or it becomes invalid.
- **Key Takeaway:** Derivative contracts have a fixed life and expire on the last Thursday of the month.

#### 🔸 Rollover of Futures Positions
- **Concept:** Rollover means shifting your trade from a contract that is expiring this month to the next month's contract so you can continue holding your position.
- **Analogy:** Like renewing your subscription to a magazine before it runs out so you don't miss next month's issue.
- **Key Takeaway:** If you want to keep your trade open beyond this month, you must perform a rollover.

#### 🔸 Physical vs. Cash Settlement
- **Concept:** At expiration, stock trades are settled by exchanging actual shares of the company, while index trades (like Nifty) are settled by exchanging cash profits/losses.
- **Analogy:** Like buying gold. Physical settlement is taking home the actual gold bar; cash settlement is getting the cash value change of gold without taking the bar.
- **Key Takeaway:** In India, individual stock contracts involve delivery of physical shares, but market indexes are settled purely in cash.

### 🔹 Sub-topic: Trend & Momentum Methods

#### 🔸 Momentum Trading in Futures
- **Concept:** Momentum trading means buying assets that are rising in price and selling those that are falling, expecting the trend to continue.
- **Analogy:** Like jumping onto a moving train that is picking up speed, rather than waiting for one that is standing still.
- **Key Takeaway:** Momentum trading focuses on price speed and strength rather than buying cheap.

#### 🔸 Moving Average Crossovers
- **Concept:** A moving average crossover is when a fast-moving average line crosses a slow-moving average line, signaling a buy or sell signal.
- **Analogy:** Like a weather forecast. When a warm wind front crosses a cold front, it predicts a change in season (trend).
- **Key Takeaway:** When the fast average crosses above the slow average, it is a buy signal; when it crosses below, it is a sell signal.

#### 🔸 Volatility and Stop Losses in Leverage
- **Concept:** Because futures are highly leveraged, a small price move against you can wipe out your margin. A stop-loss is an automatic order to close your trade at a set price to limit your losses.
- **Analogy:** Like a seatbelt in a car. It doesn't prevent a crash, but it prevents you from suffering a fatal injury if a crash happens.
- **Key Takeaway:** Never trade futures without a stop-loss order; it protects you from losing your entire trading account.

---

### 🔍 Detailed View

### 🔹 Sub-topic: Pricing Methods

#### 🔸 Contango Market Structure
If spot gold is trading at ₹65,000 per 10 grams, and 3-month gold futures are trading at ₹66,200, the market is in Contango. The difference (₹1,200) represents the cost of storage, insurance, and the interest on the money tied up in holding gold for three months. This difference is called the 'cost of carry'.

#### 🔸 Backwardation Market Structure
If spot copper is trading at ₹800/kg due to a strike at a major mine, but 3-month futures are trading at ₹750/kg, the market is in Backwardation. Buyers need copper immediately to keep their factories running, so they pay a premium for spot copper. They do not want to wait for the futures delivery, even though it is cheaper.

#### 🔸 Cost of Carry Fundamentals
If you buy shares today and hold them for a month, you tie up your cash and lose interest on that money. The cost of carry accounts for this interest. For physical goods like wheat or gold, the cost of carry also includes the cost of warehousing and insurance. The futures price reflects these costs so that there is no advantage to buying the asset now versus buying the futures contract.

#### 🔸 Simple Interest Formula
If you borrow ₹10,000 for 3 months at 12% simple interest, you pay ₹300 interest at the end. The futures price is calculated similarly: you take the spot price and add the interest cost for the number of months until the contract expires.

#### 🔸 Continuous Compounding Formula
In modern finance, money is assumed to grow continuously. The constant 'e' (approx 2.718) is used to calculate this continuous growth. The formula multiplies the spot price by $e$ raised to the power of the interest rate times the time to maturity. This gives a more accurate price for financial contracts.

#### 🔸 Adjusting for Dividends Paid Before Expiry
When a company pays a dividend, cash leaves the company's bank account, reducing the company's value. The stock price drops on the day the stock goes ex-dividend. Since the futures price tracks the stock price, it must also be lower to reflect this dividend drop. The formula subtracts the dividend value from the spot price plus carrying cost.

#### 🔸 Relevance of Dividend Timing
If a futures contract expires on October 26, and the company declares a dividend to be paid on November 10, that dividend is irrelevant for the October contract. The holder of the October futures contract will have closed their position before the stock price drops for the dividend, so no adjustment is made to the October price.

#### 🔸 Index Dividends and Dividend Yield
A stock index is a basket of stocks. In any given month, several companies in the Nifty 50 might pay dividends. Trying to subtract each individual dividend would make the formula complicated. Instead, the exchange calculates a dividend yield (e.g., 1.5% per year) and treats it as a continuous payment, simplifying the calculation.

#### 🔸 Index Futures Pricing Formula
Since holding the index requires paying interest to borrow funds ($r$) but provides dividends ($d$), the net cost of carry is $r - d$. The formula uses continuous compounding with this net rate to find the fair price of the futures contract.

#### 🔸 Net Cost of Carry Definition
When you buy an index contract, you are getting exposure to the index. If you bought the actual stocks, you would pay interest on the money you borrowed, but you would get dividends. The net cost of carry is the difference between these two rates. It represents the net rate at which the futures price should trade at a premium or discount to the spot price.

### 🔹 Sub-topic: Expiry & Rollover Methods

#### 🔸 Expiry Cycle & Last Thursday Rule
In Indian markets, futures and options are monthly contracts. On the expiry day, all open positions must be settled. If the last Thursday of the month is a public holiday, the expiry is shifted to the preceding trading day (usually Wednesday).

#### 🔸 Rollover of Futures Positions
Because futures contracts expire monthly, you cannot hold them forever. To keep a position active for three months, you sell your current month's contract on or before expiry and buy the next month's contract.

#### 🔸 Physical vs. Cash Settlement
If you hold a stock futures contract till expiry, you must deliver or take delivery of the actual shares in your demat account, requiring huge capital. Index futures (like Nifty 50) have no physical shares to deliver, so they are always settled in cash.

### 🔹 Sub-topic: Trend & Momentum Methods

#### 🔸 Momentum Trading in Futures
Instead of looking for undervalued stocks, momentum traders look for stocks with strong upward or downward trends. They use futures because leverage allows them to make large profits from quick, short-term price movements.

#### 🔸 Moving Average Crossovers
Moving averages smooth out daily price noise. A 9-day average moves faster than a 21-day average. If the 9-day crosses above the 21-day, it shows short-term prices are rising faster than long-term prices, signaling a buy.

#### 🔸 Volatility and Stop Losses in Leverage
Leverage is a double-edged sword. If you trade with 10x leverage, a 10% fall in the stock price wipes out 100% of your deposit. A stop-loss ensures that if the stock falls by 2%, your trade is automatically closed, limiting your loss to 20% of your deposit.

---

### 🎴 Flashcards

<details>
<summary>⚡ Card 1: What is the core concept of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Contango is a market situation where the future price of an asset is higher than its current spot price. This is normal because holding an asset over time involves costs like interest and storage.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Buying a train ticket. Booking a ticket for a journey three months from now is often more expensive than buying a ticket for a train leaving today, due to booking fees and time premiums.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Contango is the normal market state where futures prices are higher than spot prices.
</details>

<details>
<summary>⚡ Card 1: What is the core concept of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Backwardation is when the future price of an asset is lower than its current spot price. This usually happens when there is a sudden shortage of the asset today, making people willing to pay a premium for immediate delivery.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Imagine an onion shortage in Delhi. Today, onions cost ₹100/kg because they are scarce. But everyone expects new crops to arrive next month, so you can book onions for delivery next month at only ₹40/kg.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Backwardation occurs when spot prices are higher than futures prices, indicating a current supply shortage.
</details>

<details>
<summary>⚡ Card 1: What is the core concept of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The price of a futures contract is equal to the current spot price of the asset plus the cost of holding that asset until the contract expires (the Cost of Carry).
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Buying a ticket to a concert in another city. The total cost is the ticket price (spot price) plus your travel and hotel expenses (cost of carry).
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Futures Price is Spot Price plus the cost to hold the asset over time.
</details>

<details>
<summary>⚡ Card 1: What is the core concept of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> This formula calculates the futures price using simple interest. It adds the spot price to the interest cost calculated over the contract period.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Borrowing money from a friend who charges you a flat interest fee at the end of the loan, without compounding.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Simple interest pricing is used for short-term contracts or simple calculations.
</details>

<details>
<summary>⚡ Card 1: What is the core concept of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> This formula uses continuous compounding, which assumes interest is calculated and added back constantly, second by second. This is the standard method used by professionals.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Like a snowball rolling down a hill, gathering more snow continuously as it moves, rather than growing only in steps.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Continuous compounding is the standard mathematical model for pricing futures contracts.
</details>

<details>
<summary>⚡ Card 1: What is the core concept of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> If a company pays a dividend before the futures contract expires, the value of that dividend is deducted from the futures price. This is because futures holders do not receive the dividend.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> If you buy a fruit tree that will drop its fruit (dividend) before you take delivery next month, you expect to pay less for the tree because the seller will keep the fruit.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Dividends reduce the futures price because they reduce the value of the company when paid.
</details>

<details>
<summary>⚡ Card 1: What is the core concept of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Only dividends paid during the life of the futures contract affect its price. Dividends paid after the contract expires are not included in the calculation.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> If you rent an apartment for the month of January, you only care about utility bills or maintenance work scheduled for January. You do not pay for repairs scheduled for February.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Dividends paid after the contract's expiry date have zero effect on its price.
</details>

<details>
<summary>⚡ Card 1: What is the core concept of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Since a market index like Nifty 50 contains 50 different stocks, they pay dividends at different times. Instead of tracking each dividend, professionals use an average 'dividend yield' (a percentage rate) to price index futures.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Instead of counting every individual drop of rain, you measure the average rainfall in inches per hour to plan your crops.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Index futures use a continuous dividend yield percentage rather than discrete cash dividend amounts.
</details>

<details>
<summary>⚡ Card 1: What is the core concept of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> This formula calculates the price of an index futures contract by taking the spot price and multiplying it by the interest rate minus the dividend yield, compounded continuously.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Like a savings account that pays you interest (r) but charges you a maintenance fee (d). Your money grows at the net rate of interest minus the fee.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The index futures price is spot price compounded at the net rate of interest minus dividend yield.
</details>

<details>
<summary>⚡ Card 1: What is the core concept of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The Net Cost of Carry is the interest rate you pay to borrow money to buy the index, minus the dividend income you receive from holding those shares.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> If you buy a house with a home loan at 8% interest (r), and rent it out to a tenant for a 3% rental yield (d), your net cost to hold the house is 8% - 3% = 5% per year.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Net Cost of Carry is the net financial rate (interest cost minus dividend return) of holding an index position.
</details>

<details>
<summary>⚡ Card 1: When do equity futures contracts expire in India? (Click to reveal)</summary>
<br>
<b>Answer:</b> On the last Thursday of the contract month (or the preceding Wednesday if Thursday is a holiday).
</details>

<details>
<summary>⚡ Card 2: What happens to a contract after its expiry date? (Click to reveal)</summary>
<br>
<b>Answer:</b> The contract ceases to exist and must be settled (either in cash or through physical delivery).
</details>

<details>
<summary>⚡ Card 1: What does rolling over a position mean? (Click to reveal)</summary>
<br>
<b>Answer:</b> Closing the expiring near-month contract and opening a new one in the next month's contract.
</details>

<details>
<summary>⚡ Card 2: Do futures automatically roll over? (Click to reveal)</summary>
<br>
<b>Answer:</b> No, you must manually place a roll trade or your broker will settle it at expiry.
</details>

<details>
<summary>⚡ Card 1: How are stock derivatives settled in India? (Click to reveal)</summary>
<br>
<b>Answer:</b> Through physical delivery of the underlying shares.
</details>

<details>
<summary>⚡ Card 2: How are index derivatives (like Nifty 50) settled? (Click to reveal)</summary>
<br>
<b>Answer:</b> Purely in cash based on the closing price of the index.
</details>

<details>
<summary>⚡ Card 1: What is momentum trading? (Click to reveal)</summary>
<br>
<b>Answer:</b> A strategy of trading in the direction of the recent strong price trend, expecting it to continue.
</details>

<details>
<summary>⚡ Card 2: Why do momentum traders prefer futures? (Click to reveal)</summary>
<br>
<b>Answer:</b> Futures offer high leverage and allow easy short-selling to profit from falling trends.
</details>

<details>
<summary>⚡ Card 1: What is a Golden Cross? (Click to reveal)</summary>
<br>
<b>Answer:</b> When a short-term moving average crosses above a long-term moving average, signaling a new uptrend (Buy).
</details>

<details>
<summary>⚡ Card 2: What is a Death Cross? (Click to reveal)</summary>
<br>
<b>Answer:</b> When a short-term moving average crosses below a long-term moving average, signaling a new downtrend (Sell).
</details>

<details>
<summary>⚡ Card 1: What is a stop-loss order? (Click to reveal)</summary>
<br>
<b>Answer:</b> An order placed with a broker to sell or buy an asset once it reaches a specific price, limiting the trader's loss.
</details>

<details>
<summary>⚡ Card 2: Why is a stop-loss critical in futures trading? (Click to reveal)</summary>
<br>
<b>Answer:</b> Because high leverage can turn minor price movements into massive losses very quickly.
</details>