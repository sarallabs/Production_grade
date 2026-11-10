# Deep Dive: Daily Settlement & MTM

#### 🔸 Daily Mark-to-Market Process
> **Chapter:** Derivates Futures | **Level:** Intermediate Deep Dive

--- 

## 📚 Reference Books & Study Material

- **Options, Futures, and Other Derivatives** by *John C. Hull* — [Visit Resource](https://www.pearson.com)
- **Derivatives and Risk Management** by *Rajiv Srivastava* — [Visit Resource](https://www.oxforduniversitypress.com)
- **NISM Series VIII: Equity Derivatives Certification Workbook** by *National Institute of Securities Markets* — [Visit Resource](https://www.nism.ac.in)
- **SEBI Rules & Circulars on Physical Settlement** by *Securities and Exchange Board of India* — [Visit Resource](https://www.sebi.gov.in)

## 🔬 Advanced Context & Institutional Insights

In deep dive mode, we explore the institutional application and regulatory background of this concept. Under SEBI rules, Indian derivatives are subject to standard margins (SPAN + Exposure) and are tightly regulated to ensure systemic safety.

### Quantitative Modeling & Mathematical Context

> **Model Parameters:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.

MTM is the clearinghouse's primary risk mitigation tool. By revaluing positions daily to the settlement price, the clearinghouse prevents the accumulation of large, uncollateralized losses. The daily cash flow adjustment is:
$$\text{MTM}_t = (F_t - F_{t-1}) \times \text{Lot Size} \times N$$
where $F_t$ is the day $t$ closing settlement price and $N$ is the number of contracts. This daily cash settlement changes the pricing dynamics of futures compared to forwards, as the daily cash flows are subject to reinvestment at the short-term risk-free rate, introducing interest rate risk to futures pricing models.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_27.md)**

#### 🔸 Zero Sum Game
> **Chapter:** Derivates Futures | **Level:** Intermediate Deep Dive

--- 

## 📚 Reference Books & Study Material

- **Options, Futures, and Other Derivatives** by *John C. Hull* — [Visit Resource](https://www.pearson.com)
- **Derivatives and Risk Management** by *Rajiv Srivastava* — [Visit Resource](https://www.oxforduniversitypress.com)
- **NISM Series VIII: Equity Derivatives Certification Workbook** by *National Institute of Securities Markets* — [Visit Resource](https://www.nism.ac.in)
- **SEBI Rules & Circulars on Physical Settlement** by *Securities and Exchange Board of India* — [Visit Resource](https://www.sebi.gov.in)

## 🔬 Advanced Context & Institutional Insights

In deep dive mode, we explore the institutional application and regulatory background of this concept. Under SEBI rules, Indian derivatives are subject to standard margins (SPAN + Exposure) and are tightly regulated to ensure systemic safety.

### Quantitative Modeling & Mathematical Context

> **Model Parameters:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.

Mathematically, the derivatives market represents a zero-sum game because the net payoff vector is zero at all times:
$$\sum_{i=1}^{M} \Pi_i(S_T) = 0$$
where $\Pi_i$ is the payoff of participant $i$ and $M$ is the total number of participants. While the spot equity market grows over time as corporate profits increase, derivatives only partition and trade that risk. They facilitate risk transfer (e.g., from hedgers to speculators), which can improve economic welfare even though the net trading payoff remains zero.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_28.md)**

#### 🔸 Preventing Loss Accumulation
> **Chapter:** Derivates Futures | **Level:** Intermediate Deep Dive

--- 

## 📚 Reference Books & Study Material

- **Options, Futures, and Other Derivatives** by *John C. Hull* — [Visit Resource](https://www.pearson.com)
- **Derivatives and Risk Management** by *Rajiv Srivastava* — [Visit Resource](https://www.oxforduniversitypress.com)
- **NISM Series VIII: Equity Derivatives Certification Workbook** by *National Institute of Securities Markets* — [Visit Resource](https://www.nism.ac.in)
- **SEBI Rules & Circulars on Physical Settlement** by *Securities and Exchange Board of India* — [Visit Resource](https://www.sebi.gov.in)

## 🔬 Advanced Context & Institutional Insights

In deep dive mode, we explore the institutional application and regulatory background of this concept. Under SEBI rules, Indian derivatives are subject to standard margins (SPAN + Exposure) and are tightly regulated to ensure systemic safety.

### Quantitative Modeling & Mathematical Context

> **Model Parameters:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.

By revaluing the futures contract daily, the exchange ensures that the maximum default exposure is limited to a single day's price movement. This prevents the accumulation of systemic credit risk. The margin collateral (SPAN + Exposure) is calibrated to cover this one-day price volatility with 99% confidence. If a trader fails to meet a margin call, the position is liquidated, preventing the loss from exceeding the posted margin and protecting the clearing corporation from default contagion.
#### Sub-Topic 1.3.3: Contango & Backwardation

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_29.md)**