# Sub-Topic 3.5.1: Ratios

> **Reference:** Page 11

---

### 📋 Summary View

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

---

### 🔍 Detailed View

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

<!-- CONCEPTS: ./concept_mutual_funds_44.md, ./concept_mutual_funds_45.md, ./concept_mutual_funds_46.md -->