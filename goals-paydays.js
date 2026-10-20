"use strict";
(()=>{
const $=id=>document.getElementById(id),K="benri-tools-goals-paydays-v1",W="benri-tools-work-v2";
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||"null")||f}catch{return f}};
let state=read(K,{goalMonth:0,goalYear:0,pay:{}});
state.pay ||= {};
const money=n=>Math.round(n).toLocaleString("ja-JP")+"円";
const save=()=>{try{localStorage.setItem(K,JSON.stringify(state));return true}catch{$("pay-message").textContent="設定を保存できませんでした。";return false}};
const pad=n=>String(n).padStart(2,"0");
const fmt=(y,m,d)=>`${y}-${pad(m)}-${pad(d)}`;
const days=(y,m)=>new Date(y,m,0).getDate();
const move=(y,m,delta)=>{const d=new Date(y,m-1+delta,1);return[d.getFullYear(),d.getMonth()+1]};
const end=(y,m,d)=>d==="end"?days(y,m):Math.min(Number(d),days(y,m));
const mins=t=>{if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(t||""))return NaN;const [h,m]=t.split(":").map(Number);return h*60+m};
function amount(r){if(!r)return null;const wage=Number(r.wage),rest=Number(r.breakMinutes),duration=mins(r.end)-mins(r.start)+(r.overnight?1440:0);
if(!Number.isFinite(wage)||wage<0||wage>1e6||!Number.isInteger(rest)||rest<0||duration<=0||duration>1440||rest>duration)return null;
return r.payType==="daily"?wage:wage*(duration-rest)/60}
function sum(from,to,id){const w=read(W,{shifts:{}});let total=0;for(const [date,rec] of Object.entries(w.shifts||{})){if(date<from||date>to)continue;const r=rec?.[id];const a=amount(r);if(a!==null)total+=a}return total}
function makeOptions(id){const s=$(id);for(let i=1;i<=28;i++){const o=document.createElement("option");o.value=String(i);o.textContent=`${i}日`;s.append(o)}const o=document.createElement("option");o.value="end";o.textContent="月末";s.append(o)}
function updateWorkplaces(){const w=read(W,{places:[]}),select=$("pay-workplace"),previous=select.value;select.replaceChildren();for(const p of w.places||[]){const o=document.createElement("option");o.value=p.id;o.textContent=p.name;select.append(o)}if((w.places||[]).some(p=>p.id===previous))select.value=previous;loadPay()}
function loadPay(){const p=state.pay[$("pay-workplace").value]||{close:"end",day:"25",offset:1};$("closing-day").value=p.close;$("payment-day").value=p.day;$("payment-offset").value=String(p.offset)}
function updateGoals(){const y=Number($("report-year").value),today=new Date(),ym=fmt(today.getFullYear(),today.getMonth()+1,1).slice(0,7),w=read(W,{shifts:{},places:[]});let annual=0,monthly=0;
const ids=new Set((w.places||[]).map(p=>p.id));
for(const [date,records] of Object.entries(w.shifts||{}))for(const [id,r] of Object.entries(records||{})){if(!ids.has(id))continue;const n=amount(r);if(n===null)continue;if(date.startsWith(String(y)+"-"))annual+=n;if(date.startsWith(ym))monthly+=n}
const result=[];if(state.goalMonth>0)result.push(`今月 ${money(monthly)} / ${money(state.goalMonth)}（${Math.round(monthly/state.goalMonth*100)}%）`);
if(state.goalYear>0)result.push(`${y}年 ${money(annual)} / ${money(state.goalYear)}（${Math.round(annual/state.goalYear*100)}%）`);
$("goal-result").textContent=result.join(" ／ ")||"目標を入力すると達成率を表示します。"}
function schedule(){const y=Number($("report-year").value),w=read(W,{places:[]}),items=[];
if(!Number.isInteger(y))return;
for(const p of w.places||[]){const c=state.pay[p.id];if(!c)continue;
for(let m=1;m<=12;m++){const [py,pm]=move(y,m,-1),start=new Date(py,pm-1,end(py,pm,c.close)+1),from=fmt(start.getFullYear(),start.getMonth()+1,start.getDate()),to=fmt(y,m,end(y,m,c.close)),value=sum(from,to,p.id);
if(!value)continue;const [yy,mm]=move(y,m,Number(c.offset)),payDate=fmt(yy,mm,end(yy,mm,c.day));items.push([payDate,p.name,value])}}
items.sort((a,b)=>a[0].localeCompare(b[0]));const target=$("payment-schedule");target.replaceChildren();
if(!items.length){target.textContent="支払設定済みの勤務記録はありません。";return}
for(const [date,name,value] of items){const row=document.createElement("div");row.className="pay-row";const label=document.createElement("span");label.textContent=`${date}　${name}`;const num=document.createElement("strong");num.textContent=money(value);row.append(label,num);target.append(row)}}
$("goal-month").value=state.goalMonth||"";$("goal-year").value=state.goalYear||"";
makeOptions("closing-day");makeOptions("payment-day");
$("save-goal").addEventListener("click",()=>{const m=$("goal-month").value,y=$("goal-year").value;if([m,y].some(v=>v!==""&&(!Number.isSafeInteger(Number(v))||Number(v)<0))){$("pay-message").textContent="目標額を確認してください。";return}state.goalMonth=Number(m)||0;state.goalYear=Number(y)||0;if(save()){updateGoals();$("pay-message").textContent="目標を保存しました。"}});
$("pay-workplace").addEventListener("change",loadPay);
$("save-pay").addEventListener("click",()=>{const id=$("pay-workplace").value;if(!id){$("pay-message").textContent="職場を登録してください。";return}state.pay[id]={close:$("closing-day").value,day:$("payment-day").value,offset:Number($("payment-offset").value)};if(save()){schedule();$("pay-message").textContent="支払設定を保存しました。"}});
$("report-year").addEventListener("change",()=>{updateGoals();schedule()});
document.addEventListener("calendar-rendered",()=>{updateWorkplaces();updateGoals();schedule()});
updateWorkplaces();updateGoals();schedule();
})();