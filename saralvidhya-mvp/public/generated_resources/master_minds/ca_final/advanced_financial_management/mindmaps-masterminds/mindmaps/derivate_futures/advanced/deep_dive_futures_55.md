# Deep Dive: Volatility and Stop Losses in Leverage

> **Chapter:** Derivates Futures | **Level:** Advanced Deep Dive

--- 

## 📚 Reference Books & Study Material

- **Options, Futures, and Other Derivatives** by *John C. Hull* — [Visit Resource](https://www.pearson.com)
- **Derivatives and Risk Management** by *Rajiv Srivastava* — [Visit Resource](https://www.oxforduniversitypress.com)
- **NISM Series VIII: Equity Derivatives Certification Workbook** by *National Institute of Securities Markets* — [Visit Resource](https://www.nism.ac.in)
- **SEBI Rules & Circulars on Physical Settlement** by *Securities and Exchange Board of India* — [Visit Resource](https://www.sebi.gov.in)

## 🔬 Advanced Context & Institutional Insights

In deep dive mode, we explore the institutional application and regulatory background of this concept. Under SEBI rules, Indian derivatives are subject to standard margins (SPAN + Exposure) and are tightly regulated to ensure systemic safety.

### Quantitative Modeling & Mathematical Context

> **Model Parameters:** Average True Range recursive formula: $\text{TR}_t = \max(|H_t - L_t|, |H_t - C_{t-1}|, |L_t - C_{t-1}|)$, and $\text{ATR}_t = \frac{\text{ATR}_{t-1} \times 13 + \text{TR}_t}{14}$. Capital allocation: $\text{Position Size} = $\frac{\text{Capital} \times \text{Risk\%}}{\text{Stop-Loss Distance}}$.

In extreme market conditions (like SEBI circuit breaker limits or gap-down openings), a stop-loss order may not execute at the exact trigger price. Systematic funds run Monte Carlo simulations to model gap risk and adjust their portfolio leverage limits accordingly.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_55.md)**