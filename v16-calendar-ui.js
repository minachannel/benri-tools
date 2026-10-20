'use strict';
(()=>{
 const KEY='benri-tools-week-start-v16';
 const selector=document.getElementById('week-start');
 const valid=['0','1','2','3','4','5','6'];
 try{const v=localStorage.getItem(KEY);if(valid.includes(v))selector.value=v;}catch{}
 // Calendar.js is loaded before this file and exposes render() globally.
 const original=window.render;
 if(typeof original==='function'){
  window.render=function(){original();reorderWeek();};
 }
 function reorderWeek(){
  const grid=document.getElementById('calendar');if(!grid)return;
  const n=Number(selector.value),head=Array.from(grid.querySelectorAll('.weekday'));
  if(head.length!==7)return;
  const names=['日','月','火','水','木','金','土'];
  head.forEach((el,i)=>el.textContent=names[(n+i)%7]);
  // Rebuild only leading blank slots, keeping the day buttons and their listeners.
  const buttons=Array.from(grid.querySelectorAll('button.day'));
  if(!buttons.length)return;
  const monthText=document.getElementById('month-title').textContent;
  const m=monthText.match(/(\d+)年(\d+)月/);if(!m)return;
  const offset=(new Date(Number(m[1]),Number(m[2])-1,1).getDay()-n+7)%7;
  grid.replaceChildren(...head);
  for(let i=0;i<offset;i++)grid.append(document.createElement('span'));
  buttons.forEach(b=>grid.append(b));
 }
 selector.addEventListener('change',()=>{try{localStorage.setItem(KEY,selector.value);}catch{}reorderWeek();});
 document.addEventListener('calendar-rendered',()=>queueMicrotask(reorderWeek));
 reorderWeek();
 const targets={
  'event-form':'fold-event-form','work-form':'fold-work-form','memo-form':'fold-memo-form',
  'income-report':'income-report','holiday-panel':'holiday-panel','workplace-panel':'workplace-panel',
  'expense-panel':'expense-panel','export-panel':'export-panel'
 };
 function jump(id){const fold=document.getElementById(targets[id]||id);if(!fold)return; if(fold.tagName==='DETAILS')fold.open=true;fold.scrollIntoView({behavior:'smooth',block:'start'});}
 document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>jump(b.dataset.jump)));
 document.getElementById('v16-menu')?.addEventListener('change',e=>{if(e.target.value)jump(e.target.value);e.target.value='';});
})();
