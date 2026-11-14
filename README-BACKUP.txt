DUBCHEF - SAO LUU / THU KHOI PHUC KHONG GHI DE DATABASE THAT

1) Giai nen, chep thu muc scripts/, server/scripts/, docs/ vao CNPM goc;
   bo sung .gitignore. KHONG xoa db, .env hoac Docker volumes.
2) Mo VS Code terminal tai CNPM (co docker-compose.yml), chay:

   docker compose build api
   docker compose up -d db
   node scripts/backup-dubchef.mjs backup

3) Chi khi terminal hien BACKUP_AND_RESTORE_VERIFICATION_PASSED,
   ban backup moi duoc xem la da duoc thu khoi phuc.
4) Backup: backups/dubchef_.../{database.bak,uploads.tar.gz,manifest.json,verification.json}
5) Lenh kiem tra lai (khong ghi de DB):

   node scripts/backup-dubchef.mjs verify backups/dubchef_TEN_THU_MUC

6) Khoi phuc THAT la thao tac ghi de toan bo DubchefDB + tệp video.
   Chi su dung khi can cuu du lieu, doc tai lieu docs/SAO_LUU_KHOI_PHUC_KIEM_CHUNG.md.

KHONG chay docker compose down -v.
KHONG chia se backup that (co du lieu khach hang) len GitHub.

LOI NO SUCH IMAGE sha256 KHI BACKUP UPLOADS:
  Chep scripts/backup-dubchef.mjs ban FIX, test:
  node --test scripts/backup-dubchef.test.mjs
  node scripts/backup-dubchef.mjs backup
  Khong dung thu muc backup co BACKUP_FAILED.txt de khoi phuc.
