#!/usr/bin/env node
// Hook PreToolUse cho Claude Code: chan Edit/Write vao cac file phai hoi chu du
// an truoc. Ban dung chung cho moi du an cua gc1001vn-svg.
//
// Cai vao mot du an:
//   1. Chep file nay vao <du-an>/scripts/chan_file_khoa.mjs
//   2. Liet ke duong dan khoa trong <du-an>/.claude/file_khoa.txt, moi dong mot
//      duong dan tuong doi goc repo. Dong ket thuc bang "/" = khoa ca thu muc.
//      Dong bat dau bang "#" la ghi chu. Khong co file nay thi dung MAC_DINH.
//   3. Them vao <du-an>/.claude/settings.json:
//      "PreToolUse": [{ "matcher": "Edit|Write|NotebookEdit", "hooks": [
//        { "type": "command",
//          "command": "node $CLAUDE_PROJECT_DIR/scripts/chan_file_khoa.mjs",
//          "timeout": 10 } ] }]
//
// Fail-open: doc loi hoac du lieu hong thi cho qua, khong lam treo phien.
// Y tuong co che hook lay tu MoonshotAI/kimi-code (MIT), code viet lai tu dau.

import { readFileSync } from 'node:fs';
import { join, relative, isAbsolute } from 'node:path';

/** Danh sach khoa mac dinh khi du an khong co .claude/file_khoa.txt. */
const MAC_DINH = ['CLAUDE.md', '.claude/settings.json', '.github/workflows/'];

/** Doc danh sach khoa cua du an, khong co thi tra ve MAC_DINH. */
function docDanhSach(root) {
  try {
    const dong = readFileSync(join(root, '.claude/file_khoa.txt'), 'utf8')
      .split('\n')
      .map((d) => d.trim())
      .filter((d) => d && !d.startsWith('#'));
    return { muc: dong, nguon: '.claude/file_khoa.txt' };
  } catch {
    return { muc: MAC_DINH, nguon: 'danh sach mac dinh' };
  }
}

let raw = '';
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  let filePath = '';
  try {
    filePath = JSON.parse(raw)?.tool_input?.file_path ?? '';
  } catch {
    process.exit(0);
  }
  if (!filePath) process.exit(0);

  const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const rel = isAbsolute(filePath) ? relative(root, filePath) : filePath;
  const norm = rel.split('\\').join('/');

  const { muc, nguon } = docDanhSach(root);
  const khoa = muc.find((d) =>
    d.endsWith('/') ? norm.startsWith(d) : norm === d,
  );
  if (khoa) {
    console.error(
      `File "${norm}" trung muc khoa "${khoa}" (${nguon}). ` +
      `Phai hoi chu du an va duoc dong y truoc khi sua.`,
    );
    process.exit(2);
  }
  process.exit(0);
});
