# Expiry Cycle & Last Thursday Rule

> **Sub-Topic 4.2:** Expiry & Rollover Methods | **Chapter:** Derivates Futures | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 15, Expiry Chapter
> **Content:** NSE equity derivative contracts expire on the last Thursday of the respective contract month. (Ref: NSE Rules)

--- 

### 📋 Summary View
- **Strategic Context:** Institutional players manage expiration exposure by adjusting options gamma hedges and executing roll trades to maintain continuous exposure without physical delivery friction.
- **Quantitative Model:** At maturity $T$, basis converges to zero: $\lim_{t \to T} (F_t - S_t) = 0$. Volatility smile steepens on expiry day as market makers defend option strikes.
- **Risk/Opportunity:** Rollover cost risk (arbitrageurs exploitation of roll spread) and physical delivery delivery-margin spikes (100% of contract value required under SEBI's physical settlement regime).

### 🔍 Detailed View
Institutional portfolios face rollover risk—the cost of closing near-month contracts and buying next-month contracts. If the next-month contract trades at a premium (Contango), rolling a long position incurs a cost. If it trades at a discount (Backwardation), rolling yields a positive roll return.

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: What is rollover risk for institutional long positions in contango markets? (Click to reveal)</summary>
<br>
<b>Answer:</b> The cost of buying the next-month contract at a premium relative to selling the expiring near-month contract, causing a drag on returns.
</details>

<details>
<summary>⚡ Card 2: What mathematical condition is satisfied by spot and futures prices at maturity? (Click to reveal)</summary>
<br>
<b>Answer:</b> Convergence: $F_T = S_T$, meaning basis becomes zero.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 4.2](./subtopic_futures_4.2.md)**
- ➡️ **[Next Suggested: Rollover of Futures Positions](./concept_futures_51.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_futures_50.md)**