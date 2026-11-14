# ERD sơ bộ — các bảng đã đối chiếu code (không phải toàn bộ schema)

```mermaid
erDiagram
  NguoiDung ||--o{ DonHang : creates
  DonHang ||--o{ GiaoDich : payments
  NguoiDung {
    int MaNguoiDung PK
    nvarchar Email
    nvarchar HoTen
    varchar MatKhauBam
  }
  DonHang {
    int MaDonHang PK
    int MaNguoiDung FK
    bigint SoTien
    char LoaiTien
    bigint DonGiaDangSnapshot
    bigint DonGiaDichSnapshot
    bigint PhienBanGiaSnapshot
  }
  BangGia ||--o{ LichSuBangGia : audits
  BangGia {
    char LoaiTien PK
    bigint DonGiaDangMinor
    bigint DonGiaDichMinor
    int GioiHanVideo
    int GioiHanBanDich
    bigint PhienBan
  }
  LichSuBangGia {
    bigint MaLichSu PK
    char LoaiTien FK
    bigint PhienBanCu
    bigint PhienBanMoi
    nvarchar NguoiSua
  }
  GoiDichVu {
    int MaGoi PK
    nvarchar TenGoi
    int SoVideoDang
    int SoVideoDich
    bool HienThi
  }
  SchemaMigrations {
    int Version PK
    datetime AppliedAt
  }
  GiaoDich {
    int MaGiaoDich PK
    int MaDonHang FK
    bigint SoTien
  }
  LienHe {
    int MaLienHe PK
  }
  LuotQuetQR {
    bigint MaLuotQuet PK
  }
```

Sơ đồ tập trung vào thanh toán và tương tác công khai, chưa rà hết các bảng trong `db/*.sql` hoặc khẳng định đầy đủ ràng buộc FK/PK.

Các bảng `BangGia`, `LichSuBangGia`, `GoiDichVu` là **thiết kế trong migration mới**, chưa xác minh đã thực thi trên CSDL của người dùng. Quan hệ giá → đơn dùng **ảnh chụp giá** theo phiên bản và mã tiền tệ, không khai báo FK cố định để bảo toàn đơn hàng lịch sử.
