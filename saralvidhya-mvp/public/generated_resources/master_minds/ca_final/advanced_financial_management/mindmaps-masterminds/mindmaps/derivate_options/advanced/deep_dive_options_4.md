# Deep Dive: Seller (Writer) of Call

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

**Explanation:** Call writers are exposed to "unlimited risk" because there is no upper limit on stock prices. The writer's position has a negative Gamma ($\Gamma < 0$), meaning that as the stock price rises, the position's Delta becomes increasingly negative, compounding losses.
**Worked Example:** You write an naked Call option on Nifty at strike ₹22,000 for a ₹100 premium. If Nifty jumps to ₹23,000 due to an unexpected policy announcement, you must deliver Nifty at ₹22,000. Your loss is ₹900 per unit (₹1,000 market difference - ₹100 premium collected), requiring immediate margin cash to avoid broker liquidation.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_4.md)**