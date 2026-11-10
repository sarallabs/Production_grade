# Deep Dive: Impact

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

**Explanation:** Convexity is the second derivative of the option price with respect to the stock price ($\frac{\partial^2 V}{\partial S^2} = \Gamma$). Option buyers have positive Gamma ($\Gamma > 0$), meaning their Delta increases as the price moves in their favor, and decreases as it moves against them. Futures have zero Gamma.
**Worked Example:** If you are long a stock future and the stock rises by 10%, you gain 10%. If it falls 10%, you lose 10%. If you are long an At-the-Money Call option, a 10% rise can yield a 300% return on premium, while a 10% fall results in a capped 100% loss of premium.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_options_9.md)**