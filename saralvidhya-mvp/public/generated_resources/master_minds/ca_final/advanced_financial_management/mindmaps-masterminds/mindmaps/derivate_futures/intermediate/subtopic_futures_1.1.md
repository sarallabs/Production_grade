# Sub-Topic 1.1: Core Definitions

> **Reference:** Page 1, Page 1, Feature (a), Page 1, Feature (b), Page 1, Feature (c), Page 1, Feature (d), Page 1, Feature (f), Page 1, User (a), Page 1, User (b), Page 1, User (c), Page 1, User (d)

---

### 📋 Summary View

#### 🔸 Origin and Concept of Derivatives
- **Concept Summary:** Derivatives are secondary financial instruments whose value is derived from primary underlying variables (equity, bonds, commodities, currencies).
- **Formula/Rule:** The word 'Derivative' comes from 'derive' meaning to extract value from underlying assets (equity, bonds, currencies, commodities).
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Underlying Asset as Price Determinant
- **Concept Summary:** The pricing functions of derivatives rely on the spot price of the underlying asset as the primary independent variable.
- **Formula/Rule:** The price of the underlying is the main factor determining derivative prices.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Simultaneous Price Movement
- **Concept Summary:** The derivative market and the cash spot market exhibit simultaneous price adjustments due to high-frequency arbitrage and market-making algorithms.
- **Formula/Rule:** A change in underlying results in a simultaneous change in the derivative price.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Types of Underlying Assets
- **Concept Summary:** Underlying assets span multiple asset classes, including equities (individual stocks, indices), fixed-income debt securities, hard/soft commodities, and currency pairs.
- **Formula/Rule:** Underlying assets can be stock, debt, commodity, or foreign currency.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Dependency of Value
- **Concept Summary:** The intrinsic and extrinsic value of a derivative contract collapse to zero if the underlying asset's value or availability becomes null.
- **Formula/Rule:** Without the underlying, the derivative has no value.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Daily Marking and Maturity Settle
- **Concept Summary:** Futures contracts undergo a daily Mark-to-Market (MTM) process where cash flows are adjusted daily, while options and forwards settle final gains/losses at expiration.
- **Formula/Rule:** Long/short positions are marked to underlying value daily; gain/loss booked at maturity.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Individual Investors
- **Concept Summary:** Retail investors utilize derivatives for leveraged speculation, portfolio insurance (hedging), and cash-flow generation through option writing (yield enhancement).
- **Formula/Rule:** Individuals: Speculation, hedging, enhancing yield.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Institutional Investors
- **Concept Summary:** Institutional participants (Mutual Funds, FPIs, DIIs) employ derivatives for systemic risk mitigation, yield optimization, and cash-futures arbitrage.
- **Formula/Rule:** Institutional Investors: Hedging, yield enhancement, arbitrage.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Corporate Users
- **Concept Summary:** Corporates utilize commodity and currency derivatives to hedge inventory value fluctuations and foreign exchange exposure on import/export invoices.
- **Formula/Rule:** Companies: Hedge inventory risk and currency risk (receivables/payables).
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Market Dealers and Market Makers
- **Concept Summary:** Dealers and market makers maintain market liquidity by quoting bid-ask spreads, managing inventory risk through delta-hedging, and executing statistical arbitrage.
- **Formula/Rule:** Dealers: Provide two-way quotes, hedge positions, exploit inefficiencies/arbitrage.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

---

### 🔍 Detailed View

#### 🔸 Origin and Concept of Derivatives
A derivative is a contract between two or more parties whose value is based on an agreed-upon underlying financial asset, index, or security. The underlying asset's price acts as the anchor. If the underlying asset's price is $S_t$, the derivative contract's price $f(S_t, t)$ is a mathematical function of $S_t$ and time $t$.
**Worked Example:**
Consider an equity option contract. If the underlying stock (e.g., Reliance Industries) is trading at $S_0 = \text{₹}2,500$, a Call option derivative price might be $c = \text{₹}100$. If Reliance stock price rises to $\text{₹}2,600$, the Call option price may rise to $\text{₹}160$. Here, the value of the option is directly derived from Reliance's stock price movement.

#### 🔸 Underlying Asset as Price Determinant
In mathematical finance, the price of a derivative $f(S, t)$ is modeled with the spot price $S$ of the underlying as the primary state variable. While factors like volatility, interest rates, and time to maturity affect the price, the partial derivative with respect to the underlying price (known as Delta, $\Delta = \partial f/\partial S$) represents the sensitivity of the derivative price to changes in the underlying.
**Worked Example:**
If Nifty 50 index spot is at 22,000, and Nifty futures is trading at 22,080. If Nifty spot rises to 22,100 (a change of +100 points), Nifty futures price will rise to approximately 22,180 (a change of +100 points). The underlying index price change is the direct cause of the futures contract price change.

#### 🔸 Simultaneous Price Movement
Under the Efficient Market Hypothesis (EMH), information is incorporated into spot and derivative prices simultaneously. If a price mismatch occurs even for a fraction of a second, high-frequency trading (HFT) systems execute arbitrage trades to realign them. The relationship is expressed as:
$$\Delta f \approx \frac{\partial f}{\partial S} \Delta S + \frac{\partial f}{\partial t} \Delta t + \frac{1}{2} \frac{\partial^2 f}{\partial S^2} (\Delta S)^2$$
This Taylor series expansion shows that any change in $S$ ($\Delta S$) results in an immediate and concurrent change in the derivative price ($\Delta f$).

#### 🔸 Types of Underlying Assets
The operational characteristics of a derivative depend on its asset class:
1. **Equities**: Individual stocks and indices (Nifty 50 lot size: 25, Bank Nifty: 15).
2. **Debt/Interest Rates**: Government bonds (G-Secs) and MIBOR rate derivatives.
3. **Commodities**: Metals, energy, and agriculture traded on MCX/NCDEX.
4. **Currencies**: Foreign exchange pairs (USD/INR lot size is 1,000 USD).
Each asset class has unique settlement rules (cash settled vs. physical delivery) and margin requirements.

#### 🔸 Dependency of Value
A derivative contract is a conditional claim. Its payoff function at maturity $T$ is $H(S_T)$. For a Call option, $H(S_T) = \max(S_T - K, 0)$, and for a Future, $H(S_T) = S_T - F_0$. If the underlying asset spot price $S_t$ drops to 0, the payoff of a call option becomes $\max(0 - K, 0) = 0$. In all pricing models, if $S = 0$, the contract value $f(0, t) = 0$ for positive strike assets, verifying that the derivative cannot have independent value.

#### 🔸 Daily Marking and Maturity Settle
The exchange clearing house acts as the counterparty for every transaction. To prevent default risk, it calculates the daily settlement price at the end of each trading session. The daily profit/loss for a long position is:
$$\text{Daily MTM} = (P_t - P_{t-1}) \times \text{Lot Size}$$
where $P_t$ is the closing settlement price of day $t$. This cash is credited/debited to the trader's ledger account daily. The position is held until maturity or squared off earlier, with the final cumulative gain/loss realized upon contract exit.

#### 🔸 Individual Investors
Individuals participate in the F&O segment on the NSE/BSE. Under Indian tax laws (ITR-3), these transactions are treated as business income. Retail investors use:
1. **Speculation**: Utilizing leverage to trade directional views. For example, buying a Nifty Call option expecting a market rally.
2. **Hedging**: Buying a Nifty Put option to hedge an existing equity portfolio. If the portfolio value is $V_p$ and beta is $\beta_p$, the put option offsets market-wide declines.
3. **Yield Enhancement**: Covered call writing, where an investor sells out-of-the-money call options against their stock holdings to collect premiums.
**Indian Tax Treatment (F&O):**
**Classification:** Futures & Options (F&O) trading is classified as **Non-Speculative Business Income** under Section 43(5) of the Income Tax Act, 1961.
**Tax Filing:** Income or losses must be filed under **ITR-3** (not ITR-1 or ITR-2).
**Tax Rates:** Profits are taxed at the individual's applicable slab rates.
**Loss Carry Forward:** F&O business losses can be set off against any other business income (except salary) in the current year, and any unabsorbed loss can be carried forward for up to **8 years** to offset future business profits.
**Tax Audit:** Under Section 44AB, a tax audit is mandatory if the business turnover exceeds ₹10 crore (or ₹2 crore if cash transactions exceed 5%), or if the trader claims losses and their total income exceeds the basic exemption limit.

#### 🔸 Institutional Investors
Institutional investors use derivatives for:
1. **Hedging**: Managing portfolio beta. A mutual fund manager with a $\text{₹}100\text{ crore}$ portfolio might sell Nifty futures to run a market-neutral strategy.
2. **Yield Enhancement**: Using structures like cash-covered puts or writing calls on stock holdings (subject to SEBI limits).
3. **Arbitrage**: Executing cash-and-carry trades when the futures contract trades above its theoretical value ($F > S e^{rT}$). They buy the stock in the cash market and sell the futures contract simultaneously to lock in a risk-free return.

#### 🔸 Corporate Users
Corporate treasury departments utilize derivatives for risk management rather than speculation. Typical use cases include:
1. **Inventory Hedging**: An automobile manufacturer (e.g., Tata Motors) hedges its raw material costs (steel, aluminum) using commodity futures.
2. **Currency Hedging**: An exporter (e.g., TCS) with USD receivables sells USD/INR forward contracts. An importer (e.g., Indian Oil) with USD payables buys USD/INR forward or futures contracts to hedge against rupee depreciation. These trades are accounted for under hedge accounting standards (Ind AS 109).

#### 🔸 Market Dealers and Market Makers
Dealers operate as market makers. They profit from the bid-ask spread:
$$\text{Spread} = \text{Ask Price} - \text{Bid Price}$$
To maintain a market-neutral stance, they dynamically adjust their portfolios. For instance, if a dealer writes (sells) call options, they accumulate a short delta position. They hedge this by buying the underlying stock or buying futures. This process is called delta-hedging. They also monitor price discrepancies across exchanges (e.g., NSE vs. BSE) to conduct index-arbitrage.

---

### 🎴 Flashcards

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Derivatives are secondary financial instruments whose value is derived from primary underlying variables (equity, bonds, commodities, currencies).
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The pricing functions of derivatives rely on the spot price of the underlying asset as the primary independent variable.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The derivative market and the cash spot market exhibit simultaneous price adjustments due to high-frequency arbitrage and market-making algorithms.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Underlying assets span multiple asset classes, including equities (individual stocks, indices), fixed-income debt securities, hard/soft commodities, and currency pairs.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The intrinsic and extrinsic value of a derivative contract collapse to zero if the underlying asset's value or availability becomes null.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Futures contracts undergo a daily Mark-to-Market (MTM) process where cash flows are adjusted daily, while options and forwards settle final gains/losses at expiration.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Retail investors utilize derivatives for leveraged speculation, portfolio insurance (hedging), and cash-flow generation through option writing (yield enhancement).
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Institutional participants (Mutual Funds, FPIs, DIIs) employ derivatives for systemic risk mitigation, yield optimization, and cash-futures arbitrage.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Corporates utilize commodity and currency derivatives to hedge inventory value fluctuations and foreign exchange exposure on import/export invoices.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Dealers and market makers maintain market liquidity by quoting bid-ask spreads, managing inventory risk through delta-hedging, and executing statistical arbitrage.
</details>

<!-- CONCEPTS: ./concept_futures_1.md, ./concept_futures_2.md, ./concept_futures_3.md, ./concept_futures_4.md, ./concept_futures_5.md, ./concept_futures_6.md, ./concept_futures_7.md, ./concept_futures_8.md, ./concept_futures_9.md, ./concept_futures_10.md -->