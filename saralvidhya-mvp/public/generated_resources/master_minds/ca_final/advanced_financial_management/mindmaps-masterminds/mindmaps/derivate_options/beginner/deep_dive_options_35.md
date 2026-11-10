# Deep Dive: Assumes No Dividends Until Expiration

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

**Explanation:** Dividends reduce the price of the stock on the ex-dividend date. Since BSM assumes no dividends, it overprices Call options and underprices Put options for stocks that pay dividends during the contract period.
**Worked Example:** A stock trading at ₹300 is going to pay a ₹12 dividend. The stock price will drop to ₹288. If you use standard BSM to price a Call option, you will pay too much because BSM does not know the stock price is guaranteed to drop.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_35.md)**