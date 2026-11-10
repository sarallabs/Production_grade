# Hedging and Risk Management

> **Sub-Topic 3.1:** Hedging & Price Discovery | **Chapter:** Derivates Futures | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 4
> **Content:** Hedging: Mitigate risk by entering a contract moving in opposite direction to underlying.

--- 

### 📋 Summary View
- **Strategic Context:** Hedging involves minimizing portfolio variance by establishing a derivative position that offsets the systematic risk factor (Beta) of the underlying assets.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

### 🔍 Detailed View
To construct an effective equity hedge, a portfolio manager must determine the optimal hedge ratio. If the portfolio value is $V_p$ and its beta relative to the index is $\beta_p$, the number of index futures contracts $N$ required to hedge the portfolio is:
$$N = \beta_p \times \frac{V_p}{F \times L}$$
where $F$ is the current futures price and $L$ is the contract lot size. Selling $N$ contracts reduces the portfolio's systematic risk (Beta) to zero. If the manager wants to adjust the portfolio beta from $\beta_p$ to a target beta $\beta^*$, the formula is modified to:
$$N = (\beta^* - \beta_p) \times \frac{V_p}{F \times L}$$

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Hedging: Mitigate risk by entering a contract moving in opposite direction to underlying.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 3.1](./subtopic_futures_3.1.md)**
- ➡️ **[Next Suggested: Price Discovery](./concept_futures_31.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_futures_30.md)**