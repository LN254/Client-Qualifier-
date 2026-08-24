# Agent Sam — SMC/ICT POI + Liquidity Layer

Pine Script v6 indicator implementing the Varis top-down SMC/ICT layer described in the
generation spec: HTF structure → POI (order block / FVG) → LTF liquidity sweep →
binary confluence gate. It is a **parallel** layer to the existing Seiden
OTA/Drop-Base-Rally engine, not a replacement — same alert pipeline (TradingView webhook
→ n8n), separate qualification logic, separate payload tag (`"layer": "smc_poi_liquidity"`).

> This repo (`Client-Qualifier-`) doesn't contain the Seiden/Agent Sam host codebase or the
> n8n workflow that receives these alerts, so this component ships standalone. See
> **Integration** below for how to wire it into an existing Agent Sam n8n pipeline.

## File

- `smc_poi_liquidity.pine` — the indicator. Paste into TradingView's Pine Editor
  (Pine v6). Not compiled/tested against the live editor in this session — sanity-check
  it there before deploying to a real alert.

## What it does

1. **HTF structure** (`htf_input`, default 4H): confirmed-bar pivots (`pivotLen`, default
   5) build a bullish/bearish/ranging state via BOS (break with trend) / CHoCH (break
   against trend). Structure flips to `ranging` after `rangeLookback` HTF bars with no
   break.
2. **POI**: on each BOS/CHoCH, the impulsive leg's origin is scanned for a POI —
   `poiMode` = `orderblock` (last opposite-colored candle before the leg), `fvg`
   (3-candle imbalance inside the leg), or `both` (FVG preferred, order block fallback).
   Zone invalidates on an HTF **close** fully through it; a wick through does not
   invalidate.
3. **Liquidity sweep** (`ltf_input`, default 15m/1H): once price taps the active HTF POI,
   watches the nearest LTF swing point resting at/beyond the POI edge for a wick-through
   that closes back inside within `sweepMaxBars` bars — a stop-run, not a clean break.
4. **Confluence gate** (`smc_signal_valid`): true only when structure is directional, the
   matching-direction POI is active/tapped, and the sweep confirmed after the tap. The
   payload still fires on non-qualifying bars (flagged `smc_signal_valid: false`) so
   backtesting doesn't lose data — toggle with the "Fire Alert on Every Confirmed LTF Bar"
   input.

## Payload

Matches the spec's schema. `{{ticker}}` / `{{time}}` are TradingView placeholders resolved
at alert-fire time; everything else is computed by the script.

```json
{
  "layer": "smc_poi_liquidity",
  "symbol": "{{ticker}}",
  "htf": "240",
  "ltf": "15",
  "structure_bias": "bullish",
  "poi_type": "orderblock",
  "poi_high": 1.40230,
  "poi_low": 1.40180,
  "poi_direction": "bullish",
  "liquidity_swept": true,
  "sweep_price": 1.40175,
  "smc_signal_valid": true,
  "bar_time": "{{time}}"
}
```

## Integration with Agent Sam / Seiden

The spec calls for merging this under a nested `"smc"` key inside the existing Agent Sam
payload rather than a second webhook, so both layers land in one n8n execution. Since
Seiden's workflow isn't in this repo, wire it up on the Seiden side as:

1. Point this indicator's TradingView alert at the **same webhook URL** Seiden already
   uses.
2. In the n8n workflow's normalize/merge step (wherever Seiden's alert JSON is parsed),
   nest this payload under `smc` instead of merging fields at the top level:
   ```js
   return [{ json: { ...seidenPayload, smc: smcPayload } }];
   ```
3. Use `smc.smc_signal_valid` as a confluence multiplier/filter on Seiden's existing
   0–100 zone score, or require both independently per your risk rules — the spec treats
   this as additive, not a competing score.

## Known assumptions (documented ambiguity from the spec's own Notes)

- **Anchor candle with multiple consolidation candles before the move**: this
  implementation picks the *nearest* opposite-colored candle to the impulsive leg,
  falling back to the swing-pivot candle itself if the whole leg is one color. Tighten
  against more ICT source material if a different selection rule is intended.
- **poiMode "both"**: prefers the first FVG found inside the leg (tighter entry), falls
  back to the order-block anchor if no FVG formed. Not specified in the source spec.
- **Wick-through vs. close invalidation**: implemented literally per the spec — only an
  HTF close fully through the zone invalidates it, regardless of whether it was tapped
  first.
