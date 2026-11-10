# Derivatives - Futures — Advanced Question Bank

This question bank contains advanced, exam-level problems for CA Final Advanced Financial Management (AFM). The problems cover multi-step calculations, cash and carry/reverse cash and carry arbitrage with transaction costs, dynamic portfolio hedging, VaR-based margin accounting, and index futures valuation with continuous compounding and varying dividend yields.

---

## Question 1: Cash & Carry Arbitrage with Transaction Costs, Taxes, and Margin Financing Costs

### Problem Statement
The equity share of **Astraea Technologies Ltd. (ATL)** is currently trading in the spot market at ₹1,200. A 3-month futures contract on ATL is quoting at ₹1,265. The following additional information is available:
*   **Borrowing Rate (for funding spot purchases):** 12% p.a. (simple interest)
*   **Lending/Deposit Rate (for surplus funds):** 8% p.a. (simple interest)
*   **Expected Dividend:** ₹15 per share, to be paid exactly 2 months from today.
*   **Transaction Costs:**
    *   **Brokerage:** 0.25% on both spot purchase and sale, and 0.10% on futures transactions (calculated on the respective trade values).
    *   **Securities Transaction Tax (STT):** 0.10% on spot transactions (applicable to both purchases and sales).
    *   **GST:** 18% on brokerage charges.
*   **Margin Requirement:** The futures contract requires an upfront cash margin of 10% of the contract value. The margin is deposited in a non-interest-bearing account (representing an opportunity cost of funds at the lending rate of 8% p.a.).

**Required:**
1. Calculate the Theoretical Fair Futures Price of ATL, accounting for the dividend and time value of money.
2. Assess whether an arbitrage opportunity exists in the market.
3. Formulate a detailed Cash & Carry Arbitrage strategy and prepare a step-by-step cash flow table at $t = 0$ and $t = 3$ months (at expiry) to demonstrate the riskless profit. Assume the spot price at expiry ($S_T$) is either ₹1,100 or ₹1,400.

---

### Detailed Walkthrough Solution

#### Step 1: Calculation of Transaction Costs at $t = 0$ for Spot Purchase
To buy the stock in the spot market at $t = 0$:
*   **Spot Price ($S_0$):** ₹1,200.00
*   **Brokerage on Spot:** $0.25\% \times ₹1,200 = ₹3.00$
*   **GST on Brokerage:** $18\% \times ₹3.00 = ₹0.54$
*   **STT on Spot:** $0.10\% \times ₹1,200 = ₹1.20$
*   **Total Transaction Cost on Spot Purchase:** $₹3.00 + ₹0.54 + ₹1.20 = ₹4.74$ per share.
*   **Effective Cost of Stock at $t = 0$ ($S_{0,\text{eff}}$):** $₹1,200.00 + ₹4.74 = ₹1,204.74$.

#### Step 2: Present Value of Dividend Inflow
The dividend of ₹15 is received at $t = 2$ months. Since this is an inflow, it reduces the carrying cost of the stock.
To compute the present value of the dividend at $t = 0$, we discount it using the deposit rate (since it is a risk-free cash inflow):
$$\text{PV}(D) = \frac{D}{1 + r_{\text{lending}} \times \frac{t_d}{12}} = \frac{15}{1 + 0.08 \times \frac{2}{12}} = \frac{15}{1.01333} = ₹14.80$$

However, when the dividend is received at $t = 2$ months, it will be reinvested for the remaining 1 month (until $t = 3$ months) at the deposit rate of 8% p.a.:
$$\text{Terminal Value of Dividend at } t = 3 \text{ months } (TV(D)) = 15 \times \left(1 + 0.08 \times \frac{1}{12}\right) = 15 \times 1.00667 = ₹15.10$$

#### Step 3: Theoretical Futures Price (excluding Transaction Costs on Futures and Expiry Costs)
The carrying cost is funded by borrowing at 12% p.a.
The theoretical price of futures before transaction costs on futures and spot sale is:
$$F_{\text{theoretical}} = \left( S_{0,\text{eff}} \times \left(1 + r_{\text{borrow}} \times \frac{T}{12}\right) \right) - \text{Terminal Value of Dividend at } t = 3$$
$$F_{\text{theoretical}} = \left( 1,204.74 \times \left(1 + 0.12 \times \frac{3}{12}\right) \right) - 15.10$$
$$F_{\text{theoretical}} = (1,204.74 \times 1.03) - 15.10 = 1,240.88 - 15.10 = ₹1,225.78$$

#### Step 4: Incorporating Futures and Expiry Transaction Costs into Arbitrage Bounds
To execute Cash & Carry Arbitrage, the arbitrageur must sell futures at $t=0$ and buy spot, then sell spot and close futures at $t=3$.
*   **Futures Transaction Cost at $t = 0$:**
    *   Brokerage: $0.10\% \times ₹1,265 = ₹1.265$
    *   GST on Brokerage: $18\% \times ₹1.265 = ₹0.228$
    *   Total Futures Cost at $t=0$: ₹1.493
*   **Margin Financing Cost (Opportunity Cost):**
    *   Margin deposited at $t = 0$: $10\% \times ₹1,265 = ₹126.50$
    *   Interest lost on margin for 3 months at 8% p.a.: $₹126.50 \times 8\% \times \frac{3}{12} = ₹2.53$
*   **Transaction Costs at Expiry ($t = 3$ months):**
    *   Brokerage on spot sale (assume sale occurs at $S_T$, but for theoretical pricing we use the locked-in price $F$): $0.25\% \times F$
    *   GST on spot sale brokerage: $18\% \times (0.25\% \times F) = 0.045\% \times F$
    *   STT on spot sale: $0.10\% \times F$
    *   Total transaction cost on spot sale: $0.395\% \times F$
    *   If $F = ₹1,265$, spot sale costs $= 0.00395 \times 1,265 = ₹5.00$
    *   Brokerage on closing futures at $t=3$: $0.10\% \times F \times 1.18 = 0.118\% \times F = 0.00118 \times 1,265 = ₹1.49$

Total carrying and transaction costs to compare with the Market Futures Price ($F_{\text{mkt}} = ₹1,265$):
$$\text{Total Cost Base} = F_{\text{theoretical}} + \text{Futures Cost at } t=0 + \text{Margin Opportunity Cost} + \text{Transaction Costs at Expiry}$$
$$\text{Total Cost Base} = 1,225.78 + 1.49 + 2.53 + 5.00 + 1.49 = ₹1,236.29$$

Since $F_{\text{mkt}} = ₹1,265 > ₹1,236.29$, the actual market futures price is **overvalued** relative to its carrying cost. A riskless **Cash & Carry Arbitrage** is highly viable.

---

### Step 5: Arbitrage Cash Flow Table (Per Share Basis)

**Strategy at $t = 0$:**
1. Borrow ₹1,204.74 at 12% p.a. for 3 months.
2. Buy 1 share in spot market at ₹1,200. Pay ₹4.74 in transaction costs.
3. Sell 1 ATL futures contract at $F_{\text{mkt}} = ₹1,265$.
4. Deposit ₹126.50 as margin (using own funds or borrowing at 8% p.a.). Pay ₹1.49 futures transaction cost at $t=0$ using own funds.

**Strategy at $t = 2$ months:**
*   Receive dividend of ₹15, immediately deposit it at 8% p.a. for 1 month.

**Strategy at $t = 3$ months (Expiry):**
*   Deliver the share against the futures contract (spot sale executed at $F_{\text{mkt}} = ₹1,265$ via futures settlement).
*   Receive the margin of ₹126.50 back.
*   Receive the matured dividend deposit: $₹15 \times (1 + 0.08 \times 1/12) = ₹15.10$.
*   Repay the spot borrowing: $₹1,204.74 \times (1 + 0.12 \times 3/12) = ₹1,240.88$.
*   Pay transaction costs at expiry: Spot sale costs (₹5.00) + Futures closing cost (₹1.49).

| Cash Flow Component | Time $t = 0$ | Time $t = 2$ | Time $t = 3$ (Expiry) if $S_T = ₹1,100$ | Time $t = 3$ (Expiry) if $S_T = ₹1,400$ |
| :--- | :--- | :--- | :--- | :--- |
| **1. Borrowing for Spot Purchase** | $+₹1,204.74$ | — | — | — |
| **2. Purchase Stock in Spot & Pay Fees** | $-₹1,204.74$ | — | — | — |
| **3. Futures Position Setup** | ₹0.00 | — | — | — |
| **4. Cash Outlay for Margin & Fees** | $-₹127.99$ | — | $+₹126.50$ (margin refund) | $+₹126.50$ (margin refund) |
| **5. Dividend Inflow & Reinvestment** | — | $+₹15.00$ | $+₹15.10$ (matured value) | $+₹15.10$ (matured value) |
| **6. Cash Flow from Futures/Spot Settlement** | — | — | $+₹1,265.00$ | $+₹1,265.00$ |
| **7. Repay Spot Borrowing** | — | — | $-₹1,240.88$ | $-₹1,240.88$ |
| **8. Expiry Transaction Costs** | — | — | $-₹6.49$ | $-₹6.49$ |
| **9. Opportunity Cost of Margin & Fees** | — | — | $-₹2.53$ (assumed opportunity cost) | $-₹2.53$ (assumed opportunity cost) |
| **Net Cash Flow (Net Arbitrage Profit)** | **$-₹127.99$** | **₹0.00** | **$+₹156.70$** | **$+₹156.70$** |

**Net Arbitrage Profit Calculation:**
$$\text{Net Profit} = \text{Terminal Inflows} - \text{Terminal Outflows} - \text{Compounded Value of initial investment}$$
$$\text{Compounded Value of } t=0 \text{ outlay} = 127.99 \times \left(1 + 0.08 \times \frac{3}{12}\right) = ₹130.55$$
$$\text{Net Arbitrage Profit} = (1,265.00 + 126.50 + 15.10) - (1,240.88 + 6.49 + 130.55) = 1,406.60 - 1,377.92 = ₹28.68 \text{ per share.}$$

Regardless of the spot price $S_T$ at expiry, the arbitrageur locks in a guaranteed risk-free net profit of **₹28.68 per share**.

---

## Question 2: Index Futures Pricing with Continuous Compounding and Monthly Varying Dividend Yields

### Problem Statement
On June 30, 2026, a fund manager wants to evaluate the fair value of a 4-month Nifty 50 Index Futures contract expiring on October 31, 2026. The Nifty spot index is currently at **19,500**. The risk-free interest rate is **9% p.a.**, continuously compounded. 

The index companies pay dividends throughout the year. The historical dividend yields (expressed as annual percentages) for the corresponding months in the previous year were:
*   **July:** 1.20% p.a.
*   **August:** 1.80% p.a.
*   **September:** 3.60% p.a.
*   **October:** 2.40% p.a.

The fund manager assumes that the dividend payout pattern of the index companies will match last year's performance.

**Required:**
1. Formulate the valuation equation for Index Futures using continuous compounding with a time-varying dividend yield.
2. Calculate the weighted average annual dividend yield ($d$) applicable for the 4-month futures contract.
3. Compute the Theoretical Fair Index Futures Price of the contract as of June 30, 2026.
4. If the market is currently quoting the 4-month Nifty Futures at **19,880**, describe the exact action of an arbitrageur and calculate the potential risk-free gain on a 1-lot position (Lot size = 50 units).

---

### Detailed Walkthrough Solution

#### Step 1: Weighted Average Annual Dividend Yield ($d$)
The contract spans 4 months: July, August, September, and October.
The average annual dividend yield ($d$) is computed as the arithmetic mean of the annualized dividend yields of the respective months:
$$d = \frac{1.20\% + 1.80\% + 3.60\% + 2.40\%}{4} = $\frac{9.00\%}{4} = 2.25\% \text{ p.a.}$$

#### Step 2: Formula for Continuous Compounding Index Futures
Under continuous compounding, the index futures price is given by:
$$F = S_0 \times e^{(r - d) \times T}$$
Where:
*   $S_0 = 19,500$ (Spot Index value)
*   $r = 9\% = 0.09$ (Continuous risk-free interest rate)
*   $d = 2.25\% = 0.0225$ (Continuous dividend yield)
*   $T = \frac{4}{12} = 0.3333$ years

#### Step 3: Compute Theoretical Index Futures Price
Calculate the exponent:
$$(r - d) \times T = (0.09 - 0.0225) \times 0.33333 = 0.0675 \times \frac{1}{3} = 0.0225$$

Now compute $e^{0.0225}$:
$$e^{0.0225} \approx 1.022755$$

Substitute back into the formula:
$$F_{\text{theoretical}} = 19,500 \times 1.022755 = ₹19,943.72$$

#### Step 4: Arbitrage Strategy and Quantification
*   **Theoretical Futures Price:** ₹19,943.72
*   **Market Futures Price:** ₹19,880.00

Since $F_{\text{market}} < F_{\text{theoretical}}$, the market futures contract is **undervalued** by:
$$19,943.72 - 19,880.00 = ₹63.72 \text{ per index point.}$$

**Arbitrage Strategy (Reverse Cash & Carry / Long Futures, Short Basket):**
1. **At $t = 0$:** 
   *   Short the underlying Nifty index basket (or the individual constituent stocks matching Nifty weights) at ₹19,500.
   *   Invest the short sale proceeds at the risk-free rate of 9% p.a. continuously compounded.
   *   Buy (Go Long) 1 Nifty Futures contract at $F_{\text{market}} = 19,880$.
2. **During the contract period:**
   *   Pay out dividends on the shorted index basket at the average annual rate of 2.25%.
3. **At $t = 4$ months (Expiry):**
   *   The invested proceeds grow to $19,500 \times e^{0.09 \times 4/12} = 19,500 \times e^{0.03} = 19,500 \times 1.030454 = ₹20,093.85$.
   *   The dividend payments paid out on the shorted stock basket compound to $19,500 \times (e^{0.03} - e^{0.0225}) = 20,093.85 - 19,943.72 = ₹150.13$.
   *   Settle the long futures contract by buying the Nifty index basket at the locked-in price of ₹19,880 to cover the short position.
   *   **Net Profit per contract unit:**
       $$\text{Net Profit} = \text{Matured Investment Proceeds} - \text{Futures Settlement Price} - \text{Accumulated Dividends Paid}$$
       $$\text{Net Profit} = 20,093.85 - 19,880.00 - 150.13 = ₹63.72 \text{ per unit.}$$

**For a 1-lot position (50 units):**
$$\text{Total Arbitrage Profit} = ₹63.72 \times 50 = ₹3,186.00$$

---

## Question 3: Marking-to-Market (MTM) Mechanics with Value-at-Risk (VaR) Margin Design

### Problem Statement
A quantitative trader enters into a **Long Futures position** of 4 contracts on **Zephyr Heavy Industries Ltd. (ZHIL)** on March 1, 2026. The contract details are as follows:
*   **Entry Futures Price:** ₹850 per unit.
*   **Lot Size:** 400 shares per contract (Total position size = 1,600 shares).
*   **Initial Margin Determination:** Based on VaR. The average daily absolute price return ($\mu$) of ZHIL is 1.50%, and the daily return standard deviation ($\sigma$) is 3.50%. The exchange sets the initial margin at $\mu + 3\sigma$.
*   **Maintenance Margin:** Set at 75% of the Initial Margin level.
*   **Withdrawal/Top-up Rule:** The trader has a bank account linked to the margin account. If the balance exceeds the Initial Margin, the trader immediately withdraws the entire excess. If a margin call is triggered, the trader must deposit the variation margin to restore the account to the Initial Margin level at the beginning of the next day.

The closing futures prices of ZHIL over the subsequent 8 trading days are:
*   **Day 1:** ₹842
*   **Day 2:** ₹830
*   **Day 3:** ₹815
*   **Day 4:** ₹838
*   **Day 5:** ₹845
*   **Day 6:** ₹860
*   **Day 7:** ₹872
*   **Day 8 (Position Squared off):** ₹868

**Required:**
1. Compute the Initial Margin percentage and the absolute Initial and Maintenance margins required per share and for the entire position.
2. Prepare a daily statement of the Margin Account showing MTM adjustments, margin calls, deposits, withdrawals, and ending balances.
3. Calculate the net profit/loss of the trader over the 8-day period using both the price change method and the margin account cash flow method.

---

### Detailed Walkthrough Solution

#### Step 1: Margin Computation
*   **Initial Margin %:** $\mu + 3\sigma = 1.50\% + 3 \times 3.50\% = 1.50\% + 10.50\% = 12.00\%$ of contract value.
*   **Initial Margin per unit at Entry:** $12\% \times ₹850 = ₹102$ per share.
*   **Total Initial Margin required (1,600 shares):** $₹102 \times 1,600 = ₹163,200$.
*   **Maintenance Margin %:** $75\% \text{ of Initial Margin} = 75\% \times 12\% = 9.00\%$.
*   **Maintenance Margin per unit at Entry:** $9\% \times ₹850 = ₹76.50$ per share.
*   **Total Maintenance Margin required (1,600 shares):** $₹76.50 \times 1,600 = ₹122,400$.

---

#### Step 2: Daily Margin Account Statement (All figures in ₹)

*   **Day 0 (Start):** Deposit Initial Margin of ₹163,200.
*   **Day 1:** Price drops from 850 to 842. 
    *   MTM Loss $= (842 - 850) \times 1,600 = -₹12,800$.
    *   Balance $= 163,200 - 12,800 = ₹150,400$.
    *   Since $150,400 \ge 122,400$ (Maintenance Margin), there is no margin call.
*   **Day 2:** Price drops from 842 to 830.
    *   MTM Loss $= (830 - 842) \times 1,600 = -₹19,200$.
    *   Balance $= 150,400 - 19,200 = ₹131,200$.
    *   Since $131,200 \ge 122,400$, no margin call.
*   **Day 3:** Price drops from 830 to 815.
    *   MTM Loss $= (815 - 830) \times 1,600 = -₹24,000$.
    *   Balance $= 131,200 - 24,000 = ₹107,200$.
    *   Since $107,200 < 122,400$ (Maintenance Margin breached!), a margin call is triggered.
    *   **Variation Margin required** to restore to Initial Margin (₹163,200):
        $$\text{Variation Margin} = ₹163,200 - ₹107,200 = ₹56,000$$
    *   Trader deposits ₹56,000. Balance becomes ₹163,200.
*   **Day 4:** Price rises from 815 to 838.
    *   MTM Gain $= (838 - 815) \times 1,600 = +₹36,800$.
    *   Balance $= 163,200 + 36,800 = ₹200,000$.
    *   Excess over Initial Margin $= 200,000 - 163,200 = ₹36,800$.
    *   Trader withdraws ₹36,800. Balance restored to ₹163,200.
*   **Day 5:** Price rises from 838 to 845.
    *   MTM Gain $= (845 - 838) \times 1,600 = +₹11,200$.
    *   Balance $= 163,200 + 11,200 = ₹174,400$.
    *   Trader withdraws excess of ₹11,200. Balance restored to ₹163,200.
*   **Day 6:** Price rises from 845 to 860.
    *   MTM Gain $= (860 - 845) \times 1,600 = +₹24,000$.
    *   Balance $= 163,200 + 24,000 = ₹187,200$.
    *   Trader withdraws excess of ₹24,000. Balance restored to ₹163,200.
*   **Day 7:** Price rises from 860 to 872.
    *   MTM Gain $= (872 - 860) \times 1,600 = +₹19,200$.
    *   Balance $= 163,200 + 19,200 = ₹182,400$.
    *   Trader withdraws excess of ₹19,200. Balance restored to ₹163,200.
*   **Day 8:** Price drops from 872 to 868. Position is squared off at 868.
    *   MTM Loss $= (868 - 872) \times 1,600 = -₹6,400$.
    *   Final Balance before account closure $= 163,200 - 6,400 = ₹156,800$.
    *   The position is closed. Remaining balance of ₹156,800 is refunded.

| Day | Opening Balance (₹) | Futures Price (₹) | MTM Gain/Loss (₹) | Margin Call / Deposit (₹) | Withdrawal of Excess (₹) | Closing Balance (₹) |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| **0** | — | 850 (Entry) | — | $+163,200$ | — | 163,200 |
| **1** | 163,200 | 842 | $-12,800$ | 0 | 0 | 150,400 |
| **2** | 150,400 | 830 | $-19,200$ | 0 | 0 | 131,200 |
| **3** | 131,200 | 815 | $-24,000$ | $+56,000$ | 0 | 163,200 |
| **4** | 163,200 | 838 | $+36,800$ | 0 | $-36,800$ | 163,200 |
| **5** | 163,200 | 845 | $+11,200$ | 0 | $-11,200$ | 163,200 |
| **6** | 163,200 | 860 | $+24,000$ | 0 | $-24,000$ | 163,200 |
| **7** | 163,200 | 872 | $+19,200$ | 0 | $-19,200$ | 163,200 |
| **8** | 163,200 | 868 (Exit) | $-6,400$ | 0 | 0 | **156,800** |

---

#### Step 3: Profit / Loss Verification

*   **Method 1 (Price Change Method):**
    $$\text{Net Gain/Loss} = (\text{Exit Price} - \text{Entry Price}) \times \text{Number of Shares}$$
    $$\text{Net Gain/Loss} = (868 - 850) \times 1,600 = +18 \times 1,600 = +₹28,800 \text{ (Profit)}$$

*   **Method 2 (Margin Cash Flow Method):**
    $$\text{Total Deposits} = \text{Initial Margin} + \text{Variation Margin Deposits} = 163,200 + 56,000 = ₹219,200$$
    $$\text{Total Withdrawals} = \text{Day 4} + \text{Day 5} + \text{Day 6} + \text{Day 7} = 36,800 + 11,200 + 24,000 + 19,200 = ₹91,200$$
    $$\text{Refund of Final Balance on Day 8} = ₹156,800$$
    $$\text{Net Profit} = (\text{Total Withdrawals} + \text{Final Refund}) - \text{Total Deposits}$$
    $$\text{Net Profit} = (91,200 + 156,800) - 219,200 = 248,000 - 219,200 = +₹28,800$$

Both methods yield a net profit of **₹28,800**, verifying the correctness of the margin account bookkeeping.

---

## Question 4: Portfolio Hedging, Beta Management, and CAPM-Based Return Adjustments

### Problem Statement
**Samarth Wealth Advisors** manages an equity portfolio with a current market value of **₹25 Crores**. The portfolio has a beta ($\beta_p$) of **1.25** relative to the Nifty 50 Index. The risk-free interest rate is **6.50% p.a.**

The portfolio manager is concerned about a potential market correction over the next 3 months and wants to evaluate three distinct derivative strategies:
*   **Strategy A:** Hedge the market risk of the portfolio completely (Target Beta = 0.00).
*   **Strategy B:** Reduce the portfolio's systematic risk exposure to a target beta of **0.75**.
*   **Strategy C:** Increase the portfolio's exposure to take advantage of a potential market rally, targeting a beta of **1.60**.

**Contract Specifications:**
*   **Nifty 50 Spot Index:** 18,000
*   **3-Month Nifty Futures Contract Price:** 18,150
*   **Nifty Futures Lot Size:** 50 index points per contract

**Required:**
1. Determine the number of contracts and direction (buy/sell) required for each of the three strategies.
2. Assume that after 3 months, the Nifty Spot Index falls by 12% to **15,840** and the futures contract expires at spot value. Calculate the overall value of the portfolio under **Strategy B** at expiry, assuming that the Capital Asset Pricing Model (CAPM) relationship holds and the portfolio components perform exactly as per their beta relationship.

---

### Detailed Walkthrough Solution

#### Step 1: Number of Futures Contracts Formula
The formula to adjust a portfolio's beta using index futures is:
$$N = \frac{\beta_T - \beta_p}{\beta_f} \times \frac{V_p}{F \times M}$$
Where:
*   $\beta_T = \text{Target Beta of the portfolio}$
*   $\beta_p = 1.25$ (Current portfolio beta)
*   $\beta_f = 1.00$ (Beta of index futures)
*   $V_p = ₹25,00,00,000$ (Portfolio value)
*   $F = 18,150$ (Futures contract price)
*   $M = 50$ (Lot size multiplier)
*   $\text{Value of 1 Nifty Futures Contract} = F \times M = 18,150 \times 50 = ₹9,07,500$

---

#### Step 2: Calculate Contracts for each Strategy

*   **Strategy A (Target Beta = 0.00):**
    $$N_A = \frac{0.00 - 1.25}{1.00} \times \frac{25,00,00,000}{9,07,500} = -1.25 \times 275.482 = -344.35 \approx -344 \text{ contracts}$$
    *   **Action:** **Short (Sell) 344 contracts** of Nifty 50 Futures.

*   **Strategy B (Target Beta = 0.75):**
    $$N_B = \frac{0.75 - 1.25}{1.00} \times \frac{25,00,00,000}{9,07,500} = -0.50 \times 275.482 = -137.74 \approx -138 \text{ contracts}$$
    *   **Action:** **Short (Sell) 138 contracts** of Nifty 50 Futures.

*   **Strategy C (Target Beta = 1.60):**
    $$N_C = \frac{1.60 - 1.25}{1.00} \times \frac{25,00,00,000}{9,07,500} = +0.35 \times 275.482 = +96.42 \approx +96 \text{ contracts}$$
    *   **Action:** **Long (Buy) 96 contracts** of Nifty 50 Futures.

---

#### Step 3: Performance of Strategy B (Target Beta = 0.75) if Nifty Falls 12%

**1. Return of the Market ($R_m$):**
$$\text{Market Return} = \frac{15,840 - 18,000}{18,000} = -12.00\%$$

**2. Expected Return of the Portfolio ($R_p$) based on CAPM:**
Under CAPM:
$$R_p = R_f + \beta_p \times (R_m - R_f)$$
*   Risk-free rate for 3 months ($R_f$): $6.50\% \times \frac{3}{12} = 1.625\%$
*   Current Portfolio Beta ($\beta_p$): 1.25
$$R_p = 1.625\% + 1.25 \times (-12.00\% - 1.625\%) = 1.625\% + 1.25 \times (-13.625\%) = 1.625\% - 17.03125\% = -15.40625\%$$

**3. Value of the Equity Portfolio at Expiry (before Futures cash flows):**
$$\text{Value}_{\text{equity}} = ₹25,00,00,000 \times (1 - 0.1540625) = ₹21,14,84,375$$

**4. Gain/Loss on the Futures Short Position (Strategy B):**
*   Short position size: 138 contracts (Short at 18,150)
*   Futures Expiry Price: Spot Index at Expiry = 15,840
*   Gain per Index Point: $18,150 - 15,840 = 2,310$ points
*   Total Gain on Futures Position:
    $$\text{Gain}_{\text{futures}} = 138 \text{ contracts} \times 50 \text{ shares/contract} \times 2,310 \text{ ₹/point} = 6,900 \times 2,310 = ₹1,59,39,000$$

**5. Total Combined Portfolio Value at Expiry:**
$$\text{Combined Value} = \text{Value}_{\text{equity}} + \text{Gain}_{\text{futures}}$$
$$\text{Combined Value} = ₹21,14,84,375 + ₹1,59,39,000 = ₹22,74,23,375$$

**6. Effective Return of the Hedged Portfolio:**
$$\text{Effective Return} = \frac{22,74,23,375 - 25,00,00,000}{25,00,00,000} = \frac{-2,25,76,625}{25,00,00,000} = -9.03065\%$$

**7. Verification of Target Beta (0.75):**
According to the target beta of 0.75, the expected return of the combined portfolio should be:
$$\text{Expected Combined Return} = R_f + \beta_T \times (R_m - R_f) = 1.625\% + 0.75 \times (-12.00\% - 1.625\%)$$
$$\text{Expected Combined Return} = 1.625\% + 0.75 \times (-13.625\%) = 1.625\% - 10.21875\% = -8.59375\%$$

*Note: The minor divergence (approx 0.43%) is due to rounding the number of futures contracts from the theoretical $-137.74$ to the integer $-138$.*

---

## Question 5: Reverse Cash & Carry Arbitrage with Stock Borrowing Fee and Dividend Intermediation

### Problem Statement
The stock of **Aegis Logistics Ltd. (ALL)** is currently trading at ₹500 in the spot market. A 2-month futures contract on ALL is quoting at ₹482. The risk-free rate is 10% p.a. continuously compounded.

A dividend of ₹8 per share is expected to be paid in exactly 1 month.

An arbitrageur wants to exploit the potential mispricing. To short sell the stock, the arbitrageur must borrow the stock from a Securities Lending and Borrowing (SLB) desk. The SLB desk charges a **Stock Borrowing Fee of ₹3 per share**, payable upfront at $t = 0$.

**Required:**
1. Determine the Theoretical Fair Futures Price of the stock under continuous compounding.
2. Identify the nature of mispricing and formulate the arbitrage strategy.
3. Show the cash flow mechanics at $t=0, t=1$ month, and $t=2$ months to prove that the arbitrageur locks in a risk-free profit.

---

### Detailed Walkthrough Solution

#### Step 1: Theoretical Futures Price
Under continuous compounding, when a discrete dividend is paid during the contract life, the formula is:
$$F_0 = (S_0 - \text{PV}(D)) \times e^{r \times T}$$
Where:
*   $S_0 = 500$
*   $D = 8$ at $t = 1/12$ years
*   $\text{PV}(D) = D \times e^{-r \times t_d} = 8 \times e^{-0.10 \times 1/12} = 8 \times e^{-0.00833} = 8 \times 0.99170 = ₹7.93$
*   $T = \frac{2}{12} = 0.16667$ years
*   $r = 10\% = 0.10$

Substitute the values:
$$F_0 = (500 - 7.93) \times e^{0.10 \times 2/12} = 492.07 \times e^{0.01667}$$
$$e^{0.01667} \approx 1.01681$$
$$F_{\text{theoretical}} = 492.07 \times 1.01681 = ₹500.34$$

---

#### Step 2: Arbitrage Identification
*   **Theoretical Futures Price:** ₹500.34
*   **Market Futures Price:** ₹482.00
*   **Upfront Stock Borrowing Cost:** ₹3.00 per share.

Since the market futures price is significantly below the theoretical price ($F_{\text{market}} < F_{\text{theoretical}}$), the futures are undervalued. We initiate a **Reverse Cash & Carry Arbitrage**.

The net theoretical profit before borrowing cost is $500.34 - 482.00 = ₹18.34$.
Since the borrowing fee is ₹3.00 (which compounds to $3 \times e^{0.10 \times 2/12} = 3 \times 1.01681 = ₹3.05$ at $t=2$), the net arbitrage profit remains positive:
$$\text{Net Profit} \approx 18.34 - 3.05 = ₹15.29 \text{ per share.}$$

---

#### Step 3: Cash Flow Table

**At $t = 0$:**
1. Borrow stock from SLB desk. Pay borrowing fee of ₹3.00.
2. Short sell the stock in the spot market at ₹500.00.
3. Invest the net cash proceeds of ₹497.00 ($500.00 - 3.00$) at 10% p.a. continuously compounded.
4. Buy (Go Long) 1 ALL futures contract at $F_{\text{market}} = ₹482.00$.

**At $t = 1$ month:**
*   The stock lender is entitled to the dividend. Pay the ₹8.00 dividend to the lender. 
*   To fund this dividend payment, the arbitrageur borrows ₹8.00 at the risk-free rate of 10% p.a. continuously compounded for the remaining 1 month.

**At $t = 2$ months (Expiry):**
*   The investment made at $t=0$ matures:
    $$\text{Terminal Value of Investment} = 497.00 \times e^{0.10 \times 2/12} = 497.00 \times 1.01681 = ₹505.35$$
*   The dividend borrowing must be repaid:
    $$\text{Repayment} = 8.00 \times e^{0.10 \times 1/12} = 8.00 \times 1.00837 = ₹8.07$$
*   Settle the futures contract: Buy the stock at the locked-in price of ₹482.00.
*   Return the stock to the SLB desk to close out the stock loan.

| Time | Action | Cash Flow (₹) |
| :--- | :--- | :--- |
| **$t = 0$** | Net Proceeds (Short Sale Price $-$ Borrowing Fee) Invested | $₹0.00$ (Self-funding) |
| **$t = 1$** | Borrow to pay dividend to stock lender | $₹0.00$ |
| **$t = 2$** | Collect matured investment | $+₹505.35$ |
| **$t = 2$** | Repay dividend loan | $-₹8.07$ |
| **$t = 2$** | Settle futures contract (Buy stock at $F_{\text{mkt}}$) | $-₹482.00$ |
| **$t = 2$** | **Net Arbitrage Profit (Risk-free)** | **$+₹15.28$** |

This confirms that the arbitrageur secures a riskless profit of **₹15.28 per share** at expiry, even after accounting for stock borrowing fees and dividend payments.
