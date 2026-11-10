# Deep Dive: Trend & Momentum Methods

#### 🔸 Momentum Trading in Futures
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

> **Model Parameters:** Momentum Signal ($S_t$) can be modeled as: $S_t = \text{sign}(P_t - \text{MA}_t(L))$. Position sizing is scaled by volatility: $Position = \frac{\text{Capital} \times \text{Risk Factor}}{\text{Instrument Volatility} \times \text{Contract Value}}$.

Advanced momentum strategies utilize multi-timeframe analysis and factor-based models. They use futures contracts due to their deep liquidity and ease of short-selling, allowing them to harvest momentum premium in both bull and bear markets.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_53.md)**

#### 🔸 Moving Average Crossovers
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

> **Model Parameters:** Exponential Moving Average formula: $\text{EMA}_t = P_t \times \alpha + \text{EMA}_{t-1} \times (1 - \alpha)$, where smoothing factor $\alpha = \frac{2}{N+1}$. System optimization involves maximizing the Profit Factor and Sharpe Ratio while minimizing Max Drawdown.

Advanced systems apply filters to reduce whipsaws. For example, they may require the crossover to hold for a specific number of bars, or require a minimum ATR filter. Position sizing is managed dynamically using portfolio optimization frameworks.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_54.md)**

#### 🔸 Volatility and Stop Losses in Leverage
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