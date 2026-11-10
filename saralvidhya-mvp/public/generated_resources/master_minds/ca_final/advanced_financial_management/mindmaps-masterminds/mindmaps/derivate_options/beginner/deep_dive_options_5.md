# Deep Dive: Seller (Writer) of Put

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

**Explanation:** While the risk of a put writer is technically capped (since stock prices cannot drop below zero), it is practically very high. If the stock crashes, the writer must purchase the asset at a strike price higher than its current market value. To manage this risk, institutional put writers use strict margin monitoring and delta-hedging strategies.
**Worked Example:** You write a Put option on Tata Steel at strike ₹150 for a ₹5 premium. If the stock crashes to ₹100, the buyer exercises the option. You must buy the stock at ₹150. Your net cost basis is ₹145, resulting in an unrealized loss of ₹45 per share on a stock currently trading at ₹100.
---
#### Sub-Topic 2.1.2: Exercise Styles

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_5.md)**