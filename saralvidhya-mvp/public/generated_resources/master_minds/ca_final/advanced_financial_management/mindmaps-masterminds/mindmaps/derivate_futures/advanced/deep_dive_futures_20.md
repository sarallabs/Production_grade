# Deep Dive: Holding Periods

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

The finite life of derivatives contracts affects their valuation and risk management. As time passes, options contracts experience time decay (Theta, $\theta = \partial f/\partial t$), which accelerates as the expiry date approaches. Futures contracts do not experience time decay, but their prices converge to the spot price at maturity ($F_T = S_T$), eliminating the basis. Portfolio managers must manage rollover risk, which is the risk that the price difference between the expiring contract and the next contract (the rollover spread) changes unfavorably during the rollover window.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_20.md)**