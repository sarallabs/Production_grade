# Deep Dive: Arbitrage Transaction Costs

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

Transaction costs include execution fees, clearing fees, taxes (STT), market impact, and financing costs. In reverse cash-and-carry, the trader must borrow stock, incurring stock borrowing fees ($c_b$). The arbitrage-free boundary is modified to:
$$S_0 e^{(r-c_b)T} \le F_0 \le S_0 e^{rT} + \text{Transaction Costs}$$
If the futures price lies within this band, arbitrageurs cannot make net profits, allowing the pricing mismatch to persist.
**Indian Arbitrage Transaction Costs Breakdown:**
**Brokerage:** Typically flat ₹20 per order or 0.01% - 0.03% of turnover.
**Securities Transaction Tax (STT):** 0.0125% on futures sell side, 0.1% on equity delivery buy/sell sides.
**Exchange Transaction Charges:** NSE charges ~0.0019% of turnover on futures.
**GST:** 18% of (Brokerage + Exchange Charges).
**SEBI Turnover Fees:** 0.0001% of turnover.
**Stamp Duty:** 0.015% on buy-side delivery, 0.002% on futures buy-side.
**Stock Borrowing and Lending (SBL) Charges:** Paid to lenders of stock for short sales, ranging from 1% to 15% annualized depending on liquidity.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_38.md)**