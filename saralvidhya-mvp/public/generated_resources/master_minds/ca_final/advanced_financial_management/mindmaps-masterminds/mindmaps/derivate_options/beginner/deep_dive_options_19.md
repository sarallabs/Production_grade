# Deep Dive: Time to Expiry (T)

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

**Explanation:** Time value represents the probability that the option will expire in-the-money. The mathematical decay of time value is denoted by Theta ($\Theta = \frac{\partial V}{\partial T}$). The decay curve is relatively flat with 90 days left, but turns into a steep downward cliff in the final 30 days, especially the last 7 days.
**Worked Example:** You buy an At-the-Money Nifty option with 30 days left. Daily decay (Theta) is ₹3. With 3 days left, if Nifty remains at the exact same spot, the Theta decay accelerates to ₹25 per day, wiping out the option value rapidly.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_19.md)**