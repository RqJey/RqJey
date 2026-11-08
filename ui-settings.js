
/* RQJEY UI SETTINGS — persistent visual preferences */
(() => {
  'use strict';
  const STORAGE_KEY = 'rqjey-ui-settings-v1';
  const THEME_KEY = 'rqjey-ui-theme';
  const defaults = {
    glass:true, cursorLight:true, magnetic:false, rainbow:true, modalDepth:true, animatedBorders:true,
    customCursor:false, pageTransitions:true, scrollProgress:true, headingReveal:true,
    customNotifications:true, smoothThemes:true, iconMotion:true
  };
  const definitions = [
    {id:'glass',group:'effects',title:'Жидкое стекло',description:'Полупрозрачные панели, размытие и мягкие блики.'},
    {id:'cursorLight',group:'effects',title:'Свет от курсора',description:'Мягкое свечение следует за движением мыши.'},
    {id:'magnetic',group:'effects',title:'Магнитные кнопки',description:'Интерактивные элементы слегка тянутся к курсору.'},
    {id:'rainbow',group:'effects',title:'Радужный контур',description:'Переливающаяся граница карточек при наведении.'},
    {id:'modalDepth',group:'effects',title:'Искажение пространства',description:'Фон за открытым окном размывается и отдаляется.'},
    {id:'animatedBorders',group:'effects',title:'Анимированные границы',description:'Тонкие контуры медленно переливаются.'},
    {id:'customCursor',group:'quality',title:'Кастомный курсор',description:'Особый курсор для ссылок и кнопок.'},
    {id:'pageTransitions',group:'quality',title:'Переходы страниц',description:'Плавное появление и исчезновение при навигации.'},
    {id:'scrollProgress',group:'quality',title:'Индикатор прокрутки',description:'Тонкая полоска показывает прогресс страницы.'},
    {id:'headingReveal',group:'quality',title:'Появление заголовков',description:'Заголовки проявляются при прокрутке.'},
    {id:'customNotifications',group:'quality',title:'Красивые уведомления',description:'Вместо стандартных системных alert — стильные тосты.'},
    {id:'smoothThemes',group:'quality',title:'Плавная смена тем',description:'Анимированное переключение оформления.'},
    {id:'iconMotion',group:'quality',title:'Анимация иконок',description:'Иконки оживают при наведении.'}
  ];
  let settings = {...defaults};
  try { settings = {...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')}; } catch (_) {}
  let activeTheme = 'dark';
  try { activeTheme = localStorage.getItem(THEME_KEY) || 'dark'; } catch (_) {}
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia?.('(hover:hover) and (pointer:fine)').matches;
  const create = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const trigger = create('button','ui-settings-trigger');
  trigger.type = 'button';
  trigger.setAttribute('aria-haspopup','dialog');
  trigger.setAttribute('aria-expanded','false');
  trigger.innerHTML = '<span class="ui-settings-trigger-icon" aria-hidden="true">⚙</span><span>Настройки сайта</span>';
  trigger.addEventListener('click', openPanel);
  document.body.appendChild(trigger);

  const backdrop = create('div','ui-settings-backdrop');
  backdrop.hidden = true;
  const dialog = create('section','ui-settings-dialog');
  dialog.setAttribute('role','dialog'); dialog.setAttribute('aria-modal','true');
  dialog.setAttribute('aria-labelledby','uiSettingsTitle');
  const header = create('header','ui-settings-header');
  header.innerHTML = '<div class="ui-settings-kicker">RQJEY STUDIO · PERSONALIZATION</div><h2 id="uiSettingsTitle">Настройки сайта</h2><p>Настрой внешний вид и поведение интерфейса. Выбор сохранится в этом браузере.</p>';
  const close = create('button','ui-settings-close','×');
  close.type = 'button'; close.setAttribute('aria-label','Закрыть настройки');
  close.addEventListener('click',closePanel); header.appendChild(close);
  const content = create('div','ui-settings-content');
  const buildSection = (title, group) => {
    const section = create('section','ui-settings-section');
    const heading = create('h3','ui-settings-section-title',title);
    const list = create('div','ui-settings-list');
    definitions.filter(item=>item.group===group).forEach(item=>{
      const row = create('div','ui-setting-row');
      const copy = create('span','ui-setting-copy');
      copy.append(create('strong','',item.title),create('small','',item.description));
      const toggle = create('button','ui-switch');
      toggle.type='button'; toggle.dataset.setting=item.id;
      toggle.setAttribute('role','switch'); toggle.setAttribute('aria-label',item.title);
      toggle.addEventListener('click',()=>{
        settings[item.id]=!settings[item.id]; persist(); syncControls();
        window.rqjeyNotify?.(item.title + (settings[item.id] ? ' включено' : ' выключено'));
      });
      row.append(copy,toggle); list.appendChild(row);
    });
    section.append(heading,list); return section;
  };
  content.append(buildSection('Визуальные эффекты','effects'),buildSection('Детали интерфейса','quality'));
  const themeSection=create('section','ui-settings-section');
  themeSection.appendChild(create('h3','ui-settings-section-title','Оформление сайта'));
  const themes=create('div','ui-theme-options');
  [['light','Светлая'],['dark','Тёмная'],['cosmic','Космос']].forEach(([value,label])=>{
    const button=create('button','ui-theme-choice'); button.type='button'; button.dataset.uiTheme=value;
    const dot=create('span','ui-theme-dot '+value); dot.setAttribute('aria-hidden','true');
    button.append(dot,create('strong','',label));
    button.addEventListener('click',()=>{const apply=()=>setTheme(value);if(settings.smoothThemes&&!reduceMotion&&document.startViewTransition)document.startViewTransition(apply);else apply();}); themes.appendChild(button);
  });
  themeSection.appendChild(themes); content.appendChild(themeSection);
  const footer=create('footer','ui-settings-footer');
  footer.appendChild(create('span','','Настройки применяются сразу и сохраняются автоматически.'));
  const reset=create('button','ui-settings-reset','Сбросить настройки'); reset.type='button';
  reset.addEventListener('click',()=>{
    settings={...defaults}; activeTheme='dark'; persist(); setTheme('dark',false); syncControls();
    window.rqjeyNotify?.('Настройки возвращены к исходным');
  });
  footer.appendChild(reset); content.appendChild(footer);
  dialog.append(header,content); backdrop.appendChild(dialog); document.body.appendChild(backdrop);
  backdrop.addEventListener('click',event=>{if(event.target===backdrop)closePanel();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!backdrop.hidden)closePanel();});
  function openPanel(){backdrop.hidden=false;trigger.setAttribute('aria-expanded','true');document.body.classList.add('ui-settings-open');close.focus();}
  function closePanel(){backdrop.hidden=true;trigger.setAttribute('aria-expanded','false');document.body.classList.remove('ui-settings-open');trigger.focus();}
  function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(settings));}catch(_){} applySettings();}
  function syncControls(){
    document.querySelectorAll('[data-setting]').forEach(toggle=>{
      const on=!!settings[toggle.dataset.setting];
      toggle.setAttribute('aria-checked',String(on)); toggle.title=on?'Включено':'Выключено';
    });
    document.querySelectorAll('[data-ui-theme]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.uiTheme===activeTheme)));
  }
  function setTheme(theme,save=true){
    activeTheme=['light','dark','cosmic'].includes(theme)?theme:'dark';
    document.documentElement.dataset.theme=activeTheme==='light'?'light':'dark';
    document.documentElement.classList.toggle('ui-cosmic-theme',activeTheme==='cosmic');
    document.body.classList.toggle('ui-cosmic-theme',activeTheme==='cosmic');
    const themeSelect=document.getElementById('themeSelect');
    if(themeSelect&&activeTheme!=='cosmic'){
      themeSelect.value=activeTheme; themeSelect.dispatchEvent(new Event('change',{bubbles:true}));
    }
    if(activeTheme==='cosmic'){
      const cosmicOption=document.querySelector('[data-site-theme="cosmic"]');
      if(cosmicOption) cosmicOption.click();
      else document.body.classList.add('cosmic-mode');
    } else {
      const standardOption=document.querySelector('[data-site-theme="standard"]');
      if(document.body.classList.contains('cosmic-mode')&&standardOption) standardOption.click();
      document.body.classList.remove('cosmic-mode');
    }
    if(save){try{localStorage.setItem(THEME_KEY,activeTheme);}catch(_){}}
    syncControls();
  }
  function applySettings(){
    const root=document.documentElement;
    Object.keys(defaults).forEach(key=>root.classList.toggle('ui-'+key,!!settings[key] && !(reduceMotion&&['magnetic','iconMotion','pageTransitions'].includes(key))));
    root.style.setProperty('--ui-pointer-x','-1000px'); root.style.setProperty('--ui-pointer-y','-1000px');
    if(progressBar) progressBar.setAttribute('data-enabled',String(!!settings.scrollProgress));
    if(cursorGlow) cursorGlow.setAttribute('data-enabled',String(!!settings.cursorLight));
  }
  applySettings(); syncControls();
  setTheme(activeTheme,false);

  // Reuse the site's toast style and expose a notification helper on every page.
  let toast=create('div','ui-settings-toast'); toast.setAttribute('role','status'); toast.setAttribute('aria-live','polite'); document.body.appendChild(toast);
  let toastTimer;
  window.rqjeyNotify=(message)=>{
    if(!settings.customNotifications){toast.textContent=String(message);toast.classList.add('is-visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('is-visible'),2800);return;}
    toast.textContent=String(message);toast.classList.add('is-visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('is-visible'),3200);
  };
  const nativeAlert=window.alert?.bind(window);
  if(nativeAlert) window.alert=(message)=>settings.customNotifications?window.rqjeyNotify(message):nativeAlert(message);

  // Effects that are safe to activate independently of the page's own scripts.
  if(finePointer&&!reduceMotion){
    let pointerFrame=0,lastX=0,lastY=0;
    document.addEventListener('pointermove',event=>{
      lastX=event.clientX;lastY=event.clientY;
      if(pointerFrame)return;
      pointerFrame=requestAnimationFrame(()=>{
        pointerFrame=0;
        document.documentElement.style.setProperty('--ui-pointer-x',lastX+'px');
        document.documentElement.style.setProperty('--ui-pointer-y',lastY+'px');
      });
    },{passive:true});
    document.addEventListener('pointerover',event=>{
      if(!settings.magnetic)return;
      const target=event.target.closest('button,a,.primary-cta,.secondary-cta');
      if(!target||target.closest('.ui-settings-dialog'))return;
      target.classList.add('ui-magnetic-item');
    },{passive:true});
    document.addEventListener('pointermove',event=>{
      const target=event.target.closest('.ui-magnetic-item');
      if(!target||!settings.magnetic)return;
      const rect=target.getBoundingClientRect(),dx=event.clientX-(rect.left+rect.width/2),dy=event.clientY-(rect.top+rect.height/2);
      target.style.setProperty('--ui-magnet-x',Math.max(-5,Math.min(5,dx*.08))+'px');
      target.style.setProperty('--ui-magnet-y',Math.max(-4,Math.min(4,dy*.08))+'px');
    },{passive:true});
    document.addEventListener('pointerout',event=>{
      const target=event.target.closest('.ui-magnetic-item');
      if(target&&!target.contains(event.relatedTarget)){target.style.removeProperty('--ui-magnet-x');target.style.removeProperty('--ui-magnet-y');}
    },{passive:true});
  }
  const progressBar=create('div','ui-scroll-progress'); progressBar.setAttribute('aria-hidden','true'); document.body.appendChild(progressBar);
  const updateProgress=()=>{const max=document.documentElement.scrollHeight-innerHeight;progressBar.style.transform='scaleX('+(max>0?scrollY/max:0)+')';};
  addEventListener('scroll',updateProgress,{passive:true});addEventListener('resize',updateProgress,{passive:true});updateProgress();
  const cursorGlow=create('div','ui-cursor-glow');cursorGlow.setAttribute('aria-hidden','true');document.body.appendChild(cursorGlow);
  if(settings.headingReveal&&!reduceMotion&&'IntersectionObserver'in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting&&settings.headingReveal){entry.target.classList.add('ui-heading-visible');observer.unobserve(entry.target);}}),{threshold:.12});
    document.querySelectorAll('h1,h2,.section-kicker').forEach(node=>{node.classList.add('ui-heading-reveal');observer.observe(node);});
  }
  if(!reduceMotion){
    document.addEventListener('click',event=>{
      if(!settings.pageTransitions)return;
      const link=event.target.closest('a[href]');if(!link||link.target==='_blank'||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const url=new URL(link.href,location.href);if(url.origin!==location.origin||url.pathname===location.pathname||url.hash&&!url.pathname.endsWith('.html'))return;
      if(url.pathname.endsWith('.html')&&document.startViewTransition){event.preventDefault();document.startViewTransition(()=>location.assign(url.href));}
    });
    document.addEventListener('pointerover',event=>{if(!settings.iconMotion)return;const icon=event.target.closest('button svg,button .ui-settings-trigger-icon,.project-icon,.tools-choice-icon,.social-choice-icon');if(icon)icon.classList.add('ui-icon-active');});
    document.addEventListener('pointerout',event=>{const icon=event.target.closest('button svg,button .ui-settings-trigger-icon,.project-icon,.tools-choice-icon,.social-choice-icon');if(icon&&!icon.contains(event.relatedTarget))icon.classList.remove('ui-icon-active');});
  }
})();
