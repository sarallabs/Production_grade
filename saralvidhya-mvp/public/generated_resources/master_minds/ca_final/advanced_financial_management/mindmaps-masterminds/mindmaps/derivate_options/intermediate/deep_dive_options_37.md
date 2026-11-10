# Deep Dive: Overvalues Deep OTM Calls / Undervalues Deep ITM Calls

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

**Explanation:** Because BSM uses a normal distribution of returns, it underestimates the probability of extreme market events. Real markets show a "volatility smile," where deep OTM and deep ITM options trade at higher implied volatilities than ATM options to compensate for this tail-risk.
**Worked Example:** For a stock trading at ₹1,000, a Call option with a strike of ₹1,200 (OTM) should theoretically be worth ₹0.05 according to BSM. In reality, due to speculative demand and tail-risk hedging on the NSE, it trades at ₹2.00. BSM significantly undervalued the option.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_37.md)**