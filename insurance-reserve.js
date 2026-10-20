"use strict";
(()=>{
const $=id=>document.getElementById(id),POL="benri-tools-insurance-schedule-v1",RES="benri-tools-insurance-reserve-v1",FIN="benri-tools-finance-v1";
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||"null")??f}catch{return f}};
let config=read(RES,{});if(!config||typeof config!=="object"||Array.isArray(config))config={};
const money=n=>Math.ceil(n).toLocaleString("ja-JP")+"円",pad=n=>String(n).padStart(2,"0"),today=new Date();
const iso=(y,m,d)=>`${y}-${pad(m)}-${pad(d)}`;
const valid=s=>/^\d{4}-\d\d-\d\d$/.test(s)&&!Number.isNaN(new Date(s+"T12:00:00").getTime());
function upcoming(p){if(!valid(p.next)||!Number.isInteger(Number(p.cycle))||Number(p.cycle)<1)return null;
const [y,m,d]=p.next.split("-").map(Number),cycle=Number(p.cycle),now=iso(today.getFullYear(),today.getMonth()+1,today.getDate());
for(let yy=y;yy<=9999;yy+=cycle){const day=iso(yy,m,Math.min(d,new Date(yy,m,0).getDate()));if(day>=now)return day;}return null;}
function monthsTo(date){const [y,m]=date.split("-").map(Number);return Math.max(1,(y-today.getFullYear())*12+m-today.getMonth());}
function save(){try{localStorage.setItem(RES,JSON.stringify(config));return true}catch{$("insurance-reserve-message").textContent="保存に失敗しました。";return false}}
function render(){const policies=read(POL,[]),accounts=read(FIN,{accounts:[]}).accounts||[],list=$("insurance-reserve-list");list.replaceChildren();
const accountSelect=$("insurance-reserve-account");accountSelect.replaceChildren();for(const a of accounts){const opt=document.createElement("option");opt.value=a.id;opt.textContent=a.name;accountSelect.append(opt)}
if(!Array.isArray(policies)||!policies.length){list.textContent="ローン管理ページで火災保険・地震保険を登録してください。";return}
for(const p of policies){const due=upcoming(p);if(!due)continue;const saved=config[p.id]||{},amount=Number(p.amount),already=Number(saved.saved)||0,remaining=Math.max(0,amount-already),monthly=Math.ceil(remaining/monthsTo(due));
const box=document.createElement("div");box.className="manager-item";
const title=document.createElement("strong");title.textContent=`${p.name} ／ 次回 ${due} ／ ${money(amount)}`;box.append(title);
const summary=document.createElement("p");summary.className="hint";summary.textContent=`あと ${monthsTo(due)}か月の積立目安：毎月 ${money(monthly)} ／ 未準備額 ${money(remaining)}`;box.append(summary);
const label=document.createElement("label");label.textContent="積立済み金額（円）";const input=document.createElement("input");input.type="number";input.min="0";input.max="100000000000";input.step="1";input.value=already;label.append(input);box.append(label);
const accountLabel=document.createElement("label");accountLabel.textContent="引き落とし口座";const select=document.createElement("select");const empty=document.createElement("option");empty.value="";empty.textContent="未設定（予測には含めない）";select.append(empty);for(const a of accounts){const o=document.createElement("option");o.value=a.id;o.textContent=a.name;select.append(o)}select.value=accounts.some(a=>a.id===saved.account)?saved.account:"";accountLabel.append(select);box.append(accountLabel);
const button=document.createElement("button");button.type="button";button.className="secondary-button";button.textContent="積立額と口座を保存";button.addEventListener("click",()=>{const n=Number(input.value);if(input.value===""||!Number.isSafeInteger(n)||n<0||n>1e11){$("insurance-reserve-message").textContent="積立額を確認してください。";return}const old=config[p.id];config[p.id]={saved:n,account:select.value};if(!save()){if(old===undefined)delete config[p.id];else config[p.id]=old;return}$("insurance-reserve-message").textContent="保存しました。";render();document.dispatchEvent(new Event("insurance-reserve-updated"));});box.append(button);list.append(box);
}}
$("fm").addEventListener("change",render);render();
})();