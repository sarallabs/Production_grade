# Deep Dive: Assumes Constant Risk-Free Rate and Volatility

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

**Explanation:** Volatility is dynamic. When markets fall, volatility typically spikes, changing the pricing environment. Since BSM assumes constant volatility, it must be continuously fed with updated Implied Volatility (IV) estimates to remain useful.
**Worked Example:** During a geopolitical conflict, the Nifty VIX (volatility index) jumps from 14% to 25% in one day. Options prices shoot up. A trader using a static BSM model with 14% volatility will significantly underprice the options.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_33.md)**