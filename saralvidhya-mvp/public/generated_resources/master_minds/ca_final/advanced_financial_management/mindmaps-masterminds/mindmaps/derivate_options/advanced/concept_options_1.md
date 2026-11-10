# Option

> **Sub-Topic 2.1.1:** Core Definitions | **Chapter:** Derivatives Options | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 1
> **Content:** Option: Contract giving holder right, but not obligation, to buy/sell underlying at specific price for specific period.

--- 

### 📋 Summary View
- **Strategic Context:** **Concept Summary:** An option is a non-linear financial derivative representing a truncated probability distribution of the underlying asset's future price. The buyer pays a premium to acquire a convex payoff structure, while the seller accepts a concave payoff structure in exchange for premium income.
**Key Takeaway:** An option is a volatility-sensitive instrument that allows traders to isolate and trade higher-order price sensitivities (Greeks) without direct spot exposure.
**Analogy:** Buying insurance on a commercial shipping fleet passing through high-risk zones, allowing the fleet owner to capture profits while transferring tail risk to underwriters.
- **Quantitative Model:** No specific quantitative model details.
- **Risk/Opportunity:** No specific risk/opportunity details.

### 🔍 Detailed View
**Explanation:** Option valuation is governed by the risk-neutral expectation of its payoff. The premium represents the discounted expected value of the option payoff under the risk-neutral measure $\mathbb{Q}$: $V = e^{-rT} \mathbb{E}^\mathbb{Q}[\text{Payoff}(S_T)]$. Because the buyer can walk away, the payoff is asymmetric, introducing positive convexity (long Gamma) to the buyer's portfolio.
**Worked Example:** A market maker prices a Nifty option using the Black-Scholes PDE. The underlying Nifty spot ($S$) is 22,000, strike ($X$) is 22,000, risk-free rate ($r$) is 7%, and implied volatility ($\sigma$) is 15%. The computed option price represents the present value of the expected probability of the index expiring in-the-money.

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> An option is a non-linear financial derivative representing a truncated probability distribution of the underlying asset's future price. The buyer pays a premium to acquire a convex payoff structure, while the seller accepts a concave payoff structure in exchange for premium income.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Buying insurance on a commercial shipping fleet passing through high-risk zones, allowing the fleet owner to capture profits while transferring tail risk to underwriters.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> An option is a volatility-sensitive instrument that allows traders to isolate and trade higher-order price sensitivities (Greeks) without direct spot exposure.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 2.1.1](./subtopic_options_2.1.1.md)**
- ➡️ **[Next Suggested: Call Option](./concept_options_2.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_options_1.md)**