# Deep Dive: Margin Mechanics

#### 🔸 Initial Margin and VaR
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

> **Model Parameters:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.

The Initial Margin is designed to protect the clearinghouse from participant default. In India, SEBI mandates that the initial margin must cover a 99% Value-at-Risk (VaR) over a one-day horizon. For volatile stocks, the VaR margin is higher, supplemented by an Exposure Margin (typically 3.5% for index contracts and 5% or more for stock contracts). The total margin requirement is:
$$\text{Total Margin} = \text{SPAN Margin} + \text{Exposure Margin}$$
SPAN uses grid pricing algorithms to evaluate portfolio risk across multiple price and volatility scenarios, determining the minimum capital buffer required.
**SPAN Margin Methodology:**
**SPAN (Standardized Portfolio Analysis of Risk)** was developed by the Chicago Mercantile Exchange (CME) and is used by NSE clearing houses.
It evaluates the risk of a portfolio by calculating the worst-case loss across **16 risk scenarios** combining price scans (typically +/- 3 standard deviations) and volatility scans (volatility shifts up or down).
The SPAN margin is supplemented by an **Exposure Margin** (usually 3.5% for indices and 5% or more for stock futures) to cover risks not captured by SPAN (such as intraday price jumps or extreme event risks).

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_24.md)**

#### 🔸 Maintenance Margin
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

> **Model Parameters:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.

The Maintenance Margin is the minimum collateral level required to sustain an open position. If the equity in the margin account, $E_t = \text{Initial Margin} \pm \sum \text{Daily MTM}_t$, falls below the Maintenance Margin $M_m$:
$$E_t < M_m$$
The client is issued a margin call. Under US and international exchange guidelines, the client must deposit Variation Margin to restore the account balance back to the Initial Margin level. In India, SEBI requires that the margin account must be maintained at the full SPAN + Exposure level daily, meaning any shortfall must be cleared before the next trading day.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_25.md)**

#### 🔸 Variation Margin Calls
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

> **Model Parameters:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.

Variation Margin is the cash flow that settles daily mark-to-market changes. Under standard exchange rules, when a margin call is triggered, the client must deposit Variation Margin to restore the account to the Initial Margin level. In institutional clearing, variation margin is paid daily (and sometimes intra-day during high volatility) to clear default risk. Failure to post variation margin by the specified cutoff time (typically before market open on $T+1$) constitutes a default, prompting the clearing broker to liquidate the client's positions.
#### Sub-Topic 1.3.2: Marking to Market (MTM)

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_26.md)**