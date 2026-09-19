#!/usr/bin/env node
// Hook Stop cho Claude Code: chan Claude bao "xong" khi chua dua so do that.
// Ban dung chung cho moi du an cua gc1001vn-svg.
//
// Quy uoc: cau tra loi nao noi "xong" / "hoan thanh" / "hoan tat" thi phai co
// mot dong bat dau bang "So do:" (co dau: "Số đo:"). Khong can do that thi ghi
// "So do: khong can - <ly do>". Bat buoc noi ra, khong duoc im lang.
//
// 16/09: doi THEM mot dong "De xuat:" (co dau: "Đề xuất:"), hay khoi
// "=== VIEC CUA ANH BAY GIO ===". Vi sao: chu du an bao bao xong ma khong bao
// buoc ke thi anh phai tu nghi ra viec, va phan dat nhat cua tro ly - nhin thay
// viec tiep theo - bi bo. Luat cu chi nam o CLAUDE.md cua mot repo va chi ap
// CUOI PHIEN, nen xong viec giua phien thi khong ai bat.
// Khong co buoc ke that thi ghi "De xuat: khong co - <ly do>".
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
import { bat, thoat } from './hook_chung.mjs';

const ID = 'dung:chan-bao-xong';

/** Tu phu dinh dung ngay truoc "xong" -> khong tinh la bao xong. */
const PHU_DINH = 'chưa|chua|không|khong|sắp|sap|gần|gan|nếu|neu|khi nào|khi nao';
/**
 * Tu dung ngay truoc "xong" cho thay dang NHAC TOI no chu khong bao: "đợi xong",
 * "sau khi xong", "dạng báo xong", "chữ xong".
 *
 * Can tu 18/09 (lan 4), khi bo neo dau dong. Truoc do chinh cai neo do lam viec nay -
 * va lam qua tay: no cat luon dang `<viec> xong`, tuc dang bao xong HAY DUNG NHAT.
 */
const NOI_TOI = 'đợi|doi|chờ|cho|khi|báo|bao|dạng|dang|kiểu|kieu|lúc|luc|chữ|chu';
const BAO_XONG = 'xong|hoàn thành|hoan thanh|hoàn tất|hoan tat';
// Cho phep ky tu trang tri Markdown dung truoc: ` * _ ~ # - > va khoang trang.
const CO_SO_DO = /^[\s>*_`~#-]*(số đo|so do)\s*:/im;
/** Dong de xuat buoc ke, hay khoi viec cuoi phien - mot trong hai la du. */
const CO_DE_XUAT = /^[\s>*_`~#-]*(đề xuất|de xuat)\s*:|việc của anh bây giờ|viec cua anh bay gio/im;

let raw = '';
// Fail-open ca khi CHINH hook hong, khong chi khi du lieu hong. Doan duoi co
// may regex phuc tap; loi khong bat se in ca vet stack vao ngu canh.
process.on('uncaughtException', () => process.exit(0));
process.on('unhandledRejection', () => process.exit(0));
process.stdin.on('error', () => process.exit(0));

// Muc `nhe` bo hook nay: no la hook DUY NHAT chan mot cau tra loi da viet xong.
// Phien nao dang go mot loi gap ma no chan nham thi ha muc, dung go khoi settings.
if (!bat(ID, ['thuong', 'chat'])) process.exit(0);

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
    .replace(new RegExp(`(${PHU_DINH})\\s+(${BAO_XONG})`, 'g'), ' ')
    .replace(new RegExp(`(${NOI_TOI})\\s+(${BAO_XONG})`, 'g'), ' ');
  // Cum tu nam O GIUA dong cung tinh - "Buoc 1 va 2 xong, da gop main" la bao xong that,
  // ma ban truoc bo qua vi doi no dung dau dong hay ngay sau dau cham cau. Do 18/09:
  // dang `<viec> xong` la dang bao xong HAY DUNG NHAT, ma lot sach.
  //
  // Cai giu cho khoi bat nham la `TIEP`: sau cum tu PHAI la dau cau, het dong, hay mot
  // trong may tu chot cau. Nho vay "xong thi gui" va "xong chup bang gui em" van lot
  // luoi - hai cai do la sai bao chu du an lam, khong phai bao xong.
  const TIEP = '(?:[\\s*_`)\\]]*(?:[.!?,:;…]|$)|\\s+(?:rồi|roi|cả|ca|hết|het|luôn|luon|nhé|nhe))';
  const baoXong = t.split('\n').some(
    (dong) => new RegExp(`(?:^|[^\\p{L}])(${BAO_XONG})${TIEP}`, 'u').test(dong),
  );
  if (!baoXong) process.exit(0);

  const dongSoDo = msg.split('\n').find((l) => CO_SO_DO.test(l));
  if (!dongSoDo) {
    thoat(2, {
      loi: 'Cau tra loi noi "xong" nhung khong co dong "So do:". ' +
        'Chua do duoc thi khong duoc bao xong — hay dua so do that, ' +
        'hoac ghi mot dong "So do: khong can - <ly do>".',
    });
    return;
  }

  // Bao xong ma khong noi buoc ke -> chu du an phai tu nghi ra viec.
  if (!CO_DE_XUAT.test(msg)) {
    thoat(2, {
      loi: 'Cau tra loi noi "xong" nhung khong co dong "De xuat:". Xong mot viec thi '
        + 'phai noi buoc ke - viec gi, vi sao, ton bao lau. That su het viec thi ghi '
        + '"De xuat: khong co - <ly do>".',
    });
    return;
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
    thoat(2, {
      loi: 'Cau tra loi dua "So do:" nhung so lenh cua luot nay khong ghi nhan ' +
        'lenh Bash nao da chay. So do phai chep tu ket qua that. ' +
        'Hay chay lenh do that, hoac sua thanh "So do: khong can - <ly do>".',
    });
    return;
  }
  process.exit(0);
});
