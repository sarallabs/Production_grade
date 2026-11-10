# Derivatives - Futures

## 1. Introduction to Derivatives and Futures
A **derivative** is a financial contract whose value is derived from the performance of an underlying asset, index, or rate. The underlying asset can be a share, bond, commodity, currency, interest rate, or market index. 

### 1.1 The Underlying Asset
The underlying asset is the anchor of any derivative instrument. 
* **Value Linkage:** The derivative has no value in isolation. Its value fluctuates in response to movements in the spot price of the underlying asset.
* **Daily Settlement:** Positions are marked-to-market daily against the price of the underlying asset.
* **Types of Underlyings:**
  * **Financial Assets:** Equity shares, government bonds, foreign currencies, stock indices.
  * **Physical Assets (Commodities):** Gold, agricultural products, crude oil.

### 1.2 Market Participants
* **Hedgers:** Individuals or corporations who have an exposure to the underlying asset and use derivatives to reduce or eliminate the risk of adverse price movements. For example, a company with foreign currency receivables will sell currency futures to lock in the exchange rate.
* **Speculators:** Traders who take positions in derivatives to profit from anticipated price movements, accepting risk in exchange for potential returns. They leverage their capital because derivatives require only a fraction of the total contract value as margin.
* **Arbitrageurs:** Traders who seek to exploit temporary mispricing between the cash (spot) market and the futures market, or between different exchanges, to make risk-free profits.
* **Dealers/Market Makers:** Entities that provide liquidity to the market by quoting two-way (bid and ask) prices. They manage their risk exposure through offsetting contracts.

---

## 2. Cash Market vs. Derivatives Market
To understand futures, it is crucial to distinguish them from cash transactions:

| Feature | Cash (Spot) Market | Derivatives (Futures) Market |
| :--- | :--- | :--- |
| **Transaction Basis** | Immediate exchange of ownership for full cash value. | Agreement to buy/sell at a future date at a pre-agreed price. |
| **Transaction Size** | Any quantity can be traded (even 1 share). | Standardized contract sizes known as "lots" (e.g., 50 shares). |
| **Capital Outlay** | Requires payment of the full asset price ($100\%$ capital). | Requires only a small percentage as margin ($10\% - 20\%$). |
| **Ownership Rights** | Buyer gains shareholder rights (voting, dividends, bonuses). | Holder has no shareholder rights or ownership until delivery. |
| **Contract Expiration** | Shares can be held indefinitely (for life). | Contracts have fixed expiration dates (usually 1, 2, or 3 months). |
| **Counterparty Risk** | Settled quickly through clearing corporations; minimal risk. | Standardized exchanges eliminate risk via margins and clearing house guarantees. |

---

## 3. Forward vs. Futures Contracts
Forwards and futures are both agreements to buy or sell an asset at a future date at a fixed price. However, they operate under different mechanisms:

1. **Exchange-Traded vs. OTC:** Forwards are Over-the-Counter (OTC) agreements negotiated directly between two parties. Futures are standardized contracts traded on regulated exchanges.
2. **Standardization:** Futures have standardized lot sizes, expiries, tick sizes, and delivery terms. Forwards are highly customized.
3. **Daily MTM Settlement:** Futures undergo daily mark-to-market settlement, where gains/losses are calculated and settled daily. Forwards are settled only at maturity.
4. **Counterparty Risk:** A futures exchange eliminates default risk by acting as the clearing house (seller to every buyer and buyer to every seller) backed by margin pools. Forwards are subject to significant counterparty default risk.

---

## 4. Margin System and Mark-to-Market (MTM)
The exchange uses a margin system to ensure the safety and integrity of the derivatives market.

### 4.1 Types of Margins
* **Initial Margin (IM):** The upfront capital required to open a futures position. It is calculated using the Value-at-Risk (VaR) framework, aiming to cover the maximum expected daily loss at a $99.7\%$ confidence level. 
  $$\text{Initial Margin \%} \approx \text{Daily Mean Return } (\mu) + 3 \times \text{Daily Return Standard Deviation } (\sigma)$$
* **Maintenance Margin (MM):** The minimum margin level that must be maintained in the account at the end of any trading day. It is usually set at $70\% - 80\%$ of the Initial Margin.
* **Variation Margin:** If MTM losses cause the margin account balance to fall below the Maintenance Margin, the broker issues a **Margin Call**. The investor must deposit cash (variation margin) to bring the balance back to the **Initial Margin** level.

### 4.2 Mark-to-Market (MTM) Mechanism
At the end of every trading day, the exchange determines a closing price for each futures contract. All open positions are revalued against this closing price:
* **Long Position MTM:** $\text{Daily Gain/Loss} = (\text{Closing Futures Price}_{\text{Today}} - \text{Closing Futures Price}_{\text{Yesterday}}) \times \text{Lot Size}$
* **Short Position MTM:** $\text{Daily Gain/Loss} = (\text{Closing Futures Price}_{\text{Yesterday}} - \text{Closing Futures Price}_{\text{Today}}) \times \text{Lot Size}$

Gains are credited to the investor's margin account, and losses are debited. Because a gain for one party is exactly equal to the loss of the counterparty, futures trading is a **zero-sum game**.

---

## 5. Pricing of Stock Futures
The pricing of futures is based on the **Cost of Carry Model**. The model assumes that buying a futures contract is equivalent to borrowing money to buy the underlying stock today and holding it until the futures contract expires.

### 5.1 No-Dividend Case
If the underlying stock does not pay a dividend during the life of the futures contract:
* **Simple Interest Model (Exchanges/Standard Math):**
  $$F_0 = S_0 \times \left(1 + r \times \frac{T}{12}\right) \quad \text{or} \quad F_0 = S_0 + S_0 \times r \times \frac{T}{12 \times 100}$$
  Where:
  * $F_0$: Theoretical Futures Price
  * $S_0$: Current Spot Price of the stock
  * $r$: Risk-free interest rate per annum (in decimals or percentage as indicated)
  * $T$: Time to expiration in months (or days as $T/365$)

* **Continuous Compounding Model (Black-Scholes/Institutional):**
  $$F_0 = S_0 \times e^{r \times T}$$
  Where $T$ is the time to expiration in years ($T = \text{Months}/12$ or $T = \text{Days}/365$).

### 5.2 Discrete Dividend Case
If the stock pays a dividend ($D$) at some time $t_d$ before expiration:
* **Simple Interest Model:**
  Since the futures buyer does not receive the dividend, the seller reduces the futures price by the value of the dividend. However, because the dividend is received at time $t_d$, it earns interest for the remaining period $(T - t_d)$:
  $$F_0 = S_0 \times \left(1 + r \times \frac{T}{12}\right) - D \times \left(1 + r \times \frac{T - t_d}{12}\right)$$
  *(If the dividend is paid at the very end of the contract, i.e., $t_d = T$, then the future value of the dividend is just $D$.)*

* **Continuous Compounding Model:**
  $$F_0 = (S_0 - PV(D)) \times e^{r \times T}$$
  Where $PV(D)$ is the present value of the dividend compounded continuously at the risk-free rate from the payment date to today:
  $$PV(D) = D \times e^{-r \times t_d}$$
  Hence,
  $$F_0 = (S_0 - D \times e^{-r \times t_d}) \times e^{r \times T}$$

### 5.3 Continuous Dividend Yield Case
If a stock or portfolio pays dividends continuously at a constant yield rate of $d$ per annum:
$$F_0 = S_0 \times e^{(r - d) \times T}$$

---

## 6. Pricing of Index Futures
Stock indices (e.g., Nifty 50, Sensex) represent a portfolio of stocks. While individual stock dividends are discrete and known, index dividends are treated as a continuous flow represented by a **Dividend Yield ($d$)**.

### 6.1 Formula
The continuous compounding formula is:
$$F_0 = S_0 \times e^{(r - d) \times T}$$
Where:
* $S_0$: Current Spot Index Value
* $r$: Risk-free rate per annum (continuously compounded)
* $d$: Annualized dividend yield of the index (continuously compounded)
* $T$: Time to expiration in years

### 6.2 Simple Interest Interpretation
If simple interest is used:
$$F_0 = S_0 \times \left(1 + (r - d) \times \frac{T}{12}\right)$$

### 6.3 Understanding Dividend Yield ($d$)
The dividend yield $d$ is stated on an annual basis.
* **Historical/Expected Repetition:** To price index futures, we require future dividend estimates. If these are unavailable, we assume that the historical dividend yield for the corresponding period in the previous year will repeat.
* **Monthly Average:** If the dividend yield varies, we calculate the average dividend yield across the months of the contract. For example, if a 3-month contract spans August, September, and October, and the yields in the previous year were $2\%$, $3\%$, and $1\%$, the average yield applied is $(2\% + 3\% + 1\%)/3 = 2\%$.

---

## 7. Arbitrage in Futures Markets
Arbitrage is the practice of exploiting a difference in price between two or more markets to earn a riskless profit with zero net investment.

### 7.1 Cash and Carry Arbitrage (When $F_{\text{Actual}} > F_{\text{Theoretical}}$)
If the actual market futures price is higher than its theoretical value, the futures contract is overpriced. An arbitrageur will sell the futures and buy the stock.

**Steps:**
1. **Today ($T=0$):**
   * Borrow money (equal to the spot price $S_0$) at the risk-free rate $r$.
   * Buy the stock in the spot market at $S_0$.
   * Sell the futures contract at $F_{\text{Actual}}$.
   * Net Cash Flow = $0$.
2. **During the contract:**
   * Collect any dividends ($D$) paid by the stock and invest them at the risk-free rate.
3. **At Expiry ($T$):**
   * Deliver the stock to settle the short futures position and receive $F_{\text{Actual}}$.
   * Collect the matured dividend investments.
   * Repay the borrowed principal plus interest.
   * **Arbitrage Profit** = Cash Inflow - Cash Outflow = $(F_{\text{Actual}} + \text{Future Value of Dividends}) - (\text{Principal} + \text{Interest})$.

### 7.2 Reverse Cash and Carry Arbitrage (When $F_{\text{Actual}} < F_{\text{Theoretical}}$)
If the actual market futures price is lower than its theoretical value, the futures contract is underpriced. An arbitrageur will buy the futures and short sell the stock.

**Steps:**
1. **Today ($T=0$):**
   * Short-sell the stock in the spot market at $S_0$.
   * Invest the short-sale proceeds at the risk-free rate $r$.
   * Buy the futures contract at $F_{\text{Actual}}$.
   * Net Cash Flow = $0$.
2. **During the contract:**
   * Pay any dividends ($D$) declared on the shorted stock to the lender of the shares.
3. **At Expiry ($T$):**
   * Collect the matured investment (sale proceeds + interest).
   * Pay the accumulated dividends.
   * Buy the stock at the pre-committed futures price $F_{\text{Actual}}$ to return the shares to the lender.
   * **Arbitrage Profit** = (Matured Investment - Accumulated Dividends) - $F_{\text{Actual}}$.

### 7.3 Market Frictions and Transaction Costs
In the real world, arbitrage profits are limited by transaction costs:
* **Brokerage and Commissions:** Incurred on buying and selling spot/futures.
* **Securities Transaction Tax (STT):** Imposed on stock transactions.
* **Stock Borrowing/Lending Fees:** Incurred during short sales in reverse cash-and-carry.
* **Financing Margins:** Borrowing costs may be higher than lending rates, creating a bid-ask spread on interest rates.
Arbitrage is only viable if the mispricing exceeds the total transaction and financing costs.

---

## 8. Forward and Futures Prices Relationship
* **Interest Rate Certainty:** If interest rates are constant and certain over time, futures and forward prices will be exactly equal.
* **Uncertain Interest Rates:**
  * If futures prices are **positively correlated** with interest rates: Futures price will exceed the forward price ($F_{\text{futures}} > F_{\text{forward}}$). This is because when prices rise, the long position receives MTM gains which can be reinvested at higher interest rates. When prices fall, losses are funded at lower interest rates.
  * If futures prices are **negatively correlated** with interest rates: Futures price will be lower than the forward price ($F_{\text{futures}} < F_{\text{forward}}$).
  * If futures prices are **uncorrelated** with interest rates: $F_{\text{futures}} = F_{\text{forward}}$.

---

## 9. Key Mathematical Summary

| Target | Simple Interest Formula | Continuous Compounding Formula |
| :--- | :--- | :--- |
| **Futures Price (No Dividend)** | $F_0 = S_0 \times \left(1 + r \times \frac{T}{12}\right)$ | $F_0 = S_0 \times e^{r \times T}$ |
| **Futures Price (Discrete Dividend $D$ at time $t_d$)** | $F_0 = S_0 \times \left(1 + r \times \frac{T}{12}\right) - D \times \left(1 + r \times \frac{T - t_d}{12}\right)$ | $F_0 = (S_0 - D \times e^{-r \times t_d}) \times e^{r \times T}$ |
| **Futures Price (Continuous Dividend Yield $d$)** | $F_0 = S_0 \times \left(1 + (r - d) \times \frac{T}{12}\right)$ | $F_0 = S_0 \times e^{(r - d) \times T}$ |
| **Spot Price (given Futures Price)** | $S_0 = \frac{F_0 + D}{1 + r \times \frac{T}{12}}$ | $S_0 = F_0 \times e^{-r \times T} + PV(D)$ |
