# Deep Dive: Gamma

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

**Explanation:** Gamma is a second-order derivative ($\Gamma = \frac{\partial^2 V}{\partial S^2}$). It represents the curvature of the option payoff. A high Gamma means Delta is highly volatile and will change quickly when the stock price moves. Option buyers are long Gamma (+), while option sellers are short Gamma (-).
**Worked Example:** An At-the-Money call option has a Delta of 0.50 and a Gamma of 0.02. If the stock price rises by ₹1, the Delta becomes 0.52. If the stock rises by another ₹1, the Delta becomes 0.54. The rate of price gain accelerates for the option buyer.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_23.md)**