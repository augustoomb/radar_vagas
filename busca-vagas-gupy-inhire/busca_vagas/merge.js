const fs = require('fs');
const path = require('path');
const { DIR } = require('./lib.js');

const gupy = JSON.parse(fs.readFileSync(path.join(DIR, 'gupy_results.json'), 'utf8'));
const inhire = JSON.parse(fs.readFileSync(path.join(DIR, 'inhire_results.json'), 'utf8'));
const solides = JSON.parse(fs.readFileSync(path.join(DIR, 'solides_results.json'), 'utf8'));

function norm(s){return String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();}

function isRemoteType(workplaceType){
  const w = norm(workplaceType || '');
  return w.includes('remote') || w.includes('remoto') || w.includes('home office') || w.includes('homeoffice') || w.includes('trabalho remoto');
}

function isLocalOk(location){
  const loc = norm(location || '');
  // remoto já é tratado separadamente; vazio aceitamos como incerto
  if (loc === '') return true;
  const bh = /\bbelo horizonte\b|\bbh\b/.test(loc);
  const contagem = /\bcontagem\b/.test(loc);
  const mg = /\bminas gerais\b|\bmg\b/.test(loc);
  return bh || contagem || mg;
}

function manterVaga(row){
  const remote = isRemoteType(row.workplaceType);
  if (remote) return true;
  // híbrido/presencial só mantém se for BH/Contagem/MG
  return isLocalOk(row.location);
}

function alerta(row){
  const t = norm(row.jobTitle);
  const notes = [];
  const remote = isRemoteType(row.workplaceType);
  const loc = norm(row.location);
  const localOk = isLocalOk(row.location);

  if (!remote && /hibrid|presencial|on-?site|hibrido/.test(t)) notes.push('título menciona híbrido/presencial — conferir');
  if (!remote && !localOk) notes.push('local não é BH/Contagem/MG — conferir');

  const brOk = loc === '' || /\bbr\b|brasil|brazil/.test(loc);
  const foreign = /\b(us|usa|eua|singapore|sg|portugal|pt|mexico|argentina|spain|espanha|uk|remote latam|north america)\b/.test(loc);
  if (!brOk && foreign) notes.push('local fora do BR — pode exigir inglês');
  return notes.join('; ');
}

const all = [...gupy, ...inhire, ...solides]
  .filter(manterVaga)
  .map(r => ({
    empresa: r.companyList,
    plataforma: r.platform,
    na_lista: r.na_lista || 'Sim',
    cargo_categoria: r.role,
    titulo_vaga: r.jobTitle.trim(),
    tipo: r.workplaceType,
    local: r.location,
    link: r.url,
    id_externo: r.idExterno || null,
    nome_na_plataforma: r.companyGupy || r.companyInhire || r.companySolides || '',
    publicado: r.publishedDate || '',
    alerta: alerta(r)
  }));

// dedupe by link, then by empresa+titulo
const seen = new Set();
const deduped = [];
for (const r of all) {
  const k1 = r.link || (r.empresa + '|' + r.titulo_vaga);
  const k2 = norm(r.empresa) + '|' + norm(r.titulo_vaga) + '|' + r.plataforma;
  if (seen.has(k1) || seen.has(k2)) continue;
  seen.add(k1); seen.add(k2);
  deduped.push(r);
}

deduped.sort((a,b) =>
  (a.na_lista === b.na_lista ? 0 : a.na_lista === 'Sim' ? -1 : 1) ||
  a.plataforma.localeCompare(b.plataforma) ||
  a.empresa.localeCompare(b.empresa) ||
  a.cargo_categoria.localeCompare(b.cargo_categoria));

fs.writeFileSync(path.join(DIR, 'vagas_final.json'), JSON.stringify(deduped, null, 2));
console.log(`Merged: gupy=${gupy.length} inhire=${inhire.length} solides=${solides.length} -> deduped=${deduped.length}`);
console.log(`Gupy rows: ${deduped.filter(r=>r.plataforma==='Gupy').length}, InHire rows: ${deduped.filter(r=>r.plataforma==='InHire').length}, Solides rows: ${deduped.filter(r=>r.plataforma==='Solides').length}`);
const withAlert = deduped.filter(r=>r.alerta).length;
console.log(`Rows with alerta: ${withAlert}`);
