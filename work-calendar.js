"use strict";
(() => {
const OLD="benri-tools-work-v1", KEY="benri-tools-work-v2";
const $=id=>document.getElementById(id);
const money=n=>Math.round(n).toLocaleString("ja-JP")+"円";
const mins=s=>{if(!/^\d\d:\d\d$/.test(s||""))return NaN;const a=s.split(":").map(Number);return a[0]*60+a[1];};
let state={places:[],shifts:{}};
try {
 const parsed=JSON.parse(localStorage.getItem(KEY)||"null");
 if(parsed&&Array.isArray(parsed.places)&&parsed.shifts&&typeof parsed.shifts==="object")state=parsed;
 else {
  const old=JSON.parse(localStorage.getItem(OLD)||"{}");
  const records=Object.entries(old).filter(([date,rec])=>/^\d{4}-\d\d-\d\d$/.test(date)&&rec&&typeof rec==="object");
  if(records.length){state.places=[{id:"legacy",name:"以前の勤務先",wage:1200}];records.forEach(([date,rec])=>state.shifts[date]={legacy:rec});}
 }
}catch(e){$("place-status").textContent="勤務データを読み込めませんでした。";}
const calc=r=>{
 if(!r)return null;
 const wage=Number(r.wage),b=Number(r.breakMinutes);
 const duration=mins(r.end)-mins(r.start)+(r.overnight?1440:0);
 if(!Number.isFinite(wage)||wage<0||wage>1000000||!Number.isInteger(b)||b<0||duration<=0||duration>1440||b>duration)return null;
 return {minutes:duration-b,pay:wage*(duration-b)/60};
};
function persist(){
 try{localStorage.setItem(KEY,JSON.stringify(state));return true;}
 catch(e){$("place-status").textContent="保存できませんでした。ブラウザの保存設定を確認してください。";return false;}
}
const getPlace=id=>state.places.find(p=>p.id===id);
function placeUI(){
 const select=$("work-place"),prev=select.value;
 select.replaceChildren();
 state.places.forEach(p=>{const o=document.createElement("option");o.value=p.id;o.textContent=p.name;select.append(o);});
 if(getPlace(prev))select.value=prev;
 $("work-form").querySelector('button[type="submit"]').disabled=!state.places.length;
 const list=$("place-list");list.replaceChildren();
 state.places.forEach(p=>{
  const row=document.createElement("div");row.className="place-row";
  const name=document.createElement("span");name.textContent=`${p.name}（通常時給 ${money(p.wage)}）`;
  const edit=document.createElement("button");edit.type="button";edit.textContent="編集";
  edit.addEventListener("click",()=>{
   const newName=prompt("職場名",p.name);if(newName===null)return;
   if(!newName.trim()||newName.trim().length>50){$("place-status").textContent="職場名を確認してください。";return;}
   const newWage=prompt("通常時給（円）",String(p.wage));if(newWage===null)return;
   if(newWage.trim()===""||!Number.isInteger(Number(newWage))||Number(newWage)<0||Number(newWage)>1000000){$("place-status").textContent="時給を確認してください。";return;}
   const before={...p};p.name=newName.trim();p.wage=Number(newWage);
   if(!persist()){Object.assign(p,before);return;}
   placeUI();render();$("place-status").textContent="職場を更新しました。既存の勤務記録の時給は変更しません。";
  });
  const del=document.createElement("button");del.type="button";del.textContent="削除";
  del.addEventListener("click",()=>{
   if(!confirm(`「${p.name}」と、この職場の全勤務記録を削除しますか？`))return;
   const backup=JSON.stringify(state);
   state.places=state.places.filter(x=>x.id!==p.id);
   for(const [date,records] of Object.entries(state.shifts)){delete records[p.id];if(!Object.keys(records).length)delete state.shifts[date];}
   if(!persist()){state=JSON.parse(backup);return;}
   placeUI();render();$("place-status").textContent="職場とその勤務記録を削除しました。";
  });
  row.append(name,edit,del);list.append(row);
 });
}
function currentRecord(){return state.shifts[selected]?.[$("work-place").value];}
function formRecord(){return {wage:Number($("work-wage").value),start:$("work-start").value,end:$("work-end").value,breakMinutes:Number($("work-break").value),overnight:$("work-overnight").checked};}
function preview(){
 const r=$("work-wage").value!==""&&$("work-break").value!==""?calc(formRecord()):null;
 $("daily-pay").textContent=r?`実働 ${(r.minutes/60).toFixed(2)}時間・日給目安 ${money(r.pay)}`:"時給・出退勤時間・休憩を確認してください。";
}
function loadSelected(){
 const place=getPlace($("work-place").value),rec=currentRecord();
 $("work-wage").value=rec?.wage??place?.wage??1200;
 $("work-start").value=rec?.start??"09:00";$("work-end").value=rec?.end??"18:00";
 $("work-break").value=rec?.breakMinutes??60;$("work-overnight").checked=!!rec?.overnight;
 $("delete-work").hidden=!rec;
 preview();
}
function renderWork(){
 const prefix=`${year}-${String(month+1).padStart(2,"0")}-`;
 const totals={};let sum=0,minutes=0,shifts=0;
 state.places.forEach(p=>totals[p.id]={pay:0,minutes:0,count:0});
 Object.entries(state.shifts).forEach(([date,records])=>{
  if(!date.startsWith(prefix))return;
  Object.entries(records).forEach(([id,rec])=>{
   const r=calc(rec);if(!r||!totals[id])return;
   totals[id].pay+=r.pay;totals[id].minutes+=r.minutes;totals[id].count++;
   sum+=r.pay;minutes+=r.minutes;shifts++;
  });
 });
 $("monthly-pay").textContent=money(sum);
 $("monthly-stats").textContent=`勤務 ${shifts}件 ／ 実働 ${(minutes/60).toFixed(2)}時間`;
 const breakdown=$("workplace-breakdown");breakdown.replaceChildren();
 state.places.forEach(p=>{
  const t=totals[p.id],row=document.createElement("div");row.className="pay-row";
  const name=document.createElement("span");name.textContent=`${p.name}（${t.count}件）`;
  const amount=document.createElement("strong");amount.textContent=money(t.pay);
  row.append(name,amount);breakdown.append(row);
 });
 document.querySelectorAll("#calendar .day").forEach(btn=>{
  const day=Number(btn.firstChild?.textContent),date=prefix+String(day).padStart(2,"0");
  const records=state.shifts[date]||{},daily=Object.entries(records).reduce((n,[id,r])=>n+(getPlace(id)?(calc(r)?.pay||0):0),0);
  if(Object.keys(records).length){
   const dot=document.createElement("span");dot.className="work-dot";dot.setAttribute("aria-hidden","true");
   const amount=document.createElement("span");amount.className="work-small";amount.textContent=money(daily);
   btn.append(dot,amount);btn.setAttribute("aria-label",btn.getAttribute("aria-label")+`、勤務合計${money(daily)}`);
  }
 });
 const dayList=$("day-work-list");dayList.replaceChildren();
 const h=document.createElement("h3");h.textContent="この日の勤務一覧";dayList.append(h);
 const entries=Object.entries(state.shifts[selected]||{}).filter(([id,r])=>getPlace(id)&&calc(r));
 if(!entries.length){const hint=document.createElement("p");hint.className="hint";hint.textContent="勤務の登録はありません。";dayList.append(hint);}
 entries.forEach(([id,rec])=>{
  const r=calc(rec),row=document.createElement("div");row.className="pay-row";
  const name=document.createElement("span");name.textContent=`${getPlace(id).name}　${rec.start}〜${rec.end}${rec.overnight?"（翌日）":""}`;
  const amount=document.createElement("strong");amount.textContent=money(r.pay);
  row.append(name,amount);dayList.append(row);
 });
 loadSelected();
}
$("workplace-form").addEventListener("submit",e=>{
 e.preventDefault();const name=$("place-name").value.trim(),raw=$("place-wage").value,wage=Number(raw);
 if(!name||name.length>50||raw===""||!Number.isInteger(wage)||wage<0||wage>1000000){$("place-status").textContent="職場名と時給を確認してください。";return;}
 const id="p"+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
 state.places.push({id,name,wage});
 if(!persist()){state.places.pop();return;}
 $("place-name").value="";placeUI();$("work-place").value=id;render();$("place-status").textContent="職場を登録しました。";
});
$("work-place").addEventListener("change",loadSelected);
$("work-form").addEventListener("submit",e=>{
 e.preventDefault();const id=$("work-place").value;
 if(!getPlace(id)||$("work-wage").value===""||$("work-break").value===""){ $("work-status").textContent="職場と入力内容を確認してください。";return;}
 const rec=formRecord();if(!calc(rec)){ $("work-status").textContent="出退勤・休憩・時給を確認してください。";return;}
 const backup=JSON.stringify(state.shifts[selected]||{});
 if(!state.shifts[selected])state.shifts[selected]={};
 state.shifts[selected][id]=rec;
 if(!persist()){state.shifts[selected]=JSON.parse(backup);return;}
 render();$("work-status").textContent="勤務を保存しました。";
});
$("delete-work").addEventListener("click",()=>{
 const id=$("work-place").value;if(!currentRecord()||!confirm("この職場の、この日の勤務を削除しますか？"))return;
 const backup={...state.shifts[selected]};delete state.shifts[selected][id];
 if(!Object.keys(state.shifts[selected]).length)delete state.shifts[selected];
 if(!persist()){state.shifts[selected]=backup;return;}
 render();$("work-status").textContent="勤務を削除しました。";
});
["work-wage","work-start","work-end","work-break","work-overnight"].forEach(id=>$(id).addEventListener("input",preview));
document.addEventListener("calendar-rendered",renderWork);
placeUI();renderWork();
})();