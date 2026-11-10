# Topic 3: Strategies

---

### 📋 Summary View

### 🔹 Sub-topic: Hedging & Price Discovery

#### 🔸 Hedging and Risk Management
- **Concept Summary:** Hedging is the practice of reducing risk exposure by taking an offsetting position in a derivative that is negatively correlated with the underlying asset.
- **Formula/Rule:** Hedging: Mitigate risk by entering a contract moving in opposite direction to underlying.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Price Discovery
- **Concept Summary:** Price discovery is the process by which market participants process information to establish equilibrium prices for future delivery.
- **Formula/Rule:** Price Discovery: Captures future demand/supply, indicating future price trends.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Financial Leverage
- **Concept Summary:** Leverage allows market participants to control large nominal positions with a small margin deposit, multiplying capital efficiency and risk exposure.
- **Formula/Rule:** Leverage: Pay part of total value to potentially make large gains from small movements.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Arbitrage Opportunities
- **Concept Summary:** Arbitrage involves executing offsetting trades in different markets to exploit pricing discrepancies and secure risk-free profits.
- **Formula/Rule:** Arbitrage: Earn riskless profit when derivatives trade away from theoretical prices.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Speculative Trading
- **Concept Summary:** Speculators take on market risk to profit from anticipated price movements, providing the liquidity needed for hedgers to manage their exposure.
- **Formula/Rule:** Speculation: Make gains based on view of price movement.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Transactional Efficiency
- **Concept Summary:** Derivatives markets offer transaction cost efficiency, execution flexibility, and access to assets that are difficult to trade physically.
- **Formula/Rule:** Other Advantages: Quick/low-cost transactions, flexibility, integrity (no counterparty default), alternative asset exposure.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

### 🔹 Sub-topic: Arbitrage Strategies

#### 🔸 Arbitrage Concept
- **Concept Summary:** Arbitrage is a zero-investment trading strategy that locks in a riskless profit by exploiting temporary pricing discrepancies between the spot and futures markets.
- **Formula/Rule:** Zero-investment strategy to make riskless profit by exploiting mispricing.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Arbitrage Execution Rule
- **Concept Summary:** Arbitrageurs execute simultaneous trades to buy in the underpriced market and sell in the overpriced market, eliminating execution risk.
- **Formula/Rule:** Buy low market, sell high market simultaneously.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Arbitrage Transaction Costs
- **Concept Summary:** Arbitrage profits are reduced by transaction costs, including brokerage, STT, exchange fees, and stock borrowing costs.
- **Formula/Rule:** Costs: Brokerage, STT, Margins, Stock Borrowing Charges.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Arbitrage Feasibility Rule
- **Concept Summary:** Arbitrage trades are only executed when the pricing mismatch is larger than the total transaction costs, ensuring a net positive return.
- **Formula/Rule:** Arbitrage is not undertaken if transaction costs exceed gains.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

---

### 🔍 Detailed View

### 🔹 Sub-topic: Hedging & Price Discovery

#### 🔸 Hedging and Risk Management
Hedging involves neutralizing price risk. An investor who owns a physical asset is 'long' the asset. To hedge, they take a 'short' position in the derivatives market.
**Worked Example:**
An investor owns 100 shares of Reliance at $\text{₹}2,500$ (total value $\text{₹}2,500 \times 100 = \text{₹}2,50000$). To hedge, they sell 1 Reliance futures contract (lot size 250 shares) at $\text{₹}2,510$.
If the stock price falls to $\text{₹}2,400$:
Loss in Cash Market = $(\text{₹}2,400 - \text{₹}2,500) \times 100 = -\text{₹}10,000$.
Gain in Futures Market = $(\text{₹}2,510 - \text{₹}2,400) \times 250 = +\text{₹}27,500$ (net positive due to lot size difference, illustrating an over-hedged position). To achieve a perfect hedge, the investor would match the face value of the hedge to the portfolio value.

#### 🔸 Price Discovery
Because the derivatives market is highly liquid and has low transaction costs, new information often reflects in derivative prices before cash market prices. Futures prices represent the market's expectation of the spot price at maturity, adjusted for the cost of carry:
$$F_t = \mathbb{E}_t [S_T] + \text{Risk Premium}$$
This forward-looking price helps producers and consumers hedge their future transactions, stabilizing supply chains.

#### 🔸 Financial Leverage
Leverage is defined as the ratio of exposure to capital. It is determined by the exchange's initial margin requirements:
$$\text{Leverage Factor} = $\frac{1}{\text{Initial Margin \%}}$$
If the initial margin for Nifty futures is 15%, the leverage factor is $1 / 0.15 \approx 6.67$. This means for every 1% change in Nifty's spot price, the return on your margin capital changes by 6.67%. If a broker offers additional intraday leverage, the risk of capital loss increases.

#### 🔸 Arbitrage Opportunities
Arbitrage maintains market efficiency. The most common form in derivatives is cash-and-carry arbitrage. If the futures price $F_0$ exceeds the spot price $S_0$ adjusted for interest rates and storage costs:
$$F_0 > S_0 e^{rT}$$
An arbitrageur will:
1. Borrow funds at rate $r$.
2. Buy the underlying asset in the spot market at $S_0$.
3. Sell the futures contract at $F_0$.
At maturity $T$, they deliver the asset to settle the futures contract, receive $F_0$, and repay the loan $S_0 e^{rT}$, locking in a profit of $F_0 - S_0 e^{rT}$.

#### 🔸 Speculative Trading
Speculation drives trading volume. Speculators use technical and fundamental analysis to predict price paths. They accept the risk that hedgers want to transfer. For example, if a farmer wants to lock in a wheat price (hedging), they need a speculator who is willing to buy that risk. The speculator believes prices will rise, allowing them to sell the contract later for a profit.

#### 🔸 Transactional Efficiency
Transactional efficiency is driven by:
1. **Lower Costs**: Brokerage, Securities Transaction Tax (STT), and exchange fees are lower for derivatives than for cash trades. On the NSE, STT on equity delivery is 0.1%, while STT on futures is 0.0125%.
2. **Flexibility**: Ability to short-sell easily. Short-selling shares in the cash market is restricted for overnight positions, but futures can be shorted for weeks.
3. **Frictionless Exposure**: Trading crude oil or natural gas futures on MCX without needing storage facilities.

### 🔹 Sub-topic: Arbitrage Strategies

#### 🔸 Arbitrage Concept
An arbitrage transaction requires no net capital outlay and carries no market risk. The trader buys the asset in the cheaper market and sells it in the more expensive market simultaneously. Because the two contracts must converge to the same price at maturity ($F_T = S_T$), the pricing discrepancy represents a guaranteed profit that is locked in at the time of the trade.

#### 🔸 Arbitrage Execution Rule
The execution of arbitrage depends on the direction of the mispricing:
1. **Cash-and-Carry Arbitrage** (when $F_0 > S_0 e^{rT}$):
Buy the asset in the spot market (low price).
Sell the futures contract (high price).
2. **Reverse Cash-and-Carry Arbitrage** (when $F_0 < S_0 e^{rT}$):
Short-sell the asset in the spot market (high price).
Buy the futures contract (low price).

#### 🔸 Arbitrage Transaction Costs
The net profit of an arbitrage trade must account for all transaction costs:
$$\text{Net Profit} = (F_0 - S_0 e^{rT}) - \text{Transaction Costs}$$
In India, these costs include:
**Securities Transaction Tax (STT)**: 0.1% on equity delivery trades.
**Brokerage**: Flat fee or percentage-based fee.
**Exchange Transaction Charges**: Paid to NSE/BSE.
**Stock Lending and Borrowing (SLB) Fees**: Required to borrow shares for short-selling.

#### 🔸 Arbitrage Feasibility Rule
An arbitrage trade is feasible if and only if:
$$\lvert F_{\text{market}} - F_{\text{theoretical}} \rvert > \text{Total Transaction Costs}$$
If the price difference is smaller than the costs, the trade is unprofitable. Because institutional brokers have lower transaction costs than retail traders, they can exploit smaller pricing discrepancies, keeping the markets efficient.

---

### 🎴 Flashcards

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Hedging is the practice of reducing risk exposure by taking an offsetting position in a derivative that is negatively correlated with the underlying asset.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Price discovery is the process by which market participants process information to establish equilibrium prices for future delivery.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Leverage allows market participants to control large nominal positions with a small margin deposit, multiplying capital efficiency and risk exposure.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Arbitrage involves executing offsetting trades in different markets to exploit pricing discrepancies and secure risk-free profits.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Speculators take on market risk to profit from anticipated price movements, providing the liquidity needed for hedgers to manage their exposure.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Derivatives markets offer transaction cost efficiency, execution flexibility, and access to assets that are difficult to trade physically.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Arbitrage is a zero-investment trading strategy that locks in a riskless profit by exploiting temporary pricing discrepancies between the spot and futures markets.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Arbitrageurs execute simultaneous trades to buy in the underpriced market and sell in the overpriced market, eliminating execution risk.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Arbitrage profits are reduced by transaction costs, including brokerage, STT, exchange fees, and stock borrowing costs.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Arbitrage trades are only executed when the pricing mismatch is larger than the total transaction costs, ensuring a net positive return.
</details>