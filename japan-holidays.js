"use strict";
(()=>{
const pad=n=>String(n).padStart(2,'0');
const iso=(y,m,d)=>`${y}-${pad(m)}-${pad(d)}`;
const nthMonday=(y,m,n)=>1+((8-new Date(y,m-1,1).getDay())%7)+(n-1)*7;
function equinox(y,spring){
 if(y<1980||y>2099)return null;
 return Math.floor((spring?20.8431:23.2488)+0.242194*(y-1980)-Math.floor((y-1980)/4));
}
function holidays(y){
 const h=new Map();if(y<1948||y>2099)return h;
 const add=(m,d,name)=>{if(d)h.set(iso(y,m,d),name)};
 add(1,1,'元日');
 if(y>=2000)add(1,nthMonday(y,1,2),'成人の日');else if(y>=1949)add(1,15,'成人の日');
 if(y>=1967)add(2,11,'建国記念の日');
 if(y>=2020)add(2,23,'天皇誕生日');else if(y>=1989&&y<=2018)add(12,23,'天皇誕生日');
 add(3,equinox(y,true),'春分の日');
 add(4,29,y>=2007?'昭和の日':y>=1989?'みどりの日':'天皇誕生日');
 add(5,3,'憲法記念日');add(5,5,'こどもの日');if(y>=2007)add(5,4,'みどりの日');
 if(y>=2003)add(7,nthMonday(y,7,3),'海の日');else if(y>=1996)add(7,20,'海の日');
 if(y>=2016)add(8,11,'山の日');
 if(y>=2003)add(9,nthMonday(y,9,3),'敬老の日');else if(y>=1966)add(9,15,'敬老の日');
 add(9,equinox(y,false),'秋分の日');
 if(y>=2000)add(10,nthMonday(y,10,2),y>=2020?'スポーツの日':'体育の日');else if(y>=1966)add(10,10,'体育の日');
 add(11,3,'文化の日');add(11,23,'勤労感謝の日');
 // One-off holiday law changes and enthronement holidays.
 if(y===2019){add(5,1,'天皇の即位の日');add(10,22,'即位礼正殿の儀');}
 if(y===2020){h.delete(iso(y,7,nthMonday(y,7,3)));h.delete(iso(y,10,nthMonday(y,10,2)));h.delete(iso(y,8,11));add(7,23,'海の日');add(7,24,'スポーツの日');add(8,10,'山の日');}
 if(y===2021){h.delete(iso(y,7,nthMonday(y,7,3)));h.delete(iso(y,10,nthMonday(y,10,2)));h.delete(iso(y,8,11));add(7,22,'海の日');add(7,23,'スポーツの日');add(8,8,'山の日');}
 // Substitute holidays. Since 2007, move to the first following non-holiday.
 if(y>=1973){const original=[...h.keys()].sort();for(const key of original){const [yy,mm,dd]=key.split('-').map(Number);const d=new Date(yy,mm-1,dd);if(d.getDay()!==0)continue;let next=new Date(yy,mm-1,dd+1);while(next.getFullYear()===y){const k=iso(next.getFullYear(),next.getMonth()+1,next.getDate());if(!h.has(k)){h.set(k,'振替休日');break;}if(y<2007)break;next.setDate(next.getDate()+1);}}}
 // National holidays between two statutory holidays.
 if(y>=1986){for(let m=1;m<=12;m++)for(let d=2;d<=new Date(y,m,0).getDate()-1;d++){const current=iso(y,m,d),prev=new Date(y,m-1,d-1),next=new Date(y,m-1,d+1);if(!h.has(current)&&h.has(iso(prev.getFullYear(),prev.getMonth()+1,prev.getDate()))&&h.has(iso(next.getFullYear(),next.getMonth()+1,next.getDate())))h.set(current,'国民の休日');}}
 return h;
}
function decorate(){const map=holidays(year),prefix=`${year}-${pad(month+1)}-`;
 document.querySelectorAll('#calendar .day').forEach(btn=>{
  const d=Number(btn.firstChild?.textContent);if(!d)return;
  const date=prefix+pad(d),weekday=new Date(year,month,d).getDay(),name=map.get(date);
  btn.classList.toggle('jpn-sunday',weekday===0);btn.classList.toggle('jpn-saturday',weekday===6);btn.classList.toggle('jpn-holiday',!!name);
  if(name){const mark=document.createElement('span');mark.className='jpn-holiday-label';mark.textContent='祝';mark.title=name;btn.append(mark);btn.setAttribute('aria-label',btn.getAttribute('aria-label')+'、'+name);}
 });
 const leap=year%4===0&&(year%100!==0||year%400===0);
 const legend=document.getElementById('holiday-legend');if(legend)legend.textContent=`日曜・祝日＝赤系／土曜＝青系／祝日には「祝」表示。${year}年は${leap?'閏年（2月29日あり）':'平年'}。祝日は日本の祝日法に基づく計算値です。`;
}
function showHoliday(e){if(window.v17QuickMode)return;const map=holidays(year),name=map.get(e.detail.date);if(!name)return;
 const popup=document.getElementById('day-popup'),content=document.getElementById('popup-content');if(!popup||!content)return;
 if(!popup.open){document.getElementById('popup-title').textContent=e.detail.date.replaceAll('-','/')+' の登録内容';content.replaceChildren();popup.showModal();}
 const row=document.createElement('div');row.className='popup-entry';const label=document.createElement('strong');label.textContent='祝日';const value=document.createElement('span');value.textContent=name;row.append(label,value);content.prepend(row);
}
document.addEventListener('calendar-rendered',decorate);
document.addEventListener('calendar-day-tapped',showHoliday);
decorate();
})();
