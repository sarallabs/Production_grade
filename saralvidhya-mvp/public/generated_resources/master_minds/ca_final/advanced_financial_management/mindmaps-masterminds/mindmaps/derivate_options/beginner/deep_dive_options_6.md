# Deep Dive: American Option

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

**Explanation:** The pricing of American options requires solving a free boundary problem because the optimal exercise boundary ($S^*(t)$) is unknown and must be calculated dynamically. Early exercise of an American Call is only optimal on dividend-paying stocks immediately prior to the ex-dividend date, or when the stock is deep in-the-money and interest rates are exceptionally high.
**Worked Example:** A trader holds an American Call option on a stock trading at ₹1,200 with a strike of ₹800. The stock is paying a ₹50 dividend tomorrow. If the trader does not exercise today, the stock price will drop to ₹1,150 tomorrow, destroying option value. The trader exercises the option today to acquire the shares and capture the ₹50 dividend.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_6.md)**