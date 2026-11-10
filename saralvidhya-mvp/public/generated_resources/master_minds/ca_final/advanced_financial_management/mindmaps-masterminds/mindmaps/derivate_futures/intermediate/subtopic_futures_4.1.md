# Sub-Topic 4.1: Pricing Methods

> **Reference:** Page 7, Page 10, Page 11

---

### 📋 Summary View

#### 🔸 Contango Market Structure
- **Concept Summary:** Contango is a market condition where the futures price exceeds the spot price ($F_0 > S_0$), reflecting positive carrying costs.
- **Formula/Rule:** Contango: Forward price > Spot price (F > S).
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Backwardation Market Structure
- **Concept Summary:** Backwardation is a market condition where the spot price exceeds the futures price ($F_0 < S_0$), typically caused by short-term supply shortages.
- **Formula/Rule:** Backwardation: Forward price < Spot price (F < S).
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Cost of Carry Fundamentals
- **Concept Summary:** The futures price is determined by adding the carrying cost (interest, storage, insurance) to the spot price of the underlying asset.
- **Formula/Rule:** Future Price (F) = Spot Price (S) + Cost of Carry (C).
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Simple Interest Formula
- **Concept Summary:** The simple interest cost of carry formula calculates the futures price by adding the linear interest cost over the contract term to the spot price.
- **Formula/Rule:** F = S + (S * r * T)/12 (Simple Interest).
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Continuous Compounding Formula
- **Concept Summary:** The continuous compounding formula prices futures by compounding the interest rate continuously over the contract duration.
- **Formula/Rule:** F = S * e^(rT) (Continuous Compounding).
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Adjusting for Dividends Paid Before Expiry
- **Concept Summary:** When a stock pays a dividend before expiry, the futures price is adjusted downward by subtracting the dividend amount.
- **Formula/Rule:** If dividend (D) is paid before expiry: F = S + Cost of Carry - D.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Relevance of Dividend Timing
- **Concept Summary:** Only dividends with ex-dividend dates falling on or before the contract expiry date are adjusted in the futures pricing model.
- **Formula/Rule:** Dividend is relevant only if paid on or before expiry.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Index Dividends and Dividend Yield
- **Concept Summary:** Index futures pricing uses the index's annualized dividend yield $d$ to represent dividends as a continuous flow.
- **Formula/Rule:** Use Dividend Yield (d) instead of specific dividend amount.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Index Futures Pricing Formula
- **Concept Summary:** The index futures pricing formula compounds the spot price at the net interest rate minus the dividend yield continuously over the contract duration.
- **Formula/Rule:** F = S * e^((r-d)T).
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

#### 🔸 Net Cost of Carry Definition
- **Concept Summary:** The Net Cost of Carry for an index is the risk-free rate minus the dividend yield ($r - d$).
- **Formula/Rule:** Net Cost of Carry = r - d.
- **Application Context:** Traded on Indian exchanges (NSE/BSE/MCX) with standard contract specifications (Nifty lot size of 25, Bank Nifty lot size of 15).

---

### 🔍 Detailed View

#### 🔸 Contango Market Structure
In a Contango market, the forward curve slopes upward over time. This is the typical state for assets that are expensive to store or carry. The relationship is:
$$F_t = S_t (1 + r \times T) + \text{Storage Costs}$$
**Worked Example:**
Spot Crude Oil = $\text{₹}6,500$ per barrel.
Storage and Insurance Cost = $\text{₹}50$ per month.
Interest Rate = 6% per annum.
1-Month Futures Price ($F_{\text{1m}}$) = $6,500 + (6,500 \times 0.06 \times \frac{1}{12}) + 50 = 6,500 + 32.50 + 50 = \text{₹}6,582.50$.
Since $6,582.50 > 6,500$, the market is in Contango.

#### 🔸 Backwardation Market Structure
In a Backwardation market, the forward curve slopes downward over time. This happens when the demand for immediate delivery of the physical asset is high. The discount of the futures price relative to spot is driven by a high convenience yield (the benefit of holding the physical asset):
$$F_t = S_t (1 + r \times T) - \text{Convenience Yield}$$
If the convenience yield exceeds the interest and storage costs, the futures price falls below the spot price.

#### 🔸 Cost of Carry Fundamentals
The cost of carry model is the foundation of futures pricing. It states that the futures price $F$ must equal the spot price $S$ plus the net cost of holding the asset to maturity $C$:
$$F = S + C$$
If $F > S + C$, an arbitrageur can make risk-free profits by buying spot and selling futures. If $F < S + C$, they can reverse the trade. For financial assets, the carrying cost $C$ is primarily the interest expense on the capital used to buy the asset.

#### 🔸 Simple Interest Formula
The simple interest formula is:
$$F = S \left(1 + \frac{r \times T}{12}\right)$$
where $S$ is the spot price, $r$ is the annual interest rate, and $T$ is the time to maturity in months.
**Worked Numerical Example (Nifty Lot Size = 25):**
Spot Price ($S$) = $\text{₹}22,000$.
Interest Rate ($r$) = 8% per annum (0.08).
Time to Maturity ($T$) = 3 months.
Futures Price ($F$) = $22,000 \left(1 + \frac{0.08 \times 3}{12}\right) = 22,000 \times (1 + 0.02) = \text{₹}22,440$.
Contract Value = $22,440 \times 25 = \text{₹}5,61,000$.

#### 🔸 Continuous Compounding Formula
The continuous compounding formula is:
$$F = S \times e^{rT}$$
where $S$ is the spot price, $r$ is the continuously compounded risk-free rate, $T$ is the time to maturity in years, and $e$ is Euler's constant (~2.71828).
**Worked Numerical Example (Bank Nifty Lot Size = 15):**
Spot Price ($S$) = $\text{₹}48,000$.
Interest Rate ($r$) = 6% per annum (0.06).
Time to Maturity ($T$) = 60 days ($60/365 \approx 0.1644$ years).
Futures Price ($F$) = $48,000 \times e^{0.06 \times 0.1644} = 48,000 \times e^{0.00986} \approx 48,000 \times 1.0099 = \text{₹}48,475.20$.
Contract Value = $48,475.20 \times 15 = \text{₹}7,27,128$.

#### 🔸 Adjusting for Dividends Paid Before Expiry
The dividend adjustment formula using simple interest is:
$$F = S \left(1 + \frac{r \times T}{12}\right) - D$$
where $D$ is the dividend value at the ex-dividend date.
**Worked Numerical Example:**
Spot Price ($S$) of a stock = $\text{₹}1,500$.
Interest Rate ($r$) = 10% per annum.
Expiry = 2 months.
Dividend ($D$) of $\text{₹}20$ is paid 1 month from now.
Futures Price ($F$) = $1,500 \left(1 + \frac{0.10 \times 2}{12}\right) - 20 = 1,500 \times (1.0167) - 20 = 1,525 - 20 = \text{₹}1,505$.

#### 🔸 Relevance of Dividend Timing
Dividends affect futures pricing because they cause the spot price to drop. This drop only affects the futures contract if it occurs during the contract's life:
**Ex-Date $\le$ Expiry**: The spot price will drop before the contract matures. The futures price must reflect this drop, so the dividend is subtracted.
**Ex-Date $>$ Expiry**: The contract matures and settles before the spot price drops. The futures price is unaffected, and the dividend is ignored in the pricing model.

#### 🔸 Index Dividends and Dividend Yield
Because an index represents a diversified basket of stocks paying dividends throughout the year, dividends are modeled as a continuous yield $d$ rather than discrete payments. This dividend yield is expressed as an annual percentage of the index value (e.g., $d = 0.015$ for a 1.5% yield). The yield acts as a continuous offset to the interest rate in the cost of carry model.

#### 🔸 Index Futures Pricing Formula
The index futures pricing formula is:
$$F = S \times e^{(r-d)T}$$
where $S$ is the index spot price, $r$ is the risk-free rate, $d$ is the index dividend yield, and $T$ is the time to maturity in years.
**Worked Numerical Example:**
Index Spot ($S$) = 22,000.
Risk-Free Rate ($r$) = 7% per annum (0.07).
Dividend Yield ($d$) = 1.5% per annum (0.015).
Time to Maturity ($T$) = 30 days ($30/365 \approx 0.0822$ years).
Futures Price ($F$) = $22,000 \times e^{(0.07 - 0.015) \times 0.0822} = 22,000 \times e^{0.055 \times 0.0822} = 22,000 \times e^{0.004521} \approx 22,000 \times 1.00453 = 22,099.66$.
Nifty Futures Price $\approx \text{₹}22,100$.

#### 🔸 Net Cost of Carry Definition
The Net Cost of Carry represents the net cost of holding the asset over the contract period. It is defined as:
$$\text{Net Cost of Carry} = r - d$$
If $r > d$, the net cost of carry is positive, and the futures price will be higher than the spot price (Contango).
If $r < d$, the net cost of carry is negative, and the futures price will be lower than the spot price (Backwardation).

---

### 🎴 Flashcards

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Contango is a market condition where the futures price exceeds the spot price ($F_0 > S_0$), reflecting positive carrying costs.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Backwardation is a market condition where the spot price exceeds the futures price ($F_0 < S_0$), typically caused by short-term supply shortages.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The futures price is determined by adding the carrying cost (interest, storage, insurance) to the spot price of the underlying asset.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The simple interest cost of carry formula calculates the futures price by adding the linear interest cost over the contract term to the spot price.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The continuous compounding formula prices futures by compounding the interest rate continuously over the contract duration.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> When a stock pays a dividend before expiry, the futures price is adjusted downward by subtracting the dividend amount.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Only dividends with ex-dividend dates falling on or before the contract expiry date are adjusted in the futures pricing model.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Index futures pricing uses the index's annualized dividend yield $d$ to represent dividends as a continuous flow.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The index futures pricing formula compounds the spot price at the net interest rate minus the dividend yield continuously over the contract duration.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The Net Cost of Carry for an index is the risk-free rate minus the dividend yield ($r - d$).
</details>

<!-- CONCEPTS: ./concept_futures_40.md, ./concept_futures_41.md, ./concept_futures_42.md, ./concept_futures_43.md, ./concept_futures_44.md, ./concept_futures_45.md, ./concept_futures_46.md, ./concept_futures_47.md, ./concept_futures_48.md, ./concept_futures_49.md -->