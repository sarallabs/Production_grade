# Deep Dive: Arbitrage Feasibility Rule

> **Chapter:** Derivates Futures | **Level:** Beginner Deep Dive

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