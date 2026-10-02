/* Landing «porte» — JS vanilla, nessuna libreria.
   Senza html.m (niente JS, ?static, riduci movimento) la pagina resta statica e completa.
   Lo stesso file serve IT e EN: i testi stanno tutti nell'HTML. */
(function(){
  var d=document, W=window, html=d.documentElement;

  /* bottoni «da quale porta vuoi partire?»: mettono la spunta sul paese nel modulo */
  [].forEach.call(d.querySelectorAll('.pchip[data-v]'),function(a){
    a.addEventListener('click',function(){ if(W.ESTpreseleziona) W.ESTpreseleziona(a.dataset.v); });
  });

  if(!html.classList.contains('m'))return;

  function cl(v,a,b){return v<a?a:v>b?b:v}
  function sm(t){t=cl(t,0,1);return t*t*(3-2*t)}

  /* comparse semplici quando entrano nello schermo */
  var io='IntersectionObserver' in W;
  function onView(sel,cls,thr){
    [].forEach.call(d.querySelectorAll(sel),function(el){
      if(!io){el.classList.add(cls);return;}
      var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){el.classList.add(cls);o.disconnect();}});},{threshold:thr||0.25});
      o.observe(el);
    });
  }
  onView('.p-porte .keys','in',.2);
  onView('.p-porte .cash-steps','in',.2);
  onView('.p-porte .map-door','open',.35);

  /* ---------- il corridoio: le porte si aprono una dopo l'altra, poi diventano una ---------- */
  var run=d.querySelector('.p-porte .run'); if(!run)return;
  var doors=[].slice.call(run.querySelectorAll('.door'));
  var leaves=doors.map(function(x){return x.querySelector('.leaf')});
  var rooms=doors.map(function(x){return x.querySelector('.room')});
  var one=run.querySelector('.one'), bg=run.querySelector('.st-bg'), hint=run.querySelector('.st-h');
  var dots=[].slice.call(run.querySelectorAll('.dots li'));
  var n=doors.length, U=n+1.0, last=-1, ticking=false, live=!io;

  function frame(){
    ticking=false;
    var vh=W.innerHeight, vw=W.innerWidth, r=run.getBoundingClientRect();
    var total=r.height-vh; if(total<=0)return;
    var p=cl(-r.top/total,0,1);
    var t=p*U, td=Math.min(t,n-0.2);
    var seg=Math.floor(td), frac=td-seg;
    var f=seg+(seg<n-1?sm((frac-.7)/.3):0);
    var c=sm((t-(n-0.2))/0.85);
    var S=vw>=900?340:Math.min(vw*.56,260);
    for(var i=0;i<n;i++){
      var off=i-f, a=Math.abs(off);
      var x=off*S*(1-c);
      var rot=cl(off*26,-50,50)*(1-c);
      var sc=(1-Math.min(a,2)*.14)*(1-.45*c);
      var op=cl(1-a*.45,0,1)*(1-sm(c*1.15));
      var open=sm((td-i-0.05)/0.38)*(1-sm(c*1.6));
      doors[i].style.transform='perspective(1100px) translate3d('+x.toFixed(1)+'px,'+(-c*30).toFixed(1)+'px,0) rotateY('+rot.toFixed(2)+'deg) scale('+sc.toFixed(3)+')';
      doors[i].style.opacity=op.toFixed(3);
      doors[i].style.zIndex=50-Math.round(a*10);
      leaves[i].style.transform='rotateY('+(-open*112).toFixed(2)+'deg)';
      rooms[i].style.opacity=(0.15+0.85*sm(open*1.4-.25)).toFixed(3);
    }
    one.style.opacity=sm((c-.35)/.65).toFixed(3);
    one.style.transform='translate(-50%,-54%) scale('+(.82+.18*sm(c)).toFixed(3)+')';
    if(hint)hint.style.opacity=(1-sm((t-.25)/.3)).toFixed(3);
    if(bg)bg.style.transform='scale('+(1+p*.16).toFixed(4)+')';
    var act=c>.5?n:Math.round(f);
    if(act!==last){dots.forEach(function(el,k){el.classList.toggle('on',k===act)});last=act;}
  }
  function req(){if(live&&!ticking){ticking=true;requestAnimationFrame(frame);}}
  if(io){new IntersectionObserver(function(es){live=es[0].isIntersecting;if(live)req();},{rootMargin:'100px 0px'}).observe(run);}
  W.addEventListener('scroll',req,{passive:true});
  W.addEventListener('resize',function(){live=true;req();});
  frame();
})();
