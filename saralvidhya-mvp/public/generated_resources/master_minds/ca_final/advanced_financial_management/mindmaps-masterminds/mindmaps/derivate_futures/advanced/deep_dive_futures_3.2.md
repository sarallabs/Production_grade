# Deep Dive: Arbitrage Strategies

#### 🔸 Arbitrage Concept
> **Chapter:** Derivates Futures | **Level:** Advanced Deep Dive

--- 

## 📚 Reference Books & Study Material

- **Options, Futures, and Other Derivatives** by *John C. Hull* — [Visit Resource](https://www.pearson.com)
- **Derivatives and Risk Management** by *Rajiv Srivastava* — [Visit Resource](https://www.oxforduniversitypress.com)
- **NISM Series VIII: Equity Derivatives Certification Workbook** by *National Institute of Securities Markets* — [Visit Resource](https://www.nism.ac.in)
- **SEBI Rules & Circulars on Physical Settlement** by *Securities and Exchange Board of India* — [Visit Resource](https://www.sebi.gov.in)

## 🔬 Advanced Context & Institutional Insights

In deep dive mode, we explore the institutional application and regulatory background of this concept. Under SEBI rules, Indian derivatives are subject to standard margins (SPAN + Exposure) and are tightly regulated to ensure systemic safety.

### Quantitative Modeling & Mathematical Context

> **Model Parameters:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.

An arbitrage opportunity exists if a portfolio can be constructed with zero value at time $t=0$, has a non-negative value at time $T$, and a positive probability of a positive value at $T$. In an efficient market, these opportunities are quickly eliminated by trading activity. The relationship $F_0 = S_0 e^{rT}$ represents the boundary where arbitrage profits are zero, defining the theoretical price of the futures contract.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_36.md)**

#### 🔸 Arbitrage Execution Rule
> **Chapter:** Derivates Futures | **Level:** Advanced Deep Dive

--- 

## 📚 Reference Books & Study Material

- **Options, Futures, and Other Derivatives** by *John C. Hull* — [Visit Resource](https://www.pearson.com)
- **Derivatives and Risk Management** by *Rajiv Srivastava* — [Visit Resource](https://www.oxforduniversitypress.com)
- **NISM Series VIII: Equity Derivatives Certification Workbook** by *National Institute of Securities Markets* — [Visit Resource](https://www.nism.ac.in)
- **SEBI Rules & Circulars on Physical Settlement** by *Securities and Exchange Board of India* — [Visit Resource](https://www.sebi.gov.in)

## 🔬 Advanced Context & Institutional Insights

In deep dive mode, we explore the institutional application and regulatory background of this concept. Under SEBI rules, Indian derivatives are subject to standard margins (SPAN + Exposure) and are tightly regulated to ensure systemic safety.

### Quantitative Modeling & Mathematical Context

> **Model Parameters:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.

To execute cash-and-carry arbitrage, the trader borrows funds at rate $r$, buys the stock in the spot market at $S_0$, and sells the futures contract at $F_0$. At maturity $T$, the stock is delivered to settle the futures contract, returning $F_0$ cash. The loan is repaid with $S_0 e^{rT}$, leaving a net profit of $F_0 - S_0 e^{rT}$. For reverse cash-and-carry, the trader short-sells the stock, invests the proceeds at the risk-free rate, and buys the futures, settling the short position at $T$ by buying the stock via the futures contract, locking in a profit of $S_0 e^{rT} - F_0$.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_37.md)**

#### 🔸 Arbitrage Transaction Costs
> **Chapter:** Derivates Futures | **Level:** Advanced Deep Dive

--- 

## 📚 Reference Books & Study Material

- **Options, Futures, and Other Derivatives** by *John C. Hull* — [Visit Resource](https://www.pearson.com)
- **Derivatives and Risk Management** by *Rajiv Srivastava* — [Visit Resource](https://www.oxforduniversitypress.com)
- **NISM Series VIII: Equity Derivatives Certification Workbook** by *National Institute of Securities Markets* — [Visit Resource](https://www.nism.ac.in)
- **SEBI Rules & Circulars on Physical Settlement** by *Securities and Exchange Board of India* — [Visit Resource](https://www.sebi.gov.in)

## 🔬 Advanced Context & Institutional Insights

In deep dive mode, we explore the institutional application and regulatory background of this concept. Under SEBI rules, Indian derivatives are subject to standard margins (SPAN + Exposure) and are tightly regulated to ensure systemic safety.

### Quantitative Modeling & Mathematical Context

> **Model Parameters:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.

Transaction costs include execution fees, clearing fees, taxes (STT), market impact, and financing costs. In reverse cash-and-carry, the trader must borrow stock, incurring stock borrowing fees ($c_b$). The arbitrage-free boundary is modified to:
$$S_0 e^{(r-c_b)T} \le F_0 \le S_0 e^{rT} + \text{Transaction Costs}$$
If the futures price lies within this band, arbitrageurs cannot make net profits, allowing the pricing mismatch to persist.
**Indian Arbitrage Transaction Costs Breakdown:**
**Brokerage:** Typically flat ₹20 per order or 0.01% - 0.03% of turnover.
**Securities Transaction Tax (STT):** 0.0125% on futures sell side, 0.1% on equity delivery buy/sell sides.
**Exchange Transaction Charges:** NSE charges ~0.0019% of turnover on futures.
**GST:** 18% of (Brokerage + Exchange Charges).
**SEBI Turnover Fees:** 0.0001% of turnover.
**Stamp Duty:** 0.015% on buy-side delivery, 0.002% on futures buy-side.
**Stock Borrowing and Lending (SBL) Charges:** Paid to lenders of stock for short sales, ranging from 1% to 15% annualized depending on liquidity.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_38.md)**

#### 🔸 Arbitrage Feasibility Rule
> **Chapter:** Derivates Futures | **Level:** Advanced Deep Dive

--- 

## 📚 Reference Books & Study Material

- **Options, Futures, and Other Derivatives** by *John C. Hull* — [Visit Resource](https://www.pearson.com)
- **Derivatives and Risk Management** by *Rajiv Srivastava* — [Visit Resource](https://www.oxforduniversitypress.com)
- **NISM Series VIII: Equity Derivatives Certification Workbook** by *National Institute of Securities Markets* — [Visit Resource](https://www.nism.ac.in)
- **SEBI Rules & Circulars on Physical Settlement** by *Securities and Exchange Board of India* — [Visit Resource](https://www.sebi.gov.in)

## 🔬 Advanced Context & Institutional Insights

In deep dive mode, we explore the institutional application and regulatory background of this concept. Under SEBI rules, Indian derivatives are subject to standard margins (SPAN + Exposure) and are tightly regulated to ensure systemic safety.

### Quantitative Modeling & Mathematical Context

> **Model Parameters:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.

The feasibility condition for cash-and-carry arbitrage is $F_0 - S_0 e^{rT} > TC$, where $TC$ represents the total transaction costs (brokerage, STT, margins, clearing fees). For institutional desks, $TC$ is low, allowing them to exploit tiny price discrepancies. If the price difference is smaller than $TC$, the trade is unfeasible. This defines the transaction-cost boundary in asset pricing theory, illustrating that market prices reflect transaction frictions.
**SEBI Coordinated Market-Wide Circuit Breakers:**
**Trigger Points:** 10%, 15%, and 20% movements in Nifty 50 or Sensex.
**Trading Halt Duration:** Depends on the time of the trigger. A 10% move before 1:00 PM halts trading for 45 minutes; a 15% move before 1:00 PM halts trading for 1 hour 45 minutes; a 20% move at any time halts trading for the rest of the day.
**Individual Stock Price Bands:** High-beta derivatives-eligible stocks have no fixed circuit limit but have dynamic price bands (cooling-off periods) starting at 10% to prevent retail manipulation while keeping derivatives functional.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_39.md)**