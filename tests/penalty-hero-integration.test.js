const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const os = require('node:os');
const {pathToFileURL} = require('node:url');
const root = path.resolve(__dirname, '..');
const release = JSON.parse(fs.readFileSync(path.join(root, 'data/config/penalty-hero-release.json')));
const source = fs.readFileSync(path.join(root, 'assets/penalty-hero-entry.js'), 'utf8');

function boot(href, extra = {}) {
  const events = {}, visits = [], context = {
    URL, console, location: {href, replace: u => visits.push(['replace', u]), assign: u => visits.push(['assign', u])},
    document: {addEventListener: (name, fn, capture) => {events[name] = fn;assert.equal(capture, true)}}, ...extra
  };
  vm.runInNewContext(source, context);
  return {events, visits};
}
const click = match => ({button: 0, target: {closest: selector => match ? {} : null}, preventDefault() {}, stopImmediatePropagation() {}});

(async () => {
  for (const base of ['https://goal-m.com/', 'https://goal-m.com/beginner.html', 'https://sunride-ai-chatbot.github.io/goalassoMANAGER/index.html']) {
    const {visits} = boot(base + '?pen=JPN4AP');
    const url = new URL(visits[0][1]);
    assert.equal(url.origin, new URL(base).origin);
    assert.equal(url.pathname, base.includes('/goalassoMANAGER/') ? '/goalassoMANAGER/assets/penalties/' : '/assets/penalties/');
    assert.equal(url.searchParams.get('room'), 'JPN4AP');
    assert.equal(url.searchParams.has('pen'), false);
  }
  assert.equal(boot('https://goal-m.com/?pen').visits[0][1], 'https://goal-m.com/assets/penalties/');
  assert.equal(boot('https://goal-m.com/?join=ABCD').visits.length, 0, 'career room links are preserved');
  let saved = false;
  const open = boot('https://goal-m.com/beginner.html', {G: {beginner: true}, Bwrite: async () => {saved = true}});
  await open.events.click(click(true));
  assert.equal(saved, true);assert.equal(open.visits[0][1], 'https://goal-m.com/assets/penalties/');
  await open.events.click(click(true));assert.equal(open.visits.length, 1, 'double tap opens once');
  const training = boot('https://goal-m.com/beginner.html');
  await training.events.click(click(false));assert.equal(training.visits.length, 0, 'career training stays in the manager');
  const active = boot('https://goal-m.com/', {G: {live: {settled: false}}, toast() {}});
  await active.events.click(click(true));assert.equal(active.visits.length, 0, 'do not abandon a live career match');
  const failure = boot('https://goal-m.com/', {G: {}, save: async () => {throw Error('disk')}, console: {warn() {}}, toast() {}});
  await failure.events.click(click(true));assert.equal(failure.visits.length, 0, 'failed save does not navigate away');
  assert.ok(fs.readFileSync(path.join(root, 'src/index.html'), 'utf8').includes('assets/penalty-hero-entry.js'));
  assert.ok(fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8').includes('ref: ' + release.commit));

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'penalty-stage-'));
  try {
    const input = path.join(temp, 'dist'), output = path.join(temp, 'site');
    const files = {
      'index.html': '<script type="module" src="src/main.js"></script>',
      'src/version.js': `export const VERSION='${release.version}';`,
      'sw.js': `const VERSION='${release.version}';`,
      'app.webmanifest': JSON.stringify({start_url: './', scope: './', icons: [{src: 'assets/icon.png'}]}),
      'assets/icon.png': 'image', 'src/main.js': '// main', 'src/data/catalog.js': '// catalog',
      'data/catalog.json': '{}', 'config/network.json': '{}', 'assets/penalty-intro.mp4': 'video',
      'assets/penalty-crest.webp': 'logo', 'assets/penalties29/demo3d/penalty.js': '// view',
      'assets/penalties29/motions/clips.json': '{}'
    };
    for (const [name, data] of Object.entries(files)) {const p = path.join(input, name);fs.mkdirSync(path.dirname(p), {recursive: true});fs.writeFileSync(p, data)}
    const {stagePenaltyHero} = await import(pathToFileURL(path.join(root, 'scripts/stage-penalty-hero.mjs')));
    const destination = stagePenaltyHero(input, output);
    assert.equal(fs.readFileSync(path.join(destination, 'src/main.js'), 'utf8'), '// main');
    assert.equal(JSON.parse(fs.readFileSync(path.join(destination, 'integration.json'))).commit, release.commit);
    fs.writeFileSync(path.join(input, 'index.html'), '<iframe></iframe>');
    assert.throws(() => stagePenaltyHero(input, output), /standalone/);
    assert.ok(fs.existsSync(path.join(destination, 'src/main.js')), 'validation precedes replacement of a working build');
  } finally {fs.rmSync(temp, {recursive: true, force: true})}
  console.log('Penalty Hero integration: same-origin routes, invite codes, saved career, pinned standalone build and PWA scope passed.');
})().catch(error => {console.error(error);process.exitCode = 1});
