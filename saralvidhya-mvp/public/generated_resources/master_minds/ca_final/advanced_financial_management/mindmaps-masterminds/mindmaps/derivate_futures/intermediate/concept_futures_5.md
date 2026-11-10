# Dependency of Value

> **Sub-Topic 1.1:** Core Definitions | **Chapter:** Derivates Futures | **Level:** Intermediate

--- 

### 📝 Source Institutional Content
> **Reference:** Page 1, Feature (d)
> **Content:** Without the underlying, the derivative has no value.

--- 

### 📋 Summary View
- **Concept Summary:** The intrinsic and extrinsic value of a derivative contract collapse to zero if the underlying asset's value or availability becomes null.
- **Formula/Rule:** Without the underlying, the derivative has no value.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

### 🔍 Detailed View
A derivative contract is a conditional claim. Its payoff function at maturity $T$ is $H(S_T)$. For a Call option, $H(S_T) = \max(S_T - K, 0)$, and for a Future, $H(S_T) = S_T - F_0$. If the underlying asset spot price $S_t$ drops to 0, the payoff of a call option becomes $\max(0 - K, 0) = 0$. In all pricing models, if $S = 0$, the contract value $f(0, t) = 0$ for positive strike assets, verifying that the derivative cannot have independent value.

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The intrinsic and extrinsic value of a derivative contract collapse to zero if the underlying asset's value or availability becomes null.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 1.1](./subtopic_futures_1.1.md)**
- ➡️ **[Next Suggested: Daily Marking and Maturity Settle](./concept_futures_6.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_futures_5.md)**