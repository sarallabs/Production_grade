# Volatility and Stop Losses in Leverage

> **Sub-Topic 4.3:** Trend & Momentum Methods | **Chapter:** Derivates Futures | **Level:** Advanced

--- 

### 📝 Source Institutional Content
> **Reference:** Page 20, Risk Management Chapter
> **Content:** The application of volatility-based stop losses (like ATR) to protect capital in leveraged positions. (Ref: Risk Management)

--- 

### 📋 Summary View
- **Strategic Context:** Risk management systems implement dynamic trailing stop-losses (e.g. Chandelier Exit) and calculate the maximum risk per trade (e.g. 1% of equity) to maintain portfolio survivability.
- **Quantitative Model:** Average True Range recursive formula: $\text{TR}_t = \max(|H_t - L_t|, |H_t - C_{t-1}|, |L_t - C_{t-1}|)$, and $\text{ATR}_t = \frac{\text{ATR}_{t-1} \times 13 + \text{TR}_t}{14}$. Capital allocation: $\text{Position Size} = $\frac{\text{Capital} \times \text{Risk\%}}{\text{Stop-Loss Distance}}$.
- **Risk/Opportunity:** Slippage during market gap-downs (where the opening price is far below the stop-loss price, causing the trade to execute at a worse price) and execution risk during high-volatility events.

### 🔍 Detailed View
In extreme market conditions (like SEBI circuit breaker limits or gap-down openings), a stop-loss order may not execute at the exact trigger price. Systematic funds run Monte Carlo simulations to model gap risk and adjust their portfolio leverage limits accordingly.

--- 

### 🎴 Flashcards
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

--- 

## 🔗 Navigation
- 🔙 **[Back to Sub-Topic 4.3](./subtopic_futures_4.3.md)**
- 🎉 **[You have completed this chapter! Back to Index](./index.md)**
- 🚀 **[Switch to Deep Dive Mode (References & Books)](./deep_dive_futures_55.md)**