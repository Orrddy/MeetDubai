const { execFileSync } = require('child_process');
const fs = require('fs');
const { sealFor } = require('./seal');
// Template PoC — change ONE field on YOUR OWN account only. Token via env, never committed.
const TOKEN = process.env.MEETDUBAI_TOKEN;
const USER = process.env.MEETDUBAI_USER;
if (!TOKEN || !USER) { console.error('set MEETDUBAI_TOKEN and MEETDUBAI_USER'); process.exit(1); }
function api(method, path, body) {
  const args = ['-s', '--max-time', '30', '-X', method, `https://api.meetdubai.app${path}`,
    '-H', 'Content-Type: application/json', '-H', 'Origin: https://meetdubai.app',
    '-H', `Authorization: Bearer ${TOKEN}`];
  if (body !== undefined) { fs.writeFileSync('tmp-body.json', JSON.stringify(body)); args.push('-d', '@tmp-body.json'); }
  return execFileSync('curl.exe', args, { encoding: 'utf8', maxBuffer: 15 * 1024 * 1024 });
}
const NEW_MONEY = Number(process.env.NEW_MONEY || '1200'); // small increment only
let save = JSON.parse(api('GET', '/save')).save;
console.log('before rev', save.revision, 'money', save.data.money, 'level', save.data.level);
const data = JSON.parse(JSON.stringify(save.data));
data.money = NEW_MONEY; // single-field change
const nonce = JSON.parse(api('GET', '/save/nonce')).nonce;
const seal = sealFor({ nonce, userId: USER, baseRevision: save.revision, saveVersion: save.saveVersion,
  money: data.money, level: data.level, minutes: data.minutes,
  xpTotal: data.xpTotal, savings: data.savings, loan: data.loan, ledgerSeq: data.ledgerSeq });
console.log('PUT', api('PUT', '/save', { data, saveVersion: save.saveVersion, baseRevision: save.revision, lifeScore: 6, seal: { nonce: seal.nonce, sig: seal.sig } }).slice(0, 500));
console.log('after', JSON.parse(api('GET', '/save')).save.data.money);
