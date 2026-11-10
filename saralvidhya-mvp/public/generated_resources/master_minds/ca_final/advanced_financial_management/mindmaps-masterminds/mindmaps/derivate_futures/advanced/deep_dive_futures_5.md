# Deep Dive: Dependency of Value

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

Mathematically, the price of a derivative is the discounted expected value of its future payoff under the risk-neutral measure $\mathbb{Q}$:
$$f_t = e^{-r(T-t)} \mathbb{E}^\mathbb{Q} [g(S_T) \mid \mathcal{F}_t]$$
where $g(S_T)$ is the payoff function and $\mathcal{F}_t$ is the filtration representing all market information up to time $t$. If the underlying stock ceases to trade or is delisted (i.e., its state space collapses), the filtration $\mathcal{F}_t$ loses its defining variable. The derivative has no payoff vector of its own, meaning it cannot exist without the underlying's probability space.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_5.md)**