# Deep Dive: Higher Leverage with Restricted Loss

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

**Explanation:** Option leverage is dynamic and changes with the option's Delta. Leverage is calculated as:
$$\text{Leverage} = \text{Delta} \times \frac{\text{Underlying Price}}{\text{Option Premium}}$$
Because the premium is small, this ratio is high. If the stock moves favorably, the percentage return on investment (ROI) is far higher than holding the stock or future.
**Worked Example:** Stock is at ₹500. Call Option strike ₹500 costs ₹10.
If the stock goes to ₹550 (+10% move): Option value becomes at least ₹50. Your ROI is $\frac{50 - 10}{10} = 400\%$.
If the stock falls to ₹450 (-10% move): Your loss is capped at 100% (₹10), whereas a future trader would lose the full ₹50.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_14.md)**