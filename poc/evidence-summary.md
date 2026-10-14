# Evidence summary (tokens redacted)

- `PUT /save` no seal → `400 code:SEAL`
- `PUT /save money 1100→1200` → `200 rev6 netWorth:1200`, balance `1100→1200`, no new ledger entry
- `PUT /save level 1→2` → `200 rev8`, `2→1` → `Save rejected: the level can't go down`
- `PUT /save` stale `base7` vs cur `8` → `200 rev9` (accepted — no locking)
- `PUT /save 1100→50000` → `Save rejected: net worth grew faster than the game allows`
- `POST /daily/claim` replay → `409 already had today's reward`
- `POST /balance/topup {1,-100}` → `400 >=100`; `{1000000}` → `400 <=100000`
- `POST /wallet/topup {invalid}` → `400 Invalid enum`
- `POST /levels/unlock {level:2}` → `500 Something went wrong` (reproducible); `{level:"abc"}` → `400`
- `PUT /save` wrong userId seal → `400 SEAL`; `GET /save` no token → `Log in first`
- Goals PUT (stats/hunt/cooks/workedToday/visits) → `200 rev37`; visits +2 saved, hunt set
- `130→11000` at level 4 → `200 rev50 netWorth:11000` (level-scaled velocity cap)
- Final observed: user browser sends to `orrddy` drain balance; level legitimately played to `4`, tamper `130→11000` → `rev50`
