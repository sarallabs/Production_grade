# Deep Dive: Vega

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

**Explanation:** Vega ($\nu = \frac{\partial V}{\partial \sigma}$) is highest for At-the-Money options and declines to zero for deep ITM and OTM options. High Vega options are sensitive to changes in market sentiment, making them risky to hold during major news events.
**Worked Example:** You buy a Call option on Reliance for ₹80. The Implied Volatility is 20%, and the Vega is 5. If a geopolitical event causes market panic and IV jumps to 24% (+4% change), the option premium will rise by ₹20 (4 * 5) to ₹100, even if the stock price remains unchanged.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_25.md)**