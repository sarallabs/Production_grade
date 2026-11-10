# Mutual Funds

## 1. Quick Concept Recap

* **Mutual Fund:** A trust that pools public savings and invests them in diversified portfolios of stocks, bonds, and money market instruments under professional management.
* **Sponsor:** The promoter who sets up the trust and contributes at least 40% of the AMC's net worth.
* **Trustees:** Fiduciaries who safeguard unit holders' interests and monitor the AMC.
* **Asset Management Company (AMC):** The investment manager that runs the day-to-day operations and launches schemes.
* **Custodian:** The independent entity holding physical/electronic custody of fund assets.
* **Registrar and Transfer Agent (RTA):** Processes investor applications, unit allotments, and redemptions.
* **Net Asset Value (NAV):** The market value of a single unit of a scheme, calculated daily.
* **Total Expense Ratio (TER):** Annual recurring expenses (fees, administrative charges) divided by the average daily net assets. Capped at 2.50% by SEBI for open-ended equity schemes.
* **Rupee Cost Averaging:** Investing a fixed amount regularly (via SIP) so you buy more units when the NAV is low and fewer when the NAV is high, averaging out costs.
* **ELSS:** Tax-saving equity mutual fund with a 3-year mandatory lock-in period.
* **Gilt Funds:** Debt funds investing exclusively in government securities, carrying no credit risk.
* **Index Funds:** Passively managed funds replicating a market index with the goal of matching index returns.
* **Tracking Error:** The deviation of an index fund's returns from its benchmark index's returns.

---

## 2. Key Comparison Tables

### Table A: Open-ended vs. Closed-ended Mutual Funds
| Criteria | Open-ended Funds | Closed-ended Funds |
| :--- | :--- | :--- |
| **Tenure** | Perpetual; no maturity date. | Fixed maturity (3 to 15 years). |
| **Allotment & Buyback** | Continuous throughout the year. | Only during the New Fund Offer (NFO). |
| **Exit Window** | Redeemable directly with the AMC. | Traded on stock exchanges. |
| **Pricing basis** | Bought/sold at the daily NAV. | Traded at market prices (premium/discount to NAV). |
| **Fund Corpus** | Changes daily. | Stays constant after NFO. |

### Table B: Mutual Funds vs. Exchange Traded Funds (ETFs) vs. Hedge Funds
| Feature | Mutual Funds (Active) | Exchange Traded Funds (ETFs) | Hedge Funds |
| :--- | :--- | :--- | :--- |
| **Target Investor** | Retail & Institutional | Retail & Institutional | High Net Worth Individuals (HNIs) |
| **Trading Style** | Once a day at end-of-day NAV. | Real-time on stock exchanges. | Private transactions, low liquidity. |
| **Management** | Mostly active. | Passive (tracks an index). | Highly active, aggressive. |
| **Regulation** | Heavily regulated (SEBI). | Heavily regulated (SEBI). | Lightly regulated. |
| **Costs** | High to Moderate (TER up to 2.5%). | Very low expense ratios. | Very high (2% management + 20% profits). |
| **Strategies** | Long-only investments. | Long-only (index tracking). | Long, short, leverage, derivatives. |

### Table C: Growth vs. Dividend Payout vs. Dividend Reinvestment Options
| Option | Payout of Profits | Effect on Unit Balance | Effect on NAV |
| :--- | :--- | :--- | :--- |
| **Growth** | Nil (profits reinvested). | Remains unchanged. | NAV increases as portfolio grows. |
| **Dividend Payout** | Cash distributed to investor. | Remains unchanged. | NAV drops by the amount of dividend paid. |
| **Dividend Reinvestment** | Units issued instead of cash. | Unit balance increases. | NAV drops by the amount of dividend paid. |

---

## 3. High-Yield Formula Sheet

### Net Asset Value (NAV)
$$\text{NAV per unit} = $\frac{\text{Market Value of Investments} + \text{Other Assets / Cash} - \text{Accrued Expenses & Liabilities}}{\text{Total Number of Outstanding Units}}$$

### Entry Load & Purchase Price
$$\text{Public Offer Price (Purchase Price)} = \text{NAV} \times (1 + \text{Entry Load \%})$$
*(Note: Entry loads are currently 0% as per SEBI regulations).*

### Exit Load & Redemption Price
$$\text{Redemption Price} = \text{NAV} \times (1 - \text{Exit Load \%})$$

### Simple Return on Investment
$$\text{Simple Return (\%)} = $\frac{(NAV_{\text{End}} - NAV_{\text{Start}}) + \text{Dividends Received} + \text{Capital Distributions}}{NAV_{\text{Start}}} \times 100$$

### Annualized Return
$$\text{Annualized Return (\%)} = \text{Simple Return} \times \frac{365}{\text{Holding Period (in Days)}} \times 100$$
*(Or multiply by $\frac{12}{\text{Holding Period (in Months)}}$)*

### Total Expense Ratio (TER)
$$\text{TER (\%)} = $\frac{\text{Total Recurring Expenses incurred during the year}}{\text{Average Daily Net Assets of the Scheme}} \times 100$$

### Basic Performance Ratios (Conceptual Formulas)
* **Sharpe Ratio** (Reward to Total Volatility):
  $$\text{Sharpe Ratio} = $\frac{R_p - R_f}{\sigma_p}$$
  *(Where $R_p$ = portfolio return, $R_f$ = risk-free rate, $\sigma_p$ = standard deviation of portfolio)*

* **Treynor Ratio** (Reward to Systematic Risk):
  $$\text{Treynor Ratio} = $\frac{R_p - R_f}{\beta_p}$$
  *(Where $\beta_p$ = beta of the portfolio)*

* **Jensen's Alpha** (Absolute outperformance):
  $$\text{Alpha} = R_p - [R_f + \beta_p(R_m - R_f)]$$
  *(Where $R_m$ = market return)*

* **Tracking Error** (Passive funds deviation):
  $$\text{Tracking Error} = \sqrt{\frac{\sum (D_t - \bar{D})^2}{n - 1}}$$
  *(Where $D_t$ = difference between fund return and index return in period $t$)*
