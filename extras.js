"use strict";
(() => {
const $=id=>document.getElementById(id),OFF_KEY="benri-tools-days-off-v1";
let off={};try{const o=JSON.parse(localStorage.getItem(OFF_KEY)||"{}");if(o&&typeof o==="object"&&!Array.isArray(o))off=o;}catch(e){}
let picked=new Set();
const saveOff=()=>{try{localStorage.setItem(OFF_KEY,JSON.stringify(off));return true;}catch(e){$("off-status").textContent="保存に失敗しました";return false;}};
const updateCount=()=>{$("off-count").textContent=`選択中：${picked.size}日`};
window.extraOffClick=date=>{if(!$("off-mode").checked)return false;if(picked.has(date))picked.delete(date);else picked.add(date);updateCount();render();return true;};
$("off-mode").addEventListener("change",()=>{picked.clear();updateCount();render();});
function markDays(){document.querySelectorAll("#calendar .day").forEach(btn=>{const d=Number(btn.firstChild?.textContent),date=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
if(off[date]){btn.classList.add("off-day");const tag=document.createElement("span");tag.className="off-tag";tag.textContent="休";btn.append(tag);}
if(picked.has(date))btn.classList.add("off-picked");});}
$("off-save").addEventListener("click",()=>{picked.forEach(d=>off[d]=true);if(!saveOff())return;picked.clear();updateCount();render();$("off-status").textContent="休日を登録しました。";});
$("off-clear").addEventListener("click",()=>{picked.forEach(d=>delete off[d]);if(!saveOff())return;picked.clear();updateCount();render();$("off-status").textContent="休日設定を解除しました。";});
function histories(){
 const select=$("event-history"),current=select.value;select.replaceChildren();const first=document.createElement("option");first.value="";first.textContent="履歴を選択（任意）";select.append(first);
 const seen=new Set();Object.values(data).forEach(items=>{if(!Array.isArray(items))return;items.forEach(item=>{if(typeof item==="string"&&item.trim())seen.add(item);});});
 [...seen].reverse().slice(0,50).forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=v;select.append(o);});if(seen.has(current))select.value=current;
 const history=$("shift-history"),old=history.value;history.replaceChildren();const shifts=window.workV5?.getState().shifts||{};
 const rows=[];Object.entries(shifts).sort(([a],[b])=>b.localeCompare(a)).forEach(([date,records])=>Object.entries(records).forEach(([id,rec])=>{const p=window.workV5?.getPlace(id);if(p)rows.push({date,id,rec,name:p.name});}));
 rows.slice(0,80).forEach(({date,id,rec,name})=>{const o=document.createElement("option");o.value=`${date}|${id}`;o.textContent=`${date} ${name} ${rec.start}〜${rec.end}`;history.append(o);});
 if([...history.options].some(o=>o.value===old))history.value=old;
 $("copy-shift").disabled=!history.options.length;
}
$("event-history").addEventListener("change",()=>{if($("event-history").value)$("event-text").value=$("event-history").value;});
$("copy-shift").addEventListener("click",()=>{
 const [date,id]=($("shift-history").value||"").split("|");const state=window.workV5?.getState(),rec=state?.shifts?.[date]?.[id];if(!rec)return;
 if(state.shifts[selected]?.[id]&&!confirm("選択した日付の同じ職場の勤務を上書きしますか？"))return;
 const previous=state.shifts[selected]?{...state.shifts[selected]}:null;
 state.shifts[selected]??={};state.shifts[selected][id]={...rec};
 if(!window.workV5.save()){if(previous)state.shifts[selected]=previous;else delete state.shifts[selected];return;}
 render();$("copy-status").textContent="勤務をコピーしました。";
});
function escapeIcs(s){return String(s).replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");}
$("export-ics").addEventListener("click",()=>{
 const items=(data[selected]||[]).filter(x=>typeof x==="string");if(!items.length){$("status").textContent="この日に書き出せる予定がありません。";return;}
 const date=selected.replace(/-/g,"");const stamp=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
 const events=items.map((name,i)=>["BEGIN:VEVENT",`UID:${date}-${i}-${Date.now()}@benri-tools`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${date}`,`DTEND;VALUE=DATE:${new Date(new Date(selected+"T12:00:00").getTime()+86400000).toLocaleDateString("sv-SE").replace(/-/g,"")}`,`SUMMARY:${escapeIcs(name)}`,"END:VEVENT"].join("\r\n"));
 const ics=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Benri Tools//Calendar//JA","CALSCALE:GREGORIAN",...events,"END:VCALENDAR"].join("\r\n");
 const blob=new Blob([ics],{type:"text/calendar;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`benri-${selected}.ics`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 $("status").textContent="予定ファイルを書き出しました。iPhoneカレンダーに取り込み、必要な通知を設定してください。";
});
document.addEventListener("calendar-rendered",()=>{markDays();histories();});
updateCount();markDays();histories();
})();