#!/usr/bin/env bash
# Goi ca repo thanh MOT file nen, cho truong hop PHAI hieu toan he thong mot lan
# (hoac dua repo sang claude.ai hoi). KHONG dung cho viec thuong — grep + doc file
# dich van re hon.
#
# Do that 13/09 tren `quoc-chien` (84 file src+tests):
#   khong nen  134.317 token
#   --compress  65.774 token  (-51%)
# `--compress` giu comment + chu ky ham, bo than ham (tree-sitter).
#
#   bash scripts/goi_repo.sh                  # src + tests
#   bash scripts/goi_repo.sh 'src/sim/**'     # chi mot manh
#   bash scripts/goi_repo.sh 'src/**' ra.xml
#
# Can mang (npx tai repomix). Khong cai vao package.json — chay khi can.
set -euo pipefail

LOC="${1:-src/**,tests/**}"
RA="${2:-/tmp/goi-repo.xml}"

npx --yes repomix@1.18.0 --include "$LOC" --compress --style xml --output "$RA"

echo "Doc bang: sed -n '1,200p' $RA   # dung cat ca file"
