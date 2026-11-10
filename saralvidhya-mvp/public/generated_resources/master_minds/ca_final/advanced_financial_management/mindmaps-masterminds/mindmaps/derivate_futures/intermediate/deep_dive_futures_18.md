# Deep Dive: Minimum Transaction Quantities

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

Standardized lot sizes in derivatives markets serve to concentrate liquidity and simplify clearing operations. By grouping transactions into large, uniform blocks (e.g., lot size of 25 for Nifty, 15 for Bank Nifty), the exchange reduces clearing complexity and transaction processing costs. However, this creates a lumpiness in risk management. An investor cannot hedge a portfolio of ₹5,00,000 with precision if the Nifty contract value is ₹5,50,000. They must round their hedge to the nearest integer number of contracts, introducing residual tracking error.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_18.md)**