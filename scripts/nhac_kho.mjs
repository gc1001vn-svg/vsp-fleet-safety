#!/usr/bin/env node
// Hook UserPromptSubmit: tra kho ghi-nho theo tu khoa trong cau chu du an vua
// go, chen 1-2 khoi lien quan vao ngu canh luot do.
//
// VI SAO: dau phien `cat` ca ba file mot lan, roi phien dai dan — thu can nho
// nhat da troi ra sau hang tram luot. Cach cu la doi model TU nho di tra, ma
// tra la mot luot goi: do 13/09 moi luot gui lai ca ngu canh, 400.323 token.
// Hook tra san thi ton 0 luot.
//
// Y tuong lay tu supermemoryai/claude-supermemory (MIT) — hook `recall-directive.js`.
// Code viet lai tu dau, KHONG goi mang, khong API key, khong embedding:
// `grep` tren bon file markdown la du.
//
// Cai vao mot du an: `node /home/user/ghi-nho/cong-cu/cai_dat.mjs`
//
// Fail-open tuyet doi: moi duong loi deu tra `continue: true` roi thoat 0.
// Hook nay khong bao gio duoc chan mot luot lam viec that.

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { bat, thoat as thoat_an, cat_tran } from './hook_chung.mjs';

const ID = 'cau:nhac-kho';
const KHO = '/home/user/ghi-nho';
const NGUON = ['so-thich.md', 'du-an.md', 'trang-thai.md', 'cong-cu/luat-chi-tiet.md'];

// Tran — co sang la phan tac dung, chinh cai dang di chong.
const DAI_TOI_THIEU = 12;   // cau ngan hon: bo qua
const SO_KHOI = 2;          // chen toi da 2 khoi
const DAI_KHOI = 320;       // moi khoi cat con bay nhieu ky tu
const DIEM_TOI_THIEU = 2;   // duoi nguong nay coi nhu khong lien quan
const VUNG_DAU = 5;         // chi xet 5 khoi diem cao nhat, het thi im
const BAO_PHU = 0.4;        // khoi phai trung >= 40% so tu dang tra
const NHO_TOI_DA = 200;     // so ma bam giu lai moi phien

// Tu qua thuong, trung cung khong noi len gi.
//
// Bo dau xong thi nhieu tu hoi/tu noi DE TRUNG voi tu that: "đâu" -> "dau" dinh
// vao "đầu phiên", "lấy" -> "lay". Do 14/09: cau "asset cho game lay o dau" xep
// khoi "Dau phien bay buoc" len dau, dung cho can tim tut xuong. Nen danh sach
// nay phai co ca tu 3 chu, khong chi tu qua ngan.
const TU_RAC = new Set(`
duoc khong phai cua cho voi thi la va nhung nay kia day do minh ban toi anh
lam gi sao nao the nhu con chua roi nua hay hoac neu khi dang cung tren duoi
trong ngoai mot hai can nen phai xem thu coi biet noi bao ra vao len xuong
dau lay dua tim dat duong cach viec them nao gio truoc sau viet doc hoi muon
cam nhe nhi vang uhm oke okay hom troi dep qua
chay file repo code
`.trim().split(/\s+/));

/** Bo dau tieng Viet de so khop: "nhật ký" -> "nhat ky". */
function bo_dau(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function chuan(s) {
  return bo_dau(String(s)).toLowerCase();
}

/**
 * Tach mot doan thanh tap TU RIENG BIET.
 *
 * Phai so theo tu, khong duoc `includes()`: do 14/09, "đẹp" -> "dep" nam trong
 * "deploy", "quá" -> "qua" nam trong "quốc" — mot cau tan gau cham diem nhu cau
 * hoi that. So theo tu thi cau tan gau im lang.
 */
function tach(s) {
  return new Set(chuan(s).split(/[^a-z0-9_./-]+/).filter(Boolean));
}

/** Tach cau chu du an go thanh tu khoa dang tra. */
function tu_khoa(prompt) {
  const t = [...tach(prompt)];
  // >= 3 chu khong phai 4: tieng Viet bo dau con nhieu tu 3 chu mang het nghia
  // ("web", "git", "PWA", "fps", "MIT"). Loc rac bang TU_RAC, dung bang do dai.
  return [...new Set(t.filter((w) => w.length >= 3 && !TU_RAC.has(w)))];
}

/** Cat mot file markdown thanh cac khoi theo tieu de `##` / `###`. */
function cat_khoi(ten, noi_dung) {
  const dong = noi_dung.split('\n');
  const khoi = [];
  let hien = { ten, tieu_de: '(dau file)', dong: [] };
  for (const d of dong) {
    if (/^#{2,3}\s+/.test(d)) {
      if (hien.dong.length) khoi.push(hien);
      hien = { ten, tieu_de: d.replace(/^#+\s*/, '').trim(), dong: [] };
    } else {
      hien.dong.push(d);
    }
  }
  if (hien.dong.length) khoi.push(hien);
  return khoi;
}

function doc_kho() {
  const khoi = [];
  for (const ten of NGUON) {
    const p = join(KHO, ten);
    if (!existsSync(p)) continue;
    try { khoi.push(...cat_khoi(ten, readFileSync(p, 'utf8'))); } catch { /* bo qua file hong */ }
  }
  // Tach tu MOT lan cho moi khoi, dung lai cho ca cham diem lan dem do hiem.
  return khoi.map((k) => ({ ...k, tu_than: tach(k.dong.join('\n')), tu_dau: tach(k.tieu_de) }));
}

/**
 * Tu HIEM dang gia gap doi tu thuong.
 *
 * "asset" chi nam o mot khoi — go no ra la biet dang hoi cai gi. "phien" nam o
 * gan het cac khoi — trung no khong noi len gi. Khong can TF-IDF that: dem so
 * khoi chua tu do la du tach hai loai nay.
 */
function do_hiem(khoi, tu) {
  const hiem = new Set();
  // 25%: do 14/09 tren kho 30 khoi — "tayvuc" nam o 6 khoi (20%) van la tu dang
  // tra, de nguong 12% thi no bi xep vao "tu thuong" va cau hoi ve no im lang.
  const nguong = Math.max(2, Math.ceil(khoi.length * 0.25));
  for (const w of tu) {
    let dem = 0;
    for (const k of khoi) if (k.tu_than.has(w) || k.tu_dau.has(w)) dem++;
    if (dem > 0 && dem <= nguong) hiem.add(w);
  }
  return hiem;
}

/**
 * Diem = so tu khoa RIENG BIET xuat hien trong khoi. Dem so lan xuat hien thi
 * mot khoi dai tu dong thang — dem tu rieng biet moi do dung "khoi nay noi ve
 * dung thu dang hoi".
 */
function cham_diem(khoi, tu, hiem) {
  let diem = 0;
  const trung = [];
  for (const w of tu) {
    const o_dau = khoi.tu_dau.has(w);
    if (!o_dau && !khoi.tu_than.has(w)) continue;
    diem += (o_dau ? 2 : 1) * (hiem.has(w) ? 2 : 1);          // trung tieu de an hon
    trung.push(w);
  }
  return { diem, trung };
}

/** Lay may dong CO tu khoa, khong lay ca khoi. */
function trich(khoi, trung) {
  const chi_so = khoi.dong
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => d.trim() && trung.some((w) => tach(d).has(w)))
    .map(({ i }) => i);
  // Markdown xuong dong giua cau: hai dong trung co the la mot doan bi ngat, va
  // dong o giua — khong co tu khoa — moi la dong lat nghia ("Chan (`000`): ...").
  // Cach nhau <= 2 dong thi lay ca phan o giua, dung de ho.
  const day = [];
  for (const i of chi_so) {
    const cuoi = day[day.length - 1];
    if (cuoi !== undefined && i - cuoi <= 3) for (let k = cuoi + 1; k < i; k++) day.push(k);
    day.push(i);
  }
  const lay = (day.length
    ? day
    : khoi.dong.map((d, i) => ({ d, i })).filter(({ d }) => d.trim()).map(({ i }) => i)
  ).filter((i) => khoi.dong[i].trim()).slice(0, 5);

  // Hai dong KHONG lien nhau ma noi bang dau cach la dat cau vao mieng file.
  // Do that 14/09: dong "mo duoc kenney.nl" dinh lien dong "chan sketchfab.com"
  // thanh mot cau doc ra nghia NGUOC. Khong lien nhau thi phai co dau `…`.
  let s = '';
  for (let k = 0; k < lay.length; k++) {
    if (k > 0) s += lay[k] === lay[k - 1] + 1 ? ' ' : ' … ';
    s += khoi.dong[lay[k]].trim();
  }
  s = s.replace(/[ \t]+/g, ' ').trim();
  if (s.length > DAI_KHOI) s = `${s.slice(0, DAI_KHOI)}…`;
  return s;
}

function bam(s) {
  return createHash('sha256').update(s.replace(/\s+/g, ' ').trim()).digest('hex').slice(0, 16);
}

/**
 * Khoi da chen mot lan thi con nam trong ngu canh — chen lai la tra tien hai
 * lan cho cung mot chu. Giu so bam theo phien, ngoai repo (may ao xoa moi phien
 * la dung y do).
 */
function duong_so(session_id) {
  if (!session_id) return null;
  const d = join(tmpdir(), 'nhac-kho', String(session_id).replace(/[^\w-]/g, ''));
  try { mkdirSync(d, { recursive: true }); return join(d, 'da_chen.json'); } catch { return null; }
}

function doc_so(p) {
  try { const a = JSON.parse(readFileSync(p, 'utf8')); return Array.isArray(a) ? a : []; } catch { return []; }
}

/**
 * Ghi JSON ra stdout roi thoat — CHO CHU RA HET moi thoat.
 *
 * `process.stdout.write(s); process.exit(0)` cat mat phan tren 146.176 byte
 * (do 18/09, xem `hook_chung.mjs`). Hook nay moi ~973 byte nen chua dinh, nhung
 * no la hook duy nhat o day dung stdout lam duong CHINH — JSON cut giua chung
 * thi harness coi ca hook la hong va nuot luon luot go.
 */
function thoat(o) {
  let s = '';
  try { s = JSON.stringify(o); } catch { /* im lang */ }
  thoat_an(0, { ra: s });
}

const IM = { continue: true, suppressOutput: true };

/**
 * Ghi so MOI luot, ke ca luot hook chon im.
 *
 * VI SAO: do 14/09, ba phien lien khong ket luan duoc "hook khong chay" hay "hook
 * chay ma khong chen" — vi hook chi de lai dau vet khi no CHEN. `systemMessage`
 * thi app iPhone khong hien. Ghi ca luot im thi so nay tra loi dut khoat:
 * co dong = hook chay, khong co dong nao = hook khong chay.
 */
function ghi_so(ly_do) {
  try {
    const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
    const thu_muc = join(root, '.claude');
    mkdirSync(thu_muc, { recursive: true });
    const so = join(thu_muc, 'nhac_kho.log');
    const cu = existsSync(so) ? readFileSync(so, 'utf8').split('\n').filter(Boolean) : [];
    const moi = `${new Date().toISOString()}\t${ly_do}`;
    writeFileSync(so, `${[...cu, moi].slice(-200).join('\n')}\n`);
  } catch { /* ghi so hong thi van phai chay tiep */ }
}

/** Im lang, nhung vao so. */
function im(ly_do) {
  ghi_so(`im — ${ly_do}`);
  return thoat(IM);
}

function chinh(raw) {
  let vao;
  try { vao = JSON.parse(raw); } catch { return im('stdin khong phai JSON'); }

  const prompt = String(vao?.prompt ?? '').trim();
  if (!vao?.session_id) ghi_so('CANH BAO: hook khong nhan duoc session_id');
  if (prompt.length < DAI_TOI_THIEU) return im(`cau ngan (${prompt.length} ky tu)`);
  if (['/', '!', '#'].includes(prompt[0])) return im('cau bat dau bang / ! #');

  const tu = tu_khoa(prompt);
  if (tu.length === 0) return im('khong con tu khoa nao sau khi loc');

  // Chi lay tu VUNG DAU bang xep. Khoi thu 6 tro xuong la "co dinh tu khoa" chu
  // khong phai "noi ve thu dang hoi" — chen no vao la nhieu, khong phai nhac.
  // Nen khi ca vung dau da chen roi thi IM, khong voi xuong lay hang kem hon.
  const kho = doc_kho();
  if (kho.length === 0) return im(`kho chua clone ve ${KHO}`);
  const hiem = do_hiem(kho, tu);

  const xep = kho
    .map((k) => ({ k, ...cham_diem(k, tu, hiem) }))
    // Khong chi xet DIEM ma xet BAO PHU: trung bao nhieu phan cau da go.
    // "tayvuc con lam khong" chi con mot tu dang tra, trung no la 100% — dung la
    // dang hoi ve tayvuc. "hom nay troi dep qua nhi" co bon tu, trung dung mot
    // tu vu vo cung ra diem nhu vay. Diem khong tach duoc hai cai do, bao phu thi co.
    .filter((x) => x.diem >= DIEM_TOI_THIEU && x.trung.length >= Math.ceil(tu.length * BAO_PHU))
    .sort((a, b) => b.diem - a.diem)
    .slice(0, VUNG_DAU);
  if (xep.length === 0) return im(`khong khoi nao du diem (${tu.length} tu khoa)`);

  const p_so = duong_so(vao?.session_id);
  const da = new Set(p_so ? doc_so(p_so) : []);

  const chon = [];
  const bam_moi = [];
  for (const x of xep) {
    if (chon.length >= SO_KHOI) break;
    const noi = trich(x.k, x.trung);
    const h = bam(noi);
    if (da.has(h)) continue;
    chon.push({ ...x, noi });
    bam_moi.push(h);
  }
  if (chon.length === 0) return im('vung dau da chen het trong phien nay');

  if (p_so) {
    try { writeFileSync(p_so, JSON.stringify([...da, ...bam_moi].slice(-NHO_TOI_DA))); }
    catch { /* chong trung la phu, thieu no van chen duoc */ }
  }

  const dong = chon.map((x) => `- [${x.k.ten} › ${x.k.tieu_de}] ${x.noi}`);
  const tho = [
    '<nhac-kho>',
    'Tra tu kho ghi-nho theo cau vua go (hook, khong ton luot goi):',
    ...dong,
    '',
    `Chi la trich doan. Can day du: \`cat ${KHO}/${chon[0].k.ten}\`.`,
    'Trich doan mau thuan voi thu dang lam thi HOI, dung tu chon ben nao.',
    '</nhac-kho>',
  ].join('\n');

  // Tran cua rieng hook nay (SO_KHOI x DAI_KHOI) la tran MEM: doi mot hang so
  // la no phinh. `cat_tran` la tran CHUNG cho moi hook chen ngu canh — lop cuoi,
  // khong ai sua nham qua duoc. ~4 ky tu/token, so sinh tu lenh chu khong go tay.
  const { van: ngu_canh, tok, cat } = cat_tran(tho);

  ghi_so(`CHEN ${chon.length} khoi\t~${tok} tok${cat ? ' (DA CAT)' : ''}\t${chon.map((x) => x.k.tieu_de).join(' | ')}`);

  thoat({
    systemMessage: `[nhac kho] ${chon.length} khoi (~${tok} tok)`,
    hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: ngu_canh },
  });
}

// Khong co duong nao duoc phep lam treo mot luot lam viec that.
process.on('uncaughtException', () => thoat(IM));
process.on('unhandledRejection', () => thoat(IM));

// Muc `nhe` bo hook nay: no chen chu vao ngu canh MOI LUOT go, dat nhat trong
// nam hook. Tat thi mat lop nhac, khong mat lop bao ve nao.
if (!bat(ID, ['thuong', 'chat'])) { ghi_so('im — muc hien tai khong goi hook nay'); thoat(IM); }

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('error', () => thoat(IM));
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => chinh(raw));
