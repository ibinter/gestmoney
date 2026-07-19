/* Extrait le <style> des maquettes dashboard, préfixe variables et classes
   en `gm-` pour éviter toute collision avec Tailwind / shadcn (dont les
   tokens sont en HSL), et écrit une feuille de style partagée pour l'app.

   Usage : node scripts/extract-mockup-css.js mockup apps/web/src/styles/mockup-system.css
*/
const fs = require('fs');
const path = require('path');

const MOCKUP_DIR = process.argv[2];
const OUT = process.argv[3];

// Uniquement les 12 maquettes du dashboard : les pages d'auth (login,
// onboarding, forgot/reset-password) ont leur PROPRE design system
// (.card, --surface, --shadow différents) et pollueraient celui-ci.
// index.html est la source CANONIQUE du chrome partagé (topbar, sidebar,
// card, btn…) ; les autres maquettes ont légèrement dérivé et on n'en garde
// que les sélecteurs qu'index.html ne définit pas.
const DASHBOARD_PAGES = [
  'index', 'transactions', 'float', 'clients', 'agents', 'agences',
  'commissions', 'rapports', 'comptabilite', 'stock', 'administration',
  'ia-fraude',
];

const files = DASHBOARD_PAGES.map((n) => `${n}.html`).filter((f) =>
  fs.existsSync(path.join(MOCKUP_DIR, f)),
);

/** Découpe le CSS en règles de premier niveau en suivant la profondeur des
 *  accolades — indispensable pour ne pas casser les blocs @media imbriqués. */
function splitTopLevelRules(css) {
  const rules = [];
  let depth = 0;
  let start = 0;
  let inString = null;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (inString) {
      if (ch === inString && css[i - 1] !== '\\') inString = null;
      continue;
    }
    if (ch === '"' || ch === "'") { inString = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        rules.push(css.slice(start, i + 1).trim());
        start = i + 1;
      }
    }
  }
  const tail = css.slice(start).trim();
  if (tail) rules.push(tail);
  return rules.filter(Boolean);
}

/** Prélude d'une règle (sélecteur ou at-rule) servant de clé d'unicité. */
function preludeOf(rule) {
  const i = rule.indexOf('{');
  return i === -1 ? rule.trim() : rule.slice(0, i).trim().replace(/\s+/g, ' ');
}

const seen = new Set();
const definedPreludes = new Set();
const overridden = new Set();
const chunks = [];
const varNames = new Set();
const classNames = new Set();

for (const file of files) {
  const html = fs.readFileSync(path.join(MOCKUP_DIR, file), 'utf8');
  const m = html.match(/<style>([\s\S]*?)<\/style>/);
  if (!m) continue;
  let css = m[1];

  // Retirer les règles globales : Tailwind preflight + globals.css les gèrent
  css = css.replace(/^\s*\*,\s*\*::before,\s*\*::after\s*\{[^}]*\}\s*$/gm, '');
  css = css.replace(/^\s*html\s*\{[^}]*\}\s*$/gm, '');
  css = css.replace(/^\s*body\s*\{[^}]*\}\s*$/gm, '');

  for (const v of css.matchAll(/--([a-z0-9-]+)\s*:/g)) varNames.add(v[1]);
  for (const c of css.matchAll(/\.([a-z][a-z0-9-]*)/g)) classNames.add(c[1]);

  const isCanonical = file === 'index.html';

  for (const rule of splitTopLevelRules(css)) {
    const prelude = preludeOf(rule);
    // Les @media/@keyframes peuvent légitimement se répéter : on ne
    // déduplique que par contenu exact pour eux.
    const isAtRule = prelude.startsWith('@');

    if (!isCanonical && !isAtRule && definedPreludes.has(prelude)) {
      overridden.add(prelude); // dérive ignorée au profit d'index.html
      continue;
    }
    const key = rule.replace(/\s+/g, ' ');
    if (seen.has(key)) continue;
    seen.add(key);
    if (!isAtRule) definedPreludes.add(prelude);
    chunks.push(rule);
  }
}

let out = chunks.join('\n');

// Préfixer les variables : --primary -> --gm-primary (définitions ET var())
for (const v of varNames) {
  if (v.startsWith('gm-')) continue;
  out = out.replace(new RegExp(`--${v}\\b`, 'g'), `--gm-${v}`);
}

// Préfixer les classes : .card -> .gm-card (les plus longues d'abord pour
// éviter que .card ne morde sur .card-head)
for (const c of [...classNames].sort((a, b) => b.length - a.length)) {
  if (c.startsWith('gm-')) continue;
  out = out.replace(new RegExp(`\\.${c}\\b`, 'g'), `.gm-${c}`);
}

const header = `/* =============================================================
   SYSTÈME DE DESIGN GESTMONEY — porté depuis /mockup
   GÉNÉRÉ par scripts/extract-mockup-css.js — NE PAS ÉDITER À LA MAIN.
   Régénérer :
     node scripts/extract-mockup-css.js mockup apps/web/src/styles/mockup-system.css
   Variables et classes préfixées \`gm-\` pour éviter toute collision avec
   Tailwind et les tokens shadcn (qui sont en HSL).
   ============================================================= */\n\n`;

fs.writeFileSync(OUT, header + out + '\n', 'utf8');

// Garde-fou : les accolades doivent être équilibrées
const opens = (out.match(/\{/g) || []).length;
const closes = (out.match(/\}/g) || []).length;

console.log(`OK -> ${OUT}`);
console.log(`  fichiers maquette : ${files.length}`);
console.log(`  règles CSS        : ${chunks.length}`);
console.log(`  variables         : ${varNames.size}`);
console.log(`  classes           : ${classNames.size}`);
console.log(`  dérives ignorées  : ${overridden.size} (index.html fait foi)`);
console.log(`  accolades         : ${opens} ouvrantes / ${closes} fermantes ${opens === closes ? '✓' : '✗ DÉSÉQUILIBRE'}`);
if (opens !== closes) process.exit(1);
