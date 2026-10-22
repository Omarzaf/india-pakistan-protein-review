import { numeric } from './charts.mjs';

export const FOCUS_YEARS = Object.freeze([2026, 2030, 2035]);
export const FOCUS_COUNTRIES = Object.freeze(['India', 'Pakistan']);
export const PROXY_INTERVAL = '10th / 50th / 90th percentiles under analyst-selected assumptions; no demonstrated predictive coverage.';
export const PANEL_INTERVAL = '10th / 50th / 90th percentiles of ten accepted response medians; not a predictive interval.';

export function countryName(value) {
  const key = String(value ?? '').trim().toLowerCase();
  return ({ india: 'India', pakistan: 'Pakistan', us: 'United States', 'united states': 'United States' })[key] ?? String(value ?? '');
}

function unrestricted(value) { return value === undefined || value === null || value === '' || value === 'all' || value === 'both'; }
function matches(value, expected) { return Array.isArray(expected) ? expected.some(item => String(value) === String(item)) : String(value) === String(expected); }

/** Preserve exact row objects and source order; selectors never impute values. */
export function selectRows(rows, { country = 'all', year = 'all', model = 'all', status = 'all', query = '', where = {} } = {}) {
  const needle = String(query).trim().toLowerCase();
  return rows.filter(row => (unrestricted(country) || countryName(row.country ?? row.region) === countryName(country))
    && (unrestricted(year) || String(row.year) === String(year))
    && (unrestricted(model) || row.model === model)
    && (unrestricted(status) || row.status === status)
    && Object.entries(where).every(([key, value]) => matches(row[key], value))
    && (!needle || Object.values(row).some(value => String(value ?? '').toLowerCase().includes(needle))));
}

function checkedInterval(p10, p50, p90, label) {
  const values = [p10, p50, p90].map(numeric);
  if (values.some(value => value === null)) throw new Error(`Incomplete interval: ${label}`);
  if (!(values[0] <= values[1] && values[1] <= values[2])) throw new Error(`Unordered interval: ${label}`);
  return { p10: values[0], p50: values[1], p90: values[2] };
}

/** Read retained interval rows only. This does not simulate or interpolate. */
export function proxyIntervals(rows, { country = 'all', year = 'all', quantity = 'market_value' } = {}) {
  const groups = new Map();
  const selected = selectRows(rows, { country, year, where: { quantity, statistic: ['p10', 'p50', 'p90'] } })
    .filter(row => FOCUS_COUNTRIES.includes(row.country) && ['scenario', 'sensitivity'].includes(row.record_type));
  for (const row of selected) {
    const key = [row.country, row.year, row.quantity, row.unit, row.record_type].join('|');
    if (!groups.has(key)) groups.set(key, { country: row.country, year: Number(row.year), quantity: row.quantity, unit: row.unit, recordType: row.record_type, sourceRows: [], values: {} });
    const group = groups.get(key);
    if (Object.hasOwn(group.values, row.statistic)) throw new Error(`Duplicate proxy percentile: ${row.row_id}`);
    group.values[row.statistic] = row.value;
    group.sourceRows.push(row);
  }
  return [...groups.values()].map(({ values, ...group }) => ({ ...group, ...checkedInterval(values.p10, values.p50, values.p90, `${group.country}/${group.year}/${quantity}`),
    label: `${group.country} · ${group.year}`, sourceRowIds: group.sourceRows.map(row => row.row_id), intervalDefinition: PROXY_INTERVAL,
    priceBasis: '2025 prices', scope: 'Plant-based replacement foods plus fermentation-derived human foods; excludes cultivated meat.' }))
    .sort((a, b) => FOCUS_COUNTRIES.indexOf(a.country) - FOCUS_COUNTRIES.indexOf(b.country) || a.year - b.year);
}

/** Keep requested models separate; never average the panel into an ensemble. */
export function panelIntervals(rows, { country = 'all', year = 'all', model = 'all', includeUS = false } = {}) {
  const selected = selectRows(rows, { country, year, model }).filter(row => includeUS || countryName(row.region) !== 'United States');
  const keys = new Set();
  return selected.map(row => {
    const key = [row.model, row.region, row.year].join('|');
    if (keys.has(key)) throw new Error(`Duplicate panel summary: ${key}`);
    keys.add(key);
    return { country: countryName(row.region), region: row.region, year: Number(row.year), model: row.model, n: numeric(row.n),
      ...checkedInterval(row.p10, row.p50, row.p90, key), runP10Median: numeric(row.run_p10_median), runP90Median: numeric(row.run_p90_median),
      unit: 'million USD, 2025 prices', label: `${countryName(row.region)} · ${row.model} · ${row.year}`,
      sourceRows: [row], sourceRowIds: [key], intervalDefinition: PANEL_INTERVAL,
      scope: 'Regional plant-based retail replacements; headline excludes fermentation and cultivated technologies.' };
  });
}

/** A slot is unique only within its requested model and region. */
export function acceptedRunKey(row) {
  const slot = numeric(row.slot), model = row.model, region = String(row.region ?? '').toLowerCase();
  if (!model || !['india', 'pakistan', 'us'].includes(region) || slot === null || !Number.isInteger(slot) || slot < 1) throw new Error('Incomplete accepted model/region/slot key');
  return `${model}|${region}|${slot}`;
}

export function runHorizon(row, year) {
  if (!FOCUS_YEARS.includes(Number(year))) throw new RangeError('Only retained 2026, 2030 and 2035 horizons are available');
  const raw = row[`h${year}`];
  if (raw === null || raw === undefined || raw === '') return null;
  let values;
  try { values = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { throw new Error(`Malformed run horizon: ${acceptedRunKey(row)}/${year}`); }
  return checkedInterval(values?.p10, values?.p50, values?.p90, `${acceptedRunKey(row)}/${year}`);
}

/** Assign identities before filtering so retry and export IDs remain stable. */
export function attemptRecords(rows) {
  return rows.map((row, index) => ({ ...row, attempt_id: `attempt-${String(index + 1).padStart(3, '0')}`, accepted_key: acceptedRunKey(row),
    last_recorded_at: row.ended_at_utc || row.started_at_utc || null,
    historical_status: row.status === 'RUNNING' ? 'Recorded RUNNING in frozen attempt history; no live process is established.' : `Recorded ${row.status}` }));
}

export function runAccounting(rows) {
  const statuses = { ACCEPTED: 0, REJECTED: 0, EXECUTION_ERROR: 0, RUNNING: 0 };
  const accepted = new Set();
  for (const row of rows) {
    if (!Object.hasOwn(statuses, row.status)) throw new Error(`Unknown attempt status: ${row.status}`);
    statuses[row.status]++;
    if (row.status === 'ACCEPTED') {
      const key = acceptedRunKey(row);
      if (accepted.has(key)) throw new Error(`Duplicate accepted slot: ${key}`);
      accepted.add(key);
    }
  }
  return { attempts: rows.length, accepted: statuses.ACCEPTED, rejected: statuses.REJECTED, executionErrors: statuses.EXECUTION_ERROR,
    historicalRunning: statuses.RUNNING, statuses, acceptedKeys: [...accepted].sort() };
}

/** Country-specific measurement rows; optional group selectors remain exact. */
export function consumptionRows(rows, kind, { country = 'all', includeTotals = false, ...options } = {}) {
  let selected = selectRows(rows, { country, ...options });
  if (kind === 'intake' || kind === 'consumerUnit') {
    const unit = kind === 'intake' ? 'g/person/day' : 'g/consumer_unit/day';
    selected = selected.filter(row => row.country === 'India' && row.unit === unit && (includeTotals || row.fractile !== 'All-India'));
  } else if (kind === 'indiaComposition') {
    selected = selected.filter(row => row.country === 'India' && row.metric === 'share_of_protein_intake' && row.unit === 'percent_of_protein_intake' && (includeTotals || row.fractile !== 'All-India'));
  } else if (kind === 'pakistanQuantities') {
    selected = selected.filter(row => row.country === 'Pakistan' && row.metric === 'monthly_per_capita_consumption_quantity');
  } else if (kind === 'pakistanIntake') {
    selected = selected.filter(row => row.country === 'Pakistan' && row.metric === 'complete_dietary_protein_unavailable');
  } else if (kind !== 'regional') throw new RangeError(`Unknown consumption kind: ${kind}`);
  return selected;
}

/** Do not pool units, source populations or recall periods in one comparison. */
export function measurementCompatibility(rows, fields = ['unit', 'metric', 'indicator', 'denominator', 'period', 'sex', 'age_group']) {
  const differences = fields.map(field => ({ field, values: [...new Set(rows.map(row => String(row[field] ?? '')))] }))
    .filter(item => item.values.length > 1);
  return { compatible: differences.length === 0, differences };
}

/** Preserve missing complete-intake fields even if a caller requests a number. */
export function displayValue(row, field = 'value') {
  if (row.metric === 'complete_dietary_protein_unavailable' || (row.headline_eligible === 'false' && field === 'intake_g')) return null;
  return numeric(row[field]);
}

export function sourceIds(row) {
  if (row.source_id) return [row.source_id];
  if (!row.source_ids) return [];
  if (Array.isArray(row.source_ids)) return row.source_ids;
  const text = String(row.source_ids);
  try { const parsed = JSON.parse(text); if (Array.isArray(parsed)) return parsed; } catch { /* Some retained tables use semicolon-separated identifiers. */ }
  return text.split(';').map(value => value.trim()).filter(Boolean);
}
