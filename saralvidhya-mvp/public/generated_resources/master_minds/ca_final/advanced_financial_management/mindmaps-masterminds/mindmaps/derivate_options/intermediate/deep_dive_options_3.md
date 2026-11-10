# Deep Dive: Put Option

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

**Explanation:** Under the Black-Scholes framework, the price of a European Put option ($p$) is:
$$p = X e^{-rT} N(-d_2) - S_0 N(-d_1)$$
where $N(-d_1) = 1 - N(d_1)$ represents the absolute short stock exposure needed to delta-hedge the put option, and $N(-d_2)$ represents the risk-neutral probability that the put will expire in-the-money.
**Worked Example:** A fund manager holds ₹10 Crore worth of stock and buys At-the-Money Put options with a Delta of -0.50. This creates a partial hedge. If the market crashes by 5%, the put options gain value, offsetting the equity portfolio losses, while the Put Delta shifts toward -1.00 (becoming a 100% hedge).

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_3.md)**