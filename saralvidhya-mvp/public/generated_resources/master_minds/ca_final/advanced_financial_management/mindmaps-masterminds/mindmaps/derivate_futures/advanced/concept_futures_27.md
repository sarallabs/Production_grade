# Daily Mark-to-Market Process

> **Sub-Topic 2.2:** Daily Settlement & MTM | **Chapter:** Derivates Futures | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 9
> **Content:** Process of verifying buy/sell positions with daily futures prices to settle gains/losses daily.

--- 

### 📋 Summary View
- **Strategic Context:** The daily Mark-to-Market (MTM) process recalculates futures contract value against the closing settlement price, converting unrealized gains or losses into realized daily cash flows.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

### 🔍 Detailed View
MTM is the clearinghouse's primary risk mitigation tool. By revaluing positions daily to the settlement price, the clearinghouse prevents the accumulation of large, uncollateralized losses. The daily cash flow adjustment is:
$$\text{MTM}_t = (F_t - F_{t-1}) \times \text{Lot Size} \times N$$
where $F_t$ is the day $t$ closing settlement price and $N$ is the number of contracts. This daily cash settlement changes the pricing dynamics of futures compared to forwards, as the daily cash flows are subject to reinvestment at the short-term risk-free rate, introducing interest rate risk to futures pricing models.

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Process of verifying buy/sell positions with daily futures prices to settle gains/losses daily.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 2.2](./subtopic_futures_2.2.md)**
- ➡️ **[Next Suggested: Zero Sum Game](./concept_futures_28.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_futures_27.md)**