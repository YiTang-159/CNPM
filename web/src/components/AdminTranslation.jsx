import { useCallback } from 'react';
import { useI18n } from '../context/I18nContext.jsx';
import { ADMIN_TRANSLATIONS } from '../shared/i18n.js';

// Only translate presentation strings. Never mutate API values, record identifiers or customer data.
export function translateAdmin(input, languageIndex) {
  if (typeof input !== 'string' || languageIndex === 0) return input;
  const core = input.trim();
  const statusCodes = {
    active: ['Active', '正常'], inactive: ['Inactive', '已停用'], locked: ['Locked', '已锁定'],
    new: ['New', '新建'], reviewing: ['In progress', '处理中'], resolved: ['Resolved', '已解决'],
    uploaded: ['Uploaded', '已上传'], processing: ['Processing', '处理中'],
    completed: ['Completed', '已完成'], failed: ['Failed', '失败'],
    draft: ['Draft', '草稿'], published: ['Published', '已发布'],
    pending: ['Pending', '待处理'], paid: ['Paid', '已付款'], cancelled: ['Cancelled', '已取消'],
  };
  if (statusCodes[core]) return statusCodes[core][languageIndex - 1];
  const exact = ADMIN_TRANSLATIONS[input]?.[languageIndex - 1];
  if (exact) return exact;
  const localized = ADMIN_TRANSLATIONS[core]?.[languageIndex - 1];
  if (localized) return input.slice(0, input.indexOf(core)) + localized + input.slice(input.indexOf(core) + core.length);
  // Keep server details intact; translate only known error-message prefixes.
  for (const [key, options] of Object.entries(ADMIN_TRANSLATIONS)) {
    if ((key.endsWith(': ') || key.endsWith(' ')) && input.startsWith(key) && options[languageIndex - 1])
      return options[languageIndex - 1] + input.slice(key.length);
  }
  return input;
}
export function useAdminT() {
  const { L } = useI18n();
  return useCallback((vi) => translateAdmin(vi, L), [L]);
}
export default function AdminT({ vi }) {
  const t = useAdminT();
  return t(vi);
}
