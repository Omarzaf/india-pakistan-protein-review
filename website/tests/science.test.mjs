import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { csv, numeric } from '../public/dashboard/charts.mjs';
import { countryName, selectRows, proxyIntervals, panelIntervals, acceptedRunKey, runHorizon, attemptRecords,
  runAccounting, consumptionRows, measurementCompatibility, displayValue, sourceIds } from '../public/dashboard/pakistan-india-logic.mjs';

const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/dashboard');
const repository = path.resolve(here, '../../..');
const load = filename => JSON.parse(fs.readFileSync(path.join(here, filename), 'utf8'));
const manifest = load('pakistan-india-manifest.json');
const rows = key => load(`tables/${manifest.datasets[key].id}.json`).rows;
const hash = filename => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
const sourceJson = key => JSON.parse(fs.readFileSync(key === 'baselineGate' ? path.join(here, 'documents/baseline-gate.json') : path.join(repository, {panelRuns:'data/panel_runs.json',panelAggregates:'data/reference_panel_aggregates.json'}[key]), 'utf8'));

// Independent RFC-style reader for source/export parity; deliberately not a UI helper.
function readCsv(text) {
  const matrix = []; let record = [], field = '', quoted = false;
  for (let at = 0; at < text.length; at++) {
    const token = text[at];
    if (token === '"') {
      if (quoted && text[at + 1] === '"') { field += '"'; at++; } else quoted = !quoted;
    } else if (!quoted && (token === ',' || token === '\n')) {
      record.push(field.replace(/\r$/, '')); field = '';
      if (token === '\n') { matrix.push(record); record = []; }
    } else field += token;
  }
  assert.equal(quoted, false, 'unterminated quoted CSV cell');
  if (field || record.length) { record.push(field.replace(/\r$/, '')); matrix.push(record); }
  const header = matrix.shift();
  return matrix.filter(record => record.length > 1).map(record => Object.fromEntries(header.map((key, index) => [key, record[index] ?? ''])));
}

function independentQuantile(values, probability) {
  const ordered = [...values].sort((a, b) => a - b);
  const index = (ordered.length - 1) * probability;
  const left = Math.floor(index), fraction = index % 1;
  return ordered[left] + fraction * ((ordered[left + 1] ?? ordered[left]) - ordered[left]);
}

test('accepted JSON rows preserve all 540 source quantiles and summary records', () => {
  const sourceRuns = sourceJson('panelRuns').runs, projected = rows('panelRuns');
  assert.equal(sourceRuns.length, 60);
  for (let index = 0; index < sourceRuns.length; index++) {
    assert.equal(acceptedRunKey(projected[index]), acceptedRunKey(sourceRuns[index]));
    for (const year of [2026, 2030, 2035]) assert.deepEqual(runHorizon(projected[index], year), sourceRuns[index][`h${year}`]);
  }
  assert.deepEqual(rows('panelAggregates'), sourceJson('panelAggregates'));
});

test('six current proxy medians reproduce retained full precision and exact row bindings', () => {
  const intervals = proxyIntervals(rows('proxy'));
  const expected = [93.237333, 187.811844, 447.504341, 3.644697, 5.97734, 11.759263];
  assert.deepEqual(intervals.map(interval => interval.p50), expected);
  assert.equal(intervals.length, 6);
  for (const interval of intervals) {
    assert.equal(interval.sourceRows.length, 3);
    assert.equal(new Set(interval.sourceRows.map(row => row.statistic)).size, 3);
    assert(interval.sourceRows.every(row => row.country === interval.country && Number(row.year) === interval.year));
    assert(interval.sourceRows.every(row => rows('proxy').some(source => source.row_id === row.row_id)));
    assert(interval.intervalDefinition.includes('analyst-selected'));
  }
  assert.equal(proxyIntervals(rows('proxy'), { country: 'Pakistan', year: 2030 })[0].p50, 5.97734);
  assert.equal(proxyIntervals(rows('proxy'), { year: 2027 }).length, 0, 'no invented annual points');
});

test('named sensitivities select retained outputs with no parameter reruns', () => {
  const india = proxyIntervals(rows('proxy'), { country: 'India', year: 2035, quantity: 'market_value_drift_overlap_adjusted' });
  const pakistan = proxyIntervals(rows('proxy'), { country: 'Pakistan', year: 2035, quantity: 'market_value_without_urban_animal' });
  assert.equal(india.length, 1); assert.equal(india[0].p50, 215.060659);
  assert.equal(pakistan.length, 1); assert.equal(pakistan[0].p50, 8.318219);
  assert.equal(proxyIntervals(rows('proxy'), { country: 'India', quantity: 'market_value_without_urban_animal' }).length, 0);
});

test('missing, duplicate or reversed scenario intervals fail closed', () => {
  const selected = rows('proxy').filter(row => row.record_type === 'scenario' && row.country === 'India' && row.year === '2035' && row.quantity === 'market_value');
  assert.throws(() => proxyIntervals(selected.slice(1)), /Incomplete interval/);
  assert.throws(() => proxyIntervals([...selected, selected[0]]), /Duplicate proxy percentile/);
  assert.throws(() => proxyIntervals(selected.map(row => row.statistic === 'p10' ? { ...row, value: '1000000' } : row)), /Unordered interval/);
});

test('all 18 panel summaries independently match type-7 percentiles of accepted run medians', () => {
  const raw = sourceJson('panelRuns').runs;
  for (const summary of rows('panelAggregates')) {
    const selected = raw.filter(row => row.model === summary.model && row.region === summary.region);
    assert.equal(selected.length, 10);
    for (const [name, probability] of [['p10', .1], ['p50', .5], ['p90', .9]]) {
      const expected = independentQuantile(selected.map(row => row[`h${summary.year}`].p50), probability);
      assert(Math.abs(summary[name] - expected) <= 1e-12, `${summary.model}/${summary.region}/${summary.year}/${name}`);
    }
    for (const tail of ['p10', 'p90']) assert.equal(summary[`run_${tail}_median`], independentQuantile(selected.map(row => row[`h${summary.year}`][tail]), .5));
  }
  assert.equal(panelIntervals(rows('panelAggregates')).length, 12);
  assert.equal(panelIntervals(rows('panelAggregates'), { includeUS: true }).length, 18);
  assert.equal(panelIntervals(rows('panelAggregates'), { country: 'Pakistan', year: 2035 }).length, 2, 'models stay separate');
  assert(panelIntervals(rows('panelAggregates'))[0].intervalDefinition.includes('not a predictive interval'));
});

test('run registry preserves all attempts and accepted slots without treating retries as forecasts', () => {
  const attempts = attemptRecords(rows('panelAttempts')), account = runAccounting(attempts);
  assert.equal(attempts.length, 79); assert.equal(new Set(attempts.map(row => row.attempt_id)).size, 79);
  assert.deepEqual(account.statuses, { ACCEPTED: 60, REJECTED: 15, EXECUTION_ERROR: 3, RUNNING: 1 });
  assert.deepEqual(account.acceptedKeys, rows('panelRuns').map(acceptedRunKey).sort());
  assert.equal(rows('panelRuns').filter(row => ['india', 'pakistan'].includes(row.region)).length, 40);
  const retry = attempts.filter(row => row.model === 'claude-opus-5-5' && row.region === 'india' && String(row.slot) === '1');
  assert.equal(retry.length, 2); assert.equal(retry[0].accepted_key, retry[1].accepted_key); assert.notEqual(retry[0].attempt_id, retry[1].attempt_id);
  const running = attempts.find(row => row.status === 'RUNNING');
  assert(running.historical_status.includes('no live process')); assert.equal(running.last_recorded_at, running.ended_at_utc || running.started_at_utc || null);
  assert.throws(() => runAccounting([...attempts, attempts.find(row => row.status === 'ACCEPTED')]), /Duplicate accepted slot/);
});

test('accepted run and timestamp identity remain stable under country/status filtering', () => {
  const attempts = attemptRecords(rows('panelAttempts'));
  const filtered = selectRows(attempts, { country: 'Pakistan', model: 'claude-opus-5-5', status: 'ACCEPTED' });
  assert.equal(filtered.length, 10);
  for (const row of filtered) assert.strictEqual(attempts.find(attempt => attempt.attempt_id === row.attempt_id), row);
  assert.throws(() => acceptedRunKey({ model: 'x', region: 'india', slot: '' }), /Incomplete/);
  assert.throws(() => runHorizon(rows('panelRuns')[0], 2027), /retained/);
  assert.throws(() => runHorizon({ ...rows('panelRuns')[0], h2026: 'no' }, 2026), /Malformed/);
  assert.equal(countryName('us'), 'United States');
});

test('India per-person and consumer-unit totals remain separate and overlapping totals are excluded by default', () => {
  assert.equal(consumptionRows(rows('intake'), 'intake').length, 24);
  const perPerson = consumptionRows(rows('intake'), 'intake', { includeTotals: true, where: { fractile: 'All-India' } });
  const consumer = consumptionRows(rows('consumerUnit'), 'consumerUnit', { includeTotals: true, where: { fractile: 'All-India' } });
  assert.deepEqual(perPerson.map(row => Number(row.intake_g)), [61.8, 63.4]);
  assert.deepEqual(consumer.map(row => Number(row.intake_g)), [66.6, 69.9]);
  assert.equal(measurementCompatibility([...perPerson, ...consumer]).compatible, false);
  assert.equal(consumptionRows(rows('intake'), 'intake', { country: 'Pakistan' }).length, 0);
});

test('Pakistan complete intake remains null even if a conflicting numeric field is supplied', () => {
  const held = consumptionRows(rows('pakistanIntake'), 'pakistanIntake');
  assert.equal(held.length, 6);
  for (const row of held) {
    assert.equal(row.headline_eligible, 'false'); assert.equal(row.whole_diet_total_eligible, 'false');
    for (const field of ['intake_g', 'whole_diet_total', 'population_deficiency_prevalence']) assert.equal(numeric(row[field]), null);
    assert.equal(displayValue(row, 'intake_g'), null);
    assert.equal(displayValue({ ...row, intake_g: 54.7 }, 'intake_g'), null);
  }
});

test('food quantities retain physical units and a distinct source-vintage baseline', () => {
  const india = consumptionRows(rows('composition'), 'indiaComposition', { includeTotals: true });
  const pakistan = consumptionRows(rows('composition'), 'pakistanQuantities');
  assert.equal(india.length, 130); assert.equal(pakistan.length, 684);
  assert.equal(measurementCompatibility([...india, ...pakistan]).compatible, false);
  const national = selectRows(pakistan, { where: { group: 'all_all' } });
  const chicken = national.find(row => row.food_group === 'chicken_meat');
  assert.equal(chicken.unit, 'kg/person/month'); assert.equal(Number(chicken.value), 0.3582121102449887);
  assert.equal(chicken.source_id, 'pakistan_hies_2024_25_table23');
  assert.equal(national.find(row => row.food_group === 'milk_fresh_and_boiled').unit, 'litre/person/month');
  assert.equal(national.find(row => row.food_group === 'eggs').unit, 'count/person/month');
  const gate = sourceJson('baselineGate');
  assert.equal(gate.baseline_acceptance.Pakistan.published_target, .34);
  assert.notEqual(Number(chicken.value), gate.baseline_acceptance.Pakistan.published_target, 'workbook and report vintages are not silently harmonized');
});

test('regional frequency populations and recall periods cannot become a common purchase-rate series', () => {
  const india = selectRows(rows('regional'), { where: { indicator: 'women_15_49_fish_chicken_or_meat_at_least_weekly' } });
  const pakistan = selectRows(rows('regional'), { where: { indicator: 'women_15_49_meat_fish_poultry_previous_day' } });
  assert.equal(india.length, 36); assert.equal(pakistan.length, 25);
  assert(india.every(row => row.period === '2019-21'));
  assert(pakistan.every(row => row.period === '2018-19 fieldwork; NNS 2018'));
  const check = measurementCompatibility([...india, ...pakistan]);
  assert.equal(check.compatible, false); assert(check.differences.some(item => item.field === 'indicator'));
});

test('conventional outlook separates historical/base years from projection years', () => {
  const outlook = rows('supply').filter(row => row.source_id === 'oecd_fao_outlook_2025_2034' && row.metric.startsWith('oecd_human_consumption_'));
  for (const country of ['India', 'Pakistan']) {
    const history = outlook.filter(row => row.country === country && row.period === 'historical_or_base_estimate');
    const future = outlook.filter(row => row.country === country && row.period === 'projection');
    assert.equal(Math.min(...history.map(row => Number(row.year))), 2010); assert.equal(Math.max(...history.map(row => Number(row.year))), 2024);
    assert.equal(Math.min(...future.map(row => Number(row.year))), 2025); assert.equal(Math.max(...future.map(row => Number(row.year))), 2034);
    assert(history.every(row => row.unit === 'kg/person/year (retail weight)'));
  }
  assert(manifest.datasets.supply.caveat.includes('not measured individual intake'));
});

test('current acceptance and historical diagnostic states stay distinct', () => {
  const gate = sourceJson('baselineGate');
  assert.equal(gate.independent_reproduction_pass, true);
  assert.equal(gate.baseline_acceptance.India.accepted, false); assert.equal(gate.baseline_acceptance.Pakistan.accepted, false);
  assert.equal(gate.baseline_acceptance.Pakistan.method_acceptance_pass, false);
  assert.equal(gate.new_estimation_allowed, false); assert.equal(gate.projection_allowed, false);
  assert.equal(rows('claims').length, 30); assert(rows('claims').every(row => row.disposition === 'pending'));
  assert(rows('householdScenarios').every(row => row.country === 'India' && row.status === 'DIAGNOSTIC'));
  assert.equal(rows('householdHoldout').filter(row => row.interval_hit === 'True').length, 27);
  assert(rows('householdHoldout').every(row => row.complete_basket_households === '0'));
});

test('exact selected records round-trip to filtered CSV with units and source IDs', () => {
  const selected = selectRows(rows('composition'), { country: 'Pakistan', where: { residence: 'rural', quintile: 'Q1', food_group: 'chicken_meat' } });
  assert.equal(selected.length, 1);
  const columns = Object.keys(selected[0]);
  assert.deepEqual(readCsv(csv(selected, columns)), selected);
  const interval = proxyIntervals(rows('proxy'), { country: 'Pakistan', year: 2030 })[0];
  assert.deepEqual(readCsv(csv(interval.sourceRows, Object.keys(interval.sourceRows[0]))), interval.sourceRows);
  assert.deepEqual(sourceIds(interval.sourceRows[0]), JSON.parse(interval.sourceRows[0].source_ids));
});
