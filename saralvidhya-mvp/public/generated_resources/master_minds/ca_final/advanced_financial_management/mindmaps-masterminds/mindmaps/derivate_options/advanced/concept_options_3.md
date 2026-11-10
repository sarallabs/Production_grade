# Put Option

> **Sub-Topic 2.1.1:** Core Definitions | **Chapter:** Derivatives Options | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 2
> **Content:** Put Option: Right to sell underlying security.

--- 

### 📋 Summary View
- **Strategic Context:** **Concept Summary:** A Put Option is a contract granting the holder negative Delta exposure ($\Delta < 0$) and positive Gamma exposure ($\Gamma > 0$), allowing them to profit from downward price movements and rising volatility.
**Key Takeaway:** A Put option is a convex hedging instrument whose value increases as the underlying asset price drops.
**Analogy:** A sovereign wealth fund purchasing credit default protection to hedge Indian government bond portfolios against credit rating downgrades.
- **Quantitative Model:** No specific quantitative model details.
- **Risk/Opportunity:** No specific risk/opportunity details.

### 🔍 Detailed View
**Explanation:** Under the Black-Scholes framework, the price of a European Put option ($p$) is:
$$p = X e^{-rT} N(-d_2) - S_0 N(-d_1)$$
where $N(-d_1) = 1 - N(d_1)$ represents the absolute short stock exposure needed to delta-hedge the put option, and $N(-d_2)$ represents the risk-neutral probability that the put will expire in-the-money.
**Worked Example:** A fund manager holds ₹10 Crore worth of stock and buys At-the-Money Put options with a Delta of -0.50. This creates a partial hedge. If the market crashes by 5%, the put options gain value, offsetting the equity portfolio losses, while the Put Delta shifts toward -1.00 (becoming a 100% hedge).

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> A Put Option is a contract granting the holder negative Delta exposure ($\Delta < 0$) and positive Gamma exposure ($\Gamma > 0$), allowing them to profit from downward price movements and rising volatility.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> A sovereign wealth fund purchasing credit default protection to hedge Indian government bond portfolios against credit rating downgrades.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> A Put option is a convex hedging instrument whose value increases as the underlying asset price drops.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 2.1.1](./subtopic_options_2.1.1.md)**
- ➡️ **[Next Suggested: Seller (Writer) of Call](./concept_options_4.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_options_3.md)**