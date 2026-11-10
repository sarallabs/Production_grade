# Deep Dive: Dividend Entitlements

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

The treatment of dividends in derivatives pricing is a key factor in valuation. Since derivative holders do not receive dividends, the futures price is discounted by the expected dividend yield. The pricing equation for index futures is $F = S e^{(r-d)T}$, where $d$ is the continuous dividend yield of the index. If a company announces an extraordinary dividend (typically more than 2% of the market price), SEBI guidelines require an adjustment to the strike price and lot size of the option contracts to ensure the economic value of the contract remains unchanged.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_21.md)**