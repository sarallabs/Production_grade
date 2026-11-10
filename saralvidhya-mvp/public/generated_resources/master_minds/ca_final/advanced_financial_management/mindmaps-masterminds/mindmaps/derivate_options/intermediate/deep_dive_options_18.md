# Deep Dive: Strike Price (X)

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

**Explanation:**
Call Option: ITM if $S > X$; ATM if $S \approx X$; OTM if $S < X$.
Put Option: ITM if $S < X$; ATM if $S \approx X$; OTM if $S > X$.
Higher strike prices reduce Call values and increase Put values.
**Worked Example:** Nifty is at 22,100.
22,000 CE is ITM (has ₹100 intrinsic value, premium is high, e.g., ₹220).
22,100 CE is ATM (has ₹0 intrinsic value, premium is moderate, e.g., ₹130).
22,200 CE is OTM (has ₹0 intrinsic value, premium is low, e.g., ₹60).

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_18.md)**