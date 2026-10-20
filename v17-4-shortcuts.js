(()=>{'use strict';const target=document.getElementById('v174-shortcut-row');if(!target)return;
const source=document.querySelector('.v172-links');if(!source)return;
const shortNames={'finance.html':'💳 家計','loan.html':'🏠 ローン・保険','salary.html':'💼 給料','split.html':'👥 割り勘','fuel.html':'🚗 燃費'};
function render(){const frag=document.createDocumentFragment();source.querySelectorAll('a[href]').forEach(a=>{const href=a.getAttribute('href');if(!Object.hasOwn(shortNames,href))return;const link=document.createElement('a');link.href=href;link.textContent=shortNames[href];link.setAttribute('aria-label',a.textContent.trim());frag.append(link)});target.replaceChildren(frag);}
new MutationObserver(render).observe(source,{childList:true});render();
})();