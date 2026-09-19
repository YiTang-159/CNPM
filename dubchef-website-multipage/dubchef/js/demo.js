/* Trang Trải nghiệm: tải video, quy trình mô phỏng, trình phát 3 giọng */
(function(){'use strict';
var DC=window.DC,t=DC.t,$=DC.$,$$=DC.$$,LANGS=DC.LANGS,CUES=DC.CUES,reduce=DC.reduce;
var L=DC.L;
var STROKE='stroke="#12302A" stroke-width="3" stroke-linejoin="round"';
var SHADOW='<ellipse cx="160" cy="140" rx="100" ry="8" fill="rgba(0,0,0,.12)"/>';
var STEAM='<path d="M120 70q-9-12 0-22t0-20M150 66q-9-12 0-22t0-20M180 70q-9-12 0-22t0-20" fill="none" stroke="#12302A" stroke-opacity=".3" stroke-width="4" stroke-linecap="round"/>';
var PAN='<ellipse cx="140" cy="118" rx="82" ry="20" fill="#2F3D39"/><ellipse cx="140" cy="112" rx="76" ry="16" fill="#3C4C47"/><rect x="212" y="108" width="86" height="10" rx="5" fill="#2F3D39"/>';
var SCENES=[
'<svg viewBox="0 0 320 180" aria-hidden="true"><rect width="320" height="180" fill="var(--sc-bg)"/><rect y="128" width="320" height="52" fill="var(--sc-tab)"/>'+SHADOW+'<path d="M92 92Q160 176 228 92Z" fill="#fff" '+STROKE+'/><ellipse cx="160" cy="92" rx="68" ry="12" fill="#FFF3C4" '+STROKE+'/><circle cx="144" cy="92" r="9" fill="#F5B301"/><circle cx="172" cy="94" r="9" fill="#F5B301"/><circle cx="242" cy="122" r="7" fill="#fff" '+STROKE+'/><circle cx="262" cy="126" r="7" fill="#fff" '+STROKE+'/><path d="M214 34L176 88" stroke="#12302A" stroke-width="4" stroke-linecap="round"/></svg>',
'<svg viewBox="0 0 320 180" aria-hidden="true"><rect width="320" height="180" fill="var(--sc-bg)"/><rect y="128" width="320" height="52" fill="var(--sc-tab)"/>'+SHADOW+PAN+'<ellipse cx="140" cy="112" rx="58" ry="11" fill="#F7CF4B"/><ellipse cx="126" cy="109" rx="20" ry="5" fill="#FBE38A"/>'+STEAM+'</svg>',
'<svg viewBox="0 0 320 180" aria-hidden="true"><rect width="320" height="180" fill="var(--sc-bg)"/><rect y="128" width="320" height="52" fill="var(--sc-tab)"/>'+SHADOW+PAN+'<ellipse cx="140" cy="112" rx="50" ry="10" fill="#F7CF4B"/><ellipse cx="108" cy="110" rx="14" ry="6" fill="#D6402F" transform="rotate(-20 108 110)"/><ellipse cx="134" cy="114" rx="14" ry="6" fill="#D6402F" transform="rotate(15 134 114)"/><ellipse cx="158" cy="108" rx="14" ry="6" fill="#D6402F" transform="rotate(-10 158 108)"/><ellipse cx="176" cy="114" rx="12" ry="5" fill="#D6402F" transform="rotate(25 176 114)"/>'+STEAM+'</svg>',
'<svg viewBox="0 0 320 180" aria-hidden="true"><rect width="320" height="180" fill="var(--sc-bg)"/><rect y="128" width="320" height="52" fill="var(--sc-tab)"/>'+SHADOW+'<ellipse cx="160" cy="118" rx="98" ry="22" fill="#fff" '+STROKE+'/><ellipse cx="160" cy="116" rx="72" ry="14" fill="#F2F2EE"/><ellipse cx="160" cy="106" rx="54" ry="15" fill="#F7CF4B"/><ellipse cx="136" cy="104" rx="14" ry="6" fill="#D6402F" transform="rotate(-20 136 104)"/><ellipse cx="164" cy="100" rx="14" ry="6" fill="#D6402F" transform="rotate(12 164 100)"/><ellipse cx="184" cy="108" rx="12" ry="5" fill="#D6402F" transform="rotate(-15 184 108)"/><path d="M152 92q10-16 26-6-8 12-26 6Z" fill="#3F8F5B"/>'+STEAM+'</svg>'
];

/* ---------- demo player ---------- */
var demo={i:0,playing:false,finished:false,voice:LANGS[L],subs:{},speed:1,token:0,file:''};
demo.subs[LANGS[L]]=true;
var LANGCODE={vi:'vi-VN',en:'en-US',zh:'zh-CN'};
var hasSpeech='speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
function voiceFor(lang){
  if(!hasSpeech)return null;
  var vs=speechSynthesis.getVoices();
  for(var k=0;k<vs.length;k++){if(vs[k].lang.toLowerCase().replace('_','-').indexOf(lang)===0)return vs[k];}
  return null;
}
function voiceKnownMissing(lang){return !hasSpeech||(speechSynthesis.getVoices().length>0&&!voiceFor(lang));}

var segs=$('#segs'),cueList=$('#cueList');
CUES.forEach(function(c,n){
  var b=document.createElement('button');b.type='button';b.addEventListener('click',function(){jump(n);});segs.appendChild(b);
  var li=document.createElement('li'),bb=document.createElement('button');bb.type='button';bb.addEventListener('click',function(){jump(n);});li.appendChild(bb);cueList.appendChild(li);
});

function renderDemo(){
  $('#scene').innerHTML=SCENES[demo.i];
  var sh='';
  ['vi','en','zh'].forEach(function(l){if(demo.subs[l])sh+='<p class="'+l+'" lang="'+(l==='zh'?'zh-CN':l)+'"><b>'+(l==='zh'?'中文':l.toUpperCase())+'</b><span>'+CUES[demo.i][l]+'</span></p>';});
  $('#subs').innerHTML=sh;$('#subs').hidden=!sh;
  $$('button',segs).forEach(function(b,k){b.setAttribute('aria-label',t('step')+' '+(k+1));if(k===demo.i)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
  $$('button',cueList).forEach(function(b,k){b.textContent=CUES[k][LANGS[L]];if(k===demo.i)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
  $('#playBtn').textContent=demo.playing?t('d_pause'):(demo.finished?t('d_replay'):t('d_play'));
  $$('#voiceChips .chip').forEach(function(c){c.setAttribute('aria-pressed',String(c.dataset.v===demo.voice));});
  $$('#subChips .chip').forEach(function(c){c.setAttribute('aria-pressed',String(!!demo.subs[c.dataset.s]));});
  $('#dRec').textContent=t('rec_name');
  $('#noVoice').hidden=demo.voice==='off'||!voiceKnownMissing(demo.voice);
}
function stopSpeech(){if(hasSpeech){try{speechSynthesis.cancel();}catch(e){}}}
function playCue(i){
  var my=++demo.token;demo.i=i;demo.playing=true;demo.finished=false;renderDemo();
  var voiceOn=demo.voice!=='off'&&hasSpeech&&!!voiceFor(demo.voice);
  var speechDone=!voiceOn,timeDone=false;
  function next(){
    if(my!==demo.token||!demo.playing)return;
    if(speechDone&&timeDone){if(i+1<CUES.length)playCue(i+1);else{demo.playing=false;demo.finished=true;renderDemo();}}
  }
  setTimeout(function(){timeDone=true;next();},3600/demo.speed);
  if(voiceOn){
    stopSpeech();
    var u=new SpeechSynthesisUtterance(CUES[i][demo.voice]);
    u.lang=LANGCODE[demo.voice];u.rate=demo.speed;u.voice=voiceFor(demo.voice);
    u.onend=function(){speechDone=true;next();};
    u.onerror=function(){speechDone=true;next();};
    try{speechSynthesis.speak(u);}catch(e){speechDone=true;}
    setTimeout(function(){speechDone=true;next();},16000);
  }
}
function pauseDemo(){demo.token++;demo.playing=false;stopSpeech();renderDemo();}
function jump(n){var was=demo.playing;demo.token++;stopSpeech();demo.i=n;demo.finished=false;if(was)playCue(n);else{demo.playing=false;renderDemo();}}
$('#playBtn').addEventListener('click',function(){
  if(demo.playing)pauseDemo();
  else playCue(demo.finished?0:demo.i);
});
$('#voiceChips').addEventListener('click',function(e){
  var b=e.target.closest('.chip');if(!b)return;
  demo.voice=b.dataset.v;
  if(demo.playing)playCue(demo.i);else renderDemo();
});
$('#subChips').addEventListener('click',function(e){
  var b=e.target.closest('.chip');if(!b)return;
  var l=b.dataset.s;if(demo.subs[l])delete demo.subs[l];else demo.subs[l]=true;
  renderDemo();
});
$('#speed').addEventListener('change',function(e){demo.speed=parseFloat(e.target.value);if(demo.playing)playCue(demo.i);});
if(hasSpeech){try{speechSynthesis.onvoiceschanged=function(){renderDemo();};}catch(e){}}

/* upload + pipeline */
var dz=$('#dz'),fileInp=$('#file'),urlInp=$('#url'),pipe=$('#pipe');
['dragenter','dragover'].forEach(function(n){dz.addEventListener(n,function(e){e.preventDefault();dz.classList.add('over');});});
['dragleave','drop'].forEach(function(n){dz.addEventListener(n,function(e){e.preventDefault();dz.classList.remove('over');});});
dz.addEventListener('drop',function(e){var f=e.dataTransfer&&e.dataTransfer.files[0];if(f)setFile(f.name);});
fileInp.addEventListener('change',function(){if(fileInp.files[0])setFile(fileInp.files[0].name);});
function setFile(name){demo.file=name;$('#fname').textContent=t('d_chosen')+name;$('#dErr').hidden=true;}
function pipeStatus(){$$('li',pipe).forEach(function(li){$('.st',li).textContent=t('st_'+li.dataset.s);});}
var running=false;
$('#startBtn').addEventListener('click',function(){
  if(running)return;
  if(!demo.file&&!urlInp.value.trim()){$('#dErr').textContent=t('d_need');$('#dErr').hidden=false;return;}
  $('#dErr').hidden=true;$('#pipeDone').hidden=true;running=true;this.disabled=true;
  var rows=$$('li',pipe),k=0,btn=this;pipe.hidden=false;
  rows.forEach(function(r){r.dataset.s='wait';});pipeStatus();
  function step(){
    if(k>=rows.length){
      running=false;btn.disabled=false;$('#pipeDone').hidden=false;
      $('#player').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});return;
    }
    var r=rows[k];r.dataset.s='run';pipeStatus();
    setTimeout(function(){r.dataset.s='done';pipeStatus();k++;step();},reduce?300:1150);
  }
  step();
});


DC.onLang(function(){L=DC.L;if(demo.file)$('#fname').textContent=t('d_chosen')+demo.file;pipeStatus();renderDemo();});
})();
