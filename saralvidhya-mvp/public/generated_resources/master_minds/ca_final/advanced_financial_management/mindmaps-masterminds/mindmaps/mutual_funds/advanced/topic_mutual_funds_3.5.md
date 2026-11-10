# Topic 3.5: Performance Measurement

---

### 📋 Summary View

### 🔹 Sub-topic: Ratios

#### 🔸 Sharpe Ratio
- **Strategic Context:** **Concept Summary:** Measures the risk-adjusted excess return per unit of total risk (Standard Deviation).
**Key Takeaway:** High Sharpe ratio indicates strong manager skill in generating return relative to portfolio volatility.
**Analogy:** A driver who maintains a steady high speed without erratic steering.
- **Quantitative Model:** No specific quantitative model details.
- **Risk/Opportunity:** No specific risk/opportunity details.

#### 🔸 Treynor Ratio
- **Strategic Context:** **Concept Summary:** Measures the risk-adjusted excess return per unit of systematic risk (Beta).
**Key Takeaway:** Used for evaluating well-diversified portfolios where unsystematic risk has been eliminated.
**Analogy:** Evaluating a ship's speed relative only to the ocean current resistance, ignoring wind drag.
- **Quantitative Model:** No specific quantitative model details.
- **Risk/Opportunity:** No specific risk/opportunity details.

#### 🔸 Jensen's Alpha
- **Strategic Context:** **Concept Summary:** Jensen's Alpha measures excess return over CAPM expectations, while the Brinson-Hood-Beebower (BHB) model attributes active returns into allocation, selection, and interaction effects.
**Key Takeaway:** Decomposes portfolio performance to identify the source of manager outperformance.
**Analogy:** Analyzing a company's profit growth to determine if it was driven by market growth, operational cost cuts, or price increases.
- **Quantitative Model:** No specific quantitative model details.
- **Risk/Opportunity:** No specific risk/opportunity details.

### 🔹 Sub-topic: Hedge Funds vs. Mutual Funds

#### 🔸 Regulation Differences
- **Strategic Context:** **Concept Summary:** Mutual funds are retail products under strict SEBI oversight, while Hedge Funds (AIFs) are private placement vehicles with flexible rules.
**Key Takeaway:** Mutual funds prioritize investor protection; Hedge Funds prioritize operational flexibility.
**Analogy:** A public food safety license versus a private dinner club.
- **Quantitative Model:** No specific quantitative model details.
- **Risk/Opportunity:** No specific risk/opportunity details.

#### 🔸 Investment Strategy
- **Strategic Context:** **Concept Summary:** Mutual funds are generally long-only directional strategies, whereas Hedge Funds employ long-short, arbitrage, macro, and leveraged derivative strategies.
**Key Takeaway:** Hedge Funds aim for absolute returns; Mutual funds target relative outperformance of benchmarks.
**Analogy:** A passenger airliner flying in a straight path versus a military fighter jet executing complex maneuvers.
- **Quantitative Model:** No specific quantitative model details.
- **Risk/Opportunity:** No specific risk/opportunity details.

#### 🔸 Fee Structure
- **Strategic Context:** **Concept Summary:** Mutual funds charge a simple annual management fee (TER), while Hedge Funds charge both a management fee and a performance fee.
**Key Takeaway:** Hedge Funds utilize incentive fees to align manager interests, but are much costlier.
**Analogy:** A broker who charges a flat flat rate versus a consultant who takes a percentage of business profits.
- **Quantitative Model:** No specific quantitative model details.
- **Risk/Opportunity:** No specific risk/opportunity details.

#### 🔸 Information Disclosure
- **Strategic Context:** **Concept Summary:** Mutual funds require high transparency and frequent reporting, while Hedge Funds maintain secrecy to protect proprietary trading algorithms.
**Key Takeaway:** Retail transparency vs. institutional confidentiality.
**Analogy:** A public listed company publishing quarterly reports versus a family partnership disclosing statements only to partners.
- **Quantitative Model:** No specific quantitative model details.
- **Risk/Opportunity:** No specific risk/opportunity details.

---

### 🔍 Detailed View

### 🔹 Sub-topic: Ratios

#### 🔸 Sharpe Ratio
**Formula:**
$$S_p = \frac{R_p - R_f}{\sigma_p}$$
Where:
$R_p = \text{Portfolio Return}$
$R_f = \text{Risk-Free Rate}$
$\sigma_p = \text{Standard Deviation of Portfolio Returns (Total Risk)}$
**Worked Example:**
Fund A Return ($R_p$) = 15%
Risk-Free Rate ($R_f$) = 6%
Standard Deviation ($\sigma_p$) = 12%
$$S_p = \frac{15\% - 6\%}{12\%} = $\frac{9\%}{12\%} = 0.75$$
*Interpretation:* Fund A generates 0.75% of excess return for every 1% of total risk taken.

#### 🔸 Treynor Ratio
**Formula:**
$$T_p = \frac{R_p - R_f}{\beta_p}$$
Where:
$\beta_p = \text{Beta of the Portfolio (Systematic Risk)}$
**Worked Example:**
Fund B Return ($R_p$) = 16%
Risk-Free Rate ($R_f$) = 6%
Portfolio Beta ($\beta_p$) = 1.25
$$T_p = \frac{16\% - 6\%}{1.25} = $\frac{10\%}{1.25} = 8.0\% \text{ (or 0.08)}$$
*Interpretation:* Fund B generates 8% excess return for every unit of market-related systematic risk.

#### 🔸 Jensen's Alpha
**Jensen's Alpha Formula:**
$$\alpha_p = R_p - [R_f + \beta_p(R_m - R_f)]$$
**BHB Performance Attribution Model:**
Decomposes active return ($R_p - R_b$) into three components across $n$ sectors:
1. **Allocation Effect ($A_i$):** The value added by overweighting/underweighting sectors:
$$A_i = (w_{p,i} - w_{b,i}) \times R_{b,i}$$
2. **Selection Effect ($S_i$):** The value added by stock selection within a sector:
$$S_i = w_{b,i} \times (R_{p,i} - R_{b,i})$$
3. **Interaction Effect ($I_i$):** The joint effect of allocation and selection:
$$I_i = (w_{p,i} - w_{b,i}) \times (R_{p,i} - R_{b,i})$$
Total Active Return:
$$R_p - R_b = \sum_{i=1}^n (A_i + S_i + I_i)$$
Where $w_{p,i}$ and $w_{b,i}$ are portfolio and benchmark weights for sector $i$, and $R_{p,i}$ and $R_{b,i}$ are sector returns.

### 🔹 Sub-topic: Hedge Funds vs. Mutual Funds

#### 🔸 Regulation Differences
**Mutual Funds:** Highly regulated under SEBI (Mutual Funds) Regulations, 1996. Retail-focused, mandatory daily NAV disclosure, strict concentration limits (e.g., max 10% in a single company's stock).
**Hedge Funds (AIF Category III):** Regulated under SEBI (AIF) Regulations, 2012. Private placement only, minimum investment size of ₹1 Crore, lower frequency of disclosure, and flexible leverage rules.

#### 🔸 Investment Strategy
**Mutual Funds:** Must remain fully invested (cash limits apply), cannot short sell stocks (except minor hedging), and cannot borrow money to invest (leverage is banned except for meeting temporary redemption liquidity).
**Hedge Funds:** Can short-sell stocks, buy derivatives, use high leverage (up to 2 times the fund size in India), and take highly concentrated bets on single companies or themes.

#### 🔸 Fee Structure
**Mutual Funds:** Flat TER capped by SEBI (max 2.25%). Performance-based incentive fees are strictly prohibited under SEBI guidelines.
**Hedge Funds:** Typically charge a 1-2% annual management fee plus a 10-20% performance fee on returns generated above a specific "hurdle rate" (e.g., 8%), often subject to a "high-water mark" clause (no performance fee until past losses are recovered).

#### 🔸 Information Disclosure
**Mutual Funds:** Must publish NAV daily by 11:00 PM, disclose full portfolio holdings monthly, and release semi-annual audited financial statements.
**Hedge Funds:** Portfolios are disclosed only to their private investors (usually quarterly or semi-annually). NAV disclosure is weekly or monthly, and reports are not published in the public domain.

---

### 🎴 Flashcards

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Measures the risk-adjusted excess return per unit of total risk (Standard Deviation).
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> A driver who maintains a steady high speed without erratic steering.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> High Sharpe ratio indicates strong manager skill in generating return relative to portfolio volatility.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Measures the risk-adjusted excess return per unit of systematic risk (Beta).
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Evaluating a ship's speed relative only to the ocean current resistance, ignoring wind drag.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Used for evaluating well-diversified portfolios where unsystematic risk has been eliminated.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Jensen's Alpha measures excess return over CAPM expectations, while the Brinson-Hood-Beebower (BHB) model attributes active returns into allocation, selection, and interaction effects.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Analyzing a company's profit growth to determine if it was driven by market growth, operational cost cuts, or price increases.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Decomposes portfolio performance to identify the source of manager outperformance.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Mutual funds are retail products under strict SEBI oversight, while Hedge Funds (AIFs) are private placement vehicles with flexible rules.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> A public food safety license versus a private dinner club.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Mutual funds prioritize investor protection; Hedge Funds prioritize operational flexibility.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Mutual funds are generally long-only directional strategies, whereas Hedge Funds employ long-short, arbitrage, macro, and leveraged derivative strategies.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> A passenger airliner flying in a straight path versus a military fighter jet executing complex maneuvers.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Hedge Funds aim for absolute returns; Mutual funds target relative outperformance of benchmarks.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Mutual funds charge a simple annual management fee (TER), while Hedge Funds charge both a management fee and a performance fee.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> A broker who charges a flat flat rate versus a consultant who takes a percentage of business profits.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Hedge Funds utilize incentive fees to align manager interests, but are much costlier.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Mutual funds require high transparency and frequent reporting, while Hedge Funds maintain secrecy to protect proprietary trading algorithms.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> A public listed company publishing quarterly reports versus a family partnership disclosing statements only to partners.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Retail transparency vs. institutional confidentiality.
</details>