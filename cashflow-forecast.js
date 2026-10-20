"use strict";
(()=>{
const $=id=>document.getElementById(id),FIN="benri-tools-finance-v1",WORK="benri-tools-work-v2",PAY="benri-tools-goals-paydays-v1",KEY="benri-tools-cashflow-v1";
const read=(key,f)=>{try{return JSON.parse(localStorage.getItem(key)||"null")||f}catch{return f}};
let cfg=read(KEY,{payrollAccounts:{},deposits:[]});if(!cfg||typeof cfg!=="object")cfg={payrollAccounts:{},deposits:[]};cfg.payrollAccounts||={};if(!Array.isArray(cfg.deposits))cfg.deposits=[];
const money=n=>Math.round(n).toLocaleString("ja-JP")+"円",pad=n=>String(n).padStart(2,"0"),date=(y,m,d)=>`${y}-${pad(m)}-${pad(d)}`;
const days=(y,m)=>new Date(y,m,0).getDate(),shift=(y,m,n)=>{const d=new Date(y,m-1+n,1);return[d.getFullYear(),d.getMonth()+1]},last=(y,m,day)=>day==="end"?days(y,m):Math.min(Number(day),days(y,m));
const isoToday=()=>{const d=new Date();return date(d.getFullYear(),d.getMonth()+1,d.getDate())};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(cfg));return true}catch{$("forecast-status").textContent="保存できませんでした。";return false}};
const time=t=>{if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(t||""))return NaN;const [h,m]=t.split(":").map(Number);return h*60+m};
function wage(r){if(!r)return null;const w=Number(r.wage),rest=Number(r.breakMinutes),duration=time(r.end)-time(r.start)+(r.overnight?1440:0);if(!Number.isFinite(w)||w<0||w>1e6||!Number.isInteger(rest)||rest<0||duration<=0||duration>1440||rest>duration)return null;return r.payType==="daily"?w:w*(duration-rest)/60}
function workTotal(shifts,from,to,id){let total=0;for(const [day,entries] of Object.entries(shifts)){if(day<from||day>to)continue;const n=wage(entries?.[id]);if(n!==null)total+=n}return total}
function paydayItems(start,end){const work=read(WORK,{places:[],shifts:{}}),settings=read(PAY,{pay:{}}),items=[],missing=[];
for(const place of work.places||[]){const pay=settings.pay?.[place.id];if(!pay)continue;const account=cfg.payrollAccounts[place.id];
// Evaluate payroll periods with closing dates in preceding months too.
const [sy,sm]=start.slice(0,7).split("-").map(Number);
for(let delta=-3;delta<=16;delta++){const [y,m]=shift(sy,sm,delta),[py,pm]=shift(y,m,-1);const previousClose=new Date(py,pm-1,last(py,pm,pay.close)+1);
const from=date(previousClose.getFullYear(),previousClose.getMonth()+1,previousClose.getDate()),to=date(y,m,last(y,m,pay.close));
const [yy,mm]=shift(y,m,Number(pay.offset)),paydate=date(yy,mm,last(yy,mm,pay.day));if(paydate<start||paydate>end)continue;
const amount=workTotal(work.shifts||{},from,to,place.id);if(amount<=0)continue;
if(!account){missing.push(place.name);continue}items.push({date:paydate,account,amount,name:`給与見込み：${place.name}`,kind:"in"});
}}
return {items,missing:[...new Set(missing)]};}
function cardDue(card,spent){const [y,m,d]=spent.split("-").map(Number),cut=last(y,m,card.close),[cy,cm]=d<=cut?[y,m]:shift(y,m,1),[py,pm]=shift(cy,cm,Number(card.offset));return date(py,pm,last(py,pm,card.pay))}
function payments(start,end){const f=read(FIN,{accounts:[],cards:[],fixed:[],extras:[]}),items=[];
function push(item,spent){if(item.method==="cash")return;let due=spent,account=item.target;
if(item.method==="card"){const card=(f.cards||[]).find(c=>c.id===item.target);if(!card)return;due=cardDue(card,spent);account=card.account}
if(due>=start&&due<=end&&Number(item.amount)>0)items.push({date:due,account,amount:Number(item.amount),name:item.name,kind:"out"});}
const [sy,sm]=start.slice(0,7).split("-").map(Number),[ey,em]=end.slice(0,7).split("-").map(Number);
for(let step=-4;step<=20;step++){const [y,m]=shift(sy,sm,step),ym=`${y}-${pad(m)}`;if(ym>`${ey}-${pad(em)}`)break;
for(const item of f.fixed||[]){if(item.start>ym)continue;push(item,date(y,m,last(y,m,item.day)))}}
for(const item of f.extras||[])push(item,item.date);
// Insurance renewals are additional scheduled debits, assigned to an account in the reserve planner.
const policies=read("benri-tools-insurance-schedule-v1",[]),reserves=read("benri-tools-insurance-reserve-v1",{});
for(const policy of Array.isArray(policies)?policies:[]){
 const assigned=reserves?.[policy.id]?.account;if(!assigned||!/^\d{4}-\d\d-\d\d$/.test(policy.next))continue;
 const [iy,im,idd]=policy.next.split("-").map(Number),cycle=Number(policy.cycle),amount=Number(policy.amount);
 if(!Number.isInteger(cycle)||cycle<1||!Number.isFinite(amount)||amount<=0)continue;
 const endYear=Number(end.slice(0,4));
 for(let yy=iy;yy<=endYear;yy+=cycle){const due=date(yy,im,Math.min(idd,days(yy,im)));
 if(due>=start&&due<=end)items.push({date:due,account:assigned,amount,name:`保険料：${policy.name}`,kind:"out"});}
}
return {items,accounts:f.accounts||[]};}
function forecast(month){const today=isoToday(),start=month+"-01",[y,m]=month.split("-").map(Number),end=date(y,m,days(y,m)),rangeStart=today;
const {items:outgoing,accounts}=payments(rangeStart,end),{items:salary,missing}=paydayItems(rangeStart,end);
const manual=cfg.deposits.filter(d=>d.date>=rangeStart&&d.date<=end).map(d=>({...d,kind:"in"}));
const all=[...outgoing,...salary,...manual].filter(x=>accounts.some(a=>a.id===x.account)).sort((a,b)=>a.date.localeCompare(b.date)||(a.kind==="in"?-1:1));
const result=[],balances=new Map(accounts.map(a=>[a.id,a.balance===null?null:Number(a.balance)]));
const byDay=new Map();for(const e of all){const key=e.date+"|"+e.account;const row=byDay.get(key)||{date:e.date,account:e.account,in:0,out:0,items:[]};row[e.kind]+=e.amount;row.items.push(e);byDay.set(key,row)}
for(const row of [...byDay.values()].sort((a,b)=>a.date.localeCompare(b.date))){const previous=balances.get(row.account),balance=previous===null?null:previous+row.in-row.out;if(balance!==null)balances.set(row.account,balance);result.push({...row,balance,shortage:balance!==null&&balance<0?Math.abs(balance):0,unknown:balance===null})}
return {result:result.filter(r=>r.date>=start),accounts,missing,rangeStart,expired:end<today};}
function optionList(select,items,placeholder){const old=select.value;select.replaceChildren();if(!items.length){const o=document.createElement("option");o.value="";o.textContent=placeholder;select.append(o)}for(const x of items){const o=document.createElement("option");o.value=x.id;o.textContent=x.name;select.append(o)}if(items.some(x=>x.id===old))select.value=old;}
function syncSelectors(){const accounts=read(FIN,{accounts:[]}).accounts||[],places=read(WORK,{places:[]}).places||[];optionList($("payroll-account-place"),places,"職場を先に登録");optionList($("payroll-account"),accounts,"口座を先に登録");optionList($("deposit-account"),accounts,"口座を先に登録");const selected=cfg.payrollAccounts[$("payroll-account-place").value];if(selected&&accounts.some(a=>a.id===selected))$("payroll-account").value=selected;}
$("payroll-account-place").addEventListener("change",()=>{const id=cfg.payrollAccounts[$("payroll-account-place").value];if(id)$("payroll-account").value=id});
$("save-payroll-account").addEventListener("click",()=>{const place=$("payroll-account-place").value,account=$("payroll-account").value;if(!place||!account){$("forecast-status").textContent="職場と口座を登録してから設定してください。";return}cfg.payrollAccounts[place]=account;if(save()){render();$("forecast-status").textContent="給与振込先を保存しました。"}});
$("deposit-date").value=isoToday();
$("deposit-form").addEventListener("submit",e=>{e.preventDefault();const name=$("deposit-name").value.trim(),amount=Number($("deposit-amount").value),day=$("deposit-date").value,account=$("deposit-account").value;if(!name||!Number.isSafeInteger(amount)||amount<=0||!/^\d{4}-\d\d-\d\d$/.test(day)||!account){$("forecast-status").textContent="入金予定を確認してください。";return}const item={id:Date.now().toString(36)+Math.random().toString(36).slice(2),name,amount,date:day,account};cfg.deposits.push(item);if(save()){$("deposit-name").value="";$("deposit-amount").value="";render()}else cfg.deposits.pop()});
function render(){syncSelectors();const month=$("fm").value,report=forecast(month),list=$("cashflow-forecast"),overview=$("shortage-overview"),notes=$("shortage-notes");list.replaceChildren();const shortages=report.result.filter(r=>r.shortage>0);const unknown=report.result.filter(r=>r.unknown);
if(report.expired){overview.textContent="過去の月";notes.textContent="現在残高から過去の口座残高は復元できません。"}
else if(shortages.length){const first=shortages[0];overview.textContent=`⚠️ ${first.date} に ${money(first.shortage)} 不足見込み`;notes.textContent=`不足が見込まれる引き落とし日：${shortages.length}件（口座別）。${unknown.length?"残高未入力の口座は判定できません。":""}`}
else{overview.textContent=unknown.length?"残高未設定の口座あり":"登録済み取引では不足予測なし";notes.textContent=unknown.length?"口座残高を入力すると不足額を計算できます。":"未登録の支出や給与控除は計算に含みません。"}
if(report.missing.length){const warn=document.createElement("p");warn.className="hint";warn.textContent=`給与振込先が未設定：${report.missing.join("、")}。この給与は予測に含めていません。`;list.append(warn)}
for(const r of report.result){const a=report.accounts.find(x=>x.id===r.account),row=document.createElement("div");row.className="forecast-row"+(r.shortage?" forecast-danger":"");const title=document.createElement("strong");title.textContent=`${r.date} ／ ${a?.name||"不明な口座"}`;const info=document.createElement("div");info.textContent=`入金 ${money(r.in)} ／ 引落 ${money(r.out)} ／ 予定残高 ${r.unknown?"残高未入力":money(r.balance)}`;row.append(title,info);if(r.shortage){const warning=document.createElement("strong");warning.textContent=`不足見込み ${money(r.shortage)}`;row.append(warning)}list.append(row)}
if(!report.result.length){const p=document.createElement("p");p.className="hint";p.textContent="この月の今後の入出金予定はありません。";list.append(p)}
const deposits=$("deposit-list");deposits.replaceChildren();for(const d of cfg.deposits){const row=document.createElement("div");row.className="pay-row";const label=document.createElement("span");label.textContent=`${d.date} ${d.name} ${money(d.amount)}`;const button=document.createElement("button");button.type="button";button.className="secondary-button";button.textContent="削除";button.addEventListener("click",()=>{if(!confirm("この入金予定を削除しますか？"))return;const old=cfg.deposits;cfg.deposits=old.filter(x=>x.id!==d.id);if(!save())cfg.deposits=old;render()});row.append(label,button);deposits.append(row)}
}
$("fm").addEventListener("change",render);
document.addEventListener("insurance-reserve-updated",render);
for(const id of ["account-form","card-form","fixed-form","extra-form"]){$(id).addEventListener("submit",()=>setTimeout(render,0))}
render();
})();