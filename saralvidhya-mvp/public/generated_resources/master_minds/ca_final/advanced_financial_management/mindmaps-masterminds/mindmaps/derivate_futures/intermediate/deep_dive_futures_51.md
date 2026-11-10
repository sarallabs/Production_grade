# Deep Dive: Rollover of Futures Positions

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

> **Model Parameters:** Roll Return ($R_{roll}$) is defined as: $R_{roll} = \frac{F_{near} - F_{next}}{F_{near}}$. If $F_{next} > F_{near}$ (Contango), rolling long positions incurs a negative yield.

Quantitative strategies evaluate the cost of carry vs. the roll spread. Arbitrage desks exploit deviations in roll spreads from their theoretical carry values by taking positions in the spread market, which has its own order book on the NSE.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_51.md)**