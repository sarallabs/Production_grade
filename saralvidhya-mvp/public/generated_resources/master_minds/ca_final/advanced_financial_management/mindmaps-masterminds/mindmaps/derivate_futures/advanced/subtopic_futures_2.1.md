# Sub-Topic 2.1: Margin Mechanics

> **Reference:** Page 8

---

### 📋 Summary View

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

---

### 🔍 Detailed View

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

<!-- CONCEPTS: ./concept_futures_24.md, ./concept_futures_25.md, ./concept_futures_26.md -->