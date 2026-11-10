# Deep Dive: Bond Funds

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