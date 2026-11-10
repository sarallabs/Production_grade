# Topic 4: Methods

---

### 📋 Summary View

### 🔹 Sub-topic: Pricing Methods

#### 🔸 Contango Market Structure
- **Strategic Context:** Contango describes an upward-sloping forward curve where the futures price trades at a premium to the spot price, reflecting carrying costs.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Backwardation Market Structure
- **Strategic Context:** Backwardation represents a downward-sloping forward curve where the futures price trades at a discount to spot, indicating a high convenience yield.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Cost of Carry Fundamentals
- **Strategic Context:** The cost of carry model defines the arbitrage-free relationship between spot and futures prices under the law of one price.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Simple Interest Formula
- **Strategic Context:** The simple interest pricing model is a linear approximation of the cost of carry, applicable for short-dated maturities.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Continuous Compounding Formula
- **Strategic Context:** The continuous compounding formulation $F_0 = S_0 e^{rT}$ represents the arbitrage-free futures price under a continuous-time finance framework.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Adjusting for Dividends Paid Before Expiry
- **Strategic Context:** The futures pricing formula is adjusted by subtracting the present value of expected dividends, reflecting the reduction in spot value on the ex-dividend date.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Relevance of Dividend Timing
- **Strategic Context:** The dividend adjustment parameter only includes distributions with ex-dates within the contract's time horizon $[0, T]$.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Index Dividends and Dividend Yield
- **Strategic Context:** Modeling dividends as a continuous yield $d$ is standard for index futures, representing the index as a mutual fund that pays continuous dividends.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Index Futures Pricing Formula
- **Strategic Context:** The index futures contract valuation follows the continuous-time cost of carry formula $F_0 = S_0 e^{(r-d)T}$, where dividend yield acts as a continuous discount.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

#### 🔸 Net Cost of Carry Definition
- **Strategic Context:** The Net Cost of Carry ($r - d$) represents the growth rate of the futures price relative to the spot price in risk-neutral valuation.
- **Quantitative Model:** Cost of Carry, SPAN Risk Scenarios, or Black-Scholes PDE depending on topic.
- **Risk/Opportunity:** Arbitrage boundaries, basis risk, tracking error, margin requirements, or circuit breakers.

### 🔹 Sub-topic: Expiry & Rollover Methods

#### 🔸 Expiry Cycle & Last Thursday Rule
- **Strategic Context:** Institutional players manage expiration exposure by adjusting options gamma hedges and executing roll trades to maintain continuous exposure without physical delivery friction.
- **Quantitative Model:** At maturity $T$, basis converges to zero: $\lim_{t \to T} (F_t - S_t) = 0$. Volatility smile steepens on expiry day as market makers defend option strikes.
- **Risk/Opportunity:** Rollover cost risk (arbitrageurs exploitation of roll spread) and physical delivery delivery-margin spikes (100% of contract value required under SEBI's physical settlement regime).

#### 🔸 Rollover of Futures Positions
- **Strategic Context:** Institutional desks execute rollovers via spread orders on the exchange, optimizing execution prices to minimize slippage against the volume-weighted average price (VWAP).
- **Quantitative Model:** Roll Return ($R_{roll}$) is defined as: $R_{roll} = \frac{F_{near} - F_{next}}{F_{near}}$. If $F_{next} > F_{near}$ (Contango), rolling long positions incurs a negative yield.
- **Risk/Opportunity:** Rollover slippage, liquidity drying up in near-month contracts during the final hours of trading, and sudden changes in the roll spread due to market events.

#### 🔸 Physical vs. Cash Settlement
- **Strategic Context:** 
- **Quantitative Model:** Payoff matrix: physical settlement incorporates demat transaction costs, custody fees, and short-delivery auction risks.
- **Risk/Opportunity:** Short delivery auction penalty risk (up to 20% of share value if seller fails to deliver stock) and demat delivery failures. Arbitrageurs profit by buying spot and selling futures, then holding to physical delivery.

### 🔹 Sub-topic: Trend & Momentum Methods

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

### 🔹 Sub-topic: Pricing Methods

#### 🔸 Contango Market Structure
In commodity markets, Contango is defined by the inequality $F_0 > S_0$. This occurs when the cost of carry (interest, storage, insurance) is positive and exceeds any convenience yield. The term structure of futures is:
$$F_0 = S_0 e^{(r + s - c)T}$$
where $r$ is the risk-free rate, $s$ is the physical storage cost, and $c$ is the convenience yield. In a Contango market, the convenience yield $c$ is low relative to storage costs $s$. For financial assets, Contango is the standard state because storage costs are negligible, and the cost of carry is driven by the risk-free rate ($F_0 = S_0 e^{rT}$).

#### 🔸 Backwardation Market Structure
Backwardation ($F_0 < S_0$) occurs when the convenience yield $c$ is high, satisfying the condition $c > r + s$. The convenience yield represents the economic benefit of holding the physical asset (e.g., preventing refinery shutdown). In times of severe supply shortages, the spot price spikes, while futures prices remain lower because supply is expected to normalize in the future. In financial markets, backwardation can occur in stock futures when a stock is in high demand for short-selling, causing stock borrowing fees to spike, which reduces the synthetic forward price.

#### 🔸 Cost of Carry Fundamentals
The Cost of Carry model assumes that the futures price is the spot price adjusted for the net cost of holding the asset. The general relationship is $F_0 = S_0 + C$. In financial markets, the cost of carry consists of the cost of financing the purchase at the risk-free rate $r$, minus any income generated by the asset (e.g., dividends $d$). If the futures price deviates from this relationship, arbitrageurs execute trades to restore equilibrium, defining the pricing boundary for futures contracts.

#### 🔸 Simple Interest Formula
The linear cost of carry formula is $F = S [1 + r(t/365)]$, where $t$ is the number of days to maturity. This formulation assumes daily simple interest, which is standard in short-term money market instruments. In equity derivatives, while continuous compounding is theoretically preferred, brokers and traders often use simple interest as a quick approximation for near-month contracts due to the short time horizon (less than 30 days).

#### 🔸 Continuous Compounding Formula
In continuous-time finance, the arbitrage-free relation is $F_0 = S_0 e^{rT}$. If $F_0 > S_0 e^{rT}$, an arbitrageur can borrow $S_0$ at the continuous rate $r$, buy the asset, and short the futures, locking in a risk-free profit of $F_0 - S_0 e^{rT}$ at time $T$. The continuous compounding model is mathematically tractible and integrates with the Black-Scholes-Merton option pricing framework.

#### 🔸 Adjusting for Dividends Paid Before Expiry
Under continuous compounding, if a stock pays a discrete dividend $D_i$ at time $t_i$ (where $t_i < T$), the futures price is:
$$F_0 = (S_0 - D_i e^{-r t_i}) e^{rT}$$
where $D_i e^{-r t_i}$ is the present value of the dividend discounted to the present. The subtraction of the dividend present value from the spot price reflects that the holder of the futures contract does not receive the dividend cash flow, which instead goes to the spot holder. The spot price drops by $D_i$ on the ex-dividend date, and the futures price converges to $S_T$ at maturity.

#### 🔸 Relevance of Dividend Timing
The pricing of futures is determined by replicating cash flows. A dividend distribution only enters the replication equations if the ex-dividend date $t_d$ falls within the contract period: $t_d \in [0, T]$. If $t_d > T$, the long futures position has already settled at $T$ against $S_T$, which does not yet reflect the dividend drop. Therefore, any dividend paid after $T$ is excluded from the pricing equation at time $t=0$, as it has no economic impact on the contract's cash flows.

#### 🔸 Index Dividends and Dividend Yield
For a stock index, modeling discrete dividends is computationally expensive because the components distribute dividends at different times. The index is modeled as an asset that pays a continuous dividend yield $d$. This assumption is standard in the Black-Scholes-Merton option pricing model for indices. The continuous yield represents the average dividend payment rate of the index components, simplifying the replication equations.

#### 🔸 Index Futures Pricing Formula
The index futures price $F_0 = S_0 e^{(r-d)T}$ is derived under risk-neutral valuation. The dividend yield $d$ reduces the cost of carry because holding the physical shares of the index components generates dividend income, which offsets the financing cost $r$. The net financing rate is $r - d$. If the market futures price deviates from this theoretical price, institutional index-arbitrage programs execute trades to exploit the mismatch, buying the component stocks and selling futures (or vice versa).

#### 🔸 Net Cost of Carry Definition
The Net Cost of Carry $q = r - d$ determines the drift of the futures price process. In a risk-neutral world, the expected growth rate of the spot asset is the risk-free rate $r$. Since the asset pays a continuous dividend yield $d$, the capital gains growth rate of the spot price is $r - d$. The futures price, which pays no dividends, must grow at the rate of the spot asset's capital gains, meaning $F_t = S_t e^{(r-d)(T-t)}$, identifying $r - d$ as the net carrying rate.

### 🔹 Sub-topic: Expiry & Rollover Methods

#### 🔸 Expiry Cycle & Last Thursday Rule
Institutional portfolios face rollover risk—the cost of closing near-month contracts and buying next-month contracts. If the next-month contract trades at a premium (Contango), rolling a long position incurs a cost. If it trades at a discount (Backwardation), rolling yields a positive roll return.

#### 🔸 Rollover of Futures Positions
Quantitative strategies evaluate the cost of carry vs. the roll spread. Arbitrage desks exploit deviations in roll spreads from their theoretical carry values by taking positions in the spread market, which has its own order book on the NSE.

#### 🔸 Physical vs. Cash Settlement
Physical settlement creates arbitrage opportunities. If futures trade at a discount (Backwardation) near expiry, an arbitrageur can buy futures, sell spot (shorting the stock), and let the contracts go to physical delivery. The shares received from the long futures contract will cover the short stock position.

### 🔹 Sub-topic: Trend & Momentum Methods

#### 🔸 Momentum Trading in Futures
Advanced momentum strategies utilize multi-timeframe analysis and factor-based models. They use futures contracts due to their deep liquidity and ease of short-selling, allowing them to harvest momentum premium in both bull and bear markets.

#### 🔸 Moving Average Crossovers
Advanced systems apply filters to reduce whipsaws. For example, they may require the crossover to hold for a specific number of bars, or require a minimum ATR filter. Position sizing is managed dynamically using portfolio optimization frameworks.

#### 🔸 Volatility and Stop Losses in Leverage
In extreme market conditions (like SEBI circuit breaker limits or gap-down openings), a stop-loss order may not execute at the exact trigger price. Systematic funds run Monte Carlo simulations to model gap risk and adjust their portfolio leverage limits accordingly.

---

### 🎴 Flashcards

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Contango: Forward price > Spot price (F > S).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Backwardation: Forward price < Spot price (F < S).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Future Price (F) = Spot Price (S) + Cost of Carry (C).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> F = S + (S * r * T)/12 (Simple Interest).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> F = S * e^(rT) (Continuous Compounding).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> If dividend (D) is paid before expiry: F = S + Cost of Carry - D.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Dividend is relevant only if paid on or before expiry.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Use Dividend Yield (d) instead of specific dividend amount.
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> F = S * e^((r-d)T).
</details>

<details>
<summary>⚡ Card 1: Explain the main point of this concept. (Click to reveal)</summary>
<br>
<b>Answer:</b> Net Cost of Carry = r - d.
</details>

<details>
<summary>⚡ Card 1: What is rollover risk for institutional long positions in contango markets? (Click to reveal)</summary>
<br>
<b>Answer:</b> The cost of buying the next-month contract at a premium relative to selling the expiring near-month contract, causing a drag on returns.
</details>

<details>
<summary>⚡ Card 2: What mathematical condition is satisfied by spot and futures prices at maturity? (Click to reveal)</summary>
<br>
<b>Answer:</b> Convergence: $F_T = S_T$, meaning basis becomes zero.
</details>

<details>
<summary>⚡ Card 1: How do you calculate roll return? (Click to reveal)</summary>
<br>
<b>Answer:</b> Roll Return = (Near-Month Future Price - Next-Month Future Price) / Near-Month Future Price.
</details>

<details>
<summary>⚡ Card 2: Why do institutional desks use the NSE spread order book? (Click to reveal)</summary>
<br>
<b>Answer:</b> To execute both legs of the rollover trade simultaneously, eliminating execution leg risk and minimizing slippage.
</details>

<details>
<summary>⚡ Card 1: What is short delivery risk in physical settlement? (Click to reveal)</summary>
<br>
<b>Answer:</b> The risk that the seller does not own or deliver the shares, triggering a SEBI auction where shares are purchased at a penalty price (up to 20% premium) at the seller's cost.
</details>

<details>
<summary>⚡ Card 2: How can an arbitrageur exploit a discount in stock futures using physical settlement? (Click to reveal)</summary>
<br>
<b>Answer:</b> Buy the futures contract, short sell the stock in the cash market, and hold until expiration to receive shares from the futures contract to cover the short position.
</details>

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