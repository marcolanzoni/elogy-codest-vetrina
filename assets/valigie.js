/* Landing «valigie» — JS vanilla, nessuna libreria.
   - le schede delle quote mettono la spunta sul paese nel modulo (sempre, anche senza movimento)
   - con html.m (movimento permesso, niente ?static) aggiunge html.vs e accende:
     la scena delle valigie (si accumulano → vorticano in una → si apre) e le comparse.
   Solo transform/opacity. I testi che cambiano stanno nei data-* dell'HTML: lo stesso file serve IT e EN. */
(function(){
  var d=document, html=d.documentElement, W=window;

  /* quote per paese: preseleziona il paese nel modulo (app.js apre la finestra) */
  [].forEach.call(d.querySelectorAll('a[data-paese]'),function(a){
    a.addEventListener('click',function(){ if(W.ESTpreseleziona) try{W.ESTpreseleziona(a.dataset.paese);}catch(e){} });
  });

  if(!html.classList.contains('m')||!('IntersectionObserver' in W))return;
  /* finestre altissime (fotografie della pagina intera): il CSS spegne la scena fissa (@media max-height:1300px) */
  html.classList.add('vs');

  function cl(v,a,b){a=a==null?0:a;b=b==null?1:b;return v<a?a:v>b?b:v}
  function sm(t){t=cl(t);return t*t*(3-2*t)}
  function eo(t){t=cl(t);return 1-Math.pow(1-t,3)}
  function ei(t){t=cl(t);return t*t*t}
  function seg(p,a,b){return cl((p-a)/(b-a))}

  /* ---------- comparse ---------- */
  var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target);}});},{rootMargin:'0px 0px -8% 0px',threshold:.08});
  [].forEach.call(d.querySelectorAll('.p-valigie .rv'),function(e){io.observe(e)});

  /* ---------- la scena ---------- */
  var st=d.getElementById('valigie'); if(!st)return;
  var fr=[].slice.call(st.querySelectorAll('.fr')), imgs=fr.map(function(f){return f.querySelector('img')});
  var tags=[].slice.call(st.querySelectorAll('.tags li'));
  var beats=[].slice.call(st.querySelectorAll('.beat'));
  var bar=st.querySelector('.meter-bar i'), meter=st.querySelector('.meter'), ml=st.querySelector('.meter-l');
  var swirl=st.querySelector('.swirl'), frames=st.querySelector('.frames');
  var N=tags.length, off=[], vh=W.innerHeight, ticking=false, inView=false, lastBeat=-1, lastCalm=null;

  /* le immagini della scena partono prima di arrivarci */
  new IntersectionObserver(function(en,o){if(en[0].isIntersecting){imgs.forEach(function(i){i.loading='eager'});o.disconnect();}},{rootMargin:'150% 0px'}).observe(st);

  /* dove deve finire ogni etichetta: il centro della valigia */
  function measure(){
    vh=W.innerHeight;
    var fb=frames.getBoundingClientRect(), cx=fb.left+fb.width/2, cy=fb.top+fb.height*.5;
    off=tags.map(function(t){
      var s=t.style.transform; t.style.transform='none';
      var r=t.getBoundingClientRect(); t.style.transform=s;
      return {dx:cx-(r.left+r.width/2), dy:cy-(r.top+r.height/2), r:parseFloat(getComputedStyle(t).getPropertyValue('--r'))||0};
    });
  }

  /* tempi della scena (p da 0 a 1 lungo la sezione) */
  var T={tag0:.03,tagStep:.034,tagLen:.06, f1:[.17,.25], vort:[.36,.5], f2:[.34,.42], f3:[.5,.58], f4:[.72,.8],
         beats:[0,.2,.36,.5,.7]};

  function upd(){
    ticking=false;
    var r=st.getBoundingClientRect(), span=r.height-vh;
    var p=cl(-r.top/span);
    /* quadri: incrocio di opacità + leggero respiro */
    var o1=sm(seg(p,T.f1[0],T.f1[1])), o2=sm(seg(p,T.f2[0],T.f2[1])), o3=sm(seg(p,T.f3[0],T.f3[1])), o4=sm(seg(p,T.f4[0],T.f4[1]));
    fr[1].style.opacity=o1.toFixed(3); fr[2].style.opacity=o2.toFixed(3); fr[3].style.opacity=o3.toFixed(3); fr[4].style.opacity=o4.toFixed(3);
    imgs[0].style.transform='scale('+(1.1-.1*seg(p,0,.25)).toFixed(4)+')';
    imgs[1].style.transform='scale('+(1.02+.06*seg(p,.17,.42)).toFixed(4)+')';
    imgs[2].style.transform='scale('+(1.14-.12*seg(p,.34,.58)).toFixed(4)+') rotate('+(-4+4*seg(p,.34,.58)).toFixed(2)+'deg)';
    imgs[3].style.transform='scale('+(1.08-.08*seg(p,.5,.8)).toFixed(4)+')';
    imgs[4].style.transform='scale('+(1.1-.1*seg(p,.72,1)).toFixed(4)+')';

    /* vortice: le etichette girano verso il centro e spariscono dentro la valigia */
    var v=seg(p,T.vort[0],T.vort[1]);
    var filled=0;
    for(var i=0;i<N;i++){
      var a=eo(seg(p,T.tag0+i*T.tagStep,T.tag0+i*T.tagStep+T.tagLen));
      filled+=a;
      var k=ei(cl((v-i*.035)/.72)), o=off[i]||{dx:0,dy:0,r:0};
      var ang=k*Math.PI*1.4*(i%2?1:-1), rad=1-k;
      /* spirale: si avvicina al centro ruotando attorno */
      var ox=o.dx*k + Math.sin(ang)*60*rad*k, oy=o.dy*k + (1-Math.cos(ang))*40*rad*k;
      var y=(1-a)*-30;
      tags[i].style.opacity=(a*(1-sm(cl((k-.55)/.4)))).toFixed(3);
      tags[i].style.transform='translate('+ox.toFixed(1)+'px,'+(oy+y).toFixed(1)+'px) rotate('+(o.r+k*(i%2?320:-320)).toFixed(1)+'deg) scale('+((.9+.1*a)*(1-.75*k)).toFixed(3)+')';
    }
    var calm=p>T.vort[0]+.07;
    var fill=filled/N*(1-sm(v));
    if(calm) fill=Math.max(fill,.12);
    bar.style.transform='scaleX('+fill.toFixed(3)+')';
    if(calm!==lastCalm){lastCalm=calm;meter.classList.toggle('calm',calm);ml.textContent=calm?meter.dataset.b:meter.dataset.a;}
    /* anello luminoso del vortice */
    var sw=Math.sin(Math.PI*cl((p-.32)/.26));
    swirl.style.opacity=(sw*.9).toFixed(3);
    swirl.style.transform='rotate('+(p*900).toFixed(1)+'deg) scale('+(.6+.5*sw).toFixed(3)+')';

    /* testi */
    var b=0; for(var j=0;j<T.beats.length;j++) if(p>=T.beats[j]) b=j;
    if(b!==lastBeat){ beats.forEach(function(e,ix){e.classList.toggle('on',ix===b)}); lastBeat=b; }
  }
  function req(){ if(!ticking&&inView){ticking=true;requestAnimationFrame(upd);} }
  new IntersectionObserver(function(en){inView=en[0].isIntersecting; if(inView){measure();req();}},{rootMargin:'20% 0px'}).observe(st);
  W.addEventListener('scroll',req,{passive:true});
  var rt; W.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){measure();inView=true;req();},150);});
  measure(); inView=true; upd(); inView=false;
})();
