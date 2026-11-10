# Deep Dive: Call Breakeven: Strike Price + Premium

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

**Explanation:** For a long Call option, the net profit formula becomes positive only when the stock price $S$ exceeds the breakeven point ($S_{BE} = X + P$). Any price below $S_{BE}$ but above $X$ results in a partial loss (recovery of some premium). Any price below $X$ results in a maximum loss of the premium.
**Worked Example:** You buy a Tata Motors ₹900 Call option for a ₹40 premium.
Your Breakeven point is ₹900 + ₹40 = ₹940.
If Tata Motors closes at ₹920: Payoff is ₹20. Net loss is ₹20 - ₹40 = -₹20.
If Tata Motors closes at ₹960: Payoff is ₹60. Net profit is ₹60 - ₹40 = +₹20.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_42.md)**