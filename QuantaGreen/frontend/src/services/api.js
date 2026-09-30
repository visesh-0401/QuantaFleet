/**
 * api.js
 * Frontend API client for QuantaGreen backend services.
 */

const BASE_URL = '/api';

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

export async function fetchFleet() {
  const res = await fetch(`${BASE_URL}/fleet`);
  if (!res.ok) throw new Error('Failed to load fleet');
  return res.json();
}

export async function fetchRoutes() {
  const res = await fetch(`${BASE_URL}/routes`);
  if (!res.ok) throw new Error('Failed to load routes');
  return res.json();
}

export async function fetchFuels() {
  const res = await fetch(`${BASE_URL}/fuels`);
  if (!res.ok) throw new Error('Failed to load fuel specifications');
  return res.json();
}

export async function predictFuel(payload) {
  const res = await fetch(`${BASE_URL}/predict/fuel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to predict fuel');
  return res.json();
}

export async function compareAlternativeFuels(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/predict/compare-fuels?${query}`);
  if (!res.ok) throw new Error('Failed to compare fuels');
  return res.json();
}

export async function runQuantumOptimization(params) {
  const res = await fetch(`${BASE_URL}/optimize/quantum`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Quantum optimization failed');
  return res.json();
}

export async function runClassicalGreedy(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/optimize/classical?${query}`, { method: 'POST' });
  if (!res.ok) throw new Error('Classical optimization failed');
  return res.json();
}

export async function runFullBenchmark(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/benchmark/full?${query}`);
  if (!res.ok) throw new Error('Benchmark failed');
  return res.json();
}

export async function fetchCIIOverview() {
  const res = await fetch(`${BASE_URL}/compliance/cii`);
  if (!res.ok) throw new Error('Failed to fetch CII overview');
  return res.json();
}
