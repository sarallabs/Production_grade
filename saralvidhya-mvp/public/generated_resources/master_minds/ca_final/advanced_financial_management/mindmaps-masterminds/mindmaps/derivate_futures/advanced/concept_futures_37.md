# Arbitrage Execution Rule

> **Sub-Topic 3.2:** Arbitrage Strategies | **Chapter:** Derivates Futures | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 12
> **Content:** Buy low market, sell high market simultaneously.

--- 

### 📋 Summary View
- **Strategic Context:** Arbitrage execution requires concurrent trades in the spot and futures markets to lock in the pricing discrepancy without exposing the trader to market risk.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

### 🔍 Detailed View
To execute cash-and-carry arbitrage, the trader borrows funds at rate $r$, buys the stock in the spot market at $S_0$, and sells the futures contract at $F_0$. At maturity $T$, the stock is delivered to settle the futures contract, returning $F_0$ cash. The loan is repaid with $S_0 e^{rT}$, leaving a net profit of $F_0 - S_0 e^{rT}$. For reverse cash-and-carry, the trader short-sells the stock, invests the proceeds at the risk-free rate, and buys the futures, settling the short position at $T$ by buying the stock via the futures contract, locking in a profit of $S_0 e^{rT} - F_0$.

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Buy low market, sell high market simultaneously.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 3.2](./subtopic_futures_3.2.md)**
- ➡️ **[Next Suggested: Arbitrage Transaction Costs](./concept_futures_38.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_futures_37.md)**