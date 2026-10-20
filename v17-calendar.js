'use strict';
(()=>{
const $=id=>document.getElementById(id),settingsKey='benri-tools-v17-calendar-preferences';
let settings={redSunday:true,blueSaturday:true,redHolidays:true,weeklyOff:[]};try{settings={...settings,...JSON.parse(localStorage.getItem(settingsKey)||'{}')}}catch{}
const days=['日','月','火','水','木','金','土'];
const off=$('v17-weekly-off');days.forEach((d,i)=>{const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=settings.weeklyOff.includes(i);check.addEventListener('change',()=>{settings.weeklyOff=days.map((_,j)=>j).filter(j=>off.querySelectorAll('input')[j].checked);save()});label.append(check,document.createTextNode(d));off.append(label)});
for(const [id,key] of [['v17-red-sunday','redSunday'],['v17-blue-saturday','blueSaturday'],['v17-red-holidays','redHolidays']]){$(id).checked=settings[key];$(id).addEventListener('change',e=>{settings[key]=e.target.checked;save()})}
function save(){try{localStorage.setItem(settingsKey,JSON.stringify(settings))}catch{}decorate()}
let mode='',picked=new Set();window.v17QuickMode=false;const help=$('v17-mode-help');const buttons=[...document.querySelectorAll('[data-mode]')];
const sheet=document.createElement('dialog');sheet.className='v17-sheet';document.body.append(sheet);
function closeSheet(){if(sheet.open)sheet.close();const holder=sheet.querySelector('[data-form-holder]');if(holder){const form=holder.firstElementChild;const original=document.getElementById(holder.dataset.formHolder);if(original&&form)original.append(form)}sheet.replaceChildren()}
function openSheet(formId,label){closeSheet();const fold=document.getElementById('fold-'+formId);if(!fold)return;const form=document.getElementById(formId);if(!form)return;
 const host=document.createElement('div');host.dataset.formHolder='v17-original-'+formId;let origin=document.getElementById(host.dataset.formHolder);if(!origin){origin=document.createElement('div');origin.id=host.dataset.formHolder;fold.append(origin)}
 const close=document.createElement('button');close.className='v17-close secondary-button';close.textContent='閉じる ✕';close.type='button';close.addEventListener('click',closeSheet);const title=document.createElement('h3');title.textContent=label;sheet.append(close,title);host.append(form);sheet.append(host);sheet.showModal();
}
// Place the existing form into a temporary sheet without losing its registered handlers.
function dateChosen(date){if(!mode)return;
 if(mode==='work-form'){
  picked.has(date)?picked.delete(date):picked.add(date);
  decorate();help.textContent=picked.size?`${picked.size}日選択中。続けて日付を選ぶか「選択日を登録」を押してください。`:'日付を選択してください。';
  if(!document.getElementById('v17-open-picked')){const btn=document.createElement('button');btn.type='button';btn.id='v17-open-picked';btn.textContent='選択日を登録';btn.className='calc';btn.addEventListener('click',()=>{if(!picked.size)return;openSheet('work-form',`${picked.size}日分の勤務を登録`)});help.after(btn)}
  document.getElementById('v17-open-picked').hidden=!picked.size;
 }else{openSheet(mode,mode==='event-form'?'予定を登録':mode==='memo-form'?'メモを登録':'経費を登録')}
}
buttons.forEach(b=>b.addEventListener('click',()=>{mode=mode===b.dataset.mode?'':b.dataset.mode;window.v17QuickMode=!!mode;picked.clear();buttons.forEach(x=>x.classList.toggle('v17-active',x===b));const old=$('v17-open-picked');if(old)old.hidden=true;help.textContent=mode==='work-form'?'勤務日を複数選択して「選択日を登録」を押してください。':'カレンダーの日付をタップすると入力画面が開きます。';decorate()}));
// Capture original day clicks, but allow the original calendar logic to set its selected date.
document.addEventListener('calendar-day-tapped',e=>dateChosen(e.detail.date));
function decorate(){document.body.classList.toggle('v17-no-sun',!settings.redSunday);document.body.classList.toggle('v17-no-sat',!settings.blueSaturday);document.body.classList.toggle('v17-no-holiday',!settings.redHolidays);const grid=$('calendar');if(!grid)return;const monthText=$('month-title').textContent;const match=monthText.match(/(\d+)年(\d+)月/);if(!match)return;const y=Number(match[1]),m=Number(match[2]);grid.querySelectorAll('button.day').forEach(b=>{const d=Number(b.firstChild?.textContent);if(!d)return;const date=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`,dow=new Date(y,m-1,d).getDay();b.classList.toggle('v17-off',settings.weeklyOff.includes(dow));b.classList.toggle('v17-red',dow===0&&settings.redSunday);b.classList.toggle('v17-blue',dow===6&&settings.blueSaturday);b.classList.toggle('v17-picked',picked.has(date));b.classList.toggle('v17-red', (dow===0&&settings.redSunday)||(b.classList.contains('jpn-holiday')&&settings.redHolidays))})}
document.addEventListener('calendar-rendered',()=>queueMicrotask(decorate));decorate();
// On successful work save, copy the new record to the other selected days.
const work=$('work-form');work.addEventListener('submit',()=>{if(mode!=='work-form'||!picked.size)return;const targets=[...picked],place=$('work-place').value;queueMicrotask(()=>{if(!$('work-status').textContent.includes('保存しました'))return;try{const key='benri-tools-work-v2',data=JSON.parse(localStorage.getItem(key)||'{}');const first=data.shifts?.[selected]?.[place];if(!first)return;for(const date of targets){data.shifts[date]??={};data.shifts[date][place]={...first}}localStorage.setItem(key,JSON.stringify(data));$('work-status').textContent=`${targets.length}日分の勤務を保存しました。`;picked.clear();closeSheet();mode='';window.v17QuickMode=false;buttons.forEach(b=>b.classList.remove('v17-active'));help.textContent=`${targets.length}日分の勤務を登録しました。`;document.getElementById('v17-open-picked')?.setAttribute('hidden','');render();}catch(e){$('work-status').textContent='一括登録に失敗しました。保存内容を確認してください。'}})});
for(const id of ['event-form','memo-form','expense-form'])$(id)?.addEventListener('submit',()=>queueMicrotask(()=>{const message=id==='event-form'?$('status')?.textContent:id==='memo-form'?$('memo-status')?.textContent:$('expense-status')?.textContent;if(message?.includes('保存')){closeSheet();mode='';window.v17QuickMode=false;buttons.forEach(b=>b.classList.remove('v17-active'))}}));
// Editing existing events should reveal their editor in-place.
document.getElementById('events').addEventListener('click',e=>{if(e.target?.textContent==='編集')queueMicrotask(()=>openSheet('event-form','予定を編集'))});
})();
