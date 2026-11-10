# Assumes Continuous Stock Prices (No Jumps)

> **Sub-Topic 2.5.2:** Limitations | **Chapter:** Derivatives Options | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 3
> **Content:** Assumes continuous stock prices (no large jumps).

--- 

### 📋 Summary View
- **Strategic Context:** **Concept Summary:** BSM assumes asset prices change continuously without gaps. In reality, stock prices frequently gap up or down at market open.
**Key Takeaway:** The model cannot handle discrete price jumps or overnight market gaps.
**Analogy:** Assuming a lift moves smoothly between floors, ignoring the possibility of the cable breaking and dropping the lift instantly.
- **Quantitative Model:** No specific quantitative model details.
- **Risk/Opportunity:** No specific risk/opportunity details.

### 🔍 Detailed View
**Explanation:** In India, companies release corporate announcements or earnings after market hours. The next morning, a stock might open 8% lower than its previous close without trading at any price in between. BSM's mathematics assumes continuous trading, which fails to account for this gap risk.
**Worked Example:** You write (sell) a Call option on a stock at a ₹500 strike. The stock closes at ₹490. Overnight, a global merger is announced, and the stock opens at ₹560. You are forced to sell at ₹500, suffering a massive gap loss that BSM's continuous formula could not model.

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> BSM assumes asset prices change continuously without gaps. In reality, stock prices frequently gap up or down at market open.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Assuming a lift moves smoothly between floors, ignoring the possibility of the cable breaking and dropping the lift instantly.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The model cannot handle discrete price jumps or overnight market gaps.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 2.5.2](./subtopic_options_2.5.2.md)**
- ➡️ **[Next Suggested: Assumes No Dividends Until Expiration](./concept_options_35.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_options_34.md)**