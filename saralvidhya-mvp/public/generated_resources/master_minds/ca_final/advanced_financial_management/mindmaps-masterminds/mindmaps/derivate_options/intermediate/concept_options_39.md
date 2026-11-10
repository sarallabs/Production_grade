# Call Buyer Payoff: Max(S - X, 0)

> **Sub-Topic 2.6.1:** Formulas | **Chapter:** Derivatives Options | **Level:** Intermediate

--- 

### 📝 Source Institutional Content
> **Reference:** Page 2
> **Content:** Call Buyer Payoff: Max(S - X, 0).

--- 

### 📋 Summary View
- **Concept Summary:** The payoff for a Call Buyer at expiry is the final stock price ($S$) minus the strike price ($X$), capped at a minimum of zero.
- **Formula/Rule:** Standard guidelines apply.
- **Application Context:** No specific application context available.

### 🔍 Detailed View
**Explanation:** The payoff formula is $Payoff = \max(S - X, 0)$. S is the closing price of the underlying asset on expiry day, and X is the strike price. The net profit is calculated by subtracting the initial premium ($P$) paid: $Profit = \max(S - X, 0) - P$.
**Worked Example:** You buy a Nifty ₹22,000 Call option for a ₹150 premium.
If Nifty closes at ₹22,400: Payoff is $\max(22,400 - 22,000, 0) = \text{₹}400$. Net profit = ₹400 - ₹150 premium = +₹250 per unit.
If Nifty closes at ₹21,800: Payoff is $\max(21,800 - 22,000, 0) = 0$. Net profit = 0 - ₹150 = -₹150 (maximum loss).

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The payoff for a Call Buyer at expiry is the final stock price ($S$) minus the strike price ($X$), capped at a minimum of zero.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> A voucher that gives you a discount equal to the market price minus ₹100, but is worth zero if the market price is below ₹100.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The buyer participates in the stock's upside above the strike price.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 2.6.1](./subtopic_options_2.6.1.md)**
- ➡️ **[Next Suggested: Put Buyer Payoff: Max(X - S, 0)](./concept_options_40.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_options_39.md)**