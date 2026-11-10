# Deep Dive: Call Option

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

**Explanation:** Under the Black-Scholes framework, the price of a European Call option ($c$) is:
$$c = S_0 N(d_1) - X e^{-rT} N(d_2)$$
where $N(d_1)$ represents the delta of the call option (and the replicating stock position), and $N(d_2)$ represents the risk-neutral probability that the option will expire in-the-money.
**Worked Example:** For a stock at ₹1,000, a ₹1,000 strike Call with $d_1 = 0.15$ and $d_2 = 0.05$ has a Delta of $N(d_1) \approx 0.56$. If the stock jumps by ₹10, the call premium rises by approximately ₹5.60, while the probability of expiring ITM ($N(d_2) \approx 0.52$) increases.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_2.md)**