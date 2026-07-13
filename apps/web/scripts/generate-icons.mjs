/**
 * Génère les icônes PWA pour GESTMONEY
 * Usage : node apps/web/scripts/generate-icons.mjs
 * Nécessite : sharp (pnpm add -D sharp --filter @gestmoney/web)
 */
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dir, '../public');
const iconsDir = resolve(publicDir, 'icons');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function main() {
  // Essayer sharp si disponible
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.log('sharp non disponible — génération des icônes SVG inline comme fallback PNG');
    generateSvgFallback();
    return;
  }

  mkdirSync(iconsDir, { recursive: true });

  const svgPath = resolve(publicDir, 'favicon.svg');
  const svgBuffer = readFileSync(svgPath);

  for (const size of SIZES) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(resolve(iconsDir, `icon-${size}x${size}.png`));
    console.log(`✅ icon-${size}x${size}.png`);
  }
  console.log(`\n🎉 ${SIZES.length} icônes générées dans public/icons/`);
}

function generateSvgFallback() {
  // Créer des icônes SVG renommées en .png dans l'attente de sharp
  mkdirSync(iconsDir, { recursive: true });
  const svgPath = resolve(publicDir, 'favicon.svg');
  const svgContent = readFileSync(svgPath, 'utf-8');
  for (const size of SIZES) {
    // Écrire le SVG avec viewBox ajusté
    const svg = svgContent.replace('<svg ', `<svg width="${size}" height="${size}" `);
    writeFileSync(resolve(iconsDir, `icon-${size}x${size}.svg`), svg);
    console.log(`✅ icon-${size}x${size}.svg (fallback — remplacer par .png en prod)`);
  }
}

main().catch(console.error);
