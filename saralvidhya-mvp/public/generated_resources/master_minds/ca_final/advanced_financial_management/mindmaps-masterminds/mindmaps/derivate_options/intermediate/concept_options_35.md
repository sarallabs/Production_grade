# Assumes No Dividends Until Expiration

> **Sub-Topic 2.5.2:** Limitations | **Chapter:** Derivatives Options | **Level:** Intermediate

--- 

### 📝 Source Institutional Content
> **Reference:** Page 3
> **Content:** Assumes no dividends until expiration.

--- 

### 📋 Summary View
- **Concept Summary:** The model assumes no dividends are paid during the option's life, which is inaccurate for many dividend-paying stocks.
- **Formula/Rule:** Standard guidelines apply.
- **Application Context:** No specific application context available.

### 🔍 Detailed View
**Explanation:** Dividends reduce the price of the stock on the ex-dividend date. Since BSM assumes no dividends, it overprices Call options and underprices Put options for stocks that pay dividends during the contract period.
**Worked Example:** A stock trading at ₹300 is going to pay a ₹12 dividend. The stock price will drop to ₹288. If you use standard BSM to price a Call option, you will pay too much because BSM does not know the stock price is guaranteed to drop.

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The model assumes no dividends are paid during the option's life, which is inaccurate for many dividend-paying stocks.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Valuing a rental property assuming the rent collected during the lease belongs to the tenant rather than the landlord.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Dividend distributions alter stock prices, causing mispricing in basic BSM.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 2.5.2](./subtopic_options_2.5.2.md)**
- ➡️ **[Next Suggested: Volatility Must Be Estimated](./concept_options_36.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_options_35.md)**