# Adjusting for Dividends Paid Before Expiry

> **Sub-Topic 4.1:** Pricing Methods | **Chapter:** Derivates Futures | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 10
> **Content:** If dividend (D) is paid before expiry: F = S + Cost of Carry - D.

--- 

### 📋 Summary View
- **Strategic Context:** The futures pricing formula is adjusted by subtracting the present value of expected dividends, reflecting the reduction in spot value on the ex-dividend date.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

### 🔍 Detailed View
Under continuous compounding, if a stock pays a discrete dividend $D_i$ at time $t_i$ (where $t_i < T$), the futures price is:
$$F_0 = (S_0 - D_i e^{-r t_i}) e^{rT}$$
where $D_i e^{-r t_i}$ is the present value of the dividend discounted to the present. The subtraction of the dividend present value from the spot price reflects that the holder of the futures contract does not receive the dividend cash flow, which instead goes to the spot holder. The spot price drops by $D_i$ on the ex-dividend date, and the futures price converges to $S_T$ at maturity.

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> If dividend (D) is paid before expiry: F = S + Cost of Carry - D.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 4.1](./subtopic_futures_4.1.md)**
- ➡️ **[Next Suggested: Relevance of Dividend Timing](./concept_futures_46.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_futures_45.md)**