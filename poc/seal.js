const crypto = require('crypto');
// Client secret recovered from public JS (obfuscated G/q). Proves seal is forgeable.
const H = '907c9bab36b8108173bfc54329c43f6bd0b55062dda0248888fe28c7f4101bb0';
function hmac(key, msg) {
  return crypto.createHmac('sha256', Buffer.from(key, 'utf8')).update(msg, 'utf8').digest('hex');
}
// localSig check: hmac(H,'local|1100|1|0').slice(0,16) === '3c21bb95ef7ae28d'
function sealFor({ nonce, userId, baseRevision, saveVersion, money, level, minutes, xpTotal, savings, loan, ledgerSeq }) {
  const z = (v) => Math.round(v);
  const msg = [nonce, userId, baseRevision, saveVersion, z(money), z(level), z(minutes), z(xpTotal), z(savings), z(loan), z(ledgerSeq)].join('|');
  return { nonce, sig: hmac(H, msg), _msg: msg };
}
module.exports = { H, hmac, sealFor };
