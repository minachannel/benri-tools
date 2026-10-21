(()=>{'use strict';
const prefKey='benri-v173-display';let prefs={theme:'light',font:'normal',menu:'both'};try{prefs={...prefs,...JSON.parse(localStorage.getItem(prefKey)||'{}')}}catch{}
function apply(){document.body.classList.toggle('v173-dark',prefs.theme==='dark');document.body.classList.toggle('v173-font-large',prefs.font==='large');document.body.classList.toggle('v173-menu-icons',prefs.menu==='icons');document.body.classList.toggle('v173-menu-text',prefs.menu==='text');document.documentElement.style.setProperty('--v173-font',prefs.font==='large'?'1.15':prefs.font==='small'?'0.9':'1');}
function displaySettings(){
 const dialog=document.createElement('dialog');dialog.className='v172-settings v176-display-settings';
 const h=document.createElement('h2');h.textContent='🎨 表示カスタマイズ';dialog.append(h);
 const groups=[['theme','テーマ',[['light','A シンプル（白）'],['dark','B スタイリッシュ（ダーク）']]],['font','文字の大きさ',[['small','小'],['normal','標準'],['large','大']]],['menu','メニューの表示',[['icons','アイコンのみ'],['both','アイコン＋文字'],['text','文字のみ']]]];
 for(const [key,label,options] of groups){
  const details=document.createElement('details');details.className='v176-choice';
  const summary=document.createElement('summary');
  const title=document.createElement('span');title.textContent=label;
  const current=document.createElement('span');current.className='v176-current';
  const setCurrent=()=>{current.textContent=(options.find(([v])=>v===prefs[key])||options[0])[1]};setCurrent();
  summary.append(title,current);details.append(summary);
  const choices=document.createElement('div');choices.className='v176-options';
  for(const [value,text] of options){const button=document.createElement('button');button.type='button';button.textContent=text;button.className='v176-option';button.setAttribute('aria-pressed',String(prefs[key]===value));button.addEventListener('click',()=>{prefs[key]=value;try{localStorage.setItem(prefKey,JSON.stringify(prefs))}catch{}apply();setCurrent();choices.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));details.open=false});choices.append(button)}
  details.append(choices);details.addEventListener('toggle',()=>{if(details.open)dialog.querySelectorAll('.v176-choice').forEach(other=>{if(other!==details)other.open=false})});dialog.append(details)
 }
 const done=document.createElement('button');done.type='button';done.className='calc';done.textContent='閉じる';done.onclick=()=>dialog.close();dialog.append(done);
 dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal()
}
apply();const trigger=document.createElement('button');trigger.className='v173-display-trigger';trigger.type='button';trigger.textContent='🎨 表示設定';trigger.addEventListener('click',displaySettings);const top=document.querySelector('.v172-top-actions');if(top)top.append(trigger);else{const header=document.querySelector('header');if(header)header.append(trigger)}
const holiday=document.getElementById('v173-holiday-start');if(!holiday)return;
const bar=document.getElementById('v173-holiday-bar'),counter=document.getElementById('v173-holiday-counter'),oldMode=document.getElementById('holiday-mode'),oldCount=document.getElementById('holiday-count'),oldApply=document.getElementById('holiday-apply'),oldRemove=document.getElementById('holiday-remove'),oldCancel=document.getElementById('holiday-cancel');
let active=false;function update(){active=oldMode.textContent==='選択モード中';bar.hidden=!active;holiday.setAttribute('aria-pressed',String(active));holiday.textContent=active?'🏖 選択中':'🏖 休日';const count=oldCount.textContent;counter.textContent=active?count+' · 緑のチェックが選択中':'休日にする日をタップ'}
function start(){if(!active){const selected=document.querySelector('.v17-actions button.v17-active');if(selected)selected.click();oldMode.click()}else oldCancel.click();update()}
holiday.addEventListener('click',start);document.getElementById('v173-holiday-save').onclick=()=>{oldApply.click();update()};document.getElementById('v173-holiday-unset').onclick=()=>{oldRemove.click();update()};document.getElementById('v173-holiday-exit').onclick=()=>{oldCancel.click();update()};
const grid=document.getElementById('calendar');grid.addEventListener('click',()=>queueMicrotask(update));document.addEventListener('holiday-selection-ended',update);update();
// Route legacy management-menu holiday action to the compact action beside the calendar.
const menu=document.getElementById('v16-menu');menu?.addEventListener('change',()=>{if(menu.value==='holiday-panel'){queueMicrotask(()=>{document.getElementById('holiday-panel').open=false;holiday.click();holiday.scrollIntoView({block:'nearest'});menu.value=''})}});
})();