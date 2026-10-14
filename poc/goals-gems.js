const { execFileSync } = require('child_process');
const fs = require('fs');
const { sealFor } = require('./seal');
// Goals/gems/daily template — YOUR OWN account only. Reads token from env.
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
// Level 2 needs: stats.shifts>=1, stats.hangouts>=1, stats.trainings>=1 (I(2)).
// Daily (places2/cook1/work45): visits+2 distinct today, cooks=1, workedToday=8 + workDay=day.
// Gems: hunt={day, found:[3 place ids]} — header shows found.length/3.
const save = JSON.parse(api('GET', '/save')).save;
const d = save.data;
const day = Math.floor(d.minutes / 1440), dayStart = 1440 * day;
const nd = JSON.parse(JSON.stringify(d));
nd.stats.shifts = Math.max(nd.stats.shifts || 0, 2);
nd.stats.hangouts = Math.max(nd.stats.hangouts || 0, 5);
nd.stats.trainings = Math.max(nd.stats.trainings || 0, 5);
nd.stats.meals = Math.max(nd.stats.meals || 0, 5);
nd.stats.gigs = Math.max(nd.stats.gigs || 0, 5);
nd.workedToday = 8; nd.workDay = day;
nd.cooks = 1;
nd.visits = [...nd.visits,
  { place: 'beach', from: dayStart + 600, to: dayStart + 660 },
  { place: 'mall', from: dayStart + 700, to: dayStart + 760 }];
nd.hunt = { day, found: ['beach', 'mall', 'gym'] };
const nonce = JSON.parse(api('GET', '/save/nonce')).nonce;
const seal = sealFor({ nonce, userId: USER, baseRevision: save.revision, saveVersion: save.saveVersion,
  money: nd.money, level: nd.level, minutes: nd.minutes,
  xpTotal: nd.xpTotal, savings: nd.savings, loan: nd.loan, ledgerSeq: nd.ledgerSeq });
console.log(api('PUT', '/save', { data: nd, saveVersion: save.saveVersion,
  baseRevision: save.revision, lifeScore: 6, seal: { nonce: seal.nonce, sig: seal.sig } }).slice(0, 300));
console.log('verify with GET /save (revision+1, stats/hunt set; money/level untouched)');
