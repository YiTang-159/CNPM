/* Kiểm tra biểu mẫu: Liên hệ, Đăng nhập, Đăng ký */
(function(){'use strict';
var DC=window.DC,t=DC.t,$=DC.$,$$=DC.$$,LANGS=DC.LANGS,CUES=DC.CUES,reduce=DC.reduce;
/* ---------- forms ---------- */
var EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function bindForm(id,rules,okKey){
  var f=$('#'+id);if(!f)return;
  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    var ok=true,first=null;
    rules.forEach(function(r){
      var el=f.elements[r.name],err=$('#'+id+'-'+r.name+'-e'),bad=!r.test(el,f);
      err.hidden=!bad;err.dataset.msg=r.msg;
      if(bad){err.textContent=t(r.msg);el.setAttribute('aria-invalid','true');ok=false;first=first||el;}
      else el.removeAttribute('aria-invalid');
    });
    var st=$('#'+id+'-ok');
    if(ok){st.hidden=false;st.dataset.msg=okKey;st.textContent=t(okKey);f.reset();}
    else{st.hidden=true;first.focus();}
  });
}
var nonEmpty=function(el){return el.value.trim().length>0;};
var mail=function(el){return EMAIL.test(el.value.trim());};
var pw=function(el){return el.value.length>=8;};
bindForm('contactForm',[{name:'name',test:nonEmpty,msg:'e_name'},{name:'email',test:mail,msg:'e_email'},{name:'msg',test:nonEmpty,msg:'e_msg'}],'c_ok');
bindForm('loginForm',[{name:'email',test:mail,msg:'e_email'},{name:'pass',test:pw,msg:'e_pass'}],'li_ok');
bindForm('regForm',[
  {name:'name',test:nonEmpty,msg:'e_name'},{name:'email',test:mail,msg:'e_email'},{name:'pass',test:pw,msg:'e_pass'},
  {name:'pass2',test:function(el,f){return el.value===f.elements.pass.value&&el.value.length>0;},msg:'e_pass2'},
  {name:'agree',test:function(el){return el.checked;},msg:'e_agree'}
],'rg_ok');


})();
