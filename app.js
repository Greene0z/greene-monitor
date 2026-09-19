import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const C = window.GREENE_CONFIG || {};
const validConfig = C.SUPABASE_URL?.startsWith("https://") && !C.SUPABASE_ANON_KEY?.startsWith("COLE_");
const sb = validConfig ? createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY) : null;
const $ = (s) => document.querySelector(s);
const today = () => { const d=new Date(), off=d.getTimezoneOffset(); return new Date(d.getTime()-off*60000).toISOString().slice(0,10); };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const avg = (a) => a.length ? a.reduce((x,y)=>x+(+y||0),0)/a.length : null;
const fmt1 = (n) => Number.isFinite(n) ? n.toFixed(1) : "—";
const stateKey = {
  daily_entries:"daily", sleep_entries:"sleep", habits:"habits", habit_logs:"habit_logs", books:"books",
  studies:"studies", goals:"goals", reading_logs:"reading_logs", exercise_logs:"exercise_logs",
  journal_entries:"journal_entries", notes:"notes", note_attachments:"note_attachments",
  note_folders:"note_folders", note_templates:"note_templates", note_relations:"note_relations"
};
const defaultCards = ["week","sleep","habits","reading","study","goals","rpg"];

let S = {
  user:null, view:"today", selected:today(), selectedNote:null, notePreview:false, noteFilter:"all",
  daily:[], sleep:[], habits:[], habit_logs:[], books:[], studies:[], goals:[], reading_logs:[], exercise_logs:[], journal_entries:[],
  notes:[], note_attachments:[], note_folders:[], note_templates:[], note_relations:[], noteContent:{}, backlinks:[],
  profile:null, gameProfile:null, gameInventory:[], gameAchievements:[], gameQuests:[], gameQuestProgress:[], gameItems:[], achievementDefs:[], achievementProgress:[], gameStats:{},
  rpgTab:"overview", notesPage:0, notesHasMore:false,
  analyticsRange:30, analyticsCustomStart:"", analyticsCustomEnd:"", analytics:null,
  loadedMonths:new Set(),
};

const nav = [
  ["CORE"], ["today","⌂ Hoje"], ["calendar","▦ Calendário"], ["habits","✓ Hábitos"], ["notes","▤ Notas"],
  ["ACOMPANHAMENTO"], ["books","▥ Leituras"], ["studies","◷ Estudos"], ["goals","◎ Objetivos"],
  ["RPG"], ["rpg","✦ Personagem"],
  ["ANÁLISE"], ["analysis","⌁ Análises"], ["settings","⚙ Configurações"]
];
$("#desktopNav").innerHTML = nav.map(x => x.length===1 ? `<div class="nav-group">${x[0]}</div>` : `<button class="nav" data-go="${x[0]}">${x[1]}</button>`).join("");
$("#mobileNav").innerHTML = [
  ["today","⌂","Hoje"], ["calendar","▦","Calendário"], ["palette","+",""] , ["notes","▤","Notas"], ["analysis","⌁","Análises"]
].map(x => x[0]==="palette" ? `<button class="mobile plus" data-palette>＋</button>` : `<button class="mobile" data-go="${x[0]}">${x[1]}<br>${x[2]}</button>`).join("");
$("#dateText").textContent = new Date().toLocaleDateString("pt-BR", {weekday:"long", day:"numeric", month:"long"});

document.documentElement.dataset.theme = localStorage.getItem("greene-theme") || "light";
document.documentElement.dataset.accent = localStorage.getItem("greene-accent") || "sage";
const rememberedName = localStorage.getItem("greene-app-name");
if (rememberedName) { $("#loginBrand").textContent = rememberedName; $("#loginLogo").textContent = rememberedName[0]?.toUpperCase() || "G"; }

function toast(message, ms=1800){
  const el=$("#toast"); el.textContent=message; el.style.display="block";
  clearTimeout(toast._t); toast._t=setTimeout(()=>el.style.display="none",ms);
}
function skeleton(){ $("#content").innerHTML = `<div class="skeleton-grid"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>`; }
function toDate(s){ return new Date(s + "T12:00:00"); }
function iso(d){d=new Date(d);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function addDays(date, n){ const d=typeof date==="string"?toDate(date):new Date(date); d.setDate(d.getDate()+n); return iso(d); }
function daysBetween(a,b){ return Math.round((toDate(b)-toDate(a))/86400000)+1; }
function startOfWeek(date=today()){ const d=toDate(date), day=d.getDay(); d.setDate(d.getDate()-((day+6)%7)); return iso(d); }
function startOfMonth(date=today()){ const d=toDate(date); d.setDate(1); return iso(d); }
function monthEnd(date){ const d=toDate(date); return iso(new Date(d.getFullYear(),d.getMonth()+1,0,12)); }
function monthKey(d){ d=typeof d==="string"?toDate(d):d; return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function hours(x){
  if(!x?.bed_time||!x?.wake_time) return 0;
  const [a,b]=x.bed_time.split(":").map(Number), [c,d]=x.wake_time.split(":").map(Number);
  let m=c*60+d-a*60-b; return (m<=0?m+1440:m)/60;
}
function mergeRows(key, rows){
  const map=new Map((S[key]||[]).map(r=>[r.id,r])); rows.forEach(r=>map.set(r.id,r));
  S[key]=[...map.values()].sort((a,b)=>String(b.date||b.updated_at||b.created_at||"").localeCompare(String(a.date||a.updated_at||a.created_at||"")));
}
function dataOf(date){
  return {
    d:S.daily.find(x=>x.date===date), s:S.sleep.find(x=>x.date===date),
    h:S.habit_logs.filter(x=>x.date===date&&x.completed), r:S.reading_logs.filter(x=>x.date===date),
    st:S.studies.filter(x=>x.date===date), e:S.exercise_logs.filter(x=>x.date===date), j:S.journal_entries.find(x=>x.date===date)
  };
}
function rate(name,v=3){
  return `<input type="hidden" name="${name}" value="${v}"><div class="ratings">${[1,2,3,4,5].map(i=>`<button type="button" class="rating-btn ${+v===i?"on":""}" data-rate="${name}" data-v="${i}">${i}</button>`).join("")}</div>`;
}
function applyProfile(){
  const p=S.profile||{}, name=(p.app_name||"Greene").trim()||"Greene", initial=name[0]?.toUpperCase()||"G";
  $("#brandName").textContent=name; $("#brandLogo").textContent=initial; $("#loginBrand").textContent=name; $("#loginLogo").textContent=initial;
  document.title=`${name} Monitor`; localStorage.setItem("greene-app-name",name);
  document.documentElement.dataset.accent=p.accent||"sage"; localStorage.setItem("greene-accent",p.accent||"sage");
}
async function fetchPaged(table, configure=(q)=>q, select="*"){
  const page=1000, out=[];
  for(let from=0; from<20000; from+=page){
    let q=sb.from(table).select(select); q=configure(q).range(from,from+page-1);
    const {data,error}=await q; if(error) throw error; out.push(...(data||[])); if((data||[]).length<page) break;
  }
  return out;
}
async function ensureProfile(){
  let {data:p,error}=await sb.from("profiles").select("*").eq("user_id",S.user.id).maybeSingle();
  if(error) throw error;
  if(!p){
    const display=S.user.email?.split("@")[0]||"";
    const r=await sb.from("profiles").insert({user_id:S.user.id,display_name:display}).select().single(); if(r.error) throw r.error; p=r.data;
  }
  S.profile=p;
  let {data:g,error:ge}=await sb.from("game_profiles").select("*").eq("user_id",S.user.id).maybeSingle(); if(ge) throw ge;
  if(!g){ const r=await sb.from("game_profiles").insert({user_id:S.user.id,character_name:p.display_name||"Aventureiro",presentation:"neutral"}).select().single(); if(r.error) throw r.error; g=r.data; }
  S.gameProfile=g; applyProfile();
}
async function loadNotes(reset=true){
  const size=60; if(reset){S.notesPage=0;S.notes=[];} const from=S.notesPage*size;
  const {data,error}=await sb.from("notes").select("id,user_id,title,tags,is_favorite,folder_id,note_type,linked_date,created_at,updated_at").order("updated_at",{ascending:false}).range(from,from+size-1);
  if(error) throw error; const rows=data||[]; S.notes=reset?rows:[...S.notes,...rows.filter(r=>!S.notes.some(n=>n.id===r.id))]; S.notesHasMore=rows.length===size;
}
async function ensureDefaultTemplates(){
  if(S.note_templates.length) return;
  const defaults=[
    {name:"Nota diária",content:`# {{date}}\n\n## Hoje\n\n## Ideias\n\n## Aprendizados\n\n## Pendências\n`,tags:["diário"]},
    {name:"Aula / Estudo",content:`# {{title}}\n\nData: {{date}}\n\n## Assunto\n\n## Conceitos\n\n## Dúvidas\n\n## Resumo\n\n## Próximos passos\n`,tags:["estudo"]},
    {name:"Projeto",content:`# {{title}}\n\n## Objetivo\n\n## Contexto\n\n## Próximas ações\n- [ ] \n\n## Notas\n`,tags:["projeto"]}
  ];
  const rows=defaults.map(x=>({...x,user_id:S.user.id})); const {data,error}=await sb.from("note_templates").insert(rows).select(); if(!error)S.note_templates=data||[];
}
async function load(){
  await ensureProfile();
  const cutoff=addDays(today(),-180);
  const dateDefs=[["daily_entries","daily"],["sleep_entries","sleep"],["habit_logs","habit_logs"],["studies","studies"],["reading_logs","reading_logs"],["exercise_logs","exercise_logs"],["journal_entries","journal_entries"]];
  const structural=[
    sb.from("habits").select("*").order("created_at",{ascending:false}),
    sb.from("books").select("*").order("created_at",{ascending:false}),
    sb.from("goals").select("*").order("date",{ascending:false}),
    sb.from("note_folders").select("*").order("name"),
    sb.from("note_templates").select("*").order("updated_at",{ascending:false}),
    sb.from("note_relations").select("*").order("created_at",{ascending:false})
  ];
  const [dateResults,structResults]=await Promise.all([
    Promise.all(dateDefs.map(([t])=>fetchPaged(t,q=>q.gte("date",cutoff).order("date",{ascending:false})))),
    Promise.all(structural)
  ]);
  dateResults.forEach((rows,i)=>S[dateDefs[i][1]]=rows||[]);
  const structKeys=["habits","books","goals","note_folders","note_templates","note_relations"];
  structResults.forEach((r,i)=>{if(!r.error)S[structKeys[i]]=r.data||[]});
  await loadNotes(true); await ensureDefaultTemplates();
  if(S.profile?.gamification_enabled!==false) await syncGame(true);
  S.loadedMonths.add(monthKey(today()));
}
async function ensureMonth(date){
  const key=monthKey(date); if(S.loadedMonths.has(key)) return;
  const start=`${key}-01`, end=monthEnd(start),defs=[["daily_entries","daily"],["sleep_entries","sleep"],["habit_logs","habit_logs"],["studies","studies"],["reading_logs","reading_logs"],["exercise_logs","exercise_logs"],["journal_entries","journal_entries"]];
  const res=await Promise.all(defs.map(([t])=>fetchPaged(t,q=>q.gte("date",start).lte("date",end).order("date",{ascending:false}))));
  res.forEach((rows,i)=>mergeRows(defs[i][1],rows||[])); S.loadedMonths.add(key);
}
async function ensureAutoGoalData(){
  const autos=S.goals.filter(g=>g.auto_track);if(!autos.length)return;
  const oldest=autos.map(g=>g.start_date||g.date||today()).sort()[0],cutoff=addDays(today(),-180);if(oldest>=cutoff)return;
  const defs=[["habit_logs","habit_logs"],["studies","studies"],["reading_logs","reading_logs"],["exercise_logs","exercise_logs"]];
  const res=await Promise.all(defs.map(([t])=>fetchPaged(t,q=>q.gte("date",oldest).lte("date",today()).order("date",{ascending:false}))));res.forEach((rows,i)=>mergeRows(defs[i][1],rows||[]));
}
async function insertLocal(table,payload){
  const {data,error}=await sb.from(table).insert({...payload,user_id:S.user.id}).select().single();
  if(error){toast(error.message);return null;} const key=stateKey[table]; if(key)mergeRows(key,[data]); if(["daily_entries","sleep_entries","habit_logs","books","studies","goals","reading_logs","exercise_logs","journal_entries"].includes(table))scheduleGameSync(); toast("Salvo"); return data;
}
async function upsertDateLocal(table,payload){
  const {data,error}=await sb.from(table).upsert({...payload,user_id:S.user.id},{onConflict:"user_id,date"}).select().single();
  if(error){toast(error.message);return null;} const key=stateKey[table]; if(key)mergeRows(key,[data]); if(["daily_entries","sleep_entries","journal_entries"].includes(table))scheduleGameSync(); render(); toast("Salvo"); return data;
}
async function deleteLocal(table,id,ask=true){
  if(ask&&!confirm("Excluir este registro?")) return false;
  const {error}=await sb.from(table).delete().eq("id",id); if(error){toast(error.message);return false;}
  const key=stateKey[table]; if(key)S[key]=S[key].filter(x=>x.id!==id); if(["daily_entries","sleep_entries","habit_logs","books","studies","goals","reading_logs","exercise_logs","journal_entries"].includes(table))scheduleGameSync(); render(); return true;
}
function habitDone(hid,date){return S.habit_logs.some(x=>x.habit_id===hid&&x.date===date&&x.completed)}
function habitStats(h){
  const logs=S.habit_logs.filter(x=>x.habit_id===h.id&&x.completed).map(x=>x.date).sort(), set=new Set(logs);
  let d=toDate(today()),streak=0;
  for(let i=0;i<5000;i++){const ds=iso(d);if(set.has(ds)){streak++;d.setDate(d.getDate()-1)}else if(i===0){d.setDate(d.getDate()-1)}else break}
  let best=0,cur=0,prev=null;
  for(const ds of logs){const dd=toDate(ds);if(prev&&Math.round((dd-prev)/86400000)===1)cur++;else cur=1;best=Math.max(best,cur);prev=dd}
  const mk=monthKey(S.selected),monthCount=logs.filter(x=>x.startsWith(mk)).length,d0=toDate(S.selected),now=new Date();
  const elapsed=d0.getMonth()===now.getMonth()&&d0.getFullYear()===now.getFullYear()?now.getDate():new Date(d0.getFullYear(),d0.getMonth()+1,0).getDate();
  return {streak,best,monthCount,rate:elapsed?Math.round(monthCount/elapsed*100):0};
}


const avatarDefaults={skin:"warm",hair:"hair_short",hairColor:"brown",eyes:"dot",outfit:"outfit_tee",outfitColor:"sage",accessory:"none"};
const skinColors={light:"#f1c7a5",warm:"#d8a17d",tan:"#bc805d",brown:"#8b5a42",deep:"#5a382d"};
const hairColors={black:"#252321",brown:"#4a3428",chestnut:"#744733",blonde:"#c8a45a",copper:"#a95f3c",silver:"#9a9da0",blue:"#455f78",violet:"#685071"};
const outfitColors={sage:"#73866f",blue:"#5f7896",violet:"#7d6997",amber:"#987346",rose:"#966b72",charcoal:"#4d5350"};
const eyeColors={dot:"#282826",bright:"#344d5f",warm:"#694636"};
function avatarConfig(){return {...avatarDefaults,...(S.gameProfile?.avatar_config||{})}}
function inventorySet(){return new Set((S.gameInventory||[]).filter(x=>x.quantity>0).map(x=>x.item_key))}
function achievementSet(){return new Set((S.gameAchievements||[]).map(x=>x.achievement_key))}
function gameItem(key){return (S.gameItems||[]).find(x=>x.item_key===key)}
function canUseItem(key){
  if(!key||key==="none")return true;const item=gameItem(key);if(!item)return ["hair_short","outfit_tee"].includes(key);
  if(item.unlock_type==="starter")return true;
  if(item.unlock_type==="level")return (S.gameProfile?.level||1)>=Number(item.unlock_value||1);
  if(item.unlock_type==="achievement")return achievementSet().has(item.unlock_value)||inventorySet().has(key);
  if(item.unlock_type==="coins")return inventorySet().has(key);
  return false;
}
function unlockText(item){
  if(!item)return"";if(item.unlock_type==="starter")return"Inicial";
  if(item.unlock_type==="level")return`Nível ${item.unlock_value}`;
  if(item.unlock_type==="achievement"){const a=S.achievementDefs.find(x=>x.achievement_key===item.unlock_value);return a?`Conquista: ${a.name}`:"Conquista";}
  if(item.unlock_type==="coins")return inventorySet().has(item.item_key)?"Adquirido":`${item.price} moedas`;
  return"";
}
function xpFloor(level){return 50*Math.max(0,level-1)*level}
function xpInfo(){
  const xp=Number(S.gameProfile?.xp||0),level=Number(S.gameProfile?.level||1),floor=xpFloor(level),next=xpFloor(level+1),need=Math.max(1,next-floor),pct=Math.max(0,Math.min(100,Math.round((xp-floor)/need*100)));
  return{xp,level,floor,next,pct,inside:Math.max(0,xp-floor),needed:need};
}
function rankName(level){return level>=75?"Lendário":level>=50?"Guardião":level>=35?"Mestre":level>=20?"Especialista":level>=10?"Aventureiro":level>=5?"Aprendiz":"Novato"}
function attributeLevel(points){return Math.max(1,Math.min(99,Math.floor(Math.sqrt(Math.max(0,points)))+1))}
function gameAttributes(){
  const g=S.gameStats||{},pages=+g.reading_pages||0,study=+g.study_minutes||0,exercise=+g.exercise_minutes||0,habits=+g.habit_completions||0,notes=+g.notes_count||0,journal=+g.journal_count||0,goals=+g.goals_completed||0,books=+g.books_read||0;
  return[
    ["Conhecimento",attributeLevel(pages/35+study/25+books*4),"Leitura e estudo"],
    ["Consistência",attributeLevel(habits/2.5),"Hábitos concluídos"],
    ["Vitalidade",attributeLevel(exercise/18),"Exercício registrado"],
    ["Disciplina",attributeLevel(habits/5+goals*12),"Hábitos e objetivos"],
    ["Foco",attributeLevel(study/22+pages/120),"Estudo e leitura"],
    ["Reflexão",attributeLevel(notes*1.5+journal*3),"Notas e diário"]
  ];
}
function hairShape(style,c,outline){
  const common=`<rect x="10" y="6" width="12" height="3" fill="${outline}"/><rect x="9" y="8" width="14" height="4" fill="${outline}"/>`;
  if(style==="hair_bob")return`${common}<rect x="9" y="7" width="14" height="5" fill="${c}"/><rect x="8" y="10" width="3" height="9" fill="${c}"/><rect x="21" y="10" width="3" height="9" fill="${c}"/><rect x="11" y="6" width="10" height="3" fill="${c}"/>`;
  if(style==="hair_long")return`${common}<rect x="9" y="7" width="14" height="5" fill="${c}"/><rect x="8" y="10" width="3" height="14" fill="${c}"/><rect x="21" y="10" width="3" height="14" fill="${c}"/><rect x="11" y="6" width="10" height="3" fill="${c}"/>`;
  if(style==="hair_curls")return`<rect x="10" y="5" width="4" height="3" fill="${c}"/><rect x="14" y="4" width="5" height="4" fill="${c}"/><rect x="19" y="5" width="4" height="3" fill="${c}"/><rect x="8" y="8" width="5" height="5" fill="${c}"/><rect x="20" y="8" width="5" height="5" fill="${c}"/><rect x="9" y="12" width="3" height="6" fill="${c}"/><rect x="21" y="12" width="3" height="6" fill="${c}"/>`;
  if(style==="hair_ponytail")return`${common}<rect x="10" y="6" width="12" height="5" fill="${c}"/><rect x="21" y="8" width="4" height="4" fill="${c}"/><rect x="24" y="10" width="3" height="8" fill="${c}"/>`;
  if(style==="hair_spiky")return`<polygon points="9,10 10,5 13,7 15,3 18,7 21,4 22,8 24,7 23,12 9,12" fill="${c}"/>`;
  return`${common}<rect x="10" y="6" width="12" height="5" fill="${c}"/><rect x="9" y="9" width="4" height="4" fill="${c}"/>`;
}
function avatarSvg(config=avatarConfig(),cls=""){
  const c={...avatarDefaults,...config},skin=skinColors[c.skin]||skinColors.warm,hair=hairColors[c.hairColor]||hairColors.brown,outfit=outfitColors[c.outfitColor]||outfitColors.sage,eye=eyeColors[c.eyes]||eyeColors.dot,outline="#292724",pres=S.gameProfile?.presentation||"neutral";
  const torso=pres==="feminine"?`<polygon points="10,21 22,21 23,29 9,29" fill="${outline}"/><polygon points="11,22 21,22 22,28 10,28" fill="${outfit}"/>`:pres==="masculine"?`<rect x="8" y="21" width="16" height="9" fill="${outline}"/><rect x="9" y="22" width="14" height="7" fill="${outfit}"/>`:`<rect x="9" y="21" width="14" height="9" fill="${outline}"/><rect x="10" y="22" width="12" height="7" fill="${outfit}"/>`;
  let outfitExtra="";
  if(c.outfit==="outfit_hoodie")outfitExtra=`<rect x="13" y="22" width="6" height="2" fill="#d8d8d0"/><rect x="15" y="24" width="2" height="5" fill="#d8d8d0"/>`;
  if(c.outfit==="outfit_sweater")outfitExtra=`<rect x="10" y="24" width="12" height="2" fill="#ffffff" opacity=".2"/>`;
  if(c.outfit==="outfit_scholar")outfitExtra=`<rect x="15" y="22" width="2" height="7" fill="#eee9db"/><rect x="13" y="22" width="2" height="2" fill="#eee9db"/><rect x="17" y="22" width="2" height="2" fill="#eee9db"/>`;
  if(c.outfit==="outfit_explorer")outfitExtra=`<rect x="10" y="24" width="12" height="2" fill="#6b513a"/><rect x="12" y="22" width="2" height="7" fill="#6b513a"/><rect x="18" y="22" width="2" height="7" fill="#6b513a"/>`;
  if(c.outfit==="outfit_arcane")outfitExtra=`<rect x="11" y="23" width="10" height="1" fill="#d9c67a"/><rect x="15" y="25" width="2" height="2" fill="#d9c67a"/>`;
  let eyes=c.eyes==="sleepy"?`<rect x="12" y="14" width="3" height="1" fill="${eye}"/><rect x="18" y="14" width="3" height="1" fill="${eye}"/>`:`<rect x="13" y="13" width="2" height="2" fill="${eye}"/><rect x="18" y="13" width="2" height="2" fill="${eye}"/>${c.eyes==="bright"?`<rect x="13" y="13" width="1" height="1" fill="#fff"/><rect x="18" y="13" width="1" height="1" fill="#fff"/>`:""}`;
  let acc="";
  if(c.accessory==="acc_glasses")acc=`<rect x="11" y="12" width="5" height="4" fill="none" stroke="#262626" stroke-width="1"/><rect x="17" y="12" width="5" height="4" fill="none" stroke="#262626" stroke-width="1"/><rect x="16" y="13" width="1" height="1" fill="#262626"/>`;
  if(c.accessory==="acc_headphones")acc=`<rect x="8" y="11" width="2" height="7" fill="#33383b"/><rect x="22" y="11" width="2" height="7" fill="#33383b"/><rect x="10" y="8" width="12" height="2" fill="#33383b"/>`;
  if(c.accessory==="acc_flower")acc=`<rect x="21" y="6" width="2" height="2" fill="#d997a0"/><rect x="23" y="7" width="2" height="2" fill="#d997a0"/><rect x="22" y="8" width="2" height="2" fill="#d997a0"/><rect x="22" y="7" width="2" height="2" fill="#ead17c"/>`;
  if(c.accessory==="acc_cap")acc=`<rect x="9" y="6" width="13" height="3" fill="#526b78"/><rect x="20" y="8" width="5" height="2" fill="#526b78"/>`;
  if(c.accessory==="acc_crown")acc=`<polygon points="11,7 12,3 15,6 17,2 20,6 22,3 23,7" fill="#d5b45d"/><rect x="11" y="7" width="12" height="2" fill="#c49b3d"/>`;
  if(c.accessory==="acc_star")acc=`<rect x="23" y="20" width="2" height="2" fill="#d5b45d"/><rect x="24" y="19" width="2" height="4" fill="#d5b45d"/><rect x="22" y="21" width="4" height="2" fill="#d5b45d"/>`;
  return `<span class="avatar-art ${cls}"><svg viewBox="0 0 32 32" shape-rendering="crispEdges" aria-label="Personagem pixel art"><ellipse cx="16" cy="30" rx="8" ry="1.4" fill="currentColor" opacity=".12"/><rect x="10" y="9" width="12" height="11" fill="${outline}"/><rect x="11" y="10" width="10" height="9" fill="${skin}"/><rect x="9" y="12" width="2" height="5" fill="${skin}"/><rect x="21" y="12" width="2" height="5" fill="${skin}"/>${hairShape(c.hair,hair,outline)}${eyes}<rect x="15" y="17" width="3" height="1" fill="#8b5b52"/>${torso}${outfitExtra}<rect x="10" y="29" width="5" height="2" fill="${outline}"/><rect x="18" y="29" width="5" height="2" fill="${outline}"/>${acc}</svg></span>`;
}
async function loadGameData(){
  const [inv,ach,q,qp,items,defs,ap,stats]=await Promise.all([
    sb.from("game_inventory").select("*").order("unlocked_at",{ascending:false}),
    sb.from("game_user_achievements").select("*").order("unlocked_at",{ascending:false}),
    sb.from("game_quests").select("*").gte("ends_on",addDays(today(),-14)).order("starts_on",{ascending:false}),
    sb.from("game_quest_progress").select("*"),
    sb.from("game_items").select("*").order("sort_order"),
    sb.from("game_achievement_defs").select("*").order("sort_order"),
    sb.rpc("get_my_game_achievement_progress"),
    sb.rpc("get_my_game_stats")
  ]);
  if(!inv.error)S.gameInventory=inv.data||[];if(!ach.error)S.gameAchievements=ach.data||[];if(!q.error)S.gameQuests=q.data||[];if(!qp.error)S.gameQuestProgress=qp.data||[];if(!items.error)S.gameItems=items.data||[];if(!defs.error)S.achievementDefs=defs.data||[];if(!ap.error)S.achievementProgress=ap.data||[];if(!stats.error)S.gameStats=stats.data||{};
}
async function syncGame(silent=true){
  if(!S.user||S.profile?.gamification_enabled===false)return;
  const old=Number(S.gameProfile?.level||1);
  const a=await sb.rpc("ensure_my_game_quests",{p_today:today()});if(a.error){if(!silent)toast(a.error.message);return}
  const b=await sb.rpc("refresh_my_game_quests",{p_today:today()});if(b.error){if(!silent)toast(b.error.message);return}
  const r=await sb.rpc("sync_my_game_profile");if(r.error){if(!silent)toast(r.error.message);return}
  if(r.data)S.gameProfile=r.data;await loadGameData();
  const now=Number(S.gameProfile?.level||1);if(now>old)showLevelUp(now);
}
let gameSyncTimer=null;
function scheduleGameSync(){if(S.profile?.gamification_enabled===false)return;clearTimeout(gameSyncTimer);gameSyncTimer=setTimeout(async()=>{await syncGame(true);if(S.view==="today"||S.view==="rpg")render()},500)}
function showLevelUp(level){
  document.querySelector("#levelUp")?.remove();
  document.body.insertAdjacentHTML("beforeend",`<div id="levelUp" class="levelup-backdrop"><div class="levelup-card">${avatarSvg(avatarConfig(),"levelup-avatar")}<small>NOVO NÍVEL</small><strong>${level}</strong><h2>${esc(rankName(level))}</h2><p>${esc(S.gameProfile?.character_name||"Aventureiro")} continua evoluindo.</p><button data-level-close>Continuar</button></div></div>`);
}
function achievementValue(key){
  const r=(S.achievementProgress||[]).find(x=>x.achievement_key===key);return Number(r?.value||0);
}
function questValue(q){const p=(S.gameQuestProgress||[]).find(x=>x.quest_id===q.id);return Number(p?.value||0)}
function captureAvatarForm(){const f=document.querySelector('form[data-form="game-profile"]');if(!f||!S.gameProfile)return;const name=f.querySelector('[name="character_name"]')?.value,pr=f.querySelector('[name="presentation"]')?.value;if(name!=null)S.gameProfile.character_name=name;if(pr)S.gameProfile.presentation=pr}

function inlineMd(s){
  return s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\*(.*?)\*/g,"<em>$1</em>")
    .replace(/~~(.*?)~~/g,"<del>$1</del>").replace(/`([^`]+)`/g,"<code>$1</code>")
    .replace(/\[\[([^\]]+)\]\]/g,(_,name)=>`<button class="wikilink" data-wiki="${esc(name)}">[[${esc(name)}]]</button>`);
}
function markdown(src){
  const lines=esc(src||"").split("\n"),out=[];let inCode=false,code=[];
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    if(line.trim().startsWith("```")){if(inCode){out.push(`<pre><code>${code.join("\n")}</code></pre>`);code=[];inCode=false}else inCode=true;continue}
    if(inCode){code.push(line);continue}
    if(line.includes("|")&&i+1<lines.length&&/^\s*\|?\s*:?-{3,}/.test(lines[i+1])){
      const heads=line.split("|").map(x=>x.trim()).filter(Boolean),rows=[];i++;
      while(i+1<lines.length&&lines[i+1].includes("|")){i++;rows.push(lines[i].split("|").map(x=>x.trim()).filter(Boolean))}
      out.push(`<div class="table-wrap"><table><thead><tr>${heads.map(x=>`<th>${inlineMd(x)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${heads.map((_,j)=>`<td>${inlineMd(r[j]||"")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);continue;
    }
    if(/^### /.test(line))out.push(`<h3>${inlineMd(line.slice(4))}</h3>`); else if(/^## /.test(line))out.push(`<h2>${inlineMd(line.slice(3))}</h2>`); else if(/^# /.test(line))out.push(`<h1>${inlineMd(line.slice(2))}</h1>`);
    else if(/^---+$/.test(line.trim()))out.push("<hr>"); else if(/^> /.test(line))out.push(`<blockquote>${inlineMd(line.slice(2))}</blockquote>`);
    else if(/^- \[[ xX]\] /.test(line)){const done=/^- \[[xX]\]/.test(line);out.push(`<div class="taskline"><input type="checkbox" disabled ${done?"checked":""}> <span>${inlineMd(line.replace(/^- \[[ xX]\] /,""))}</span></div>`)}
    else if(/^- /.test(line))out.push(`<div class="listline">• ${inlineMd(line.slice(2))}</div>`); else if(/^\d+\. /.test(line))out.push(`<div class="listline">${inlineMd(line)}</div>`);
    else if(line.trim())out.push(`<p>${inlineMd(line)}</p>`); else out.push("<br>");
  }
  if(inCode)out.push(`<pre><code>${code.join("\n")}</code></pre>`); return out.join("");
}
function applyFormat(kind){
  const ta=document.querySelector(".note-content");if(!ta)return;
  const a=ta.selectionStart,b=ta.selectionEnd,sel=ta.value.slice(a,b),before=ta.value.slice(0,a),after=ta.value.slice(b);let insert=sel,start=a,end=b;
  const wrap=(l,r=l,placeholder="texto")=>{const v=sel||placeholder;insert=l+v+r;start=a+l.length;end=start+v.length};
  if(kind==="bold")wrap("**"); if(kind==="italic")wrap("*"); if(kind==="strike")wrap("~~"); if(kind==="code")wrap("`");
  if(kind==="link"){const v=sel||"texto";insert=`[${v}](https://)`;start=a+1;end=start+v.length}
  if(kind==="wiki"){const v=sel||"Nome da nota";insert=`[[${v}]]`;start=a+2;end=start+v.length}
  if(kind==="h1"){insert=`# ${sel||"Título"}`;start=a+2;end=a+insert.length} if(kind==="h2"){insert=`## ${sel||"Título"}`;start=a+3;end=a+insert.length}
  if(kind==="bullet"){insert=(sel||"item").split("\n").map(x=>`- ${x}`).join("\n");start=a;end=a+insert.length}
  if(kind==="check"){insert=(sel||"tarefa").split("\n").map(x=>`- [ ] ${x}`).join("\n");start=a;end=a+insert.length}
  if(kind==="quote"){insert=(sel||"citação").split("\n").map(x=>`> ${x}`).join("\n");start=a;end=a+insert.length}
  if(kind==="codeblock"){const v=sel||"código";insert=`\n\`\`\`\n${v}\n\`\`\`\n`;start=a+5;end=start+v.length}
  if(kind==="table"){insert=`\n| Coluna 1 | Coluna 2 | Coluna 3 |\n| --- | --- | --- |\n| Valor | Valor | Valor |\n| Valor | Valor | Valor |\n`;start=a+3;end=start+8}
  if(kind==="hr"){insert="\n---\n";start=end=a+insert.length}
  ta.value=before+insert+after;ta.focus();ta.setSelectionRange(start,end);ta.dispatchEvent(new Event("input",{bubbles:true}));
}
function noteToolbar(){
  return `<div class="format-toolbar" aria-label="Formatação"><button type="button" class="secondary" data-format="bold"><b>B</b></button><button type="button" class="secondary" data-format="italic"><i>I</i></button><button type="button" class="secondary" data-format="strike"><s>S</s></button><button type="button" class="secondary" data-format="h1">H1</button><button type="button" class="secondary" data-format="h2">H2</button><button type="button" class="secondary" data-format="bullet">• Lista</button><button type="button" class="secondary" data-format="check">☑</button><button type="button" class="secondary" data-format="quote">❝</button><button type="button" class="secondary" data-format="code">&lt;/&gt;</button><button type="button" class="secondary" data-format="codeblock">{ }</button><button type="button" class="secondary" data-format="link">↗</button><button type="button" class="secondary" data-format="wiki">[[ ]]</button><button type="button" class="secondary" data-format="table">▦ Tabela</button><button type="button" class="secondary" data-format="hr">—</button></div>`;
}
function templateContent(t,title="Nova nota"){
  return (t?.content||"").replaceAll("{{date}}",new Date().toLocaleDateString("pt-BR")).replaceAll("{{title}}",title);
}
async function loadNoteContent(id){
  if(!id)return; if(Object.prototype.hasOwnProperty.call(S.noteContent,id))return;
  const {data,error}=await sb.from("notes").select("*").eq("id",id).single(); if(error){toast(error.message);return;}
  S.noteContent[id]=data.content||"";
  const [a,b]=await Promise.all([
    sb.from("note_attachments").select("*").eq("note_id",id).order("created_at",{ascending:false}),
    sb.from("notes").select("id,title,tags,is_favorite,folder_id,note_type,linked_date,created_at,updated_at").neq("id",id).ilike("content",`%[[${(data.title||"").replaceAll("%","\\%").replaceAll("_","\\_")}]]%`).limit(20)
  ]);
  if(!a.error)S.note_attachments=S.note_attachments.filter(x=>x.note_id!==id).concat(a.data||[]); if(!b.error)S.backlinks=b.data||[];
}
let noteSaveTimer=null,noteSaveSeq=0;
function setSaveState(v){const el=$("#noteSaveState");if(el)el.textContent=v}
function currentNotePayload(){
  const f=document.querySelector('form[data-form="note"]');if(!f)return null;const x=Object.fromEntries(new FormData(f));x.tags=x.tags?x.tags.split(",").map(s=>s.trim()).filter(Boolean):[];x.folder_id=x.folder_id||null;return{id:f.dataset.id,payload:x};
}
async function persistNote(id,payload,{quiet=false}={}){
  const seq=++noteSaveSeq;setSaveState("Salvando…");const updated_at=new Date().toISOString();
  const {data,error}=await sb.from("notes").update({...payload,updated_at}).eq("id",id).select("id,title,tags,is_favorite,folder_id,note_type,linked_date,created_at,updated_at,content").single();
  if(error){setSaveState("Erro");if(!quiet)toast(error.message);return false}
  const i=S.notes.findIndex(n=>n.id===id);if(i>=0)S.notes[i]={...S.notes[i],...data,content:undefined};S.noteContent[id]=data.content||"";S.notes.sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at));if(seq===noteSaveSeq)setSaveState("Salvo");if(!quiet)toast("Nota salva");return true;
}
function scheduleNoteSave(){clearTimeout(noteSaveTimer);setSaveState("Alterações…");noteSaveTimer=setTimeout(async()=>{const x=currentNotePayload();if(x)await persistNote(x.id,x.payload,{quiet:true})},650)}
async function flushNoteSave(){if(!noteSaveTimer)return;clearTimeout(noteSaveTimer);noteSaveTimer=null;const x=currentNotePayload();if(x)await persistNote(x.id,x.payload,{quiet:true})}
async function newNote(templateId=null){
  await flushNoteSave(); const t=S.note_templates.find(x=>x.id===templateId),now=new Date().toISOString(),tempId=`temp-${Date.now()}`;
  const payload={title:t?`Nova nota — ${t.name}`:"Nova nota",content:templateContent(t),tags:t?.tags||[],is_favorite:false,folder_id:S.noteFilter.startsWith("folder:")?S.noteFilter.slice(7):null,note_type:"normal"};
  const temp={id:tempId,user_id:S.user.id,...payload,linked_date:null,created_at:now,updated_at:now};S.notes.unshift(temp);S.noteContent[tempId]=payload.content;S.selectedNote=tempId;S.view="notes";render();
  const {data,error}=await sb.from("notes").insert({...payload,user_id:S.user.id}).select("*").single();
  if(error){S.notes=S.notes.filter(n=>n.id!==tempId);delete S.noteContent[tempId];S.selectedNote=S.notes[0]?.id||null;render();return toast(error.message)}
  const i=S.notes.findIndex(n=>n.id===tempId);if(i>=0)S.notes[i]={...data,content:undefined};delete S.noteContent[tempId];S.noteContent[data.id]=data.content||"";S.selectedNote=data.id;scheduleGameSync();render();setTimeout(()=>document.querySelector('form[data-form="note"] input[name="title"]')?.select(),0);
}
async function openDailyNote(date=today()){
  await flushNoteSave();let n=S.notes.find(x=>x.note_type==="daily"&&x.linked_date===date);
  if(!n){const existing=await sb.from("notes").select("*").eq("note_type","daily").eq("linked_date",date).maybeSingle();if(existing.data){n={...existing.data,content:undefined};if(!S.notes.some(x=>x.id===n.id))S.notes.unshift(n);S.noteContent[n.id]=existing.data.content||"";}}
  if(!n){const t=S.note_templates.find(x=>x.name.toLowerCase().includes("diária"));const title=toDate(date).toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"}),payload={user_id:S.user.id,title,content:templateContent(t,title),tags:t?.tags||["diário"],is_favorite:false,folder_id:null,note_type:"daily",linked_date:date};const r=await sb.from("notes").insert(payload).select("*").single();if(r.error)return toast(r.error.message);n={...r.data,content:undefined};S.notes.unshift(n);S.noteContent[n.id]=r.data.content||"";}
  S.selectedNote=n.id;S.view="notes";scheduleGameSync();await loadNoteContent(n.id);render();
}
function periodRows(rows,start,end){return rows.filter(x=>x.date>=start&&x.date<=end)}
function summaryFor(start,end){
  const daily=periodRows(S.daily,start,end),sleep=periodRows(S.sleep,start,end),reads=periodRows(S.reading_logs,start,end),studies=periodRows(S.studies,start,end),ex=periodRows(S.exercise_logs,start,end),hab=periodRows(S.habit_logs,start,end).filter(x=>x.completed);
  return {days:daily.length,sleep:avg(sleep.map(hours)),mood:avg(daily.map(x=>x.mood)),energy:avg(daily.map(x=>x.energy)),focus:avg(daily.map(x=>x.focus)),pages:reads.reduce((a,x)=>a+(+x.pages_read||0),0),study:studies.reduce((a,x)=>a+(+x.minutes||0),0),exercise:ex.reduce((a,x)=>a+(+x.minutes||0),0),habits:hab.length};
}
function dashboardCards(){
  const cards=Array.isArray(S.profile?.dashboard_cards)?S.profile.dashboard_cards:defaultCards,week=summaryFor(startOfWeek(),today()),month=summaryFor(startOfMonth(),today()),hs=S.habits.filter(x=>x.active),g=S.gameProfile||{};
  const map={
    week:()=>`<div class="panel dash-card hoverable"><small>Esta semana</small><div class="metric">${week.habits} hábitos</div><div class="submetric"><span>${week.study} min estudo</span><span>·</span><span>${week.pages} pág.</span></div></div>`,
    sleep:()=>`<div class="panel dash-card hoverable"><small>Sono · semana</small><div class="metric">${week.sleep==null?"—":fmt1(week.sleep)+"h"}</div><div class="submetric"><span>mês ${month.sleep==null?"—":fmt1(month.sleep)+"h"}</span></div></div>`,
    habits:()=>`<div class="panel dash-card hoverable"><small>Hábitos · semana</small><div class="metric">${week.habits}</div><div class="submetric"><span>${hs.length} hábitos ativos</span></div></div>`,
    reading:()=>`<div class="panel dash-card hoverable"><small>Leitura · mês</small><div class="metric">${month.pages} pág.</div><div class="submetric"><span>${S.books.filter(b=>b.status==="Em andamento").length} em andamento</span></div></div>`,
    study:()=>`<div class="panel dash-card hoverable"><small>Estudos · mês</small><div class="metric">${Math.floor(month.study/60)}h ${month.study%60}m</div><div class="submetric"><span>${periodRows(S.studies,startOfMonth(),today()).length} sessões</span></div></div>`,
    goals:()=>`<div class="panel dash-card hoverable"><small>Objetivos</small><div class="metric">${S.goals.filter(x=>(x.status||"Ativo")!=="Concluído").length}</div><div class="submetric"><span>ativos</span></div></div>`,
    rpg:()=>S.profile?.gamification_enabled?(()=>{const xi=xpInfo();return `<button class="panel dash-card hoverable rpg-dashboard-card" data-open-rpg><div class="rpg-preview">${avatarSvg(avatarConfig(),"rpg-mini")}<div><small>${esc(g.title||rankName(xi.level))}</small><div class="metric">Lv. ${xi.level}</div><div class="submetric"><span>${esc(g.character_name||"Aventureiro")}</span><span>·</span><span>🪙 ${g.coins||0}</span></div><div class="xp-line"><span style="width:${xi.pct}%"></span></div><small>${xi.inside}/${xi.needed} XP para o próximo nível</small></div></div></button>`})():""
  };
  return cards.map(k=>map[k]?.()||"").join("");
}
function todayPage(){
  const q=dataOf(S.selected),hs=S.habits.filter(x=>x.active);
  return `<div class="dashboard-grid">${dashboardCards()}</div>
  <div id="registerTop" class="grid two"><div class="panel hoverable"><h3>Como você está?</h3><form data-form="daily"><input type="hidden" name="date" value="${S.selected}"><div class="form">${[["energy","Energia"],["mood","Humor"],["focus","Foco"],["stress","Estresse"]].map(([n,l])=>`<div class="field"><label>${l}</label>${rate(n,q.d?.[n]||3)}</div>`).join("")}<div class="field full"><label>Nota rápida</label><textarea name="notes" rows="3">${esc(q.d?.notes)}</textarea></div></div><div class="actions"><button>Salvar check-in</button></div></form></div>
  <div class="panel hoverable"><h3>Resumo do dia</h3><p class="muted">${q.s?`Sono: ${hours(q.s).toFixed(1)}h · qualidade ${q.s.quality}/5`:"Sono ainda não registrado."}</p><p class="muted">Hábitos: ${q.h.length}/${hs.length}</p><p class="muted">Leitura: ${q.r.reduce((a,x)=>a+x.pages_read,0)} páginas</p><p class="muted">Estudo: ${q.st.reduce((a,x)=>a+x.minutes,0)} min</p><p class="muted">Exercício: ${q.e.reduce((a,x)=>a+(x.minutes||0),0)} min</p><div class="actions" style="justify-content:flex-start"><button class="secondary" data-daily-note="${S.selected}">▤ Nota diária</button></div></div></div>
  <h2 class="section">Hábitos de hoje</h2><div class="list">${hs.map(h=>{const l=q.h.find(x=>x.habit_id===h.id);return `<div class="row"><strong>${esc(h.name)}</strong><button class="check-btn ${l?"done":"secondary"}" data-toggle="${h.id}" data-date="${S.selected}">${l?"Concluído ✓":"Marcar"}</button></div>`}).join("")||"<p class='muted'>Crie hábitos na seção Hábitos.</p>"}</div>
  <h2 class="section">Registro rápido</h2><div class="quick-grid"><div class="panel"><h3>Sono</h3><form data-form="sleep"><input type="hidden" name="date" value="${S.selected}"><div class="field"><label>Dormi às</label><input type="time" name="bed_time" value="${q.s?.bed_time||""}" required></div><div class="field"><label>Acordei às</label><input type="time" name="wake_time" value="${q.s?.wake_time||""}" required></div><div class="field"><label>Qualidade</label>${rate("quality",q.s?.quality||3)}</div><div class="actions"><button>Salvar</button></div></form></div>
  <div class="panel"><h3>Leitura</h3><form data-form="reading"><input type="hidden" name="date" value="${S.selected}"><div class="field"><label>Livro</label><select name="book_id" required><option value="">Selecione</option>${S.books.map(b=>`<option value="${b.id}">${esc(b.title)}</option>`).join("")}</select></div><div class="field"><label>Páginas lidas</label><input type="number" min="1" name="pages_read" required></div><div class="field"><label>Minutos</label><input type="number" min="1" name="minutes"></div><div class="actions"><button>Registrar</button></div></form></div>
  <div class="panel"><h3>Exercício</h3><form data-form="exercise"><input type="hidden" name="date" value="${S.selected}"><div class="field"><label>Atividade</label><input name="activity" required></div><div class="field"><label>Minutos</label><input type="number" min="1" name="minutes"></div><div class="field"><label>Intensidade</label>${rate("intensity",3)}</div><div class="actions"><button>Registrar</button></div></form></div></div>
  <h2 class="section">Diário</h2><div class="panel"><form data-form="journal"><input type="hidden" name="date" value="${S.selected}"><div class="form"><div class="field"><label>Título</label><input name="title" value="${esc(q.j?.title)}"></div><div class="field"><label>Tags</label><input name="tags" value="${esc((q.j?.tags||[]).join(", "))}" placeholder="trabalho, viagem..."></div><div class="field full"><label>O que marcou seu dia?</label><textarea name="body" rows="5">${esc(q.j?.body)}</textarea></div></div><div class="actions"><button>Salvar diário</button></div></form></div>`;
}
function calendarPage(){
  const b=toDate(S.selected),y=b.getFullYear(),m=b.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0),cells=[];
  for(let i=0;i<first.getDay();i++)cells.push("<div class='day blank'></div>");
  for(let n=1;n<=last.getDate();n++){const ds=`${y}-${String(m+1).padStart(2,"0")}-${String(n).padStart(2,"0")}`,q=dataOf(ds),count=[q.d,q.s,q.h.length,q.r.length,q.st.length,q.e.length,q.j].filter(Boolean).length;cells.push(`<button class="day ${ds===today()?"today":""} ${ds===S.selected?"selected":""}" data-date="${ds}"><b>${n}</b><div class="dots">${"<i class='dot'></i>".repeat(Math.min(count,6))}</div></button>`)}
  return `<div class="panel"><div class="row" style="border:0;padding:0 0 14px"><button class="secondary" data-month="-1">←</button><h3>${b.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</h3><button class="secondary" data-month="1">→</button></div><div class="calendar">${["D","S","T","Q","Q","S","S"].map(x=>`<div class="weekday">${x}</div>`).join("")}${cells.join("")}</div></div>`;
}
function habitCalendar(h){
  const b=toDate(S.selected),y=b.getFullYear(),m=b.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0),cells=[];
  for(let i=0;i<first.getDay();i++)cells.push("<span class='habit-day empty'></span>");
  for(let n=1;n<=last.getDate();n++){const ds=`${y}-${String(m+1).padStart(2,"0")}-${String(n).padStart(2,"0")}`,done=habitDone(h.id,ds),future=ds>today();cells.push(`<button class="habit-day ${done?"done":""} ${future?"future":""}" data-toggle="${h.id}" data-date="${ds}">${n}</button>`)}
  return `<div class="habit-calendar">${["D","S","T","Q","Q","S","S"].map(x=>`<div class="habit-week">${x}</div>`).join("")}${cells.join("")}</div>`;
}
function habitsPage(){
  const active=S.habits.filter(x=>x.active);
  return `<div id="habitCreate" class="panel"><h3>Novo hábito</h3><form data-form="habit"><div class="field"><label>Nome</label><input name="name" required placeholder="Ex.: Caminhar 30 minutos"></div><div class="actions"><button>Adicionar</button></div></form></div><h2 class="section">Calendário de hábitos</h2><div class="list">${active.map(h=>{const st=habitStats(h);return `<div class="panel habit-card"><div class="habit-head"><div><strong>${esc(h.name)}</strong><small>${toDate(S.selected).toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</small></div><button class="danger" data-del="habits" data-id="${h.id}">Excluir</button></div><div class="habit-stats"><span class="chip">${st.monthCount} este mês</span><span class="chip">${st.rate}%</span><span class="chip">Sequência ${st.streak}</span><span class="chip">Recorde ${st.best}</span></div>${habitCalendar(h)}</div>`}).join("")||"<div class='empty-state'>Nenhum hábito cadastrado.</div>"}</div>`;
}
function booksPage(){
  return `<div id="bookCreate" class="panel"><h3>Novo livro</h3><form data-form="book"><div class="form"><div class="field"><label>Título</label><input name="title" required></div><div class="field"><label>Autor</label><input name="author"></div><div class="field"><label>Status</label><select name="status"><option>Quero ler</option><option>Em andamento</option><option>Lido</option></select></div><div class="field"><label>Total de páginas</label><input type="number" min="0" name="pages"></div></div><div class="actions"><button>Adicionar</button></div></form></div><h2 class="section">Biblioteca</h2><div class="list">${S.books.map(b=>{const read=S.reading_logs.filter(x=>x.book_id===b.id).reduce((a,x)=>a+x.pages_read,0),pc=b.pages?Math.min(100,Math.round(read/b.pages*100)):0;return `<div class="panel hoverable"><div class="row" style="border:0;padding:0"><div><strong>${esc(b.title)}</strong><small>${esc(b.author)} · ${read}/${b.pages||"?"} páginas · ${pc}%</small></div><button class="danger" data-del="books" data-id="${b.id}">Excluir</button></div><div class="progress"><span style="width:${pc}%"></span></div></div>`}).join("")||"<div class='empty-state'>Nenhum livro cadastrado.</div>"}</div>`;
}
function studiesPage(){
  return `<div id="studyCreate" class="panel"><h3>Registrar estudo</h3><form data-form="study"><div class="form"><div class="field"><label>Data</label><input type="date" name="date" value="${today()}" required></div><div class="field"><label>Assunto</label><input name="subject" required></div><div class="field"><label>Minutos</label><input type="number" min="1" name="minutes" required></div><div class="field full"><label>Aprendizado</label><textarea name="learned"></textarea></div></div><div class="actions"><button>Salvar</button></div></form></div><h2 class="section">Histórico recente</h2><div class="list">${S.studies.slice(0,100).map(x=>`<div class="row"><div><strong>${esc(x.subject)}</strong><small>${x.date} · ${x.minutes} min</small></div><button class="danger" data-del="studies" data-id="${x.id}">Excluir</button></div>`).join("")}</div>`;
}
function goalWindow(g){
  const end=g.deadline||today(); if(g.period==="week")return [startOfWeek(),today()]; if(g.period==="month")return [startOfMonth(),today()]; return [g.start_date||g.date||"1900-01-01",end<today()?end:today()];
}
function goalValue(g){
  const [start,end]=goalWindow(g); if(g.metric==="reading_pages")return periodRows(S.reading_logs,start,end).reduce((a,x)=>a+(+x.pages_read||0),0);
  if(g.metric==="study_minutes")return periodRows(S.studies,start,end).reduce((a,x)=>a+(+x.minutes||0),0);
  if(g.metric==="exercise_minutes")return periodRows(S.exercise_logs,start,end).reduce((a,x)=>a+(+x.minutes||0),0);
  if(g.metric==="habit_completions")return periodRows(S.habit_logs,start,end).filter(x=>x.completed).length;
  return +g.progress||0;
}
function goalProgress(g){return g.auto_track?Math.min(100,Math.round(goalValue(g)/(+g.target_value||1)*100)):(+g.progress||0)}
function goalMetricLabel(g){return {reading_pages:"páginas",study_minutes:"min de estudo",exercise_minutes:"min de exercício",habit_completions:"hábitos concluídos"}[g.metric]||"unidades"}
function goalsPage(){
  return `<div id="goalCreate" class="panel"><h3>Novo objetivo</h3><form data-form="goal"><div class="form"><div class="field"><label>Objetivo</label><input name="title" required></div><div class="field"><label>Prazo</label><input type="date" name="deadline"></div><div class="field"><label>Tipo</label><select name="goal_mode" id="goalMode"><option value="manual">Manual</option><option value="auto">Automático pelos registros</option></select></div><div class="field"><label>Progresso manual %</label><input type="number" min="0" max="100" name="progress" value="0"></div><div class="field"><label>Métrica automática</label><select name="metric"><option value="reading_pages">Páginas lidas</option><option value="study_minutes">Minutos de estudo</option><option value="exercise_minutes">Minutos de exercício</option><option value="habit_completions">Hábitos concluídos</option></select></div><div class="field"><label>Meta numérica</label><input type="number" min="1" step="1" name="target_value" value="100"></div><div class="field"><label>Período</label><select name="period"><option value="month">Mês atual</option><option value="week">Semana atual</option><option value="all">Desde o início da meta</option></select></div><div class="field full"><label>Notas</label><textarea name="notes"></textarea></div></div><div class="auto-goal-info">Metas automáticas usam os registros do próprio sistema. Ex.: 500 páginas no mês ou 600 minutos de estudo.</div><div class="actions"><button>Adicionar</button></div></form></div><h2 class="section">Objetivos</h2><div class="list">${S.goals.map(g=>{const pc=goalProgress(g),v=goalValue(g);return `<div class="panel"><div class="goal-card-head"><div><strong>${esc(g.title)}</strong><small>${g.deadline?"Prazo "+g.deadline:"Sem prazo"}</small></div><span class="goal-badge">${g.auto_track?"Automático":"Manual"}</span></div><div class="progress"><span style="width:${pc}%"></span></div><small>${g.auto_track?`${v} / ${g.target_value||0} ${goalMetricLabel(g)} · `:""}${pc}%</small></div>`}).join("")||"<div class='empty-state'>Nenhum objetivo cadastrado.</div>"}</div>`;
}
function filteredNotes(){
  let rows=[...S.notes]; if(S.noteFilter==="inbox")rows=rows.filter(n=>!n.folder_id&&n.note_type!=="daily"); else if(S.noteFilter==="favorites")rows=rows.filter(n=>n.is_favorite); else if(S.noteFilter==="daily")rows=rows.filter(n=>n.note_type==="daily"); else if(S.noteFilter.startsWith("folder:"))rows=rows.filter(n=>n.folder_id===S.noteFilter.slice(7)); return rows;
}
function relationLabel(r){
  if(r.entity_type==="day")return `Dia ${r.entity_date||""}`; if(r.entity_type==="book")return `Livro: ${S.books.find(x=>x.id===r.entity_id)?.title||r.label||""}`; if(r.entity_type==="goal")return `Objetivo: ${S.goals.find(x=>x.id===r.entity_id)?.title||r.label||""}`; if(r.entity_type==="study")return `Estudo: ${S.studies.find(x=>x.id===r.entity_id)?.subject||r.label||""}`; return r.label||r.entity_type;
}
function noteEditor(n){
  if(!n)return `<div class="panel note-editor"><h3>Suas notas</h3><p class="muted">Use a Inbox para capturas rápidas, pastas para organizar e templates para criar estruturas recorrentes.</p></div>`;
  const content=S.noteContent[n.id]; if(content===undefined)return `<div class="panel note-editor"><span class="loading-inline"></span> Carregando nota…</div>`;
  const atts=S.note_attachments.filter(a=>a.note_id===n.id),relations=S.note_relations.filter(r=>r.note_id===n.id);
  return `<div class="panel note-editor"><div class="editor-toolbar"><div class="left"><button class="${!S.notePreview?"":"secondary"}" data-note-mode="edit">Editar</button><button class="${S.notePreview?"":"secondary"}" data-note-mode="preview">Visualizar</button><span id="noteSaveState" class="save-state">Salvo</span></div><div class="right"><button class="secondary" data-save-template="${n.id}">Template</button><button class="secondary" data-fav="${n.id}">${n.is_favorite?"★":"☆"}</button><button class="danger" data-note-delete="${n.id}">Excluir</button></div></div>
  <form data-form="note" data-id="${n.id}"><div class="field"><input name="title" value="${esc(n.title)}" placeholder="Título" required></div><div class="note-meta-grid"><div class="field"><label>Pasta</label><select name="folder_id"><option value="">Inbox / sem pasta</option>${S.note_folders.map(f=>`<option value="${f.id}" ${n.folder_id===f.id?"selected":""}>${esc(f.name)}</option>`).join("")}</select></div><div class="field"><label>Tags</label><input name="tags" value="${esc((n.tags||[]).join(", "))}" placeholder="tags, separadas, por vírgula"></div></div>${S.notePreview?`<div class="preview">${markdown(content)}</div>`:`${noteToolbar()}<textarea class="note-content" name="content" placeholder="Escreva aqui...">${esc(content)}</textarea><div class="editor-help"><span>Ctrl+B negrito · Ctrl+I itálico · Ctrl+S salvar</span><span>${content.trim()?content.trim().split(/\s+/).length:0} palavras</span></div>`}<div class="actions">${!S.notePreview?"<button>Salvar agora</button>":""}</div></form>
  <h3 class="section">Relacionamentos</h3><div class="relation-list">${relations.map(r=>`<span class="relation-chip">${esc(relationLabel(r))}<button data-relation-delete="${r.id}">×</button></span>`).join("")||"<small>Nenhum vínculo.</small>"}</div><div class="actions" style="justify-content:flex-start"><select id="relationTarget" style="max-width:330px"><option value="day:${today()}">Dia de hoje</option>${S.books.map(x=>`<option value="book:${x.id}">Livro · ${esc(x.title)}</option>`).join("")}${S.goals.map(x=>`<option value="goal:${x.id}">Objetivo · ${esc(x.title)}</option>`).join("")}${S.studies.slice(0,30).map(x=>`<option value="study:${x.id}">Estudo · ${esc(x.subject)} (${x.date})</option>`).join("")}</select><button type="button" class="secondary" data-add-relation>Vincular</button></div>
  <h3 class="section">Anexos</h3><div class="attachments">${atts.map(a=>`<div class="attachment"><div><strong>${esc(a.file_name)}</strong><small>${a.size_bytes?Math.round(a.size_bytes/1024)+" KB":""}</small></div><div><button class="secondary" data-attachment-open="${a.id}">Abrir</button> <button class="danger" data-attachment-delete="${a.id}">×</button></div></div>`).join("")||"<small>Nenhum anexo.</small>"}</div><div class="actions" style="justify-content:flex-start"><label class="secondary" style="padding:10px 14px;border-radius:11px;cursor:pointer">＋ Anexar arquivo<input id="attachmentInput" type="file" hidden></label></div>
  <div class="backlinks"><h3>Backlinks</h3>${S.backlinks.map(x=>`<button class="note-item" data-note="${x.id}"><strong>${esc(x.title)}</strong><small>Contém [[${esc(n.title)}]]</small></button>`).join("")||"<small>Nenhuma nota aponta para esta.</small>"}</div></div>`;
}
function notesPage(){
  if(!S.selectedNote){const first=filteredNotes()[0]||S.notes[0];if(first)S.selectedNote=first.id}
  const sel=S.notes.find(n=>n.id===S.selectedNote),rows=filteredNotes();
  return `<div class="notes-layout"><div class="panel notes-sidebar"><div class="notes-actions"><button data-new-note>＋ Nova nota</button><button class="secondary icon-btn" data-daily-note="${today()}" title="Nota diária">☀</button></div><div class="template-bar"><select id="templateSelect"><option value="">Nota em branco</option>${S.note_templates.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select><button class="secondary" data-new-from-template>Usar</button></div><input id="noteSearch" placeholder="Buscar nas notas carregadas...">
  <div class="folder-list"><button class="folder-btn ${S.noteFilter==="all"?"active":""}" data-note-filter="all">Todas</button><button class="folder-btn ${S.noteFilter==="inbox"?"active":""}" data-note-filter="inbox">⌂ Inbox</button><button class="folder-btn ${S.noteFilter==="favorites"?"active":""}" data-note-filter="favorites">★ Favoritas</button><button class="folder-btn ${S.noteFilter==="daily"?"active":""}" data-note-filter="daily">☀ Notas diárias</button>${S.note_folders.map(f=>`<div class="folder-row"><button class="folder-btn ${S.noteFilter===`folder:${f.id}`?"active":""}" data-note-filter="folder:${f.id}">▸ ${esc(f.name)}</button><button class="danger icon-btn" data-folder-delete="${f.id}">×</button></div>`).join("")}</div><button class="secondary" data-new-folder>＋ Nova pasta</button>
  <div class="note-list" id="noteList">${rows.map(n=>`<button class="note-item ${n.id===S.selectedNote?"active":""}" data-note="${n.id}"><strong>${n.is_favorite?"★ ":""}${n.note_type==="daily"?"☀ ":""}${esc(n.title)}</strong><small>${(n.tags||[]).map(t=>"#"+esc(t)).join(" ")||S.note_folders.find(f=>f.id===n.folder_id)?.name||"Inbox"}</small></button>`).join("")||"<small>Nenhuma nota nesta seção.</small>"}</div>${S.notesHasMore?"<button class='secondary load-more' data-load-more-notes>Carregar mais</button>":""}
  <h3 class="section">Templates</h3><div class="template-list">${S.note_templates.map(t=>`<div class="template-item"><span>${esc(t.name)}</span><button class="danger icon-btn" data-template-delete="${t.id}" title="Excluir">×</button></div>`).join("")}</div></div>${noteEditor(sel)}</div>`;
}
function rangeDates(){
  if(S.analyticsRange==="custom"&&S.analyticsCustomStart&&S.analyticsCustomEnd)return [S.analyticsCustomStart,S.analyticsCustomEnd];
  const days=+S.analyticsRange||30,end=today(),start=addDays(end,-days+1);return [start,end];
}
async function loadAnalytics(){
  const [start,end]=rangeDates(),len=daysBetween(start,end),prevEnd=addDays(start,-1),prevStart=addDays(prevEnd,-len+1);
  const tables=["daily_entries","sleep_entries","habit_logs","reading_logs","studies","exercise_logs"];
  async function bundle(a,b){
    const arr=await Promise.all(tables.map(t=>fetchPaged(t,q=>q.gte("date",a).lte("date",b).order("date",{ascending:true}))));
    return Object.fromEntries(tables.map((t,i)=>[stateKey[t],arr[i]]));
  }
  const [cur,prev]=await Promise.all([bundle(start,end),bundle(prevStart,prevEnd)]);S.analytics={start,end,prevStart,prevEnd,cur,prev};
}
function analyticSummary(data){
  return {days:data.daily.length,sleep:avg(data.sleep.map(hours)),energy:avg(data.daily.map(x=>x.energy)),mood:avg(data.daily.map(x=>x.mood)),focus:avg(data.daily.map(x=>x.focus)),stress:avg(data.daily.map(x=>x.stress)),pages:data.reading_logs.reduce((a,x)=>a+(+x.pages_read||0),0),study:data.studies.reduce((a,x)=>a+(+x.minutes||0),0),exercise:data.exercise_logs.reduce((a,x)=>a+(+x.minutes||0),0),habits:data.habit_logs.filter(x=>x.completed).length};
}
function deltaText(now,prev){if(now==null||prev==null)return "sem comparação";if(prev===0)return now===0?"0%":"novo";const d=((now-prev)/Math.abs(prev))*100;return `${d>=0?"+":""}${d.toFixed(0)}% vs anterior`}
function dateSeries(rows,key,agg="avg"){
  const m=new Map();rows.forEach(r=>{const v=+r[key]||0;if(!m.has(r.date))m.set(r.date,[]);m.get(r.date).push(v)});return [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([date,vals])=>({date,value:agg==="sum"?vals.reduce((a,x)=>a+x,0):vals.reduce((a,x)=>a+x,0)/vals.length}));
}
function lineSvg(series,maxY=null){
  const all=series.flatMap(s=>s.data.map(x=>x.value)).filter(Number.isFinite);if(!all.length)return `<div class="empty-state">Ainda não há dados suficientes.</div>`;
  const w=620,h=190,p=24,min=0,max=maxY||Math.max(...all,1),dates=[...new Set(series.flatMap(s=>s.data.map(x=>x.date)))].sort(),x=d=>dates.length===1?w/2:p+(dates.indexOf(d)*(w-2*p)/(dates.length-1)),y=v=>h-p-(Math.max(min,Math.min(max,v))-min)*(h-2*p)/(max-min||1);
  const grid=[0,.25,.5,.75,1].map(t=>`<line class="chart-grid" x1="${p}" y1="${p+t*(h-2*p)}" x2="${w-p}" y2="${p+t*(h-2*p)}"/>`).join("");
  const paths=series.map((s,i)=>{const pts=s.data.map(d=>`${x(d.date).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");return `<polyline class="chart-line chart-line-${i+1}" points="${pts}"/>`}).join("");
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">${grid}${paths}</svg>`;
}
function barSvg(data){
  if(!data.length)return `<div class="empty-state">Ainda não há dados suficientes.</div>`;const w=620,h=190,p=24,max=Math.max(...data.map(x=>x.value),1),bw=Math.max(2,(w-2*p)/data.length*.68);
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${[0,.25,.5,.75,1].map(t=>`<line class="chart-grid" x1="${p}" y1="${p+t*(h-2*p)}" x2="${w-p}" y2="${p+t*(h-2*p)}"/>`).join("")}${data.map((d,i)=>{const slot=(w-2*p)/data.length,x=p+i*slot+(slot-bw)/2,bh=(d.value/max)*(h-2*p),y=h-p-bh;return `<rect class="chart-bar" x="${x}" y="${y}" width="${bw}" height="${bh}" rx="2"/>`}).join("")}</svg>`;
}
function groupInsight(data,condition,field,aName,bName){
  const map=new Map(data.daily.map(d=>[d.date,d]));const yes=[],no=[];
  for(const [date,d] of map){const v=+d[field];if(!v)continue;(condition(date,data)?yes:no).push(v)}
  if(yes.length<3||no.length<3)return null;const ay=avg(yes),an=avg(no);return {text:`Nos ${yes.length} dias ${aName}, ${field==="energy"?"a energia":field==="focus"?"o foco":"o humor"} média registrada foi ${fmt1(ay)}/5; nos ${no.length} dias ${bName}, foi ${fmt1(an)}/5.`,sample:`${yes.length+no.length} dias comparados · associação descritiva, não causal.`};
}
function buildInsights(data){
  const sleepMap=new Map(data.sleep.map(x=>[x.date,hours(x)])),exDates=new Set(data.exercise_logs.map(x=>x.date)),habitCount=new Map();data.habit_logs.filter(x=>x.completed).forEach(x=>habitCount.set(x.date,(habitCount.get(x.date)||0)+1));
  return [
    groupInsight(data,d=>sleepMap.has(d)&&sleepMap.get(d)>=7,"energy","com sono ≥ 7h","com sono < 7h"),
    groupInsight(data,d=>exDates.has(d),"mood","com exercício registrado","sem exercício registrado"),
    groupInsight(data,d=>(habitCount.get(d)||0)>=Math.max(1,Math.ceil(S.habits.filter(x=>x.active).length/2)),"focus","com pelo menos metade dos hábitos concluídos","abaixo desse nível")
  ].filter(Boolean);
}
function analysisPage(){
  if(!S.analytics)return `<div class="panel"><span class="loading-inline"></span> Preparando análises…</div>`;
  const a=S.analytics,cur=analyticSummary(a.cur),prev=analyticSummary(a.prev),ins=buildInsights(a.cur),week=summaryFor(startOfWeek(),today()),month=summaryFor(startOfMonth(),today());
  const wellbeing=[{data:dateSeries(a.cur.daily,"energy")},{data:dateSeries(a.cur.daily,"mood")},{data:dateSeries(a.cur.daily,"focus")},{data:dateSeries(a.cur.daily,"stress")}];
  const sleep=dateSeries(a.cur.sleep.map(x=>({...x,duration:hours(x)})),"duration"),pages=dateSeries(a.cur.reading_logs,"pages_read","sum"),study=dateSeries(a.cur.studies,"minutes","sum");
  return `<div class="period-tabs"><button class="secondary ${S.analyticsRange===7?"active":""}" data-range="7">7 dias</button><button class="secondary ${S.analyticsRange===30?"active":""}" data-range="30">30 dias</button><button class="secondary ${S.analyticsRange===90?"active":""}" data-range="90">90 dias</button><button class="secondary ${S.analyticsRange==="custom"?"active":""}" data-range="custom">Personalizado</button></div>${S.analyticsRange==="custom"?`<div class="custom-range"><input id="analysisStart" type="date" value="${S.analyticsCustomStart||a.start}"><input id="analysisEnd" type="date" value="${S.analyticsCustomEnd||a.end}"><button data-apply-range>Aplicar</button></div>`:""}
  <div class="grid four">${[["Sono médio",cur.sleep==null?"—":fmt1(cur.sleep)+"h",deltaText(cur.sleep,prev.sleep)],["Humor",cur.mood==null?"—":fmt1(cur.mood)+"/5",deltaText(cur.mood,prev.mood)],["Páginas",cur.pages,deltaText(cur.pages,prev.pages)],["Estudo",cur.study+" min",deltaText(cur.study,prev.study)]].map(x=>`<div class="panel hoverable"><small>${x[0]}</small><div class="metric">${x[1]}</div><span class="delta">${x[2]}</span></div>`).join("")}</div>
  <h2 class="section">Gráficos</h2><div class="analysis-grid"><div class="panel chart-card"><div class="chart-head"><div><h3>Bem-estar</h3><small>${a.start} → ${a.end}</small></div><div class="legend"><span><i class="l1"></i>Energia</span><span><i class="l2"></i>Humor</span><span><i class="l3"></i>Foco</span><span><i class="l4"></i>Estresse</span></div></div><div class="chart-wrap">${lineSvg(wellbeing,5)}</div></div><div class="panel chart-card"><div class="chart-head"><div><h3>Sono</h3><small>Duração em horas</small></div></div><div class="chart-wrap">${lineSvg([{data:sleep}])}</div></div><div class="panel chart-card"><div class="chart-head"><div><h3>Leitura</h3><small>Páginas por dia</small></div></div><div class="chart-wrap">${barSvg(pages)}</div></div><div class="panel chart-card"><div class="chart-head"><div><h3>Estudo</h3><small>Minutos por dia</small></div></div><div class="chart-wrap">${barSvg(study)}</div></div></div>
  <h2 class="section">Resumo do período</h2><div class="panel"><div class="summary-grid">${[["Dias registrados",cur.days],["Hábitos concluídos",cur.habits],["Exercício",cur.exercise+" min"],["Energia média",cur.energy==null?"—":fmt1(cur.energy)+"/5"],["Foco médio",cur.focus==null?"—":fmt1(cur.focus)+"/5"],["Estresse médio",cur.stress==null?"—":fmt1(cur.stress)+"/5"]].map(x=>`<div class="summary-item"><small>${x[0]}</small><b>${x[1]}</b></div>`).join("")}</div></div>
  <h2 class="section">Semana e mês atuais</h2><div class="grid two"><div class="panel"><h3>Esta semana</h3><div class="summary-grid">${[["Sono",week.sleep==null?"—":fmt1(week.sleep)+"h"],["Páginas",week.pages],["Estudo",week.study+" min"],["Hábitos",week.habits],["Exercício",week.exercise+" min"],["Humor",week.mood==null?"—":fmt1(week.mood)+"/5"]].map(x=>`<div class="summary-item"><small>${x[0]}</small><b>${x[1]}</b></div>`).join("")}</div></div><div class="panel"><h3>Este mês</h3><div class="summary-grid">${[["Sono",month.sleep==null?"—":fmt1(month.sleep)+"h"],["Páginas",month.pages],["Estudo",month.study+" min"],["Hábitos",month.habits],["Exercício",month.exercise+" min"],["Humor",month.mood==null?"—":fmt1(month.mood)+"/5"]].map(x=>`<div class="summary-item"><small>${x[0]}</small><b>${x[1]}</b></div>`).join("")}</div></div></div>
  <h2 class="section">Insights</h2><div class="panel">${ins.length?ins.map(i=>`<div class="insight">${esc(i.text)}<span class="sample">${esc(i.sample)}</span></div>`).join(""):`<p class="muted">Ainda não há observações suficientes nos dois grupos para gerar comparações úteis. Continue registrando normalmente.</p>`}</div>`;
}

function creatorOption(category,key,label,selected){
  const item=gameItem(key),available=canUseItem(key);
  return `<button type="button" class="avatar-option ${selected===key?"selected":""} ${available?"":"locked"}" data-avatar-item="${key}" ${available?"":'data-locked="true"'}><span class="avatar-option-preview">${category==="hair"?avatarSvg({...avatarConfig(),hair:key,accessory:"none"},"tiny"):category==="outfit"?avatarSvg({...avatarConfig(),outfit:key,accessory:"none"},"tiny"):avatarSvg({...avatarConfig(),accessory:key},"tiny")}</span><b>${esc(label||item?.name||key)}</b><small>${available?"Disponível":unlockText(item)}</small></button>`;
}
function avatarCreator(){
  const g=S.gameProfile||{},c=avatarConfig(),hairs=S.gameItems.filter(x=>x.category==="hair"),outfits=S.gameItems.filter(x=>x.category==="outfit"),accessories=S.gameItems.filter(x=>x.category==="accessory");
  return `<div class="creator-grid"><div class="panel avatar-showcase"><div class="avatar-stage">${avatarSvg(c,"hero-avatar")}<div class="avatar-shadow"></div></div><h2>${esc(g.character_name||"Aventureiro")}</h2><p class="muted">${esc(g.title||rankName(g.level||1))} · Nível ${g.level||1}</p><div class="actions" style="justify-content:center"><button class="secondary" data-random-avatar>🎲 Randomizar</button></div></div>
  <div class="panel creator-controls"><form data-form="game-profile"><div class="form"><div class="field"><label>Nome do personagem</label><input name="character_name" maxlength="40" value="${esc(g.character_name||S.profile?.display_name||"Aventureiro")}" required></div><div class="field"><label>Apresentação</label><select name="presentation"><option value="feminine" ${g.presentation==="feminine"?"selected":""}>Feminina</option><option value="masculine" ${g.presentation==="masculine"?"selected":""}>Masculina</option><option value="neutral" ${g.presentation==="neutral"?"selected":""}>Neutra</option></select></div><div class="field"><label>Tom de pele</label><div class="swatches">${Object.entries(skinColors).map(([k,v])=>`<button type="button" title="${k}" class="swatch ${c.skin===k?"selected":""}" style="--sw:${v}" data-avatar-prop="skin" data-avatar-value="${k}"></button>`).join("")}</div></div><div class="field"><label>Cor do cabelo</label><div class="swatches">${Object.entries(hairColors).map(([k,v])=>`<button type="button" title="${k}" class="swatch ${c.hairColor===k?"selected":""}" style="--sw:${v}" data-avatar-prop="hairColor" data-avatar-value="${k}"></button>`).join("")}</div></div><div class="field"><label>Olhos</label><div class="segmented">${["dot","bright","sleepy"].map(k=>`<button type="button" class="secondary ${c.eyes===k?"active":""}" data-avatar-prop="eyes" data-avatar-value="${k}">${{dot:"Clássico",bright:"Brilho",sleepy:"Calmo"}[k]}</button>`).join("")}</div></div><div class="field"><label>Cor da roupa</label><div class="swatches">${Object.entries(outfitColors).map(([k,v])=>`<button type="button" title="${k}" class="swatch ${c.outfitColor===k?"selected":""}" style="--sw:${v}" data-avatar-prop="outfitColor" data-avatar-value="${k}"></button>`).join("")}</div></div></div>
  <h3 class="section">Cabelo</h3><div class="avatar-options">${hairs.map(i=>creatorOption("hair",i.item_key,i.name,c.hair)).join("")}</div>
  <h3 class="section">Roupa</h3><div class="avatar-options">${outfits.map(i=>creatorOption("outfit",i.item_key,i.name,c.outfit)).join("")}</div>
  <h3 class="section">Acessório</h3><div class="avatar-options">${creatorOption("accessory","none","Nenhum",c.accessory)}${accessories.map(i=>creatorOption("accessory",i.item_key,i.name,c.accessory)).join("")}</div>
  <div class="actions"><button>Salvar personagem</button></div></form></div></div>`;
}
function questsView(){
  const quests=S.gameQuests.filter(q=>q.starts_on<=today()&&q.ends_on>=today()).sort((a,b)=>a.ends_on.localeCompare(b.ends_on)||a.title.localeCompare(b.title));
  return `<div class="quest-grid">${quests.map(q=>{const v=questValue(q),pct=Math.min(100,Math.round(v/(+q.target_value||1)*100)),ready=v>=+q.target_value&&!q.completed;return `<div class="panel quest-card ${q.completed?"completed":""}"><div class="quest-icon">${q.quest_type.startsWith("weekly")?"◆":"✦"}</div><div class="quest-body"><small>${q.quest_type.startsWith("weekly")?"QUEST SEMANAL":"QUEST DIÁRIA"}</small><h3>${esc(q.title)}</h3><p>${esc(q.description||"")}</p><div class="progress"><span style="width:${pct}%"></span></div><div class="quest-foot"><span>${Math.min(v,+q.target_value)}/${q.target_value}</span><span>+${q.reward_xp} XP · 🪙 ${q.reward_coins}</span></div></div>${q.completed?`<span class="claimed">Concluída ✓</span>`:`<button ${ready?"":"disabled"} data-claim-quest="${q.id}">${ready?"Resgatar":"Em progresso"}</button>`}</div>`}).join("")||`<div class="empty-state">As quests serão geradas automaticamente.</div>`}</div>`;
}
function achievementsView(){
  return `<div class="achievement-grid">${S.achievementDefs.map(a=>{const v=achievementValue(a.achievement_key),got=achievementSet().has(a.achievement_key),pct=Math.min(100,Math.round(v/(+a.target_value||1)*100)),ready=v>=+a.target_value&&!got;return `<div class="panel achievement-card ${got?"unlocked":""}"><div class="achievement-medal">${got?"★":"☆"}</div><div><small>CONQUISTA</small><h3>${esc(a.name)}</h3><p>${esc(a.description)}</p><div class="progress"><span style="width:${pct}%"></span></div><div class="quest-foot"><span>${Math.min(v,+a.target_value)}/${a.target_value}</span><span>+${a.reward_xp} XP · 🪙 ${a.reward_coins}</span></div>${a.title?`<span class="reward-chip">Título: ${esc(a.title)}</span>`:""}${a.item_key?`<span class="reward-chip">Cosmético: ${esc(gameItem(a.item_key)?.name||a.item_key)}</span>`:""}</div>${got?`<button class="secondary" data-equip-title="${esc(a.title||"")}" ${a.title?"":"disabled"}>${a.title&&S.gameProfile?.title===a.title?"Equipado":"Usar título"}</button>`:`<button ${ready?"":"disabled"} data-claim-achievement="${a.achievement_key}">${ready?"Desbloquear":"Em progresso"}</button>`}</div>`}).join("")}</div>`;
}
function shopView(){
  const coins=Number(S.gameProfile?.coins||0),items=S.gameItems.filter(x=>x.unlock_type==="coins");
  return `<div class="shop-head panel"><div><small>SALDO</small><div class="metric">🪙 ${coins}</div></div><p class="muted">Moedas são ganhas por progresso e quests. Os itens são apenas cosméticos.</p></div><div class="shop-grid">${items.map(i=>{const owned=inventorySet().has(i.item_key),ok=coins>=i.price;return `<div class="panel shop-item">${avatarSvg({...avatarConfig(),[i.category==="hair"?"hair":i.category==="outfit"?"outfit":"accessory"]:i.item_key},"shop-avatar")}<div><h3>${esc(i.name)}</h3><p class="muted">${esc(i.description||"")}</p><b>🪙 ${i.price}</b></div><button ${owned||!ok?"disabled":""} data-buy-item="${i.item_key}">${owned?"Adquirido":ok?"Comprar":"Moedas insuficientes"}</button></div>`}).join("")||`<div class="empty-state">Nenhum item à venda no momento.</div>`}</div>`;
}
function rpgOverview(){
  const g=S.gameProfile||{},xi=xpInfo(),attrs=gameAttributes(),activeQuests=S.gameQuests.filter(q=>q.starts_on<=today()&&q.ends_on>=today()),done=activeQuests.filter(q=>q.completed).length;
  return `<div class="rpg-hero panel"><div class="avatar-stage">${avatarSvg(avatarConfig(),"hero-avatar")}</div><div class="rpg-hero-copy"><small>${esc(g.title||rankName(xi.level))}</small><h2>${esc(g.character_name||"Aventureiro")}</h2><div class="level-row"><strong>Nível ${xi.level}</strong><span>🪙 ${g.coins||0}</span></div><div class="xp-line big"><span style="width:${xi.pct}%"></span></div><small>${xi.inside}/${xi.needed} XP para o nível ${xi.level+1} · ${xi.xp} XP total</small><p class="muted">Seu personagem evolui com atividades registradas. Humor, sono ruim ou dias difíceis nunca removem XP.</p></div></div>
  <div class="grid three rpg-summary"><div class="panel"><small>Classe atual</small><div class="metric">${rankName(xi.level)}</div></div><div class="panel"><small>Quests atuais</small><div class="metric">${done}/${activeQuests.length}</div></div><div class="panel"><small>Conquistas</small><div class="metric">${S.gameAchievements.length}/${S.achievementDefs.length}</div></div></div>
  <h2 class="section">Atributos</h2><div class="attribute-grid">${attrs.map(([n,l,d])=>`<div class="panel attribute-card"><span>${esc(n)}</span><b>Lv. ${l}</b><small>${esc(d)}</small></div>`).join("")}</div>
  <h2 class="section">Próximas quests</h2>${questsView()}`;
}
function rpgPage(){
  if(S.profile?.gamification_enabled===false)return `<div class="panel empty-state"><h2>Gamificação desativada</h2><p>Se quiser usar personagem, XP e quests, ative a gamificação em Configurações.</p><button data-enable-game>Ativar gamificação</button></div>`;
  const tabs=[["overview","Visão geral"],["creator","Personagem"],["quests","Quests"],["achievements","Conquistas"],["shop","Loja"]];
  const body={overview:rpgOverview,creator:avatarCreator,quests:questsView,achievements:achievementsView,shop:shopView}[S.rpgTab]();
  return `<div class="rpg-tabs">${tabs.map(([k,n])=>`<button class="secondary ${S.rpgTab===k?"active":""}" data-rpg-tab="${k}">${n}</button>`).join("")}</div>${body}`;
}

const cardLabels={week:"Resumo semanal",sleep:"Sono",habits:"Hábitos",reading:"Leitura",study:"Estudos",goals:"Objetivos",rpg:"Personagem RPG"};
function settingsPage(){
  const p=S.profile||{},g=S.gameProfile||{},cards=Array.isArray(p.dashboard_cards)?p.dashboard_cards:defaultCards,ordered=[...cards,...defaultCards.filter(k=>!cards.includes(k))];
  return `<div class="settings-grid"><div><div class="panel setting-section"><h3>Identidade e personalização</h3><form data-form="profile"><div class="form"><div class="field"><label>Nome do seu espaço</label><input name="app_name" maxlength="40" value="${esc(p.app_name||"Greene")}" required><small>Substitui “Greene” na interface.</small></div><div class="field"><label>Seu nome / apelido</label><input name="display_name" value="${esc(p.display_name||"")}"></div><div class="field"><label>Cor de destaque</label><select name="accent"><option value="sage" ${p.accent==="sage"?"selected":""}>Sage</option><option value="blue" ${p.accent==="blue"?"selected":""}>Blue</option><option value="violet" ${p.accent==="violet"?"selected":""}>Violet</option><option value="amber" ${p.accent==="amber"?"selected":""}>Amber</option><option value="rose" ${p.accent==="rose"?"selected":""}>Rose</option></select></div><div class="field"><label>Gamificação</label><select name="gamification_enabled"><option value="true" ${p.gamification_enabled!==false?"selected":""}>Ativada</option><option value="false" ${p.gamification_enabled===false?"selected":""}>Desativada</option></select></div></div><div class="actions"><button>Salvar personalização</button></div></form></div>
  <div class="panel setting-section"><h3>Dashboard</h3><p class="muted">Escolha os cards e ajuste a ordem.</p><div class="dashboard-config">${ordered.map(k=>{const idx=cards.indexOf(k),on=idx>=0;return `<div class="dash-config-row"><input type="checkbox" data-card-toggle="${k}" ${on?"checked":""}><span>${cardLabels[k]}</span><button class="secondary" data-card-up="${k}" ${!on||idx<=0?"disabled":""}>↑</button><button class="secondary" data-card-down="${k}" ${!on||idx===cards.length-1?"disabled":""}>↓</button></div>`}).join("")}</div></div>
  <div class="panel setting-section"><h3>Conta e segurança</h3><form data-form="password"><div class="field"><label>Nova senha</label><input type="password" name="password" minlength="8" placeholder="Mínimo de 8 caracteres" required></div><div class="actions"><button>Alterar senha</button></div></form><div class="actions" style="justify-content:flex-start"><button class="secondary" data-send-reset>Enviar e-mail de redefinição</button></div></div>
  <div class="panel setting-section danger-zone"><h3>Zona de perigo</h3><p class="muted">A exclusão remove a conta e os dados vinculados. Faça um backup antes.</p><button class="danger" data-delete-account>Excluir minha conta</button></div></div>
  <div><div class="panel setting-section"><h3>Personagem RPG</h3><div class="avatar-settings">${avatarSvg(avatarConfig(),"settings-avatar")}<div><strong>${esc(g.character_name||p.display_name||"Aventureiro")}</strong><p class="muted">${esc(g.title||rankName(g.level||1))} · Nível ${g.level||1} · 🪙 ${g.coins||0}</p><button data-open-rpg> abrir criador de personagem</button></div></div><p class="muted">O criador inclui apresentação feminina, masculina e neutra, roupas, cabelos, acessórios e desbloqueios por progresso.</p></div>
  <div class="panel setting-section"><h3>Backup e portabilidade</h3><p class="muted">O backup completo exporta os dados das tabelas em JSON. Arquivos anexados continuam no Storage e aparecem no backup como metadados/caminhos.</p><button data-full-export>Gerar backup completo</button></div>
  <div class="panel setting-section"><h3>Notas</h3><p class="muted">Pastas, Inbox, templates, nota diária, Markdown, backlinks, relações e anexos estão ativos. O carregamento é paginado para manter a interface rápida.</p></div></div></div>`;
}
function headerConfig(){
  return {today:["＋ Registrar","registerTop"],calendar:null,habits:["＋ Novo hábito","habitCreate"],notes:["＋ Nova nota","newNote"],books:["＋ Novo livro","bookCreate"],studies:["＋ Registrar estudo","studyCreate"],goals:["＋ Novo objetivo","goalCreate"],rpg:null,analysis:null,settings:null}[S.view];
}
function render(){
  const names={today:S.selected===today()?"Hoje":toDate(S.selected).toLocaleDateString("pt-BR",{day:"numeric",month:"long"}),calendar:"Calendário",habits:"Hábitos",notes:"Notas",books:"Leituras",studies:"Estudos",goals:"Objetivos",rpg:"Personagem",analysis:"Análises",settings:"Configurações"};
  $("#pageTitle").textContent=names[S.view]||"";document.querySelectorAll("[data-go]").forEach(x=>x.classList.toggle("active",x.dataset.go===S.view));
  const pages={today:todayPage,calendar:calendarPage,habits:habitsPage,notes:notesPage,books:booksPage,studies:studiesPage,goals:goalsPage,rpg:rpgPage,analysis:analysisPage,settings:settingsPage};
  $("#content").innerHTML=pages[S.view]();
  const hc=headerConfig(),btn=$("#headerAction");if(!hc)btn.classList.add("hidden");else{btn.classList.remove("hidden");btn.textContent=hc[0];btn.dataset.target=hc[1]}
}
async function go(view){
  if(S.view==="notes")await flushNoteSave(); S.view=view;if(view==="today")S.selected=today();
  if(view==="calendar"||view==="habits")await ensureMonth(S.selected);
  if(view==="analysis"&&!S.analytics){skeleton();await loadAnalytics();}
  if(view==="goals")await ensureAutoGoalData();
  if(view==="rpg")await syncGame(true);
  if(view==="notes"){
    if(!S.selectedNote){const n=S.notes[0];if(n)S.selectedNote=n.id} if(S.selectedNote)await loadNoteContent(S.selectedNote);
  }
  render();
}
function openPalette(){renderCommands("");$("#palette").classList.remove("hidden");$("#palette").setAttribute("aria-hidden","false");setTimeout(()=>$("#commandInput").focus(),20)}
function closePalette(){$("#palette").classList.add("hidden");$("#palette").setAttribute("aria-hidden","true");$("#commandInput").value=""}
function renderCommands(q){
  q=(q||"").trim().toLowerCase();const actions=[["Nova nota","Criar nota","notes","newnote"],["Nota diária","Abrir/criar hoje","notes","daily"],["Registrar leitura","Abrir Hoje","today",""],["Registrar estudo","Abrir Estudos","studies",""],["Marcar hábito","Abrir Hábitos","habits",""],["Abrir calendário","Calendário","calendar",""],["Personagem RPG","XP, quests e avatar","rpg",""],["Configurações","Personalizar","settings",""]];
  let results=actions.filter(x=>!q||x.join(" ").toLowerCase().includes(q)).map(x=>`<button class="command-item" data-command="${x[2]}" data-command-action="${x[3]}"><span>${x[0]}</span><small>${x[1]}</small></button>`);
  if(q){results.push(...S.notes.filter(n=>(n.title+" "+(n.tags||[]).join(" ")).toLowerCase().includes(q)).slice(0,8).map(n=>`<button class="command-item" data-note-open="${n.id}"><span>▤ ${esc(n.title)}</span><small>Nota</small></button>`),...S.books.filter(b=>(b.title+" "+(b.author||"")).toLowerCase().includes(q)).slice(0,4).map(b=>`<button class="command-item" data-command="books"><span>▥ ${esc(b.title)}</span><small>Livro</small></button>`),...S.studies.filter(s=>(s.subject+" "+(s.learned||"")).toLowerCase().includes(q)).slice(0,4).map(s=>`<button class="command-item" data-command="studies"><span>◷ ${esc(s.subject)}</span><small>Estudo</small></button>`));}
  $("#commandResults").innerHTML=`<div class="command-results">${results.join("")||"<div class='muted' style='padding:12px'>Nenhum resultado.</div>"}</div>`;
}
async function updateDashboardCards(cards){
  const {data,error}=await sb.from("profiles").update({dashboard_cards:cards,updated_at:new Date().toISOString()}).eq("user_id",S.user.id).select().single();if(error)return toast(error.message);S.profile=data;render();
}
async function exportAll(){
  toast("Preparando backup…",5000);const tables=["daily_entries","sleep_entries","habits","habit_logs","books","studies","goals","reading_logs","exercise_logs","journal_entries","notes","note_attachments","note_folders","note_templates","note_relations","profiles","game_profiles","game_inventory","game_user_achievements","game_quests","game_quest_progress"],out={version:"2.3",exported_at:new Date().toISOString(),user_email:S.user.email,data:{}};
  try{for(const t of tables)out.data[t]=await fetchPaged(t,q=>q);}catch(e){toast("Falha no backup: "+e.message);return}
  const blob=new Blob([JSON.stringify(out,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${(S.profile?.app_name||"greene").toLowerCase().replace(/[^a-z0-9]+/g,"-")}-backup-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast("Backup gerado");
}
document.addEventListener("click", async (e)=>{
  const g=e.target.closest("[data-go]"); if(g){await go(g.dataset.go);return}
  if(e.target.closest("[data-palette]")){openPalette();return}
  const openRpg=e.target.closest("[data-open-rpg]");if(openRpg){S.rpgTab="overview";await go("rpg");return}
  const rt=e.target.closest("[data-rpg-tab]");if(rt){S.rpgTab=rt.dataset.rpgTab;render();return}
  if(e.target.closest("[data-enable-game]")){const {data,error}=await sb.from("profiles").update({gamification_enabled:true,updated_at:new Date().toISOString()}).eq("user_id",S.user.id).select().single();if(error)return toast(error.message);S.profile=data;await syncGame(true);S.rpgTab="overview";render();return}
  const ap=e.target.closest("[data-avatar-prop]");if(ap){captureAvatarForm();S.gameProfile.avatar_config={...avatarConfig(),[ap.dataset.avatarProp]:ap.dataset.avatarValue};render();return}
  const ai=e.target.closest("[data-avatar-item]");if(ai){captureAvatarForm();if(ai.dataset.locked==="true"){const item=gameItem(ai.dataset.avatarItem);toast(unlockText(item)||"Item bloqueado");return}const item=gameItem(ai.dataset.avatarItem),prop=ai.dataset.avatarItem==="none"?"accessory":item?.category==="hair"?"hair":item?.category==="outfit"?"outfit":"accessory";S.gameProfile.avatar_config={...avatarConfig(),[prop]:ai.dataset.avatarItem};render();return}
  if(e.target.closest("[data-random-avatar]")){captureAvatarForm();const choose=a=>a[Math.floor(Math.random()*a.length)],usable=cat=>S.gameItems.filter(i=>i.category===cat&&canUseItem(i.item_key)),hs=usable("hair"),os=usable("outfit"),acs=usable("accessory");if(!hs.length||!os.length)return toast("Catálogo do personagem ainda não carregou");S.gameProfile.avatar_config={...avatarConfig(),skin:choose(Object.keys(skinColors)),hairColor:choose(Object.keys(hairColors)),outfitColor:choose(Object.keys(outfitColors)),eyes:choose(["dot","bright","sleepy"]),hair:choose(hs).item_key,outfit:choose(os).item_key,accessory:Math.random()<.3?"none":choose([{item_key:"none"},...acs]).item_key};render();return}
  const cq=e.target.closest("[data-claim-quest]");if(cq){const old=S.gameProfile?.level||1, {data,error}=await sb.rpc("claim_game_quest",{p_quest_id:cq.dataset.claimQuest});if(error)return toast(error.message);if(data)S.gameProfile=data;await sb.rpc("refresh_my_game_quests",{p_today:today()});await loadGameData();if((S.gameProfile?.level||1)>old)showLevelUp(S.gameProfile.level);render();toast("Recompensa resgatada");return}
  const ca=e.target.closest("[data-claim-achievement]");if(ca){const old=S.gameProfile?.level||1,{data,error}=await sb.rpc("claim_game_achievement",{p_key:ca.dataset.claimAchievement});if(error)return toast(error.message);if(data)S.gameProfile=data;await loadGameData();if((S.gameProfile?.level||1)>old)showLevelUp(S.gameProfile.level);render();toast("Conquista desbloqueada");return}
  const bi=e.target.closest("[data-buy-item]");if(bi){const {data,error}=await sb.rpc("purchase_game_item",{p_item_key:bi.dataset.buyItem});if(error)return toast(error.message);if(data)S.gameProfile=data;await loadGameData();render();toast("Item adquirido");return}
  const et=e.target.closest("[data-equip-title]");if(et&&et.dataset.equipTitle){const title=et.dataset.equipTitle;if(!S.gameAchievements.some(a=>S.achievementDefs.find(d=>d.achievement_key===a.achievement_key)?.title===title))return toast("Título ainda bloqueado");const {data,error}=await sb.from("game_profiles").update({title,updated_at:new Date().toISOString()}).eq("user_id",S.user.id).select().single();if(error)return toast(error.message);S.gameProfile=data;render();return}
  if(e.target.id==="levelUp"||e.target.closest("[data-level-close]")){document.querySelector("#levelUp")?.remove();return}
  const r=e.target.closest("[data-rate]"); if(r){const f=r.closest("form");f.querySelectorAll(`[data-rate="${r.dataset.rate}"]`).forEach(x=>x.classList.remove("on"));r.classList.add("on");f.querySelector(`[name="${r.dataset.rate}"]`).value=r.dataset.v;return}
  const d=e.target.closest("[data-del]"); if(d){const row=(S[stateKey[d.dataset.del]]||[]).find(x=>x.id===d.dataset.id);const ok=await deleteLocal(d.dataset.del,d.dataset.id,true);if(ok&&d.dataset.del==="habits")S.habit_logs=S.habit_logs.filter(x=>x.habit_id!==row?.id);if(ok&&d.dataset.del==="books")S.reading_logs=S.reading_logs.filter(x=>x.book_id!==row?.id);if(ok)render();return}
  const t=e.target.closest("[data-toggle]"); if(t){const old=S.habit_logs.find(x=>x.habit_id===t.dataset.toggle&&x.date===t.dataset.date);if(old){const {error}=await sb.from("habit_logs").delete().eq("id",old.id);if(error)return toast(error.message);S.habit_logs=S.habit_logs.filter(x=>x.id!==old.id)}else{const {data,error}=await sb.from("habit_logs").insert({user_id:S.user.id,habit_id:t.dataset.toggle,date:t.dataset.date,completed:true}).select().single();if(error)return toast(error.message);mergeRows("habit_logs",[data])}scheduleGameSync();render();return}
  const dt=e.target.closest("[data-date]"); if(dt){S.selected=dt.dataset.date;await ensureMonth(S.selected);S.view="today";render();return}
  const mo=e.target.closest("[data-month]"); if(mo){const d0=toDate(S.selected);d0.setMonth(d0.getMonth()+(+mo.dataset.month));d0.setDate(1);S.selected=iso(d0);await ensureMonth(S.selected);render();return}
  const ni=e.target.closest("[data-note]"); if(ni){await flushNoteSave();S.selectedNote=ni.dataset.note;S.notePreview=false;S.backlinks=[];await loadNoteContent(S.selectedNote);render();return}
  if(e.target.closest("[data-new-note]")){await newNote();return}
  const daily=e.target.closest("[data-daily-note]"); if(daily){await openDailyNote(daily.dataset.dailyNote||today());return}
  if(e.target.closest("[data-new-from-template]")){await newNote($("#templateSelect")?.value||null);return}
  const nf=e.target.closest("[data-note-filter]"); if(nf){S.noteFilter=nf.dataset.noteFilter;S.selectedNote=filteredNotes()[0]?.id||null;if(S.selectedNote)await loadNoteContent(S.selectedNote);render();return}
  if(e.target.closest("[data-load-more-notes]")){S.notesPage++;await loadNotes(false);render();return}
  if(e.target.closest("[data-new-folder]")){const name=prompt("Nome da nova pasta:")?.trim();if(!name)return;const {data,error}=await sb.from("note_folders").insert({user_id:S.user.id,name}).select().single();if(error)return toast(error.message);S.note_folders.push(data);S.note_folders.sort((a,b)=>a.name.localeCompare(b.name));render();return}
  const fd=e.target.closest("[data-folder-delete]"); if(fd&&confirm("Excluir esta pasta? As notas voltarão para a Inbox.")){const id=fd.dataset.folderDelete,{error}=await sb.from("note_folders").delete().eq("id",id);if(error)return toast(error.message);S.note_folders=S.note_folders.filter(x=>x.id!==id);S.notes.forEach(n=>{if(n.folder_id===id)n.folder_id=null});if(S.noteFilter===`folder:${id}`)S.noteFilter="inbox";render();return}
  const nm=e.target.closest("[data-note-mode]"); if(nm){await flushNoteSave();S.notePreview=nm.dataset.noteMode==="preview";render();return}
  const fmt=e.target.closest("[data-format]"); if(fmt){applyFormat(fmt.dataset.format);return}
  const wiki=e.target.closest("[data-wiki]"); if(wiki){const name=wiki.dataset.wiki.trim();let n=S.notes.find(x=>x.title.trim().toLowerCase()===name.toLowerCase());if(!n){const {data}=await sb.from("notes").select("id,user_id,title,tags,is_favorite,folder_id,note_type,linked_date,created_at,updated_at").ilike("title",name).limit(1).maybeSingle();n=data;if(n&&!S.notes.some(x=>x.id===n.id))S.notes.unshift(n)}if(n){await flushNoteSave();S.selectedNote=n.id;S.notePreview=false;await loadNoteContent(n.id);render()}else toast("Nota vinculada ainda não existe");return}
  const fav=e.target.closest("[data-fav]"); if(fav){await flushNoteSave();const n=S.notes.find(x=>x.id===fav.dataset.fav),old=n.is_favorite;n.is_favorite=!old;render();const {error}=await sb.from("notes").update({is_favorite:n.is_favorite,updated_at:new Date().toISOString()}).eq("id",n.id);if(error){n.is_favorite=old;render();toast(error.message)}return}
  const st=e.target.closest("[data-save-template]"); if(st){await flushNoteSave();const n=S.notes.find(x=>x.id===st.dataset.saveTemplate),name=prompt("Nome do template:",n?.title||"Novo template")?.trim();if(!name)return;const payload={user_id:S.user.id,name,content:S.noteContent[n.id]||"",tags:n.tags||[]};const {data,error}=await sb.from("note_templates").insert(payload).select().single();if(error)return toast(error.message);S.note_templates.unshift(data);render();toast("Template criado");return}
  const td=e.target.closest("[data-template-delete]"); if(td&&confirm("Excluir este template?")){const {error}=await sb.from("note_templates").delete().eq("id",td.dataset.templateDelete);if(error)return toast(error.message);S.note_templates=S.note_templates.filter(x=>x.id!==td.dataset.templateDelete);render();return}
  const nd=e.target.closest("[data-note-delete]"); if(nd&&confirm("Excluir esta nota e seus anexos?")){clearTimeout(noteSaveTimer);noteSaveTimer=null;const id=nd.dataset.noteDelete,atts=S.note_attachments.filter(a=>a.note_id===id);S.notes=S.notes.filter(x=>x.id!==id);S.note_attachments=S.note_attachments.filter(x=>x.note_id!==id);S.note_relations=S.note_relations.filter(x=>x.note_id!==id);delete S.noteContent[id];S.selectedNote=filteredNotes()[0]?.id||S.notes[0]?.id||null;render();const {error}=await sb.from("notes").delete().eq("id",id);if(error){toast(error.message);await loadNotes(true);render();return}if(atts.length)sb.storage.from("notes-attachments").remove(atts.map(a=>a.storage_path));if(S.selectedNote)await loadNoteContent(S.selectedNote);scheduleGameSync();render();toast("Nota excluída");return}
  const ao=e.target.closest("[data-attachment-open]"); if(ao){const a=S.note_attachments.find(x=>x.id===ao.dataset.attachmentOpen),{data,error}=await sb.storage.from("notes-attachments").createSignedUrl(a.storage_path,3600);if(error)return toast(error.message);window.open(data.signedUrl,"_blank","noopener");return}
  const ad=e.target.closest("[data-attachment-delete]"); if(ad&&confirm("Excluir este anexo?")){const a=S.note_attachments.find(x=>x.id===ad.dataset.attachmentDelete);const {error}=await sb.from("note_attachments").delete().eq("id",a.id);if(error)return toast(error.message);S.note_attachments=S.note_attachments.filter(x=>x.id!==a.id);render();await sb.storage.from("notes-attachments").remove([a.storage_path]);toast("Anexo excluído");return}
  if(e.target.closest("[data-add-relation]")){const raw=$("#relationTarget")?.value;if(!raw||!S.selectedNote)return;const [type,val]=raw.split(":"),payload={user_id:S.user.id,note_id:S.selectedNote,entity_type:type,label:null};if(type==="day")payload.entity_date=val;else payload.entity_id=val;const {data,error}=await sb.from("note_relations").insert(payload).select().single();if(error)return toast(error.message);S.note_relations.unshift(data);render();return}
  const rd=e.target.closest("[data-relation-delete]"); if(rd){const {error}=await sb.from("note_relations").delete().eq("id",rd.dataset.relationDelete);if(error)return toast(error.message);S.note_relations=S.note_relations.filter(x=>x.id!==rd.dataset.relationDelete);render();return}
  const range=e.target.closest("[data-range]"); if(range){S.analyticsRange=range.dataset.range==="custom"?"custom":+range.dataset.range;if(S.analyticsRange==="custom"){const [a,b]=rangeDates();S.analyticsCustomStart=a;S.analyticsCustomEnd=b}S.analytics=null;skeleton();await loadAnalytics();render();return}
  if(e.target.closest("[data-apply-range]")){S.analyticsCustomStart=$("#analysisStart").value;S.analyticsCustomEnd=$("#analysisEnd").value;if(!S.analyticsCustomStart||!S.analyticsCustomEnd||S.analyticsCustomStart>S.analyticsCustomEnd)return toast("Verifique o período");S.analytics=null;skeleton();await loadAnalytics();render();return}
  const ct=e.target.closest("[data-card-toggle]"); if(ct){let cards=Array.isArray(S.profile.dashboard_cards)?[...S.profile.dashboard_cards]:[...defaultCards];if(ct.checked){if(!cards.includes(ct.dataset.cardToggle))cards.push(ct.dataset.cardToggle)}else cards=cards.filter(x=>x!==ct.dataset.cardToggle);await updateDashboardCards(cards);return}
  const up=e.target.closest("[data-card-up]"); if(up){const cards=[...S.profile.dashboard_cards],i=cards.indexOf(up.dataset.cardUp);if(i>0){[cards[i-1],cards[i]]=[cards[i],cards[i-1]];await updateDashboardCards(cards)}return}
  const down=e.target.closest("[data-card-down]"); if(down){const cards=[...S.profile.dashboard_cards],i=cards.indexOf(down.dataset.cardDown);if(i>=0&&i<cards.length-1){[cards[i+1],cards[i]]=[cards[i],cards[i+1]];await updateDashboardCards(cards)}return}
  if(e.target.closest("[data-send-reset]")){const {error}=await sb.auth.resetPasswordForEmail(S.user.email,{redirectTo:location.origin+location.pathname});toast(error?error.message:"E-mail de redefinição enviado");return}
  if(e.target.closest("[data-full-export]")){await exportAll();return}
  if(e.target.closest("[data-delete-account]")){const code=prompt('Digite EXCLUIR para apagar sua conta e seus dados:');if(code!=="EXCLUIR")return;toast("Excluindo conta…",5000);try{const atts=await fetchPaged("note_attachments");for(let i=0;i<atts.length;i+=100){const paths=atts.slice(i,i+100).map(x=>x.storage_path);if(paths.length)await sb.storage.from("notes-attachments").remove(paths)}const {error}=await sb.rpc("delete_my_account");if(error)throw error;await sb.auth.signOut();toast("Conta excluída")}catch(err){toast("Falha: "+err.message,4000)}return}
  const ci=e.target.closest("[data-command]"); if(ci){closePalette();if(ci.dataset.commandAction==="newnote")return newNote();if(ci.dataset.commandAction==="daily")return openDailyNote();await go(ci.dataset.command);return}
  const no=e.target.closest("[data-note-open]"); if(no){closePalette();S.view="notes";S.selectedNote=no.dataset.noteOpen;await loadNoteContent(S.selectedNote);render();return}
  if(e.target===$("#palette")){closePalette();return}
});

document.addEventListener("submit", async (e)=>{
  const f=e.target.closest("[data-form]");if(!f)return;e.preventDefault();const x=Object.fromEntries(new FormData(f)),t=f.dataset.form;
  if(t==="daily"){["energy","mood","focus","stress"].forEach(k=>x[k]=+x[k]);await upsertDateLocal("daily_entries",x);return}
  if(t==="sleep"){x.quality=+x.quality;x.awakenings=0;await upsertDateLocal("sleep_entries",x);return}
  if(t==="habit"){const d=await insertLocal("habits",{name:x.name.trim(),active:true});if(d)render();return}
  if(t==="book"){x.pages=+x.pages||0;x.current_page=0;x.rating=3;const d=await insertLocal("books",x);if(d)render();return}
  if(t==="reading"){x.pages_read=+x.pages_read;x.minutes=x.minutes?+x.minutes:null;const d=await insertLocal("reading_logs",x);if(d)render();return}
  if(t==="exercise"){x.minutes=x.minutes?+x.minutes:null;x.intensity=+x.intensity;const d=await insertLocal("exercise_logs",x);if(d)render();return}
  if(t==="study"){x.minutes=+x.minutes;const d=await insertLocal("studies",x);if(d)render();return}
  if(t==="goal"){const auto=x.goal_mode==="auto",payload={title:x.title,deadline:x.deadline||null,progress:auto?0:(+x.progress||0),notes:x.notes||null,date:today(),status:"Ativo",auto_track:auto,metric:auto?x.metric:null,target_value:auto?(+x.target_value||1):null,period:auto?x.period:"all",start_date:today()};const d=await insertLocal("goals",payload);if(d)render();return}
  if(t==="journal"){x.tags=x.tags?x.tags.split(",").map(s=>s.trim()).filter(Boolean):[];await upsertDateLocal("journal_entries",x);return}
  if(t==="note"){clearTimeout(noteSaveTimer);noteSaveTimer=null;x.tags=x.tags?x.tags.split(",").map(s=>s.trim()).filter(Boolean):[];x.folder_id=x.folder_id||null;await persistNote(f.dataset.id,x);render();return}
  if(t==="profile"){const payload={app_name:x.app_name.trim(),display_name:x.display_name.trim()||null,accent:x.accent,gamification_enabled:x.gamification_enabled==="true",updated_at:new Date().toISOString()};const {data,error}=await sb.from("profiles").update(payload).eq("user_id",S.user.id).select().single();if(error)return toast(error.message);S.profile=data;applyProfile();if(S.profile.gamification_enabled)await syncGame(true);render();toast("Personalização salva");return}
  if(t==="game-profile"){const payload={character_name:x.character_name.trim(),presentation:x.presentation,avatar_config:avatarConfig(),updated_at:new Date().toISOString()};const {data,error}=await sb.from("game_profiles").update(payload).eq("user_id",S.user.id).select().single();if(error)return toast(error.message);S.gameProfile=data;render();toast("Personagem salvo");return}
  if(t==="password"){if((x.password||"").length<8)return toast("Use pelo menos 8 caracteres");const {error}=await sb.auth.updateUser({password:x.password});toast(error?error.message:"Senha alterada");if(!error)f.reset();return}
});

document.addEventListener("input",(e)=>{
  if(e.target.id==="commandInput")renderCommands(e.target.value);
  if(e.target.id==="noteSearch"){const q=e.target.value.toLowerCase();document.querySelectorAll(".note-item[data-note]").forEach(el=>{const n=S.notes.find(x=>x.id===el.dataset.note);el.style.display=!q||(n?.title+" "+(n?.tags||[]).join(" ")).toLowerCase().includes(q)?"":"none"})}
  if(e.target.closest('form[data-form="note"]')&&["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName))scheduleNoteSave();
});

document.addEventListener("change", async (e)=>{
  if(e.target.closest('form[data-form="game-profile"]')&&e.target.name==="presentation"){captureAvatarForm();render();return}
  if(e.target.id!=="attachmentInput"||!e.target.files?.[0]||!S.selectedNote)return;
  const file=e.target.files[0];if(file.size>20*1024*1024)return toast("Limite de 20 MB por arquivo");const safe=file.name.replace(/[^\w.\-]+/g,"_"),path=`${S.user.id}/${S.selectedNote}/${Date.now()}-${safe}`;toast("Enviando anexo…",4000);
  const {error}=await sb.storage.from("notes-attachments").upload(path,file,{upsert:false});if(error)return toast(error.message);const {data:att,error:dbErr}=await sb.from("note_attachments").insert({user_id:S.user.id,note_id:S.selectedNote,file_name:file.name,storage_path:path,mime_type:file.type||null,size_bytes:file.size}).select().single();if(dbErr){await sb.storage.from("notes-attachments").remove([path]);return toast(dbErr.message)}S.note_attachments.unshift(att);render();toast("Anexo enviado");
});

$("#headerAction").onclick=async()=>{const target=$("#headerAction").dataset.target;if(target==="newNote")return newNote();document.getElementById(target)?.scrollIntoView({behavior:"smooth",block:"start"});setTimeout(()=>document.querySelector(`#${target} input`)?.focus(),250)};
document.addEventListener("keydown",async(e)=>{const inNote=e.target?.classList?.contains("note-content");if(inNote&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="b"){e.preventDefault();applyFormat("bold");return}if(inNote&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="i"){e.preventDefault();applyFormat("italic");return}if(S.view==="notes"&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();clearTimeout(noteSaveTimer);noteSaveTimer=null;const x=currentNotePayload();if(x)await persistNote(x.id,x.payload);return}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openPalette()}if(e.key==="Escape"&&!$("#palette").classList.contains("hidden"))closePalette()});

$("#theme").onclick=()=>{const n=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=n;localStorage.setItem("greene-theme",n)};
$("#login").onclick=async()=>{if(!sb)return $("#authmsg").textContent="Configure o config.js.";const {error}=await sb.auth.signInWithPassword({email:$("#email").value,password:$("#password").value});if(error)$("#authmsg").textContent=error.message};
$("#signup").onclick=async()=>{if(!sb)return $("#authmsg").textContent="Configure o config.js.";const {error}=await sb.auth.signUp({email:$("#email").value,password:$("#password").value});$("#authmsg").textContent=error?error.message:"Conta criada. Confirme seu e-mail, se solicitado."};
$("#forgot").onclick=async()=>{if(!sb)return $("#authmsg").textContent="Configure o config.js.";const email=$("#email").value;if(!email)return $("#authmsg").textContent="Digite seu e-mail primeiro.";const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});$("#authmsg").textContent=error?error.message:"Enviamos o link de redefinição, se o e-mail estiver cadastrado."};
$("#logout").onclick=async()=>{if(S.view==="notes")await flushNoteSave();await sb?.auth.signOut()};
$("#export").onclick=exportAll;

if(sb)sb.auth.onAuthStateChange(async(event,session)=>{
  S.user=session?.user||null;$("#auth").classList.toggle("hidden",!!S.user);$("#shell").classList.toggle("hidden",!S.user);
  if(S.user){skeleton();try{await load();if(event==="PASSWORD_RECOVERY")S.view="settings";render();if(event==="PASSWORD_RECOVERY")toast("Defina sua nova senha em Configurações",3500)}catch(err){console.error(err);toast("Erro ao carregar: "+err.message,5000)}}
});
