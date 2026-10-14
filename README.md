# MeetDubai Bug Hunt — Documentary

Target: `https://meetdubai.app/` + in-scope `https://api.meetdubai.app` (discovered from app JS).
Account: own authorized test account only. No other users touched by these scripts.
Status: `PUT /save` client-trust confirmed (money + level + goals). See evidence summaries — tokens redacted.

> Secrets are never committed. `login.json`, `tmp-body.json`, tokens/passwords stay local. PoC scripts read `MEETDUBAI_TOKEN` / `MEETDUBAI_USER` from env.

## What was done

1. Recon landing (Next.js CSR), mapped `_next/static/chunks`, found `https://api.meetdubai.app/time`.
2. Dumped JS, found `Api` object: `/auth/login`, `/auth/me`, `/save`, `/save/nonce`, `/save/flag`, `/wallet`, `/wallet/topup`, `/balance`, `/balance/topup`, `/daily/claim`, `/levels/unlock`, `/market`, `/friends/money/*`, leaderboards, etc.
3. Logged in via `POST /auth/login`, stored JWT locally only.
4. Captured real browser `PUT /save` via Playwright (Settings → Save now) to learn `saveVersion/baseRevision/lifeScore/seal` format.
5. Reversed seal: `HMAC_SHA256(H, "nonce|userId|baseRev|saveVer|money|level|round(minutes)|xpTotal|savings|loan|ledgerSeq")`, `H` obfuscated in JS (`G/q`).
6. Proved tamper (own account, single-field, small steps, then reverted where possible):
   - `1100→1200` money `200` + balance `1100→1200` (no ledger entry)
   - `1→2` level `200` (no goals), `2→1` rejected (monotonic)
   - stale `baseRevision` accepted (no optimistic locking)
   - `50k` blocked by `net worth grew faster` velocity check
   - goals: stats/hunt/cooks/workedToday/visits set for level-2 goals, daily `places2/cook1/work45`, gems `3/3`
7. Negative tests: daily replay `409`, balance min/max `400`, wallet pack `400`, wrong-user seal `400 SEAL`, no-auth `Log in first`.

## Install / reproduce

Requires: Windows + Node 24+, `curl.exe`, no Burp needed (Playwright `request` used as Repeater).

```powershell
npm init -y
npm i -D playwright
npx playwright install chromium
$env:MEETDUBAI_TOKEN="YOUR_JWT_FROM_LOGIN"
$env:MEETDUBAI_USER="YOUR_USER_ID"
node poc/save-tamper.js
```

Login (do once locally, never commit output):

```powershell
# writes login.json locally (gitignored)
node -e "fetch('https://api.meetdubai.app/auth/login',{method:'POST',headers:{'content-type':'application/json','origin':'https://meetdubai.app'},body:JSON.stringify({login:'YOUR_USER',password:'YOUR_PASS'})}).then(r=>r.text()).then(t=>require('fs').writeFileSync('login.json',t))"
```

Key files:
- `poc/seal.js` — `H` + HMAC + seal message format
- `poc/save-tamper.js` — template: GET save/nonce → PUT with one changed field
- `poc/goals-gems.js` — template: level-2 goals + daily `places2/cook1/work45` + gems `3/3` (money/level untouched)
- `poc/evidence-summary.md` — redacted statuses/revisions (no tokens)
- `pent.md` — original scope/rules

## Goals / daily / gems how-to

Seal covers only `money|level|minutes|xpTotal|savings|loan|ledgerSeq` — stats/quests/hunt/visits are unbound, so they can be set freely with a valid seal for unchanged money/level.
- Level 2 (`I(2)`): `stats.shifts>=1`, `stats.hangouts>=1`, `stats.trainings>=1` → `3/3 complete`.
- Daily: `U(work)=workedToday` (needs `workDay=day(minutes)`), `U(places)=distinct visits today` (not home/work), `U(cook)=cooks`. Set `workedToday=8 + workDay=day`, `cooks=1`, append 2 visits (`beach`,`mall` at `dayStart+600/700`) → `places2/cook1/work45` done. Leave `quests.claimed=[]` (progress without auto-claiming rewards).
- Gems: `hunt={day: floor(minutes/1440), found:[3 place ids]}` → header `3/3` (`found.length/3`). Server accepted arbitrary valid ids in test.
- Velocity: `1100→50000` blocked (`net worth grew faster`), small steps pass; higher level raises cap (`130→11000` at level 4 passed → `rev50 netWorth:11000`).

## Findings (short)

- F1 balance via `PUT /save` — High. `1100→1200` accepted, balance follows, no ledger. Fix: server-authoritative ledger.
- F2 level `1→2` — High. No prerequisite check. Fix: validate transitions.
- F3 stale `baseRevision` accepted — Medium. Fix: enforce equality → `409`.
- F4 `POST /levels/unlock {level:2}` → `500` reproducible — Low. Fix: proper 4xx.
- Contributing: client secret in JS + `reportTamper`/`save/flag` is deterrent only.

Full report: see `REPORT.md` (generated from session) or session evidence `evidence-*.txt` (local only, redacted before commit).

## Safety notes

- Own account only, low-volume, one-field-at-a-time (except combined goals request).
- Money reverted to `1100` after first PoC; later user-driven sends to `orrddy` (`-1000/-2000/-2700/-3000`) drained balance — those were browser actions, not scripts. Level stuck at `2` (server blocks decrease).
- No withdrawals, no other-user enumeration, no stored-XSS payloads (would hit leaderboards).
