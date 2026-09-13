#!/usr/bin/env node
// Hook SessionStart: in gon trang thai dau phien. KHONG chay gi nang.
//
// Vi sao: bay buoc dau phien (`so-thich.md`) la chu, tro ly phai TU NHO lam.
// Do 13/09: 4 trong 7 buoc chi ton tai duoi dang chu. Buoc nao MAY kiem duoc
// thi de may kiem — con lai moi phai nho.
//
// Bon thu file nay tu kiem: nhanh git · thu vien da cai chua · skillOverrides
// co khop khong · lenh do cua repo la gi.
//
// TRAN: output phai duoi ~10 dong. No vao ngu canh MOI phien, dai la phan tac
// dung — chinh cai dang di chong.

import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const chay = (c) => { try { return execSync(c, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim(); } catch { return ''; } };
const d = [];

// --- git: nhanh, so voi remote, con gi chua commit ---------------------------
const nhanh = chay('git rev-parse --abbrev-ref HEAD');
if (nhanh) {
  const ban = chay('git status --porcelain').split('\n').filter(Boolean).length;
  const lech = chay(`git rev-list --count origin/${nhanh}..${nhanh} 2>/dev/null`) || '0';
  const phan = [`nhanh ${nhanh}`];
  if (ban) phan.push(`${ban} file chua commit`);
  if (lech !== '0') phan.push(`${lech} commit chua day`);
  d.push(`git: ${phan.join(' · ')}`);
}

// --- thu vien da cai chua ----------------------------------------------------
if (existsSync('package.json') && !existsSync('node_modules')) d.push('CHUA `npm ci` — chay truoc khi lam gi');
if (existsSync('requirements.txt')) {
  const co = chay('python3 -c "import fastapi" 2>&1');
  if (co) d.push('CHUA cai thu vien python — `pip install -r requirements.txt`');
}

// --- skillOverrides ----------------------------------------------------------
const pSet = '.claude/settings.json';
if (existsSync(pSet)) {
  try {
    const n = Object.keys(JSON.parse(readFileSync(pSet, 'utf8')).skillOverrides || {}).length;
    if (n === 0) d.push('skillOverrides TRONG — moi phien phi ~12.500 ky tu. Chay cong-cu/cai_dat.mjs');
  } catch { d.push(`${pSet} hong dinh dang`); }
} else if (existsSync('.git')) {
  d.push('CHUA co .claude/settings.json — chay `node /home/user/ghi-nho/cong-cu/cai_dat.mjs`');
}

// --- lenh do cua repo --------------------------------------------------------
let lenhDo = '';
if (existsSync('package.json')) {
  try { if (JSON.parse(readFileSync('package.json', 'utf8')).scripts?.do) lenhDo = 'npm run do'; } catch { /* bo qua */ }
}
if (!lenhDo && existsSync('scripts/do.sh')) lenhDo = 'bash scripts/do.sh';
d.push(lenhDo ? `lenh do: ${lenhDo}` : 'repo CHUA co lenh do — dung mot cai truoc khi lam viec moi');

console.log(`[dau phien] ${d.join('\n[dau phien] ')}`);
