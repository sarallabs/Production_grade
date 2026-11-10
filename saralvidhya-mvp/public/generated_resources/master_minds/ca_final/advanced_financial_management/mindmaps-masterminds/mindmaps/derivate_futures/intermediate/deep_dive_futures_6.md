# Deep Dive: Daily Marking and Maturity Settle

> **Chapter:** Derivates Futures | **Level:** Intermediate Deep Dive

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

In an exchange-traded futures contract, the daily settlement process effectively terminates the existing contract and opens a new one at the current settlement price. The margin account is adjusted daily. This turns a long-term credit exposure into a series of daily cash flows, minimizing counterparty risk. At maturity $T$, the final contract settlement is conducted relative to the spot price of the underlying, which can be cash-settled or physically settled depending on SEBI guidelines for Indian equities.
#### Sub-Topic 1.1.2: Users of Derivatives

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_6.md)**