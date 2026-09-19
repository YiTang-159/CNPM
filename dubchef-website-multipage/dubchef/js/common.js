/* Phần dùng chung mọi trang: đổi ngôn ngữ, menu, tiêu đề, trang đang mở */
(function(){'use strict';
var DC=window.DC,t=DC.t,$=DC.$,$$=DC.$$,LANGS=DC.LANGS;
var body=document.body;
function apply(){
  document.documentElement.lang=['vi','en','zh-CN'][DC.L];
  $$('[data-i18n]').forEach(function(e){e.textContent=t(e.dataset.i18n);});
  $$('[data-i18n-ph]').forEach(function(e){e.placeholder=t(e.dataset.i18nPh);});
  $$('[data-i18n-aria]').forEach(function(e){e.setAttribute('aria-label',t(e.dataset.i18nAria));});
  $$('.lang button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.lang===LANGS[DC.L]));});
  $$('.err:not([hidden]),.ok:not([hidden])').forEach(function(e){if(e.dataset.msg)e.textContent=t(e.dataset.msg);});
  document.title=t(body.dataset.title)+' | Dubchef';
  DC.emit();
}
$$('.lang button').forEach(function(b){b.addEventListener('click',function(){DC.setLang(LANGS.indexOf(b.dataset.lang));apply();});});
$$('.nav a[data-nav]').forEach(function(a){if(a.dataset.nav===body.dataset.page)a.setAttribute('aria-current','page');});
var menuBtn=$('#menuBtn'),nav=$('#nav');
menuBtn.addEventListener('click',function(){var open=nav.classList.toggle('open');menuBtn.setAttribute('aria-expanded',String(open));});
apply();
})();
