# Deep Dive: Pricing Methods

#### 🔸 Contango Market Structure
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

In commodity markets, Contango is defined by the inequality $F_0 > S_0$. This occurs when the cost of carry (interest, storage, insurance) is positive and exceeds any convenience yield. The term structure of futures is:
$$F_0 = S_0 e^{(r + s - c)T}$$
where $r$ is the risk-free rate, $s$ is the physical storage cost, and $c$ is the convenience yield. In a Contango market, the convenience yield $c$ is low relative to storage costs $s$. For financial assets, Contango is the standard state because storage costs are negligible, and the cost of carry is driven by the risk-free rate ($F_0 = S_0 e^{rT}$).

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_40.md)**

#### 🔸 Backwardation Market Structure
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

Backwardation ($F_0 < S_0$) occurs when the convenience yield $c$ is high, satisfying the condition $c > r + s$. The convenience yield represents the economic benefit of holding the physical asset (e.g., preventing refinery shutdown). In times of severe supply shortages, the spot price spikes, while futures prices remain lower because supply is expected to normalize in the future. In financial markets, backwardation can occur in stock futures when a stock is in high demand for short-selling, causing stock borrowing fees to spike, which reduces the synthetic forward price.
### Topic 1.4: Pricing of Futures
#### Sub-Topic 1.4.1: Cost of Carry Model

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_41.md)**

#### 🔸 Cost of Carry Fundamentals
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

The Cost of Carry model assumes that the futures price is the spot price adjusted for the net cost of holding the asset. The general relationship is $F_0 = S_0 + C$. In financial markets, the cost of carry consists of the cost of financing the purchase at the risk-free rate $r$, minus any income generated by the asset (e.g., dividends $d$). If the futures price deviates from this relationship, arbitrageurs execute trades to restore equilibrium, defining the pricing boundary for futures contracts.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_42.md)**

#### 🔸 Simple Interest Formula
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

The linear cost of carry formula is $F = S [1 + r(t/365)]$, where $t$ is the number of days to maturity. This formulation assumes daily simple interest, which is standard in short-term money market instruments. In equity derivatives, while continuous compounding is theoretically preferred, brokers and traders often use simple interest as a quick approximation for near-month contracts due to the short time horizon (less than 30 days).

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_43.md)**

#### 🔸 Continuous Compounding Formula
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

In continuous-time finance, the arbitrage-free relation is $F_0 = S_0 e^{rT}$. If $F_0 > S_0 e^{rT}$, an arbitrageur can borrow $S_0$ at the continuous rate $r$, buy the asset, and short the futures, locking in a risk-free profit of $F_0 - S_0 e^{rT}$ at time $T$. The continuous compounding model is mathematically tractible and integrates with the Black-Scholes-Merton option pricing framework.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_44.md)**

#### 🔸 Adjusting for Dividends Paid Before Expiry
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

Under continuous compounding, if a stock pays a discrete dividend $D_i$ at time $t_i$ (where $t_i < T$), the futures price is:
$$F_0 = (S_0 - D_i e^{-r t_i}) e^{rT}$$
where $D_i e^{-r t_i}$ is the present value of the dividend discounted to the present. The subtraction of the dividend present value from the spot price reflects that the holder of the futures contract does not receive the dividend cash flow, which instead goes to the spot holder. The spot price drops by $D_i$ on the ex-dividend date, and the futures price converges to $S_T$ at maturity.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_45.md)**

#### 🔸 Relevance of Dividend Timing
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

The pricing of futures is determined by replicating cash flows. A dividend distribution only enters the replication equations if the ex-dividend date $t_d$ falls within the contract period: $t_d \in [0, T]$. If $t_d > T$, the long futures position has already settled at $T$ against $S_T$, which does not yet reflect the dividend drop. Therefore, any dividend paid after $T$ is excluded from the pricing equation at time $t=0$, as it has no economic impact on the contract's cash flows.
#### Sub-Topic 1.4.2: Index Futures Pricing

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_46.md)**

#### 🔸 Index Dividends and Dividend Yield
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

For a stock index, modeling discrete dividends is computationally expensive because the components distribute dividends at different times. The index is modeled as an asset that pays a continuous dividend yield $d$. This assumption is standard in the Black-Scholes-Merton option pricing model for indices. The continuous yield represents the average dividend payment rate of the index components, simplifying the replication equations.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_47.md)**

#### 🔸 Index Futures Pricing Formula
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

The index futures price $F_0 = S_0 e^{(r-d)T}$ is derived under risk-neutral valuation. The dividend yield $d$ reduces the cost of carry because holding the physical shares of the index components generates dividend income, which offsets the financing cost $r$. The net financing rate is $r - d$. If the market futures price deviates from this theoretical price, institutional index-arbitrage programs execute trades to exploit the mismatch, buying the component stocks and selling futures (or vice versa).

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_48.md)**

#### 🔸 Net Cost of Carry Definition
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

The Net Cost of Carry $q = r - d$ determines the drift of the futures price process. In a risk-neutral world, the expected growth rate of the spot asset is the risk-free rate $r$. Since the asset pays a continuous dividend yield $d$, the capital gains growth rate of the spot price is $r - d$. The futures price, which pays no dividends, must grow at the rate of the spot asset's capital gains, meaning $F_t = S_t e^{(r-d)(T-t)}$, identifying $r - d$ as the net carrying rate.
#### Sub-Topic 1.4.3: Arbitrage

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_49.md)**