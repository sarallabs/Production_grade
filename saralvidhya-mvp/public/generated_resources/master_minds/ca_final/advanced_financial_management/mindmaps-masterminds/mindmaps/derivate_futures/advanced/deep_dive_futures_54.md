# Deep Dive: Moving Average Crossovers

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

> **Model Parameters:** Exponential Moving Average formula: $\text{EMA}_t = P_t \times \alpha + \text{EMA}_{t-1} \times (1 - \alpha)$, where smoothing factor $\alpha = \frac{2}{N+1}$. System optimization involves maximizing the Profit Factor and Sharpe Ratio while minimizing Max Drawdown.

Advanced systems apply filters to reduce whipsaws. For example, they may require the crossover to hold for a specific number of bars, or require a minimum ATR filter. Position sizing is managed dynamically using portfolio optimization frameworks.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_54.md)**