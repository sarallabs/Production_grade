# Deep Dive: Expiry & Rollover Methods

#### 🔸 Expiry Cycle & Last Thursday Rule
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

> **Model Parameters:** At maturity $T$, basis converges to zero: $\lim_{t \to T} (F_t - S_t) = 0$. Volatility smile steepens on expiry day as market makers defend option strikes.

Institutional portfolios face rollover risk—the cost of closing near-month contracts and buying next-month contracts. If the next-month contract trades at a premium (Contango), rolling a long position incurs a cost. If it trades at a discount (Backwardation), rolling yields a positive roll return.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_50.md)**

#### 🔸 Rollover of Futures Positions
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

> **Model Parameters:** Roll Return ($R_{roll}$) is defined as: $R_{roll} = \frac{F_{near} - F_{next}}{F_{near}}$. If $F_{next} > F_{near}$ (Contango), rolling long positions incurs a negative yield.

Quantitative strategies evaluate the cost of carry vs. the roll spread. Arbitrage desks exploit deviations in roll spreads from their theoretical carry values by taking positions in the spread market, which has its own order book on the NSE.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_51.md)**

#### 🔸 Physical vs. Cash Settlement
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

> **Model Parameters:** Payoff matrix: physical settlement incorporates demat transaction costs, custody fees, and short-delivery auction risks.

Physical settlement creates arbitrage opportunities. If futures trade at a discount (Backwardation) near expiry, an arbitrageur can buy futures, sell spot (shorting the stock), and let the contracts go to physical delivery. The shares received from the long futures contract will cover the short stock position.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_futures_52.md)**