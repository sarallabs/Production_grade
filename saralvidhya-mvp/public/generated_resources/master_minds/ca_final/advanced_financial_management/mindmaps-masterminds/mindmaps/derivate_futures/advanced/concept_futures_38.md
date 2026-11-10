# Arbitrage Transaction Costs

> **Sub-Topic 3.2:** Arbitrage Strategies | **Chapter:** Derivates Futures | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 12
> **Content:** Costs: Brokerage, STT, Margins, Stock Borrowing Charges.

--- 

### 📋 Summary View
- **Strategic Context:** Transaction costs define the arbitrage bounds, creating a neutral band where pricing discrepancies cannot be profitably exploited.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

### 🔍 Detailed View
Transaction costs include execution fees, clearing fees, taxes (STT), market impact, and financing costs. In reverse cash-and-carry, the trader must borrow stock, incurring stock borrowing fees ($c_b$). The arbitrage-free boundary is modified to:
$$S_0 e^{(r-c_b)T} \le F_0 \le S_0 e^{rT} + \text{Transaction Costs}$$
If the futures price lies within this band, arbitrageurs cannot make net profits, allowing the pricing mismatch to persist.
**Indian Arbitrage Transaction Costs Breakdown:**
**Brokerage:** Typically flat ₹20 per order or 0.01% - 0.03% of turnover.
**Securities Transaction Tax (STT):** 0.0125% on futures sell side, 0.1% on equity delivery buy/sell sides.
**Exchange Transaction Charges:** NSE charges ~0.0019% of turnover on futures.
**GST:** 18% of (Brokerage + Exchange Charges).
**SEBI Turnover Fees:** 0.0001% of turnover.
**Stamp Duty:** 0.015% on buy-side delivery, 0.002% on futures buy-side.
**Stock Borrowing and Lending (SBL) Charges:** Paid to lenders of stock for short sales, ranging from 1% to 15% annualized depending on liquidity.

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Costs: Brokerage, STT, Margins, Stock Borrowing Charges.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 3.2](./subtopic_futures_3.2.md)**
- ➡️ **[Next Suggested: Arbitrage Feasibility Rule](./concept_futures_39.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_futures_38.md)**