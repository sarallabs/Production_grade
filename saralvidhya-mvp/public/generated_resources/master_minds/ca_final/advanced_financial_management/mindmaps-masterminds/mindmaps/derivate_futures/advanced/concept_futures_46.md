# Relevance of Dividend Timing

> **Sub-Topic 4.1:** Pricing Methods | **Chapter:** Derivates Futures | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 10
> **Content:** Dividend is relevant only if paid on or before expiry.

--- 

### 📋 Summary View
- **Strategic Context:** The dividend adjustment parameter only includes distributions with ex-dates within the contract's time horizon $[0, T]$.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

### 🔍 Detailed View
The pricing of futures is determined by replicating cash flows. A dividend distribution only enters the replication equations if the ex-dividend date $t_d$ falls within the contract period: $t_d \in [0, T]$. If $t_d > T$, the long futures position has already settled at $T$ against $S_T$, which does not yet reflect the dividend drop. Therefore, any dividend paid after $T$ is excluded from the pricing equation at time $t=0$, as it has no economic impact on the contract's cash flows.
#### Sub-Topic 1.4.2: Index Futures Pricing

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Dividend is relevant only if paid on or before expiry.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 4.1](./subtopic_futures_4.1.md)**
- ➡️ **[Next Suggested: Index Dividends and Dividend Yield](./concept_futures_47.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_futures_46.md)**