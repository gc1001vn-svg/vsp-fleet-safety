#!/usr/bin/env node
// Thuoc do chi phi token NAP MOI PHIEN. Chan CLAUDE.md phinh dan.
//
// Vi sao co thuoc nay: chu du an chot 13/09 "giam-token phai LUON chay".
// Skill `giam-token` thi phai tu nho goi — do duoc 1/4 phien. Thuoc trong
// `npm run do` thi chay moi lan, va hook `chan_bao_xong` doi dong "So do:"
// nen khong bao "xong" suong duoc.
//
// Nguong 1600 KHONG phai muc khuyen nghi chung (500). Repo nay giu mot mo luat
// rieng khong doan duoc: thang tra-truoc-khi-viet, ba luat kien truc, ve duyet
// file khoa. Cat xuong 500 la mat luat, dat hon so token tiet kiem duoc.
// 1600 = so do that hom cat (1460) cong cho tho ~10%. Muon noi nguong thi phai
// CAT that truoc, dung sua so nay cho qua thuoc.

import { readFileSync, existsSync } from 'node:fs';

// Nguong lay theo thu tu: bien moi truong -> `.claude/nguong_token.txt` -> 1600.
// `NGUONG_TOKEN=<so>` de THU thuoc nay co that su bat khong; dung dat trong CI
// de lach nguong that. Repo can nguong khac thi ghi `.claude/nguong_token.txt`,
// dong dau la so, cac dong sau la LY DO — bat buoc noi ra vi sao noi nguong.
const FILE = 'CLAUDE.md';
const P_NGUONG = '.claude/nguong_token.txt';
const NGUONG =
  Number(process.env.NGUONG_TOKEN) ||
  (existsSync(P_NGUONG) ? Number(readFileSync(P_NGUONG, 'utf8').split('\n')[0].trim()) : 0) ||
  1600;

if (!existsSync(FILE)) {
  console.log(`${FILE} khong ton tai — bo qua`);
  process.exit(0);
}

// ~3 byte/token, cung cach uoc luong voi cong-cu/do_token.sh
const byte = readFileSync(FILE).length;
const token = Math.floor(byte / 3);
const dong = readFileSync(FILE, 'utf8').split('\n').length;

console.log(`${FILE}: ${dong} dong · ${byte} byte · ~${token} token (nguong ${NGUONG})`);

if (token > NGUONG) {
  console.error(
    `HONG: ~${token} token, vuot nguong ${NGUONG}.\n` +
    `  Cat bot truoc khi commit. Cach cat: bo dong nao ma BO DI Claude van lam dung.\n` +
    `  Thu tu cat: giai thich dai -> vi du -> luat da co o kho ghi nho -> chi tiet\n` +
    `  rieng repo (day sang docs/DAU_PHIEN.md, chi doc khi duoc tro toi).\n` +
    `  Chay \`bash scripts/do_token.sh\` de xem bang chi tiet.`,
  );
  process.exit(1);
}
