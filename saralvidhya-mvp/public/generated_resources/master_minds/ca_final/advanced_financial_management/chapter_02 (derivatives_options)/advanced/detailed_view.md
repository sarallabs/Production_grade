# Derivatives - Options

## 1. Introduction: Options vs. Futures

Derivatives are financial contracts whose value depends on an underlying asset. In CA Final AFM, understanding the operational and mathematical distinction between futures and option contracts is fundamental.

| Feature | Futures Contracts | Options Contracts |
| :--- | :--- | :--- |
| **Obligation** | Both buyer and seller are obligated to perform under the contract. | The buyer has the right but no obligation; the seller (writer) has a binding obligation. |
| **Payoff Profile** | Symmetrical (Linear risk-reward profile for both parties). | Asymmetrical (Non-linear; buyer's loss is capped, seller's profit is capped). |
| **Upfront Cash Flows** | No upfront cost (only margin deposits are required). | Buyer pays a non-refundable upfront **premium** to the seller. |
| **Mark-to-Market (MTM)** | Daily cash settlement (MTM) based on price movements. | No daily MTM settlement for the option buyer (though margins apply to option writers). |
| **Risk Profile** | Unlimited profit and unlimited loss potential for both buyer and seller. | Buyer: Max loss = Premium paid, Max profit = Unlimited (Calls) / Large (Puts). Writer: Max profit = Premium received, Max loss = Unlimited (Calls) / Large (Puts). |

---

## 2. Factors Affecting Option Pricing

The price (premium) of an option is determined by the interaction of five primary variables and one secondary variable (dividends).

```
                            ┌────────────────────────┐
                            │  Option Premium (C/P)  │
                            └───────────┬────────────┘
         ┌──────────────┬───────────────┼───────────────┬──────────────┐
         ▼              ▼               ▼               ▼              ▼
   Stock Price (S) Strike Price (X) Time to Expiry (T) Volatility (σ) Risk-Free Rate (r)
```

### A. Spot Price of the Underlying Asset ($S$)
*   **Call Options:** As $S$ increases, the intrinsic value ($S - X$) increases, causing the call premium to rise.
*   **Put Options:** As $S$ increases, the intrinsic value ($X - S$) decreases, causing the put premium to fall.

### B. Strike Price ($X$)
*   **Call Options:** Higher strike prices reduce the likelihood of the option expiring in-the-money. Thus, call value is inversely related to strike price.
*   **Put Options:** Higher strike prices increase the likelihood of the option expiring in-the-money. Thus, put value is directly related to strike price.

### C. Time to Expiration ($T$)
*   For both calls and puts, options are wasting assets. As time passes, the "time value" component of the option decays. 
*   Generally, longer time to expiration increases the value of both calls and puts (due to a higher probability of moving in-the-money). This holds strictly for European calls on non-dividend-paying stocks and all American options, though deep in-the-money European puts can sometimes decrease in value with time.

### D. Volatility of the Underlying Asset ($\sigma$)
*   Volatility is a measure of price uncertainty. Unlike stock investments where risk is penalized, option prices increase when volatility increases for both calls and puts.
*   Since option buyers have capped losses but uncapped profits, a highly volatile stock is more likely to make large moves that result in high payoffs, while down-moves simply result in the option expiring worthless.

### E. Risk-Free Interest Rate ($r$)
*   **Call Options:** When interest rates rise, the present value of the strike price ($X e^{-r T}$) decreases. This lowers the cost of buying the stock in the future, increasing call values. Alternatively, buying a call is a leveraged position that conserves cash; higher interest rates make cash conservation more valuable.
*   **Put Options:** Higher interest rates decrease the present value of the strike price to be received in the future, which decreases put values.

### F. Dividends ($D$)
*   When a stock goes ex-dividend, its price drops by approximately the dividend amount.
*   **Call Options:** Dividend payments decrease the stock price, which decreases call option values.
*   **Put Options:** Dividend payments decrease the stock price, which increases put option values.

---

## 3. Option Greeks

Option Greeks measure the sensitivity of an option’s price to changes in the underlying pricing parameters. They are vital for risk management and delta-neutral trading.

```
┌───────────┬──────────────────────────────────────────────┬────────────────────────┐
│ Greek     │ Mathematical Definition                      │ Standard Sign (Call/Put)│
├───────────┼──────────────────────────────────────────────┼────────────────────────┤
│ Delta (Δ) │ ∂C/∂S or ∂P/∂S                               │ Call: + / Put: -       │
│ Gamma (Γ) │ ∂²C/∂S² or ∂²P/∂S²                           │ Call: + / Put: +       │
│ Theta (θ) │ ∂C/∂t or ∂P/∂t                               │ Call: - / Put: -       │
│ Vega (ν)  │ ∂C/∂σ or ∂P/∂σ                               │ Call: + / Put: +       │
│ Rho (ρ)   │ ∂C/∂r or ∂P/∂r                               │ Call: + / Put: -       │
└───────────┴──────────────────────────────────────────────┴────────────────────────┘
```

### 1. Delta ($\Delta$)
*   **Definition:** The rate of change of the option price with respect to the change in the underlying asset's price.
*   **Call Delta:** Ranges from $0$ to $+1.0$. For deep out-of-the-money calls, $\Delta \approx 0$; for deep in-the-money calls, $\Delta \approx 1.0$; for at-the-money calls, $\Delta \approx 0.5$.
*   **Put Delta:** Ranges from $-1.0$ to $0$. For deep out-of-the-money puts, $\Delta \approx 0$; for deep in-the-money puts, $\Delta \approx -1.0$; for at-the-money puts, $\Delta \approx -0.5$.
*   **Hedging Application:** If an investor sells 1 call option ($\Delta = 0.60$), they can create a delta-neutral portfolio by buying $0.60$ shares of the underlying stock.

### 2. Gamma ($\Gamma$)
*   **Definition:** The rate of change of the option's Delta with respect to the change in the underlying asset's price. It represents the acceleration of Delta.
*   **Characteristics:** Gamma is positive for both long calls and long puts. It peaks when the option is at-the-money (ATM) and approaches zero when the option is deep in-the-money or out-of-the-money.
*   **Hedging Application:** High Gamma means Delta is highly sensitive to stock price changes, requiring frequent rebalancing of a delta-neutral portfolio. To eliminate Gamma risk, traders must use other options (Gamma hedging).

### 3. Theta ($\Theta$)
*   **Definition:** The sensitivity of the option price to the passage of time (often referred to as "time decay"). It represents the daily loss in option value assuming all other factors remain constant.
*   **Characteristics:** Theta is negative for buyers of options (long calls and puts) and positive for writers of options. Time decay is non-linear; it accelerates rapidly as expiration approaches, particularly for ATM options.

### 4. Vega ($\nu$)
*   **Definition:** The rate of change of the option price with respect to changes in the underlying asset's implied volatility.
*   **Characteristics:** Vega is positive for both long calls and long puts. It is highest for at-the-money options with long maturities. An increase in volatility inflates option prices across the board.

### 5. Rho ($\rho$)
*   **Definition:** The rate of change of the option price with respect to changes in the risk-free interest rate.
*   **Characteristics:** Call options have positive Rho (increase in value when rates rise). Put options have negative Rho (decrease in value when rates rise). It is generally only significant for long-dated options (LEAPs).

---

## 4. Option Valuation Models

In the CA Final AFM curriculum, options are valued using two primary methods: the Binomial Model and the Black-Scholes-Merton Model.

### A. The Binomial Option Pricing Model (BOPM)
The Binomial Model assumes that over a single time step $t$, the stock price can move to one of only two possible values: an up-state ($S_0 \cdot u$) or a down-state ($S_0 \cdot d$).

#### 1. Replicating Portfolio Method (Delta Hedging)
This method involves creating a synthetic option portfolio consisting of $\Delta$ shares of stock and borrowing $B$ at the risk-free rate.
*   **Payoff equations:**
    1.  Up-state: $\Delta \cdot S_u - B \cdot e^{r t} = C_u$
    2.  Down-state: $\Delta \cdot S_d - B \cdot e^{r t} = C_d$
*   **Solving for $\Delta$:**
    $$\Delta = \frac{C_u - C_d}{S_u - S_d}$$
*   **Solving for $B$:**
    $$B = \frac{\Delta \cdot S_d - C_d}{e^{r t}}$$
*   **Option Value today ($C_0$):**
    $$C_0 = \Delta \cdot S_0 - B$$

#### 2. Risk-Neutral Valuation Method
This method assumes that investors are risk-neutral, meaning all assets must earn the risk-free rate of return. We calculate a risk-neutral probability of an up-move ($p$):
$$p = \frac{e^{r t} - d}{u - d}$$

The value of the option is the present value of the expected payoff under these probabilities:
$$C_0 = e^{-r t} \cdot [p \cdot C_u + (1-p) \cdot C_d]$$

#### 3. Multi-Period Binomial Trees and American Options
For multi-period trees (e.g., 2 years with 1-year steps), the option is valued by backward induction:
*   Calculate payoffs at maturity (terminal nodes).
*   Step back to intermediate nodes.
*   For **European options**, calculate the discounted expected value at each node.
*   For **American options**, evaluate the possibility of early exercise at each node:
    $$\text{Option Value at Node} = \max(\text{Intrinsic Value}, \text{Hold Value})$$
    Where $\text{Intrinsic Value} = S_{\text{node}} - X$ (for Call) or $X - S_{\text{node}}$ (for Put).

---

### B. The Black-Scholes-Merton (BSM) Model
The BSM model provides a continuous-time closed-form formula for valuing European options.

#### 1. Assumptions of the BSM Model
*   The stock pays no dividends during the option's life.
*   The option is European-style (exercise only at maturity).
*   No transaction costs, taxes, or short-selling restrictions.
*   The risk-free interest rate ($r$) and asset volatility ($\sigma$) are constant and known.
*   Stock prices follow a geometric Brownian motion (returns are normally distributed).
*   Continuous trading is possible.

#### 2. The Formula
*   **European Call Price ($C_0$):**
    $$C_0 = S_0 \cdot N(d_1) - X \cdot e^{-r T} \cdot N(d_2)$$
*   **European Put Price ($P_0$):**
    $$P_0 = X \cdot e^{-r T} \cdot N(-d_2) - S_0 \cdot N(-d_1)$$

Where:
$$d_1 = \frac{\ln(S_0 / X) + \left(r + \frac{\sigma^2}{2}\right)T}{\sigma \sqrt{T}}$$
$$d_2 = d_1 - \sigma \sqrt{T}$$

*   $N(\cdot)$ is the cumulative standard normal distribution function.
*   $N(d_1)$ represents the delta of the call option.
*   $N(d_2)$ represents the risk-neutral probability that the option will expire in-the-money.

#### 3. Dividend Adjustments in the BSM Model
If a stock pays a discrete dividend $D$ at time $t_d$ during the option's life, the spot price is adjusted:
$$S_0^* = S_0 - D \cdot e^{-r t_d}$$
This adjusted stock price $S_0^*$ is then used in place of $S_0$ in the $d_1$ and call/put valuation formulas.

---

## 5. Put-Call Parity and Arbitrage Mechanics

Put-Call Parity establishes a mandatory relationship between the price of a European call and put option with the same strike price ($X$) and expiration date ($T$) on the same underlying stock ($S_0$).

$$\text{Call} + \text{Present Value of Strike} = \text{Spot Stock} + \text{Put}$$
$$C_0 + X \cdot e^{-r T} = S_0 + P_0$$

### Derivation via Replicating Portfolios:
1.  **Portfolio A:** Buy a Call option ($C_0$) and invest the present value of the strike price ($X e^{-r T}$) at the risk-free rate.
    *   At maturity, the investment grows to $X$.
    *   If $S_T > X$: Call is worth $S_T - X$. Total Portfolio Value = $(S_T - X) + X = S_T$.
    *   If $S_T \le X$: Call is worth $0$. Total Portfolio Value = $0 + X = X$.
    *   **Value at Expiry = $\max(S_T, X)$**
2.  **Portfolio B:** Buy a Put option ($P_0$) and one share of stock ($S_0$).
    *   If $S_T > X$: Put is worth $0$. Total Portfolio Value = $S_T + 0 = S_T$.
    *   If $S_T \le X$: Put is worth $X - S_T$. Total Portfolio Value = $S_T + (X - S_T) = X$.
    *   **Value at Expiry = $\max(S_T, X)$**

Since both portfolios yield identical payoffs under all market conditions, their initial costs must be equal.

### Arbitrage Mechanics (Parity Violations)

```
                       ┌───────────────────────────────┐
                       │   Put-Call Parity Violation   │
                       └───────────────┬───────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
  C + X·e^(-rT) > S + P                                 C + X·e^(-rT) < S + P
  (Call/Bond Overvalued)                                (Put/Stock Overvalued)
            │                                                     │
            ▼                                                     ▼
  [CONVERSION ARBITRAGE]                                [REVERSAL ARBITRAGE]
  - Sell Call                                           - Buy Call
  - Buy Put                                             - Sell Put
  - Buy Stock                                           - Short Stock
  - Borrow Bond (Lend proceeds)                         - Lend Bond (Borrow stock)
```

#### Scenario 1: $C_0 + X \cdot e^{-r T} > S_0 + P_0$ (Conversion Arbitrage)
The Call (or cash) is overvalued, and the Put (or stock) is undervalued.
*   **Strategy today (T=0):**
    *   Write Call option (receive premium).
    *   Buy Put option (pay premium).
    *   Buy Stock (pay spot price).
    *   Borrow the net cash needed at the risk-free rate.
*   **Result at Maturity:** The portfolio value will settle to exactly $X$. This covers the borrowing liability, leaving a risk-free profit.

#### Scenario 2: $C_0 + X \cdot e^{-r T} < S_0 + P_0$ (Reversal Arbitrage)
The Put (or stock) is overvalued, and the Call (or cash) is undervalued.
*   **Strategy today (T=0):**
    *   Buy Call option (pay premium).
    *   Write Put option (receive premium).
    *   Short Sell Stock (receive spot price).
    *   Lend the net cash proceeds at the risk-free rate.
*   **Result at Maturity:** The lent proceeds grow to exceed the cost of acquiring the stock at maturity (which is capped at $X$ due to the options), locking in a risk-free profit.
