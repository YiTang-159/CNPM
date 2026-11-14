# DubchefDB — sơ đồ quan hệ theo thiết kế migration (chưa nghiệm thu trên SQL Server thực)

Sơ đồ sau được rút từ các file `db/migrations/001...021` và mã nghiệp vụ; xem `db/tests/schema-catalog.sql` để xuất các **FK thật** từ SQL Server trước khi chấm.

```mermaid
erDiagram
    NguoiDung ||--o{ DonHang : owns
    DonHang ||--o{ GiaoDich : payments
    DonHang ||--o{ QuyenLoiGoi : grants
    DonHang ||--o{ WebhookNhan : webhook
    NguoiDung ||--o{ Video : uploads
    NguoiDung ||--o{ QuyenLoiGoi : granted_to
    QuyenLoiGoi ||--o{ SuDungQuyenLoi : usage_ledger
    Video |o--o{ SuDungQuyenLoi : consumed_for
    Video ||--o{ ThuyetMinh : narration
    Video ||--o{ PhuDe : subtitles
    Video |o--o{ LichSuNoiDung : revisions
    NgonNgu ||--o{ Video : source_language
    NgonNgu ||--o{ ThuyetMinh : narration_language
    NgonNgu ||--o{ PhuDe : subtitle_language
    NgonNgu |o--o{ SuDungQuyenLoi : translation_language
    NguoiDung ||--o{ PhanHoi : feedback
    Video |o--o{ PhanHoi : concerning
    PhanHoi |o--o{ LichSuXuLyPhanHoi : feedback_history
    LienHe |o--o{ LichSuXuLyPhanHoi : contact_history
    NguoiDung ||--o{ MaDatLaiMatKhau : reset_requests
    NguoiDung ||--o{ CongViecXuLy : processing_jobs
    Video |o--o{ CongViecXuLy : workload
    CongViecXuLy |o--o{ TepXuat : produced_files
    Video |o--o{ TepXuat : media
    NguoiDung |o--o{ NhatKyQuanTri : operator
    NguoiDung |o--o{ XacMinhChuDonHang : verifies
    BangGia ||--o{ LichSuBangGia : revisions
    NguoiDung |o--o{ LichSuDoiGia : price_changes
    NguoiDung {
       int MaNguoiDung PK
       nvarchar Email UK
       varchar MatKhauBam
       datetime2 NgayXoa
    }
    DonHang {
       int MaDonHang PK
       int MaNguoiDung FK
       bit DonCu
       bigint SoTien
       char LoaiTien
       bigint DonGiaDangSnapshot
       bigint DonGiaDichSnapshot
       bigint PhienBanGiaSnapshot
    }
    GiaoDich {
       int MaGiaoDich PK
       int MaDonHang FK
       bigint SoTien
       char LoaiTien
       varchar TrangThai
       varchar NguonXacNhan
    }
    WebhookNhan {
       bigint MaWebhook PK
       varchar EventId UK
       char PayloadSha256
       bit ChuKyHopLe
    }
    SuDungQuyenLoi {
       bigint MaSuDung PK
       int MaQuyenLoi FK
       int MaVideo FK
       varchar Loai
       varchar NgonNgu FK
    }
    QuyenLoiGoi {
       int MaQuyenLoi PK
       int MaNguoiDung FK
       int MaDonHang FK
       int DaDungVideoDang
       int DaDungVideoDich
       datetime2 NgayHetHan
    }
    BangGia {
       char LoaiTien PK
       bigint DonGiaDangMinor
       bigint DonGiaDichMinor
       bigint PhienBan
    }
    BangGiaDonVi {
       bigint MaGia PK
       char LoaiTien
       datetime2 HieuLucTu
    }
    GoiDichVu {
       int MaGoi PK
       nvarchar TenGoi
    }
    SchemaMigrations {
       int Version PK
       char ChecksumSha256
       datetime2 AppliedAt
    }
```

**Ghi chú:** Hình Mermaid không thể biểu diễn đầy đủ FK phức hợp `QuyenLoiGoi(MaDonHang,MaNguoiDung)` và `GiaoDich(MaDonHang,LoaiTien,SoTien)`, hay trigger số lượt. Đọc các constraint trong migration 015–016 và kết quả `sys.foreign_key_columns`. Các bảng cấu hình/điều khiển độc lập (`CauHinhHeThong`, `TyGia`, `LanDangNhapSai`, `LuotTruyCap`, `LuotQuetQR`) không cần đường nối vật lý theo thiết kế. `LichSuXuLyPhanHoi` có hai FK tùy chọn và CHECK đúng một.
