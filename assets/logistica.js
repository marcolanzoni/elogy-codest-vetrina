/* eLogy · landing «logistica»: solo comparse leggere allo scorrimento (sotto html.m) */
(function(){
  var d=document.documentElement;
  if(!d.classList.contains("m")||!("IntersectionObserver" in window))return;
  var els=document.querySelectorAll(".p-logistica .lx-sec h2, .p-logistica .lx-sec .lead, .p-logistica .lx-pain li, .p-logistica .lx-serv li, .p-logistica .lx-table-wrap, .p-logistica .lx-steps li, .p-logistica .lx-panel, .p-logistica .lx-start li, .p-logistica .lx-risk");
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}});},{rootMargin:"0px 0px -8% 0px"});
  els.forEach(function(el){
    var r=el.getBoundingClientRect();
    if(r.top<innerHeight)return; /* già visibile: non si tocca */
    el.classList.add("lx-r");io.observe(el);
  });
})();
