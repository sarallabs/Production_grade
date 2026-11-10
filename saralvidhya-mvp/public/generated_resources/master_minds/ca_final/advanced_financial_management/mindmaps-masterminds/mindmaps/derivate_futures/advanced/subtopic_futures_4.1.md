# Sub-Topic 4.1: Pricing Methods

> **Reference:** Page 7, Page 10, Page 11

---

### 📋 Summary View

#### 🔸 Contango Market Structure
- **Strategic Context:** Contango describes an upward-sloping forward curve where the futures price trades at a premium to the spot price, reflecting carrying costs.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Backwardation Market Structure
- **Strategic Context:** Backwardation represents a downward-sloping forward curve where the futures price trades at a discount to spot, indicating a high convenience yield.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Cost of Carry Fundamentals
- **Strategic Context:** The cost of carry model defines the arbitrage-free relationship between spot and futures prices under the law of one price.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Simple Interest Formula
- **Strategic Context:** The simple interest pricing model is a linear approximation of the cost of carry, applicable for short-dated maturities.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Continuous Compounding Formula
- **Strategic Context:** The continuous compounding formulation $F_0 = S_0 e^{rT}$ represents the arbitrage-free futures price under a continuous-time finance framework.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Adjusting for Dividends Paid Before Expiry
- **Strategic Context:** The futures pricing formula is adjusted by subtracting the present value of expected dividends, reflecting the reduction in spot value on the ex-dividend date.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Relevance of Dividend Timing
- **Strategic Context:** The dividend adjustment parameter only includes distributions with ex-dates within the contract's time horizon $[0, T]$.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Index Dividends and Dividend Yield
- **Strategic Context:** Modeling dividends as a continuous yield $d$ is standard for index futures, representing the index as a mutual fund that pays continuous dividends.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Index Futures Pricing Formula
- **Strategic Context:** The index futures contract valuation follows the continuous-time cost of carry formula $F_0 = S_0 e^{(r-d)T}$, where dividend yield acts as a continuous discount.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Net Cost of Carry Definition
- **Strategic Context:** The Net Cost of Carry ($r - d$) represents the growth rate of the futures price relative to the spot price in risk-neutral valuation.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

---

### 🔍 Detailed View

#### 🔸 Contango Market Structure
In commodity markets, Contango is defined by the inequality $F_0 > S_0$. This occurs when the cost of carry (interest, storage, insurance) is positive and exceeds any convenience yield. The term structure of futures is:
$$F_0 = S_0 e^{(r + s - c)T}$$
where $r$ is the risk-free rate, $s$ is the physical storage cost, and $c$ is the convenience yield. In a Contango market, the convenience yield $c$ is low relative to storage costs $s$. For financial assets, Contango is the standard state because storage costs are negligible, and the cost of carry is driven by the risk-free rate ($F_0 = S_0 e^{rT}$).

#### 🔸 Backwardation Market Structure
Backwardation ($F_0 < S_0$) occurs when the convenience yield $c$ is high, satisfying the condition $c > r + s$. The convenience yield represents the economic benefit of holding the physical asset (e.g., preventing refinery shutdown). In times of severe supply shortages, the spot price spikes, while futures prices remain lower because supply is expected to normalize in the future. In financial markets, backwardation can occur in stock futures when a stock is in high demand for short-selling, causing stock borrowing fees to spike, which reduces the synthetic forward price.

#### 🔸 Cost of Carry Fundamentals
The Cost of Carry model assumes that the futures price is the spot price adjusted for the net cost of holding the asset. The general relationship is $F_0 = S_0 + C$. In financial markets, the cost of carry consists of the cost of financing the purchase at the risk-free rate $r$, minus any income generated by the asset (e.g., dividends $d$). If the futures price deviates from this relationship, arbitrageurs execute trades to restore equilibrium, defining the pricing boundary for futures contracts.

#### 🔸 Simple Interest Formula
The linear cost of carry formula is $F = S [1 + r(t/365)]$, where $t$ is the number of days to maturity. This formulation assumes daily simple interest, which is standard in short-term money market instruments. In equity derivatives, while continuous compounding is theoretically preferred, brokers and traders often use simple interest as a quick approximation for near-month contracts due to the short time horizon (less than 30 days).

#### 🔸 Continuous Compounding Formula
In continuous-time finance, the arbitrage-free relation is $F_0 = S_0 e^{rT}$. If $F_0 > S_0 e^{rT}$, an arbitrageur can borrow $S_0$ at the continuous rate $r$, buy the asset, and short the futures, locking in a risk-free profit of $F_0 - S_0 e^{rT}$ at time $T$. The continuous compounding model is mathematically tractible and integrates with the Black-Scholes-Merton option pricing framework.

#### 🔸 Adjusting for Dividends Paid Before Expiry
Under continuous compounding, if a stock pays a discrete dividend $D_i$ at time $t_i$ (where $t_i < T$), the futures price is:
$$F_0 = (S_0 - D_i e^{-r t_i}) e^{rT}$$
where $D_i e^{-r t_i}$ is the present value of the dividend discounted to the present. The subtraction of the dividend present value from the spot price reflects that the holder of the futures contract does not receive the dividend cash flow, which instead goes to the spot holder. The spot price drops by $D_i$ on the ex-dividend date, and the futures price converges to $S_T$ at maturity.

#### 🔸 Relevance of Dividend Timing
The pricing of futures is determined by replicating cash flows. A dividend distribution only enters the replication equations if the ex-dividend date $t_d$ falls within the contract period: $t_d \in [0, T]$. If $t_d > T$, the long futures position has already settled at $T$ against $S_T$, which does not yet reflect the dividend drop. Therefore, any dividend paid after $T$ is excluded from the pricing equation at time $t=0$, as it has no economic impact on the contract's cash flows.

#### 🔸 Index Dividends and Dividend Yield
For a stock index, modeling discrete dividends is computationally expensive because the components distribute dividends at different times. The index is modeled as an asset that pays a continuous dividend yield $d$. This assumption is standard in the Black-Scholes-Merton option pricing model for indices. The continuous yield represents the average dividend payment rate of the index components, simplifying the replication equations.

#### 🔸 Index Futures Pricing Formula
The index futures price $F_0 = S_0 e^{(r-d)T}$ is derived under risk-neutral valuation. The dividend yield $d$ reduces the cost of carry because holding the physical shares of the index components generates dividend income, which offsets the financing cost $r$. The net financing rate is $r - d$. If the market futures price deviates from this theoretical price, institutional index-arbitrage programs execute trades to exploit the mismatch, buying the component stocks and selling futures (or vice versa).

#### 🔸 Net Cost of Carry Definition
The Net Cost of Carry $q = r - d$ determines the drift of the futures price process. In a risk-neutral world, the expected growth rate of the spot asset is the risk-free rate $r$. Since the asset pays a continuous dividend yield $d$, the capital gains growth rate of the spot price is $r - d$. The futures price, which pays no dividends, must grow at the rate of the spot asset's capital gains, meaning $F_t = S_t e^{(r-d)(T-t)}$, identifying $r - d$ as the net carrying rate.

---

### 🎴 Flashcards

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Contango: Forward price > Spot price (F > S).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Backwardation: Forward price < Spot price (F < S).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Future Price (F) = Spot Price (S) + Cost of Carry (C).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> F = S + (S * r * T)/12 (Simple Interest).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> F = S * e^(rT) (Continuous Compounding).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> If dividend (D) is paid before expiry: F = S + Cost of Carry - D.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Dividend is relevant only if paid on or before expiry.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Use Dividend Yield (d) instead of specific dividend amount.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> F = S * e^((r-d)T).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Net Cost of Carry = r - d.
</details>

<!-- CONCEPTS: ./concept_futures_40.md, ./concept_futures_41.md, ./concept_futures_42.md, ./concept_futures_43.md, ./concept_futures_44.md, ./concept_futures_45.md, ./concept_futures_46.md, ./concept_futures_47.md, ./concept_futures_48.md, ./concept_futures_49.md -->