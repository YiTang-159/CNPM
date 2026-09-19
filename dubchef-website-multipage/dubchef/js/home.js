/* Trang chủ: 3 track lồng tiếng chạy song song */
(function(){'use strict';
var DC=window.DC,t=DC.t,$=DC.$,$$=DC.$$,LANGS=DC.LANGS,CUES=DC.CUES,reduce=DC.reduce;
/* ---------- hero tracks ---------- */
var hero={i:0,timer:null};
$$('#heroTracks .wave').forEach(function(w){
  var s=+w.dataset.seed,h='';
  for(var n=0;n<44;n++){var v=(0.25+0.75*Math.abs(Math.sin(n*1.7+s*2.1))).toFixed(2);h+='<i style="--h:'+v+';--d:'+((n%11)*0.09).toFixed(2)+'s"></i>';}
  w.innerHTML=h;
});
var hDots=$('#hDots');
for(var d=0;d<CUES.length;d++){(function(n){var b=document.createElement('button');b.type='button';b.addEventListener('click',function(){setHero(n,true);startHero();});hDots.appendChild(b);})(d);}
function setHero(i,anim){
  hero.i=i;
  $$('#heroTracks .track').forEach(function(tr,k){
    var cap=$('.cap',tr);cap.textContent=CUES[i][LANGS[k]];
    if(anim&&!reduce&&cap.animate)cap.animate([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:280,easing:'ease-out'});
  });
  $('#hRec').textContent=t('rec_name');
  $('#hStep').textContent=t('step')+' '+(i+1)+'/'+CUES.length;
  $$('button',hDots).forEach(function(b,k){b.setAttribute('aria-label',t('step')+' '+(k+1));if(k===i)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
}
function stopHero(){if(hero.timer){clearInterval(hero.timer);hero.timer=null;}}
function startHero(){stopHero();if(reduce)return;hero.timer=setInterval(function(){if(!document.hidden)setHero((hero.i+1)%CUES.length,true);},4200);}


DC.onLang(function(){setHero(hero.i);});
startHero();
})();
