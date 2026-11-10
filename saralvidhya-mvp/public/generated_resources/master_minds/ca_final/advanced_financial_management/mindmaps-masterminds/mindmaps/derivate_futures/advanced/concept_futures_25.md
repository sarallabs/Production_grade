# Maintenance Margin

> **Sub-Topic 2.1:** Margin Mechanics | **Chapter:** Derivates Futures | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 8
> **Content:** Maintenance Margin: Minimum margin required to hold a position. Breaching this triggers a margin call.

--- 

### 📋 Summary View
- **Strategic Context:** Maintenance Margin acts as the critical risk threshold trigger, preventing credit exposure from exceeding the posted collateral value.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

### 🔍 Detailed View
The Maintenance Margin is the minimum collateral level required to sustain an open position. If the equity in the margin account, $E_t = \text{Initial Margin} \pm \sum \text{Daily MTM}_t$, falls below the Maintenance Margin $M_m$:
$$E_t < M_m$$
The client is issued a margin call. Under US and international exchange guidelines, the client must deposit Variation Margin to restore the account balance back to the Initial Margin level. In India, SEBI requires that the margin account must be maintained at the full SPAN + Exposure level daily, meaning any shortfall must be cleared before the next trading day.

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Maintenance Margin: Minimum margin required to hold a position. Breaching this triggers a margin call.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 2.1](./subtopic_futures_2.1.md)**
- ➡️ **[Next Suggested: Variation Margin Calls](./concept_futures_26.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_futures_25.md)**