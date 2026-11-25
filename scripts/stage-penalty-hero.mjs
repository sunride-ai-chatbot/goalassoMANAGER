// Assemble the pinned standalone game into the Pages artifact, not into the manager source.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function stagePenaltyHero(source, siteRoot) {
  source = path.resolve(source);
  siteRoot = path.resolve(siteRoot);
  const release = JSON.parse(fs.readFileSync(path.join(root, 'data/config/penalty-hero-release.json'), 'utf8'));
  const destination = path.join(siteRoot, release.entry);
  if (siteRoot === root || source === destination || source.startsWith(destination + path.sep)) throw Error('Use a separate build output directory');
  const index = fs.readFileSync(path.join(source, 'index.html'), 'utf8');
  const version = fs.readFileSync(path.join(source, 'src/version.js'), 'utf8');
  const sw = fs.readFileSync(path.join(source, 'sw.js'), 'utf8');
  const manifest = JSON.parse(fs.readFileSync(path.join(source, 'app.webmanifest'), 'utf8'));
  if (/<iframe\b/i.test(index) || !index.includes('src/main.js')) throw Error('Expected the standalone Penalty Hero build');
  if (!version.includes(`VERSION='${release.version}'`) || !sw.includes(`VERSION='${release.version}'`)) throw Error('Penalty Hero version differs from the pinned release');
  if (manifest.start_url !== './' || manifest.scope !== './') throw Error('Penalty Hero must launch within its own folder');
  for (const file of ['src/main.js', 'src/data/catalog.js', 'data/catalog.json', 'config/network.json', 'assets/penalty-intro.mp4', 'assets/penalty-crest.webp', 'assets/penalties29/demo3d/penalty.js', 'assets/penalties29/motions/clips.json', ...manifest.icons.map(icon => icon.src)]) {
    if (!fs.existsSync(path.join(source, file))) throw Error('Missing standalone game file: ' + file);
  }
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  fs.rmSync(destination, {recursive: true, force: true});
  fs.cpSync(source, destination, {recursive: true});
  fs.writeFileSync(path.join(destination, 'integration.json'), JSON.stringify(release, null, 2) + '\n');
  console.log(`Penalty Hero ${release.version} (${release.commit.slice(0, 7)}) staged at ${destination}`);
  return destination;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 4) throw Error('Usage: node scripts/stage-penalty-hero.mjs <penalty-hero/dist> <site-output>');
  stagePenaltyHero(process.argv[2], process.argv[3]);
}
