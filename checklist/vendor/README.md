# Thư viện ngoài

## idb-keyval 6.3.0

- Tác giả: Jake Archibald
- Nguồn: https://github.com/jakearchibald/idb-keyval
- Giấy phép: Apache-2.0 (nguyên văn ở `idb-keyval-LICENSE.txt`)
- File: `idb-keyval-umd.js` — bản UMD lấy nguyên xi từ gói npm, không sửa một chữ

### Dùng để làm gì

Trước đây app lưu mọi thứ trong `localStorage`. Chỗ đó chỉ được khoảng 5 MB cho
cả tên miền, mà mỗi tấm ảnh trong sổ chuyến đi nặng chừng 150 KB — đo thực tế
trên Chromium thì **sổ đầy ở mục thứ 34** rồi lặng lẽ mất dữ liệu, vì lệnh ghi
ném `QuotaExceededError` và bị nuốt trong một `catch` rỗng.

`idb-keyval` là lớp bọc mỏng quanh IndexedDB, cho phép đọc ghi theo cặp
khóa–giá trị y như `localStorage` nhưng không có trần 5 MB.

### Vì sao có hai bản

`index.html` **nhúng thẳng** nội dung file này vào trong thẻ `<script>` để app
vẫn là một file duy nhất, mở được khi không có mạng và chép sang máy khác chỉ
bằng cách gửi một file. Bản trong thư mục này giữ để đối chiếu: biết chính xác
đang chạy phiên bản nào, lấy ở đâu, và giấy phép ra sao.

Khi nâng phiên bản: chạy `npm pack idb-keyval`, chép `dist/umd.js` vào đây, rồi
thay đoạn đã nhúng trong `index.html` cho khớp.

### Vì sao chọn bản UMD

Bản `dist/index.js` viết bằng cú pháp mới (hàm mũi tên, `const`). Bản
`dist/umd.js` đã dịch về ES5 nên khớp với quy ước của app — toàn bộ mã trong
`index.html` là ES5 thuần để chạy được cả trên điện thoại đời cũ.
