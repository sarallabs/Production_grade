# Sub-Topic 1.2: Market Types

> **Reference:** Page 2, Table, Page 3

---

### 📋 Summary View

#### 🔸 Trading Venue and Structure
- **Strategic Context:** Forwards are private bilateral OTC agreements with decentralized execution, while Futures are exchange-traded contracts executed on a centralized, multilateral matching engine.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Contract Standardization
- **Strategic Context:** Forwards offer complete contract design flexibility, whereas Futures contracts are standardized commodities designed to concentrate liquidity and minimize transaction friction.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Liquidity Profiles
- **Strategic Context:** Futures markets exhibit high liquidity and low market-impact costs due to contract fungibility, while forwards suffer from search-friction and liquidity-risk premiums.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Margin Requirements
- **Strategic Context:** Futures employ a regulated margining system (SPAN + Exposure) with daily variation cash flows, whereas forwards are funded via bilateral credit lines.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Counterparty Credit Risk
- **Strategic Context:** Futures eliminate bilateral credit risk through clearinghouse novation and multilateral netting, whereas forwards remain subject to counterparty credit risk.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Settlement Mechanisms
- **Strategic Context:** Forwards are characterized by a single terminal cash flow at maturity, while futures require continuous daily marking-to-market and final settlement at expiration.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Asset Type and Underlying
- **Strategic Context:** The spot market trades primary assets, while the derivatives market trades contingent claims whose value is derived from the underlying price distribution.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Minimum Transaction Quantities
- **Strategic Context:** The cash market allows fractional or single-unit trades, while the derivatives market utilizes standardized lot sizes to optimize clearing efficiency and liquidity concentration.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Ownership and Voting Rights
- **Strategic Context:** Equity ownership in the spot market provides corporate governance rights, whereas derivatives are purely economic exposures without voting control.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Holding Periods
- **Strategic Context:** Spot assets represent permanent capital claims, whereas derivatives are finite-horizon contracts subject to terminal settlement boundary conditions.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Dividend Entitlements
- **Strategic Context:** Spot stock ownership grants dividend distribution rights, whereas derivatives do not receive dividends, adjusting their pricing parameters to reflect expected distributions.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Investment Objectives
- **Strategic Context:** The spot market is a vehicle for primary asset allocation and capital formation, whereas the derivatives market is a mechanism for risk transfer and return optimization.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Payment and Leverage
- **Strategic Context:** The spot market is a fully-funded asset class, whereas derivatives are leveraged instruments that require margin collateral rather than full funding.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

---

### 🔍 Detailed View

#### 🔸 Trading Venue and Structure
The structural distinction between OTC forwards and exchange-traded futures affects market microstructure. Futures trading utilizes a centralized double-auction limit order book (LOB) matching engine. This matches buy and sell orders based on price-time priority. Forwards rely on decentralized bilateral negotiations, often facilitated by voice brokers or request-for-quote (RFQ) platforms. This venue difference shapes liquidity distribution, transaction costs, and market impact, with exchange-traded futures offering lower search costs and tighter bid-ask spreads for standard maturities.

#### 🔸 Contract Standardization
Contract standardization in futures reduces contract negotiation costs and concentrates liquidity into specific, high-volume instruments. The exchange specifies the exact underlying asset quality (e.g., specific crude oil sulfur content or gold purity), settlement dates, delivery mechanisms, and tick sizes. This standardization allows market participants to trade fungible contracts, enabling instant offsetting of positions. Conversely, the customized nature of forwards creates non-fungible agreements, which are difficult to transfer or offset without renegotiating with the original counterparty.

#### 🔸 Liquidity Profiles
Fungibility is the driver of futures liquidity. Because every October Nifty futures contract is identical, participants can offset their obligations at any time, reducing liquidity risk. Forwards are non-fungible; exiting a forward position prior to maturity requires either bilateral cancellation (mutual consent) or entering a mirror-image transaction with another counterparty. This creates a net credit exposure and duplicates capital requirements, leading to high transaction costs and liquidity risk premiums.

#### 🔸 Margin Requirements
The margining framework in futures is systematic. Exchanges use SPAN (Standardized Portfolio Analysis of Risk) to calculate the worst-case portfolio loss across a range of market scenarios. This initial margin must be posted in cash or collateral (with haircuts). In contrast, forwards are traditionally unfunded, creating credit risk. However, post-2008 reforms have led to the usage of Credit Support Annexes (CSAs) in OTC markets. These require daily collateral postings for large institutional forward agreements, mimicking the futures margin system.

#### 🔸 Counterparty Credit Risk
The mitigation of counterparty credit risk in futures is achieved through Central Counterparty (CCP) clearing. Through contract novation, the CCP becomes the buyer to every seller and the seller to every buyer, eliminating bilateral credit risk. The CCP manages its residual risk through a multi-layered waterfall: initial margins, variation margins, member default insurance, and the CCP's own capital. In OTC forwards, counterparty risk is bilateral and requires credit risk modeling, credit valuation adjustments (CVA), and credit risk mitigation techniques such as netting agreements.

#### 🔸 Settlement Mechanisms
The terminal payoff of a forward is realized at maturity $T$. If $S_T > K$, the buyer receives $S_T - K$. In futures, because the contract is marked-to-market daily, the buyer has already received the daily increments. The net cash flow of the futures contract from $t=0$ to $T$ is identical to a forward, but the time value of money differs because the cash flows are distributed daily. This daily settlement mechanism alters the pricing of futures relative to forwards when interest rates are stochastic.

#### 🔸 Asset Type and Underlying
The spot market is the market for the underlying asset. In this market, assets are traded for immediate settlement. The derivatives market trades contingent claims. The payoff of a derivative contract at time $T$ is a function of the spot price of the underlying asset at that time. The pricing of derivatives is based on the assumption that an arbitrageur can construct a replicating portfolio consisting of the underlying asset and a risk-free bond, linking the two markets.

#### 🔸 Minimum Transaction Quantities
Standardized lot sizes in derivatives markets serve to concentrate liquidity and simplify clearing operations. By grouping transactions into large, uniform blocks (e.g., lot size of 25 for Nifty, 15 for Bank Nifty), the exchange reduces clearing complexity and transaction processing costs. However, this creates a lumpiness in risk management. An investor cannot hedge a portfolio of ₹5,00,000 with precision if the Nifty contract value is ₹5,50,000. They must round their hedge to the nearest integer number of contracts, introducing residual tracking error.

#### 🔸 Ownership and Voting Rights
The lack of voting rights in derivatives contracts is a key consideration for institutional investors. Activist investors and corporate acquirers must purchase physical shares in the spot market to accumulate voting blocks. However, synthetic equity exposure can be built using derivatives (e.g., total return swaps or long futures and short options) to gain economic exposure without triggering disclosure thresholds associated with physical share ownership. This strategy, known as 'empty voting' or decoupling, allows investors to separate voting rights from economic interest, creating unique corporate governance dynamics.

#### 🔸 Holding Periods
The finite life of derivatives contracts affects their valuation and risk management. As time passes, options contracts experience time decay (Theta, $\theta = \partial f/\partial t$), which accelerates as the expiry date approaches. Futures contracts do not experience time decay, but their prices converge to the spot price at maturity ($F_T = S_T$), eliminating the basis. Portfolio managers must manage rollover risk, which is the risk that the price difference between the expiring contract and the next contract (the rollover spread) changes unfavorably during the rollover window.

#### 🔸 Dividend Entitlements
The treatment of dividends in derivatives pricing is a key factor in valuation. Since derivative holders do not receive dividends, the futures price is discounted by the expected dividend yield. The pricing equation for index futures is $F = S e^{(r-d)T}$, where $d$ is the continuous dividend yield of the index. If a company announces an extraordinary dividend (typically more than 2% of the market price), SEBI guidelines require an adjustment to the strike price and lot size of the option contracts to ensure the economic value of the contract remains unchanged.

#### 🔸 Investment Objectives
The investment objectives in each market shape their risk-return profiles. Spot market investing represents a positive-sum game over time, as it is driven by corporate earnings and economic growth. The derivatives market, in contrast, is a zero-sum game; the gain of one party is the loss of another. Institutional asset managers use the spot market to establish core portfolio holdings. They overlay these holdings with derivatives to manage portfolio beta, adjust asset allocation dynamically, and hedge currency risk, optimizing the portfolio's Sharpe ratio.

#### 🔸 Payment and Leverage
Leverage is a double-edged sword in financial engineering. In the spot market, risk is bounded by the asset price dropping to zero. In derivatives, leverage amplifies the volatility of returns. The leverage factor is determined by the exchange's margin requirements, which are set using Value-at-Risk (VaR) models to cover potential price moves. High leverage increases capital efficiency, allowing firms to hedge large exposures with minimal capital. However, it also introduces liquidity risk. If a trade moves against a firm, they must meet daily margin calls in cash, which can trigger liquidation if they lack sufficient liquidity.

---

### 🎴 Flashcards

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Trading: Forwards (Over phone/OTC) vs. Futures (Exchange).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Contract Terms: Forwards (Customized) vs. Futures (Standardized).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Liquidity: Forwards (Less liquid) vs. Futures (More liquid).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Margin: Forwards (No margin) vs. Futures (Requires margin).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Counterparty Risk: Forwards (Borne by client) vs. Futures (Shouldered by clearing corporation).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Settlement: Forwards (Agreed date) vs. Futures (Daily basis/Expiry).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Asset Type: Cash (Actual assets) vs. Derivatives (Derivatives of underlying).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Quantity: Cash (Single share possible) vs. Derivatives (Minimum one lot).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Ownership: Cash (Results in ownership) vs. Derivatives (Need not result in ownership).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Holding Period: Cash (Indefinite) vs. Derivatives (Must settle at contract end).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Dividends: Cash (Entitled to dividends) vs. Derivatives (Not entitled).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Investment Objective: Cash (Investment/Consumption) vs. Derivatives (Speculation/Hedging/Arbitrage).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Payment: Cash (Full value) vs. Derivatives (Margin/Part of value).
</details>

<!-- CONCEPTS: ./concept_futures_11.md, ./concept_futures_12.md, ./concept_futures_13.md, ./concept_futures_14.md, ./concept_futures_15.md, ./concept_futures_16.md, ./concept_futures_17.md, ./concept_futures_18.md, ./concept_futures_19.md, ./concept_futures_20.md, ./concept_futures_21.md, ./concept_futures_22.md, ./concept_futures_23.md -->