# Sub-Topic 4.3: Trend & Momentum Methods

> **Reference:** Page 18, Methods Chapter, Page 19, Methods Chapter, Page 20, Risk Management Chapter

---

### 📋 Summary View

#### 🔸 Momentum Trading in Futures
- **Concept Summary:** The application of quantitative indicators (like RSI and MACD) and volume confirmations to establish trend-following positions in futures contracts.
- **Formula/Rule:** RSI > 60 with rising volume = Bullish Momentum. RSI < 40 with rising volume = Bearish Momentum.
- **Application Context:** Traded on Nifty or high-beta stock futures. Position holding times range from a few hours to several days, based on daily and hourly chart trends.

#### 🔸 Moving Average Crossovers
- **Concept Summary:** The mechanical trend-following system utilizing exponential moving averages (EMA) to generate buy and sell triggers in leveraged futures markets.
- **Formula/Rule:** Buy Trigger: $\text{EMA}_{fast} > \text{EMA}_{slow}$ and previous state was $\text{EMA}_{fast} \le \text{EMA}_{slow}$. Sell Trigger: $\text{EMA}_{fast} < \text{EMA}_{slow}$ and previous state was $\text{EMA}_{fast} \ge \text{EMA}_{slow}$.
- **Application Context:** Commonly applied on Nifty futures using the 9-period and 21-period EMA crossover on 15-minute or 1-hour charts to capture intraday or swing trends.

#### 🔸 Volatility and Stop Losses in Leverage
- **Concept Summary:** The calculation and placement of stop-loss levels based on market volatility (using Average True Range - ATR) to protect leveraged trading accounts.
- **Formula/Rule:** Stop-Loss Price (Long) = Entry Price - (k * ATR). Stop-Loss Price (Short) = Entry Price + (k * ATR). Typically, k = 1.5 or 2.
- **Application Context:** Traders set stop-loss orders directly on their terminal (NSE bracket orders or cover orders). It is calculated prior to trade entry to determine position sizing.

---

### 🔍 Detailed View

#### 🔸 Momentum Trading in Futures
Intermediate momentum traders use technical analysis. They look for breakouts where a futures price moves above a key resistance level on high volume, indicating institutional buying. They place a stop-loss just below the breakout point.

#### 🔸 Moving Average Crossovers
Using EMAs (Exponential Moving Averages) is preferred over SMAs (Simple Moving Averages) because EMAs give more weight to recent prices, reducing lag. Crossover systems perform exceptionally well in trending markets but suffer losses in sideways (ranging) markets.

#### 🔸 Volatility and Stop Losses in Leverage
Average True Range (ATR) measures market volatility. If a stock is highly volatile, its ATR is high, so the stop-loss must be wider to avoid being triggered by random market noise. If the stock is quiet, the stop-loss can be tighter. This ensures risk is normalized across different market conditions.

---

### 🎴 Flashcards

<details>
<summary>⚡ Card 1: What indicators are commonly used to measure momentum? (Click to reveal)</summary>
<br>
<b>Answer:</b> Relative Strength Index (RSI), Moving Average Convergence Divergence (MACD), and Rate of Change (ROC).
</details>

<details>
<summary>⚡ Card 2: Why is volume important in momentum trading? (Click to reveal)</summary>
<br>
<b>Answer:</b> High volume confirms that the price trend is backed by major market participants, reducing the risk of a false breakout.
</details>

<details>
<summary>⚡ Card 1: Why are Exponential Moving Averages (EMA) preferred over Simple Moving Averages (SMA) in active trading? (Click to reveal)</summary>
<br>
<b>Answer:</b> EMAs react faster to recent price changes, reducing the lag in generating entry and exit signals.
</details>

<details>
<summary>⚡ Card 2: In what market condition do moving average crossover systems fail or lose money? (Click to reveal)</summary>
<br>
<b>Answer:</b> In sideways or range-bound markets, where frequent crossovers generate false signals (whipsaws).
</details>

<details>
<summary>⚡ Card 1: How is a volatility-based stop-loss calculated using ATR? (Click to reveal)</summary>
<br>
<b>Answer:</b> By subtracting a multiple of ATR (e.g. 2 * ATR) from the entry price for a long position.
</details>

<details>
<summary>⚡ Card 2: What does Average True Range (ATR) measure? (Click to reveal)</summary>
<br>
<b>Answer:</b> The average daily price volatility of an asset over a specified period (typically 14 days).
</details>

<!-- CONCEPTS: ./concept_futures_53.md, ./concept_futures_54.md, ./concept_futures_55.md -->