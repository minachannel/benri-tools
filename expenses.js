 "use strict";
(()=>{
const $=id=>document.getElementById(id),KEY="benri-tools-expenses-v1",WORK="benri-tools-work-v2";
let expenses=[];
try{const a=JSON.parse(localStorage.getItem(KEY)||"[]");if(Array.isArray(a))expenses=a;}catch(e){}
const fmt=n=>Math.round(n).toLocaleString("ja-JP")+"円";
const getWork=()=>{try{return JSON.parse(localStorage.getItem(WORK)||"{}");}catch(e){return {};}};
const currentMonth=()=>`${year}-${String(month+1).padStart(2,"0")}`;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(expenses));return true;}catch(e){$("expense-status").textContent="保存に失敗しました。";return false;}};
function render(){
 const w=getWork(),sel=$("expense-place"),prior=sel.value;
 sel.replaceChildren();const base=document.createElement("option");base.value="";base.textContent="共通・個人";sel.append(base);
 (w.places||[]).forEach(p=>{const o=document.createElement("option");o.value=p.id;o.textContent=p.name;sel.append(o);});
 sel.value=[...sel.options].some(o=>o.value===prior)?prior:"";
 const monthKey=currentMonth(),items=expenses.filter(x=>x.date?.startsWith(monthKey)).sort((a,b)=>b.date.localeCompare(a.date));
 const total=items.reduce((n,x)=>n+x.amount,0);
 $("expense-total").textContent=fmt(total);
 const breakdown=$("expense-breakdown");breakdown.replaceChildren();
 const places=w.places||[];
 const group=[{id:"",name:"共通・個人"},...places];
 group.forEach(p=>{
  const amount=items.filter(x=>x.place===p.id).reduce((n,x)=>n+x.amount,0);
  if(!amount)return;
  const row=document.createElement("div");row.className="pay-row";const label=document.createElement("span");label.textContent=p.name;
  const value=document.createElement("strong");value.textContent=fmt(amount);row.append(label,value);breakdown.append(row);
 });
 const list=$("expense-list");list.replaceChildren();
 items.forEach(item=>{
  const row=document.createElement("div");row.className="expense-entry";
  const info=document.createElement("span");info.textContent=`${item.date} ${item.merchant}：${fmt(item.amount)}`;
  const del=document.createElement("button");del.type="button";del.textContent="削除";
  del.addEventListener("click",()=>{if(!confirm("この経費を削除しますか？"))return;const backup=[...expenses];expenses=expenses.filter(x=>x.id!==item.id);if(!save())expenses=backup;render();});
  row.append(info,del);list.append(row);
 });
 $("expense-net").textContent="給与と経費は別集計です。経費を給与から控除した金額が税法上の所得になるとは限りません。";
}
$("expense-form").addEventListener("submit",e=>{
 e.preventDefault();
 const amount=Number($("expense-amount").value),merchant=$("expense-merchant").value.trim(),date=$("expense-date").value;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!merchant||!Number.isSafeInteger(amount)||amount<=0||amount>100000000){$("expense-status").textContent="日付・用途・金額を確認してください。";return;}
 const item={id:Date.now().toString(36)+Math.random().toString(36).slice(2),date,merchant,amount,place:$("expense-place").value};
 expenses.push(item);if(!save()){expenses.pop();return;}
 $("expense-merchant").value="";$("expense-amount").value="";render();$("expense-status").textContent="経費を保存しました。";
});
function pickAmount(text){
 const lines=text.split(/\r?\n/);
 const patterns=[/(?:合計|総合計|お支払|領収金額|請求額|税込合計|現計|TOTAL)[^\d\n]{0,18}[¥￥]?\s*([\d,]{2,9})/i,/[¥￥]\s*([\d,]{2,9})/];
 for(const pat of patterns)for(const line of lines){const m=line.match(pat);if(m){const n=Number(m[1].replaceAll(",",""));if(n>0&&n<=100000000)return n;}}
 return null;
}
$("scan-receipt").addEventListener("click",async()=>{
 const file=$("receipt-image").files?.[0];
 if(!file){$("scan-status").textContent="先にレシート写真を選択してください。";return;}
 if(file.size>12*1024*1024){$("scan-status").textContent="画像は12MB以下にしてください。";return;}
 const btn=$("scan-receipt");btn.disabled=true;$("scan-status").textContent="文字認識の準備中… 通信環境により時間がかかります。";
 try{
  if(!window.Tesseract){
   await new Promise((resolve,reject)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";s.onload=resolve;s.onerror=reject;document.head.append(s);});
  }
  $("scan-status").textContent="写真を読み取り中…";
  const result=await window.Tesseract.recognize(file,"jpn+eng");
  const text=result.data.text||"",amount=pickAmount(text);
  if(amount!==null){$("expense-amount").value=amount;$("scan-status").textContent=`金額候補 ${fmt(amount)} を入力しました。必ずレシートと照合してください。`;}
  else $("scan-status").textContent="金額を特定できませんでした。写真を確認して手入力してください。";
  const date=text.match(/(20\d{2})[\/\-年]\s*(\d{1,2})[\/\-月]\s*(\d{1,2})/);
  if(date){const d=`${date[1]}-${date[2].padStart(2,"0")}-${date[3].padStart(2,"0")}`;if(!Number.isNaN(new Date(d+"T12:00:00").getTime()))$("expense-date").value=d;}
 }catch(e){$("scan-status").textContent="文字認識できませんでした。通信状況を確認するか、金額を手入力してください。";}
 finally{btn.disabled=false;}
});
$("export-expenses").addEventListener("click",()=>{
 const escape=s=>'"'+String(s??"").replaceAll('"','""')+'"';
 const rows=[["日付","職場ID","用途・店名","金額"],...expenses.map(e=>[e.date,e.place,e.merchant,e.amount])];
 const csv="\ufeff"+rows.map(r=>r.map(escape).join(",")).join("\r\n");
 const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
 const a=document.createElement("a");a.href=url;a.download="expenses.csv";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
document.addEventListener("calendar-rendered",()=>{$("expense-date").value=selected;render();});
$("expense-date").value=typeof selected==="string"?selected:new Date().toISOString().slice(0,10);
render();
})();