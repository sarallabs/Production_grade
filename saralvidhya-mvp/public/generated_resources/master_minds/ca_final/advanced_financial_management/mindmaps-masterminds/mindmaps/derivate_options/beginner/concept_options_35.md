# Assumes No Dividends Until Expiration

> **Sub-Topic 2.5.2:** Limitations | **Chapter:** Derivatives Options | **Level:** Beginner

--- 

### 📝 Source Institutional Content
> **Reference:** Page 3
> **Content:** Assumes no dividends until expiration.

--- 

### 📋 Summary View
- **Concept:** The model does not handle dividend adjustments well, which is a major limitation for stock options.
- **Analogy:** Buying a fruit tree assuming the seller won't harvest all the fruits just before handing it over to you.
- **Key Takeaway:** Dividend-paying stocks are often mispriced by simple BSM.

### 🔍 Detailed View
**Explanation:** When companies pay dividends, the stock price drops, which hurts Call options and helps Put options. Because BSM assumes no dividends, it overprices calls and underprices puts on dividend-paying stocks.
**Worked Example:** If ITC pays a dividend of ₹8 next week, its stock price will drop by ₹8. If you use standard BSM to buy calls, you will pay too much because you didn't account for this drop.

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The model does not handle dividend adjustments well, which is a major limitation for stock options.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Buying a fruit tree assuming the seller won't harvest all the fruits just before handing it over to you.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Dividend-paying stocks are often mispriced by simple BSM.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 2.5.2](./subtopic_options_2.5.2.md)**
- ➡️ **[Next Suggested: Volatility Must Be Estimated](./concept_options_36.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_options_35.md)**