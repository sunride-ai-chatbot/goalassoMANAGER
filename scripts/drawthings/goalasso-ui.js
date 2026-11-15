//@api-1.0
// GOALASSO — interface art for the manager game: chunky glossy 3D icons on pure black (the black is turned into
// transparency afterwards, from luminance: scripts/cut-ui-icons.py) and two night-arena backdrops.
// Objects, places and light only: no faces, no lettering, no real club's badge.
// It runs inside Draw Things (Scripts panel) on the owner's Mac; this copy is the record of what made assets/ui.
const ICON = "premium mobile football game interface icon, one single object perfectly centred with generous " +
  "empty margin around it, chunky glossy 3D render, polished materials, emerald neon green rim light, warm gold " +
  "accents, soft bloom glow, pure solid black background, studio product lighting, crisp, highly detailed, " +
  "no text, no letters, no numbers, no logo";
const SCENE = "cinematic night football arena, deep black and navy, emerald green neon haze, warm gold floodlight " +
  "kicker, wet reflections, shallow depth of field, the bottom third fading to pure black, vertical composition, " +
  "no people, no text, no letters, no logos";
const NEG = "text, letters, words, numbers, logos, watermark, signature, faces, people, white background, " +
  "grey background, flat vector, cartoon, clutter, multiple objects";
const ICONS = [
  ["stadium", "a miniature football stadium bowl seen from a three-quarter view from above, four floodlight towers shining, a glowing green pitch inside"],
  ["shirt", "a football jersey shirt seen from the front, glossy emerald green fabric with gold collar and gold sleeve trim, completely blank"],
  ["trophy", "a tall golden trophy cup with two handles on a small dark base, mirror polished gold, emerald glow behind it"],
  ["transfer", "two chunky curved arrows chasing each other in a circle around a small football, one arrow emerald neon green and the other arrow polished gold"],
  ["whistle", "a chrome referee whistle on a short cord, seen from the side, mirror polished metal with an emerald neon glow"],
  ["coins", "a neat stack of thick gold coins with one coin leaning against the stack, a plain star embossed on the coin"],
  ["tactics", "a glossy tactics board showing a miniature green football pitch with white lines and five glowing round magnets"],
  ["boot", "a golden football boot with studs seen from the side, polished, emerald neon rim light"],
  ["ball", "a classic black and white football inside a glowing emerald neon energy ring"],
  ["shield", "an empty heraldic shield made of polished gold metal with a dark glass centre and an emerald neon inner edge"],
  ["bell", "a polished gold bell with a small emerald glowing gem"],
  ["gear", "a chunky chrome cog wheel with an emerald neon ring in its centre"]];
const SCENES = [
  ["tunnel", "looking out from inside a dark players' tunnel toward a brightly floodlit football pitch, emerald neon light strips running along both tunnel walls, the bright pitch and stands in the upper half of the frame"],
  ["pitch", "a floodlit football stadium at night seen from the centre circle at grass level, wet grass, floodlight beams cutting through emerald haze, the dark stands full of tiny bokeh lights in the upper half"]];
const configuration = pipeline.configuration;
const KLEIN = "flux_2_klein_4b_i8x.ckpt";
if (configuration.model !== KLEIN) { configuration.model = KLEIN; configuration.steps = 4; configuration.guidanceScale = 1; }
configuration.loras = [];
configuration.strength = 1;
// every picture starts from an empty canvas: with an image on it this model edits that image instead
function blank() { try { canvas.clear(); } catch (e) { console.log("clear: " + e); } try { canvas.clearMoodboard(); } catch (e) {} }
configuration.batchSize = 1; configuration.batchCount = 1;
let n = 0;
const total = ICONS.length * 2 + SCENES.length * 2;
for (let take = 0; take < 2; take++) {
  configuration.width = 768; configuration.height = 768;
  for (const [name, what] of ICONS) {
    configuration.seed = -1; n++;
    console.log(n + "/" + total + " " + name);
    blank();
    pipeline.run({configuration: configuration, prompt: what + ", " + ICON, negativePrompt: NEG});
  }
  configuration.width = 832; configuration.height = 1216;
  for (const [name, what] of SCENES) {
    configuration.seed = -1; n++;
    console.log(n + "/" + total + " " + name);
    blank();
    pipeline.run({configuration: configuration, prompt: what + ", " + SCENE, negativePrompt: NEG});
  }
}
console.log("done");
