import{createClient}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const C=window.GREENE_CONFIG||{},valid=C.SUPABASE_URL?.startsWith("https://")&&!C.SUPABASE_ANON_KEY?.startsWith("COLE_"),sb=valid?createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY):null;
const $=s=>document.querySelector(s),today=()=>new Date().toISOString().slice(0,10),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])),avg=a=>a.length?(a.reduce((x,y)=>x+(+y||0),0)/a.length).toFixed(1):"—";
let S={user:null,view:"today",selected:today(),selectedNote:null,notePreview:false,daily:[],sleep:[],habits:[],habit_logs:[],books:[],studies:[],goals:[],reading_logs:[],exercise_logs:[],journal_entries:[],notes:[],note_attachments:[]};

const nav=[["CORE"],["today","⌂ Hoje"],["calendar","▦ Calendário"],["habits","✓ Hábitos"],["notes","▤ Notas"],["TRACK"],["books","▥ Leituras"],["studies","◷ Estudos"],["goals","◎ Objetivos"],["ANALYSIS"],["analysis","⌁ Análises"]];
$("#desktopNav").innerHTML=nav.map(x=>x.length===1?`<div class=nav-group>${x[0]}</div>`:`<button class=nav data-go="${x[0]}">${x[1]}</button>`).join("");
$("#mobileNav").innerHTML=[["today","⌂","Hoje"],["calendar","▦","Calendário"],["palette","+",""],["notes","▤","Notas"],["analysis","⌁","Análises"]].map(x=>x[0]==="palette"?`<button class="mobile plus" data-palette>＋</button>`:`<button class=mobile data-go="${x[0]}">${x[1]}<br>${x[2]}</button>`).join("");
$("#dateText").textContent=new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});

function toast(m){$("#toast").textContent=m;$("#toast").style.display="block";setTimeout(()=>$("#toast").style.display="none",1700)}
function skeleton(){$("#content").innerHTML=`<div class=skeleton-grid><div class=skeleton></div><div class=skeleton></div><div class=skeleton></div></div>`}
async function load(){
  const tables=[["daily_entries","daily","date"],["sleep_entries","sleep","date"],["habits","habits","created_at"],["habit_logs","habit_logs","date"],["books","books","created_at"],["studies","studies","date"],["goals","goals","date"],["reading_logs","reading_logs","date"],["exercise_logs","exercise_logs","date"],["journal_entries","journal_entries","date"],["notes","notes","updated_at"],["note_attachments","note_attachments","created_at"]];
  for(const[t,k,o]of tables){let{data,error}=await sb.from(t).select("*").order(o,{ascending:false});if(!error)S[k]=data||[]}
  if(S.selectedNote&&!S.notes.some(n=>n.id===S.selectedNote))S.selectedNote=null;
}
async function add(t,x){let{data,error}=await sb.from(t).insert({...x,user_id:S.user.id}).select().single();if(error){toast(error.message);return null}await load();render();toast("Salvo");return data}
async function upDate(t,x){let{error}=await sb.from(t).upsert({...x,user_id:S.user.id},{onConflict:"user_id,date"});if(error)return toast(error.message);await load();render();toast("Salvo")}
async function remove(t,id,ask=true){if(ask&&!confirm("Excluir este registro?"))return false;let{error}=await sb.from(t).delete().eq("id",id);if(error){toast(error.message);return false}await load();render();return true}
function rate(n,v=3){return`<input type=hidden name="${n}" value="${v}"><div class=ratings>${[1,2,3,4,5].map(i=>`<button type=button data-rate="${n}" data-v="${i}" class="${+v===i?"on":""}">${i}</button>`).join("")}</div>`}
function hours(x){if(!x?.bed_time||!x?.wake_time)return 0;let[a,b]=x.bed_time.split(":").map(Number),[c,d]=x.wake_time.split(":").map(Number),m=c*60+d-a*60-b;return(m<=0?m+1440:m)/60}
function dataOf(date){return{d:S.daily.find(x=>x.date===date),s:S.sleep.find(x=>x.date===date),h:S.habit_logs.filter(x=>x.date===date&&x.completed),r:S.reading_logs.filter(x=>x.date===date),st:S.studies.filter(x=>x.date===date),e:S.exercise_logs.filter(x=>x.date===date),j:S.journal_entries.find(x=>x.date===date)}}
function toDate(s){return new Date(s+"T12:00:00")}
function monthKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`}
function daysInMonth(date){let d=toDate(date);return new Date(d.getFullYear(),d.getMonth()+1,0).getDate()}
function habitDone(hid,date){return S.habit_logs.some(x=>x.habit_id===hid&&x.date===date&&x.completed)}
function habitStats(h){
  let logs=S.habit_logs.filter(x=>x.habit_id===h.id&&x.completed).map(x=>x.date).sort(),set=new Set(logs),d=new Date(),streak=0;
  for(let i=0;i<5000;i++){let ds=d.toISOString().slice(0,10);if(set.has(ds)){streak++;d.setDate(d.getDate()-1)}else if(i===0){d.setDate(d.getDate()-1)}else break}
  let best=0,cur=0,prev=null;for(const ds of logs){let dd=toDate(ds);if(prev&&Math.round((dd-prev)/86400000)===1)cur++;else cur=1;best=Math.max(best,cur);prev=dd}
  let mk=monthKey(toDate(S.selected)),monthCount=logs.filter(x=>x.startsWith(mk)).length,elapsed=toDate(S.selected).getMonth()===new Date().getMonth()&&toDate(S.selected).getFullYear()===new Date().getFullYear()?new Date().getDate():daysInMonth(S.selected);
  return{streak,best,monthCount,rate:elapsed?Math.round(monthCount/elapsed*100):0}
}
function markdown(src){
  let s=esc(src||"");
  s=s.replace(/^### (.*)$/gm,"<h3>$1</h3>").replace(/^## (.*)$/gm,"<h2>$1</h2>").replace(/^# (.*)$/gm,"<h1>$1</h1>");
  s=s.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\*(.*?)\*/g,"<em>$1</em>").replace(/`([^`]+)`/g,"<code>$1</code>");
  s=s.replace(/^> (.*)$/gm,"<blockquote>$1</blockquote>").replace(/^- (.*)$/gm,"• $1");
  s=s.replace(/\[\[([^\]]+)\]\]/g,(_,name)=>`<button class=wikilink data-wiki="${esc(name)}">[[${esc(name)}]]</button>`);
  return s.replace(/\n/g,"<br>");
}
function todayPage(){
  let q=dataOf(S.selected),hs=S.habits.filter(x=>x.active);
  return`<div id=registerTop class="grid two"><div class="panel hoverable"><h3>Como você está?</h3><form data-form=daily><input type=hidden name=date value="${S.selected}"><div class=form>${[["energy","Energia"],["mood","Humor"],["focus","Foco"],["stress","Estresse"]].map(([n,l])=>`<div class=field><label>${l}</label>${rate(n,q.d?.[n]||3)}</div>`).join("")}<div class="field full"><label>Nota rápida</label><textarea name=notes rows=3>${esc(q.d?.notes)}</textarea></div></div><div class=actions><button>Salvar check-in</button></div></form></div>
  <div class="panel hoverable"><h3>Resumo do dia</h3><p class=muted>${q.s?`Sono: ${hours(q.s).toFixed(1)}h · qualidade ${q.s.quality}/5`:"Sono ainda não registrado."}</p><p class=muted>Hábitos: ${q.h.length}/${hs.length}</p><p class=muted>Leitura: ${q.r.reduce((a,x)=>a+x.pages_read,0)} páginas</p><p class=muted>Estudo: ${q.st.reduce((a,x)=>a+x.minutes,0)} min</p><p class=muted>Exercício: ${q.e.reduce((a,x)=>a+(x.minutes||0),0)} min</p></div></div>
  <h2 class=section>Hábitos de hoje</h2><div class=list>${hs.map(h=>{let l=q.h.find(x=>x.habit_id===h.id);return`<div class=row><strong>${esc(h.name)}</strong><button class="check-btn ${l?"done":"secondary"}" data-toggle="${h.id}" data-date="${S.selected}">${l?"Concluído ✓":"Marcar"}</button></div>`}).join("")||"<p class=muted>Crie hábitos na seção Hábitos.</p>"}</div>
  <h2 class=section>Registro rápido</h2><div class=quick-grid><div class=panel><h3>Sono</h3><form data-form=sleep><input type=hidden name=date value="${S.selected}"><div class=field><label>Dormi às</label><input type=time name=bed_time value="${q.s?.bed_time||""}" required></div><div class=field><label>Acordei às</label><input type=time name=wake_time value="${q.s?.wake_time||""}" required></div><div class=field><label>Qualidade</label>${rate("quality",q.s?.quality||3)}</div><div class=actions><button>Salvar</button></div></form></div>
  <div class=panel><h3>Leitura</h3><form data-form=reading><input type=hidden name=date value="${S.selected}"><div class=field><label>Livro</label><select name=book_id required><option value="">Selecione</option>${S.books.map(b=>`<option value="${b.id}">${esc(b.title)}</option>`).join("")}</select></div><div class=field><label>Páginas lidas</label><input type=number min=1 name=pages_read required></div><div class=field><label>Minutos</label><input type=number min=1 name=minutes></div><div class=actions><button>Registrar</button></div></form></div>
  <div class=panel><h3>Exercício</h3><form data-form=exercise><input type=hidden name=date value="${S.selected}"><div class=field><label>Atividade</label><input name=activity required></div><div class=field><label>Minutos</label><input type=number min=1 name=minutes></div><div class=field><label>Intensidade</label>${rate("intensity",3)}</div><div class=actions><button>Registrar</button></div></form></div></div>
  <h2 class=section>Diário</h2><div class=panel><form data-form=journal><input type=hidden name=date value="${S.selected}"><div class=form><div class=field><label>Título</label><input name=title value="${esc(q.j?.title)}"></div><div class=field><label>Tags</label><input name=tags value="${esc((q.j?.tags||[]).join(", "))}" placeholder="trabalho, viagem..."></div><div class="field full"><label>O que marcou seu dia?</label><textarea name=body rows=5>${esc(q.j?.body)}</textarea></div></div><div class=actions><button>Salvar diário</button></div></form></div>`}
function calendarPage(){
  let b=toDate(S.selected),y=b.getFullYear(),m=b.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0),cells=[];
  for(let i=0;i<first.getDay();i++)cells.push("<div class='day blank'></div>");
  for(let n=1;n<=last.getDate();n++){let ds=`${y}-${String(m+1).padStart(2,"0")}-${String(n).padStart(2,"0")}`,q=dataOf(ds),count=[q.d,q.s,q.h.length,q.r.length,q.st.length,q.e.length,q.j].filter(Boolean).length;cells.push(`<button class="day ${ds===today()?"today":""} ${ds===S.selected?"selected":""}" data-date="${ds}"><b>${n}</b><div class=dots>${"<i class=dot></i>".repeat(Math.min(count,6))}</div></button>`)}
  return`<div class=panel><div class=row style="border:0;padding:0 0 14px"><button class=secondary data-month=-1>←</button><h3>${b.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</h3><button class=secondary data-month=1>→</button></div><div class=calendar>${["D","S","T","Q","Q","S","S"].map(x=>`<div class=weekday>${x}</div>`).join("")}${cells.join("")}</div></div>`}
function habitCalendar(h){
  let b=toDate(S.selected),y=b.getFullYear(),m=b.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0),cells=[];
  for(let i=0;i<first.getDay();i++)cells.push("<span class='habit-day empty'></span>");
  for(let n=1;n<=last.getDate();n++){let ds=`${y}-${String(m+1).padStart(2,"0")}-${String(n).padStart(2,"0")}`,done=habitDone(h.id,ds),future=ds>today();cells.push(`<button class="habit-day ${done?"done":""} ${future?"future":""}" data-toggle="${h.id}" data-date="${ds}" title="${ds}">${n}</button>`)}
  return`<div class=habit-calendar>${["D","S","T","Q","Q","S","S"].map(x=>`<div class=habit-week>${x}</div>`).join("")}${cells.join("")}</div>`}
function habitsPage(){
  let active=S.habits.filter(x=>x.active);
  return`<div id=habitCreate class=panel><h3>Novo hábito</h3><form data-form=habit><div class=field><label>Nome</label><input name=name required placeholder="Ex.: Caminhar 30 minutos"></div><div class=actions><button>Adicionar</button></div></form></div><h2 class=section>Calendário de hábitos</h2><div class=list>${active.map(h=>{let st=habitStats(h);return`<div class="panel habit-card"><div class=habit-head><div><strong>${esc(h.name)}</strong><small>${toDate(S.selected).toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</small></div><button class=danger data-del=habits data-id="${h.id}">Excluir</button></div><div class=habit-stats><span class=chip>${st.monthCount} este mês</span><span class=chip>${st.rate}%</span><span class=chip>Sequência ${st.streak}</span><span class=chip>Recorde ${st.best}</span></div>${habitCalendar(h)}</div>`}).join("")||"<p class=muted>Nenhum hábito cadastrado.</p>"}</div>`}
function booksPage(){return`<div id=bookCreate class=panel><h3>Novo livro</h3><form data-form=book><div class=form><div class=field><label>Título</label><input name=title required></div><div class=field><label>Autor</label><input name=author></div><div class=field><label>Status</label><select name=status><option>Quero ler</option><option>Em andamento</option><option>Lido</option></select></div><div class=field><label>Total de páginas</label><input type=number min=0 name=pages></div></div><div class=actions><button>Adicionar</button></div></form></div><h2 class=section>Biblioteca</h2><div class=list>${S.books.map(b=>{let read=S.reading_logs.filter(x=>x.book_id===b.id).reduce((a,x)=>a+x.pages_read,0),pc=b.pages?Math.min(100,Math.round(read/b.pages*100)):0;return`<div class="panel hoverable"><div class=row style="border:0;padding:0"><div><strong>${esc(b.title)}</strong><small>${esc(b.author)} · ${read}/${b.pages||"?"} páginas · ${pc}%</small></div><button class=danger data-del=books data-id="${b.id}">Excluir</button></div><div class=progress><span style="width:${pc}%"></span></div></div>`}).join("")}</div>`}
function studiesPage(){return`<div id=studyCreate class=panel><h3>Registrar estudo</h3><form data-form=study><div class=form><div class=field><label>Data</label><input type=date name=date value="${today()}" required></div><div class=field><label>Assunto</label><input name=subject required></div><div class=field><label>Minutos</label><input type=number min=1 name=minutes required></div><div class="field full"><label>Aprendizado</label><textarea name=learned></textarea></div></div><div class=actions><button>Salvar</button></div></form></div><h2 class=section>Histórico</h2><div class=list>${S.studies.map(x=>`<div class=row><div><strong>${esc(x.subject)}</strong><small>${x.date} · ${x.minutes} min</small></div><button class=danger data-del=studies data-id="${x.id}">Excluir</button></div>`).join("")}</div>`}
function goalsPage(){return`<div id=goalCreate class=panel><h3>Novo objetivo</h3><form data-form=goal><div class=form><div class=field><label>Objetivo</label><input name=title required></div><div class=field><label>Prazo</label><input type=date name=deadline></div><div class=field><label>Progresso %</label><input type=number min=0 max=100 name=progress value=0></div><div class="field full"><label>Notas</label><textarea name=notes></textarea></div></div><div class=actions><button>Adicionar</button></div></form></div><h2 class=section>Objetivos</h2><div class=list>${S.goals.map(g=>`<div class=panel><strong>${esc(g.title)}</strong><small>${g.deadline?"Prazo "+g.deadline:"Sem prazo"} · ${g.progress}%</small><div class=progress><span style="width:${g.progress}%"></span></div></div>`).join("")}</div>`}
function noteEditor(n){
  if(!n)return`<div class="panel note-editor"><h3>Suas notas</h3><p class=muted>Crie uma nota para começar. Você pode usar Markdown simples e links como <b>[[Outra nota]]</b>.</p></div>`;
  let atts=S.note_attachments.filter(a=>a.note_id===n.id),back=S.notes.filter(x=>x.id!==n.id&&(x.content||"").includes(`[[${n.title}]]`));
  return`<div class="panel note-editor"><div class=editor-toolbar><div class=left><button class="${!S.notePreview?"":"secondary"}" data-note-mode=edit>Editar</button><button class="${S.notePreview?"":"secondary"}" data-note-mode=preview>Visualizar</button></div><div class=right><button class=secondary data-fav="${n.id}">${n.is_favorite?"★":"☆"}</button><button class=danger data-note-delete="${n.id}">Excluir</button></div></div>
  <form data-form=note data-id="${n.id}"><div class=field><input name=title value="${esc(n.title)}" placeholder="Título" required></div><div class=field style="margin-top:10px"><input name=tags value="${esc((n.tags||[]).join(", "))}" placeholder="tags, separadas, por vírgula"></div>${S.notePreview?`<div class=preview>${markdown(n.content)}</div>`:`<textarea class=note-content name=content placeholder="Escreva aqui...">${esc(n.content)}</textarea>`}<div class=actions>${!S.notePreview?`<button>Salvar nota</button>`:""}</div></form>
  <h3 class=section>Anexos</h3><div class=attachments>${atts.map(a=>`<div class=attachment><div><strong>${esc(a.file_name)}</strong><small>${a.size_bytes?Math.round(a.size_bytes/1024)+" KB":""}</small></div><div><button class=secondary data-attachment-open="${a.id}">Abrir</button> <button class=danger data-attachment-delete="${a.id}">×</button></div></div>`).join("")||"<small>Nenhum anexo.</small>"}</div><div class=actions style="justify-content:flex-start"><label class=secondary style="padding:10px 14px;border-radius:11px;cursor:pointer">＋ Anexar arquivo<input id=attachmentInput type=file hidden></label></div>
  <div class=backlinks><h3>Backlinks</h3>${back.map(x=>`<button class=note-item data-note="${x.id}"><strong>${esc(x.title)}</strong><small>Esta nota contém [[${esc(n.title)}]]</small></button>`).join("")||"<small>Nenhuma nota aponta para esta ainda.</small>"}</div></div>`}
function notesPage(){
  if(!S.selectedNote&&S.notes[0])S.selectedNote=S.notes[0].id;
  let sel=S.notes.find(n=>n.id===S.selectedNote);
  return`<div class=notes-layout><div class="panel notes-sidebar"><button data-new-note>＋ Nova nota</button><input id=noteSearch placeholder="Buscar notas..."><div class=note-list id=noteList>${S.notes.map(n=>`<button class="note-item ${n.id===S.selectedNote?"active":""}" data-note="${n.id}"><strong>${n.is_favorite?"★ ":""}${esc(n.title)}</strong><small>${(n.tags||[]).map(t=>"#"+esc(t)).join(" ")||"Sem tags"}</small></button>`).join("")||"<small>Você ainda não criou notas.</small>"}</div></div>${noteEditor(sel)}</div>`}
function analysisPage(){let d=S.daily.slice(0,30),s=S.sleep.slice(0,30),cut=new Date(Date.now()-30*864e5).toISOString().slice(0,10),pages=S.reading_logs.filter(x=>x.date>=cut).reduce((a,x)=>a+x.pages_read,0),study=S.studies.filter(x=>x.date>=cut).reduce((a,x)=>a+x.minutes,0);return`<div class="grid four">${[["Dias registrados",d.length],["Sono médio",s.length?avg(s.map(hours))+"h":"—"],["Páginas · 30d",pages],["Estudo · 30d",study+" min"]].map(x=>`<div class="panel hoverable"><small>${x[0]}</small><div class=metric>${x[1]}</div></div>`).join("")}</div><div class=panel style="margin-top:14px"><h3>Insights</h3><p class=muted>A V2.2 usará este histórico para comparações semanais/mensais e associações descritivas entre sono, energia, foco, humor, hábitos, leitura, exercício e estudo.</p></div>`}
function headerConfig(){
  return{today:["＋ Registrar","registerTop"],calendar:null,habits:["＋ Novo hábito","habitCreate"],notes:["＋ Nova nota","newNote"],books:["＋ Novo livro","bookCreate"],studies:["＋ Registrar estudo","studyCreate"],goals:["＋ Novo objetivo","goalCreate"],analysis:null}[S.view]
}
function render(){
  let names={today:S.selected===today()?"Hoje":toDate(S.selected).toLocaleDateString("pt-BR",{day:"numeric",month:"long"}),calendar:"Calendário",habits:"Hábitos",notes:"Notas",books:"Leituras",studies:"Estudos",goals:"Objetivos",analysis:"Análises"};
  $("#pageTitle").textContent=names[S.view];document.querySelectorAll("[data-go]").forEach(x=>x.classList.toggle("active",x.dataset.go===S.view));
  $("#content").innerHTML=({today:todayPage,calendar:calendarPage,habits:habitsPage,notes:notesPage,books:booksPage,studies:studiesPage,goals:goalsPage,analysis:analysisPage}[S.view])();
  let hc=headerConfig(),btn=$("#headerAction");if(!hc){btn.classList.add("hidden")}else{btn.classList.remove("hidden");btn.textContent=hc[0];btn.dataset.target=hc[1]}
}
async function newNote(){let n=await add("notes",{title:"Nova nota",content:"",tags:[],is_favorite:false});if(n){S.selectedNote=n.id;S.view="notes";render();setTimeout(()=>document.querySelector('form[data-form="note"] input[name="title"]')?.select(),0)}}
function openPalette(){renderCommands("");$("#palette").classList.remove("hidden");$("#palette").setAttribute("aria-hidden","false");setTimeout(()=>$("#commandInput").focus(),20)}
function closePalette(){$("#palette").classList.add("hidden");$("#palette").setAttribute("aria-hidden","true");$("#commandInput").value=""}
function renderCommands(q){
  q=(q||"").trim().toLowerCase();
  let actions=[["Nova nota","Criar uma nota","notes"],["Registrar leitura","Abrir Hoje","today"],["Registrar estudo","Abrir Estudos","studies"],["Marcar hábito","Abrir Hábitos","habits"],["Abrir calendário","Calendário","calendar"]];
  let results=actions.filter(x=>!q||x.join(" ").toLowerCase().includes(q)).map((x,i)=>`<button class=command-item data-command="${x[2]}" data-command-action="${x[0]==="Nova nota"?"newnote":""}"><span>${x[0]}</span><small>${x[1]}</small></button>`);
  if(q){let globals=[
    ...S.notes.filter(n=>(n.title+" "+n.content+" "+(n.tags||[]).join(" ")).toLowerCase().includes(q)).slice(0,5).map(n=>`<button class=command-item data-note-open="${n.id}"><span>▤ ${esc(n.title)}</span><small>Nota</small></button>`),
    ...S.books.filter(b=>(b.title+" "+(b.author||"")).toLowerCase().includes(q)).slice(0,3).map(b=>`<button class=command-item data-command="books"><span>▥ ${esc(b.title)}</span><small>Livro</small></button>`),
    ...S.studies.filter(s=>(s.subject+" "+(s.learned||"")).toLowerCase().includes(q)).slice(0,3).map(s=>`<button class=command-item data-command="studies"><span>◷ ${esc(s.subject)}</span><small>Estudo</small></button>`),
    ...S.journal_entries.filter(j=>((j.title||"")+" "+(j.body||"")).toLowerCase().includes(q)).slice(0,3).map(j=>`<button class=command-item data-day-open="${j.date}"><span>⌂ ${esc(j.title||j.date)}</span><small>Diário</small></button>`)
  ];results.push(...globals)}
  $("#commandResults").innerHTML=`<div class=command-results>${results.join("")||"<div class=muted style='padding:12px'>Nenhum resultado.</div>"}</div>`
}
document.addEventListener("click",async e=>{
  let g=e.target.closest("[data-go]");if(g){S.view=g.dataset.go;if(S.view==="today")S.selected=today();render()}
  if(e.target.closest("[data-palette]"))openPalette();
  let r=e.target.closest("[data-rate]");if(r){let f=r.closest("form");f.querySelectorAll(`[data-rate="${r.dataset.rate}"]`).forEach(x=>x.classList.remove("on"));r.classList.add("on");f.querySelector(`[name="${r.dataset.rate}"]`).value=r.dataset.v}
  let d=e.target.closest("[data-del]");if(d)await remove(d.dataset.del,d.dataset.id,true);
  let t=e.target.closest("[data-toggle]");if(t){let l=S.habit_logs.find(x=>x.habit_id===t.dataset.toggle&&x.date===t.dataset.date);if(l)await remove("habit_logs",l.id,false);else await add("habit_logs",{habit_id:t.dataset.toggle,date:t.dataset.date,completed:true})}
  let dt=e.target.closest("[data-date]");if(dt){S.selected=dt.dataset.date;S.view="today";render()}
  let mo=e.target.closest("[data-month]");if(mo){let d=toDate(S.selected);d.setMonth(d.getMonth()+(+mo.dataset.month));d.setDate(1);S.selected=d.toISOString().slice(0,10);render()}
  let ni=e.target.closest("[data-note]");if(ni){S.selectedNote=ni.dataset.note;S.notePreview=false;render()}
  if(e.target.closest("[data-new-note]"))await newNote();
  let nm=e.target.closest("[data-note-mode]");if(nm){S.notePreview=nm.dataset.noteMode==="preview";render()}
  let wiki=e.target.closest("[data-wiki]");if(wiki){let n=S.notes.find(x=>x.title.trim().toLowerCase()===wiki.dataset.wiki.trim().toLowerCase());if(n){S.selectedNote=n.id;S.notePreview=false;render()}else toast("Nota vinculada ainda não existe")}
  let fav=e.target.closest("[data-fav]");if(fav){let n=S.notes.find(x=>x.id===fav.dataset.fav),{error}=await sb.from("notes").update({is_favorite:!n.is_favorite,updated_at:new Date().toISOString()}).eq("id",n.id);if(error)return toast(error.message);await load();render()}
  let nd=e.target.closest("[data-note-delete]");if(nd&&confirm("Excluir esta nota e seus anexos?")){let atts=S.note_attachments.filter(a=>a.note_id===nd.dataset.noteDelete);if(atts.length)await sb.storage.from("notes-attachments").remove(atts.map(a=>a.storage_path));await remove("notes",nd.dataset.noteDelete,false);S.selectedNote=null;render()}
  let ao=e.target.closest("[data-attachment-open]");if(ao){let a=S.note_attachments.find(x=>x.id===ao.dataset.attachmentOpen),{data,error}=await sb.storage.from("notes-attachments").createSignedUrl(a.storage_path,3600);if(error)return toast(error.message);window.open(data.signedUrl,"_blank","noopener")}
  let ad=e.target.closest("[data-attachment-delete]");if(ad&&confirm("Excluir este anexo?")){let a=S.note_attachments.find(x=>x.id===ad.dataset.attachmentDelete);let{error}=await sb.storage.from("notes-attachments").remove([a.storage_path]);if(error)return toast(error.message);await remove("note_attachments",a.id,false)}
  let ci=e.target.closest("[data-command]");if(ci){closePalette();if(ci.dataset.commandAction==="newnote")return newNote();S.view=ci.dataset.command;render()}
  let no=e.target.closest("[data-note-open]");if(no){closePalette();S.view="notes";S.selectedNote=no.dataset.noteOpen;render()}
  let day=e.target.closest("[data-day-open]");if(day){closePalette();S.selected=day.dataset.dayOpen;S.view="today";render()}
  if(e.target===$("#palette"))closePalette()
});
document.addEventListener("submit",async e=>{
  let f=e.target.closest("[data-form]");if(!f)return;e.preventDefault();let x=Object.fromEntries(new FormData(f)),t=f.dataset.form;
  if(t==="daily"){["energy","mood","focus","stress"].forEach(k=>x[k]=+x[k]);await upDate("daily_entries",x)}
  if(t==="sleep"){x.quality=+x.quality;x.awakenings=0;await upDate("sleep_entries",x)}
  if(t==="habit")await add("habits",{name:x.name.trim(),active:true});
  if(t==="book"){x.pages=+x.pages||0;x.current_page=0;x.rating=3;await add("books",x)}
  if(t==="reading"){x.pages_read=+x.pages_read;x.minutes=x.minutes?+x.minutes:null;await add("reading_logs",x)}
  if(t==="exercise"){x.minutes=x.minutes?+x.minutes:null;x.intensity=+x.intensity;await add("exercise_logs",x)}
  if(t==="study"){x.minutes=+x.minutes;await add("studies",x)}
  if(t==="goal"){x.progress=+x.progress||0;x.date=today();await add("goals",x)}
  if(t==="journal"){x.tags=x.tags?x.tags.split(",").map(s=>s.trim()).filter(Boolean):[];await upDate("journal_entries",x)}
  if(t==="note"){x.tags=x.tags?x.tags.split(",").map(s=>s.trim()).filter(Boolean):[];x.updated_at=new Date().toISOString();let{error}=await sb.from("notes").update(x).eq("id",f.dataset.id);if(error)return toast(error.message);await load();render();toast("Nota salva")}
});
document.addEventListener("input",e=>{
  if(e.target.id==="commandInput")renderCommands(e.target.value);
  if(e.target.id==="noteSearch"){let q=e.target.value.toLowerCase();document.querySelectorAll(".note-item[data-note]").forEach(el=>{let n=S.notes.find(x=>x.id===el.dataset.note);el.style.display=!q||(n.title+" "+n.content+" "+(n.tags||[]).join(" ")).toLowerCase().includes(q)?"":"none"})}
});
document.addEventListener("change",async e=>{
  if(e.target.id!=="attachmentInput"||!e.target.files?.[0]||!S.selectedNote)return;
  let file=e.target.files[0];if(file.size>20*1024*1024)return toast("Limite de 20 MB por arquivo");
  let safe=file.name.replace(/[^\w.\-]+/g,"_"),path=`${S.user.id}/${S.selectedNote}/${Date.now()}-${safe}`;
  toast("Enviando anexo...");
  let{error}=await sb.storage.from("notes-attachments").upload(path,file,{upsert:false});if(error)return toast(error.message);
  let{error:dbErr}=await sb.from("note_attachments").insert({user_id:S.user.id,note_id:S.selectedNote,file_name:file.name,storage_path:path,mime_type:file.type||null,size_bytes:file.size});if(dbErr){await sb.storage.from("notes-attachments").remove([path]);return toast(dbErr.message)}
  await load();render();toast("Anexo enviado");
});
$("#headerAction").onclick=async()=>{let target=$("#headerAction").dataset.target;if(target==="newNote")return newNote();document.getElementById(target)?.scrollIntoView({behavior:"smooth",block:"start"});setTimeout(()=>document.querySelector(`#${target} input`)?.focus(),250)};
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openPalette()}if(e.key==="Escape"&&!$("#palette").classList.contains("hidden"))closePalette()});
$("#theme").onclick=()=>{let n=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=n;localStorage.setItem("greene-theme",n)};document.documentElement.dataset.theme=localStorage.getItem("greene-theme")||"light";
$("#login").onclick=async()=>{if(!sb)return $("#authmsg").textContent="Configure o config.js.";let{error}=await sb.auth.signInWithPassword({email:$("#email").value,password:$("#password").value});if(error)$("#authmsg").textContent=error.message};
$("#signup").onclick=async()=>{if(!sb)return $("#authmsg").textContent="Configure o config.js.";let{error}=await sb.auth.signUp({email:$("#email").value,password:$("#password").value});$("#authmsg").textContent=error?error.message:"Conta criada. Confirme seu e-mail, se solicitado."};
$("#logout").onclick=()=>sb?.auth.signOut();
$("#export").onclick=()=>{let b=new Blob([JSON.stringify({...S,user:undefined},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`greene-v2.1-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
if(sb)sb.auth.onAuthStateChange(async(_,s)=>{S.user=s?.user||null;$("#auth").classList.toggle("hidden",!!S.user);$("#shell").classList.toggle("hidden",!S.user);if(S.user){skeleton();await load();render()}});
