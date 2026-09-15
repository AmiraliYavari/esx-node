'use strict';

/**
 * پارس امن JSON؛ اگر مقدار از قبل object باشد یا پارس شکست بخورد، fallback برگردانده می‌شود.
 * @param {any} value
 * @param {any} fallback
 */
function safeJsonParse(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
}

module.exports = { safeJsonParse };
