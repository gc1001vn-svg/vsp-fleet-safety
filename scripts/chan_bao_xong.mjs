#!/usr/bin/env node
// Hook Stop cho Claude Code: chan Claude bao "xong" khi chua dua so do that.
// Ban dung chung cho moi du an cua gc1001vn-svg.
//
// Quy uoc: cau tra loi nao noi "xong" / "hoan thanh" / "hoan tat" thi phai co
// mot dong bat dau bang "So do:" (co dau: "Số đo:"). Khong can do that thi ghi
// "So do: khong can - <ly do>". Bat buoc noi ra, khong duoc im lang.
//
// Cai vao mot du an:
//   1. Chep file nay vao <du-an>/scripts/chan_bao_xong.mjs
//   2. Them vao <du-an>/.claude/settings.json:
//      "Stop": [{ "hooks": [
//        { "type": "command",
//          "command": "node $CLAUDE_PROJECT_DIR/scripts/chan_bao_xong.mjs",
//          "timeout": 10 } ] }]
//
// Fail-open: doc loi hoac du lieu hong thi cho qua, khong lam treo phien.
// Ly do: quyet-dinh/2026-09-05-chua-do-duoc-thi-khong-sua.md

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Tu phu dinh dung ngay truoc "xong" -> khong tinh la bao xong. */
const PHU_DINH = 'chưa|chua|không|khong|sắp|sap|gần|gan|nếu|neu|khi nào|khi nao';
const BAO_XONG = 'xong|hoàn thành|hoan thanh|hoàn tất|hoan tat';
// Cho phep ky tu trang tri Markdown dung truoc: ` * _ ~ # - > va khoang trang.
const CO_SO_DO = /^[\s>*_`~#-]*(số đo|so do)\s*:/im;

let raw = '';
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  let d;
  try {
    d = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  // Da bi chan mot lan roi thi thoi, tranh lap vo han.
  if (d?.stop_hook_active === true) process.exit(0);

  const msg = typeof d?.last_assistant_message === 'string'
    ? d.last_assistant_message
    : '';
  if (!msg) process.exit(0);

  // Bo phan trich dan truoc: khoi ma, nhay nguoc, nhay kep, nhay don.
  // Nhac lai chu "xong" de ban bac thi khong phai la bao xong.
  // Roi bo cac cho "chua xong", "khong hoan thanh"...
  const t = msg
    .toLowerCase()
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/["\u201C\u201D][^"\u201C\u201D\n]*["\u201C\u201D]/g, ' ')
    .replace(/['\u2018\u2019][^'\u2018\u2019\n]*['\u2018\u2019]/g, ' ')
    .replace(new RegExp(`(${PHU_DINH})\\s+(${BAO_XONG})`, 'g'), ' ');
  const baoXong = new RegExp(`(^|[^\\p{L}])(${BAO_XONG})([^\\p{L}]|$)`, 'u').test(t);
  if (!baoXong) process.exit(0);

  const dongSoDo = msg.split('\n').find((l) => CO_SO_DO.test(l));
  if (!dongSoDo) {
    console.error(
      'Cau tra loi noi "xong" nhung khong co dong "So do:". ' +
      'Chua do duoc thi khong duoc bao xong — hay dua so do that, ' +
      'hoac ghi mot dong "So do: khong can - <ly do>".',
    );
    process.exit(2);
  }

  // Ghi "khong can" thi cho qua, da noi ro ly do la du.
  if (/không cần|khong can/i.test(dongSoDo)) process.exit(0);

  // Noi la co so do that -> doi chieu voi so lenh da chay trong luot nay.
  // So khong co (chua cai ghi_so_lenh.mjs) thi cho qua, khong chan mo.
  const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  let daChayLenh = true;
  try {
    const so = readFileSync(join(root, '.claude/so_lenh.log'), 'utf8');
    const luot = d?.prompt_id ?? '';
    if (luot) {
      daChayLenh = so
        .split('\n')
        .some((l) => l.startsWith(`${luot}\t`) && l.split('\t')[1] === 'Bash');
    }
  } catch {
    process.exit(0);
  }

  if (!daChayLenh) {
    console.error(
      'Cau tra loi dua "So do:" nhung so lenh cua luot nay khong ghi nhan ' +
      'lenh Bash nao da chay. So do phai chep tu ket qua that. ' +
      'Hay chay lenh do that, hoac sua thanh "So do: khong can - <ly do>".',
    );
    process.exit(2);
  }
  process.exit(0);
});
