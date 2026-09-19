/* Trang Bảng giá */
(function(){'use strict';
var DC=window.DC,t=DC.t,$=DC.$,$$=DC.$$,LANGS=DC.LANGS,CUES=DC.CUES,reduce=DC.reduce;
var L=DC.L;
/* ---------- pricing ---------- */
var yearly=false;
var PRICES=[[0,250000,750000],[0,10,30],[0,70,200]];
function money(n){
  return new Intl.NumberFormat(['vi-VN','en-US','zh-CN'][L],{style:'currency',currency:['VND','USD','CNY'][L],maximumFractionDigits:0}).format(n);
}
function renderPricing(){
  var h='';
  for(var p=0;p<3;p++){
    var base=PRICES[L][p],val=yearly?base*0.8:base,pick=p===1;
    h+='<div class="plan'+(pick?' pick':'')+'"><h3>'+t('pl'+(p+1))+(pick?'<span class="badge">'+t('pl_pick')+'</span>':'')+'</h3>'+
    '<div class="price">'+money(val)+' <small>'+t('pr_per')+'</small></div><ul>'+
    '<li>'+t('pl'+(p+1)+'_1')+'</li><li>'+t('pl'+(p+1)+'_2')+'</li><li>'+t('pl'+(p+1)+'_3')+'</li></ul>'+
    '<a class="btn'+(pick?' btn-primary':'')+'" href="#/register">'+(p===0?t('pl_c1'):t('pl_c'))+'</a></div>';
  }
  $('#plans').innerHTML=h;
  $('#billM').setAttribute('aria-pressed',String(!yearly));
  $('#billY').setAttribute('aria-pressed',String(yearly));
}
$('#billM').addEventListener('click',function(){yearly=false;renderPricing();});
$('#billY').addEventListener('click',function(){yearly=true;renderPricing();});


DC.onLang(function(){L=DC.L;renderPricing();});
})();
