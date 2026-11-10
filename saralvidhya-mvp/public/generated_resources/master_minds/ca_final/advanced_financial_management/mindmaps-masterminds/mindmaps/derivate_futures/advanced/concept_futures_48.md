# Index Futures Pricing Formula

> **Sub-Topic 4.1:** Pricing Methods | **Chapter:** Derivates Futures | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 11
> **Content:** F = S * e^((r-d)T).

--- 

### 📋 Summary View
- **Strategic Context:** The index futures contract valuation follows the continuous-time cost of carry formula $F_0 = S_0 e^{(r-d)T}$, where dividend yield acts as a continuous discount.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

### 🔍 Detailed View
The index futures price $F_0 = S_0 e^{(r-d)T}$ is derived under risk-neutral valuation. The dividend yield $d$ reduces the cost of carry because holding the physical shares of the index components generates dividend income, which offsets the financing cost $r$. The net financing rate is $r - d$. If the market futures price deviates from this theoretical price, institutional index-arbitrage programs execute trades to exploit the mismatch, buying the component stocks and selling futures (or vice versa).

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> F = S * e^((r-d)T).
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 4.1](./subtopic_futures_4.1.md)**
- ➡️ **[Next Suggested: Net Cost of Carry Definition](./concept_futures_49.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_futures_48.md)**