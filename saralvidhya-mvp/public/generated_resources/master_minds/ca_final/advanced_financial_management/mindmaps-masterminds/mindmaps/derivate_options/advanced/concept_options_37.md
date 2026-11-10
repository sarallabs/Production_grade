# Overvalues Deep OTM Calls / Undervalues Deep ITM Calls

> **Sub-Topic 2.5.2:** Limitations | **Chapter:** Derivatives Options | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 3
> **Content:** Tends to overvalue deep OTM calls and undervalue deep ITM calls.

--- 

### 📋 Summary View
- **Strategic Context:** **Concept Summary:** BSM tends to misprice options that are far away from the stock price (OTM or ITM) due to its assumption of a symmetric log-normal distribution.
**Key Takeaway:** The model is less accurate for extreme strikes (ends of the distribution).
**Analogy:** A scale that is accurate for average weights but shows incorrect readings for extremely light or extremely heavy objects.
- **Quantitative Model:** No specific quantitative model details.
- **Risk/Opportunity:** No specific risk/opportunity details.

### 🔍 Detailed View
**Explanation:** Because BSM uses a normal distribution of returns, it underestimates the probability of extreme market events. Real markets show a "volatility smile," where deep OTM and deep ITM options trade at higher implied volatilities than ATM options to compensate for this tail-risk.
**Worked Example:** For a stock trading at ₹1,000, a Call option with a strike of ₹1,200 (OTM) should theoretically be worth ₹0.05 according to BSM. In reality, due to speculative demand and tail-risk hedging on the NSE, it trades at ₹2.00. BSM significantly undervalued the option.

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> BSM tends to misprice options that are far away from the stock price (OTM or ITM) due to its assumption of a symmetric log-normal distribution.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> A scale that is accurate for average weights but shows incorrect readings for extremely light or extremely heavy objects.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The model is less accurate for extreme strikes (ends of the distribution).
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 2.5.2](./subtopic_options_2.5.2.md)**
- ➡️ **[Next Suggested: Misprices Options on High-Dividend Stocks](./concept_options_38.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_options_37.md)**