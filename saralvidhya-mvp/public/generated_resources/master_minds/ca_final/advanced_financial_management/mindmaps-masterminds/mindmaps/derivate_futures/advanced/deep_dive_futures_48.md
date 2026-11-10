# Deep Dive: Index Futures Pricing Formula

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

The index futures price $F_0 = S_0 e^{(r-d)T}$ is derived under risk-neutral valuation. The dividend yield $d$ reduces the cost of carry because holding the physical shares of the index components generates dividend income, which offsets the financing cost $r$. The net financing rate is $r - d$. If the market futures price deviates from this theoretical price, institutional index-arbitrage programs execute trades to exploit the mismatch, buying the component stocks and selling futures (or vice versa).

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_48.md)**