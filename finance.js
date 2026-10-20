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
function itemRow(container,label,onDelete,onEdit){
 const row=document.createElement("div");row.className="pay-row";
 const text=document.createElement("span");text.textContent=label;
 const del=document.createElement("button");del.type="button";del.textContent="削除";del.className="secondary-button";del.style.width="auto";del.style.marginTop="0";
 del.addEventListener("click",()=>{if(confirm("この登録を削除しますか？"))onDelete()});
 if(onEdit){const edit=document.createElement("button");edit.type="button";edit.textContent="編集";edit.className="secondary-button";edit.style.width="auto";edit.style.marginTop="0";edit.addEventListener("click",onEdit);row.append(text,edit,del);}else row.append(text,del);container.append(row);
}
const EDIT_FIELDS={accounts:[['name','口座名','text'],['balance','現在残高（空欄で未設定）','number']],cards:[['name','カード名','text'],['account','引落口座','account'],['close','締め日','day'],['pay','引落日','day'],['offset','引落までの月数','offset']],fixed:[['name','項目名','text'],['amount','金額（円）','number'],['method','支払方法','method'],['target','口座・カード','target'],['day','支払日','day'],['start','開始月','month']],extras:[['name','内容','text'],['amount','金額（円）','number'],['method','支払方法','method'],['target','口座・カード','target'],['date','支出日','date']]};
function openEdit(group,item){
 let dialog=document.getElementById('v17-edit-dialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='v17-edit-dialog';document.body.append(dialog)}
 dialog.replaceChildren();const heading=document.createElement('h3');heading.textContent='登録内容を編集';dialog.append(heading);
 const form=document.createElement('form');form.method='dialog';form.className='v17-edit-form';const fields={};
 function addOption(sel,value,label){const o=document.createElement('option');o.value=String(value);o.textContent=label;sel.append(o)}
 function fillTarget(){if(!fields.target)return;const previous=fields.target.value;fields.target.replaceChildren();const method=fields.method.value;const choices=method==='card'?state.cards:method==='account'?state.accounts:[];addOption(fields.target,'',method==='cash'?'支払先なし':'支払先を選択');choices.forEach(x=>addOption(fields.target,x.id,x.name));fields.target.value=choices.some(x=>x.id===previous)?previous:'';fields.target.disabled=method==='cash'}
 for(const [key,label,type] of EDIT_FIELDS[group]){const lab=document.createElement('label');lab.textContent=label;const el=['account','day','offset','method','target'].includes(type)?document.createElement('select'):document.createElement('input');if(el.tagName==='INPUT')el.type=type;el.name=key;el.required=!['balance','target'].includes(key);if(type==='account')state.accounts.forEach(x=>addOption(el,x.id,x.name));if(type==='day'){for(let d=1;d<=28;d++)addOption(el,d,d+'日');addOption(el,'end','月末')}if(type==='offset')for(let d=0;d<=2;d++)addOption(el,d,d+'か月後');if(type==='method'){addOption(el,'account','口座引落');addOption(el,'card','カード');addOption(el,'cash','現金・その他')}if(type==='target'){}else el.value=item[key]??'';fields[key]=el;lab.append(el);form.append(lab)}
 if(fields.method)fields.method.addEventListener('change',fillTarget);if(fields.target){fillTarget();fields.target.value=item.target||''}
 const buttons=document.createElement('div');buttons.className='v17-edit-actions';const cancel=document.createElement('button');cancel.type='button';cancel.textContent='キャンセル';cancel.addEventListener('click',()=>dialog.close());const save=document.createElement('button');save.type='submit';save.className='calc';save.textContent='変更を保存';buttons.append(cancel,save);form.append(buttons);dialog.append(form);
 form.addEventListener('submit',e=>{e.preventDefault();const next={...item};for(const [key,,type] of EDIT_FIELDS[group]){let value=fields[key].value;if(type==='number'||type==='offset')value=value===''&&key==='balance'?null:Number(value);next[key]=value}if(next.name&&!next.name.trim())return;if(next.amount!==undefined&&(!Number.isSafeInteger(next.amount)||next.amount<0))return;if(next.balance!==undefined&&next.balance!==null&&(!Number.isSafeInteger(next.balance)||next.balance<0))return;if(next.method==='cash')next.target='';if(next.method&&!paymentTarget(next.method,next.target)){alert('有効な支払い先を選択してください');return}const old={...item};Object.assign(item,next);if(!store()){Object.assign(item,old);return}dialog.close();render();$('finance-status').textContent='変更を保存しました。';});dialog.showModal();
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
 const a=$("accounts");a.replaceChildren();state.accounts.forEach(x=>itemRow(a,`${x.name} ／ 残高 ${x.balance===null?"未設定":money(x.balance)}`,()=>remove("accounts",x),()=>openEdit("accounts",x)));
 const c=$("cards");c.replaceChildren();state.cards.forEach(x=>itemRow(c,`${x.name} ／ ${state.accounts.find(a=>a.id===x.account)?.name||"口座未登録"} ／ ${x.close==="end"?"月末":x.close+"日"}締め・${x.offset===0?"当月":x.offset===1?"翌月":"翌々月"}${x.pay==="end"?"末日":x.pay+"日"}引落`,()=>remove("cards",x),()=>openEdit("cards",x)));
 const f=$("fixed-list");f.replaceChildren();state.fixed.forEach(x=>itemRow(f,`${x.name} ${money(x.amount)} ／ ${x.start}〜 毎月`,()=>remove("fixed",x),()=>openEdit("fixed",x)));
 const e=$("extra-list");e.replaceChildren();state.extras.filter(x=>x.date.startsWith($("fm").value)).forEach(x=>itemRow(e,`${x.date} ${x.name} ${money(x.amount)}`,()=>remove("extras",x),()=>openEdit("extras",x)));
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