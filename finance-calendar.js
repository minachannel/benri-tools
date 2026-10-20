"use strict";
(()=>{
const $=id=>document.getElementById(id),read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||"null")||f}catch{return f}};
const pad=n=>String(n).padStart(2,"0"),date=(y,m,d)=>`${y}-${pad(m)}-${pad(d)}`;
const days=(y,m)=>new Date(y,m,0).getDate(),shift=(y,m,n)=>{const d=new Date(y,m-1+n,1);return[d.getFullYear(),d.getMonth()+1]};
const dueFor=(card,spent)=>{const [y,m,d]=spent.split("-").map(Number),cut=card.close==="end"?days(y,m):Math.min(Number(card.close),days(y,m));const [cy,cm]=d<=cut?[y,m]:shift(y,m,1);const [py,pm]=shift(cy,cm,Number(card.offset));return date(py,pm,card.pay==="end"?days(py,pm):Math.min(Number(card.pay),days(py,pm)))};
function schedule(){
 const state=read("benri-tools-finance-v1",{accounts:[],cards:[],fixed:[],extras:[]}),result={};
 const add=(day,item)=>{(result[day] ||= []).push(item)};
 const [y,m]=[year,month+1];
 const cards=state.cards||[],accounts=state.accounts||[];
 const process=(item,spent)=>{
  if(item.method==="cash")return;
  let due=spent,account=item.target;
  if(item.method==="card"){const c=cards.find(c=>c.id===item.target);if(!c)return;due=dueFor(c,spent);account=c.account;}
  if(due.startsWith(`${y}-${pad(m)}`))add(due,{name:item.name,amount:Number(item.amount)||0,account:accounts.find(a=>a.id===account)?.name||"口座未設定"});
 };
 for(let back=0;back<=3;back++){const [yy,mm]=shift(y,m,-back),ym=`${yy}-${pad(mm)}`;
  for(const f of state.fixed||[]){if(f.start>ym)continue;const d=f.day==="end"?days(yy,mm):Math.min(Number(f.day),days(yy,mm));process(f,date(yy,mm,d))}
 }
 for(const e of state.extras||[])process(e,e.date);
 return result;
}
function decorate(){
 const events=schedule(),prefix=`${year}-${pad(month+1)}-`;
 document.querySelectorAll("#calendar .day").forEach(button=>{
  const n=Number(button.firstChild?.textContent),items=events[prefix+pad(n)];
  if(!items?.length)return;
  button.classList.add("has-entry","has-payment");
  const marker=document.createElement("span");marker.className="entry-indicator";marker.textContent="引";
  button.append(marker);
  button.setAttribute("aria-label",button.getAttribute("aria-label")+"、引落予定あり");
 });
}
document.addEventListener("calendar-rendered",decorate);
document.addEventListener("calendar-day-tapped",e=>{if(window.v17QuickMode)return;
 const entries=schedule()[e.detail.date];if(!entries?.length)return;
 const popup=$("day-popup"),content=$("popup-content");if(!popup||!content)return;
 if(!popup.open){$("popup-title").textContent=e.detail.date.replaceAll("-","/")+" の登録内容";content.replaceChildren();popup.showModal();}
 for(const x of entries){const row=document.createElement("div");row.className="popup-entry";
  const title=document.createElement("strong");title.textContent="引落";
  const text=document.createElement("span");text.textContent=`${x.account} ／ ${x.name} ／ ${Math.round(x.amount).toLocaleString("ja-JP")}円`;
  row.append(title,text);content.append(row);
 }
});
decorate();
})();