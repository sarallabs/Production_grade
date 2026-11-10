# Deep Dive: Arbitrage Funds

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

The fund buys stock $S$ in the spot market and simultaneously sells futures contract $F$ at a premium. The locked-in return is the basis:
$$\text{Basis} = F_0 - S_0$$
At expiry, the futures price converges to the spot price ($F_T = S_T$). The return is earned as the basis converges to zero. Because the fund holds physical shares hedged with derivatives, its gross equity exposure exceeds 65%, qualifying it for equity taxation (lower tax rate) despite having the risk profile of a debt liquid fund.

--- 

## 🔗 Navigation
- 🔙 **[Back to Core Lesson](./concept_mutual_funds_26.md)**