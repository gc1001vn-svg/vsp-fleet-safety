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
// Khoa cu KHONG tu phu skill moi. Anthropic them mot skill dung san, hoac chu du
// an tai len skill moi, la no lot vao ngu canh moi phien ma khong ai bao.
// Doan duoi bat duoc phan skill DONG BO (co file tren dia). Skill dung san thi
// khong co file — phan do van phai do A/B, xem `so-thich.md`.
const pSet = '.claude/settings.json';
if (existsSync(pSet)) {
  try {
    const khoa = JSON.parse(readFileSync(pSet, 'utf8')).skillOverrides || {};
    const n = Object.keys(khoa).length;
    if (n === 0) {
      d.push('skillOverrides TRONG — moi phien phi ~12.500 ky tu. Chay cong-cu/cai_dat.mjs');
    } else {
      // Skill CO Y de bat liet ke o `.claude/skill_bat.txt` (mot ten mot dong,
      // `#` la ghi chu). Khong co file do thi moi skill khong khoa deu bi bao.
      const pBat = '.claude/skill_bat.txt';
      const batCoY = new Set(
        existsSync(pBat)
          ? readFileSync(pBat, 'utf8').split('\n').map((l) => l.split('#')[0].trim()).filter(Boolean)
          : [],
      );
      const thuMuc = chay('ls -d ~/.claude/skills/synced/*/*/ 2>/dev/null')
        .split('\n').filter(Boolean)
        .map((p) => p.replace(/\/$/, '').split('/').pop());
      const sot = thuMuc.filter((t) => !(t in khoa) && !batCoY.has(t));
      if (sot.length) d.push(`skill CHUA co khoa: ${sot.join(' ')} — tat trong skillOverrides, hoac ghi vao ${pBat} neu co y bat`);
    }
  } catch { d.push(`${pSet} hong dinh dang`); }
} else if (existsSync('.git')) {
  d.push('CHUA co .claude/settings.json — chay `node /home/user/ghi-nho/cong-cu/cai_dat.mjs`');
}

// --- phien truoc co ghi nhat ky khong ----------------------------------------
// Lo hong duy nhat con lai (do 13/09): may KHONG cuong che duoc ba viec cuoi
// phien — ghi nhat ky, ghi de tien do, cap nhat trang-thai. Hook `chan_bao_xong`
// chi doi dong "So do:", khong kiem da ghi chua. Mot phien lam xong roi quen ghi
// thi phien sau KHONG BIET chuyen do tung xay ra — dung cai chu du an lam kho
// ghi nho de chong.
//
// Khong chan giua phien (lam code truoc, ghi nhat ky sau la binh thuong). Bat o
// DAU phien sau: commit code moi hon commit tai lieu thi phien truoc da quen.
if (nhanh && existsSync('docs/NHAT_KY')) {
  const ngay = (c) => chay(c).slice(0, 10);
  const code = ngay(`git log -1 --format=%cd --date=short -- . ':(exclude)docs' ':(exclude).claude' 2>/dev/null`);
  const tl = ngay(`git log -1 --format=%cd --date=short -- docs/NHAT_KY docs/TIEN_DO.md 2>/dev/null`);
  if (code && tl && code > tl) {
    d.push(`phien truoc sua code ${code} ma nhat ky/tien do dung o ${tl} — doc git log roi ghi bu`);
  }
}

// --- lenh do cua repo --------------------------------------------------------
let lenhDo = '';
if (existsSync('package.json')) {
  try { if (JSON.parse(readFileSync('package.json', 'utf8')).scripts?.do) lenhDo = 'npm run do'; } catch { /* bo qua */ }
}
if (!lenhDo && existsSync('scripts/do.sh')) lenhDo = 'bash scripts/do.sh';
d.push(lenhDo ? `lenh do: ${lenhDo}` : 'repo CHUA co lenh do — dung mot cai truoc khi lam viec moi');

console.log(`[dau phien] ${d.join('\n[dau phien] ')}`);
