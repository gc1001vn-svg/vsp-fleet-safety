#!/usr/bin/env node
// Phan CHUNG cua moi hook: co bat/tat · thoat khong mat chu · tran ngu canh.
// Ban dung chung cho moi du an cua gc1001vn-svg. `cai_dat.mjs` chep vao scripts/.
//
// Y tuong lay tu affaan-m/ecc (MIT) — `scripts/lib/hook-flags.js` va cach thoat
// trong `scripts/hooks/run-with-flags.js` (#2222). Code viet lai tu dau, khong
// them thu vien nao.
//
// ---------------------------------------------------------------------------
// 1. CO BAT/TAT — ba tang, tang HEP thang tang RONG
//
//   moi du an  mac dinh trong file nay: muc "thuong", khong tat gi
//   mot du an  .claude/hook.json      (LEN git)   { "muc": "...", "tat": [...] }
//   mot phien  .claude/hook_phien.txt (gitignore) chet cung may ao
//
// VI SAO FILE, KHONG PHAI BIEN MOI TRUONG (do 18/09/2026):
//   `export X=1` trong mot lenh Bash KHONG song sang lenh Bash ke tiep — do
//   that: lenh 1 `export THU_BIEN=co_roi`, lenh 2 doc lai duoc chuoi rong. Hook
//   lai do chinh Claude Code spawn, khong phai shell, nen cang khong thay.
//   => GIUA PHIEN chi co FILE bat/tat duoc hook.
//   Bien moi truong van doc (GC_HOOK_MUC · GC_HOOK_TAT · GC_HOOK_THU) nhung chi
//   dat duoc o `.claude/settings.json` muc "env" — tuc la tang DU AN, va phai
//   mo lai phien moi an. Dung no cho mac dinh lau dai, dung cho viec tam.
//
// ---------------------------------------------------------------------------
// 2. THOAT KHONG MAT CHU
//
// `process.stdout.write(s); process.exit(0)` cat mat phan duoi khi `s` lon.
// Do 18/09 tren may ao nay (Node v22.22.2, stdout la pipe):
//
//   gui 146.176 byte -> nhan du
//   gui 147.456 byte -> nhan 146.176, MAT 1.280
//   gui   1 MB       -> nhan 146.176, MAT 902.400
//
// stderr y het. Tran dung 146.176 byte, khong phu thuoc ben doc nhanh hay cham.
// Harness doc phai JSON cut giua chung thi coi ca hook la HONG -> chan luon tool
// call. Hook lon nhat hien gio moi 973 byte (0,7% tran) nen day la BAO HIEM,
// chua phai loi dang chay. Chep tu ECC de khoi phai gap lai.
//
// ---------------------------------------------------------------------------
// Fail-open tuyet doi: moi duong loi trong file nay deu tra ve "cho chay tiep".

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Muc hop le, tu long den chat. */
export const MUC_HOP_LE = ['nhe', 'thuong', 'chat'];

/** Tran byte cua mot lan ghi + `process.exit()`. Do that 18/09, xem dau file. */
export const TRAN_GHI = 146176;

/**
 * Tran KY TU cho phan hook chen vao ngu canh.
 *
 * Khac `TRAN_GHI`: cai kia la gioi han KY THUAT (mat chu), cai nay la gioi han
 * TIEN (ngu canh vao moi phien / moi luot). ECC dat 8.000; o day 4.000 vi kho
 * ghi-nho da co san va hook chi la cai nhac. Hook nao vuot thi bi cat, kem dau.
 */
export const TRAN_NGU_CANH = 4000;

const goc = () => process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

function doc_json(duong) {
  try { return JSON.parse(readFileSync(duong, 'utf8')); } catch { return null; }
}

/**
 * Doc `.claude/hook_phien.txt`. Moi dong mot lenh, `#` la ghi chu:
 *
 *   muc=nhe        doi muc cho ca phien
 *   THU            chay thu — hook bao "toi se chay" roi cho qua, khong lam gi
 *   dung:chan-bao-xong    tat rieng hook do
 *   +cau:nhac-kho         bat lai hook do du muc dang tat no
 */
function doc_phien(root) {
  const ra = { muc: '', tat: new Set(), bat: new Set(), thu: false };
  let van;
  try { van = readFileSync(join(root, '.claude/hook_phien.txt'), 'utf8'); } catch { return ra; }
  for (const tho of van.split('\n')) {
    const d = tho.split('#')[0].trim();
    if (!d) continue;
    if (d.toUpperCase() === 'THU') { ra.thu = true; continue; }
    const m = /^muc\s*=\s*(\w+)$/i.exec(d);
    if (m) { ra.muc = m[1].toLowerCase(); continue; }
    if (d.startsWith('+')) ra.bat.add(d.slice(1).trim());
    else ra.tat.add(d.replace(/^-/, '').trim());
  }
  return ra;
}

/** Doc `.claude/hook.json` cua du an. */
function doc_du_an(root) {
  const o = doc_json(join(root, '.claude/hook.json'));
  return {
    muc: typeof o?.muc === 'string' ? o.muc.toLowerCase() : '',
    tat: new Set(Array.isArray(o?.tat) ? o.tat.map(String) : []),
  };
}

function tach_csv(s) {
  return new Set(String(s || '').split(',').map((x) => x.trim()).filter(Boolean));
}

/**
 * Tra ve trang thai day du — dung cho `check_hook.mjs` va cho ban than `bat()`.
 * Tach rieng de kiem tra duoc ma khong phai spawn hook that.
 */
export function trang_thai(id, mucCho, moi_truong = process.env, root = goc()) {
  const phien = doc_phien(root);
  const duAn = doc_du_an(root);

  const mucRaw = phien.muc || moi_truong.GC_HOOK_MUC || duAn.muc || 'thuong';
  const muc = MUC_HOP_LE.includes(mucRaw) ? mucRaw : 'thuong';

  const cho = (Array.isArray(mucCho) && mucCho.length ? mucCho : ['thuong', 'chat'])
    .map((x) => String(x).toLowerCase());

  const thu = phien.thu || moi_truong.GC_HOOK_THU === '1';
  const tatCsv = tach_csv(moi_truong.GC_HOOK_TAT);

  let batTat = cho.includes(muc);
  let vi = batTat ? `muc ${muc}` : `muc ${muc} khong goi hook nay (chi ${cho.join(',')})`;
  if (duAn.tat.has(id)) { batTat = false; vi = '.claude/hook.json tat'; }
  if (tatCsv.has(id)) { batTat = false; vi = 'GC_HOOK_TAT tat'; }
  if (phien.tat.has(id)) { batTat = false; vi = '.claude/hook_phien.txt tat'; }
  // `+id` o tang phien la tang HEP nhat — thang tat ca.
  if (phien.bat.has(id)) { batTat = true; vi = '.claude/hook_phien.txt bat lai'; }

  return { bat: batTat, muc, thu, vi };
}

/**
 * Hook nay co duoc chay khong.
 *
 * @param {string}   id      dinh danh, vd "dung:chan-bao-xong"
 * @param {string[]} mucCho  cac muc hook nay chay. Mac dinh ['thuong','chat'].
 *
 * Chay thu (THU) tra ve `false` va in mot dong vao stderr — dung de xem hook
 * SE lam gi ma khong phai chiu hau qua. Do 12/09: mot phien 13 lan chan thi 4
 * lan chan NHAM; muon go cai do thi phai nhin duoc truoc khi no chan.
 */
export function bat(id, mucCho) {
  let t;
  try { t = trang_thai(id, mucCho); } catch { return true; } // hong -> cu chay nhu cu
  if (t.thu && t.bat) {
    try { process.stderr.write(`[hook thu] ${id} SE chay (${t.vi}) — dang chay thu nen cho qua\n`); } catch { /* im */ }
    return false;
  }
  return t.bat;
}

/**
 * Thoat sau khi chu da ra het. Thay cho `process.exit()` o moi hook.
 *
 * @param {number} ma   0 cho qua · 2 chan. Ma khac harness coi la HOOK HONG.
 * @param {{ra?: string, loi?: string}} chu  stdout / stderr
 */
export function thoat(ma, chu = {}) {
  const ra = typeof chu.ra === 'string' ? chu.ra : '';
  const loi = typeof chu.loi === 'string' ? chu.loi : '';
  process.exitCode = ma;

  let cho = 1;
  const xong = () => { if (--cho === 0) process.exit(ma); };

  try {
    if (loi) { cho++; process.stderr.write(loi.endsWith('\n') ? loi : `${loi}\n`, xong); }
    if (ra) { cho++; process.stdout.write(ra, xong); }
  } catch { process.exit(ma); }

  // Luoi cuoi: ong dut (EPIPE) thi callback co the khong bao gio goi. `unref`
  // nen khi ghi xong binh thuong, tien trinh van thoat ngay, khong doi 2 giay.
  try { setTimeout(() => process.exit(ma), 2000).unref(); } catch { /* im */ }

  xong();
}

/**
 * Cat chuoi ngu canh cho vua tran, kem dau de biet la da bi cat.
 * Tra ve `{ van, tok, cat }` — `tok` uoc ~4 ky tu/token.
 */
export function cat_tran(van, tran = TRAN_NGU_CANH) {
  const s = String(van ?? '');
  if (s.length <= tran) return { van: s, tok: uoc_tok(s), cat: false };
  const dau = `\n[cat bot — vuot tran ${tran} ky tu. Sua TRAN_NGU_CANH trong scripts/hook_chung.mjs neu that su can]`;
  const v = s.slice(0, Math.max(0, tran - dau.length)) + dau;
  return { van: v, tok: uoc_tok(v), cat: true };
}

/**
 * Uoc token: BYTE chia 3. Mot cong thuc duy nhat cho ca kho.
 *
 * Do 18/09, moc neo la repomix (bo tach tu that) tren 84 file `src`+`tests` cua
 * `quoc-chien`: that 134.317 token · `byte/3` ra 132.023 (**-1,7%**) ·
 * `ky tu/4` ra 98.721 (**-26,5%**). Thuc do 2,95 byte/token.
 *
 * Truoc 18/09 hai hook nay dung `ky tu/4` con cac thuoc (`check_token.mjs`,
 * `do_token.sh`, `check_kho.mjs`) dung `byte/3` — hai so canh nhau lech 60%+ ma
 * khong ai doi chieu duoc. Gio ca kho mot cong thuc.
 *
 * Van la UOC: moc neo do tren MA (ty le byte/ky tu 1,00). Van xuoi tieng Viet co
 * dau ty le 1,20-1,25, chua co moc neo that — dung tin so tuyet doi qua 10%.
 */
export function uoc_tok(s) {
  return Math.floor(Buffer.byteLength(String(s ?? ''), 'utf8') / 3);
}
