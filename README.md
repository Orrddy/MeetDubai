# MeetDubai bug hunt (minimal repro)

Authorized test only — own account, low-volume. No secrets in this repo.

## Fresh PC in 10 steps

1. Install Node 24+ (Windows has `curl.exe` built in; macOS/Linux use `curl`).
2. `git clone https://github.com/Orrddy/MeetDubai.git && cd MeetDubai`
3. `npm install`
4. `npx playwright install chromium` (only needed for browser-capture scripts; API PoC needs just Node + curl).
5. Log in once locally (never commit output) to get JWT + user id:
```powershell
node -e "fetch('https://api.meetdubai.app/auth/login',{method:'POST',headers:{'content-type':'application/json','origin':'https://meetdubai.app'},body:JSON.stringify({login:'YOUR_USER',password:'YOUR_PASS'})}).then(r=>r.text()).then(t=>require('fs').writeFileSync('login.local.json',t))"
# read token: (Get-Content login.local.json | ConvertFrom-Json).token
# read user id: (Get-Content login.local.json | ConvertFrom-Json).user.id
# then delete login.local.json
```
6. Set env (PowerShell):
```powershell
$env:MEETDUBAI_TOKEN="PASTE_JWT"
$env:MEETDUBAI_USER="PASTE_USER_ID"
```
7. Check state: `GET /save` (note `revision`, `money`, `level`), `GET /balance`.
8. Run template (one small field only): `$env:NEW_MONEY="1200"; node poc/save-tamper.js`
9. Verify: `GET /save` + `GET /balance` (look for new `revision`, no new ledger entry = trust bug).
10. Screenshot: keep game tab closed until PUT lands, reopen → `Load the newer save` on conflict → HUD/Wallet.

Details: `DOCUMENTARY.md`. Scope/rules: `pent.md`. Sanitized PoC: `poc/`.
