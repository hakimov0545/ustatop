import { getCollection } from '../../db/index.js';

const rules=[
  {category:'Maishiy texnika',words:['стираль','стиралк','washing machine','kir yuvish','muzlatgich','холодиль','konditsioner','кондиционер','televizor','телевизор','посудомо']},
  {category:'Santexnik',words:['kran','смесител','suv oq','вода','truba','труба','quvur','канализац','rakovina','раковин','unitaz','унитаз','santex']},
  {category:'Elektrik',words:['elektr','электр','rozetka','розет','chiroq','свет','провод','sim uz','lampoch','лампоч']},
  {category:'Qulf ustasi',words:['qulf','замок','kalit','ключ','eshik och','дверь']},
  {category:'Tozalash',words:['tozalash','уборк','cleaning','gilam','ковер']},
  {category:'Ta’mirlash',words:['ремонт','ta’mir','tamir','bo‘yoq','boyoq','plitka','плитка','devor','стен','shift','pol']},
];
export async function categories(){return (await getCollection('categories')).find().sort({id:1}).project({_id:0,id:1,name:1,icon:1}).toArray();}
export async function suggest(text){
  const input=String(text||'').toLocaleLowerCase('uz').replaceAll('ё','е');
  const tokens=input.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const containsTerm=word=>{const parts=word.split(/[^\p{L}\p{N}]+/u).filter(Boolean);return parts.length>0&&tokens.some((_,start)=>parts.every((part,index)=>tokens[start+index]?.startsWith(part)));};
  const ranked=rules.map(rule=>({name:rule.category,score:rule.words.reduce((score,word)=>score+(containsTerm(word)?1:0),0)})).sort((a,b)=>b.score-a.score);
  const matched=ranked[0]?.score>0?ranked.filter(item=>item.score>0):[];
  const rows=await categories();
  return {suggestions:matched.map(item=>rows.find(category=>category.name===item.name)).filter(Boolean),confidence:matched.length?Math.min(0.98,0.62+ranked[0].score*0.12):0};
}
