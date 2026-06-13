/**
 * Plik: scripts/generate-icons.mjs
 * Cel: Generowanie ikon PWA (Android/iOS) oraz favicon z bazowego SVG przy użyciu
 *      sharp. Tworzy ikony zwykłe i maskable we wszystkich wymaganych rozmiarach.
 * Użycie: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'public', 'icons');
const BRAND = '#0f172a';

// Logo: ciemne, zaokrąglone tło + biała litera „A" (ApkaFirmowa).
function logoSvg(size, maskable = false) {
  const pad = maskable ? size * 0.1 : 0; // strefa bezpieczeństwa dla maskable
  const inner = size - pad * 2;
  const radius = maskable ? size * 0.18 : size * 0.22;
  const fontSize = inner * 0.6;
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${maskable ? BRAND : 'none'}"/>
  <rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" rx="${radius}" fill="${BRAND}"/>
  <text x="50%" y="50%" dy="0.35em" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="700"
        font-size="${fontSize}" fill="#ffffff">A</text>
</svg>`;
}

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function main() {
  await mkdir(OUT, { recursive: true });

  for (const size of SIZES) {
    await sharp(Buffer.from(logoSvg(size)))
      .png()
      .toFile(join(OUT, `icon-${size}.png`));
  }

  // Maskable (Android adaptive) — 192 i 512.
  for (const size of [192, 512]) {
    await sharp(Buffer.from(logoSvg(size, true)))
      .png()
      .toFile(join(OUT, `maskable-${size}.png`));
  }

  // Apple touch icon (180) — bez przezroczystości.
  await sharp(Buffer.from(logoSvg(180, true)))
    .png()
    .toFile(join(OUT, 'apple-touch-icon.png'));

  // Favicony.
  await sharp(Buffer.from(logoSvg(32)))
    .png()
    .toFile(join(process.cwd(), 'public', 'favicon-32.png'));
  await sharp(Buffer.from(logoSvg(16)))
    .png()
    .toFile(join(process.cwd(), 'public', 'favicon-16.png'));

  // Prosty splash (iOS) — wyśrodkowane logo na ciemnym tle.
  const splash = (w, h) => `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="${BRAND}"/>
  <text x="50%" y="50%" dy="0.35em" text-anchor="middle"
        font-family="Arial" font-weight="700" font-size="${Math.min(w, h) * 0.2}"
        fill="#ffffff">A</text>
</svg>`;
  await mkdir(join(OUT, 'splash'), { recursive: true });
  await sharp(Buffer.from(splash(1170, 2532)))
    .png()
    .toFile(join(OUT, 'splash', 'iphone.png'));

  await writeFile(
    join(OUT, 'README.txt'),
    'Ikony generowane skryptem scripts/generate-icons.mjs (node scripts/generate-icons.mjs).\n',
  );

  console.log('✅ Wygenerowano ikony PWA w public/icons');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
