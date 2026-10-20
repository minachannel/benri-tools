"use strict";
(()=>{
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||"null")||f}catch{return f}};
const pad=n=>String(n).padStart(2,"0"),date=(y,m,d)=>`${y}-${pad(m)}-${pad(d)}`,days=(y,m)=>new Date(y,m,0).getDate(),shift=(y,m,n)=>{const d=new Date(y,m-1+n,1);return[d.getFullYear(),d.getMonth()+1]};
function draw(){const fin=read("benri-tools-finance-v1",{accounts:[],cards:[],fixed:[],extras:[]}),cfg=read("benri-tools-cashflow-v1",{payrollAccounts:{},deposits:[]});const today=new Date(),todayStr=date(today.getFullYear(),today.getMonth()+1,today.getDate()),month=`${year}-${pad(month+1)}`;
const accounts=fin.accounts||[],out={};const last=(y,m,n)=>n==="end"?days(y,m):Math.min(Number(n),days(y,m));
const add=(dt,account,amount)=>{if(dt<todayStr||!dt.startsWith(month))return;const key=dt+"|"+account;out[key]=(out[key]||0)+amount};
const due=(card,spent)=>{const [y,m,d]=spent.split("-").map(Number),[cy,cm]=d<=last(y,m,card.close)?[y,m]:shift(y,m,1),[py,pm]=shift(cy,cm,Number(card.offset));return date(py,pm,last(py,pm,card.pay))};
const payment=(item,spent)=>{if(item.method==="cash")return;let dt=spent,account=item.target;if(item.method==="card"){const c=(fin.cards||[]).find(x=>x.id===item.target);if(!c)return;dt=due(c,spent);account=c.account}add(dt,account,Number(item.amount)||0)};
for(let back=0;back<=4;back++){const [y,m]=shift(year,month+1,-back),ym=`${y}-${pad(m)}`;for(const f of fin.fixed||[]){if(f.start>ym)continue;payment(f,date(y,m,last(y,m,f.day)))}}
for(const e of fin.extras||[])payment(e,e.date);
// The calendar highlights upcoming withdrawals; balance warnings require complete income projections on the finance page.
const dates=new Set(Object.keys(out).filter(k=>out[k]>0).map(k=>k.slice(0,10)));
for(const button of document.querySelectorAll("#calendar .day")){const n=Number(button.firstChild?.textContent),dt=month+"-"+pad(n);if(!dates.has(dt))continue;button.classList.add("has-payment");}
}
document.addEventListener("calendar-rendered",draw);draw();
})();