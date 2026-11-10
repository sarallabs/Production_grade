# Deep Dive: Option

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

**Explanation:** Option valuation is governed by the risk-neutral expectation of its payoff. The premium represents the discounted expected value of the option payoff under the risk-neutral measure $\mathbb{Q}$: $V = e^{-rT} \mathbb{E}^\mathbb{Q}[\text{Payoff}(S_T)]$. Because the buyer can walk away, the payoff is asymmetric, introducing positive convexity (long Gamma) to the buyer's portfolio.
**Worked Example:** A market maker prices a Nifty option using the Black-Scholes PDE. The underlying Nifty spot ($S$) is 22,000, strike ($X$) is 22,000, risk-free rate ($r$) is 7%, and implied volatility ($\sigma$) is 15%. The computed option price represents the present value of the expected probability of the index expiring in-the-money.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_1.md)**