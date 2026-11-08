(() => {
  const $ = id => document.getElementById(id);
  const tabs = [...document.querySelectorAll("[data-tool-tab]")];
  const panels = [...document.querySelectorAll("[data-tool-panel]")];
  function showTool(name, updateHash) {
    if (!panels.some(panel => panel.dataset.toolPanel === name)) name = "enchantments";
    tabs.forEach(tab => tab.setAttribute("aria-selected", String(tab.dataset.toolTab === name)));
    panels.forEach(panel => { panel.hidden = panel.dataset.toolPanel !== name; });
    if (updateHash) history.replaceState(null, "", "#" + name);
  }
  tabs.forEach(tab => tab.addEventListener("click", () => showTool(tab.dataset.toolTab, true)));
  const initialTool = location.hash.slice(1);
  showTool(initialTool, false);

  const enchantments = [
    ["Защита","protection",1,4],["Огнеупорность","fire_protection",1,4],["Взрывоустойчивость","blast_protection",2,4],["Защита от снарядов","projectile_protection",1,4],
    ["Шипы","thorns",4,3],["Подводное дыхание","respiration",2,3],["Подводник","aqua_affinity",4,1],["Подводная ходьба","depth_strider",2,3],
    ["Ледоход","frost_walker",2,2],["Скорость души","soul_speed",4,3],["Бесшумное передвижение","swift_sneak",4,3],
    ["Острота","sharpness",1,5],["Небесная кара","smite",2,5],["Бич членистоногих","bane_of_arthropods",2,5],["Отбрасывание","knockback",2,2],
    ["Заговор огня","fire_aspect",4,2],["Мародёрство","looting",2,3],["Разящий клинок","sweeping_edge",2,3],
    ["Эффективность","efficiency",1,5],["Шёлковое касание","silk_touch",4,1],["Прочность","unbreaking",2,3],["Удача","fortune",4,3],
    ["Сила","power",1,5],["Откидывание","punch",4,2],["Воспламенение","flame",2,1],["Бесконечность","infinity",8,1],
    ["Морская удача","luck_of_the_sea",2,3],["Приманка","lure",2,3],["Верность","loyalty",1,3],["Пронзатель","impaling",2,5],
    ["Тягун","riptide",2,3],["Громовержец","channeling",4,1],["Мультивыстрел","multishot",4,1],["Пронзающая стрела","piercing",1,4],
    ["Быстрая перезарядка","quick_charge",2,3],["Починка","mending",4,1],["Проклятие утраты","vanishing_curse",8,1],["Проклятие несъёмности","binding_curse",8,1],
    ["Плотность","density",1,5],["Пробитие","breach",2,4],["Порыв ветра","wind_burst",4,3]
  ];
  const enchantSelect = $("enchantSelect"), levelSelect = $("enchantLevel");
  enchantments.forEach((item,index) => {
    const option = document.createElement("option"); option.value = String(index); option.textContent = item[0]; enchantSelect.appendChild(option);
  });
  function updateLevels() {
    const item = enchantments[Number(enchantSelect.value)] || enchantments[0];
    levelSelect.replaceChildren();
    for (let level=1; level<=item[3]; level++) {
      const option=document.createElement("option"); option.value=String(level); option.textContent="Уровень " + level; levelSelect.appendChild(option);
    }
  }
  enchantSelect.addEventListener("change", updateLevels); updateLevels();
  let selectedEnchants = [];
  function renderEnchantList() {
    const list=$("enchantList"); list.replaceChildren();
    if (!selectedEnchants.length) { const p=document.createElement("p"); p.className="mc-empty"; p.textContent="Пока ничего не добавлено."; list.appendChild(p); return; }
    selectedEnchants.forEach((entry,index) => {
      const row=document.createElement("div"); row.className="mc-list-row";
      const label=document.createElement("span"); label.textContent=entry.name + " " + entry.level;
      const cost=document.createElement("small"); cost.textContent="множитель " + entry.multiplier;
      const remove=document.createElement("button"); remove.className="mc-remove"; remove.type="button"; remove.textContent="×"; remove.setAttribute("aria-label","Удалить " + entry.name);
      remove.addEventListener("click",()=>{selectedEnchants.splice(index,1);renderEnchantList();});
      row.append(label,cost,remove); list.appendChild(row);
    });
  }
  $("addEnchant").addEventListener("click",()=>{
    const item=enchantments[Number(enchantSelect.value)], level=Number(levelSelect.value);
    if (!item) return;
    const existing=selectedEnchants.find(entry=>entry.id===item[1]);
    if (existing) existing.level=Math.max(existing.level,level);
    else selectedEnchants.push({name:item[0],id:item[1],multiplier:item[2],level});
    renderEnchantList();
  });
  $("clearEnchants").addEventListener("click",()=>{selectedEnchants=[];renderEnchantList();$("enchantResult").innerHTML='<span class="mc-result-label">РЕЗУЛЬТАТ</span><strong>Добавь зачарования и запусти расчёт</strong>';});
  const priorPenalty = count => count <= 0 ? 0 : Math.pow(2,count)-1;
  $("calculateEnchant").addEventListener("click",()=>{
    const result=$("enchantResult");
    if (!selectedEnchants.length) { result.innerHTML='<span class="mc-result-label">РЕЗУЛЬТАТ</span><strong>Сначала добавь хотя бы одно зачарование</strong>'; return; }
    const targetPenalty=priorPenalty(Number($("targetWork").value));
    const bookPenalty=priorPenalty(Number($("bookWork").value));
    const enchantCost=selectedEnchants.reduce((sum,item)=>sum+Math.max(1,Math.ceil(item.multiplier*item.level/2)),0);
    const total=enchantCost+targetPenalty+bookPenalty;
    const status=total>=40 ? "В обычном выживании наковальня покажет «Слишком дорого!»." : "Стоимость не превышает лимит 39 уровней в обычном выживании.";
    result.innerHTML='<span class="mc-result-label">ПРИМЕРНАЯ СТОИМОСТЬ</span><strong>'+total+' уровней опыта</strong><p>Зачарования: '+enchantCost+' · Штраф целевого предмета: '+targetPenalty+' · Штраф книги: '+bookPenalty+'</p><p>'+status+'</p>';
  });

  $("calculatePortal").addEventListener("click",()=>{
    const x=Number($("portalX").value),z=Number($("portalZ").value),y=$("portalY").value.trim();
    const result=$("portalResult");
    if (!$("portalX").value.trim() || !$("portalZ").value.trim() || !Number.isFinite(x) || !Number.isFinite(z)) {
      result.innerHTML='<span class="mc-result-label">ОШИБКА ВВОДА</span><strong>Введи корректные координаты X и Z</strong>'; return;
    }
    const scale=$("portalDirection").value==="overworld" ? 1/8 : 8;
    const tx=x*scale,tz=z*scale;
    const target=$("portalDirection").value==="overworld" ? "Незер" : "Верхний мир";
    const yText=y && Number.isFinite(Number(y)) ? Number(y) : null;
    const fmt=n=>Number(n.toFixed(2)).toLocaleString("ru-RU");
    result.innerHTML='<span class="mc-result-label">КООРДИНАТЫ В '+target.toUpperCase()+'</span><strong>X: '+fmt(tx)+' · Z: '+fmt(tz)+'</strong><p>Ближайшие целые координаты: X '+Math.round(tx)+' · Z '+Math.round(tz)+(yText===null?"":" · Y "+yText)+'</p><p>Масштаб: '+(scale===0.125?"1 блок Незера = 8 блокам Верхнего мира":"1 блок Верхнего мира = 8 блокам Незера")+'</p>';
  });

  const colors = [
    ["Белый","white","#f0f0f0"],["Оранжевый","orange","#d87f33"],["Пурпурный","magenta","#b24cd8"],["Светло-синий","light_blue","#6699d8"],
    ["Жёлтый","yellow","#e5d44b"],["Лаймовый","lime","#7fcc3a"],["Розовый","pink","#d88198"],["Серый","gray","#474f52"],
    ["Светло-серый","light_gray","#9d9d97"],["Бирюзовый","cyan","#158991"],["Фиолетовый","purple","#792aad"],["Синий","blue","#35399d"],
    ["Коричневый","brown","#724728"],["Зелёный","green","#546d1b"],["Красный","red","#a12722"],["Чёрный","black","#1d1d21"]
  ];
  const patterns = [
    ["Нижняя полоса","stripe_bottom","bs"],["Верхняя полоса","stripe_top","ts"],["Левая полоса","stripe_left","ls"],["Правая полоса","stripe_right","rs"],
    ["Вертикальная полоса","stripe_center","cs"],["Горизонтальная полоса","stripe_middle","ms"],["Диагональ","stripe_downright","drs"],["Обратная диагональ","stripe_downleft","dls"],
    ["Крест","cross","cr"],["Диагональный крест","straight_cross","sc"],["Треугольник снизу","triangle_bottom","bt"],["Треугольник сверху","triangle_top","tt"],
    ["Круг","circle","mc"],["Ромб","rhombus","mr"],["Рамка","border","bo"],["Волнистая рамка","curly_border","cbo"],
    ["Градиент","gradient","gra"],["Восходящий градиент","gradient_up","gru"],["Кирпичи","bricks","bri"],["Крипер","creeper","cre"],
    ["Череп","skull","sku"],["Цветок","flower","flo"],["Глобус","globe","glb"],["Пиглин","piglin","pig"]
  ];
  const baseSelect=$("bannerBase"), patternSelect=$("bannerPattern"), colorSelect=$("bannerColor");
  colors.forEach(c=>{const o=document.createElement("option");o.value=c[1];o.textContent=c[0];baseSelect.appendChild(o);});
  colors.forEach(c=>{const o=document.createElement("option");o.value=c[1];o.textContent=c[0];colorSelect.appendChild(o);});
  patterns.forEach(p=>{const o=document.createElement("option");o.value=p[1];o.textContent=p[0];patternSelect.appendChild(o);});
  baseSelect.value="white"; colorSelect.value="black";
  let bannerLayers=[];
  const canvas=$("bannerCanvas"),ctx=canvas.getContext("2d");
  function colorHex(name){return (colors.find(c=>c[1]===name)||colors[0])[2];}
  function drawPattern(type,color){
    const c=colorHex(color); ctx.fillStyle=c; ctx.strokeStyle=c;
    switch(type){
      case "stripe_bottom":ctx.fillRect(0,330,300,120);break;
      case "stripe_top":ctx.fillRect(0,0,300,120);break;
      case "stripe_left":ctx.fillRect(0,0,78,450);break;
      case "stripe_right":ctx.fillRect(222,0,78,450);break;
      case "stripe_center":ctx.fillRect(112,0,76,450);break;
      case "stripe_middle":ctx.fillRect(0,187,300,76);break;
      case "stripe_downright":ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(90,0);ctx.lineTo(300,360);ctx.lineTo(300,450);ctx.closePath();ctx.fill();break;
      case "stripe_downleft":ctx.beginPath();ctx.moveTo(210,0);ctx.lineTo(300,0);ctx.lineTo(0,450);ctx.lineTo(0,360);ctx.closePath();ctx.fill();break;
      case "cross":ctx.fillRect(0,188,300,74);ctx.fillRect(113,0,74,450);break;
      case "straight_cross":ctx.lineWidth=62;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(300,450);ctx.moveTo(300,0);ctx.lineTo(0,450);ctx.stroke();break;
      case "triangle_bottom":ctx.beginPath();ctx.moveTo(0,450);ctx.lineTo(150,285);ctx.lineTo(300,450);ctx.closePath();ctx.fill();break;
      case "triangle_top":ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(150,165);ctx.lineTo(300,0);ctx.closePath();ctx.fill();break;
      case "circle":ctx.beginPath();ctx.ellipse(150,225,72,92,0,0,Math.PI*2);ctx.fill();break;
      case "rhombus":ctx.beginPath();ctx.moveTo(150,85);ctx.lineTo(245,225);ctx.lineTo(150,365);ctx.lineTo(55,225);ctx.closePath();ctx.fill();break;
      case "border":ctx.fillRect(0,0,300,42);ctx.fillRect(0,408,300,42);ctx.fillRect(0,0,38,450);ctx.fillRect(262,0,38,450);break;
      case "curly_border":ctx.lineWidth=23;ctx.strokeRect(17,17,266,416);break;
      case "gradient":for(let y=0;y<450;y+=8){ctx.globalAlpha=y/450;ctx.fillRect(0,y,300,8);}ctx.globalAlpha=1;break;
      case "gradient_up":for(let y=0;y<450;y+=8){ctx.globalAlpha=1-y/450;ctx.fillRect(0,y,300,8);}ctx.globalAlpha=1;break;
      case "bricks":for(let y=25;y<450;y+=85){ctx.fillRect(0,y,300,8);for(let x=(Math.floor(y/85)%2)*75;x<300;x+=150)ctx.fillRect(x,y-60,8,68);}break;
      case "creeper":ctx.fillRect(70,115,160,160);ctx.clearRect(95,150,35,35);ctx.clearRect(170,150,35,35);ctx.fillRect(135,190,30,50);ctx.fillRect(110,235,30,75);ctx.fillRect(160,235,30,75);break;
      case "skull":ctx.beginPath();ctx.arc(150,205,78,0,Math.PI*2);ctx.fill();ctx.clearRect(103,185,35,38);ctx.clearRect(162,185,35,38);ctx.fillRect(125,270,50,28);break;
      case "flower":ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.moveTo(150,225);ctx.ellipse(150+48*Math.cos(a),225+65*Math.sin(a),30,48,a,0,Math.PI*2);}ctx.fill();ctx.beginPath();ctx.arc(150,225,27,0,Math.PI*2);ctx.fill();break;
      case "globe":ctx.beginPath();ctx.arc(150,225,95,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation="destination-out";ctx.fillRect(130,130,28,190);ctx.globalCompositeOperation="source-over";break;
      case "piglin":ctx.fillRect(75,130,150,145);ctx.clearRect(100,165,35,35);ctx.clearRect(165,165,35,35);ctx.fillRect(120,220,60,25);break;
    }
  }
  function renderBanner(){
    ctx.clearRect(0,0,300,450);ctx.fillStyle="#171923";ctx.fillRect(0,0,300,450);
    ctx.fillStyle=colorHex(baseSelect.value);ctx.fillRect(22,12,256,420);
    ctx.save();ctx.translate(22,12);ctx.scale(256/300,420/450);
    bannerLayers.forEach(layer=>drawPattern(layer.pattern,layer.color));
    ctx.restore();
    ctx.fillStyle="#ffffff20";ctx.fillRect(22,12,256,5);ctx.fillStyle="#00000020";ctx.fillRect(22,427,256,5);
  }
  function renderPatternList(){
    const list=$("patternList");list.replaceChildren();
    if(!bannerLayers.length){const p=document.createElement("p");p.className="mc-empty";p.textContent="Добавь первый узор.";list.appendChild(p);return;}
    bannerLayers.forEach((layer,index)=>{
      const p=patterns.find(item=>item[1]===layer.pattern),c=colors.find(item=>item[1]===layer.color);
      const row=document.createElement("div");row.className="mc-list-row";
      const label=document.createElement("span");label.textContent=(index+1)+". "+(p?p[0]:layer.pattern)+" · "+(c?c[0]:layer.color);
      const remove=document.createElement("button");remove.type="button";remove.className="mc-remove";remove.textContent="×";remove.setAttribute("aria-label","Удалить слой "+(index+1));
      remove.addEventListener("click",()=>{bannerLayers.splice(index,1);renderPatternList();renderBanner();});
      row.append(label,remove);list.appendChild(row);
    });
  }
  $("addPattern").addEventListener("click",()=>{
    if(bannerLayers.length>=6){alert("Можно добавить не более 6 слоёв — это ограничение баннера Minecraft.");return;}
    bannerLayers.push({pattern:patternSelect.value,color:colorSelect.value});renderPatternList();renderBanner();
  });
  $("clearPatterns").addEventListener("click",()=>{bannerLayers=[];renderPatternList();renderBanner();});
  baseSelect.addEventListener("change",renderBanner);
  $("downloadBanner").addEventListener("click",()=>{
    const link=document.createElement("a");link.download="rqjey-minecraft-banner.png";link.href=canvas.toDataURL("image/png");link.click();
  });
  $("copyBannerCommand").addEventListener("click",async()=>{
    const base=baseSelect.value;
    const entries=bannerLayers.map(layer=>'{pattern:"minecraft:'+layer.pattern+'",color:"'+layer.color+'"}');
    const component=entries.length?'[minecraft:banner_patterns=['+entries.join(",")+']]':'';
    const command='/give @p minecraft:'+base+'_banner'+component+' 1';
    try{await navigator.clipboard.writeText(command);$("copyBannerCommand").textContent="Команда скопирована ✓";}
    catch(error){$("copyBannerCommand").textContent="Не удалось скопировать";}
  });
  renderBanner();
})();