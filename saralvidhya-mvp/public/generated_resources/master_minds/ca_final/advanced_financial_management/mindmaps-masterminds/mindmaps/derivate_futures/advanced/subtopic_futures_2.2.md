# Sub-Topic 2.2: Daily Settlement & MTM

> **Reference:** Page 9

---

### 📋 Summary View

#### 🔸 Daily Mark-to-Market Process
- **Strategic Context:** The daily Mark-to-Market (MTM) process recalculates futures contract value against the closing settlement price, converting unrealized gains or losses into realized daily cash flows.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Zero Sum Game
- **Strategic Context:** The derivatives market is a zero-sum game in terms of nominal payoffs, serving as a risk-redistribution mechanism rather than a capital-accumulation vehicle.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Preventing Loss Accumulation
- **Strategic Context:** The MTM mechanism prevents credit risk accumulation by resetting the contract value to zero at the end of each trading session.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

---

### 🔍 Detailed View

#### 🔸 Daily Mark-to-Market Process
MTM is the clearinghouse's primary risk mitigation tool. By revaluing positions daily to the settlement price, the clearinghouse prevents the accumulation of large, uncollateralized losses. The daily cash flow adjustment is:
$$\text{MTM}_t = (F_t - F_{t-1}) \times \text{Lot Size} \times N$$
where $F_t$ is the day $t$ closing settlement price and $N$ is the number of contracts. This daily cash settlement changes the pricing dynamics of futures compared to forwards, as the daily cash flows are subject to reinvestment at the short-term risk-free rate, introducing interest rate risk to futures pricing models.

#### 🔸 Zero Sum Game
Mathematically, the derivatives market represents a zero-sum game because the net payoff vector is zero at all times:
$$\sum_{i=1}^{M} \Pi_i(S_T) = 0$$
where $\Pi_i$ is the payoff of participant $i$ and $M$ is the total number of participants. While the spot equity market grows over time as corporate profits increase, derivatives only partition and trade that risk. They facilitate risk transfer (e.g., from hedgers to speculators), which can improve economic welfare even though the net trading payoff remains zero.

#### 🔸 Preventing Loss Accumulation
By revaluing the futures contract daily, the exchange ensures that the maximum default exposure is limited to a single day's price movement. This prevents the accumulation of systemic credit risk. The margin collateral (SPAN + Exposure) is calibrated to cover this one-day price volatility with 99% confidence. If a trader fails to meet a margin call, the position is liquidated, preventing the loss from exceeding the posted margin and protecting the clearing corporation from default contagion.

---

### 🎴 Flashcards

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Process of verifying buy/sell positions with daily futures prices to settle gains/losses daily.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Sum of gain/loss of buyer and loss/gain of seller is always zero (Zero Sum Game).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Ensures daily settlement and prevents huge accumulated losses at expiry.
</details>

<!-- CONCEPTS: ./concept_futures_27.md, ./concept_futures_28.md, ./concept_futures_29.md -->