# Mutual Funds

## 1. Quick Revision: Core Structures & Entities

A Mutual Fund is a trust registered under the Indian Registration Act, 1908. It is regulated by SEBI under the SEBI (Mutual Funds) Regulations, 1996.

| Entity | Role / Key Rule |
| :--- | :--- |
| **Sponsor** | The promoter. Must contribute at least 40% of the AMC's net worth (min. ₹10 Cr). |
| **Trustees** | Protect unit holders' interests. 2/3rd must be independent of the Sponsor. |
| **AMC** | The investment manager. Appointed by trustees; manages fund portfolios. |
| **Custodian** | Takes custody of securities/gold. Independent of Sponsor/AMC. |
| **RTA** | Handles investor transactions (subscriptions, redemptions, dividends). |

---

## 2. Core Classifications at a Glance

* **Functional:** 
  * *Open-Ended:* Continuous sale/repurchase at NAV. Highly liquid.
  * *Closed-Ended:* Fixed maturity (3-15 years). Listed on stock exchanges.
  * *Interval:* Combines features. Open for transactions during pre-specified intervals.
* **Specialty Equity Plans:**
  * *Aggressive:* High turnover, high beta, IPO focus.
  * *Contra:* Value-driven, contrarian bets on underperforming companies.
  * *Flexi-Cap:* Minimum 65% equity; no caps on market cap allocation.
  * *Multi-Cap:* Minimum 75% equity; minimum 25% each in Large, Mid, and Small Cap.
  * *Dividend Yield:* Focuses on mature companies with stable cash flows and high dividend payout.
* **Specialty Debt & Hybrid Plans:**
  * *Gilt Funds:* Invest only in Government Securities. Zero credit risk, high interest rate risk.
  * *Fixed Maturity Plans (FMPs):* Close-ended debt funds with maturities matching underlying bonds.
  * *Capital Protection Oriented Funds (CPOF):* Closed-ended hybrid funds. Allocation: Principal-protecting debt + growth equity.
* **Modern / Passive Schemes:**
  * *Index Funds:* Passively copy an index. Low cost, subject to tracking error.
  * *ETFs:* Listed index funds traded on exchanges. Low TER, require demat account.
  * *Arbitrage Funds:* Risk-free cash-futures mispricing exploitation. Equity taxation status.
  * *Quant Funds:* Systematic investing driven by computer models and quantitative data.
  * *Fund of Funds (FOF):* Invests in other mutual funds. Double management fee drag.
  * *ELSS:* Equity Linked Savings Scheme. Eligible for Sec 80C tax deduction. 3-year lock-in.

---

## 3. Key Concepts & Processes

### Side-Pocketing (Segregation)
* Isolates distressed/defaulted assets from healthy holdings during a credit event.
* **Main Portfolio (Good):** Continues normal operations, subscription, and redemption.
* **Segregated Portfolio (Bad):** Locked. Units held by existing investors. Payout occurs on actual recovery.

### Dividend Equalization
* A mechanism to prevent dilution of returns in open-ended funds during subscription or redemption.
* **Dividend Equalization Rate (DER)** = $\frac{\text{Accumulated Undistributed Net Income}}{\text{Existing Outstanding Units}}$
* **New Subscriber pays:** $\text{NAV} + \text{Front load} + \text{DER}$
* **Redeeming Investor receives:** $\text{NAV} - \text{Exit load} + \text{DER}$

### Valuation of Non-Traded Securities
* Applicable if a security is not traded on any exchange for **60 days**.
* **Equity:** Capitalization of earnings or net assets with discount.
* **Debt:** Yield-to-Maturity (YTM) basis with liquidity discount.
* **G-Secs:** Valued at YTM based on market rates.

---

## 4. The Formula Sheet

### 1. Net Asset Value (NAV)
$$\text{NAV} = \frac{\text{Market Value of Investments} + \text{Current Assets \& Cash} - \text{Accrued Expenses \& Liabilities}}{\text{Total Number of Outstanding Units}}$$

### 2. Transaction Loads
* **Public Offer Price (POP):**
  $$\text{POP} = \text{NAV} \times (1 + \text{Front-end Load \%})$$
* **Redemption (Repurchase) Price:**
  $$\text{Redemption Price} = \text{NAV} \times (1 - \text{Exit/Back-end Load \%})$$

### 3. Return Metrics
* **Total Return (Reinvestment Plan):**
  $$\text{Total Return} = $\frac{(\text{Units}_{\text{end}} \times \text{NAV}_{\text{end}}) - \text{Investment Amount}}{\text{Investment Amount}} \times 100$$
* **Simple Annualized Yield:**
  $$\text{Simple Annualized Yield} = $\frac{\text{Total Return \%}}{\text{Holding Period (in Years)}} = \text{Total Return \%} \times \frac{365}{\text{Holding Period (Days)}}$$

### 4. Performance Ratios (Risk-Adjusted)
* **Sharpe Ratio (Total Risk):**
  $$\text{Sharpe} = \frac{R_p - R_f}{\sigma_p}$$
* **Treynor Ratio (Systematic Risk):**
  $$\text{Treynor} = \frac{R_p - R_f}{\beta_p}$$
* **Jensen's Alpha ($\alpha_p$):**
  $$\alpha_p = R_p - [R_f + \beta_p(R_m - R_f)]$$
* **Tracking Error (TE - Passive Funds):**
  $$\text{Tracking Error} = \sqrt{\frac{\sum (D_t - \bar{D})^2}{n - 1}}$$
  Where $D_t = R_{\text{fund}, t} - R_{\text{benchmark}, t}$ and $\bar{D}$ is the average differential return.

---

## 5. Summary Comparison: ETF vs. Open-Ended Mutual Fund

| Feature | Exchange Traded Fund (ETF) | Open-Ended Mutual Fund |
| :--- | :--- | :--- |
| **Trading Mode** | Traded on Stock Exchange like shares. | Bought/Sold directly from the AMC. |
| **Transaction Price** | Real-time market price (fluctuates during trading hours). | End-of-day NAV. |
| **Demat Account** | Compulsory. | Not required. |
| **Expenses (TER)** | Extremely low (mostly passive). | Higher (active management cost). |
| **Transaction Fees** | Brokerage and exchange transaction charges apply. | Exit load may apply (zero entry load). |
| **Portfolio Transparency**| Daily disclosure of holdings. | Periodic disclosure (monthly/quarterly). |
