# Sub-Topic 1.1: Core Definitions

> **Reference:** Page 1, Page 1, Feature (a), Page 1, Feature (b), Page 1, Feature (c), Page 1, Feature (d), Page 1, Feature (f), Page 1, User (a), Page 1, User (b), Page 1, User (c), Page 1, User (d)

---

### 📋 Summary View

#### 🔸 Origin and Concept of Derivatives
- **Strategic Context:** Derivatives represent contingent claims whose payoffs are spanned by the state-space replication of the underlying instruments.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Underlying Asset as Price Determinant
- **Strategic Context:** The derivative is a cash-flow replication tool whose price volatility is driven by the stochastic process of the underlying state variable.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Simultaneous Price Movement
- **Strategic Context:** Simultaneous price transmission is enforced by dynamic replication and high-frequency statistical arbitrage, ensuring no lag between spot and derivative vectors.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Types of Underlying Assets
- **Strategic Context:** The underlying asset class determines the mathematical drift and diffusion coefficients of the state variable's stochastic differential equation.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Dependency of Value
- **Strategic Context:** The derivative contract represents a zero-value asset without the underlying state variable, since its pricing density function is integrated over the underlying's probability distribution.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Daily Marking and Maturity Settle
- **Strategic Context:** The daily Mark-to-Market (MTM) mechanism converts the forward contract's credit risk into daily liquidity requirements, reducing the counterparty default risk profile to a 24-hour horizon.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Individual Investors
- **Strategic Context:** Retail traders engage in directional speculation, tail-risk hedging, and volatility-harvesting strategies, operating subject to retail margin requirements.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Institutional Investors
- **Strategic Context:** Institutional investors utilize derivatives as strategic overlays to manage portfolio duration, hedge systematic risk, and execute index-arbitrage programs.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Corporate Users
- **Strategic Context:** Corporates integrate derivatives into their enterprise risk management (ERM) frameworks to stabilize EBITDA margins and manage foreign exchange exposures.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Market Dealers and Market Makers
- **Strategic Context:** Dealers operate as liquidity providers, executing dynamic delta-gamma-vega hedging and order-flow intermediation.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

---

### 🔍 Detailed View

#### 🔸 Origin and Concept of Derivatives
From a quantitative and strategic perspective, derivatives are contractually structured contingent claims. According to the replication principle (developed by Black, Scholes, and Merton), the price of a derivative can be determined by constructing a risk-free portfolio consisting of the underlying asset and a risk-free bond. The derivative's payoff is defined by the contract's boundary conditions at expiration $T$.
Let the underlying asset follow a geometric Brownian motion:
$$dS_t = \mu S_t dt + \sigma S_t dW_t$$
The derivative price $f(S_t, t)$ must satisfy the Black-Scholes partial differential equation:
$$\frac{\partial f}{\partial t} + r S_t \frac{\partial f}{\partial S_t} + \frac{1}{2} \sigma^2 S_t^2 \frac{\partial^2 f}{\partial S_t^2} - r f = 0$$
This illustrates that the derivative is priced purely by replicating its payoff using the underlying asset and a risk-free asset, ensuring arbitrage-free valuation.

#### 🔸 Underlying Asset as Price Determinant
Strategically, the underlying price represents the state variable in the pricing model. The risk-neutral expectation of the derivative's payoff is discounted back to the present. The derivative price is a function of the underlying asset price $S_t$. Specifically, the delta-hedging relationship dictates that a market maker can completely eliminate the first-order risk of a derivative position by holding a position of $-\Delta$ shares of the underlying asset. Thus, the derivative's risk profile is mathematically mapped to the underlying asset's price fluctuations.

#### 🔸 Simultaneous Price Movement
In modern electronic markets, spot-derivative price transmission is instantaneous. The co-integration of spot and futures prices can be modeled using Vector Error Correction Models (VECM). Any deviation from the theoretical pricing boundary (governed by the cost of carry) triggers instant arbitrage. Market makers adjust their limit order books in the derivatives market using live feeds from the cash market to avoid being 'sniped' by arbitrageurs, ensuring that the spot and derivative price paths are continuously co-integrated.

#### 🔸 Types of Underlying Assets
The choice of underlying asset defines the risk-neutral pricing measure. For equity derivatives, the underlying follows a lognormal process with dividend yield adjustments. For interest rate and debt derivatives, mean-reverting models (e.g., Cox-Ingersoll-Ross or Hull-White) are used because interest rates cannot grow indefinitely. For commodities, convenience yields and storage costs modify the drift term. For foreign currencies, the domestic and foreign risk-free interest rates act as the yield parameters in a Garman-Kohlhagen framework.

#### 🔸 Dependency of Value
Mathematically, the price of a derivative is the discounted expected value of its future payoff under the risk-neutral measure $\mathbb{Q}$:
$$f_t = e^{-r(T-t)} \mathbb{E}^\mathbb{Q} [g(S_T) \mid \mathcal{F}_t]$$
where $g(S_T)$ is the payoff function and $\mathcal{F}_t$ is the filtration representing all market information up to time $t$. If the underlying stock ceases to trade or is delisted (i.e., its state space collapses), the filtration $\mathcal{F}_t$ loses its defining variable. The derivative has no payoff vector of its own, meaning it cannot exist without the underlying's probability space.

#### 🔸 Daily Marking and Maturity Settle
In an exchange-traded futures contract, the daily settlement process effectively terminates the existing contract and opens a new one at the current settlement price. The margin account is adjusted daily. This turns a long-term credit exposure into a series of daily cash flows, minimizing counterparty risk. At maturity $T$, the final contract settlement is conducted relative to the spot price of the underlying, which can be cash-settled or physically settled depending on SEBI guidelines for Indian equities.

#### 🔸 Individual Investors
Retail derivative usage is characterized by leveraged risk exposure. Individuals attempt to exploit market inefficiencies, manage tail risk, or harvest volatility risk premiums (e.g., selling option straddles/strangles). Because they do not have institutional scale, their trades are subject to standard SEBI retail margin requirements (SPAN + Exposure margin) and broker-level leverage limits. Their hedging is typically focused on portfolio protection using index options, while speculation is driven by directional index futures or weekly option contracts.

#### 🔸 Institutional Investors
Institutions (e.g., Foreign Portfolio Investors - FPIs, Domestic Institutional Investors - DIIs) execute sophisticated derivatives overlays. They use derivatives to manage portfolio beta, adjust interest rate sensitivity (duration) of bond portfolios, and run index arbitrage programs. Their operations are governed by SEBI's institutional investment limits, which restrict their open interest positions as a percentage of the market-wide position limit (MWPL). They utilize algorithmic execution (e.g., VWAP, TWAP) to minimize market impact when entering or exiting large derivative hedges.

#### 🔸 Corporate Users
Corporates engage in treasury hedging to manage economic and transaction exposures. Under Ind AS 109, corporates must document their hedging relationships (fair value hedge vs. cash flow hedge) to qualify for hedge accounting, which prevents derivative mark-to-market volatility from distorting the quarterly profit and loss statement. Exporters use currency options (e.g., range forwards, sea-gull spreads) to protect against adverse exchange rate movements while retaining some upside, managing credit risk, cash-flow volatility, and corporate solvency.

#### 🔸 Market Dealers and Market Makers
Dealers and market makers manage multi-dimensional risk parameters (Greeks). When providing liquidity, they take on inventory risk. A dealer who sells structured options is short gamma (sensitivity of delta) and short vega (sensitivity to volatility). They must run automated, dynamic rebalancing algorithms to hedge these exposures. By trading cash, futures, and option contracts simultaneously, they maintain a delta-neutral or risk-managed book. Their trading systems run on low-latency infrastructure to capture micro-arbitrage opportunities and manage inventory risk before the market moves against them.

---

### 🎴 Flashcards

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> The word 'Derivative' comes from 'derive' meaning to extract value from underlying assets (equity, bonds, currencies, commodities).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> The price of the underlying is the main factor determining derivative prices.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> A change in underlying results in a simultaneous change in the derivative price.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Underlying assets can be stock, debt, commodity, or foreign currency.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Without the underlying, the derivative has no value.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Long/short positions are marked to underlying value daily; gain/loss booked at maturity.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Individuals: Speculation, hedging, enhancing yield.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Institutional Investors: Hedging, yield enhancement, arbitrage.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Companies: Hedge inventory risk and currency risk (receivables/payables).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Dealers: Provide two-way quotes, hedge positions, exploit inefficiencies/arbitrage.
</details>

<!-- CONCEPTS: ./concept_futures_1.md, ./concept_futures_2.md, ./concept_futures_3.md, ./concept_futures_4.md, ./concept_futures_5.md, ./concept_futures_6.md, ./concept_futures_7.md, ./concept_futures_8.md, ./concept_futures_9.md, ./concept_futures_10.md -->