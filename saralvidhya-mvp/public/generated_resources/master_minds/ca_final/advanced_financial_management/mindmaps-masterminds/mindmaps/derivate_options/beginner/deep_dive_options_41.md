# Deep Dive: Seller Payoff: -1 * Buyer Payoff

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

**Explanation:** The seller collects the premium ($P$) upfront. Their net profit is: $Profit = P - \max(S - X, 0)$ (for Calls) or $Profit = P - \max(X - S, 0)$ (for Puts). The seller's maximum profit is $P$, which occurs when the option expires out-of-the-money (payoff = 0).
**Worked Example:** You sell a Call option with a strike of ₹1,000 and collect a ₹40 premium.
If the stock closes at ₹980: The buyer's payoff is 0. Your profit is the full premium collected: +₹40.
If the stock closes at ₹1,100: The buyer's payoff is ₹100. Your loss is: ₹40 premium - ₹100 payoff paid = -₹60.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_41.md)**