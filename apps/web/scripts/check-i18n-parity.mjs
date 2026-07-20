// Contrôle de parité des clés entre fr.ts et en.ts.
// Usage : node scripts/check-i18n-parity.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, '..', 'src', 'lib', 'i18n');

/** Extrait l'objet littéral d'un fichier de dictionnaire et l'évalue. */
function charger(fichier, nomExport) {
  const source = readFileSync(resolve(racine, fichier), 'utf8');
  const debut = source.indexOf(`export const ${nomExport}`);
  if (debut === -1) throw new Error(`export ${nomExport} introuvable dans ${fichier}`);
  const ouvrante = source.indexOf('{', debut);
  let profondeur = 0;
  let fin = -1;
  for (let i = ouvrante; i < source.length; i++) {
    const c = source[i];
    if (c === '{') profondeur++;
    else if (c === '}') {
      profondeur--;
      if (profondeur === 0) { fin = i; break; }
    }
  }
  if (fin === -1) throw new Error(`objet non terminé dans ${fichier}`);
  const litteral = source.slice(ouvrante, fin + 1);
  // eslint-disable-next-line no-new-func
  return new Function(`return (${litteral});`)();
}

/** Chemins de toutes les feuilles de l'objet. */
function chemins(objet, prefixe = '') {
  const sortie = [];
  for (const [cle, valeur] of Object.entries(objet)) {
    const chemin = prefixe ? `${prefixe}.${cle}` : cle;
    if (valeur && typeof valeur === 'object' && !Array.isArray(valeur)) {
      sortie.push(...chemins(valeur, chemin));
    } else {
      sortie.push(chemin);
    }
  }
  return sortie.sort();
}

const fr = charger('fr.ts', 'fr');
const en = charger('en.ts', 'en');

const clesFr = chemins(fr);
const clesEn = chemins(en);

const manquantesEn = clesFr.filter((k) => !clesEn.includes(k));
const manquantesFr = clesEn.filter((k) => !clesFr.includes(k));

console.log(`fr.ts : ${clesFr.length} clés`);
console.log(`en.ts : ${clesEn.length} clés`);

if (manquantesEn.length === 0 && manquantesFr.length === 0) {
  console.log('OK — les deux dictionnaires ont exactement les mêmes clés.');
  process.exit(0);
}

if (manquantesEn.length) console.error(`\nAbsentes de en.ts (${manquantesEn.length}) :\n  ${manquantesEn.join('\n  ')}`);
if (manquantesFr.length) console.error(`\nAbsentes de fr.ts (${manquantesFr.length}) :\n  ${manquantesFr.join('\n  ')}`);
process.exit(1);
