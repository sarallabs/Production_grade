# Derivatives - Futures (Question Bank)

This question bank contains conceptual questions, comparative analysis, and step-by-step numerical problems designed for beginner-level understanding of financial futures.

---

## Part A: Conceptual Questions

### Question 1: What is a derivative? Explain with a simple example.
**Answer:**
A **derivative** is a financial contract whose value is not independent; rather, it is derived from or linked to the value of an underlying asset, such as a stock, bond, commodity, currency, or market index. 

*   **Simple Example:** Think of curd (yogurt) and milk. Curd is a derivative product of milk. The price and value of curd are directly dependent on the price of milk (the underlying asset). If the price of milk goes up, the price of curd will also rise. Similarly, a Nifty Futures contract is a derivative whose price is derived from the level of the Nifty 50 Index.

---

### Question 2: What is the "underlying asset" in a derivative contract? List its key features.
**Answer:**
The **underlying asset** is the primary financial instrument, commodity, or index on which a derivative contract is based. It is the source from which the derivative extracts its value.

**Key Features of the Underlying Asset:**
1.  **Price Driver:** A change in the price of the underlying asset results in a simultaneous change in the price of the derivative contract.
2.  **No Independent Value:** Without the underlying asset, the derivative has no value or existence.
3.  **Diverse Types:** The underlying can be a tangible asset (like gold, wheat, crude oil) or an intangible asset (like equity shares, interest rates, stock indices, or even weather indexes).
4.  **Basis of Settlement:** At the maturity of the contract, the final gain or loss is determined by comparing the contract price with the spot price of the underlying asset.

---

### Question 3: Briefly explain the roles of Hedgers, Speculators, and Arbitrageurs in the futures market.
**Answer:**
*   **Hedgers:** Their objective is **risk reduction**. They already hold or expect to hold an exposure in the cash market (e.g., owning stock or physical gold) and use futures to lock in prices and protect themselves against adverse price movements.
*   **Speculators:** Their objective is **profit maximization** by taking on risk. They do not own the underlying asset. Instead, they study market trends, form a view (bullish or bearish), and take leveraged positions to benefit from price movements.
*   **Arbitrageurs:** Their objective is **riskless profit**. They monitor different markets (e.g., cash market and futures market) to find pricing discrepancies. They simultaneously buy in the cheaper market and sell in the dearer market to lock in a risk-free profit.

---

### Question 4: Distinguish between a Forward Contract and a Futures Contract.
**Answer:**

| Feature | Forward Contract | Futures Contract |
| :--- | :--- | :--- |
| **Trading Platform** | Over-the-Counter (OTC) - direct between parties. | Organized Stock Exchange. |
| **Standardization** | Customized (terms are tailored to needs). | Standardized (fixed lot size, expiry dates). |
| **Counterparty Risk** | High (risk of default by either party). | Negligible (guaranteed by the clearing corporation). |
| **Margins** | Not mandatory; depends on bilateral agreement. | Mandatory (Initial, Maintenance, and Variation margins). |
| **Settlement** | Done only on the maturity date. | Settled daily via the Mark-to-Market (MTM) process. |
| **Liquidity** | Poor (difficult to close out early). | High (easy to enter or exit at any time). |

---

### Question 5: Define the terms: Initial Margin, Maintenance Margin, and Variation Margin.
**Answer:**
*   **Initial Margin:** The minimum upfront cash or collateral deposit required from both the buyer and the seller to open a futures position. It is calculated using Value-at-Risk (VaR) to cover the maximum likely daily price movement.
*   **Maintenance Margin:** The minimum balance that must be maintained in the margin account at the end of any trading day. It is usually set lower than the Initial Margin (e.g., 75% of Initial Margin).
*   **Variation Margin:** The additional cash that a trader must deposit into the margin account when the balance falls below the Maintenance Margin limit. This deposit must restore the account balance back to the **Initial Margin** level (not just to the Maintenance Margin level).

---

### Question 6: What is "Marking-to-Market" (MTM), and why is it performed daily?
**Answer:**
**Marking-to-Market (MTM)** is the process of revaluing an open futures position at the end of each trading day based on the daily closing price determined by the exchange. 
*   **How it works:** The daily gain or loss is calculated by comparing the closing price with the previous day's closing price (or the entry price if opened today). The gain is credited to the gainer's margin account, and the loss is debited from the loser's margin account.
*   **Rationale:** Since futures are highly leveraged, losses can accumulate quickly. If the exchange waited until maturity (e.g., 3 months) to settle, the losing party might default. Daily MTM prevents the accumulation of large unpaid losses, maintaining market integrity.

---

## Part B: Simple Numerical Problems (Formula Recall & Application)

### Question 7: Calculate the theoretical 3-month futures price of Stock A, which is currently quoting in the cash market at ₹800. The risk-free rate of interest is 12% per annum. Assume no dividends are expected before expiry. (Use Simple Interest).
**Solution:**
**Given:**
*   Spot Price ($S$) = ₹800
*   Risk-free interest rate ($r$) = 12% p.a.
*   Time to expiry ($T$) = 3 months

**Formula:**
$$F = S \times \left(1 + \frac{r \times T}{1200}\right)$$

**Calculation:**
$$F = 800 \times \left(1 + \frac{12 \times 3}{1200}\right)$$
$$F = 800 \times \left(1 + \frac{36}{1200}\right)$$
$$F = 800 \times (1 + 0.03)$$
$$F = 800 \times 1.03 = ₹824$$

**Answer:**
The theoretical 3-month futures price of Stock A is **₹824**.

---

### Question 8: A stock is currently trading at ₹1,200. The risk-free rate of interest is 10% per annum. The stock is expected to pay a dividend of ₹15 in two months. Find the theoretical price of a 3-month futures contract. (Use Simple Interest).
**Solution:**
**Given:**
*   Spot Price ($S$) = ₹1,200
*   Risk-free interest rate ($r$) = 10% p.a.
*   Time to expiry ($T$) = 3 months
*   Expected Dividend ($D$) = ₹15 (payable within the 3-month tenure)

**Formula:**
$$F = S \times \left(1 + \frac{r \times T}{1200}\right) - D$$

**Calculation:**
$$F = 1200 \times \left(1 + \frac{10 \times 3}{1200}\right) - 15$$
$$F = 1200 \times \left(1 + \frac{30}{1200}\right) - 15$$
$$F = 1200 \times (1 + 0.025) - 15$$
$$F = 1200 \times 1.025 - 15$$
$$F = 1230 - 15 = ₹1,215$$

**Answer:**
The theoretical 3-month futures price is **₹1,215**.

---

### Question 9: The Nifty 50 Index is currently trading at 18,000. The risk-free rate of interest is 8% per annum, and the annualized dividend yield on the index is 2% per annum. Find the theoretical price of a 2-month Nifty futures contract. (Use Simple Interest).
**Solution:**
**Given:**
*   Index Spot Price ($S$) = 18,000
*   Risk-free interest rate ($r$) = 8% p.a.
*   Dividend Yield ($d$) = 2% p.a.
*   Time to expiry ($T$) = 2 months

**Formula:**
$$F = S \times \left(1 + \frac{(r - d) \times T}{1200}\right)$$

**Calculation:**
$$F = 18000 \times \left(1 + \frac{(8 - 2) \times 2}{1200}\right)$$
$$F = 18000 \times \left(1 + \frac{6 \times 2}{1200}\right)$$
$$F = 18000 \times \left(1 + \frac{12}{1200}\right)$$
$$F = 18000 \times (1 + 0.01)$$
$$F = 18000 \times 1.01 = 18,180$$

**Answer:**
The theoretical 2-month Nifty Index futures price is **18,180**.

---

### Question 10: An investor buys 1 lot of Stock B futures (Lot size = 500 shares) at ₹400. The broker requires an Initial Margin of 15% of the contract value and a Maintenance Margin of 70% of the initial margin.
1.  **Calculate the Initial Margin and Maintenance Margin amounts.**
2.  **On Day 1, the futures price closes at ₹380. Determine the Mark-to-Market (MTM) loss, the closing balance in the margin account, and whether a margin call is made.**
3.  **If a margin call is made, how much Variation Margin must the investor deposit?**

**Solution:**

**1. Margins Calculation:**
*   Contract Value = $\text{Price} \times \text{Lot Size} = 400 \times 500 = ₹2,00,000$
*   Initial Margin (15%) = $2,00,000 \times 15\% = ₹30,000$
*   Maintenance Margin (70% of Initial Margin) = $30,000 \times 70\% = ₹21,000$

**2. Day 1 Close Analysis:**
*   Price falls from ₹400 to ₹380.
*   MTM Profit/Loss = $(\text{Closing Price} - \text{Entry Price}) \times \text{Lot Size}$
    $$\text{MTM Loss} = (380 - 400) \times 500 = -₹10,000 \text{ (Loss)}$$
*   Closing Balance in Margin Account = $\text{Initial Margin} - \text{MTM Loss}$
    $$\text{Closing Balance} = 30,000 - 10,000 = ₹20,000$$
*   **Margin Call Trigger Check:** 
    Since the Closing Balance (₹20,000) is **less than** the Maintenance Margin limit (₹21,000), a **Margin Call is triggered**.

**3. Variation Margin Calculation:**
*   When a margin call is triggered, the balance must be restored to the **Initial Margin level** (₹30,000).
*   Variation Margin required = $\text{Initial Margin} - \text{Closing Balance}$
    $$\text{Variation Margin} = 30,000 - 20,000 = ₹10,000$$
*   The investor must deposit **₹10,000** in cash.

**Summary of Answers:**
1.  Initial Margin: **₹30,000**; Maintenance Margin: **₹21,000**.
2.  MTM Loss is **₹10,000**; Closing Balance is **₹20,000**; **Yes**, a margin call is made because ₹20,000 is below the maintenance limit of ₹21,000.
3.  Variation Margin required: **₹10,000**.