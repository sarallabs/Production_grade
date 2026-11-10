# Sub-Topic 4.2: Expiry & Rollover Methods

> **Reference:** Page 15, Expiry Chapter, Page 16, Execution Chapter, Page 17, Regulations Chapter

---

### 📋 Summary View

#### 🔸 Expiry Cycle & Last Thursday Rule
- **Strategic Context:** Institutional players manage expiration exposure by adjusting options gamma hedges and executing roll trades to maintain continuous exposure without physical delivery friction.
- **Quantitative Model:** At maturity $T$, basis converges to zero: $\lim_{t \to T} (F_t - S_t) = 0$. Volatility smile steepens on expiry day as market makers defend option strikes.
- **Risk/Opportunity:** Rollover cost risk (arbitrageurs exploitation of roll spread) and physical delivery delivery-margin spikes (100% of contract value required under SEBI's physical settlement regime).

#### 🔸 Rollover of Futures Positions
- **Strategic Context:** Institutional desks execute rollovers via spread orders on the exchange, optimizing execution prices to minimize slippage against the volume-weighted average price (VWAP).
- **Quantitative Model:** Roll Return ($R_{roll}$) is defined as: $R_{roll} = \frac{F_{near} - F_{next}}{F_{near}}$. If $F_{next} > F_{near}$ (Contango), rolling long positions incurs a negative yield.
- **Risk/Opportunity:** Rollover slippage, liquidity drying up in near-month contracts during the final hours of trading, and sudden changes in the roll spread due to market events.

#### 🔸 Physical vs. Cash Settlement
- **Strategic Context:** 
- **Quantitative Model:** Payoff matrix: physical settlement incorporates demat transaction costs, custody fees, and short-delivery auction risks.
- **Risk/Opportunity:** Short delivery auction penalty risk (up to 20% of share value if seller fails to deliver stock) and demat delivery failures. Arbitrageurs profit by buying spot and selling futures, then holding to physical delivery.

---

### 🔍 Detailed View

#### 🔸 Expiry Cycle & Last Thursday Rule
Institutional portfolios face rollover risk—the cost of closing near-month contracts and buying next-month contracts. If the next-month contract trades at a premium (Contango), rolling a long position incurs a cost. If it trades at a discount (Backwardation), rolling yields a positive roll return.

#### 🔸 Rollover of Futures Positions
Quantitative strategies evaluate the cost of carry vs. the roll spread. Arbitrage desks exploit deviations in roll spreads from their theoretical carry values by taking positions in the spread market, which has its own order book on the NSE.

#### 🔸 Physical vs. Cash Settlement
Physical settlement creates arbitrage opportunities. If futures trade at a discount (Backwardation) near expiry, an arbitrageur can buy futures, sell spot (shorting the stock), and let the contracts go to physical delivery. The shares received from the long futures contract will cover the short stock position.

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

<details>
<summary>⚡ Card 1: What is short delivery risk in physical settlement? (Click to reveal)</summary>
<br>
<b>Answer:</b> The risk that the seller does not own or deliver the shares, triggering a SEBI auction where shares are purchased at a penalty price (up to 20% premium) at the seller's cost.
</details>

<details>
<summary>⚡ Card 2: How can an arbitrageur exploit a discount in stock futures using physical settlement? (Click to reveal)</summary>
<br>
<b>Answer:</b> Buy the futures contract, short sell the stock in the cash market, and hold until expiration to receive shares from the futures contract to cover the short position.
</details>

<!-- CONCEPTS: ./concept_futures_50.md, ./concept_futures_51.md, ./concept_futures_52.md -->