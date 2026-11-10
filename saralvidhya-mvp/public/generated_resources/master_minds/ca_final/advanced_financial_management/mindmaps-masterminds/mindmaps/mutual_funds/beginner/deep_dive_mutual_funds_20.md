# Deep Dive: Capital Protection Funds

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