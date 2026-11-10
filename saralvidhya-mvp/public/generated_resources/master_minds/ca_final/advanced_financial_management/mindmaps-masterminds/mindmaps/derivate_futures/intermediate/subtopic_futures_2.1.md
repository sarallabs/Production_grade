# Sub-Topic 2.1: Margin Mechanics

> **Reference:** Page 8

---

### 📋 Summary View

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

---

### 🔍 Detailed View

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

<!-- CONCEPTS: ./concept_futures_24.md, ./concept_futures_25.md, ./concept_futures_26.md -->