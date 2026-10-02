/* Landing contrassegno Est — il viaggio del pacco. JS vanilla, nessuna libreria.
   Modello: elogy-landing-bf26/site/viaggio/b.js (stessa logica, tappe diverse).
   Senza html.m (niente JS o prefers-reduced-motion) la pagina resta lo storyboard statico.
   I testi che il JS mostra stanno negli attributi data-* dell'HTML: lo stesso file serve IT e EN. */
(function(){
  var d=document, html=d.documentElement, W=window;
  var reduced=W.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var vid=d.querySelector('.hero-video');
  /* il video hero parte solo se ha davvero una sorgente (hero-loop.mp4 arriverà dallo spot) */
  var hasSrc=vid&&vid.querySelector('source');
  if(reduced&&vid){vid.removeAttribute('autoplay');vid.pause();}
  if(hasSrc&&'IntersectionObserver' in W&&!reduced){new IntersectionObserver(function(en){en.forEach(function(x){x.isIntersecting?vid.play().catch(function(){}):vid.pause();});}).observe(vid);}
  if(!html.classList.contains('m'))return;

  var NS='http://www.w3.org/2000/svg';
  function cl(v,a,b){a=a==null?0:a;b=b==null?1:b;return v<a?a:v>b?b:v}
  function lerp(a,b,t){return a+(b-a)*t}
  function sm(t){t=cl(t);return t*t*(3-2*t)}
  function eo(t){t=cl(t);return 1-Math.pow(1-t,3)}
  function back(t){t=cl(t);var c=1.7;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)}
  function S(tag,attrs,parent){var e=d.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}
  function E(tag,cls,parent,htmlStr){var e=d.createElement(tag);if(cls)e.className=cls;if(htmlStr!=null)e.innerHTML=htmlStr;if(parent)parent.appendChild(e);return e}

  /* ---------------- PROBLEMA: otto paesi, otto logistiche ---------------- */
  var problem=d.getElementById('problema');
  var nodes=[].slice.call(problem.querySelectorAll('.lg-node')), links=[].slice.call(problem.querySelectorAll('.lg-link'));
  var beats=[].slice.call(d.querySelectorAll('.beat'));
  links.forEach(function(l){var L=l.getTotalLength();l.style.strokeDasharray=L;l.dataset.l=L;l.style.strokeDashoffset=L});
  function updProblem(vh){
    var r=problem.getBoundingClientRect();
    var p=cl((vh*.85-r.top)/(r.height-vh*.3));
    for(var j=0;j<nodes.length;j++){
      var s=.04+j*.075, q=eo((p-s)/.1);
      nodes[j].style.opacity=q.toFixed(3);
      nodes[j].style.transform='translateY('+((1-q)*-24).toFixed(1)+'px)';
      var l=links[j]; if(l)l.style.strokeDashoffset=((+l.dataset.l)*(1-sm((p-s-.03)/.12))).toFixed(1);
    }
    problem.classList.toggle('knot',p>.62);
    beats.forEach(function(b){var br=b.getBoundingClientRect();if(br.top+br.height/2<vh*.66)b.classList.add('on');else if(br.top>vh*.9)b.classList.remove('on');});
  }

  /* ---------------- VIAGGIO: le otto tappe diventano un mondo unico ---------------- */
  var J=d.getElementById('viaggio'), sts=[].slice.call(J.querySelectorAll('.st')), N=sts.length;
  var stage=E('div','j-stage'); J.appendChild(stage);
  var board=E('div','j-board',stage), ol=E('ol','',board), mob=E('div','mob',board);
  var mobT=E('div','mob-t',mob), bar=E('div','bar',mob);
  bar.style.gridTemplateColumns='repeat('+N+',1fr)';
  var world=S('svg',{'class':'j-world','aria-hidden':'true',preserveAspectRatio:'xMidYMid slice'},stage);
  var railG=S('g',{},world), rail=S('path',{'class':'rail'},railG), railOn=S('path',{'class':'rail-on'},railG);
  var scenesG=S('g',{},world), actor=S('g',{'class':'actor'},world);
  var panel=E('div','j-panel',stage);
  E('p','j-intro',stage,J.getAttribute('data-intro')||'');
  var stGroups=[],forms=[],copies=[],lis=[],bars=[],stops=[];
  sts.forEach(function(st,i){
    var svg=st.querySelector('svg'), sc=svg.querySelector('.scene'), fm=svg.querySelector('.form');
    var g=S('g',{},scenesG); g.appendChild(sc); stGroups.push(g);
    fm.removeAttribute('transform'); actor.appendChild(fm); forms.push(fm);
    var c=st.querySelector('.st-copy'); panel.appendChild(c); copies.push(c);
    var li=E('li','',ol,st.getAttribute('data-name')); lis.push(li);
    bars.push(E('i','',bar));
    stops.push(S('circle',{'class':'rail-stop',r:9},railG));
  });
  J.classList.add('built');
  var q=function(s){return J.querySelector(s)};
  var pkItem=q('.pk-item'),pkFlaps=q('.pk-flaps'),pkClosed=q('.pk-closed'),lbMove=q('.f2 .lb-move');
  var wheels=[].slice.call(J.querySelectorAll('.vn-wheel')).map(function(w){return {el:w,base:w.getAttribute('transform')}});
  var speed=q('.vn-speed'),phSt=[].slice.call(J.querySelectorAll('.ph-st')),phFill=q('.ph-fill');
  var cash=q('.cash'),paid=q('.paid'),rows=[].slice.call(J.querySelectorAll('.rc-row')),ok=q('.ok');
  var routeOn=q('.s-route-on'),sFlow=J.querySelectorAll('.s-flow');
  var codeCard=q('.f0 .f-card');
  if(routeOn){var RL=routeOn.getTotalLength();routeOn.style.strokeDasharray=RL;routeOn.dataset.l=RL;}

  var desk=true, STEP=1000;
  var VW=W.innerWidth, VH=W.innerHeight;
  function layout(){
    desk=W.innerWidth>=900; STEP=desk?1000:900;
    stGroups.forEach(function(g,i){g.setAttribute('transform',desk?'translate('+i*1000+' 0)':'translate(0 '+i*900+')')});
    var L=(N-1)*STEP;
    var dd=desk?'M500 640 H'+(500+L):'M500 420 V'+(420+L);
    rail.setAttribute('d',dd);railOn.setAttribute('d',dd);
    railOn.style.strokeDasharray=L;railOn.dataset.l=L;
    stops.forEach(function(c,i){c.setAttribute('cx',desk?500+i*1000:500);c.setAttribute('cy',desk?640:420+i*900);c.style.display=desk?'':'none'});
    var vh=VH, per=desk?.85:.8;
    J.style.height=Math.round(vh*(per*(N-1+.6))+vh)+'px';
  }

  var lastCopy=-1;
  function updJourney(vh){
    var r=J.getBoundingClientRect(), span=J.offsetHeight-vh;
    var raw=cl(-r.top/span), s=raw*(N-1+.6);
    var i=Math.min(Math.floor(s),N-1), f=s-i, travel, dwell;
    if(i>=N-1){travel=0;dwell=cl(f/.5)}else{travel=sm((f-.42)/.58);dwell=cl(f/.42)}
    var pos=i+travel;
    var Wp=stage.clientWidth,Hp=stage.clientHeight,ax,ay,vx,vy,vw,vhU;
    if(!Wp||!Hp)return;
    if(desk){vw=1600;vhU=Hp*vw/Wp;ax=500+pos*1000;ay=420-60*Math.sin(Math.PI*travel);vx=ax-.68*vw;vy=430-vhU*.5}
    else{vw=900;vhU=Hp*vw/Wp;ax=500+Math.sin(Math.PI*travel)*40;ay=420+pos*900;vx=500-vw/2;vy=ay-vhU*.37}
    world.setAttribute('viewBox',vx.toFixed(1)+' '+vy.toFixed(1)+' '+vw+' '+vhU.toFixed(1));
    actor.setAttribute('transform','translate('+ax.toFixed(1)+' '+ay.toFixed(1)+')');
    railOn.style.strokeDashoffset=(+railOn.dataset.l)-pos*STEP;
    for(var k=0;k<N;k++){var w=cl(1.3-1.6*Math.abs(pos-k));var fm=forms[k];
      if(w<=0){fm.style.visibility='hidden';continue}
      fm.style.visibility='visible';fm.style.opacity=w.toFixed(3);fm.setAttribute('transform','scale('+(.82+.18*w).toFixed(3)+')');}
    for(k=0;k<N;k++){stGroups[k].style.opacity=cl(1-Math.abs(pos-k)*.75,.12,1).toFixed(2);stops[k].classList.toggle('on',pos>=k-.02)}
    function dAt(k){return i===k?dwell:(pos>k?1:0)}
    /* 0 negozio: il flusso verso eLogy */
    var d0=dAt(0); for(var z=0;z<sFlow.length;z++)sFlow[z].style.strokeDashoffset=(-d0*60).toFixed(1);
    /* 1 magazzino: il prodotto entra nella scatola, la scatola si chiude */
    var d1=dAt(1); pkItem.style.transform='translateY('+lerp(-150,110,eo(d1/.55)).toFixed(1)+'px)';
    pkFlaps.style.opacity=(1-sm((d1-.5)/.2)).toFixed(2);pkClosed.style.opacity=sm((d1-.52)/.2).toFixed(2);
    /* 2 etichetta contrassegno */
    var d2=dAt(2); lbMove.style.transform='translate('+lerp(-70,0,eo(d2/.6)).toFixed(1)+'px,'+lerp(-60,0,eo(d2/.6)).toFixed(1)+'px)';lbMove.style.opacity=cl(d2/.35).toFixed(2);
    /* 3 corriere */
    var rot=(pos*540)%360; wheels.forEach(function(wh){wh.el.setAttribute('transform',wh.base+' rotate('+rot.toFixed(1)+')')});
    speed.style.opacity=((i===2||i===3)?Math.sin(Math.PI*travel):0).toFixed(2);
    /* 4 verso Est: la rotta si accende, il tracking avanza */
    var d4=dAt(4); if(routeOn)routeOn.style.strokeDashoffset=((+routeOn.dataset.l)*(1-eo(d4/.8))).toFixed(1);
    var n4=i<4?1:(i===4?1+Math.floor(dwell*2.99)+(travel>.3?1:0):4);
    phSt.forEach(function(g,j){g.classList.toggle('on',j<n4)});phFill.style.strokeDashoffset=180-(n4-1)*60;
    /* 5 alla porta: il cliente paga */
    var d5=dAt(5); cash.style.transform='translate('+lerp(-120,0,eo(d5/.5)).toFixed(1)+'px,0)';cash.style.opacity=cl(d5/.3).toFixed(2);
    paid.setAttribute('transform','translate(150 -150) scale('+Math.max(0,back((d5-.45)/.5)).toFixed(3)+')');
    /* 6 incassato, riconciliato */
    var d6=dAt(6); rows.forEach(function(rw,j){rw.classList.toggle('on',d6>.12+j*.28)});
    /* 7 il paese dopo: il cliente ha il pacco, si pensa al mercato successivo */
    var d7=dAt(7); ok.setAttribute('transform','translate(150 -150) scale('+Math.max(0,back(d7/.6)).toFixed(3)+')');
    var c=Math.min(N-1,Math.round(pos));
    if(c!==lastCopy){copies.forEach(function(e,j){e.classList.toggle('on',j===c)});
      lis.forEach(function(e,j){e.className=j===c?'on':(j<c?'done':'')});bars.forEach(function(e,j){e.className=j===c?'on':(j<c?'done':'')});
      mobT.innerHTML='<span>'+sts[c].getAttribute('data-name')+'</span><em>0'+(c+1)+' / 0'+N+'</em>';lastCopy=c;}
    return r;
  }

  /* ---------------- IL PACCO CHE ATTRAVERSA LA PAGINA (ghost) ---------------- */
  var ghost=d.getElementById('ghost'), gPill=d.getElementById('ghost-pill');
  var P=[ghost.getAttribute('data-p0'),ghost.getAttribute('data-p1'),ghost.getAttribute('data-p2')];
  var slotHero=d.getElementById('slot-hero'), slotPile=d.getElementById('slot-pile'), slotShift=d.getElementById('slot-shift');
  var lastPill='';
  function pill(txt,cls){if(txt===lastPill)return;lastPill=txt;gPill.textContent=txt;gPill.className='pill'+(cls?' '+cls:'')}
  function docTop(el){return el.getBoundingClientRect().top+W.scrollY}
  function updGhost(vh){
    var sy=W.scrollY, heroH=slotHero.offsetParent?slotHero.offsetParent.offsetHeight:vh;
    var pTop=docTop(problem), pH=problem.offsetHeight, jTop=docTop(J);
    var shR=slotShift.getBoundingClientRect(), shC=shR.top+sy+shR.height/2;
    var segs=[
      {a:slotHero,b:slotPile,s0:heroH*.12,s1:pTop-(desk?0:vh*.05)},
      {a:slotPile,b:slotShift,s0:pTop+pH-vh*(desk?1.05:.95),s1:shC-vh*.5},
      {a:slotShift,b:codeCard,s0:shC-vh*.5+vh*.2,s1:jTop}
    ];
    var A,B,t=0,si=0;
    if(sy<=segs[0].s0){A=B=slotHero;si=-1}
    else{for(var k=0;k<segs.length;k++){var sg=segs[k];if(sy<sg.s1||k===segs.length-1){if(sy<sg.s0){A=B=sg.a;t=0}else{A=sg.a;B=sg.b;t=cl((sy-sg.s0)/(sg.s1-sg.s0))}si=k;break}}}
    var ra=A.getBoundingClientRect(), rb=B.getBoundingClientRect(), e=sm(t);
    var x=lerp(ra.left,rb.left,e), y=lerp(ra.top,rb.top,e), w=lerp(ra.width,rb.width,e);
    var arc=Math.sin(Math.PI*e), rot=arc*(si===1?5:-6);
    y-=arc*(desk?60:30);
    var op=1;
    if(si===2)op=1-sm((t-.72)/.28);
    if(sy>=jTop-2)op=0;
    ghost.style.opacity=op.toFixed(3);
    ghost.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px) rotate('+rot.toFixed(2)+'deg) scale('+(w/280).toFixed(4)+')';
    if(si<=0&&e<.85)pill(P[0],'');
    else if((si===0&&e>=.85)||(si===1&&e<.35))pill(P[1],'wait');
    else pill(P[2],'on');
  }

  /* ---------------- ciclo ---------------- */
  var ticking=false;
  function frame(){ticking=false;var vh=W.innerHeight;updProblem(vh);updJourney(vh);updGhost(vh)}
  function req(){if(!ticking){ticking=true;requestAnimationFrame(frame)}}
  W.addEventListener('scroll',req,{passive:true});
  /* Sul telefono la barra del browser che si nasconde cambia l'altezza a ogni
     scorrimento: se ricalcolassimo, tutta la pagina sotto salterebbe. Si ricalcola
     solo quando cambia la larghezza (rotazione, finestra ridimensionata). */
  W.addEventListener('resize',function(){if(W.innerWidth!==VW){VW=W.innerWidth;VH=W.innerHeight;layout();}req()});
  layout();
  var m=location.search.match(/[?&]go=([\w-]+)/), pm=location.search.match(/[?&]p=([\d.]+)/);
  if(m){var el=d.getElementById(m[1]);if(el){var p=pm?+pm[1]:0;W.scrollTo(0,docTop(el)+p*Math.max(0,el.offsetHeight-W.innerHeight));}}
  frame();
  ghost.classList.add('ready');
  if(d.fonts&&d.fonts.ready)d.fonts.ready.then(req);
})();
