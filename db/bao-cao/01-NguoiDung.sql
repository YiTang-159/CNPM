/*
 DUBCHEF - BO BAO CAO QUAN TRI V3 / SQL SERVER 2022 / DubchefDB
 CHI DOC: KHONG INSERT, UPDATE, DELETE, MERGE, CREATE, ALTER, DROP.
 Khong can doi .env, docker-compose.yml, API hoac ket noi SSMS.
 Thoi gian du lieu luu UTC; hien thi Viet Nam bang DATEADD(HOUR,7,...).
 Giao dich 'success' la thanh toan duoc DB ghi nhan; neu website dang mo phong thanh toan,
 KHONG hieu rang tien da duoc doi soat voi ngan hang.
*/
USE [DubchefDB];
GO
SET NOCOUNT ON;

-- 01 / TAI KHOAN - DU LIEU CHUAN HOA, 1 NGUOI / 1 DONG.
IF OBJECT_ID(N'dbo.NguoiDung',N'U') IS NULL BEGIN SELECT N'Thieu bang NguoiDung' AS ThongBao; RETURN; END;
IF OBJECT_ID(N'dbo.Video',N'U') IS NULL OR OBJECT_ID(N'dbo.LichSuDangNhap',N'U') IS NULL BEGIN SELECT N'Thieu Video hoac LichSuDangNhap' AS ThongBao; RETURN; END;

-- Lien ket DON HANG theo MaNguoiDung neu co; khong suy dien so huu tu email.
IF COL_LENGTH('dbo.DonHang','MaNguoiDung') IS NOT NULL
 EXEC sys.sp_executesql N'
;WITH e AS (SELECT LOWER(LTRIM(RTRIM(EmailKhachHang))) EmailChuanHoa,COUNT_BIG(*) SoDonTrungEmail FROM dbo.DonHang GROUP BY LOWER(LTRIM(RTRIM(EmailKhachHang)))),
o AS (SELECT MaNguoiDung,COUNT_BIG(*) SoDon, SUM(CASE WHEN TrangThai=''pending'' THEN 1 ELSE 0 END) DonCho
           FROM dbo.DonHang WHERE MaNguoiDung IS NOT NULL GROUP BY MaNguoiDung),
p AS (SELECT d.MaNguoiDung,g.LoaiTien,SUM(CONVERT(BIGINT,g.SoTien)) SoTien
      FROM dbo.DonHang d JOIN dbo.GiaoDich g ON g.MaDonHang=d.MaDonHang
      WHERE d.MaNguoiDung IS NOT NULL AND g.TrangThai=''success'' GROUP BY d.MaNguoiDung,g.LoaiTien),
r AS (SELECT MaNguoiDung,
       SUM(CASE WHEN LoaiTien=''VND'' THEN SoTien ELSE 0 END) ThuVND,
       SUM(CASE WHEN LoaiTien=''USD'' THEN SoTien ELSE 0 END) ThuUSD,
       SUM(CASE WHEN LoaiTien=''CNY'' THEN SoTien ELSE 0 END) ThuCNY FROM p GROUP BY MaNguoiDung),
v AS (SELECT MaNguoiDung,COUNT_BIG(*) SoVideo FROM dbo.Video GROUP BY MaNguoiDung),
l AS (SELECT MaNguoiDung,COUNT_BIG(*) LuotDangNhap,MAX(ThoiGian) DangNhapCuoi FROM dbo.LichSuDangNhap GROUP BY MaNguoiDung)
SELECT u.MaNguoiDung,u.HoTen,u.Email,u.VaiTro,u.TrangThai,
 COALESCE(o.SoDon,0) SoDonLienKet,COALESCE(e.SoDonTrungEmail,0) SoDonTrungEmail_ChuaXacMinh,COALESCE(o.DonCho,0) DonCho,COALESCE(v.SoVideo,0) SoVideo,
 COALESCE(r.ThuVND,0) ThanhToanSuccessVND,COALESCE(r.ThuUSD,0) ThanhToanSuccessUSD,COALESCE(r.ThuCNY,0) ThanhToanSuccessCNY,
 COALESCE(l.LuotDangNhap,0) LuotDangNhap,DATEADD(HOUR,7,l.DangNhapCuoi) DangNhapCuoiVN,
 DATEADD(HOUR,7,u.NgayTao) NgayTaoVN
FROM dbo.NguoiDung u LEFT JOIN o ON o.MaNguoiDung=u.MaNguoiDung
LEFT JOIN e ON e.EmailChuanHoa=LOWER(LTRIM(RTRIM(u.Email)))
LEFT JOIN r ON r.MaNguoiDung=u.MaNguoiDung LEFT JOIN v ON v.MaNguoiDung=u.MaNguoiDung
LEFT JOIN l ON l.MaNguoiDung=u.MaNguoiDung ORDER BY u.MaNguoiDung DESC';
ELSE
 EXEC sys.sp_executesql N'
;WITH e AS (SELECT LOWER(LTRIM(RTRIM(EmailKhachHang))) EmailChuanHoa,COUNT_BIG(*) SoDonTrungEmail FROM dbo.DonHang GROUP BY LOWER(LTRIM(RTRIM(EmailKhachHang)))),
v AS (SELECT MaNguoiDung,COUNT_BIG(*) SoVideo FROM dbo.Video GROUP BY MaNguoiDung),
l AS (SELECT MaNguoiDung,COUNT_BIG(*) LuotDangNhap,MAX(ThoiGian) DangNhapCuoi FROM dbo.LichSuDangNhap GROUP BY MaNguoiDung)
SELECT u.MaNguoiDung,u.HoTen,u.Email,u.VaiTro,u.TrangThai,
 CAST(NULL AS BIGINT) SoDonLienKet,COALESCE(e.SoDonTrungEmail,0) SoDonTrungEmail_ChuaXacMinh,COALESCE(v.SoVideo,0) SoVideo,COALESCE(l.LuotDangNhap,0) LuotDangNhap,
 DATEADD(HOUR,7,l.DangNhapCuoi) DangNhapCuoiVN,DATEADD(HOUR,7,u.NgayTao) NgayTaoVN,
 N''Chua co cot DonHang.MaNguoiDung'' LuuY
FROM dbo.NguoiDung u LEFT JOIN e ON e.EmailChuanHoa=LOWER(LTRIM(RTRIM(u.Email)))
LEFT JOIN v ON v.MaNguoiDung=u.MaNguoiDung
LEFT JOIN l ON l.MaNguoiDung=u.MaNguoiDung ORDER BY u.MaNguoiDung DESC';

-- Tong dang ky 30 ngay (theo ngay Viet Nam).
SELECT CAST(DATEADD(HOUR,7,NgayTao) AS DATE) NgayVN, COUNT_BIG(*) TaiKhoanMoi
FROM dbo.NguoiDung WHERE VaiTro='user' AND NgayTao>=DATEADD(DAY,-30,SYSUTCDATETIME())
GROUP BY CAST(DATEADD(HOUR,7,NgayTao) AS DATE) ORDER BY NgayVN DESC;
