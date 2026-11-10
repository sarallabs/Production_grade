# Preventing Loss Accumulation

> **Sub-Topic 2.2:** Daily Settlement & MTM | **Chapter:** Derivates Futures | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 9
> **Content:** Ensures daily settlement and prevents huge accumulated losses at expiry.

--- 

### 📋 Summary View
- **Strategic Context:** The MTM mechanism prevents credit risk accumulation by resetting the contract value to zero at the end of each trading session.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

### 🔍 Detailed View
By revaluing the futures contract daily, the exchange ensures that the maximum default exposure is limited to a single day's price movement. This prevents the accumulation of systemic credit risk. The margin collateral (SPAN + Exposure) is calibrated to cover this one-day price volatility with 99% confidence. If a trader fails to meet a margin call, the position is liquidated, preventing the loss from exceeding the posted margin and protecting the clearing corporation from default contagion.
#### Sub-Topic 1.3.3: Contango & Backwardation

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Ensures daily settlement and prevents huge accumulated losses at expiry.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 2.2](./subtopic_futures_2.2.md)**
- ➡️ **[Next Suggested: Hedging and Risk Management](./concept_futures_30.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_futures_29.md)**