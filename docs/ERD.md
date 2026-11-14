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
