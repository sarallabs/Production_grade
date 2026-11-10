# Deep Dive: MTM (Mark-to-Market)

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

**Explanation:** Under SEBI risk management rules, futures positions are marked-to-market daily at the closing price, and cash is debited or credited. Option buyers pay the premium upfront, and their maximum loss is capped, so they face no MTM cash calls. Option sellers must maintain margin and face MTM calls because their risk is uncapped.
**Worked Example:** A proprietary trading desk buys 10 lots of Nifty Futures. If Nifty drops 200 points in a day, the desk must settle a ₹50,000 cash debit by the next morning. If they had bought 10 lots of Nifty Calls instead, they would face zero MTM cash debits, even if the option premium dropped significantly on paper.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_10.md)**