# Topic 3: Strategies

---

### 📋 Summary View

### 🔹 Sub-topic: Hedging & Price Discovery

#### 🔸 Hedging and Risk Management
- **Strategic Context:** Hedging involves minimizing portfolio variance by establishing a derivative position that offsets the systematic risk factor (Beta) of the underlying assets.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Price Discovery
- **Strategic Context:** Price discovery is the mechanism where information is incorporated into asset prices, with the derivatives market often leading the spot market due to lower transaction costs and leverage.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Financial Leverage
- **Strategic Context:** Financial leverage in derivatives allows firms to manage capital structure by taking exposures without utilizing full balance sheet capacity.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Arbitrage Opportunities
- **Strategic Context:** Arbitrage represents a risk-neutral replication strategy that exploits pricing deviations from the law of one price.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Speculative Trading
- **Strategic Context:** Speculation involves taking directional or volatility-based risk exposures to generate returns, operating as the risk-takers in derivatives markets.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Transactional Efficiency
- **Strategic Context:** Derivatives optimize capital allocation by reducing transaction friction, enabling short exposure, and providing access to synthetic assets.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

### 🔹 Sub-topic: Arbitrage Strategies

#### 🔸 Arbitrage Concept
- **Strategic Context:** Arbitrage represents a risk-free, self-financing trading strategy that exploits pricing inefficiencies to secure positive returns with zero net investment.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Arbitrage Execution Rule
- **Strategic Context:** Arbitrage execution requires concurrent trades in the spot and futures markets to lock in the pricing discrepancy without exposing the trader to market risk.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Arbitrage Transaction Costs
- **Strategic Context:** Transaction costs define the arbitrage bounds, creating a neutral band where pricing discrepancies cannot be profitably exploited.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Arbitrage Feasibility Rule
- **Strategic Context:** The feasibility of arbitrage is determined by the transaction cost boundary, with trading occurring only when the pricing mismatch exceeds this threshold.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

---

### 🔍 Detailed View

### 🔹 Sub-topic: Hedging & Price Discovery

#### 🔸 Hedging and Risk Management
To construct an effective equity hedge, a portfolio manager must determine the optimal hedge ratio. If the portfolio value is $V_p$ and its beta relative to the index is $\beta_p$, the number of index futures contracts $N$ required to hedge the portfolio is:
$$N = \beta_p \times \frac{V_p}{F \times L}$$
where $F$ is the current futures price and $L$ is the contract lot size. Selling $N$ contracts reduces the portfolio's systematic risk (Beta) to zero. If the manager wants to adjust the portfolio beta from $\beta_p$ to a target beta $\beta^*$, the formula is modified to:
$$N = (\beta^* - \beta_p) \times \frac{V_p}{F \times L}$$

#### 🔸 Price Discovery
Information flows primarily into the market segment with the lowest transaction costs and highest leverage. Consequently, new information is often incorporated into futures prices first, which then diffuses into the spot market. The price discovery contribution of the futures market can be measured using econometric metrics like Hasbrouck's Information Share (IS) or Harris-Saris-Booth's Common Factor Component (CFC). Empirically, index futures markets contribute significantly to price discovery, acting as the primary channel for macro-economic information transmission.

#### 🔸 Financial Leverage
Leverage is a key tool in financial risk management. It allows institutional investors to adjust portfolio exposures without selling underlying assets. The leverage of a portfolio is managed by adjusting the ratio of margin collateral to total nominal exposure. Under extreme market stress, high leverage can lead to rapid capital depletion, as margin requirements are adjusted dynamically using volatility models. This can trigger margin liquidation, leading to fire sales and systemic risk.

#### 🔸 Arbitrage Opportunities
Arbitrage opportunities are temporary, as buying and selling pressure from arbitrageurs forces prices back to their theoretical equilibrium. In cash-and-carry arbitrage, the arbitrageur borrows cash, buys the asset, and sells the futures. In reverse cash-and-carry arbitrage, where $F_0 < S_0 e^{rT}$, they short-sell the asset, invest the proceeds at the risk-free rate, and buy the futures. These strategies are constrained by transaction costs (brokerage, STT, exchange fees), stock borrowing fees, and funding liquidity constraints, which define the arbitrage boundaries.

#### 🔸 Speculative Trading
Speculation is not limited to directional views (Delta). Advanced speculators trade volatility (Vega) using options strategies (e.g., straddles, iron condors) or trade relative value (spreads) between different maturities or assets. Their trading helps incorporate new information into asset prices, improving market efficiency. However, highly leveraged speculation can lead to market instability, prompting regulators like SEBI to monitor speculative positions and enforce circuit breakers.

#### 🔸 Transactional Efficiency
Transactional efficiency is measured by execution speed, bid-ask spread tightness, and capital usage. Derivatives markets allow institutional investors to adjust asset allocations quickly and with minimal market impact. Short-selling in the spot market is constrained by stock lending and borrowing (SLB) availability and fees. Futures allow traders to take short positions with the same ease as long positions. This facilitates relative-value trading and risk hedging, improving overall market efficiency.

### 🔹 Sub-topic: Arbitrage Strategies

#### 🔸 Arbitrage Concept
An arbitrage opportunity exists if a portfolio can be constructed with zero value at time $t=0$, has a non-negative value at time $T$, and a positive probability of a positive value at $T$. In an efficient market, these opportunities are quickly eliminated by trading activity. The relationship $F_0 = S_0 e^{rT}$ represents the boundary where arbitrage profits are zero, defining the theoretical price of the futures contract.

#### 🔸 Arbitrage Execution Rule
To execute cash-and-carry arbitrage, the trader borrows funds at rate $r$, buys the stock in the spot market at $S_0$, and sells the futures contract at $F_0$. At maturity $T$, the stock is delivered to settle the futures contract, returning $F_0$ cash. The loan is repaid with $S_0 e^{rT}$, leaving a net profit of $F_0 - S_0 e^{rT}$. For reverse cash-and-carry, the trader short-sells the stock, invests the proceeds at the risk-free rate, and buys the futures, settling the short position at $T$ by buying the stock via the futures contract, locking in a profit of $S_0 e^{rT} - F_0$.

#### 🔸 Arbitrage Transaction Costs
Transaction costs include execution fees, clearing fees, taxes (STT), market impact, and financing costs. In reverse cash-and-carry, the trader must borrow stock, incurring stock borrowing fees ($c_b$). The arbitrage-free boundary is modified to:
$$S_0 e^{(r-c_b)T} \le F_0 \le S_0 e^{rT} + \text{Transaction Costs}$$
If the futures price lies within this band, arbitrageurs cannot make net profits, allowing the pricing mismatch to persist.
**Indian Arbitrage Transaction Costs Breakdown:**
**Brokerage:** Typically flat ₹20 per order or 0.01% - 0.03% of turnover.
**Securities Transaction Tax (STT):** 0.0125% on futures sell side, 0.1% on equity delivery buy/sell sides.
**Exchange Transaction Charges:** NSE charges ~0.0019% of turnover on futures.
**GST:** 18% of (Brokerage + Exchange Charges).
**SEBI Turnover Fees:** 0.0001% of turnover.
**Stamp Duty:** 0.015% on buy-side delivery, 0.002% on futures buy-side.
**Stock Borrowing and Lending (SBL) Charges:** Paid to lenders of stock for short sales, ranging from 1% to 15% annualized depending on liquidity.

#### 🔸 Arbitrage Feasibility Rule
The feasibility condition for cash-and-carry arbitrage is $F_0 - S_0 e^{rT} > TC$, where $TC$ represents the total transaction costs (brokerage, STT, margins, clearing fees). For institutional desks, $TC$ is low, allowing them to exploit tiny price discrepancies. If the price difference is smaller than $TC$, the trade is unfeasible. This defines the transaction-cost boundary in asset pricing theory, illustrating that market prices reflect transaction frictions.
**SEBI Coordinated Market-Wide Circuit Breakers:**
**Trigger Points:** 10%, 15%, and 20% movements in Nifty 50 or Sensex.
**Trading Halt Duration:** Depends on the time of the trigger. A 10% move before 1:00 PM halts trading for 45 minutes; a 15% move before 1:00 PM halts trading for 1 hour 45 minutes; a 20% move at any time halts trading for the rest of the day.
**Individual Stock Price Bands:** High-beta derivatives-eligible stocks have no fixed circuit limit but have dynamic price bands (cooling-off periods) starting at 10% to prevent retail manipulation while keeping derivatives functional.

---

### 🎴 Flashcards

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Hedging: Mitigate risk by entering a contract moving in opposite direction to underlying.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Price Discovery: Captures future demand/supply, indicating future price trends.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Leverage: Pay part of total value to potentially make large gains from small movements.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Arbitrage: Earn riskless profit when derivatives trade away from theoretical prices.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Speculation: Make gains based on view of price movement.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Other Advantages: Quick/low-cost transactions, flexibility, integrity (no counterparty default), alternative asset exposure.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Zero-investment strategy to make riskless profit by exploiting mispricing.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Buy low market, sell high market simultaneously.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Costs: Brokerage, STT, Margins, Stock Borrowing Charges.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Arbitrage is not undertaken if transaction costs exceed gains.
</details>