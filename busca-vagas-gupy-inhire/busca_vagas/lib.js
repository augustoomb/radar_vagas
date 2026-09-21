// Shared helpers
const fs = require('fs');
const path = require('path');
const DIR = __dirname;

function loadCompanies() {
  const raw = JSON.parse(fs.readFileSync(path.join(DIR, 'companies.json'), 'utf8').replace(/^﻿/, ''));
  return raw.map(s => String(s).trim()).filter(Boolean);
}

// normalize: lowercase, strip accents, keep only a-z0-9 (compact)
function compact(s) {
  return String(s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '');
}
// tokens (words) normalized, dropping generic corporate tokens
const STOP = new Set(['sa','s','a','ltda','me','eireli','group','grupo','the','company','co','tecnologia','tech','brasil','brazil','do','de','da','dos','das','and','solutions','software','digital','inc','holding','participacoes','banco']);
function tokens(s) {
  return String(s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/).filter(t => t && !STOP.has(t));
}

// Role matching against a job title. Returns canonical role label or null.
// Escopo: Java / Backend / Java+Backend / Software Engineer / Analista Dev Júnior.
function matchRole(title) {
  const t = ' ' + String(title)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ') + ' ';

  const has = (re) => re.test(t);

  // Java + Backend Júnior (títulos combinados)
  if (
    has(/ desenvolvedor java backend junior /) ||
    has(/ desenvolvedor java backend jr /) ||
    has(/ desenvolvedor backend java junior /) ||
    has(/ desenvolvedor backend java jr /) ||
    has(/ desenvolvedor java back end junior /) ||
    has(/ desenvolvedor java back end jr /) ||
    has(/ desenvolvedor back end java junior /) ||
    has(/ desenvolvedor back end java jr /) ||
    has(/ java backend developer junior /) ||
    has(/ java backend developer jr /) ||
    has(/ backend java developer junior /) ||
    has(/ backend java developer jr /)
  ) {
    return 'Java Backend Developer Júnior';
  }

  // Java Júnior
  if (
    has(/ desenvolvedor java junior /) ||
    has(/ desenvolvedor java jr /) ||
    has(/ desenvolvedor java i /) ||
    has(/ programador java junior /) ||
    has(/ programador java jr /) ||
    has(/ programador java i /) ||
    has(/ junior java developer /) ||
    has(/ jr java developer /) ||
    has(/ java developer i /) ||
    has(/ junior java engineer /) ||
    has(/ jr java engineer /) ||
    has(/ analista desenvolvedor java junior /) ||
    has(/ analista desenvolvedor java jr /) ||
    has(/ analista de desenvolvimento java junior /) ||
    has(/ analista de desenvolvimento java jr /)
  ) {
    return 'Java Developer Júnior';
  }

  // Backend Júnior
  if (
    has(/ desenvolvedor backend junior /) ||
    has(/ desenvolvedor backend jr /) ||
    has(/ desenvolvedor back end junior /) ||
    has(/ desenvolvedor back end jr /) ||
    has(/ backend developer junior /) ||
    has(/ backend developer jr /) ||
    has(/ back end developer junior /) ||
    has(/ back end developer jr /) ||
    has(/ analista backend junior /) ||
    has(/ analista backend jr /) ||
    has(/ analista de desenvolvimento backend junior /) ||
    has(/ analista de desenvolvimento backend jr /)
  ) {
    return 'Backend Developer Júnior';
  }

  // Software Engineer / Desenvolvedor de Software Júnior
  if (
    has(/ software engineer junior /) ||
    has(/ software engineer jr /) ||
    has(/ software engineer i /) ||
    has(/ desenvolvedor de software junior /) ||
    has(/ desenvolvedor de software jr /) ||
    has(/ desenvolvedor de software i /) ||
    has(/ analista desenvolvedor junior /) ||
    has(/ analista desenvolvedor jr /) ||
    has(/ analista de desenvolvimento junior /) ||
    has(/ analista de desenvolvimento jr /)
  ) {
    return 'Software Engineer Júnior';
  }

  return null;
}

// URL slug from a job title (lowercase, strip accents, non-alnum -> hyphen).
// The InHire SPA route is /vagas/:jobId/:slug — without the :slug segment the
// client router fails to resolve and renders a black screen. The slug is cosmetic
// (job loads by jobId), so any non-empty slug works.
function slugify(s) {
  return String(s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'vaga';
}

function isRemote(workplaceType, isRemoteWork) {
  const w = String(workplaceType || '').toLowerCase();
  if (isRemoteWork === true) return true;
  return w.includes('remote') || w.includes('remoto');
}

// simple concurrency pool
async function pool(items, worker, concurrency = 12) {
  const results = new Array(items.length);
  let i = 0;
  async function run() {
    while (i < items.length) {
      const idx = i++;
      try { results[idx] = await worker(items[idx], idx); }
      catch (e) { results[idx] = { __error: String(e && e.message || e) }; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = { DIR, loadCompanies, compact, tokens, matchRole, slugify, isRemote, pool, sleep, STOP };
