# Deep Dive: Hedging and Risk Management

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

To construct an effective equity hedge, a portfolio manager must determine the optimal hedge ratio. If the portfolio value is $V_p$ and its beta relative to the index is $\beta_p$, the number of index futures contracts $N$ required to hedge the portfolio is:
$$N = \beta_p \times \frac{V_p}{F \times L}$$
where $F$ is the current futures price and $L$ is the contract lot size. Selling $N$ contracts reduces the portfolio's systematic risk (Beta) to zero. If the manager wants to adjust the portfolio beta from $\beta_p$ to a target beta $\beta^*$, the formula is modified to:
$$N = (\beta^* - \beta_p) \times \frac{V_p}{F \times L}$$

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_30.md)**