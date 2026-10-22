export const missing = value => value === null || value === undefined || (typeof value === 'string' && ['', 'na', 'n/a', 'null', 'nan', 'none', '..', '—', 'not reported', 'unreported', 'missing'].includes(value.trim().toLowerCase()));
export function numeric(value) { if (missing(value) || typeof value === 'boolean') return null; if (typeof value !== 'number' && (typeof value !== 'string' || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()))) return null; const n = Number(value); return Number.isFinite(n) ? n : null; }
function boundedCount(value, fallback, maximum) {
  const parsed = numeric(value);
  return parsed === null ? fallback : Math.max(1, Math.min(maximum, Math.floor(parsed)));
}
function rangeBound(value, name) {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return null;
  const parsed = numeric(value);
  if (parsed === null) throw new RangeError(`${name} must be a finite number or blank`);
  return parsed;
}
export function numericRange(rows, field, { min = null, max = null } = {}) {
  const lower = rangeBound(min, 'Minimum'), upper = rangeBound(max, 'Maximum');
  if (lower === null && upper === null) return rows;
  if (!field) throw new RangeError('A numeric field is required for an active range');
  if (lower !== null && upper !== null && lower > upper) throw new RangeError('Minimum must not exceed maximum');
  return rows.filter(row => {
    const value = numeric(row[field]);
    return value !== null && (lower === null || value >= lower) && (upper === null || value <= upper);
  });
}
export function numericSummary(rows, field) {
  const values = rows.map(row => numeric(row[field])).filter(value => value !== null).sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  const count = values.length, middle = Math.floor(count / 2);
  // Use the sum when representable, including subnormals; halve first only on overflow.
  const middleSum = count && count % 2 === 0 ? values[middle - 1] + values[middle] : null;
  const median = count ? count % 2 ? values[middle] : Number.isFinite(middleSum) ? middleSum / 2 : values[middle - 1] / 2 + values[middle] / 2 : null;
  return { count, missing: rows.length - count, min: count ? values[0] : null, max: count ? values.at(-1) : null, median };
}
export function sortedRecords(rows, field, { direction = 'asc', limit = null } = {}) {
  if (!['asc', 'desc'].includes(direction)) throw new RangeError('Sort direction must be asc or desc');
  const parsedLimit = limit === null || limit === undefined ? rows.length : numeric(limit);
  if (parsedLimit === null || parsedLimit < 0) throw new RangeError('Record limit must be a finite nonnegative number');
  return rows.map((row, index) => ({ row, index, value: numeric(row[field]) })).sort((a, b) => {
    if (a.value === null) return b.value === null ? a.index - b.index : 1;
    if (b.value === null) return -1;
    const order = a.value < b.value ? -1 : a.value > b.value ? 1 : 0;
    return (direction === 'desc' ? -order : order) || a.index - b.index;
  }).slice(0, Math.floor(parsedLimit)).map(item => item.row);
}
export function histogram(rows, field, bins = 14) {
  const values = rows.map(r => numeric(r[field])).filter(v => v !== null);
  if (!values.length) return { bins: [], valid: 0, missing: rows.length, min: null, max: null };
  let min = Infinity, max = -Infinity; for (const v of values) { min = Math.min(min, v); max = Math.max(max, v); }
  const count = min === max ? 1 : boundedCount(bins, 14, 80), span = max - min;
  // Opposite extreme finite values can have an infinite difference; scale first.
  const fraction = value => Number.isFinite(span) ? (value - min) / span : (value / 2 - min / 2) / (max / 2 - min / 2);
  const edge = i => i === 0 ? min : i === count ? max : min * (1 - i / count) + max * (i / count);
  const result = Array.from({ length: count }, (_, i) => ({ lo: edge(i), hi: edge(i + 1), count: 0 }));
  for (const v of values) result[min === max ? 0 : Math.max(0, Math.min(count - 1, Math.floor(fraction(v) * count)))].count++;
  return { bins: result, valid: values.length, missing: rows.length - values.length, min, max };
}
export function categories(rows, field, limit = 16) {
  limit = boundedCount(limit, 16, 50);
  const counts = new Map(); let absent = 0;
  for (const r of rows) { if (missing(r[field])) { absent++; continue; } const key = String(r[field]); counts.set(key, (counts.get(key) || 0) + 1); }
  const all = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const selected = all.slice(0, limit).map(([label, value]) => ({ label, value }));
  if (all.length > limit) selected.push({ label: `Other (${all.length - limit} categories)`, value: all.slice(limit).reduce((n, x) => n + x[1], 0) });
  return { values: selected, distinct: all.length, valid: rows.length - absent, missing: absent };
}
export function csv(rows, columns) {
  const cell = v => { const s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); const formula = typeof v === 'string' && (/^\s*[=+@]|^[\t\r\n]/.test(s) || (/^\s*-/.test(s) && numeric(s) === null)); const safe = formula ? `'${s}` : s; return `"${safe.replaceAll('"', '""')}"`; };
  return [columns.map(cell).join(','), ...rows.map(row => columns.map(k => cell(row[k])).join(','))].join('\r\n') + '\r\n';
}
export function filterRows(rows, query) { const q = query.trim().toLowerCase(); return q ? rows.filter(row => Object.values(row).some(v => v !== null && String(typeof v === 'object' ? JSON.stringify(v) : v).toLowerCase().includes(q))) : rows; }
export function countBy(rows, field) { const result = new Map(); for (const row of rows) { const k = row[field] || 'Unclassified'; result.set(k, (result.get(k) || 0) + 1); } return [...result].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value); }
export function format(value, digits = 2) { if (value === null || value === undefined || value === '') return 'Missing'; return typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: digits }) : String(value); }
export function numericChartGuard(rows, table, columns) {
  if (/\(fields\)/.test(table || '')) return 'This field/value projection mixes metadata and measurement definitions. Use category counts and the exact records; numeric pooling is disabled.';
  const scopeFields = columns.filter(isMeasureScope);
  const mixed = scopeFields.filter(c => new Set(rows.map(r=>missing(r[c])?'[missing scope]':String(r[c]))).size>1);
  return mixed.length ? `Select one ${mixed.join(', ')} in the scope filters before plotting numeric values. These rows contain different measures, units or populations.` : null;
}
export function isMeasureScope(c) { return /(?:^|_)(unit|units|currency)(?:_|$)|^(quantity|metric|measure|indicator|variable|measurement|record_type|scope|channel|statistic|population|denominator|uom)$/i.test(c); }
export function proxySeries(rows) {
  const selected = rows.filter(r=>r.record_type==='scenario' && r.quantity==='market_value' && ['India','Pakistan'].includes(r.country));
  const units = new Set(selected.map(r=>r.unit)); if (units.size!==1 || selected.some(r=>missing(r.unit))) throw new Error('Scenario units are missing or mixed');
  const groups = new Map();
  for (const r of selected) { if (!['p10','p50','p90'].includes(r.statistic)) continue; const key=r.country+'_'+r.year;if(!groups.has(key))groups.set(key,{country:r.country,year:numeric(r.year),unit:r.unit});const g=groups.get(key);if(Object.hasOwn(g,r.statistic))throw new Error('Duplicate scenario quantile');g[r.statistic]=numeric(r.value); }
  const result=[...groups.values()].sort((a,b)=>a.country.localeCompare(b.country)||a.year-b.year);
  for(const r of result)if(!['p10','p50','p90'].every(k=>typeof r[k]==='number')||!(r.p10<=r.p50&&r.p50<=r.p90))throw new Error('Incomplete or unordered scenario quantiles');
  if(result.length!==6)throw new Error('Expected six country/year scenarios');return result;
}
