"use strict";
(()=>{
const $=id=>document.getElementById(id),yen=n=>Math.round(n).toLocaleString("ja-JP")+"円",pad=n=>String(n).padStart(2,"0");
const today=new Date(),localDate=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
$("loan-start").value=localDate(today);$("loan-asof").value=localDate(today);
function monthlyDate(first,index){const year=first.getFullYear(),month=first.getMonth()+index,day=first.getDate(),end=new Date(year,month+1,0).getDate();return new Date(year,month,Math.min(day,end));}
$("loan-detail-calc").addEventListener("click",()=>{
 const p=Number($("principal").value)*10000,annual=Number($("rate").value),years=Number($("years").value);
 const first=$("loan-start").value,asof=$("loan-asof").value,out=$("result");
 if(!Number.isFinite(p)||p<=0||p>1e12||!Number.isFinite(annual)||annual<0||annual>100||!Number.isInteger(years)||years<1||years>100||!/^\d{4}-\d{2}-\d{2}$/.test(first)||!/^\d{4}-\d{2}-\d{2}$/.test(asof)){out.textContent="借入額・金利・期間・日付を確認してください。";return;}
 const start=new Date(first+"T12:00:00"),check=new Date(asof+"T12:00:00");
 if(localDate(start)!==first||localDate(check)!==asof){out.textContent="日付を確認してください。";return;}
 const n=years*12,r=annual/1200,regular=r===0?p/n:p*r/(1-Math.pow(1+r,-n));
 if(!Number.isFinite(regular)){out.textContent="計算できませんでした。";return;}
 let balance=p,paid=0,count=0,totalInterest=0,lastDate=start;
 for(let i=0;i<n;i++){
  const date=monthlyDate(start,i),interest=balance*r,payment=Math.min(balance+interest,regular);
  if(date<=check){balance=Math.max(0,balance+interest-payment);paid+=payment;totalInterest+=interest;count++;}
  if(i===n-1)lastDate=date;
 }
 const total=regular*n,remaining=Math.max(0,balance);
 out.replaceChildren();
 const rows=[["初回返済日",first],["完済予定日",localDate(lastDate)],["毎月の返済額（概算）",yen(regular)],["総返済予定額（概算）",yen(total)],["確認日時点",asof],["支払済み回数",`${count}回 / ${n}回`],["残りの元金（概算）",yen(remaining)],["残りの返済予定総額（概算）",yen(Math.max(0,total-paid))]];
 for(const [label,value] of rows){const row=document.createElement("div");row.className="pay-row";const a=document.createElement("span");a.textContent=label;const b=document.createElement("strong");b.textContent=value;row.append(a,b);out.append(row);}
 const note=document.createElement("p");note.className="hint";note.textContent="固定金利・元利均等返済で、初回返済日から毎月予定どおり支払った場合の推計です。実際の残高は融資実行日、端数処理、金利変更、繰上返済、延滞、手数料などで異なります。";out.append(note);
});
})();