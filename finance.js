"use strict";
(()=>{
const K="benri-tools-finance-v1",W="benri-tools-work-v2",$=id=>document.getElementById(id);
const money=n=>Math.round(n).toLocaleString("ja-JP")+"円",pad=n=>String(n).padStart(2,"0");
const date=(y,m,d)=>`${y}-${pad(m)}-${pad(d)}`,days=(y,m)=>new Date(y,m,0).getDate();
const shift=(y,m,n)=>{const d=new Date(y,m-1+n,1);return[d.getFullYear(),d.getMonth()+1]};
const day=(y,m,value)=>value==="end"?days(y,m):Math.min(Number(value),days(y,m));
const parseDate=s=>{const [y,m,d]=s.split("-").map(Number);return[y,m,d]};
const read=(key,f)=>{try{return JSON.parse(localStorage.getItem(key)||"null")||f}catch{return f}};
let state=read(K,{accounts:[],cards:[],fixed:[],extras:[]});
for(const key of ["accounts","cards","fixed","extras"])if(!Array.isArray(state[key]))state[key]=[];
const store=()=>{try{localStorage.setItem(K,JSON.stringify(state));return true}catch{$("finance-status").textContent="保存に失敗しました。ブラウザの容量を確認してください。";return false}};
const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,9);
const makeSelect=(id)=>{const s=$(id);for(let n=1;n<=28;n++){const o=document.createElement("option");o.value=String(n);o.textContent=n+"日";s.append(o)}const o=document.createElement("option");o.value="end";o.textContent="月末";s.append(o)};
for(const x of ["card-close","card-pay","fixed-day"])makeSelect(x);
$("card-close").value="end";$("card-pay").value="27";$("fixed-day").value="27";
const now=new Date(),current=date(now.getFullYear(),now.getMonth()+1,now.getDate());
$("fm").value=current.slice(0,7);$("fixed-start").value=current.slice(0,7);$("extra-date").value=current;
function choices(select,items,placeholder){const previous=select.value;select.replaceChildren();if(!items.length){const o=document.createElement("option");o.value="";o.textContent=placeholder;select.append(o)}else items.forEach(item=>{const o=document.createElement("option");o.value=item.id;o.textContent=item.name;select.append(o)});if(items.some(x=>x.id===previous))select.value=previous;}
function updateTargets(){
 choices($("card-account"),state.accounts,"口座を先に登録");
 const cardMode=$("fixed-method").value==="card",cash=$("fixed-method").value==="cash";
 choices($("fixed-target"),cardMode?state.cards:state.accounts,cash?"支払い先なし":"先に登録");
 $("fixed-target").disabled=cash;
 const extraCard=$("extra-method").value==="card",extraCash=$("extra-method").value==="cash";
 choices($("extra-target"),extraCard?state.cards:state.accounts,extraCash?"支払い先なし":"先に登録");
 $("extra-target").disabled=extraCash;
}
function itemRow(container,label,onDelete){
 const row=document.createElement("div");row.className="pay-row";
 const text=document.createElement("span");text.textContent=label;
 const del=document.createElement("button");del.type="button";del.textContent="削除";del.className="secondary-button";del.style.width="auto";del.style.marginTop="0";
 del.addEventListener("click",()=>{if(confirm("この登録を削除しますか？"))onDelete()});
 row.append(text,del);container.append(row);
}
function remove(group,item){const backup=state[group];state[group]=backup.filter(x=>x.id!==item.id);if(!store())state[group]=backup;render();}
function form(formId,callback){$(formId).addEventListener("submit",e=>{e.preventDefault();try{callback()}catch(err){$("finance-status").textContent="入力内容を確認してください。"}})}
const number=id=>Number($(id).value);
function validAmount(id,allowZero=false){const raw=$(id).value,n=Number(raw);if(raw===""||!Number.isSafeInteger(n)||n<(allowZero?0:1)||n>1e10)throw Error("invalid");return n}
form("account-form",()=>{const name=$("account-name").value.trim(),raw=$("account-balance").value,balance=raw===""?null:validAmount("account-balance",true);if(!name)throw Error();state.accounts.push({id:id(),name,balance});if(store()){$("account-name").value="";$("account-balance").value="";render()}else state.accounts.pop()});
form("card-form",()=>{const name=$("card-name").value.trim(),account=$("card-account").value;if(!name||!state.accounts.some(a=>a.id===account))throw Error();state.cards.push({id:id(),name,account,close:$("card-close").value,pay:$("card-pay").value,offset:Number($("card-offset").value)});if(store()){$("card-name").value="";render()}else state.cards.pop()});
function paymentTarget(method,target){if(method==="cash")return true;return method==="card"?state.cards.some(c=>c.id===target):state.accounts.some(a=>a.id===target)}
form("fixed-form",()=>{const name=$("fixed-name").value.trim(),amount=validAmount("fixed-amount",true),method=$("fixed-method").value,target=method==="cash"?"":$("fixed-target").value,dayValue=$("fixed-day").value,start=$("fixed-start").value;if(!name||!paymentTarget(method,target)||!/^\d{4}-\d{2}$/.test(start))throw Error();state.fixed.push({id:id(),name,amount,method,target,day:dayValue,start});if(store()){$("fixed-name").value="";$("fixed-amount").value="";render()}else state.fixed.pop()});
form("extra-form",()=>{const name=$("extra-name").value.trim(),amount=validAmount("extra-amount"),method=$("extra-method").value,target=method==="cash"?"":$("extra-target").value,spent=$("extra-date").value;if(!name||!paymentTarget(method,target)||!/^\d{4}-\d\d-\d\d$/.test(spent))throw Error();state.extras.push({id:id(),name,amount,method,target,date:spent});if(store()){$("extra-name").value="";$("extra-amount").value="";render()}else state.extras.pop()});
$("fixed-method").addEventListener("change",updateTargets);$("extra-method").addEventListener("change",updateTargets);
$("fm").addEventListener("change",render);
function cardDue(card,spent){
 const [y,m,d]=parseDate(spent),cut=day(y,m,card.close);
 const [cy,cm]=d<=cut?[y,m]:shift(y,m,1);
 const [py,pm]=shift(cy,cm,card.offset);
 return date(py,pm,day(py,pm,card.pay));
}
function entriesForMonth(monthKey){
 const [y,m]=monthKey.split("-").map(Number);
 const out=[];
 const push=(item,spent)=>{let due=spent,account=item.method==="account"?item.target:"",cardName="";
  if(item.method==="card"){const card=state.cards.find(c=>c.id===item.target);if(!card)return;due=cardDue(card,spent);account=card.account;cardName=card.name}
  out.push({name:item.name,amount:item.amount,method:item.method,spent,due,account,cardName});
 };
 // Include prior card spending that falls due in the selected month.
 for(let back=0;back<=3;back++){
  const [yy,mm]=shift(y,m,-back),ym=`${yy}-${pad(mm)}`;
  for(const f of state.fixed){if(f.start>ym)continue;push(f,date(yy,mm,day(yy,mm,f.day)))}
 }
 for(const e of state.extras)push(e,e.date);
 return out;
}
function income(monthKey){
 const w=read(W,{places:[],shifts:{}}),ids=new Set((w.places||[]).map(p=>p.id));let total=0;
 for(const [dt,records] of Object.entries(w.shifts||{})){if(!dt.startsWith(monthKey))continue;
  for(const [pid,r] of Object.entries(records||{})){if(!ids.has(pid))continue;
   const time=t=>{if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(t||""))return NaN;const [h,m]=t.split(":").map(Number);return h*60+m};
   const duration=time(r.end)-time(r.start)+(r.overnight?1440:0),rest=Number(r.breakMinutes),wage=Number(r.wage);
   if(!Number.isFinite(duration)||duration<=0||duration>1440||rest<0||rest>duration||!Number.isFinite(wage)||wage<0)continue;
   total+=r.payType==="daily"?wage:wage*(duration-rest)/60;
  }
 }return total;
}
function render(){
 updateTargets();
 const a=$("accounts");a.replaceChildren();state.accounts.forEach(x=>itemRow(a,`${x.name} ／ 残高 ${x.balance===null?"未設定":money(x.balance)}`,()=>remove("accounts",x)));
 const c=$("cards");c.replaceChildren();state.cards.forEach(x=>itemRow(c,`${x.name} ／ ${state.accounts.find(a=>a.id===x.account)?.name||"口座未登録"} ／ ${x.close==="end"?"月末":x.close+"日"}締め・${x.offset===0?"当月":x.offset===1?"翌月":"翌々月"}${x.pay==="end"?"末日":x.pay+"日"}引落`,()=>remove("cards",x)));
 const f=$("fixed-list");f.replaceChildren();state.fixed.forEach(x=>itemRow(f,`${x.name} ${money(x.amount)} ／ ${x.start}〜 毎月`,()=>remove("fixed",x)));
 const e=$("extra-list");e.replaceChildren();state.extras.filter(x=>x.date.startsWith($("fm").value)).forEach(x=>itemRow(e,`${x.date} ${x.name} ${money(x.amount)}`,()=>remove("extras",x)));
 const ym=$("fm").value;if(!/^\d{4}-\d\d$/.test(ym))return;
 const entries=entriesForMonth(ym),spending=entries.filter(x=>x.spent.startsWith(ym)),due=entries.filter(x=>x.due.startsWith(ym)&&x.method!=="cash");
 const salary=income(ym),spentTotal=spending.reduce((n,x)=>n+x.amount,0),dueTotal=due.reduce((n,x)=>n+x.amount,0);
 $("income").textContent=money(salary);
 $("balance").textContent=`この月の登録支出 ${money(spentTotal)} ／ 差額 ${money(salary-spentTotal)}`;
 $("monthly-summary").textContent=`給与 ${money(salary)} ／ 当月発生支出 ${money(spentTotal)} ／ 差額 ${money(salary-spentTotal)} ／ 当月引落予定 ${money(dueTotal)}`;
 const grouped=new Map();for(const x of due){const key=x.due+"|"+x.account;const item=grouped.get(key)||{date:x.due,account:x.account,total:0,details:[]};item.total+=x.amount;item.details.push(x.name);grouped.set(key,item)}
 const list=$("due-list");list.replaceChildren();
 for(const x of [...grouped.values()].sort((a,b)=>a.date.localeCompare(b.date))){
  const row=document.createElement("div");row.className="pay-row";
  const left=document.createElement("span");left.textContent=`${x.date} ／ ${state.accounts.find(a=>a.id===x.account)?.name||"口座未設定"}（${x.details.join("、")}）`;
  const right=document.createElement("strong");right.textContent=money(x.total);row.append(left,right);list.append(row);
 }
 if(!grouped.size)list.textContent="この月の引き落とし予定はありません。";
 const needed=$("account-needed");needed.replaceChildren();
 for(const a of state.accounts){const total=due.filter(x=>x.account===a.id).reduce((n,x)=>n+x.amount,0);
  const row=document.createElement("div");row.className="salary-summary";
  const title=document.createElement("strong");title.textContent=`${a.name}：月間引落予定 ${money(total)}`;
  const desc=document.createElement("div");desc.className="hint";desc.textContent=a.balance===null?"口座残高が未設定です。":`現在の入力残高 ${money(a.balance)} ／ 追加で必要な目安 ${money(Math.max(0,total-a.balance))}`;
  row.append(title,desc);needed.append(row);
 }
 $("finance-status").textContent="";
}
render();
})();