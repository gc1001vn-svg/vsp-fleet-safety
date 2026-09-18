#!/usr/bin/env node
// Thuoc do: bo hook cua repo nay co dung luat khong. Chay tu `scripts/do.sh`.
//
//   node scripts/check_hook.mjs
//
// Sau luat duoi day deu tung lam hong that mot lan, o day hoac o ECC. Bat bang
// MAY, vi bon cai dau chi ton tai duoi dang chu — va chu thi phien sau khong doc.
//
// Nguon luat 1-3: affaan-m/ecc `docs/hook-bug-workarounds.md` + `#2222`.
// Luat 4-6 la cua kho nay (`trang-thai.md`, `quyet-dinh/2026-09-05-*`).

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const goc = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const loi = [];
const canh = [];

/** Hook nao la hook: lay tu chinh .claude/settings.json, khong doan theo ten. */
function hook_dang_dung() {
  const p = join(goc, '.claude/settings.json');
  if (!existsSync(p)) return null;
  let set;
  try { set = JSON.parse(readFileSync(p, 'utf8')); } catch { loi.push('.claude/settings.json hong dinh dang'); return null; }
  const ra = [];
  for (const [su_kien, muc] of Object.entries(set.hooks ?? {})) {
    for (const m of muc ?? []) {
      for (const h of m.hooks ?? []) {
        const ten = /scripts\/([\w.-]+\.mjs)/.exec(String(h.command ?? ''))?.[1];
        if (ten) ra.push({ su_kien, ten });
        else canh.push(`${su_kien}: lenh hook khong tro vao scripts/*.mjs — ${h.command}`);
      }
    }
  }
  return ra;
}

const dung = hook_dang_dung();
if (dung === null) {
  process.stdout.write('check:hook — repo chua co .claude/settings.json, bo qua\n');
  process.exit(0);
}
if (dung.length === 0) loi.push('.claude/settings.json khong khai bao hook nao');

for (const { su_kien, ten } of dung) {
  const duong = join(goc, 'scripts', ten);
  const ma = `${su_kien}/${ten}`;
  if (!existsSync(duong)) { loi.push(`${ma}: settings.json tro toi scripts/${ten} nhung file khong co`); continue; }
  const src = readFileSync(duong, 'utf8');

  // 1. Fail-open khi CHINH hook hong. Khong co thi Node in ca vet stack vao
  //    ngu canh, va vet do vao MOI phien.
  if (!/uncaughtException/.test(src) || !/unhandledRejection/.test(src)) {
    loi.push(`${ma}: thieu fail-open (uncaughtException + unhandledRejection)`);
  }

  // 2. Ma thoat: 0 cho qua, 2 chan. Moi ma KHAC harness coi la HOOK HONG va
  //    dan nhan "Hook Error" len mot hook that ra chay dung.
  for (const m of src.matchAll(/process\.exit\(\s*(\d+)\s*\)/g)) {
    if (m[1] !== '0' && m[1] !== '2') loi.push(`${ma}: process.exit(${m[1]}) — chi duoc 0 hoac 2`);
  }
  for (const m of src.matchAll(/thoat(?:_an)?\(\s*(\d+)/g)) {
    if (m[1] !== '0' && m[1] !== '2') loi.push(`${ma}: thoat(${m[1]}) — chi duoc 0 hoac 2`);
  }

  // 3. In thang bang console.* roi process.exit() thi mat chu khi dai (tran
  //    146.176 byte, do 18/09). Moi duong ra phai qua `thoat()`.
  const inThang = [...src.matchAll(/console\.(log|error|warn)\(/g)].length;
  if (inThang) loi.push(`${ma}: con ${inThang} cho dung console.* — phai doi sang thoat(ma, { ra, loi })`);

  // 4. Phai co co bat/tat. Khong co thi cach duy nhat de tat la sua
  //    settings.json — ma file do dang trong danh sach khoa.
  if (!/\bbat\(\s*ID\b/.test(src)) loi.push(`${ma}: khong goi bat(ID, ...) — khong tat rieng duoc`);
  const id = /^const ID = '([^']+)'/m.exec(src)?.[1];
  if (!id) loi.push(`${ma}: khong khai bao const ID`);

  // 5. Hook doc stdin thi phai doc HET truoc khi ket luan. Hook SessionStart
  //    khong nhan gi qua stdin nen duoc mien — chi nhac, khong danh hong.
  if (su_kien !== 'SessionStart' && !/process\.stdin/.test(src)) {
    canh.push(`${ma}: khong doc stdin — hook ${su_kien} co du lieu vao, chac chan dung?`);
  }
}

// 6. Ban trong scripts/ phai trung ban chuan o kho. Lech nghia la mot repo da
//    tu sua, va lan chay `cai_dat.mjs` ke tiep se nuot mat ban sua do.
const KHO = '/home/user/ghi-nho/cong-cu';
if (existsSync(KHO)) {
  for (const { ten } of dung) {
    const a = join(goc, 'scripts', ten);
    const b = join(KHO, ten);
    if (!existsSync(a) || !existsSync(b)) continue;
    if (readFileSync(a, 'utf8') !== readFileSync(b, 'utf8')) {
      canh.push(`scripts/${ten} khac ban chuan o ${KHO} — chay cai_dat.mjs se ghi de`);
    }
  }
}

// 7. `hook_chung.mjs` phai co mat: ca nam hook import no.
if (!existsSync(join(goc, 'scripts/hook_chung.mjs'))) {
  loi.push('thieu scripts/hook_chung.mjs — chay `node /home/user/ghi-nho/cong-cu/cai_dat.mjs`');
}

// 8. File dieu khien theo phien KHONG duoc len git.
const pIg = join(goc, '.gitignore');
if (existsSync(pIg) && !readFileSync(pIg, 'utf8').includes('.claude/hook_phien.txt')) {
  loi.push('.gitignore thieu .claude/hook_phien.txt — tat hook mot phien se lot len git');
}

for (const c of canh) process.stdout.write(`  nhac: ${c}\n`);
for (const l of loi) process.stdout.write(`  HONG: ${l}\n`);
process.stdout.write(`check:hook — ${dung.length} hook, ${loi.length} loi, ${canh.length} nhac\n`);
process.exit(loi.length ? 1 : 0);
