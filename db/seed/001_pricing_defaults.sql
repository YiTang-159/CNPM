-- Values below are STARTER SEED only, never read from source constants at runtime.
IF NOT EXISTS(SELECT 1 FROM dbo.BangGia WHERE LoaiTien='VND')
 INSERT dbo.BangGia(LoaiTien,DonGiaDangMinor,DonGiaDichMinor,GioiHanVideo,GioiHanBanDich,GiamGiaNamPct)
 VALUES('VND',20000,10000,500,3,20);
IF NOT EXISTS(SELECT 1 FROM dbo.BangGia WHERE LoaiTien='USD')
 INSERT dbo.BangGia(LoaiTien,DonGiaDangMinor,DonGiaDichMinor,GioiHanVideo,GioiHanBanDich,GiamGiaNamPct)
 VALUES('USD',80,40,500,3,20);
IF NOT EXISTS(SELECT 1 FROM dbo.BangGia WHERE LoaiTien='CNY')
 INSERT dbo.BangGia(LoaiTien,DonGiaDangMinor,DonGiaDichMinor,GioiHanVideo,GioiHanBanDich,GiamGiaNamPct)
 VALUES('CNY',600,300,500,3,20);
GO
IF NOT EXISTS(SELECT 1 FROM dbo.GoiDichVu WHERE MaGoi=1)
 INSERT dbo.GoiDichVu(MaGoi,TenGoi,SoVideoDang,SoVideoDich,ThuTu) VALUES(1,N'Cơ bản',3,3,1);
IF NOT EXISTS(SELECT 1 FROM dbo.GoiDichVu WHERE MaGoi=2)
 INSERT dbo.GoiDichVu(MaGoi,TenGoi,SoVideoDang,SoVideoDich,ThuTu) VALUES(2,N'Tiêu chuẩn',10,20,2);
IF NOT EXISTS(SELECT 1 FROM dbo.GoiDichVu WHERE MaGoi=3)
 INSERT dbo.GoiDichVu(MaGoi,TenGoi,SoVideoDang,SoVideoDich,ThuTu) VALUES(3,N'Chuyên nghiệp',30,90,3);
IF NOT EXISTS(SELECT 1 FROM dbo.GoiDichVu WHERE MaGoi=4)
 INSERT dbo.GoiDichVu(MaGoi,TenGoi,SoVideoDang,SoVideoDich,ThuTu) VALUES(4,N'Doanh nghiệp',100,300,4);
GO
-- Existing CK on translations permitted only 500; allow up to 5000 * 3 under dynamically configured limits.
