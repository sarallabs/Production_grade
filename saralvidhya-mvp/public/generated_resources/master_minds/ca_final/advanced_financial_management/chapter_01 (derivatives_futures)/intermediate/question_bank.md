# Derivatives - Futures
## Intermediate Question Bank (CA Final AFM)

### Section A: Theoretical Questions

#### Question 1
**Distinguish between Forward Contracts and Futures Contracts on the basis of at least six key parameters.**

**Answer:**
Both Forward and Futures contracts are derivative instruments used to buy or sell an underlying asset at a predetermined price on a future date. However, they differ significantly in their structure, trading environment, and risk profile:

| Parameter | Forward Contracts | Futures Contracts |
| :--- | :--- | :--- |
| **Trading Venue** | Over-the-Counter (OTC) market. Traded directly between two parties without exchange mediation. | Organized Exchange (e.g., NSE, BSE). Traded on regulated platforms. |
| **Contract Specifications** | Custom-tailored. The contract size, maturity date, and quality of the asset can be customized to suit the parties' needs. | Standardized. The exchange determines the contract size, expiration dates, and asset quality grades. |
| **Counterparty Risk** | High. Both parties are exposed to the risk of default by the other party. | Negligible. The exchange's Clearing Corporation acts as the counterparty to every trade, guaranteeing settlement. |
| **Margin Requirements** | Usually none, unless agreed upon by the contracting parties. | Compulsory. Initial and maintenance margins must be deposited and maintained. |
| **Settlement** | Occurs at the maturity date of the contract. Physical delivery is common. | Daily settlement via the "Mark-to-Market" process. Most contracts are cash-settled or squared off before maturity. |
| **Liquidity** | Low liquidity. It is difficult to reverse or transfer a forward contract prior to maturity without mutual consent. | High liquidity. Traders can easily exit positions by executing an offsetting trade on the exchange. |

---

#### Question 2
**Explain the concept of "Marking to Market" in the futures market. How do Initial Margin, Maintenance Margin, and Variation Margin interact during this process?**

**Answer:**
**Marking to Market (MTM)** is the process by which the clearing house adjusts the margin accounts of futures contract holders daily based on the closing price of the futures contract. Since futures prices change daily, one party's gain is the other party's loss. MTM ensures that gains and losses are settled at the end of each trading day, minimizing the risk of default.

The interaction between the three types of margins is as follows:
1. **Initial Margin:** This is the upfront cash or collateral deposited by both buyers (long) and sellers (short) when initiating a futures position. It is calculated using Value-at-Risk (VaR) to cover potential losses over a single day with a high level of confidence (typically 99% or $\mu + 3\sigma$).
2. **Maintenance Margin:** This is the minimum balance that must be maintained in the margin account at all times. It is set lower than the Initial Margin (typically 70% to 80% of the initial margin). If the daily MTM losses reduce the account balance below the maintenance margin level, a **Margin Call** is triggered.
3. **Variation Margin:** When a margin call is triggered, the investor must deposit additional funds to restore the account balance back to the **Initial Margin** level (not just the maintenance margin level). This additional deposit is called the variation margin. If the investor fails to pay the variation margin, the broker has the right to liquidate the position to prevent further losses.

---

#### Question 3
**Define "Contango" and "Backwardation" in the context of futures pricing. What causes these market states?**

**Answer:**
**Contango** and **Backwardation** describe the relationship between the spot price of an underlying asset and its futures price:

1. **Contango:**
   * **Definition:** A market is in contango when the futures price ($F_0$) is higher than the current spot price ($S_0$), i.e., $F_0 > S_0$.
   * **Causes:** This occurs when the cost of carrying the asset (such as interest financing, storage, insurance) exceeds any benefits of holding the asset (like dividends or convenience yield). Contango is typical for non-perishable commodities with significant storage costs (e.g., crude oil, gold) and stock indices with low dividend yields.
   
2. **Backwardation:**
   * **Definition:** A market is in backwardation when the futures price ($F_0$) is lower than the current spot price ($S_0$), i.e., $F_0 < S_0$.
   * **Causes:** This occurs when the convenience yield (the benefit of physically holding the asset, such as ensuring supply during a shortage) or high dividend payouts exceed the interest and financing costs. Backwardation is common in agricultural commodities during harvest shortages or in stocks approaching a high dividend distribution.

---

#### Question 4
**Compare Stock Futures and Index Futures. Highlight key structural and risk differences.**

**Answer:**
While both are exchange-traded derivative contracts, Stock Futures and Index Futures have the following differences:

| Parameter | Stock Futures | Index Futures |
| :--- | :--- | :--- |
| **Underlying Asset** | Individual equity shares of a specific company (e.g., Reliance Industries). | A basket of stocks representing an index (e.g., Nifty 50, Sensex). |
| **Diversification & Risk** | Exposed to unsystematic (company-specific) risk as well as systematic risk. Higher volatility. | Broad market exposure. Unsystematic risk is diversified away; exposed only to systematic risk. Lower volatility. |
| **Settlement Mode** | Can lead to physical delivery of shares (in India, physical settlement is mandatory for stock derivatives at expiry). | Always cash-settled, as it is physically impossible to deliver a fractional basket of index stocks. |
| **Margins** | Higher and variable margins because individual stocks are more volatile. | Lower and standardized margins due to the diversified and less volatile nature of the index. |
| **Market Manipulation** | More susceptible to manipulation or cornering by large players. | Extremely difficult to manipulate since it requires moving several large-cap stocks simultaneously. |
| **Dividend Adjustments** | Dividends paid by the specific stock directly reduce the theoretical futures price. | Dividend yield of the entire index is estimated and adjusted continuously. |

---

### Section B: Computational & Practical Questions

#### Question 5
**A stock is trading today at ₹600. It is expected to pay a dividend of ₹18 in exactly 2 months. The risk-free interest rate is 9% per annum with continuous compounding. Calculate the theoretical price of a 3-month futures contract. (Given: $e^{-0.015} = 0.9851$ and $e^{0.0225} = 1.0228$)**

**Answer:**
**1. Formula for Futures Price with discrete dividend and continuous compounding:**
$$F_0 = (S_0 - PV(D)) \times e^{r \times T}$$

Where:
* $S_0 = 600$ (Spot Price)
* $D = 18$ (Dividend paid at $t = 2$ months)
* $r = 9\% = 0.09$ per annum
* $t_d = 2/12 = 0.1667$ years (time to dividend payment)
* $T = 3/12 = 0.25$ years (time to futures expiration)

**2. Step 1: Calculate Present Value of Dividend ($PV(D)$):**
$$PV(D) = D \times e^{-r \times t_d}$$
$$PV(D) = 18 \times e^{-0.09 \times (2/12)}$$
$$PV(D) = 18 \times e^{-0.015}$$
Given $e^{-0.015} = 0.9851$:
$$PV(D) = 18 \times 0.9851 = 17.7318$$

**3. Step 2: Adjust the Spot Price for the Present Value of Dividend:**
$$S_0 - PV(D) = 600 - 17.7318 = 582.2682$$

**4. Step 3: Calculate the Futures Price:**
$$F_0 = 582.2682 \times e^{r \times T}$$
$$F_0 = 582.2682 \times e^{0.09 \times 0.25}$$
$$F_0 = 582.2682 \times e^{0.0225}$$
Given $e^{0.0225} = 1.0228$:
$$F_0 = 582.2682 \times 1.0228 = 595.54$$

**Conclusion:**
The theoretical 3-month futures price of the stock is **₹595.54**.

---

#### Question 6
**On July 31, 2025, the Nifty 50 Index is quoting at 24,000. A 5-month futures contract deliverable on December 31, 2025, is trading in the market. The risk-free interest rate is 10% per annum continuously compounded, and the average annual dividend yield on the index is 3% per annum. 
a) Calculate the theoretical futures price of the Nifty contract.
b) If the market price of the Nifty futures is 24,600, state whether it is mispriced and explain the arbitrage mechanism.**

**Answer:**
**a) Calculation of Theoretical Futures Price:**
For an index with continuous dividend yield, the formula is:
$$F_0 = S_0 \times e^{(r - d) \times T}$$

Where:
* $S_0 = 24,000$ (Spot Index Value)
* $r = 10\% = 0.10$ per annum (risk-free rate)
* $d = 3\% = 0.03$ per annum (dividend yield)
* $T = 5/12 = 0.4167$ years (tenure of the contract)

Calculate exponent:
$$(r - d) \times T = (0.10 - 0.03) \times 0.4167 = 0.07 \times 0.4167 = 0.02917$$

Calculate $e^{0.02917}$:
Using $e^x \approx 1 + x + \frac{x^2}{2}$:
$$e^{0.02917} \approx 1 + 0.02917 + \frac{(0.02917)^2}{2} \approx 1 + 0.02917 + 0.00043 = 1.0296$$

Therefore:
$$F_0 = 24,000 \times 1.0296 = 24,710.40$$
The theoretical futures price is **₹24,710.40**.

**b) Analysis of Mispricing and Arbitrage:**
* **Actual Market Price ($F_{mkt}$):** ₹24,600
* **Theoretical Price ($F_{0}$):** ₹24,710.40
* **Evaluation:** Since $F_{mkt} < F_{0}$ (₹24,600 < ₹24,710.40), the futures contract is **undervalued** in the market.

**Arbitrage Strategy (Reverse Cash-and-Carry):**
1. **Action Today (July 31):**
   * Buy the undervalued Nifty futures contract at ₹24,600.
   * Short-sell the Nifty index (or the underlying constituent shares) in the spot market at ₹24,000.
   * Invest the short-sale proceeds of ₹24,000 at the risk-free rate of 10% per annum for 5 months.
2. **Action at Expiry (December 31):**
   * Collect the matured investment: $24,000 \times e^{0.10 \times (5/12)} = 24,000 \times 1.0425 = 25,020$. (Adjusting for index dividends that the short seller must pay to the lender of stocks: $3\%$ dividend yield on spot index for 5 months).
   * Pay the dividends on the shorted stocks: $24,000 \times (e^{0.03 \times (5/12)} - 1) = 24,000 \times 0.0126 = 302.40$.
   * Net Cash from investment after dividend payout = $25,020 - 302.40 = 24,717.60$.
   * Buy the Nifty index back via the futures contract at the pre-agreed price of ₹24,600 to close out the short position.
   * **Arbitrage Profit:** Net cash received - Buyback price = $24,717.60 - 24,600 = \textbf{₹117.60}$ per unit of Nifty.

---

#### Question 7
**On October 1, 2025, Mr. Verma enters into a long position in 3 lots of Nifty Futures at a price of 22,500. 
The following details are provided:
* One Nifty lot is 50 units.
* Initial Margin is 10% of the contract value.
* Maintenance Margin is 80% of the initial margin.
* The closing prices of Nifty Futures for the next 5 days are:
  * Day 1: 22,400
  * Day 2: 22,100
  * Day 3: 21,900
  * Day 4: 22,250
  * Day 5: 22,600

Prepare the Daily Margin Account Statement showing MTM gain/loss, margin calls, and closing balance.**

**Answer:**
**1. Initial Parameters:**
* **Total Position Size:** 3 lots $\times$ 50 units = 150 units.
* **Initial Futures Price:** ₹22,500.
* **Initial Contract Value:** $150 \times 22,500 = \text{₹33,75,000}$.
* **Initial Margin Deposit Required:** $10\% \times 33,75,000 = \text{₹3,37,500}$.
* **Maintenance Margin Limit:** $80\% \times 3,37,500 = \text{₹2,70,000}$.

**2. Daily MTM and Margin Account Calculation:**
* **Day 1:**
  * Closing Price: 22,400.
  * MTM Loss: $(22,400 - 22,500) \times 150 = -15,000$.
  * Margin Balance: $3,37,500 - 15,000 = 3,22,500$.
  * Since 3,22,500 > Maintenance Margin (2,70,000), there is **No Margin Call**.
* **Day 2:**
  * Closing Price: 22,100.
  * MTM Loss: $(22,100 - 22,400) \times 150 = -45,000$.
  * Margin Balance: $3,22,500 - 45,000 = 2,77,500$.
  * Since 2,77,500 > Maintenance Margin (2,70,000), there is **No Margin Call**.
* **Day 3:**
  * Closing Price: 21,900.
  * MTM Loss: $(21,900 - 22,100) \times 150 = -30,000$.
  * Margin Balance before margin call: $2,77,500 - 30,000 = 2,47,500$.
  * Since 2,47,500 < Maintenance Margin (2,70,000), a **Margin Call** is triggered.
  * **Variation Margin Required:** Amount to restore balance back to **Initial Margin** level (3,37,500).
  * Variation Margin = $3,37,500 - 2,47,500 = 90,000$.
  * Margin Balance after cash deposit: ₹3,37,500.
* **Day 4:**
  * Closing Price: 22,250.
  * MTM Gain: $(22,250 - 21,900) \times 150 = +52,500$.
  * Margin Balance: $3,37,500 + 52,500 = 3,90,000$.
  * Since 3,90,000 > 2,70,000, **No Margin Call**.
* **Day 5:**
  * Closing Price: 22,600.
  * MTM Gain: $(22,600 - 22,250) \times 150 = +52,500$.
  * Margin Balance: $3,90,000 + 52,500 = 4,42,500$.
  * **No Margin Call**.

**3. Margin Account Statement Table:**

| Day | Opening Balance (₹) | Futures Closing Price (₹) | Daily MTM Gain/Loss (₹) | Margin Call / Variation Margin Deposit (₹) | Closing Balance (₹) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **0** | - | 22,500 | - | 3,37,500 (Initial Deposit) | 3,37,500 |
| **1** | 3,37,500 | 22,400 | -15,000 | 0 | 3,22,500 |
| **2** | 3,22,500 | 22,100 | -45,000 | 0 | 2,77,500 |
| **3** | 2,77,500 | 21,900 | -30,000 | 90,000 (Margin Call) | 3,37,500 |
| **4** | 3,37,500 | 22,250 | +52,500 | 0 | 3,90,000 |
| **5** | 3,90,000 | 22,600 | +52,500 | 0 | 4,42,500 |

**Overall Net Gain Calculation:**
* **Method 1 (MTM + Deposits):**
  * Total Cash Outflow = Initial Margin + Variation Margin = $3,37,500 + 90,000 = 4,27,500$.
  * Final Margin Balance = 4,42,500.
  * **Net Profit** = $4,42,500 - 4,27,500 = \textbf{₹15,000}$.
* **Method 2 (Closing vs. Entry Price):**
  * Net Gain = $(22,600 - 22,500) \times 150 = 100 \times 150 = \textbf{₹15,000}$.

---

#### Question 8
**The shares of Alpha Ltd. are currently selling for ₹800. The risk-free interest rate is 1% per month. A 3-month futures contract on Alpha Ltd. is trading in the market for ₹835. Develop a detailed arbitrage strategy and calculate the riskless profit 3 months hence, assuming Alpha Ltd. will pay a dividend of ₹12 per share in the 2nd month. Assume no transaction costs.**

**Answer:**
**Step 1: Calculate the Theoretical Price of the 3-month Futures Contract.**
Since interest is monthly, we use simple compound interest:
$$F_0 = S_0 \times (1 + r \times T) - D \times (1 + r \times (T - t_d))$$

Where:
* $S_0 = 800$ (Spot Price)
* $r = 1\%$ per month $= 0.01$ per month
* $T = 3$ months
* $D = 12$ (dividend paid at month 2)
* $t_d = 2$ months (time to dividend)

Let us compute:
* Interest cost on carrying spot price for 3 months: $800 \times (1 + 0.01 \times 3) = 800 \times 1.03 = 824$.
* Future value of the dividend at month 3 (since dividend is received at month 2, it earns interest for the remaining 1 month): $12 \times (1 + 0.01 \times 1) = 12 \times 1.01 = 12.12$.

Therefore, the theoretical price:
$$F_0 = 824 - 12.12 = 811.88$$

**Step 2: Compare Market Price with Theoretical Price.**
* **Actual Market Price ($F_{mkt}$):** ₹835.00
* **Theoretical Futures Price ($F_{0}$):** ₹811.88
* **Comparison:** $F_{mkt} > F_0$ (₹835.00 > ₹811.88). The futures contract is **overvalued** in the market.

**Step 3: Formulate the Arbitrage Strategy (Cash and Carry Arbitrage).**
Since the futures are overpriced, the arbitrageur will sell the overvalued futures contract and buy the underlying asset in the spot market.
1. **Today (Month 0):**
   * Borrow ₹800 at 1% per month interest rate for 3 months.
   * Buy 1 share of Alpha Ltd. in the spot market for ₹800.
   * Sell (short) 1 futures contract of Alpha Ltd. at the market price of ₹835.
   * **Net cash flow today = ₹0.**
2. **At Month 2:**
   * Receive dividend of ₹12.
   * Reinvest this ₹12 at 1% per month for the remaining 1 month.
3. **At Expiry (Month 3):**
   * Deliver the share of Alpha Ltd. to satisfy the futures contract and receive the agreed futures price of ₹835.
   * Collect the matured dividend reinvestment: $12 \times (1 + 0.01 \times 1) = \text{₹12.12}$.
   * Total cash inflow at Month 3 = $835 + 12.12 = \text{₹847.12}$.
   * Repay the borrowing: Principal + Interest for 3 months = $800 \times (1 + 0.01 \times 3) = 800 \times 1.03 = \text{₹824.00}$.
   * **Riskless Arbitrage Profit** = Total Inflow - Loan Repayment = $847.12 - 824.00 = \textbf{₹23.12}$ per share.

**Step 4: Cash Flow Table (per share):**

| Time Period | Cash Market (Spot) (₹) | Futures Market (₹) | Borrowing / Investment A/c (₹) | Net Cash Flow (₹) |
| :--- | :--- | :--- | :--- | :---: |
| **Month 0 (Initial)** | Buy 1 Share: -800 | Sell 1 Future: 0 | Borrow ₹800: +800 | **0** |
| **Month 2 (Interim)** | Receive Dividend: +12 | 0 | Invest Dividend: -12 | **0** |
| **Month 3 (Expiry)** | Deliver Share: 0 | Receive Futures Price: +835 | Collect Dividend Inv: +12.12<br>Repay Loan: -824.00 | **+23.12** |

---

#### Question 9
**A futures contract is available on a stock currently priced at ₹400. The contract calls for delivery of 500 shares in one year. The treasury bill rate is 8% per annum. The stock pays an annual dividend of ₹10 at the end of the year. 
a) Find the theoretical futures price.
b) If the stock price decreases by 8% immediately after the position is taken, what is the new futures price and the change in the margin account of a long position holder who deposited an initial margin of 10%? Will they face a margin call if the maintenance margin is 5%?**

**Answer:**
**a) Theoretical Futures Price ($F_0$):**
Using simple interest formula (as compounding frequency is not specified, we assume annual simple interest):
$$F_0 = S_0 \times (1 + r) - D$$
Where:
* $S_0 = 400$
* $r = 8\% = 0.08$
* $D = 10$ (paid at the end of the year, i.e., at expiry)

$$F_0 = 400 \times (1.08) - 10$$
$$F_0 = 432 - 10 = 422$$
The theoretical futures price is **₹422** per share.

**b) Impact of 8% Decrease in Stock Price:**
* **New Spot Price ($S_0'$):** $400 \times (1 - 0.08) = 368$.
* **New Theoretical Futures Price ($F_0'$):**
  $$F_0' = 368 \times (1.08) - 10 = 397.44 - 10 = 387.44$$
* **Decrease in Futures Price per share:** $422 - 387.44 = 34.56$.
* **Total Value of one futures contract (500 shares):**
  * Initial value = $500 \times 422 = \text{₹2,11,000}$.
  * New value = $500 \times 387.44 = \text{₹1,93,720}$.
  * **MTM Loss for Long Position:** $2,11,000 - 1,93,720 = \textbf{₹17,280}$.

* **Margin Account Analysis:**
  * **Initial Margin Deposit (10%):** $10\% \times 2,11,000 = \text{₹21,100}$.
  * **Maintenance Margin Limit (5%):** $5\% \times 2,11,000 = \text{₹10,550}$.
  * **Post-Loss Margin Balance:** $21,100 - 17,280 = \text{₹3,820}$.
  
* **Margin Call Evaluation:**
  * Since the post-loss margin balance (₹3,820) is **less than** the Maintenance Margin limit (₹10,550), the investor **will face a margin call**.
  * **Top-Up Amount (Variation Margin):** The investor must restore the margin account to the **Initial Margin level** (₹21,100).
  * Top-Up Amount Required = $21,100 - 3,820 = \textbf{₹17,280}$.

---

#### Question 10
**An investor enters into a long futures contract for 100 units of a commodity on Day 0 at a price of ₹1,500. The initial margin is ₹25,000, and the maintenance margin is ₹18,000. The contract has a feature allowing the investor to withdraw any margin balance exceeding the initial margin at the end of any day. The futures prices for the next 5 days are:
* Day 1: 1,530
* Day 2: 1,480
* Day 3: 1,440
* Day 4: 1,510
* Day 5: 1,550

Determine the daily closing balance, margin calls, and cash withdrawals over the 5 days.**

**Answer:**
* **Contract multiplier:** 100 units.
* **Initial Margin (IM):** ₹25,000.
* **Maintenance Margin (MM):** ₹18,000.

**Daily Calculations:**
* **Day 1:**
  * Futures price changes from 1,500 to 1,530. MTM Gain = $(1,530 - 1,500) \times 100 = +3,000$.
  * Margin Balance before withdrawal = $25,000 + 3,000 = 28,000$.
  * Since 28,000 > IM (25,000), the investor **withdraws the excess** of $28,000 - 25,000 = 3,000$.
  * Closing Balance = ₹25,000.
* **Day 2:**
  * Futures price changes from 1,530 to 1,480. MTM Loss = $(1,480 - 1,530) \times 100 = -5,000$.
  * Margin Balance = $25,000 - 5,000 = 20,000$.
  * Since 20,000 > MM (18,000), **No Margin Call** and **No Withdrawal**.
  * Closing Balance = ₹20,000.
* **Day 3:**
  * Futures price changes from 1,480 to 1,440. MTM Loss = $(1,440 - 1,480) \times 100 = -4,000$.
  * Margin Balance before deposit = $20,000 - 4,000 = 16,000$.
  * Since 16,000 < MM (18,000), a **Margin Call** is triggered.
  * Variation Margin to deposit = IM - Balance = $25,000 - 16,000 = 9,000$.
  * Closing Balance = ₹25,000.
* **Day 4:**
  * Futures price changes from 1,440 to 1,510. MTM Gain = $(1,510 - 1,440) \times 100 = +7,000$.
  * Margin Balance before withdrawal = $25,000 + 7,000 = 32,000$.
  * The investor **withdraws the excess** of $32,000 - 25,000 = 7,000$.
  * Closing Balance = ₹25,000.
* **Day 5:**
  * Futures price changes from 1,510 to 1,550. MTM Gain = $(1,550 - 1,510) \times 100 = +4,000$.
  * Margin Balance before withdrawal = $25,000 + 4,000 = 29,000$.
  * The investor **withdraws the excess** of $29,000 - 25,000 = 4,000$.
  * Closing Balance = ₹25,000.

**Margin Account Statement Table:**

| Day | Opening Balance (₹) | Futures Price (₹) | Daily MTM Gain/Loss (₹) | Margin Call / Cash Deposit (₹) | Cash Withdrawal (₹) | Closing Balance (₹) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **0** | - | 1,500 | - | 25,000 | 0 | 25,000 |
| **1** | 25,000 | 1,530 | +3,000 | 0 | 3,000 | 25,000 |
| **2** | 25,000 | 1,480 | -5,000 | 0 | 0 | 20,000 |
| **3** | 20,000 | 1,440 | -4,000 | 9,000 | 0 | 25,000 |
| **4** | 25,000 | 1,510 | +7,000 | 0 | 7,000 | 25,000 |
| **5** | 25,000 | 1,550 | +4,000 | 0 | 4,000 | 25,000 |

**Net Gain/Loss Analysis:**
* **Total Deposits:** $25,000 \text{ (Initial)} + 9,000 \text{ (Day 3)} = \text{₹34,000}$.
* **Total Withdrawals:** $3,000 \text{ (Day 1)} + 7,000 \text{ (Day 4)} + 4,000 \text{ (Day 5)} = \text{₹14,000}$.
* **Remaining Account Balance:** ₹25,000.
* **Net Cash Profit:** $(25,000 \text{ (Final Balance)} + 14,000 \text{ (Withdrawals)}) - 34,000 \text{ (Deposits)} = \textbf{₹5,000}$ gain.
* **Verification:** $(1,550 - 1,500) \times 100 = 50 \times 100 = \textbf{₹5,000}$ gain.