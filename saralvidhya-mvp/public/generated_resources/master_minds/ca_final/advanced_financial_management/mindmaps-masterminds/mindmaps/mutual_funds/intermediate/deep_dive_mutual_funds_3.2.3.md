# Deep Dive: Debt & Other Funds

#### 🔸 Bond Funds
> **Chapter:** Mutual Funds | **Level:** Intermediate Deep Dive

--- 

## 📚 Reference Books & Study Material

- **NISM Series V-A: Mutual Fund Distributors Certification Workbook** by *National Institute of Securities Markets* — [Visit Resource](https://www.nism.ac.in)
- **Mutual Funds: A Practitioner's Guide** by *SEBI / AMFI guidelines* — [Visit Resource](https://www.amfiindia.com)
- **Modern Investment Management: An Equilibrium Approach** by *Bob Litterman* — [Visit Resource](https://www.wiley.com)
- **SEBI (Mutual Funds) Regulations, 1996** by *Securities and Exchange Board of India* — [Visit Resource](https://www.sebi.gov.in)

## 🔬 Advanced Context & Institutional Insights

In deep dive mode, we explore the institutional application and regulatory background of this concept. Under SEBI rules, Indian derivatives are subject to standard margins (SPAN + Exposure) and are tightly regulated to ensure systemic safety.

### Quantitative Modeling & Mathematical Context

> **Model Parameters:** No specific quantitative model details.

**Macaulay Duration ($D_{mac}$):** The weighted average time to receive all cash flows from a bond:
$$D_{mac} = \frac{\sum_{t=1}^n \frac{t \cdot C_t}{(1+y)^t}}{\text{Bond Price}}$$
Where $C_t$ is the cash flow at time $t$, and $y$ is the yield to maturity.
**Modified Duration ($D_{mod}$):** Measures price sensitivity to interest rate changes:
$$D_{mod} = \frac{D_{mac}}{1 + \frac{y}{m}}$$
$$\frac{\Delta P}{P} \approx -D_{mod} \cdot \Delta y$$
**Tax Regulation (Section 50AA - April 2023):** Debt mutual funds (with $\le 35\%$ equity exposure) no longer receive indexation benefits or long-term capital gains tax rates (formerly 20% with indexation). All gains, regardless of holding period, are classified as short-term capital gains and taxed at the investor's marginal slab rate.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_mutual_funds_17.md)**

#### 🔸 Gilt Funds
> **Chapter:** Mutual Funds | **Level:** Intermediate Deep Dive

--- 

## 📚 Reference Books & Study Material

- **NISM Series V-A: Mutual Fund Distributors Certification Workbook** by *National Institute of Securities Markets* — [Visit Resource](https://www.nism.ac.in)
- **Mutual Funds: A Practitioner's Guide** by *SEBI / AMFI guidelines* — [Visit Resource](https://www.amfiindia.com)
- **Modern Investment Management: An Equilibrium Approach** by *Bob Litterman* — [Visit Resource](https://www.wiley.com)
- **SEBI (Mutual Funds) Regulations, 1996** by *Securities and Exchange Board of India* — [Visit Resource](https://www.sebi.gov.in)

## 🔬 Advanced Context & Institutional Insights

In deep dive mode, we explore the institutional application and regulatory background of this concept. Under SEBI rules, Indian derivatives are subject to standard margins (SPAN + Exposure) and are tightly regulated to ensure systemic safety.

### Quantitative Modeling & Mathematical Context

> **Model Parameters:** No specific quantitative model details.

Gilt funds focus on maturity profiles ranging from 3 to 15+ years. Because they have no credit risk, their volatility is purely driven by interest rate movements (duration risk). If a Gilt fund has a Macaulay duration of 8 years and the yield curve shifts upward by 100 bps, the fund's NAV will fall by approximately 8%. Managers use interest rate swaps (IRS) to hedge duration risk or take tactical bets on the direction of RBI repo rate cuts/hikes.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_mutual_funds_18.md)**

#### 🔸 Money Market Funds
> **Chapter:** Mutual Funds | **Level:** Intermediate Deep Dive

--- 

## 📚 Reference Books & Study Material

- **NISM Series V-A: Mutual Fund Distributors Certification Workbook** by *National Institute of Securities Markets* — [Visit Resource](https://www.nism.ac.in)
- **Mutual Funds: A Practitioner's Guide** by *SEBI / AMFI guidelines* — [Visit Resource](https://www.amfiindia.com)
- **Modern Investment Management: An Equilibrium Approach** by *Bob Litterman* — [Visit Resource](https://www.wiley.com)
- **SEBI (Mutual Funds) Regulations, 1996** by *Securities and Exchange Board of India* — [Visit Resource](https://www.sebi.gov.in)

## 🔬 Advanced Context & Institutional Insights

In deep dive mode, we explore the institutional application and regulatory background of this concept. Under SEBI rules, Indian derivatives are subject to standard margins (SPAN + Exposure) and are tightly regulated to ensure systemic safety.

### Quantitative Modeling & Mathematical Context

> **Model Parameters:** No specific quantitative model details.

These funds invest in Commercial Paper (CP), Certificates of Deposit (CD), Treasury Bills, and Tri-party Repo (TREPS) maturing in $\le 365$ days. Because maturity is short, modified duration is low ($D_{mod} < 1$). The fund's return is driven by accrual income (coupon yields). It is highly liquid and exhibits minimal NAV volatility.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_mutual_funds_19.md)**

#### 🔸 Capital Protection Funds
> **Chapter:** Mutual Funds | **Level:** Intermediate Deep Dive

--- 

## 📚 Reference Books & Study Material

- **NISM Series V-A: Mutual Fund Distributors Certification Workbook** by *National Institute of Securities Markets* — [Visit Resource](https://www.nism.ac.in)
- **Mutual Funds: A Practitioner's Guide** by *SEBI / AMFI guidelines* — [Visit Resource](https://www.amfiindia.com)
- **Modern Investment Management: An Equilibrium Approach** by *Bob Litterman* — [Visit Resource](https://www.wiley.com)
- **SEBI (Mutual Funds) Regulations, 1996** by *Securities and Exchange Board of India* — [Visit Resource](https://www.sebi.gov.in)

## 🔬 Advanced Context & Institutional Insights

In deep dive mode, we explore the institutional application and regulatory background of this concept. Under SEBI rules, Indian derivatives are subject to standard margins (SPAN + Exposure) and are tightly regulated to ensure systemic safety.

### Quantitative Modeling & Mathematical Context

> **Model Parameters:** No specific quantitative model details.

BAFs use mathematical models to adjust net equity exposure (typically between 30% and 80%). The models analyze indicators like:
1. **Historical P/E Ratio:** Reducing equity exposure when P/E exceeds historical standard deviations.
2. **P/B Ratio:** Using book value to determine asset bubble conditions.
3. **Yield-Gap Ratio:** Comparing equity earnings yield ($1/\text{PE}$) to 10-year G-Sec yield:
$$\text{Yield Gap} = \text{10Y G-Sec Yield} - \frac{1}{\text{PE}}$$
To maintain the tax status of an equity fund (requiring $\ge 65\%$ gross equity exposure), BAFs use equity derivatives (arbitrage). The net asset allocation is structured as:
$$\text{Total Assets} = \text{Net Long Equity} + \text{Arbitrage (Equity Futures Shorts)} + \text{Debt Securities}$$
Where $\text{Net Long Equity} + \text{Arbitrage} \ge 65\%$ to qualify for equity taxation, while actual equity market exposure is limited to $\text{Net Long Equity}$.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_mutual_funds_20.md)**

#### 🔸 Gold Funds
> **Chapter:** Mutual Funds | **Level:** Intermediate Deep Dive

--- 

## 📚 Reference Books & Study Material

- **NISM Series V-A: Mutual Fund Distributors Certification Workbook** by *National Institute of Securities Markets* — [Visit Resource](https://www.nism.ac.in)
- **Mutual Funds: A Practitioner's Guide** by *SEBI / AMFI guidelines* — [Visit Resource](https://www.amfiindia.com)
- **Modern Investment Management: An Equilibrium Approach** by *Bob Litterman* — [Visit Resource](https://www.wiley.com)
- **SEBI (Mutual Funds) Regulations, 1996** by *Securities and Exchange Board of India* — [Visit Resource](https://www.sebi.gov.in)

## 🔬 Advanced Context & Institutional Insights

In deep dive mode, we explore the institutional application and regulatory background of this concept. Under SEBI rules, Indian derivatives are subject to standard margins (SPAN + Exposure) and are tightly regulated to ensure systemic safety.

### Quantitative Modeling & Mathematical Context

> **Model Parameters:** No specific quantitative model details.

Gold funds operate as a wrapper. The fund's asset-liability match is tied to the underlying Gold ETF price. The ETF must buy 99.5% pure physical gold bullion. Since gold is denominated in USD internationally, the fund's return is also driven by the USD-INR exchange rate. Under current tax laws, gold mutual funds are taxed as debt mutual funds (marginal slab rate).

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_mutual_funds_21.md)**

#### 🔸 Quant Funds
> **Chapter:** Mutual Funds | **Level:** Intermediate Deep Dive

--- 

## 📚 Reference Books & Study Material

- **NISM Series V-A: Mutual Fund Distributors Certification Workbook** by *National Institute of Securities Markets* — [Visit Resource](https://www.nism.ac.in)
- **Mutual Funds: A Practitioner's Guide** by *SEBI / AMFI guidelines* — [Visit Resource](https://www.amfiindia.com)
- **Modern Investment Management: An Equilibrium Approach** by *Bob Litterman* — [Visit Resource](https://www.wiley.com)
- **SEBI (Mutual Funds) Regulations, 1996** by *Securities and Exchange Board of India* — [Visit Resource](https://www.sebi.gov.in)

## 🔬 Advanced Context & Institutional Insights

In deep dive mode, we explore the institutional application and regulatory background of this concept. Under SEBI rules, Indian derivatives are subject to standard margins (SPAN + Exposure) and are tightly regulated to ensure systemic safety.

### Quantitative Modeling & Mathematical Context

> **Model Parameters:** No specific quantitative model details.

Quant funds utilize multi-factor pricing models. The models screen stocks based on factors like:
**Value:** Low P/E, Low P/B, High Enterprise Value / EBITDA.
**Momentum:** High relative strength index (RSI), price acceleration over 6 and 12 months.
**Quality:** High ROE, low debt-to-equity, high cash flow conversion.
**Low Volatility:** Low historical standard deviation or low Beta.
The portfolio is rebalanced systematically (e.g., monthly or quarterly) without human intervention, maintaining fixed risk factor exposures.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_mutual_funds_22.md)**

#### 🔸 ELSS (Equity Linked Savings Scheme)
> **Chapter:** Mutual Funds | **Level:** Intermediate Deep Dive

--- 

## 📚 Reference Books & Study Material

- **NISM Series V-A: Mutual Fund Distributors Certification Workbook** by *National Institute of Securities Markets* — [Visit Resource](https://www.nism.ac.in)
- **Mutual Funds: A Practitioner's Guide** by *SEBI / AMFI guidelines* — [Visit Resource](https://www.amfiindia.com)
- **Modern Investment Management: An Equilibrium Approach** by *Bob Litterman* — [Visit Resource](https://www.wiley.com)
- **SEBI (Mutual Funds) Regulations, 1996** by *Securities and Exchange Board of India* — [Visit Resource](https://www.sebi.gov.in)

## 🔬 Advanced Context & Institutional Insights

In deep dive mode, we explore the institutional application and regulatory background of this concept. Under SEBI rules, Indian derivatives are subject to standard margins (SPAN + Exposure) and are tightly regulated to ensure systemic safety.

### Quantitative Modeling & Mathematical Context

> **Model Parameters:** No specific quantitative model details.

Under SEBI guidelines, ELSS must maintain a minimum 80% equity exposure. The 3-year lock-in period creates a stable capital base. The fund manager does not need to maintain cash reserves for daily redemptions, allowing them to invest in relatively illiquid, high-conviction mid and small-cap stocks. This structure is highly efficient for long-term wealth creation.
#### Sub-Topic 3.2.4: Specialized Strategies

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_mutual_funds_23.md)**