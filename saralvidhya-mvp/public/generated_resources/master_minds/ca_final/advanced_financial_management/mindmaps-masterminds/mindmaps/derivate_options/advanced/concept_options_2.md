# Call Option

> **Sub-Topic 2.1.1:** Core Definitions | **Chapter:** Derivatives Options | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 2
> **Content:** Call Option: Right to buy underlying security.

--- 

### 📋 Summary View
- **Strategic Context:** **Concept Summary:** A Call Option is a contract granting the holder positive Delta exposure ($\Delta > 0$) and positive Gamma exposure ($\Gamma > 0$), allowing them to profit from upward price movements and rising volatility.
**Key Takeaway:** A Call option represents a leveraged long position with limited downside risk and positive convexity.
**Analogy:** A developer securing land development rights near the upcoming Noida International Airport by paying a non-refundable option fee, locking in land acquisition costs before zoning approvals.
- **Quantitative Model:** No specific quantitative model details.
- **Risk/Opportunity:** No specific risk/opportunity details.

### 🔍 Detailed View
**Explanation:** Under the Black-Scholes framework, the price of a European Call option ($c$) is:
$$c = S_0 N(d_1) - X e^{-rT} N(d_2)$$
where $N(d_1)$ represents the delta of the call option (and the replicating stock position), and $N(d_2)$ represents the risk-neutral probability that the option will expire in-the-money.
**Worked Example:** For a stock at ₹1,000, a ₹1,000 strike Call with $d_1 = 0.15$ and $d_2 = 0.05$ has a Delta of $N(d_1) \approx 0.56$. If the stock jumps by ₹10, the call premium rises by approximately ₹5.60, while the probability of expiring ITM ($N(d_2) \approx 0.52$) increases.

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> A Call Option is a contract granting the holder positive Delta exposure ($\Delta > 0$) and positive Gamma exposure ($\Gamma > 0$), allowing them to profit from upward price movements and rising volatility.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> A developer securing land development rights near the upcoming Noida International Airport by paying a non-refundable option fee, locking in land acquisition costs before zoning approvals.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> A Call option represents a leveraged long position with limited downside risk and positive convexity.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 2.1.1](./subtopic_options_2.1.1.md)**
- ➡️ **[Next Suggested: Put Option](./concept_options_3.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_options_2.md)**