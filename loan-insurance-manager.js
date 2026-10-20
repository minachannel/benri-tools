"use strict";
(()=>{
const $=id=>document.getElementById(id), LK="benri-tools-saved-loans-v1", IK="benri-tools-insurance-schedule-v1", ACK="benri-tools-insurance-notified-v1";
const read=(key,f)=>{try{const x=JSON.parse(localStorage.getItem(key)||"null");return Array.isArray(x)?x:f;}catch{return f;}};
let loans=read(LK,[]),insurance=read(IK,[]);
const fmt=n=>Math.round(n).toLocaleString("ja-JP")+"円", pad=n=>String(n).padStart(2,"0"),today=new Date();
const localDate=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2);
const store=(key,items)=>{try{localStorage.setItem(key,JSON.stringify(items));return true;}catch{$("manager-status").textContent="保存に失敗しました。";return false;}};
const validDate=s=>/^\d{4}-\d\d-\d\d$/.test(s)&&localDate(new Date(s+"T12:00:00"))===s;
function monthDate(first,i){const d=new Date(first.getFullYear(),first.getMonth()+i,1);return new Date(d.getFullYear(),d.getMonth(),Math.min(first.getDate(),new Date(d.getFullYear(),d.getMonth()+1,0).getDate()));}
function loanStats(l,asof){const principal=l.principal*10000,rate=l.rate/1200,n=l.years*12,regular=rate===0?principal/n:principal*rate/(1-Math.pow(1+rate,-n));
let balance=principal,paid=0;const start=new Date(l.start+"T12:00:00"),check=new Date(asof+"T12:00:00");
for(let i=0;i<n;i++){if(monthDate(start,i)>check)break;const interest=balance*rate,payment=Math.min(balance+interest,regular);balance=Math.max(0,balance+interest-payment);paid++;}
return {balance,paid,regular,end:localDate(monthDate(start,n-1))};}
function entry(box,title,lines,del,edit){const item=document.createElement("div");item.className="manager-item";const h=document.createElement("strong");h.textContent=title;item.append(h);
for(const line of lines){const d=document.createElement("div");d.className="hint";d.textContent=line;item.append(d);}
if(edit){const b=document.createElement("button");b.type="button";b.className="secondary-button";b.textContent="編集";b.addEventListener("click",edit);item.append(b);}
const b=document.createElement("button");b.type="button";b.className="secondary-button";b.textContent="削除";b.addEventListener("click",del);item.append(b);box.append(item);}
let editingLoan=null,editingInsurance=null;
function showLoans(){const box=$("loan-list");box.replaceChildren();const asof=validDate($("loan-asof").value)?$("loan-asof").value:localDate(today);
let total=0;for(const l of loans){const r=loanStats(l,asof);total+=r.balance;entry(box,l.name,[`元金残高（${asof}時点の概算）：${fmt(r.balance)}`,`毎月：${fmt(r.regular)} ／ 完済予定：${r.end} ／ ${r.paid}/${l.years*12}回`],()=>{if(!confirm("このローンを削除しますか？"))return;const old=loans;loans=loans.filter(x=>x.id!==l.id);if(!store(LK,loans))loans=old;showLoans();},()=>{
editingLoan=l.id;$("loan-name").value=l.name;$("principal").value=l.principal;$("rate").value=l.rate;$("years").value=l.years;$("loan-start").value=l.start;$("loan-save").textContent="このローンを更新";$("loan-name").focus();});}
if(loans.length){const p=document.createElement("p");p.textContent=`ローン残高合計（概算）：${fmt(total)}`;p.style.fontWeight="bold";box.prepend(p);}else box.textContent="登録済みローンはありません。";}
$("loan-save").addEventListener("click",()=>{const name=$("loan-name").value.trim(),principal=Number($("principal").value),rate=Number($("rate").value),years=Number($("years").value),start=$("loan-start").value;
if(!name||!Number.isFinite(principal)||principal<=0||principal>100000000||!Number.isFinite(rate)||rate<0||rate>100||!Number.isInteger(years)||years<1||years>100||!validDate(start)){$("manager-status").textContent="ローンの入力内容を確認してください。";return;}
const l={id:editingLoan||uid(),name,principal,rate,years,start},old=[...loans];loans=loans.filter(x=>x.id!==l.id);loans.push(l);
if(!store(LK,loans)){loans=old;return;}editingLoan=null;$("loan-save").textContent="このローンを登録・更新";$("loan-name").value="";$("manager-status").textContent="ローンを保存しました。";showLoans();});
$("loan-asof").addEventListener("change",showLoans);
function nextDate(item,reference){const [y,m,d]=item.next.split("-").map(Number);let cy=y;const interval=Number(item.cycle);if(!Number.isInteger(interval)||interval<1)return item.next;
while(cy<=9999){const last=new Date(cy,m,0).getDate(),s=`${cy}-${pad(m)}-${pad(Math.min(d,last))}`;if(s>=reference)return s;cy+=interval;}return item.next;}
function showInsurance(){const box=$("insurance-list"),alerts=$("insurance-alerts");box.replaceChildren();alerts.replaceChildren();const now=localDate(today),thisYear=today.getFullYear();
for(const i of insurance){const next=nextDate(i,now),isThisYear=next.startsWith(thisYear+"-");const label=i.kind==="fire"?"火災保険":i.kind==="earthquake"?"地震保険":"その他の保険";
entry(box,`${label}：${i.name}`,[`次回：${next} ／ ${fmt(i.amount)}`,`${i.cycle}年ごと`],()=>{if(!confirm("この保険予定を削除しますか？"))return;const old=insurance;insurance=insurance.filter(x=>x.id!==i.id);if(!store(IK,insurance))insurance=old;showInsurance();},()=>{editingInsurance=i.id;$("insurance-kind").value=i.kind;$("insurance-name").value=i.name;$("insurance-next").value=i.next;$("insurance-amount").value=i.amount;$("insurance-cycle").value=i.cycle;$("insurance-form").querySelector("button").textContent="この保険予定を更新";$("insurance-name").focus();});
if(isThisYear){const a=document.createElement("div");a.className="insurance-warning";a.textContent=`⚠️ 今年は${label}「${i.name}」の支払年です！ ${next}に${fmt(i.amount)}の予定`;alerts.append(a);}}
if(!insurance.length)box.textContent="保険の支払い予定はまだありません。";}
$("insurance-form").addEventListener("submit",e=>{e.preventDefault();const name=$("insurance-name").value.trim(),next=$("insurance-next").value,amount=Number($("insurance-amount").value),cycle=Number($("insurance-cycle").value);
if(!name||!validDate(next)||!Number.isSafeInteger(amount)||amount<=0||amount>1e11||![1,2,3,5,10].includes(cycle)){$("manager-status").textContent="保険の入力内容を確認してください。";return;}
const item={id:editingInsurance||uid(),kind:$("insurance-kind").value,name,next,amount,cycle},old=[...insurance];insurance=insurance.filter(x=>x.id!==item.id);insurance.push(item);
if(!store(IK,insurance)){insurance=old;return;}editingInsurance=null;$("insurance-form").reset();$("insurance-form").querySelector("button").textContent="保険の支払い予定を保存";$("manager-status").textContent="保険予定を保存しました。";showInsurance();showYearPopup();});
function showYearPopup(){const now=localDate(today),yr=today.getFullYear(),items=insurance.filter(i=>nextDate(i,now).startsWith(yr+"-"));if(!items.length)return;
let acknowledged=[];try{acknowledged=JSON.parse(sessionStorage.getItem(ACK)||"[]");if(!Array.isArray(acknowledged))acknowledged=[];}catch{}
const unseen=items.filter(i=>!acknowledged.includes(i.id+":"+yr));if(!unseen.length)return;
const dlg=document.createElement("dialog");dlg.id="insurance-year-dialog";const title=document.createElement("h3");title.textContent=`⚠️ ${yr}年は保険料の支払年です！`;dlg.append(title);
for(const i of unseen){const p=document.createElement("p");p.textContent=`${i.name}：${nextDate(i,now)} ／ ${fmt(i.amount)}`;dlg.append(p);}
const b=document.createElement("button");b.className="calc";b.type="button";b.textContent="確認しました";b.addEventListener("click",()=>{try{sessionStorage.setItem(ACK,JSON.stringify([...acknowledged,...unseen.map(i=>i.id+":"+yr)]));}catch{}dlg.close();dlg.remove();});dlg.append(b);document.body.append(dlg);if(dlg.showModal)dlg.showModal();else dlg.setAttribute("open","");}
showLoans();showInsurance();showYearPopup();
})();
