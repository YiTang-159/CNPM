// Quy tắc nghiệp vụ tách khỏi Express/SQL để có thể kiểm thử độc lập.
export const MEDIA_STATES = ['draft','reviewing','published'];
export const FEEDBACK_STATES = ['new','reviewing','resolved'];
export const PRIORITIES = ['low','normal','high'];
export function validMediaLines(rows) {
  return Array.isArray(rows) && rows.length > 0 && rows.length <= 2000 &&
    rows.every((x,i) => x && typeof x.text === 'string' && x.text.trim().length > 0 &&
      x.text.length <= 4000 && Number.isFinite(x.start) && Number.isFinite(x.end) &&
      x.start >= 0 && x.end > x.start && (i === 0 || x.start >= rows[i-1].end));
}
export function validateFeedback({status, priority, reply}) {
  return FEEDBACK_STATES.includes(status) && PRIORITIES.includes(priority) &&
    typeof reply === 'string' && reply.length <= 2000 &&
    (status !== 'resolved' || reply.trim().length > 0);
}
export function mediaTransitionError(existing, nextStatus, nextContent) {
  if (!MEDIA_STATES.includes(nextStatus)) return 'invalid';
  if (nextStatus === 'published' && (!existing || existing.status !== 'reviewing' || existing.content !== nextContent))
    return 'review_required';
  if (existing?.status === 'published' && existing.content !== nextContent && nextStatus !== 'draft')
    return 'reopen_required';
  return null;
}
