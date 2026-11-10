# Deep Dive: Misprices Options on High-Dividend Stocks

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

**Explanation:** High-dividend-paying stocks drop in value repeatedly throughout the year. If the dividend payout is not subtracted from the stock price in the formula, the call options will be overpriced and put options will be underpriced.
**Worked Example:** Coal India trades at ₹450 and pays a ₹25 dividend. Standard BSM will show the ₹450 Call option is worth ₹35. In reality, because the stock drops to ₹425 ex-dividend, the call is only worth ₹15. The model overpriced the option by 133%.
---
### Topic 2.6: Payoffs
#### Sub-Topic 2.6.1: Formulas

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_38.md)**