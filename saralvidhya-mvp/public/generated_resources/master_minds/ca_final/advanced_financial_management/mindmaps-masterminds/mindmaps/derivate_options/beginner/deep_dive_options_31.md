# Deep Dive: Constant Known Interest Rates

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

**Explanation:** Risk-free interest rates (like the yields on Indian Government Treasury bills) change daily based on economic data and RBI policy decisions. BSM assumes a single, unchanging rate ($r$), which introduces pricing errors for long-dated option contracts.
**Worked Example:** You buy an option expiring in 12 months. Three months later, inflation jumps and the RBI raises interest rates by 1.5%. The option's actual value will shift, but the basic BSM price (which assumed a constant rate) will be inaccurate.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_31.md)**