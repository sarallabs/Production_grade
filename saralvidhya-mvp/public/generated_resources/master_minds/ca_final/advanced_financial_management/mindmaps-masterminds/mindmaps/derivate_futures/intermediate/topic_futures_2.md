# Topic 2: Margins

---

### 📋 Summary View

### 🔹 Sub-topic: Margin Mechanics

#### 🔸 Initial Margin and VaR
- **Concept Summary:** Initial Margin is the capital required to open a futures position, calculated using Value-at-Risk (VaR) models to cover 99% of potential daily losses.
- **Formula/Rule:** Initial Margin: Money deposited to assure contract integrity; covers likely loss 99% of times (VaR concept).
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Maintenance Margin
- **Concept Summary:** Maintenance Margin is the minimum balance required to keep a position active. If the account balance falls below this level, a margin call is triggered.
- **Formula/Rule:** Maintenance Margin: Minimum margin required to hold a position. Breaching this triggers a margin call.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Variation Margin Calls
- **Concept Summary:** Variation Margin is the cash payment required to restore a margin account to its initial margin level after a margin call has been triggered.
- **Formula/Rule:** Variation Margin: Additional money deposited to bring account back to Initial Margin level after a margin call.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

### 🔹 Sub-topic: Daily Settlement & MTM

#### 🔸 Daily Mark-to-Market Process
- **Concept Summary:** Mark-to-Market (MTM) is the daily valuation of futures contracts against closing market prices, with profits and losses credited or debited to the margin ledger.
- **Formula/Rule:** Process of verifying buy/sell positions with daily futures prices to settle gains/losses daily.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Zero Sum Game
- **Concept Summary:** Derivatives are zero-sum games where the aggregate net payoff across all long and short positions is zero.
- **Formula/Rule:** Sum of gain/loss of buyer and loss/gain of seller is always zero (Zero Sum Game).
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Preventing Loss Accumulation
- **Concept Summary:** Daily mark-to-market prevents the accumulation of unpaid losses, maintaining the solvency of the clearing system.
- **Formula/Rule:** Ensures daily settlement and prevents huge accumulated losses at expiry.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

---

### 🔍 Detailed View

### 🔹 Sub-topic: Margin Mechanics

#### 🔸 Initial Margin and VaR
Initial Margin is determined by the exchange. It consists of two components: SPAN margin and Exposure margin. The SPAN margin is calculated using a Value-at-Risk (VaR) model that simulates portfolio value under different market scenarios.
**Worked Example:**
If Nifty spot is at 22,000, and contract lot size is 25, the total contract value is $\text{₹}5,50,000$. If the exchange sets the initial margin rate (SPAN + Exposure) at 15%:
$$\text{Initial Margin} = 5,50,000 \times 0.15 = \text{₹}82,500$$
The trader must deposit $\text{₹}82,500$ in cash or collateral to open the position.

#### 🔸 Maintenance Margin
In global markets, the Maintenance Margin is typically set at a percentage of the Initial Margin (e.g., 75%). In India, brokers must collect the full margin (SPAN + Exposure) upfront, meaning the maintenance margin is effectively equal to the initial margin under SEBI client margin reporting rules. If a trader's account balance drops due to MTM losses, they must immediately deposit additional funds to restore the account to the initial margin level.

#### 🔸 Variation Margin Calls
When a margin call occurs, the trader must deposit Variation Margin. This is the difference between the current account equity and the initial margin level:
$$\text{Variation Margin} = \text{Initial Margin} - \text{Current Account Balance}$$
**Worked Example:**
Initial Margin = $\text{₹}80,000$.
Maintenance Margin = $\text{₹}60,000$.
Due to a price drop, the account balance falls to $\text{₹}55,000$.
Since $55,000 < 60,000$, a margin call is triggered.
Variation Margin required = $80,000 - 55,000 = \text{₹}25,000$.
(Note that the account must be restored to the Initial Margin level of ₹80,000, not just to the maintenance level).

### 🔹 Sub-topic: Daily Settlement & MTM

#### 🔸 Daily Mark-to-Market Process
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

#### 🔸 Zero Sum Game
For every buyer (long position) who expects prices to rise, there is a seller (short position) who expects prices to fall or stay flat. At maturity $T$:
$$\text{Payoff}_{\text{Long}} + \text{Payoff}_{\text{Short}} = (S_T - F_0) + (F_0 - S_T) = 0$$
This illustrates that derivatives do not create wealth; they redistribute risk and returns among market participants. Transaction costs (brokerage, taxes) make it a negative-sum game for participants in practice.

#### 🔸 Preventing Loss Accumulation
Without daily MTM, a trader's loss could accumulate over the contract life (e.g., 3 months). If the loss exceeds their financial capacity, they would default at maturity. Daily MTM checks this risk by requiring the trader to settle losses in cash daily. If the trader cannot pay, their position is closed before the loss can grow further, protecting the broker and the clearinghouse.

---

### 🎴 Flashcards

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Initial Margin is the capital required to open a futures position, calculated using Value-at-Risk (VaR) models to cover 99% of potential daily losses.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Maintenance Margin is the minimum balance required to keep a position active. If the account balance falls below this level, a margin call is triggered.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Variation Margin is the cash payment required to restore a margin account to its initial margin level after a margin call has been triggered.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Mark-to-Market (MTM) is the daily valuation of futures contracts against closing market prices, with profits and losses credited or debited to the margin ledger.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Derivatives are zero-sum games where the aggregate net payoff across all long and short positions is zero.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Daily mark-to-market prevents the accumulation of unpaid losses, maintaining the solvency of the clearing system.
</details>