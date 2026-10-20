"use strict";
(()=>{
const key="benri-tools-insurance-schedule-v1",pad=n=>String(n).padStart(2,"0"),date=(y,m,d)=>`${y}-${pad(m)}-${pad(d)}`;
function entries(){let list=[];try{list=JSON.parse(localStorage.getItem(key)||"[]");}catch{}if(!Array.isArray(list))return {};
const result={},prefix=`${year}-${pad(month+1)}`;
for(const item of list){if(!/^\d{4}-\d\d-\d\d$/.test(item.next)||!Number.isInteger(Number(item.cycle))||Number(item.cycle)<1)continue;
const [y,m,d]=item.next.split("-").map(Number),interval=Number(item.cycle);if(year<y||(year-y)%interval!==0||m!==month+1)continue;
const dd=Math.min(d,new Date(year,m,0).getDate()),day=date(year,m,dd);(result[day] ||= []).push(item);}
return result;}
function decorate(){const all=entries(),prefix=`${year}-${pad(month+1)}-`;
document.querySelectorAll("#calendar .day").forEach(button=>{const n=Number(button.firstChild?.textContent),items=all[prefix+pad(n)];if(!items?.length)return;
button.classList.add("has-entry","has-insurance");const tag=document.createElement("span");tag.className="entry-indicator";tag.textContent="保";button.append(tag);button.setAttribute("aria-label",button.getAttribute("aria-label")+"、保険料の支払予定あり");});}
document.addEventListener("calendar-rendered",decorate);
document.addEventListener("calendar-day-tapped",e=>{const items=entries()[e.detail.date];if(!items?.length)return;
const dlg=document.getElementById("day-popup"),content=document.getElementById("popup-content");if(!dlg||!content)return;
if(!dlg.open){document.getElementById("popup-title").textContent=e.detail.date.replaceAll("-","/")+" の登録内容";content.replaceChildren();dlg.showModal();}
for(const item of items){const row=document.createElement("div");row.className="popup-entry";const title=document.createElement("strong");title.textContent="保険";const text=document.createElement("span");text.textContent=`${item.name}：${Number(item.amount).toLocaleString("ja-JP")}円（予定）`;row.append(title,text);content.append(row);}});
decorate();
})();
