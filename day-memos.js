"use strict";
(()=>{
const KEY="benri-tools-day-memos-v1",HOL="benri-tools-holidays-v1",WORK="benri-tools-work-v2",EXP="benri-tools-expenses-v1";
const $=id=>document.getElementById(id);
let memos={};
try{const x=JSON.parse(localStorage.getItem(KEY)||"{}");if(x&&typeof x==="object"&&!Array.isArray(x))memos=x;}catch(e){$("memo-status").textContent="メモの読み込みに失敗しました。";}
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch(e){return fallback;}};
const yen=n=>Math.round(n).toLocaleString("ja-JP")+"円";
const getDate=()=>selected;
function updateMemoForm(){
 $("day-memo").value=typeof memos[getDate()]==="string"?memos[getDate()]:"";
 $("delete-memo").hidden=!memos[getDate()];
 $("memo-status").textContent="";
}
function save(){
 try{localStorage.setItem(KEY,JSON.stringify(memos));return true;}
 catch(e){$("memo-status").textContent="保存できませんでした。空き容量やブラウザ設定を確認してください。";return false;}
}
$("memo-form").addEventListener("submit",e=>{
 e.preventDefault();const date=getDate(),text=$("day-memo").value.trim(),old=memos[date];
 if(text)memos[date]=text;else delete memos[date];
 if(!save()){if(old===undefined)delete memos[date];else memos[date]=old;return;}
 render();$("memo-status").textContent=text?"メモを保存しました。":"空欄のためメモを削除しました。";
});
$("delete-memo").addEventListener("click",()=>{
 const date=getDate(),old=memos[date];delete memos[date];
 if(!save()){memos[date]=old;return;}
 render();$("memo-status").textContent="メモを削除しました。";
});
function details(date){
 const events=Array.isArray(data[date])?data[date]:[];
 const holidays=read(HOL,{}),work=read(WORK,{}),expenses=read(EXP,[]);
 const shifts=work.shifts?.[date]||{};
 const dayExpenses=Array.isArray(expenses)?expenses.filter(e=>e.date===date):[];
 const items=[];
 if(holidays[date])items.push(["休日","休み"]);
 for(const e of events){const text=typeof e==="string"?e:e?.text;if(text)items.push(["予定",text+(e?.time?" "+e.time:"")]);}
 for(const [id,rec] of Object.entries(shifts)){
  const name=work.places?.find(p=>p.id===id)?.name||"勤務先";
  items.push(["勤務",`${name} ${rec.start||""}〜${rec.end||""}${rec.overnight?"（翌日）":""}`]);
 }
 for(const e of dayExpenses)items.push(["経費",`${e.merchant||"経費"} ${yen(Number(e.amount)||0)}`]);
 if(memos[date])items.push(["メモ",memos[date]]);
 return items;
}
function render(){
 updateMemoForm();
 const prefix=`${year}-${pad(month+1)}-`;
 document.querySelectorAll("#calendar .day").forEach(btn=>{
  const d=Number(btn.firstChild?.textContent),date=prefix+pad(d),items=details(date);
  btn.classList.toggle("has-entry",items.length>0);
  if(!items.length)return;
  const types=[...new Set(items.map(x=>x[0]))];
  const indicator=document.createElement("span");indicator.className="entry-indicator";
  indicator.textContent=types.map(t=>({"休日":"休","予定":"予","勤務":"勤","経費":"経","メモ":"メ"})[t]).join(" ");
  btn.append(indicator);
  btn.setAttribute("aria-label",`${btn.getAttribute("aria-label")}、登録あり：${types.join("、")}`);
 });
}
function showPopup(date){
 const items=details(date);if(!items.length)return;
 $("popup-title").textContent=`${date.replaceAll("-","/")} の登録内容`;
 const content=$("popup-content");content.replaceChildren();
 items.forEach(([type,value])=>{
  const row=document.createElement("div");row.className="popup-entry";
  const tag=document.createElement("strong");tag.textContent=type;
  const txt=document.createElement("span");txt.textContent=value;
  row.append(tag,txt);content.append(row);
 });
 const dlg=$("day-popup");if(typeof dlg.showModal==="function")dlg.showModal();else dlg.setAttribute("open","");
}
$("close-popup").addEventListener("click",()=>$("day-popup").close());
$("popup-edit").addEventListener("click",()=>{
 $("day-popup").close();$("selected-title").scrollIntoView({behavior:"smooth",block:"start"});
});
$("day-popup").addEventListener("click",e=>{if(e.target===$("day-popup"))$("day-popup").close();});
document.addEventListener("calendar-rendered",render);
document.addEventListener("calendar-day-tapped",e=>showPopup(e.detail.date));
render();
})();