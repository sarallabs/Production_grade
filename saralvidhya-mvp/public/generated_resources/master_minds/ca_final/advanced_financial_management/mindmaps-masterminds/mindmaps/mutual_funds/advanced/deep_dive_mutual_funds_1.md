# Deep Dive: Mutual Fund

> **Chapter:** Mutual Funds | **Level:** Advanced Deep Dive

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

The mutual fund structure is a statutory trust. The legal ownership vests with the Trustees, whereas the beneficial ownership rests with the unit-holders. The Asset Management Company (AMC) acts as an agent of the trust. Under SEBI rules, the NAV calculation must account for accrued liabilities and expense accruals on a daily basis. The NAV is computed as:
$$\text{NAV}_t = \frac{\sum_{i=1}^n Q_{i,t} P_{i,t} + \text{Cash}_t - \text{Accrued Expenses}_t - \text{Liabilities}_t}{\text{Total Outstanding Units}_t}$$
Where $Q_{i,t}$ is the quantity of security $i$ held at day $t$, and $P_{i,t}$ is the closing price of security $i$ on the principal stock exchange.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_mutual_funds_1.md)**