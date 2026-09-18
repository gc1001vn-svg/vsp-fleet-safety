#!/usr/bin/env node
// Hook PostToolUse cho Claude Code: ghi so cac lenh Claude that su da chay.
// Di cung chan_bao_xong.mjs — so nay la bang chung, khong phai loi Claude noi.
// Y tuong lay tu AlethiaQuizForge/no-hallucination (MIT), code viet lai tu dau.
//
// Cai vao mot du an:
//   1. Chep file nay vao <du-an>/scripts/ghi_so_lenh.mjs
//   2. Them vao <du-an>/.claude/settings.json:
//      "PostToolUse": [{ "hooks": [
//        { "type": "command",
//          "command": "node $CLAUDE_PROJECT_DIR/scripts/ghi_so_lenh.mjs",
//          "timeout": 10 } ] }]
//   3. Them ".claude/so_lenh.log" vao .gitignore
//
// Fail-open, khong bao gio chan gi: hook nay chi ghi.

import { appendFileSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
// Hook nay khong in gi ra stdout/stderr nen khong can `thoat()` — moi duong ra
// deu la `process.exit(0)` tay khong, khong co chu de mat.
import { bat } from './hook_chung.mjs';

const ID = 'sau:ghi-so-lenh';
const GIU_DONG = 300;

// Than ham da boc try/catch, nhung loi NGOAI than — stdin dut, JSON qua lon —
// van lam Node in vet stack vao ngu canh. Boc not.
process.on('uncaughtException', () => process.exit(0));
process.on('unhandledRejection', () => process.exit(0));

// Chay o CA BA muc, ke ca `nhe`: `chan_bao_xong` lay chinh so nay lam bang chung
// cho dong "So do:". Tat cai nay thi thuoc do ben kia thanh loi noi suong.
if (!bat(ID, ['nhe', 'thuong', 'chat'])) process.exit(0);

let raw = '';
process.stdin.on('error', () => process.exit(0));
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  try {
    const d = JSON.parse(raw);
    const ten = d?.tool_name ?? '';
    if (!ten) process.exit(0);

    const vao = d?.tool_input ?? {};
    const chiTiet = String(vao.command ?? vao.file_path ?? vao.pattern ?? '')
      .split('\n')[0]
      .slice(0, 200);
    const dong = `${d?.prompt_id ?? '-'}\t${ten}\t${chiTiet}\n`;

    const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
    const so = join(root, '.claude/so_lenh.log');
    mkdirSync(dirname(so), { recursive: true });
    appendFileSync(so, dong);

    // Cat bot cho khoi phinh.
    const tatCa = readFileSync(so, 'utf8').split('\n');
    if (tatCa.length > GIU_DONG * 2) {
      writeFileSync(so, tatCa.slice(-GIU_DONG).join('\n'));
    }
  } catch {
    // Im lang.
  }
  process.exit(0);
});
