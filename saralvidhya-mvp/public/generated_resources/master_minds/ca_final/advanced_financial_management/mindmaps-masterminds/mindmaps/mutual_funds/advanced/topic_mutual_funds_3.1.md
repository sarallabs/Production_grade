# Topic 3.1: Fundamentals

---

### 📋 Summary View

### 🔹 Sub-topic: Definition & Structure

#### 🔸 Mutual Fund
- **Strategic Context:** **Concept Summary:** A mutual fund is a fiduciary trust vehicle registered under the SEBI (Mutual Funds) Regulations, 1996, designed to pool capital and deploy it into securities based on a formal Statement of Additional Information (SAI) and Scheme Information Document (SID).
**Key Takeaway:** Structured as a trust to isolate investor assets from the AMC's balance sheet, mitigating counterparty risk.
**Analogy:** A securitization SPV (Special Purpose Vehicle) where underlying mortgage pools are held by a trustee, completely isolated from the bankruptcy of the originating bank.
- **Quantitative Model:** No specific quantitative model details.
- **Risk/Opportunity:** No specific risk/opportunity details.

#### 🔸 Entities in a Mutual Fund
- **Strategic Context:** **Concept Summary:** A highly segregated institutional structure consisting of the Sponsor (initiator), Trustees (fiduciary owners), AMC (portfolio manager), Custodian (asset safekeeper), Registrar (bookkeeper), and Audit Committee.
**Key Takeaway:** Segregation of custody, administration, governance, and management prevents agency conflict and structural fraud.
**Analogy:** The tri-party custody arrangement in prime brokerage, where collateral management, trading execution, and asset safekeeping are managed by separate institutions.
- **Quantitative Model:** No specific quantitative model details.
- **Risk/Opportunity:** No specific risk/opportunity details.

#### 🔸 Sponsor Net Worth Requirement
- **Strategic Context:** **Concept Summary:** The Sponsor must possess a sound financial track record and contribute at least 40% of the AMC's minimum net worth, which is set at a floor of ₹10 Crore.
**Key Takeaway:** Imposes financial barriers to entry to prevent capitalization fraud and ensure AMC solvency.
**Analogy:** Capital adequacy requirements (Tier-1 capital) for banks to absorb operating losses.
- **Quantitative Model:** No specific quantitative model details.
- **Risk/Opportunity:** No specific risk/opportunity details.

### 🔹 Sub-topic: Benefits vs. Drawbacks

#### 🔸 Benefits of Mutual Funds
- **Strategic Context:** **Concept Summary:** Portfolio benefits include lower transaction costs (economies of scale), access to institutional placement, tax-deferred compounding, and systemic risk mitigation.
**Key Takeaway:** Lowers the cost of harvesting risk premiums (equity risk premium, term premium, credit premium).
**Analogy:** Utilizing an institutional multi-family office to gain entry into restricted private credit deals.
- **Quantitative Model:** No specific quantitative model details.
- **Risk/Opportunity:** No specific risk/opportunity details.

#### 🔸 Drawbacks of Mutual Funds
- **Strategic Context:** **Concept Summary:** Portfolio drags include active risk (underperformance), cost drag (TER), asset-size cash drag, liquidity mismatches, and capital gains tax pass-through issues.
**Key Takeaway:** Fees, liquidity constraints, and size limits can degrade theoretical portfolio performance.
**Analogy:** A large hedge fund suffering from high market impact costs and execution slippage due to excessively large asset size.
- **Quantitative Model:** No specific quantitative model details.
- **Risk/Opportunity:** No specific risk/opportunity details.

---

### 🔍 Detailed View

### 🔹 Sub-topic: Definition & Structure

#### 🔸 Mutual Fund
The mutual fund structure is a statutory trust. The legal ownership vests with the Trustees, whereas the beneficial ownership rests with the unit-holders. The Asset Management Company (AMC) acts as an agent of the trust. Under SEBI rules, the NAV calculation must account for accrued liabilities and expense accruals on a daily basis. The NAV is computed as:
$$\text{NAV}_t = \frac{\sum_{i=1}^n Q_{i,t} P_{i,t} + \text{Cash}_t - \text{Accrued Expenses}_t - \text{Liabilities}_t}{\text{Total Outstanding Units}_t}$$
Where $Q_{i,t}$ is the quantity of security $i$ held at day $t$, and $P_{i,t}$ is the closing price of security $i$ on the principal stock exchange.

#### 🔸 Entities in a Mutual Fund
**Sponsor:** Initiates the trust; must hold a minimum 40% stake in the AMC's net worth.
**Trustee Company / Board of Trustees:** Holds the assets in trust. SEBI mandates that at least 2/3rd of the trustees must be independent.
**AMC:** Appointed by Trustees. Must have a board where at least 50% are independent. AMC charges management fees within SEBI caps.
**Custodian:** Must be independent of the Sponsor and AMC. Physically and electronically settles and stores securities.
**Registrar & Transfer Agent (RTA):** Manages the investor registry, executes unit creation/redemption records, and processes corporate actions.

#### 🔸 Sponsor Net Worth Requirement
To establish a mutual fund, the Sponsor must demonstrate:
1. Continuous profitability in at least 3 of the immediately preceding 5 years (including the 5th year).
2. A net worth that is positive and greater than the proposed AMC capital.
3. Minimum AMC Net Worth: ₹10 Crore (held as paid-up capital and free reserves).
4. Sponsor Contribution: Minimum 40% of the AMC equity capital. This must be maintained as long-term equity capital; it cannot be pledged or sold without SEBI approval.

### 🔹 Sub-topic: Benefits vs. Drawbacks

#### 🔸 Benefits of Mutual Funds
**Economies of Scale:** Lower brokerage commissions (institutional rates are 5-10 bps vs. retail 20-50 bps), lower custody fees, and optimized tax tracking.
**Institutional Access:** Access to corporate debt placements, IPO QIB (Qualified Institutional Buyer) quotas, and block deals.
**Tax-deferred Compounding:** Realizing gains within the mutual fund portfolio does not trigger capital gains tax for the unit-holder until the units are redeemed.

#### 🔸 Drawbacks of Mutual Funds
**Active Risk & Fee Drag:** Active fund managers often fail to beat benchmarks after accounting for the Total Expense Ratio (TER), leading to negative net-of-fee Alpha.
**Scale/AUM Drag:** As AUM grows, the fund manager faces liquidity constraints, forcing them to buy large-cap stocks or run a highly diluted portfolio, destroying active alpha potential.
**Cash Drag:** Need for cash buffers to meet daily redemptions reduces equity exposure, dragging returns during bull markets.

---

### 🎴 Flashcards

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> A mutual fund is a fiduciary trust vehicle registered under the SEBI (Mutual Funds) Regulations, 1996, designed to pool capital and deploy it into securities based on a formal Statement of Additional Information (SAI) and Scheme Information Document (SID).
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> A securitization SPV (Special Purpose Vehicle) where underlying mortgage pools are held by a trustee, completely isolated from the bankruptcy of the originating bank.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Structured as a trust to isolate investor assets from the AMC's balance sheet, mitigating counterparty risk.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> A highly segregated institutional structure consisting of the Sponsor (initiator), Trustees (fiduciary owners), AMC (portfolio manager), Custodian (asset safekeeper), Registrar (bookkeeper), and Audit Committee.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The tri-party custody arrangement in prime brokerage, where collateral management, trading execution, and asset safekeeping are managed by separate institutions.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Segregation of custody, administration, governance, and management prevents agency conflict and structural fraud.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> The Sponsor must possess a sound financial track record and contribute at least 40% of the AMC's minimum net worth, which is set at a floor of ₹10 Crore.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Capital adequacy requirements (Tier-1 capital) for banks to absorb operating losses.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Imposes financial barriers to entry to prevent capitalization fraud and ensure AMC solvency.
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Portfolio benefits include lower transaction costs (economies of scale), access to institutional placement, tax-deferred compounding, and systemic risk mitigation.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Utilizing an institutional multi-family office to gain entry into restricted private credit deals.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Lowers the cost of harvesting risk premiums (equity risk premium, term premium, credit premium).
</details>

<details>
<summary>⚡ Card 1: What is the summary of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Portfolio drags include active risk (underperformance), cost drag (TER), asset-size cash drag, liquidity mismatches, and capital gains tax pass-through issues.
</details>

<details>
<summary>⚡ Card 2: What is a helpful analogy for this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> A large hedge fund suffering from high market impact costs and execution slippage due to excessively large asset size.
</details>

<details>
<summary>⚡ Card 3: What is the key takeaway of this concept? (Click to reveal)</summary>
<br>
<b>Answer:</b> Fees, liquidity constraints, and size limits can degrade theoretical portfolio performance.
</details>