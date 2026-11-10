# Dependency of Value

> **Sub-Topic 1.1:** Core Definitions | **Chapter:** Derivates Futures | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 1, Feature (d)
> **Content:** Without the underlying, the derivative has no value.

--- 

### 📋 Summary View
- **Strategic Context:** The derivative contract represents a zero-value asset without the underlying state variable, since its pricing density function is integrated over the underlying's probability distribution.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

### 🔍 Detailed View
Mathematically, the price of a derivative is the discounted expected value of its future payoff under the risk-neutral measure $\mathbb{Q}$:
$$f_t = e^{-r(T-t)} \mathbb{E}^\mathbb{Q} [g(S_T) \mid \mathcal{F}_t]$$
where $g(S_T)$ is the payoff function and $\mathcal{F}_t$ is the filtration representing all market information up to time $t$. If the underlying stock ceases to trade or is delisted (i.e., its state space collapses), the filtration $\mathcal{F}_t$ loses its defining variable. The derivative has no payoff vector of its own, meaning it cannot exist without the underlying's probability space.

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Without the underlying, the derivative has no value.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 1.1](./subtopic_futures_1.1.md)**
- ➡️ **[Next Suggested: Daily Marking and Maturity Settle](./concept_futures_6.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_futures_5.md)**