/* Safety barrier: the old install script omitted migrations 10..20.
   No data is modified by running this file. */
THROW 51970,N'Outdated installer: use db/migrations/RUN_ALL_IN_SSMS.sql or npm run db:migrate.',1;
GO
