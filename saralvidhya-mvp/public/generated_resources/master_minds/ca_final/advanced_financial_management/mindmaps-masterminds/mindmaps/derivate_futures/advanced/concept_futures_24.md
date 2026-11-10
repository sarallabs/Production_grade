# Initial Margin and VaR

> **Sub-Topic 2.1:** Margin Mechanics | **Chapter:** Derivates Futures | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 8
> **Content:** Initial Margin: Money deposited to assure contract integrity; covers likely loss 99% of times (VaR concept).

--- 

### 📋 Summary View
- **Strategic Context:** Initial Margin represents the capital buffer required to absorb potential daily price moves, calibrated using SPAN and VaR risk-modeling frameworks.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

### 🔍 Detailed View
The Initial Margin is designed to protect the clearinghouse from participant default. In India, SEBI mandates that the initial margin must cover a 99% Value-at-Risk (VaR) over a one-day horizon. For volatile stocks, the VaR margin is higher, supplemented by an Exposure Margin (typically 3.5% for index contracts and 5% or more for stock contracts). The total margin requirement is:
$$\text{Total Margin} = \text{SPAN Margin} + \text{Exposure Margin}$$
SPAN uses grid pricing algorithms to evaluate portfolio risk across multiple price and volatility scenarios, determining the minimum capital buffer required.
**SPAN Margin Methodology:**
**SPAN (Standardized Portfolio Analysis of Risk)** was developed by the Chicago Mercantile Exchange (CME) and is used by NSE clearing houses.
It evaluates the risk of a portfolio by calculating the worst-case loss across **16 risk scenarios** combining price scans (typically +/- 3 standard deviations) and volatility scans (volatility shifts up or down).
The SPAN margin is supplemented by an **Exposure Margin** (usually 3.5% for indices and 5% or more for stock futures) to cover risks not captured by SPAN (such as intraday price jumps or extreme event risks).

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Initial Margin: Money deposited to assure contract integrity; covers likely loss 99% of times (VaR concept).
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 2.1](./subtopic_futures_2.1.md)**
- ➡️ **[Next Suggested: Maintenance Margin](./concept_futures_25.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_futures_24.md)**