# Sub-Topic 3.2: Arbitrage Strategies

> **Reference:** Page 12

---

### 📋 Summary View

#### 🔸 Arbitrage Concept
- **Concept Summary:** Arbitrage is a zero-investment trading strategy that locks in a riskless profit by exploiting temporary pricing discrepancies between the spot and futures markets.
- **Formula/Rule:** Zero-investment strategy to make riskless profit by exploiting mispricing.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Arbitrage Execution Rule
- **Concept Summary:** Arbitrageurs execute simultaneous trades to buy in the underpriced market and sell in the overpriced market, eliminating execution risk.
- **Formula/Rule:** Buy low market, sell high market simultaneously.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Arbitrage Transaction Costs
- **Concept Summary:** Arbitrage profits are reduced by transaction costs, including brokerage, STT, exchange fees, and stock borrowing costs.
- **Formula/Rule:** Costs: Brokerage, STT, Margins, Stock Borrowing Charges.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Arbitrage Feasibility Rule
- **Concept Summary:** Arbitrage trades are only executed when the pricing mismatch is larger than the total transaction costs, ensuring a net positive return.
- **Formula/Rule:** Arbitrage is not undertaken if transaction costs exceed gains.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

---

### 🔍 Detailed View

#### 🔸 Arbitrage Concept
An arbitrage transaction requires no net capital outlay and carries no market risk. The trader buys the asset in the cheaper market and sells it in the more expensive market simultaneously. Because the two contracts must converge to the same price at maturity ($F_T = S_T$), the pricing discrepancy represents a guaranteed profit that is locked in at the time of the trade.

#### 🔸 Arbitrage Execution Rule
The execution of arbitrage depends on the direction of the mispricing:
1. **Cash-and-Carry Arbitrage** (when $F_0 > S_0 e^{rT}$):
Buy the asset in the spot market (low price).
Sell the futures contract (high price).
2. **Reverse Cash-and-Carry Arbitrage** (when $F_0 < S_0 e^{rT}$):
Short-sell the asset in the spot market (high price).
Buy the futures contract (low price).

#### 🔸 Arbitrage Transaction Costs
The net profit of an arbitrage trade must account for all transaction costs:
$$\text{Net Profit} = (F_0 - S_0 e^{rT}) - \text{Transaction Costs}$$
In India, these costs include:
**Securities Transaction Tax (STT)**: 0.1% on equity delivery trades.
**Brokerage**: Flat fee or percentage-based fee.
**Exchange Transaction Charges**: Paid to NSE/BSE.
**Stock Lending and Borrowing (SLB) Fees**: Required to borrow shares for short-selling.

#### 🔸 Arbitrage Feasibility Rule
An arbitrage trade is feasible if and only if:
$$\lvert F_{\text{market}} - F_{\text{theoretical}} \rvert > \text{Total Transaction Costs}$$
If the price difference is smaller than the costs, the trade is unprofitable. Because institutional brokers have lower transaction costs than retail traders, they can exploit smaller pricing discrepancies, keeping the markets efficient.

---

### 🎴 Flashcards

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Arbitrage is a zero-investment trading strategy that locks in a riskless profit by exploiting temporary pricing discrepancies between the spot and futures markets.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Arbitrageurs execute simultaneous trades to buy in the underpriced market and sell in the overpriced market, eliminating execution risk.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Arbitrage profits are reduced by transaction costs, including brokerage, STT, exchange fees, and stock borrowing costs.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Arbitrage trades are only executed when the pricing mismatch is larger than the total transaction costs, ensuring a net positive return.
</details>

<!-- CONCEPTS: ./concept_futures_36.md, ./concept_futures_37.md, ./concept_futures_38.md, ./concept_futures_39.md -->