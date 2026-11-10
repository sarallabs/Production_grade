# Deep Dive: Counterparty Credit Risk

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

The mitigation of counterparty credit risk in futures is achieved through Central Counterparty (CCP) clearing. Through contract novation, the CCP becomes the buyer to every seller and the seller to every buyer, eliminating bilateral credit risk. The CCP manages its residual risk through a multi-layered waterfall: initial margins, variation margins, member default insurance, and the CCP's own capital. In OTC forwards, counterparty risk is bilateral and requires credit risk modeling, credit valuation adjustments (CVA), and credit risk mitigation techniques such as netting agreements.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_15.md)**