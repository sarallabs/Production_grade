# Deep Dive: Loss Visibility

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

**Explanation:** The maximum loss of a long option is mathematically capped: $\text{Max Loss} = \text{Premium Paid}$. Futures carry tail risk because overnight news can cause the market to gap down below a trader's stop-loss order, resulting in large execution slippage.
**Worked Example:** A trader holds Nifty futures overnight. An international crisis causes Nifty to open 4% down the next morning. The trader's stop-loss is bypassed, and they lose ₹22,000 per lot. If they had bought a Call option instead, their loss would be strictly capped at the premium paid (e.g., ₹4,000).
---
### Topic 2.2: Advantages of Options
#### Sub-Topic 2.2.1: Key Benefits

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_12.md)**