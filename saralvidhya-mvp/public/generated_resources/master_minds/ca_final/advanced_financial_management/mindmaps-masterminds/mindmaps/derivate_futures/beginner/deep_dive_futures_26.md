# Deep Dive: Variation Margin Calls

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

Variation Margin is the cash flow that settles daily mark-to-market changes. Under standard exchange rules, when a margin call is triggered, the client must deposit Variation Margin to restore the account to the Initial Margin level. In institutional clearing, variation margin is paid daily (and sometimes intra-day during high volatility) to clear default risk. Failure to post variation margin by the specified cutoff time (typically before market open on $T+1$) constitutes a default, prompting the clearing broker to liquidate the client's positions.
#### Sub-Topic 1.3.2: Marking to Market (MTM)

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_26.md)**