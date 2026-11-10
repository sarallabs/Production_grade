# Volatility and Stop Losses in Leverage

> **Sub-Topic 4.3:** Trend & Momentum Methods | **Chapter:** Derivates Futures | **Level:** Intermediate

--- 

### 📝 Source Institutional Content
> **Reference:** Page 20, Risk Management Chapter
> **Content:** The application of volatility-based stop losses (like ATR) to protect capital in leveraged positions. (Ref: Risk Management)

--- 

### 📋 Summary View
- **Concept Summary:** The calculation and placement of stop-loss levels based on market volatility (using Average True Range - ATR) to protect leveraged trading accounts.
- **Formula/Rule:** Stop-Loss Price (Long) = Entry Price - (k * ATR). Stop-Loss Price (Short) = Entry Price + (k * ATR). Typically, k = 1.5 or 2.
- **Application Context:** Traders set stop-loss orders directly on their terminal (NSE bracket orders or cover orders). It is calculated prior to trade entry to determine position sizing.

### 🔍 Detailed View
Average True Range (ATR) measures market volatility. If a stock is highly volatile, its ATR is high, so the stop-loss must be wider to avoid being triggered by random market noise. If the stock is quiet, the stop-loss can be tighter. This ensures risk is normalized across different market conditions.

--- 

### 🎴 Flashcards
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

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 4.3](./subtopic_futures_4.3.md)**
- 🎉 **[You have completed this chapter! Back to Index](./index.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_futures_55.md)**