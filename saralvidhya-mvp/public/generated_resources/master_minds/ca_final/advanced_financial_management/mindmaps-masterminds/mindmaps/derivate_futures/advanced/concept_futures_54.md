# Moving Average Crossovers

> **Sub-Topic 4.3:** Trend & Momentum Methods | **Chapter:** Derivates Futures | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 19, Methods Chapter
> **Content:** A system where two moving averages crossover to indicate a change in trend direction. (Ref: Technical Analysis)

--- 

### 📋 Summary View
- **Strategic Context:** Quantitative systematic desks deploy double and triple EMA crossover algorithms (e.g. MACD or Triple Screen systems) integrated with execution engines to automate futures trading.
- **Quantitative Model:** Exponential Moving Average formula: $\text{EMA}_t = P_t \times \alpha + \text{EMA}_{t-1} \times (1 - \alpha)$, where smoothing factor $\alpha = \frac{2}{N+1}$. System optimization involves maximizing the Profit Factor and Sharpe Ratio while minimizing Max Drawdown.
- **Risk/Opportunity:** Curve-fitting (over-optimizing parameters on historical data) and execution latency (slippage between crossover signal and order execution).

### 🔍 Detailed View
Advanced systems apply filters to reduce whipsaws. For example, they may require the crossover to hold for a specific number of bars, or require a minimum ATR filter. Position sizing is managed dynamically using portfolio optimization frameworks.

--- 

### 🎴 Flashcards
<details>
<summary>⚡ Card 1: Write the recursive mathematical formula for an Exponential Moving Average (EMA). (Click to reveal)</summary>
<br>
<b>Answer:</b> $\text{EMA}_t = P_t \times \alpha + \text{EMA}_{t-1} \times (1 - \alpha)$, where $\alpha = 2 / (N + 1)$.
</details>

<details>
<summary>⚡ Card 2: What is the danger of backtesting moving average parameters on historical data? (Click to reveal)</summary>
<br>
<b>Answer:</b> Curve-fitting (over-optimization), where parameters work perfectly in the past but fail to perform in live trading due to changing market regimes.
</details>

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 4.3](./subtopic_futures_4.3.md)**
- ➡️ **[Next Suggested: Volatility and Stop Losses in Leverage](./concept_futures_55.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_futures_54.md)**