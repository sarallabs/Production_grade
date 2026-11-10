# Deep Dive: Call Buyer Payoff: Max(S - X, 0)

> **Chapter:** Derivatives Options | **Level:** Intermediate Deep Dive

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

**Explanation:** The payoff formula is $Payoff = \max(S - X, 0)$. S is the closing price of the underlying asset on expiry day, and X is the strike price. The net profit is calculated by subtracting the initial premium ($P$) paid: $Profit = \max(S - X, 0) - P$.
**Worked Example:** You buy a Nifty ₹22,000 Call option for a ₹150 premium.
If Nifty closes at ₹22,400: Payoff is $\max(22,400 - 22,000, 0) = \text{₹}400$. Net profit = ₹400 - ₹150 premium = +₹250 per unit.
If Nifty closes at ₹21,800: Payoff is $\max(21,800 - 22,000, 0) = 0$. Net profit = 0 - ₹150 = -₹150 (maximum loss).

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_39.md)**