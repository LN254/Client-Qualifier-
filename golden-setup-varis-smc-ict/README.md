# Golden Setup — Varis/SMC-ICT Layer

Pattern ID: `golden_setup_v1`

This layer is parallel to the Seiden supply-demand layer and is kept separate —
do not merge the two.

Validated instance: EURJPY, M15 — sweep 180.598 → CHoCH 180.976 → entry 180.855
→ TP1 181.304 → BOS 181.492 → TP2 181.943

## Files

- `golden_setup_v1.pine` — Pine Script v6 indicator implementing the full
  sequence: swing pivots → liquidity sweep → CHoCH → retest entry zone (order
  block) → BOS confirmation → TP1/TP2.

## Sequence

1. **Sweep** — price wicks through a marked prior swing low/high, closes back
   on the other side.
2. **CHoCH** — the recovery leg breaks and closes beyond the most recent
   internal swing point formed during the swept leg.
3. **Retest entry** — price retraces into the order-block zone between the
   sweep extreme and the last opposite-colored candle before the CHoCH impulse.
4. **BOS confirmation** — continuation breaks the major swing that precedes
   the swept leg.
5. **TP** — TP1 at the nearest unmitigated opposing liquidity between entry
   and BOS; TP2 at the liquidity pool that originated the prior impulsive move.

## Loading in TradingView

1. Open Pine Editor, paste `golden_setup_v1.pine`, add to chart.
2. Inputs are grouped under Swing Points / Risk / Entry.
3. Create two alerts on the indicator with condition **"Any alert() function
   call"** — one payload fires on entry-zone tag (`bos_confirmed: false`), a
   second fires on BOS close (`bos_confirmed: true`).

Note: `alertcondition()` messages are compile-time-constant strings in Pine
and can't carry the live `direction`/level values the JSON schema needs, so
both webhooks are sent via the `alert()` function instead — functionally
equivalent for the n8n webhook, just configured as "Any alert() function
call" rather than a named condition in the Create Alert dialog.

## Alert payload → n8n → Agent Sam

```json
{
  "pattern": "golden_setup_v1",
  "symbol": "EURJPY",
  "timeframe": "15",
  "direction": "long",
  "sweep_level": 180.598,
  "choch_level": 180.976,
  "entry": 180.855,
  "stop_loss": 180.798,
  "tp1": 181.304,
  "tp2": 181.943,
  "rr_tp1": 2.31,
  "rr_tp2": 9.55,
  "bos_confirmed": false,
  "timestamp": "2026-01-01T00:00:00Z"
}
```

Agent Sam should log every triggered instance (not just winners) and score on:
RR to TP1/TP2, time-in-zone before entry tag, whether BOS confirmed before or
after TP1, and HTF structural alignment with direction.

## Visual convention (unchanged)

| Level | Color | Label |
|---|---|---|
| CHoCH | purple | "CHoCH" |
| BOS | black | "BOS" |
| SL | green | "SL" |
| Entry | green | "Entry" |
| TP1 / TP2 | red | "TP1" / "TP2" |
