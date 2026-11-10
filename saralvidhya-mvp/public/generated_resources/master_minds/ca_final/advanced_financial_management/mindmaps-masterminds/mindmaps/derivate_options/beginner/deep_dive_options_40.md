# Deep Dive: Put Buyer Payoff: Max(X - S, 0)

> **Chapter:** Derivatives Options | **Level:** Beginner Deep Dive

--- 

## 📚 Reference Books & Study Material

- **Options, Futures, and Other Derivatives** by *John C. Hull* — [Visit Resource](https://www.pearson.com)
- **Option Volatility and Pricing** by *Sheldon Natenberg* — [Visit Resource](https://www.mheducation.com)
- **Trading Options Greeks** by *Dan Passarelli* — [Visit Resource](https://www.wiley.com)
- **NISM Series VIII: Equity Derivatives Certification Workbook** by *National Institute of Securities Markets* — [Visit Resource](https://www.nism.ac.in)

## 🔬 Advanced Context & Institutional Insights

In deep dive mode, we explore the institutional application and regulatory background of this concept. Under SEBI rules, Indian derivatives are subject to standard margins (SPAN + Exposure) and are tightly regulated to ensure systemic safety.

### Quantitative Modeling & Mathematical Context

> **Model Parameters:** No specific quantitative model details.

**Explanation:** The payoff formula is $Payoff = \max(X - S, 0)$. S is the closing price of the underlying asset on expiry day, and X is the strike price. The net profit is calculated by subtracting the initial premium ($P$) paid: $Profit = \max(X - S, 0) - P$.
**Worked Example:** You buy a SBI ₹800 Put option for a ₹30 premium.
If SBI closes at ₹720: Payoff is $\max(800 - 720, 0) = \text{₹}80$. Net profit = ₹80 - ₹30 premium = +₹50 per unit.
If SBI closes at ₹830: Payoff is $\max(800 - 830, 0) = 0$. Net profit = 0 - ₹30 = -₹30 (maximum loss).

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_40.md)**