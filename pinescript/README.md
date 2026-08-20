# Supply & Demand Zones (Sam Seiden Method)

Pine Script v5 indicator implementing the core supply/demand zone
methodology from Sam Seiden's *Supply Demand Trading* (Online Trading
Academy): identifying **Rally-Base-Rally**, **Drop-Base-Rally**,
**Rally-Base-Drop**, and **Drop-Base-Drop** patterns to mark demand
(support) and supply (resistance) zones directly on the chart.

## How it works

1. **Base detection** — a run of 1 to `Max Candles in a Base` candles whose
   range is small relative to ATR (consolidation/indecision, where large
   orders accumulate).
2. **Leg-out detection** — the candle that leaves the base with a range
   at least `Min Leg-Out Range (x ATR)`, confirming an imbalance between
   buyers and sellers.
3. **Pattern classification**:
   - Rally-Base-Rally / Drop-Base-Rally → **Demand zone** (teal)
   - Rally-Base-Drop / Drop-Base-Drop → **Supply zone** (red)
4. **Zone lines** — proximal line uses the base candles' body extreme
   (closest to price when it returns), distal line uses the wick extreme
   (useful for stop placement), matching Seiden's zone-drawing convention.
5. **Freshness** — a zone is drawn in full color until price trades back
   into it, at which point it turns gray ("tested") and stops extending,
   reflecting Seiden's rule that fresh, untested zones carry the highest
   probability.

## Inputs

- **Base Detection**: ATR length, basing-candle range threshold, max base size.
- **Leg-Out Detection**: minimum breakout range (in ATR) to count as a
  strong, imbalanced move out of the base.
- **Zone Display**: toggle demand/supply, proximal-line style (body vs.
  wick), how far to extend fresh zones, max zones kept per side, whether
  to hide tested zones, and zone labels.
- **Colors**: fully configurable fill/border colors for fresh and tested zones.

## Alerts

Two alert conditions are included and fire when price first trades back
into a fresh zone:
- **Price Entered Demand Zone**
- **Price Entered Supply Zone**

## Usage

1. Open TradingView → Pine Editor.
2. Paste the contents of `seiden_supply_demand_zones.pine`.
3. Add to chart, tune the base/leg-out thresholds per instrument and
   timeframe (tighter thresholds work well on lower timeframes, looser
   ones on daily/weekly).

This is a discretionary-trading aid, not a standalone signal generator —
per Seiden's teaching, use zones as areas of interest and combine with
your own risk/reward and confirmation rules.
