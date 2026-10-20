"use strict";
(() => {
const $=id=>document.getElementById(id),HOL="benri-tools-holidays-v1",WORK="benri-tools-work-v2";
let holidays={};try{const h=JSON.parse(localStorage.getItem(HOL)||"{}");if(h&&typeof h==="object"&&!Array.isArray(h))holidays=h;}catch(e){}
let choosing=false;const picked=new Set();
const save=()=>{try{localStorage.setItem(HOL,JSON.stringify(holidays));return true;}catch(e){$("holiday-status").textContent="休日を保存できませんでした。";return false;}};
function renderHoliday(){
 const prefix=`${year}-${pad(month+1)}-`;
 document.querySelectorAll("#calendar .day").forEach(b=>{
  const d=Number(b.firstChild?.textContent),date=prefix+pad(d);
  b.classList.toggle("holiday",!!holidays[date]);b.classList.toggle("multi-picked",picked.has(date));
  if(holidays[date]){const tag=document.createElement("span");tag.className="holiday-label";tag.textContent="休み";b.append(tag);}
 });
 $("holiday-count").textContent=`${picked.size}日選択`;
}
window.holidayTap=date=>{if(!choosing)return false;picked.has(date)?picked.delete(date):picked.add(date);renderHoliday();return true;};
$("holiday-mode").addEventListener("click",()=>{choosing=!choosing;picked.clear();$("holiday-actions").hidden=!choosing;$("holiday-mode").textContent=choosing?"選択モード中":"休日を選択";renderHoliday();});
$("holiday-cancel").addEventListener("click",()=>{choosing=false;picked.clear();$("holiday-actions").hidden=true;$("holiday-mode").textContent="休日を選択";renderHoliday();});
function apply(value){if(!picked.size){$("holiday-status").textContent="日付を選んでください。";return;}const backup={...holidays};picked.forEach(d=>{if(value)holidays[d]=true;else delete holidays[d];});if(!save()){holidays=backup;return;}$("holiday-status").textContent=`${picked.size}日を${value?"休日に設定":"休日解除"}しました。`;picked.clear();renderHoliday();}
$("holiday-apply").addEventListener("click",()=>apply(true));$("holiday-remove").addEventListener("click",()=>apply(false));
function eventHistory(){const values=new Set();Object.values(data).forEach(arr=>{if(Array.isArray(arr))arr.forEach(e=>{const t=typeof e==="string"?e:e?.text;if(t)values.add(t);});});const sel=$("event-history");sel.replaceChildren(new Option("履歴を選択",""));[...values].reverse().slice(0,60).forEach(t=>sel.add(new Option(t,t)));}
$("copy-event").addEventListener("click",()=>{if($("event-history").value)$("event-text").value=$("event-history").value;});
function workHistory(){let work={};try{work=JSON.parse(localStorage.getItem(WORK)||"{}");}catch(e){}const sel=$("work-history");sel.replaceChildren(new Option("履歴を選択",""));const entries=[];Object.entries(work.shifts||{}).forEach(([date,records])=>Object.entries(records||{}).forEach(([id,r])=>{if(r&&typeof r==="object")entries.push({date,id,r});}));entries.sort((a,b)=>b.date.localeCompare(a.date));entries.slice(0,80).forEach((e,i)=>{const place=work.places?.find(p=>p.id===e.id)?.name||"勤務先";const opt=new Option(`${e.date} ${place} ${e.r.start}〜${e.r.end}`,String(i));sel.add(opt);});window._workHistory=entries.slice(0,80);}
$("copy-work").addEventListener("click",()=>{const idx=$("work-history").value,e=window._workHistory?.[Number(idx)];if(idx===""||!e)return;const select=$("work-place");if([...select.options].some(o=>o.value===e.id))select.value=e.id;$("work-wage").value=e.r.wage;$("work-start").value=e.r.start;$("work-end").value=e.r.end;$("work-break").value=e.r.breakMinutes;$("work-overnight").checked=!!e.r.overnight;$("work-wage").dispatchEvent(new Event("input"));$("work-status").textContent="履歴を入力欄にコピーしました。保存すると反映されます。";});
function esc(s){return String(s).replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");}
const dateOnly=d=>d.replaceAll("-","");
const dateAdd=(date,days)=>{const [y,m,d]=date.split("-").map(Number);const t=new Date(y,m-1,d+days);return `${t.getFullYear()}-${pad(t.getMonth()+1)}-${pad(t.getDate())}`;};
function makeICS(monthOnly){
 const dates=monthOnly?Object.keys({...data,...holidays}).filter(d=>d.startsWith(`${year}-${pad(month+1)}-`)):[selected];
 const now=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
 const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Benri Tools//Calendar Export//JA","CALSCALE:GREGORIAN","METHOD:PUBLISH"];
 let count=0;
 function add(date,title,time,duration){
  count++;lines.push("BEGIN:VEVENT",`UID:${date}-${count}-${Date.now()}@benri-tools.local`,`DTSTAMP:${now}`,`SUMMARY:${esc(title)}`);
  if(time){const [h,m]=time.split(":").map(Number);const start=new Date(Number(date.slice(0,4)),Number(date.slice(5,7))-1,Number(date.slice(8,10)),h,m);const end=new Date(start.getTime()+duration*60000);const stamp=d=>`${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;lines.push(`DTSTART:${stamp(start)}`,`DTEND:${stamp(end)}`);}
  else lines.push(`DTSTART;VALUE=DATE:${dateOnly(date)}`,`DTEND;VALUE=DATE:${dateOnly(dateAdd(date,1))}`);
  lines.push("END:VEVENT");
 }
 [...new Set(dates)].sort().forEach(date=>{
  (Array.isArray(data[date])?data[date]:[]).forEach(e=>{const title=typeof e==="string"?e:e?.text;if(title)add(date,title,typeof e==="object"?e.time:"",typeof e==="object"?Number(e.duration)||60:60);});
  if(holidays[date])add(date,"休み","",0);
 });
 if(!count){$("export-status").textContent="出力する予定・休日がありません。";return;}
 lines.push("END:VCALENDAR");const blob=new Blob(["\ufeff"+lines.join("\r\n")+"\r\n"],{type:"text/calendar;charset=utf-8"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`benri-calendar-${monthOnly?`${year}-${pad(month+1)}`:selected}.ics`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$("export-status").textContent=`${count}件の予定を出力しました。iPhoneの「ファイル」から開いて取り込んでください。取り込み方法はiOSのバージョンにより異なります。`;
}
$("export-day").addEventListener("click",()=>makeICS(false));$("export-month").addEventListener("click",()=>makeICS(true));
document.addEventListener("calendar-rendered",()=>{renderHoliday();eventHistory();workHistory();});document.addEventListener("events-changed",eventHistory);
renderHoliday();eventHistory();workHistory();
})();