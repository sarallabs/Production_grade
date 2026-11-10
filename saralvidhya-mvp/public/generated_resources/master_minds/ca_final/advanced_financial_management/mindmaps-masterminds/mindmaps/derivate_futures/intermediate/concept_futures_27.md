# Daily Mark-to-Market Process

> **Sub-Topic 2.2:** Daily Settlement & MTM | **Chapter:** Derivates Futures | **Level:** Intermediate

--- 

### 📝 Source Institutional Content
> **Reference:** Page 9
> **Content:** Process of verifying buy/sell positions with daily futures prices to settle gains/losses daily.

--- 

### 📋 Summary View
- **Concept Summary:** Mark-to-Market (MTM) is the daily valuation of futures contracts against closing market prices, with profits and losses credited or debited to the margin ledger.
- **Formula/Rule:** Process of verifying buy/sell positions with daily futures prices to settle gains/losses daily.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

### 🔍 Detailed View
At the end of each trading day, the exchange determines the daily settlement price (usually the volume-weighted average price in the last 30 minutes of trading). The MTM is calculated as:
$$\text{Daily MTM} = (\text{Settlement Price}_t - \text{Settlement Price}_{t-1}) \times \text{Lot Size}$$
**MTM Ledger Example (Nifty Lot Size = 25):**
**Day 0**: Buy 1 lot at 22,000. Deposit Initial Margin of $\text{₹}80,000$.
**Day 1**: Nifty closes at 22,100.
$\text{MTM} = (22,100 - 22,000) \times 25 = +\text{₹}2,500$ (Credited to ledger).
Account balance = $80,000 + 2,500 = \text{₹}82,500$.
**Day 2**: Nifty closes at 21,950.
$\text{MTM} = (21,950 - 22,100) \times 25 = -\text{₹}3,750$ (Debited from ledger).
Account balance = $82,500 - 3,750 = \text{₹}78,750$.

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Mark-to-Market (MTM) is the daily valuation of futures contracts against closing market prices, with profits and losses credited or debited to the margin ledger.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 2.2](./subtopic_futures_2.2.md)**
- ➡️ **[Next Suggested: Zero Sum Game](./concept_futures_28.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_futures_27.md)**