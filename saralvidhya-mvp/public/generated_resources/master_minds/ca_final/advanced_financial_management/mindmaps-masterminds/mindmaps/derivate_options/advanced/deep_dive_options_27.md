# Deep Dive: No Dividends During Option Life

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

**Explanation:** When a stock goes ex-dividend, its price drops by the amount of the dividend. This drop reduces Call premiums and increases Put premiums. BSM assumes no dividends are paid, which leads to mispricing if applied to dividend-paying stocks.
**Worked Example:** ITC trades at ₹400 and will pay a ₹10 dividend in 2 weeks. The stock price will drop to ₹390. Standard BSM will overprice Calls on ITC because it expects the stock to stay near ₹400. To correct this, the Black-Scholes model must be adjusted to subtract the present value of the dividend from the stock price.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_27.md)**