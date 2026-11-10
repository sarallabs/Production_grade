# Deep Dive: Arbitrage Execution Rule

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

To execute cash-and-carry arbitrage, the trader borrows funds at rate $r$, buys the stock in the spot market at $S_0$, and sells the futures contract at $F_0$. At maturity $T$, the stock is delivered to settle the futures contract, returning $F_0$ cash. The loan is repaid with $S_0 e^{rT}$, leaving a net profit of $F_0 - S_0 e^{rT}$. For reverse cash-and-carry, the trader short-sells the stock, invests the proceeds at the risk-free rate, and buys the futures, settling the short position at $T$ by buying the stock via the futures contract, locking in a profit of $S_0 e^{rT} - F_0$.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_37.md)**