"use strict";
const KEY="benri-tools-calendar-v1";
const $=id=>document.getElementById(id);
const today=new Date();
const pad=n=>String(n).padStart(2,"0");
const iso=(y,m,d)=>`${y}-${pad(m+1)}-${pad(d)}`;
let selected=iso(today.getFullYear(),today.getMonth(),today.getDate());
let year=today.getFullYear(),month=today.getMonth(),editing=null;
let data={};
try {const raw=JSON.parse(localStorage.getItem(KEY)||"{}");if(raw&&typeof raw==="object"&&!Array.isArray(raw))data=raw;}catch(e){$("status").textContent="保存済み予定を読み込めませんでした。";}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(data));return true;}catch(e){$("status").textContent="保存できませんでした。ブラウザの空き容量・設定を確認してください。";return false;}}
function clearEdit() {editing=null;$("event-text").value="";$("event-time").value="";$("event-duration").value="60";$("save-event").textContent="予定を保存";$("cancel-edit").hidden=true;}
function render(){
 $("month-title").textContent=`${year}年${month+1}月`;
 const grid=$("calendar");grid.replaceChildren();
 ["日","月","火","水","木","金","土"].forEach(w=>{const e=document.createElement("div");e.className="weekday";e.textContent=w;grid.append(e);});
 const start=new Date(year,month,1).getDay(),last=new Date(year,month+1,0).getDate();
 for(let i=0;i<start;i++){const e=document.createElement("span");grid.append(e);}
 for(let day=1;day<=last;day++){
  const date=iso(year,month,day),button=document.createElement("button");button.type="button";button.className="day";button.textContent=day;
  button.setAttribute("aria-label",`${month+1}月${day}日${Array.isArray(data[date])&&data[date].length?`、予定${data[date].length}件`:""}`);
  if(date===iso(today.getFullYear(),today.getMonth(),today.getDate()))button.classList.add("today");
  if(date===selected){button.classList.add("selected");button.setAttribute("aria-pressed","true");}else button.setAttribute("aria-pressed","false");
  if(Array.isArray(data[date])&&data[date].length){const dot=document.createElement("span");dot.className="dot";dot.setAttribute("aria-hidden","true");button.append(dot);}
  button.addEventListener("click",()=>{if(window.holidayTap&&window.holidayTap(date))return;selected=date;clearEdit();render();document.dispatchEvent(new CustomEvent("calendar-day-tapped",{detail:{date}}));});grid.append(button);
 }
 renderEvents();
 document.dispatchEvent(new CustomEvent("calendar-rendered",{detail:{year,month,selected}}));
}
function renderEvents(){
 const [y,m,d]=selected.split("-").map(Number);$("selected-title").textContent=`${y}年${m}月${d}日の予定`;
 const container=$("events");container.replaceChildren();
 const entries=Array.isArray(data[selected])?data[selected]:[];
 if(!entries.length){const p=document.createElement("p");p.className="hint";p.textContent="予定はまだありません。";container.append(p);return;}
 entries.forEach((item,index)=>{
  const itemText=typeof item==="string"?item:item?.text; if(typeof itemText!=="string")return;
  const row=document.createElement("div");row.className="event-item";
  const text=document.createElement("div");text.textContent=itemText+(typeof item==="object"&&item.time?`（${item.time}）`:"");row.append(text);
  const actions=document.createElement("div");actions.className="event-actions";
  const edit=document.createElement("button");edit.type="button";edit.textContent="編集";
  edit.addEventListener("click",()=>{editing={date:selected,index};$("event-text").value=itemText;$("event-time").value=typeof item==="object"?item.time||"":"";$("event-duration").value=typeof item==="object"?item.duration||60:60;$("save-event").textContent="変更を保存";$("cancel-edit").hidden=false;$("event-text").focus();});
  const del=document.createElement("button");del.type="button";del.textContent="削除";
  del.addEventListener("click",()=>{if(!confirm("この予定を削除しますか？"))return;const old=[...data[selected]];data[selected].splice(index,1);if(!data[selected].length)delete data[selected];if(!persist()){data[selected]=old;return;}clearEdit();render();document.dispatchEvent(new Event("events-changed"));});
  actions.append(edit,del);row.append(actions);container.append(row);
 });
}
$("event-form").addEventListener("submit",e=>{
 e.preventDefault();const value=$("event-text").value.trim();if(!value){$("status").textContent="予定を入力してください。";return;}
 const time=$("event-time").value,duration=Number($("event-duration").value);if(time&&(!Number.isInteger(duration)||duration<1||duration>1440)){$("status").textContent="所要時間を確認してください。";return;}const eventItem={text:value,time,duration:time?duration:60};const date=selected,old=Array.isArray(data[date])?[...data[date]]:null;
 if(!Array.isArray(data[date]))data[date]=[];
 if(editing&&editing.date===date&&editing.index<data[date].length)data[date][editing.index]=eventItem;else data[date].push(eventItem);
 if(!persist()){if(old)data[date]=old;else delete data[date];return;}
 clearEdit();$("status").textContent="保存しました。";render();document.dispatchEvent(new Event("events-changed"));
});
$("cancel-edit").addEventListener("click",clearEdit);
function shift(delta){const d=new Date(year,month+delta,1);year=d.getFullYear();month=d.getMonth();selected=iso(year,month,1);clearEdit();render();}
$("prev").addEventListener("click",()=>shift(-1));$("next").addEventListener("click",()=>shift(1));
$("go-today").addEventListener("click",()=>{year=today.getFullYear();month=today.getMonth();selected=iso(year,month,today.getDate());clearEdit();render();});
render();
