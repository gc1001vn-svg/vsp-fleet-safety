#!/usr/bin/env node
// Thuoc: file trong `docs/ke-hoach/` khong duoc dai qua NGUONG dong.
//
// Vi sao co thuoc nay: do 13/09 thay khuon noi "toi da 20 dong" ma thuc te
// 210 va 145 dong — vuot 10 lan va 7 lan. Luat khong ai giu thi khong phai luat.
//
// Nguong 60 KHONG phai con so cho dep: no la so do that cua hai ban ke hoach gan
// nhat (53 va 43 dong) cong cho tho. Khuon cu 20 dong la uoc, chua tung ai dat.
//
// Ke hoach dai la dau hieu lam SAI CHO: phan dai thuong la giai thich va so do,
// thu do thuoc ve `docs/NHAT_KY/` (ghi SAU khi lam) chu khong phai ke hoach
// (ghi TRUOC khi lam). `so-thich.md` muc "Lap ke hoach" co bang chon muc.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const NGUONG = Number(process.env.NGUONG_KE_HOACH) || 60;
const THU_MUC = 'docs/ke-hoach';

// Hai file viet TRUOC khi co thuoc nay. Khong cat — cat la sua lich su ke hoach
// da duyet. Chung dung day lam moc: dung viet dai nhu vay nua.
const MIEN = new Set([
  '2026-09-07-phase-3.md',
  '2026-09-10-quy-hoach-lai.md',
]);

if (!existsSync(THU_MUC)) {
  console.log(`${THU_MUC} khong ton tai — bo qua`);
  process.exit(0);
}

const qua = [];
let n = 0;
for (const ten of readdirSync(THU_MUC).filter((t) => t.endsWith('.md')).sort()) {
  const dong = readFileSync(join(THU_MUC, ten), 'utf8').split('\n').length;
  const mien = MIEN.has(ten);
  n += 1;
  console.log(`  ${String(dong).padStart(4)} dong  ${ten}${mien ? '  (mien, viet truoc khi co thuoc)' : ''}`);
  if (dong > NGUONG && !mien) qua.push({ ten, dong });
}

console.log(`${THU_MUC}: ${n} file, nguong ${NGUONG} dong`);

if (qua.length) {
  console.error(
    `HONG: ${qua.length} ke hoach vuot nguong:\n` +
    qua.map((q) => `  ${q.ten} — ${q.dong} dong`).join('\n') +
    `\n  Cat xuong duoi ${NGUONG}. Phan giai thich va so do day sang docs/NHAT_KY/,` +
    `\n  do la cho ghi SAU khi lam; ke hoach chi ghi TRUOC khi lam.`,
  );
  process.exit(1);
}
