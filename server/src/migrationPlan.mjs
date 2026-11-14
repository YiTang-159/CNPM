// Canonical, ordered migrations for fresh and existing SQL Server databases.
// Historic numbers 003/005 were unsafe password routines; 006/008/009 were reports/seeds.
// They are deliberately NOT schema migrations. Never insert fake PASS ledger rows.
export const MIGRATIONS = Object.freeze([
  '001_preflight.sql',
  '002_core.sql',
  '004_workflows.sql',
  '007_admin_workflows.sql',
  '010_ownership.sql',
  '011_payment_source.sql',
  '012_entitlements.sql',
  '013_legacy_ownership_audit.sql',
  '014_pricing.sql',
  '015_financial_integrity.sql',
  '016_foreign_keys.sql',
  '017_operational_tables.sql',
  '018_revenue_views.sql',
  '019_database_policies.sql',
  '020_admin_report_views.sql',
  '021_actor_identity.sql',
]);
export const versionFor = name => Number(name.slice(0, 3));
export const splitBatches = s => s.replace(/^\s*USE\s+\[?DubchefDB\]?\s*;?\s*$/gim, '')
  .split(/^\s*GO(?:\s+\d+)?\s*(?:--[^\n]*)?$/gim).filter(x => x.trim());
