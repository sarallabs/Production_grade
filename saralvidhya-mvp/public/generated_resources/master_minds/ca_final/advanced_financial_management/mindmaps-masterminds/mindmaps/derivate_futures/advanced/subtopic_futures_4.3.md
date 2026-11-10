# Sub-Topic 4.3: Trend & Momentum Methods

> **Reference:** Page 18, Methods Chapter, Page 19, Methods Chapter, Page 20, Risk Management Chapter

---

### 📋 Summary View

#### 🔸 Momentum Trading in Futures
- **Strategic Context:** Quantitative CTA funds implement algorithmic momentum models (Trend Following) across futures portfolios, adjusting position sizing dynamically based on asset volatility.
- **Quantitative Model:** Momentum Signal ($S_t$) can be modeled as: $S_t = \text{sign}(P_t - \text{MA}_t(L))$. Position sizing is scaled by volatility: $Position = \frac{\text{Capital} \times \text{Risk Factor}}{\text{Instrument Volatility} \times \text{Contract Value}}$.
- **Risk/Opportunity:** Whipsaw risk (sudden trend reversal leading to multiple consecutive losses) and high transaction costs due to frequent portfolio turnover.

#### 🔸 Moving Average Crossovers
- **Strategic Context:** Quantitative systematic desks deploy double and triple EMA crossover algorithms (e.g. MACD or Triple Screen systems) integrated with execution engines to automate futures trading.
- **Quantitative Model:** Exponential Moving Average formula: $\text{EMA}_t = P_t \times \alpha + \text{EMA}_{t-1} \times (1 - \alpha)$, where smoothing factor $\alpha = \frac{2}{N+1}$. System optimization involves maximizing the Profit Factor and Sharpe Ratio while minimizing Max Drawdown.
- **Risk/Opportunity:** Curve-fitting (over-optimizing parameters on historical data) and execution latency (slippage between crossover signal and order execution).

#### 🔸 Volatility and Stop Losses in Leverage
- **Strategic Context:** Risk management systems implement dynamic trailing stop-losses (e.g. Chandelier Exit) and calculate the maximum risk per trade (e.g. 1% of equity) to maintain portfolio survivability.
- **Quantitative Model:** Average True Range recursive formula: $\text{TR}_t = \max(|H_t - L_t|, |H_t - C_{t-1}|, |L_t - C_{t-1}|)$, and $\text{ATR}_t = \frac{\text{ATR}_{t-1} \times 13 + \text{TR}_t}{14}$. Capital allocation: $\text{Position Size} = $\frac{\text{Capital} \times \text{Risk\%}}{\text{Stop-Loss Distance}}$.
- **Risk/Opportunity:** Slippage during market gap-downs (where the opening price is far below the stop-loss price, causing the trade to execute at a worse price) and execution risk during high-volatility events.

---

### 🔍 Detailed View

#### 🔸 Momentum Trading in Futures
Advanced momentum strategies utilize multi-timeframe analysis and factor-based models. They use futures contracts due to their deep liquidity and ease of short-selling, allowing them to harvest momentum premium in both bull and bear markets.

#### 🔸 Moving Average Crossovers
Advanced systems apply filters to reduce whipsaws. For example, they may require the crossover to hold for a specific number of bars, or require a minimum ATR filter. Position sizing is managed dynamically using portfolio optimization frameworks.

#### 🔸 Volatility and Stop Losses in Leverage
In extreme market conditions (like SEBI circuit breaker limits or gap-down openings), a stop-loss order may not execute at the exact trigger price. Systematic funds run Monte Carlo simulations to model gap risk and adjust their portfolio leverage limits accordingly.

---

### 🎴 Flashcards

<details>
<summary>⚡ Card 1: What is whipsaw risk in momentum models? (Click to reveal)</summary>
<br>
<b>Answer:</b> The risk of entering a trade on a breakout only for the price to instantly reverse, triggering the stop-loss and causing a loss.
</details>

<details>
<summary>⚡ Card 2: How is position size adjusted for volatility in trend-following systems? (Click to reveal)</summary>
<br>
<b>Answer:</b> Position size is inversely proportional to asset volatility (e.g. smaller sizes for highly volatile stocks to keep risk constant).
</details>

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

<details>
<summary>⚡ Card 1: What is the formula for True Range (TR)? (Click to reveal)</summary>
<br>
<b>Answer:</b> $\text{TR} = \max(|H - L|, |H - C_{prev}|, |L - C_{prev}|)$ where H is High, L is Low, and $C_{prev}$ is the previous Close.
</details>

<details>
<summary>⚡ Card 2: Why might a stop-loss order execute at a worse price than the trigger price? (Click to reveal)</summary>
<br>
<b>Answer:</b> Due to slippage, which occurs when there is a price gap (e.g., market opens lower) or low liquidity at the trigger price.
</details>

<!-- CONCEPTS: ./concept_futures_53.md, ./concept_futures_54.md, ./concept_futures_55.md -->