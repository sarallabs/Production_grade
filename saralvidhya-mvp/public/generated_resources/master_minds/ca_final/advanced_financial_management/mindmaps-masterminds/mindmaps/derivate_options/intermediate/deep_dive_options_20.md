# Deep Dive: Volatility (σ)

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

**Explanation:** Implied Volatility (IV) is the volatility value that, when plugged into the BSM formula, matches the current market price of the option. It represents market uncertainty. When IV rises, both calls and puts gain value because of Vega ($\nu = \frac{\partial V}{\partial \sigma}$).
**Worked Example:** A stock trades at ₹1,000. An ATM Call premium is ₹40. Suddenly, the CEO resigns. While the stock price remains at ₹1,000, market panic causes Implied Volatility to jump from 15% to 35%. The option premium shoots up to ₹75 due to this volatility surge.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_20.md)**