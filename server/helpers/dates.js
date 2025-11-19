const normalizeTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString();
  }

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const hasExplicitTimezone = /([+-]\d{2}:\d{2}|z)$/i.test(trimmed);
  const toIsoString = (input) => {
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  };

  if (hasExplicitTimezone) {
    return toIsoString(trimmed) || trimmed;
  }

  const isoLike = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const withUtc = isoLike.endsWith('Z') ? isoLike : `${isoLike}Z`;
  return toIsoString(withUtc) || trimmed;
};

module.exports = { normalizeTimestamp };
