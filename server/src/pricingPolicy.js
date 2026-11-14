/** Pricing validation and order quote are pure, portable and exercised without SQL. */
export const SUPPORTED_CURRENCIES = ['VND', 'USD', 'CNY'];
export const minorFactor = currency => currency === 'VND' ? 1 : 100;
export function cleanPriceUpdate(body) {
  if (!body || typeof body !== 'object' || !SUPPORTED_CURRENCIES.includes(body.currency))
    return { error:'invalid_currency' };
  const fields=['uploadMinor','translationMinor','maxVideos','maxTranslations','annualDiscountPct','version'];
  if (fields.some(name => typeof body[name] !== 'number' || !Number.isSafeInteger(body[name])))
    return { error:'invalid_price' };
  if (body.uploadMinor < 0 || body.uploadMinor > 100000000 || body.translationMinor < 0 || body.translationMinor > 100000000 ||
      body.maxVideos < 1 || body.maxVideos > 5000 || body.maxTranslations < 1 || body.maxTranslations > 3 ||
      body.annualDiscountPct < 0 || body.annualDiscountPct > 90 || body.version < 1)
    return { error:'invalid_price' };
  const reason=typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!reason || reason.length > 500) return { error:'reason_required' };
  return { value:{ ...Object.fromEntries(fields.map(f => [f,body[f]])), currency:body.currency, reason } };
}
export function calculateOrderSnapshot(price, uploads, outs) {
  if (!price || !Number.isSafeInteger(uploads) || !Number.isSafeInteger(outs) ||
      uploads < 0 || uploads > price.maxVideos || outs < 1 || outs > uploads*price.maxTranslations)
    throw Object.assign(new Error('invalid_quantity'),{code:'invalid_quantity'});
  const amountMinor=price.uploadMinor*uploads + price.translationMinor*outs;
  if (!Number.isSafeInteger(amountMinor)) throw Object.assign(new Error('invalid_amount'),{code:'invalid_amount'});
  return { amountMinor, currency:price.currency, uploadMinor:price.uploadMinor, translationMinor:price.translationMinor, version:price.version };
}
