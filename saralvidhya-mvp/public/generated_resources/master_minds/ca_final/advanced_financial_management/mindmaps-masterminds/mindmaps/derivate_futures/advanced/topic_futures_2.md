# Topic 2: Margins

---

### 📋 Summary View

### 🔹 Sub-topic: Margin Mechanics

#### 🔸 Initial Margin and VaR
- **Strategic Context:** Initial Margin represents the capital buffer required to absorb potential daily price moves, calibrated using SPAN and VaR risk-modeling frameworks.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Maintenance Margin
- **Strategic Context:** Maintenance Margin acts as the critical risk threshold trigger, preventing credit exposure from exceeding the posted collateral value.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Variation Margin Calls
- **Strategic Context:** Variation Margin represents the daily cash flow required to clear credit exposures in the margin account, restoring collateral to the initial margin level.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

### 🔹 Sub-topic: Daily Settlement & MTM

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

### 🔹 Sub-topic: Margin Mechanics

#### 🔸 Initial Margin and VaR
The Initial Margin is designed to protect the clearinghouse from participant default. In India, SEBI mandates that the initial margin must cover a 99% Value-at-Risk (VaR) over a one-day horizon. For volatile stocks, the VaR margin is higher, supplemented by an Exposure Margin (typically 3.5% for index contracts and 5% or more for stock contracts). The total margin requirement is:
$$\text{Total Margin} = \text{SPAN Margin} + \text{Exposure Margin}$$
SPAN uses grid pricing algorithms to evaluate portfolio risk across multiple price and volatility scenarios, determining the minimum capital buffer required.
**SPAN Margin Methodology:**
**SPAN (Standardized Portfolio Analysis of Risk)** was developed by the Chicago Mercantile Exchange (CME) and is used by NSE clearing houses.
It evaluates the risk of a portfolio by calculating the worst-case loss across **16 risk scenarios** combining price scans (typically +/- 3 standard deviations) and volatility scans (volatility shifts up or down).
The SPAN margin is supplemented by an **Exposure Margin** (usually 3.5% for indices and 5% or more for stock futures) to cover risks not captured by SPAN (such as intraday price jumps or extreme event risks).

#### 🔸 Maintenance Margin
The Maintenance Margin is the minimum collateral level required to sustain an open position. If the equity in the margin account, $E_t = \text{Initial Margin} \pm \sum \text{Daily MTM}_t$, falls below the Maintenance Margin $M_m$:
$$E_t < M_m$$
The client is issued a margin call. Under US and international exchange guidelines, the client must deposit Variation Margin to restore the account balance back to the Initial Margin level. In India, SEBI requires that the margin account must be maintained at the full SPAN + Exposure level daily, meaning any shortfall must be cleared before the next trading day.

#### 🔸 Variation Margin Calls
Variation Margin is the cash flow that settles daily mark-to-market changes. Under standard exchange rules, when a margin call is triggered, the client must deposit Variation Margin to restore the account to the Initial Margin level. In institutional clearing, variation margin is paid daily (and sometimes intra-day during high volatility) to clear default risk. Failure to post variation margin by the specified cutoff time (typically before market open on $T+1$) constitutes a default, prompting the clearing broker to liquidate the client's positions.

### 🔹 Sub-topic: Daily Settlement & MTM

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
<b>Answer:</b> Initial Margin: Money deposited to assure contract integrity; covers likely loss 99% of times (VaR concept).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Maintenance Margin: Minimum margin required to hold a position. Breaching this triggers a margin call.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Variation Margin: Additional money deposited to bring account back to Initial Margin level after a margin call.
</details>

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