# Origin and Concept of Derivatives

> **Sub-Topic 1.1:** Core Definitions | **Chapter:** Derivates Futures | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 1
> **Content:** The word 'Derivative' comes from 'derive' meaning to extract value from underlying assets (equity, bonds, currencies, commodities).

--- 

### 📋 Summary View
- **Strategic Context:** Derivatives represent contingent claims whose payoffs are spanned by the state-space replication of the underlying instruments.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

### 🔍 Detailed View
From a quantitative and strategic perspective, derivatives are contractually structured contingent claims. According to the replication principle (developed by Black, Scholes, and Merton), the price of a derivative can be determined by constructing a risk-free portfolio consisting of the underlying asset and a risk-free bond. The derivative's payoff is defined by the contract's boundary conditions at expiration $T$.
Let the underlying asset follow a geometric Brownian motion:
$$dS_t = \mu S_t dt + \sigma S_t dW_t$$
The derivative price $f(S_t, t)$ must satisfy the Black-Scholes partial differential equation:
$$\frac{\partial f}{\partial t} + r S_t \frac{\partial f}{\partial S_t} + \frac{1}{2} \sigma^2 S_t^2 \frac{\partial^2 f}{\partial S_t^2} - r f = 0$$
This illustrates that the derivative is priced purely by replicating its payoff using the underlying asset and a risk-free asset, ensuring arbitrage-free valuation.

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> The word 'Derivative' comes from 'derive' meaning to extract value from underlying assets (equity, bonds, currencies, commodities).
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 1.1](./subtopic_futures_1.1.md)**
- ➡️ **[Next Suggested: Underlying Asset as Price Determinant](./concept_futures_2.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_futures_1.md)**