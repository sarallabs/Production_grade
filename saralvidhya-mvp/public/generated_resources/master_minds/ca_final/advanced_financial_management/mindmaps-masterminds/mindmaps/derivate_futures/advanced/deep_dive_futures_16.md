# Deep Dive: Settlement Mechanisms

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

The terminal payoff of a forward is realized at maturity $T$. If $S_T > K$, the buyer receives $S_T - K$. In futures, because the contract is marked-to-market daily, the buyer has already received the daily increments. The net cash flow of the futures contract from $t=0$ to $T$ is identical to a forward, but the time value of money differs because the cash flows are distributed daily. This daily settlement mechanism alters the pricing of futures relative to forwards when interest rates are stochastic.
#### Sub-Topic 1.1.4: Cash Market vs. Derivatives Market

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_16.md)**