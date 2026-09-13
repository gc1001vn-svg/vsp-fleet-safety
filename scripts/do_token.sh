#!/usr/bin/env bash
# Do chi phi token cua mot repo: CLAUDE.md, cac SKILL.md, file phu.
# Uoc luong ~3 byte/token — du chinh xac de so sanh truoc/sau.
set -uo pipefail

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$ROOT" || exit 1
tok() { echo $(( $(wc -c < "$1") / 3 )); }

echo "Repo: $ROOT"
echo

echo "== NAP MOI PHIEN (dat nhat) =="
tong=0
for f in CLAUDE.md .claude/CLAUDE.md CLAUDE.local.md; do
  [ -f "$f" ] || continue
  t=$(tok "$f"); tong=$((tong + t))
  printf "  %-24s %5d dong  ~%5d token" "$f" "$(wc -l < "$f")" "$t"
  [ "$t" -gt 500 ] && printf "   <-- tren muc khuyen nghi 500" 
  echo
done
[ "$tong" -eq 0 ] && echo "  (chua co CLAUDE.md)"
echo

echo "== SKILL: mo ta nap moi phien, than nap khi dung roi nam lai =="
found=0
while IFS= read -r s; do
  found=1
  d=$(dirname "$s"); ten=$(basename "$d")
  mo=$(sed -n '/^description:/,/^[a-z-]*:/p' "$s" | head -1 | cut -c13-)
  printf "  %-22s than: %4d dong ~%5d token | mo ta ~%3d token" \
    "$ten" "$(wc -l < "$s")" "$(tok "$s")" "$(( ${#mo} / 3 ))"
  [ "$(wc -l < "$s")" -gt 150 ] && printf "   <-- nen tach"
  echo
  n=0
  while IFS= read -r p; do
    printf "      + %-28s ~%5d token (chi nap khi doc toi)\n" "$(basename "$p")" "$(tok "$p")"
    n=$((n+1))
    # script (.sh/.awk/.py) duoc CHAY chu khong nap vao ngu canh -> khong tinh
  done < <(find "$d" -maxdepth 1 -type f ! -name SKILL.md \
             ! -name '*.sh' ! -name '*.awk' ! -name '*.py' ! -name '*.js' 2>/dev/null)
  [ "$n" -eq 0 ] && [ "$(wc -l < "$s")" -gt 150 ] && echo "      (khong co file phu — toan bo nam trong SKILL.md)"
done < <(find .claude/skills -name SKILL.md 2>/dev/null | sort)
[ "$found" -eq 0 ] && echo "  (repo nay khong co skill rieng)"
echo

echo "== FRONTMATTER: 6 key claude.ai chap nhan =="
while IFS= read -r s; do
  ten=$(basename "$(dirname "$s")")
  ngoai=$(awk '/^---$/{n++; next} n==1 && /^[A-Za-z][A-Za-z0-9_-]*:/{
      k=$0; sub(/:.*/,"",k)
      if (k!="name" && k!="description" && k!="license" && k!="compatibility" \
          && k!="metadata" && k!="allowed-tools") printf "%s ", k
    } n>=2{exit}' "$s")
  if [ -n "$ngoai" ]; then
    echo "  $ten: key ngoai spec -> $ngoai (tai len claude.ai se LOI CUNG)"
  else
    echo "  $ten: dat chuan"
  fi
done < <(find .claude/skills -name SKILL.md 2>/dev/null | sort)
