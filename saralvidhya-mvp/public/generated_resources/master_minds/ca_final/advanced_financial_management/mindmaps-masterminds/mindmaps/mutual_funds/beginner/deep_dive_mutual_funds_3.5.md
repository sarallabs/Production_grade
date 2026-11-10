# Deep Dive: Performance Measurement

### 🔹 Sub-topic: Ratios

#### 🔸 Sharpe Ratio
# Deep Dive: Sharpe Ratio

> **Chapter:** Mutual Funds | **Level:** Beginner Deep Dive

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

**Formula:**
$$S_p = \frac{R_p - R_f}{\sigma_p}$$
Where:
$R_p = \text{Portfolio Return}$
$R_f = \text{Risk-Free Rate}$
$\sigma_p = \text{Standard Deviation of Portfolio Returns (Total Risk)}$
**Worked Example:**
Fund A Return ($R_p$) = 15%
Risk-Free Rate ($R_f$) = 6%
Standard Deviation ($\sigma_p$) = 12%
$$S_p = \frac{15\% - 6\%}{12\%} = $\frac{9\%}{12\%} = 0.75$$
*Interpretation:* Fund A generates 0.75% of excess return for every 1% of total risk taken.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_mutual_funds_44.md)**

#### 🔸 Treynor Ratio
# Deep Dive: Treynor Ratio

> **Chapter:** Mutual Funds | **Level:** Beginner Deep Dive

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

**Formula:**
$$T_p = \frac{R_p - R_f}{\beta_p}$$
Where:
$\beta_p = \text{Beta of the Portfolio (Systematic Risk)}$
**Worked Example:**
Fund B Return ($R_p$) = 16%
Risk-Free Rate ($R_f$) = 6%
Portfolio Beta ($\beta_p$) = 1.25
$$T_p = \frac{16\% - 6\%}{1.25} = $\frac{10\%}{1.25} = 8.0\% \text{ (or 0.08)}$$
*Interpretation:* Fund B generates 8% excess return for every unit of market-related systematic risk.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_mutual_funds_45.md)**

#### 🔸 Jensen's Alpha
> **Chapter:** Mutual Funds | **Level:** Beginner Deep Dive

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

**Jensen's Alpha Formula:**
$$\alpha_p = R_p - [R_f + \beta_p(R_m - R_f)]$$
**BHB Performance Attribution Model:**
Decomposes active return ($R_p - R_b$) into three components across $n$ sectors:
1. **Allocation Effect ($A_i$):** The value added by overweighting/underweighting sectors:
$$A_i = (w_{p,i} - w_{b,i}) \times R_{b,i}$$
2. **Selection Effect ($S_i$):** The value added by stock selection within a sector:
$$S_i = w_{b,i} \times (R_{p,i} - R_{b,i})$$
3. **Interaction Effect ($I_i$):** The joint effect of allocation and selection:
$$I_i = (w_{p,i} - w_{b,i}) \times (R_{p,i} - R_{b,i})$$
Total Active Return:
$$R_p - R_b = \sum_{i=1}^n (A_i + S_i + I_i)$$
Where $w_{p,i}$ and $w_{b,i}$ are portfolio and benchmark weights for sector $i$, and $R_{p,i}$ and $R_{b,i}$ are sector returns.
#### Sub-Topic 3.5.2: Hedge Funds vs. Mutual Funds

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_mutual_funds_46.md)**

### 🔹 Sub-topic: Hedge Funds vs. Mutual Funds

#### 🔸 Regulation Differences
> **Chapter:** Mutual Funds | **Level:** Beginner Deep Dive

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

**Mutual Funds:** Highly regulated under SEBI (Mutual Funds) Regulations, 1996. Retail-focused, mandatory daily NAV disclosure, strict concentration limits (e.g., max 10% in a single company's stock).
**Hedge Funds (AIF Category III):** Regulated under SEBI (AIF) Regulations, 2012. Private placement only, minimum investment size of ₹1 Crore, lower frequency of disclosure, and flexible leverage rules.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_mutual_funds_47.md)**

#### 🔸 Investment Strategy
> **Chapter:** Mutual Funds | **Level:** Beginner Deep Dive

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

**Mutual Funds:** Must remain fully invested (cash limits apply), cannot short sell stocks (except minor hedging), and cannot borrow money to invest (leverage is banned except for meeting temporary redemption liquidity).
**Hedge Funds:** Can short-sell stocks, buy derivatives, use high leverage (up to 2 times the fund size in India), and take highly concentrated bets on single companies or themes.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_mutual_funds_48.md)**

#### 🔸 Fee Structure
> **Chapter:** Mutual Funds | **Level:** Beginner Deep Dive

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

**Mutual Funds:** Flat TER capped by SEBI (max 2.25%). Performance-based incentive fees are strictly prohibited under SEBI guidelines.
**Hedge Funds:** Typically charge a 1-2% annual management fee plus a 10-20% performance fee on returns generated above a specific "hurdle rate" (e.g., 8%), often subject to a "high-water mark" clause (no performance fee until past losses are recovered).

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_mutual_funds_49.md)**

#### 🔸 Information Disclosure
> **Chapter:** Mutual Funds | **Level:** Beginner Deep Dive

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

**Mutual Funds:** Must publish NAV daily by 11:00 PM, disclose full portfolio holdings monthly, and release semi-annual audited financial statements.
**Hedge Funds:** Portfolios are disclosed only to their private investors (usually quarterly or semi-annually). NAV disclosure is weekly or monthly, and reports are not published in the public domain.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_mutual_funds_50.md)**