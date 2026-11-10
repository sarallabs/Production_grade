# Put Buyer Payoff: Max(X - S, 0)

> **Sub-Topic 2.6.1:** Formulas | **Chapter:** Derivatives Options | **Level:** Intermediate

--- 

### 📝 Source Institutional Content
> **Reference:** Page 2
> **Content:** Put Buyer Payoff: Max(X - S, 0).

--- 

### 📋 Summary View
- **Concept Summary:** The payoff for a Put Buyer at expiry is the strike price ($X$) minus the final stock price ($S$), capped at a minimum of zero.
- **Formula/Rule:** Standard guidelines apply.
- **Application Context:** No specific application context available.

### 🔍 Detailed View
**Explanation:** The payoff formula is $Payoff = \max(X - S, 0)$. S is the closing price of the underlying asset on expiry day, and X is the strike price. The net profit is calculated by subtracting the initial premium ($P$) paid: $Profit = \max(X - S, 0) - P$.
**Worked Example:** You buy a SBI ₹800 Put option for a ₹30 premium.
If SBI closes at ₹720: Payoff is $\max(800 - 720, 0) = \text{₹}80$. Net profit = ₹80 - ₹30 premium = +₹50 per unit.
If SBI closes at ₹830: Payoff is $\max(800 - 830, 0) = 0$. Net profit = 0 - ₹30 = -₹30 (maximum loss).

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The payoff for a Put Buyer at expiry is the strike price ($X$) minus the final stock price ($S$), capped at a minimum of zero.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> A price-guarantee contract. If the market value of your crop falls below ₹1,000, the buyer must pay you the difference.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The buyer profits from stock price falls below the strike price.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 2.6.1](./subtopic_options_2.6.1.md)**
- ➡️ **[Next Suggested: Seller Payoff: -1 * Buyer Payoff](./concept_options_41.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_options_40.md)**