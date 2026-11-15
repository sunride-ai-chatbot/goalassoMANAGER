// A squad entry on Wikipedia is wikitext, and a template in the name field IS the name:
// {{ill|Mees Eppink|nl}} is a player with no English article, {{abbr|Sapata|Vitor Hugo…}} a short name and its
// long form. The fetch script used to delete the template instead of reading it, so sixteen players shipped
// called "{{ill|Mees Eppink|nl" — their own name, on the pitch, in the squad list and in the market.
// Nothing with wikitext in it is a name, so nothing with wikitext in it ships.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const errs=[];
const MARKUP=/\{\{|\}\}|\[\[|\]\]|<!--|<[a-z/][^>]*>|\|/i;

try{
 const files=[];
 for(const dir of ['data','data/euro'])
  for(const f of fs.readdirSync(path.join(root,dir)))
   if(f.endsWith('.json'))files.push(path.join(dir,f));
 let players=0;const bad=[];
 for(const rel of files){
  let d;try{d=JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'))}catch(e){continue}
  const ps=Array.isArray(d)?d:d&&d.players;
  if(!Array.isArray(ps))continue;
  for(const p of ps){
   if(!p||typeof p!=='object')continue;
   players++;
   for(const k of ['en','he'])
    if(typeof p[k]==='string'&&MARKUP.test(p[k]))bad.push(`${rel} ${k}=${JSON.stringify(p[k])}`);
  }
 }
 assert.ok(players>5000,`every shipped squad was read (${players} players)`);
 assert.deepEqual(bad,[],'no player name carries wikitext');

 // and the same holds for the data the build embeds, which is what the game actually reads
 const html=fs.readFileSync(path.join(root,'ligat-haal-manager.html'),'utf8');
 for(const m of ['{{ill|','{{abbr|','{{sortname|','<!-- {{'])
  assert.ok(!html.includes(m),`the built game carries no ${m} in its data`);

 // the cleaner is the one the fetch uses, at every place a display name is settled
 const fetch=fs.readFileSync(path.join(root,'scripts/fetch-wikidata-squads.py'),'utf8');
 assert.ok(/def clean_name\(/.test(fetch),'the fetch script has one cleaner');
 assert.ok(!/re\.sub\(r'<\[\^>\]\+>\|\\\{\\\{\[\^\}\]\*\\\}\\\}', '', name\)/.test(fetch),'and no longer deletes the template it should be reading');
 assert.equal((fetch.match(/clean_name\(/g)||[]).length>=4,true,'every display name goes through it');
 console.log(`squad names: ${players} players read, 0 with wikitext`);
}catch(e){errs.push(e.message)}
console.log('errs',errs);
process.exit(errs.length?1:0);
