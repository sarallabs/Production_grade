# Deep Dive: Theta

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

**Explanation:** Theta ($\Theta = \frac{\partial V}{\partial T}$) represents the decay of the option's extrinsic value. As time ($T$) goes to zero, the probability of the option expiring ITM decreases. Theta decay is non-linear; it accelerates rapidly in the last 30 days and becomes vertical in the final 3-5 days before expiry.
**Worked Example:** You buy a Nifty Call option for a ₹100 premium with a Theta of -₹8. If Nifty trades completely flat for 3 days, your option premium will drop to ₹76 (₹100 - (3 * ₹8)) simply due to time decay.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_24.md)**