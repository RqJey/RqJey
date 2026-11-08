(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const boot = document.getElementById('bootScreen');
  const bootStartedAt = performance.now();
  let bootHideTimer = 0;
  const hideBoot = () => {
    if (!boot || boot.classList.contains('boot-done') || bootHideTimer) return;
    const revealPage = () => {
      bootHideTimer = 0;
      if (!boot || boot.classList.contains('boot-done')) return;
      boot.classList.add('boot-done');
      document.body.classList.remove('rq-loading');
      setTimeout(() => boot.remove(), 900);
    };
    // Keep the branded loader visible for at least 0.9 seconds.
    const remaining = Math.max(0, 900 - (performance.now() - bootStartedAt));
    bootHideTimer = window.setTimeout(revealPage, remaining);
  };
  // Reveal after the app has painted its initial state; bounded fallback covers offline/API errors.
  const grid = document.getElementById('projectGrid');
  if (grid) {
    const observer = new MutationObserver(() => { if (grid.children.length) { observer.disconnect(); setTimeout(hideBoot, 260); } });
    observer.observe(grid, {childList:true, subtree:true});
  }
  window.addEventListener('load', () => setTimeout(hideBoot, 650), {once:true});
  setTimeout(hideBoot, 6500);

  // Three selectable visual themes; the selected theme survives page reloads.
  const cosmicButton = document.getElementById('cosmicToggle');
  const themePicker = document.getElementById('themePicker');
  const themeOptions = [...document.querySelectorAll('[data-site-theme]')];
  const themeKey = 'rqjey-site-theme';
  function setSiteTheme(theme) {
    const selected = ['standard', 'cosmic', 'aurora'].includes(theme) ? theme : 'standard';
    document.documentElement.classList.toggle('cosmic-mode', selected === 'cosmic');
    document.body.classList.toggle('cosmic-mode', selected === 'cosmic');
    document.documentElement.classList.toggle('aurora-mode', selected === 'aurora');
    document.body.classList.toggle('aurora-mode', selected === 'aurora');
    window.setCosmicThemeOverride?.(selected !== 'standard');
    themeOptions.forEach(option => option.setAttribute('aria-pressed', String(option.dataset.siteTheme === selected)));
    cosmicButton?.setAttribute('aria-label', 'Выбрать тему оформления');
    cosmicButton?.setAttribute('aria-pressed', String(selected !== 'standard'));
    cosmicButton?.setAttribute('title', selected === 'cosmic' ? 'Тема: Космос' : selected === 'aurora' ? 'Тема: Полярное сияние' : 'Тема: Стандартная');
    try { localStorage.setItem(themeKey, selected); } catch (_) {}
    document.querySelector('.aurora-ribbon')?.classList.toggle('is-active', selected === 'aurora');
  }
  function closeThemePicker() {
    themePicker?.classList.add('hidden');
    cosmicButton?.setAttribute('aria-expanded', 'false');
  }
  function toggleThemePicker() {
    if (!themePicker) return;
    const opening = themePicker.classList.contains('hidden');
    themePicker.classList.toggle('hidden', !opening);
    cosmicButton?.setAttribute('aria-expanded', String(opening));
  }
  let savedTheme = 'standard';
  try { savedTheme = localStorage.getItem(themeKey) || 'standard'; } catch (_) {}
  setSiteTheme(savedTheme);
  cosmicButton?.addEventListener('click', toggleThemePicker);
  themeOptions.forEach(option => option.addEventListener('click', () => {
    const apply = () => setSiteTheme(option.dataset.siteTheme);
    if (!reduce && document.startViewTransition) document.startViewTransition(apply); else apply();
    closeThemePicker();
  }));
  document.addEventListener('click', event => {
    if (!event.target.closest('.theme-picker-wrap')) closeThemePicker();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeThemePicker();
  });

  // Solar-system backdrop: softly crossfade a different planet every 3.6 seconds.
  const cosmicPlanet = document.getElementById('cosmicPlanet');
  const cosmicPlanetCaption = document.getElementById('cosmicPlanetCaption');
  const solarBodies = [
    ['mercury', 'MERCURY'], ['venus', 'VENUS'], ['earth', 'EARTH'],
    ['mars', 'MARS'], ['jupiter', 'JUPITER'], ['saturn', 'SATURN'],
    ['uranus', 'URANUS'], ['neptune', 'NEPTUNE']
  ];
  let planetIndex = 0, planetTimer = null;
  function showPlanet(index) {
    if (!cosmicPlanet) return;
    cosmicPlanet.classList.remove('is-visible');
    window.setTimeout(() => {
      const [key, label] = solarBodies[index];
      cosmicPlanet.dataset.planet = key;
      if (cosmicPlanetCaption) cosmicPlanetCaption.textContent = `${label} · SOLAR SYSTEM`;
      requestAnimationFrame(() => cosmicPlanet.classList.add('is-visible'));
    }, 420);
  }
  function syncPlanetRotation() {
    if (planetTimer) { clearInterval(planetTimer); planetTimer = null; }
    if (!document.body.classList.contains('cosmic-mode') || document.hidden || reduce || !matchMedia('(min-width: 901px) and (hover:hover) and (pointer:fine)').matches) return;
    showPlanet(planetIndex);
    planetTimer = setInterval(() => {
      planetIndex = (planetIndex + 1) % solarBodies.length;
      showPlanet(planetIndex);
    }, 3600);
  }
  document.addEventListener('visibilitychange', syncPlanetRotation);
  const originalSetCosmic = setCosmic;
  // Wrap the existing toggle state synchronizer so the planet cycle follows the theme.
  const cosmicClickHandler = () => {};
  const cosmicObserver = new MutationObserver(syncPlanetRotation);
  cosmicObserver.observe(document.documentElement, {attributes:true, attributeFilter:['class']});
  syncPlanetRotation();

  // Lightweight ambient particles: no dependencies, pauses when the tab is hidden.
  const canvas = document.getElementById('particleCanvas');
  if (canvas && !reduce && matchMedia('(min-width: 901px) and (hover:hover) and (pointer:fine)').matches) {
    const ctx = canvas.getContext('2d'); let w=0,h=0,dpr=1, particles=[], raf=0, pointer={x:-1000,y:-1000};
    const count = () => Math.min(58, Math.max(24, Math.floor(w*h/26000)));
    function resize(){ dpr=Math.min(devicePixelRatio||1,1.6); w=innerWidth; h=innerHeight; canvas.width=w*dpr; canvas.height=h*dpr; canvas.style.width=w+'px'; canvas.style.height=h+'px'; ctx.setTransform(dpr,0,0,dpr,0,0); particles=Array.from({length:count()},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.18,vy:(Math.random()-.5)*.18,r:.7+Math.random()*1.35,a:.12+Math.random()*.24})); }
    function draw(){ raf=0; if(document.hidden) return; ctx.clearRect(0,0,w,h);
      for(let i=0;i<particles.length;i++){const p=particles[i];p.x+=p.vx;p.y+=p.vy;if(p.x<-8)p.x=w+8;if(p.x>w+8)p.x=-8;if(p.y<-8)p.y=h+8;if(p.y>h+8)p.y=-8;
        const dx=p.x-pointer.x,dy=p.y-pointer.y,dist=Math.hypot(dx,dy);if(dist<115){p.x+=dx/(dist||1)*.12;p.y+=dy/(dist||1)*.12;}
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`${document.body.classList.contains('cosmic-mode') ? `rgba(126,190,255,${p.a})` : `rgba(185,165,246,${p.a})`}`;ctx.fill();
        for(let j=i+1;j<particles.length;j++){const q=particles[j],d=Math.hypot(p.x-q.x,p.y-q.y);if(d<92){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=`${document.body.classList.contains('cosmic-mode') ? `rgba(119,157,255,${(1-d/92)*.12})` : `rgba(157,203,190,${(1-d/92)*.075})`}`;ctx.lineWidth=.7;ctx.stroke();}}
      } raf=requestAnimationFrame(draw);
    }
    resize(); draw(); addEventListener('resize',resize,{passive:true}); addEventListener('pointermove',e=>{pointer.x=e.clientX;pointer.y=e.clientY;},{passive:true}); document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else if(!raf)draw();});
  }

  // Subtle 3D card tilt with gentle spring-back. Touch devices remain static and accessible.
  if (!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.getElementById('projectGrid')?.addEventListener('pointermove', e => {
      const card=e.target.closest('.project-card'); if(!card)return; const r=card.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      card.style.setProperty('--tilt-x',`${(-y*3.2).toFixed(2)}deg`); card.style.setProperty('--tilt-y',`${(x*4.2).toFixed(2)}deg`);
      card.style.setProperty('--pointer-x',`${e.clientX-r.left}px`); card.style.setProperty('--pointer-y',`${e.clientY-r.top}px`);
    });
    document.getElementById('projectGrid')?.addEventListener('pointerout',e=>{const card=e.target.closest('.project-card');if(card&&!card.contains(e.relatedTarget)){card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');}});
  }

  // Smooth route-like transitions on internal navigation without interfering with hash behavior.
  document.addEventListener('click', e => {
    const link=e.target.closest('a[href^="#"]'); if(!link || reduce || !document.startViewTransition)return;
    const target=document.querySelector(link.getAttribute('href')); if(!target)return;
    e.preventDefault(); document.startViewTransition(()=>{location.hash=link.getAttribute('href').slice(1);target.scrollIntoView({behavior:'instant',block:'start'});});
  });

  // Clear download feedback; the actual browser download remains a normal direct link.
  const download=document.getElementById('downloadButton'), feedback=document.getElementById('downloadFeedback'); let feedbackTimer;
  download?.addEventListener('click', e=>{
    if(download.classList.contains('disabled') || download.getAttribute('aria-disabled')==='true'){e.preventDefault();return;}
    const ru=document.documentElement.lang!=='en'; const title=feedback.querySelector('b'), sub=feedback.querySelector('small');
    title.textContent=ru?'Загрузка началась':'Download started'; sub.textContent=ru?'Файл передан браузеру':'File handed to your browser';
    feedback.classList.add('visible'); clearTimeout(feedbackTimer); feedbackTimer=setTimeout(()=>feedback.classList.remove('visible'),4200);
  });
})();
