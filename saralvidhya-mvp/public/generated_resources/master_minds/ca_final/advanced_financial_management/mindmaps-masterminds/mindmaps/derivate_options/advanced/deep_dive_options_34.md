# Deep Dive: Assumes Continuous Stock Prices (No Jumps)

> **Chapter:** Derivatives Options | **Level:** Advanced Deep Dive

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

**Explanation:** In India, companies release corporate announcements or earnings after market hours. The next morning, a stock might open 8% lower than its previous close without trading at any price in between. BSM's mathematics assumes continuous trading, which fails to account for this gap risk.
**Worked Example:** You write (sell) a Call option on a stock at a ₹500 strike. The stock closes at ₹490. Overnight, a global merger is announced, and the stock opens at ₹560. You are forced to sell at ₹500, suffering a massive gap loss that BSM's continuous formula could not model.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_34.md)**