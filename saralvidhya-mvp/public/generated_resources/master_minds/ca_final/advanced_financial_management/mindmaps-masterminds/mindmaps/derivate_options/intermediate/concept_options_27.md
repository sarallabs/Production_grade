# No Dividends During Option Life

> **Sub-Topic 2.5.1:** Assumptions | **Chapter:** Derivatives Options | **Level:** Intermediate

--- 

### 📝 Source Institutional Content
> **Reference:** Page 3
> **Content:** No dividends during option life.

--- 

### 📋 Summary View
- **Concept Summary:** The basic BSM formula assumes that the underlying asset pays no dividends during the life of the option contract.
- **Formula/Rule:** Standard guidelines apply.
- **Application Context:** No specific application context available.

### 🔍 Detailed View
**Explanation:** When a stock goes ex-dividend, its price drops by the amount of the dividend. This drop reduces Call premiums and increases Put premiums. BSM assumes no dividends are paid, which leads to mispricing if applied to dividend-paying stocks.
**Worked Example:** ITC trades at ₹400 and will pay a ₹10 dividend in 2 weeks. The stock price will drop to ₹390. Standard BSM will overprice Calls on ITC because it expects the stock to stay near ₹400. To correct this, the Black-Scholes model must be adjusted to subtract the present value of the dividend from the stock price.

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The basic BSM formula assumes that the underlying asset pays no dividends during the life of the option contract.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Valuing a company's stock assuming it will never distribute cash payouts to its owners.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Expected dividend payments lower stock prices, which BSM ignores.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 2.5.1](./subtopic_options_2.5.1.md)**
- ➡️ **[Next Suggested: European Exercise Terms](./concept_options_28.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_options_27.md)**