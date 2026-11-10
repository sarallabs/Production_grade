# Rollover of Futures Positions

> **Sub-Topic 4.2:** Expiry & Rollover Methods | **Chapter:** Derivates Futures | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 16, Execution Chapter
> **Content:** The process of carrying forward a futures position from the current month to the next month. (Ref: Institutional Practice)

--- 

### 📋 Summary View
- **Strategic Context:** Institutional desks execute rollovers via spread orders on the exchange, optimizing execution prices to minimize slippage against the volume-weighted average price (VWAP).
- **Quantitative Model:** Roll Return ($R_{roll}$) is defined as: $R_{roll} = \frac{F_{near} - F_{next}}{F_{near}}$. If $F_{next} > F_{near}$ (Contango), rolling long positions incurs a negative yield.
- **Risk/Opportunity:** Rollover slippage, liquidity drying up in near-month contracts during the final hours of trading, and sudden changes in the roll spread due to market events.

### 🔍 Detailed View
Quantitative strategies evaluate the cost of carry vs. the roll spread. Arbitrage desks exploit deviations in roll spreads from their theoretical carry values by taking positions in the spread market, which has its own order book on the NSE.

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: How do you calculate roll return? (Click to reveal)</summary>
<br>
<b>Answer:</b> Roll Return = (Near-Month Future Price - Next-Month Future Price) / Near-Month Future Price.
</details>

<details>
<summary>⚡ Card 2: Why do institutional desks use the NSE spread order book? (Click to reveal)</summary>
<br>
<b>Answer:</b> To execute both legs of the rollover trade simultaneously, eliminating execution leg risk and minimizing slippage.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 4.2](./subtopic_futures_4.2.md)**
- ➡️ **[Next Suggested: Physical vs. Cash Settlement](./concept_futures_52.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_futures_51.md)**