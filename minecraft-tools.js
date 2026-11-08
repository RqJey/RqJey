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

  // Banner editor: render on the same 20x40 pixel grid used by vanilla banner pattern textures.
  const colors = [
    ["Белый","white","#f0f0f0"],["Оранжевый","orange","#d87f33"],["Пурпурный","magenta","#b24cd8"],["Светло-синий","light_blue","#6699d8"],
    ["Жёлтый","yellow","#e5d44b"],["Лаймовый","lime","#7fcc3a"],["Розовый","pink","#d88198"],["Серый","gray","#474f52"],
    ["Светло-серый","light_gray","#9d9d97"],["Бирюзовый","cyan","#158991"],["Фиолетовый","purple","#792aad"],["Синий","blue","#35399d"],
    ["Коричневый","brown","#724728"],["Зелёный","green","#546d1b"],["Красный","red","#a12722"],["Чёрный","black","#1d1d21"]
  ];
  const patterns = [
    ["Нижний левый квадрат","square_bottom_left"],["Нижний правый квадрат","square_bottom_right"],["Верхний левый квадрат","square_top_left"],["Верхний правый квадрат","square_top_right"],
    ["Нижняя полоса","stripe_bottom"],["Верхняя полоса","stripe_top"],["Левая полоса","stripe_left"],["Правая полоса","stripe_right"],
    ["Вертикальная полоса","stripe_center"],["Горизонтальная полоса","stripe_middle"],["Правая диагональ","stripe_downright"],["Левая диагональ","stripe_downleft"],
    ["Тонкие полосы","small_stripes"],["Крест","cross"],["Диагональный крест","straight_cross"],
    ["Треугольник снизу","triangle_bottom"],["Треугольник сверху","triangle_top"],["Малые треугольники снизу","triangles_bottom"],["Малые треугольники сверху","triangles_top"],
    ["Диагональ слева","diagonal_left"],["Диагональ справа","diagonal_right"],["Обратная диагональ слева","diagonal_up_left"],["Обратная диагональ справа","diagonal_up_right"],
    ["Круг","circle"],["Ромб","rhombus"],["Левая половина","half_vertical"],["Правая половина","half_vertical_right"],
    ["Верхняя половина","half_horizontal"],["Нижняя половина","half_horizontal_bottom"],["Рамка","border"],["Фигурная рамка","curly_border"],
    ["Градиент","gradient"],["Градиент снизу","gradient_up"],["Кирпичи","bricks"],["Крипер","creeper"],["Череп","skull"],
    ["Цветок","flower"],["Глобус","globe"],["Пиглин","piglin"],["Логотип Mojang","mojang"],["Поток","flow"],["Вихрь","guster"]
  ];
  const baseSelect=$("bannerBase"), patternSelect=$("bannerPattern"), colorSelect=$("bannerColor");
  colors.forEach(c=>{const o=document.createElement("option");o.value=c[1];o.textContent=c[0];baseSelect.appendChild(o);});
  colors.forEach(c=>{const o=document.createElement("option");o.value=c[1];o.textContent=c[0];colorSelect.appendChild(o);});
  patterns.forEach(p=>{const o=document.createElement("option");o.value=p[1];o.textContent=p[0];patternSelect.appendChild(o);});
  baseSelect.value="white"; colorSelect.value="black";
  let bannerLayers=[];
  const canvas=$("bannerCanvas"),ctx=canvas.getContext("2d");
  const W=20,H=40,S=10;
  canvas.width=W*S;canvas.height=H*S;
  function colorHex(name){return (colors.find(c=>c[1]===name)||colors[0])[2];}
  function rect(x,y,w,h){ctx.fillRect(x,y,w,h);}
  function polygon(points){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);points.slice(1).forEach(p=>ctx.lineTo(p[0],p[1]));ctx.closePath();ctx.fill();}
  function bitmap(rows){rows.forEach((row,y)=>{for(let x=0;x<row.length;x++)if(row[x]==="1")rect(x,y,1,1);});}
  const emblems={
    creeper:["00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000111111111100000","00000111111111100000","00000110000001100000","00000110000001100000","00000110000001100000","00000111111111100000","00000111111111100000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000000000000000","00000000000000000000"],
    skull:["00000000000000000000","00000000111100000000","00000011111111000000","00000111111111100000","00001111111111110000","00011111111111111000","00011111111111111000","00111111111111111100","00111111111111111100","00111100111100111100","00111100111100111100","00111100111100111100","00111111111111111100","00111111111111111100","00011111111111111000","00011111111111111000","00000111111111100000","00000011111111000000","00000001111110000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000"],
    flower:["00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000011000000000","00000000111100000000","00000001111110000000","00000000111100000000","00000000011000000000","00000110011000110000","00001111111111111000","00000111111111110000","00000001111111000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000011000000000","00000000011000000000","00000000011000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000"],
    piglin:["00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000111111111100000","00001111111111110000","00011111111111111000","00111111111111111100","00111111111111111100","00111100111100111100","00111100111100111100","00111111111111111100","00111111111111111100","00011111111111111000","00001111111111110000","00000111111111100000","00000011111111000000","00000001111110000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000111100000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000","00000000000000000000"]
  };
  function drawPattern(type){
    ctx.strokeStyle=ctx.fillStyle;
    switch(type){
      case "square_bottom_left":rect(0,20,10,20);break;case "square_bottom_right":rect(10,20,10,20);break;
      case "square_top_left":rect(0,0,10,20);break;case "square_top_right":rect(10,0,10,20);break;
      case "stripe_bottom":rect(0,30,20,10);break;case "stripe_top":rect(0,0,20,10);break;
      case "stripe_left":rect(0,0,5,40);break;case "stripe_right":rect(15,0,5,40);break;
      case "stripe_center":rect(8,0,4,40);break;case "stripe_middle":rect(0,18,20,4);break;
      case "stripe_downright":polygon([[0,0],[5,0],[20,35],[20,40],[15,40],[0,5]]);break;
      case "stripe_downleft":polygon([[15,0],[20,0],[5,40],[0,40]]);break;
      case "small_stripes":for(let x=0;x<20;x+=3)rect(x,0,1,40);break;
      case "cross":rect(0,18,20,4);rect(8,0,4,40);break;
      case "straight_cross":ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(20,40);ctx.moveTo(20,0);ctx.lineTo(0,40);ctx.stroke();break;
      case "triangle_bottom":polygon([[0,40],[10,28],[20,40]]);break;case "triangle_top":polygon([[0,0],[10,12],[20,0]]);break;
      case "triangles_bottom":polygon([[0,40],[0,34],[5,40]]);polygon([[7,40],[10,34],[13,40]]);polygon([[15,40],[20,34],[20,40]]);break;
      case "triangles_top":polygon([[0,0],[0,6],[5,0]]);polygon([[7,0],[10,6],[13,0]]);polygon([[15,0],[20,6],[20,0]]);break;
      case "diagonal_left":polygon([[0,0],[20,0],[0,20]]);break;case "diagonal_right":polygon([[0,0],[20,0],[20,20]]);break;
      case "diagonal_up_left":polygon([[0,20],[20,40],[0,40]]);break;case "diagonal_up_right":polygon([[20,20],[20,40],[0,40]]);break;
      case "circle":ctx.beginPath();ctx.ellipse(10,20,6,8,0,0,Math.PI*2);ctx.fill();break;
      case "rhombus":polygon([[10,7],[18,20],[10,33],[2,20]]);break;
      case "half_vertical":rect(0,0,10,40);break;case "half_vertical_right":rect(10,0,10,40);break;
      case "half_horizontal":rect(0,0,20,20);break;case "half_horizontal_bottom":rect(0,20,20,20);break;
      case "border":rect(0,0,20,3);rect(0,37,20,3);rect(0,0,3,40);rect(17,0,3,40);break;
      case "curly_border":rect(0,0,20,2);rect(0,38,20,2);rect(0,0,2,40);rect(18,0,2,40);rect(3,3,2,2);rect(15,3,2,2);rect(3,35,2,2);rect(15,35,2,2);break;
      case "gradient":for(let y=0;y<40;y++) {ctx.globalAlpha=(y+1)/40;rect(0,y,20,1);}ctx.globalAlpha=1;break;
      case "gradient_up":for(let y=0;y<40;y++){ctx.globalAlpha=1-(y/40);rect(0,y,20,1);}ctx.globalAlpha=1;break;
      case "bricks":for(let y=0;y<40;y+=5){rect(0,y,20,1);for(let x=(y%10===0?0:5);x<20;x+=10)rect(x,y,1,5);}break;
      case "mojang":rect(4,10,12,20);rect(6,7,8,3);rect(7,13,2,2);rect(11,13,2,2);rect(8,21,4,2);break;
      case "flow":case "guster":for(let y=0;y<40;y+=4){const x=type==="flow"?Math.round(7+4*Math.sin(y/5)):Math.round(3+13*(y/40));rect(x,y,3,4);if(type==="guster")rect(17-x,y,2,4);}break;
      default:if(emblems[type])bitmap(emblems[type]);
    }
  }
  function renderBanner(){
    const base=colorHex(baseSelect.value);ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#171923";ctx.fillRect(0,0,canvas.width,canvas.height);
    // The banner cloth uses a 20x40 texture grid and the familiar notched lower edge.
    ctx.save();ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(20,0);ctx.lineTo(20,37);ctx.lineTo(10,40);ctx.lineTo(0,37);ctx.closePath();ctx.clip();
    ctx.fillStyle=base;ctx.fillRect(0,0,20,40);
    bannerLayers.forEach(layer=>{ctx.save();ctx.fillStyle=colorHex(layer.color);drawPattern(layer.pattern);ctx.restore();});
    ctx.restore();
    ctx.fillStyle="#ffffff18";ctx.fillRect(0,0,20,1);ctx.fillStyle="#00000020";ctx.fillRect(0,37,20,1);
  }
  function renderPatternList(){
    const list=$("patternList");list.replaceChildren();
    if(!bannerLayers.length){const p=document.createElement("p");p.className="mc-empty";p.textContent="Добавь первый узор.";list.appendChild(p);return;}
    bannerLayers.forEach((layer,index)=>{
      const p=patterns.find(item=>item[1]===layer.pattern),c=colors.find(item=>item[1]===layer.color);
      const row=document.createElement("div");row.className="mc-list-row mc-banner-layer-row";
      const label=document.createElement("span");label.textContent=(index+1)+". "+(p?p[0]:layer.pattern)+" · "+(c?c[0]:layer.color);
      const actions=document.createElement("span");actions.className="mc-layer-actions";
      const up=document.createElement("button");up.type="button";up.className="mc-layer-move";up.textContent="↑";up.disabled=index===0;up.setAttribute("aria-label","Переместить слой выше");
      up.addEventListener("click",()=>{[bannerLayers[index-1],bannerLayers[index]]=[bannerLayers[index],bannerLayers[index-1]];renderPatternList();renderBanner();});
      const down=document.createElement("button");down.type="button";down.className="mc-layer-move";down.textContent="↓";down.disabled=index===bannerLayers.length-1;down.setAttribute("aria-label","Переместить слой ниже");
      down.addEventListener("click",()=>{[bannerLayers[index+1],bannerLayers[index]]=[bannerLayers[index],bannerLayers[index+1]];renderPatternList();renderBanner();});
      const remove=document.createElement("button");remove.type="button";remove.className="mc-remove";remove.textContent="×";remove.setAttribute("aria-label","Удалить слой "+(index+1));
      remove.addEventListener("click",()=>{bannerLayers.splice(index,1);renderPatternList();renderBanner();});
      actions.append(up,down,remove);row.append(label,actions);list.appendChild(row);
    });
  }
  $("addPattern").addEventListener("click",()=>{
    if(bannerLayers.length>=6){alert("В Minecraft на одном баннере может быть не более 6 узоров.");return;}
    bannerLayers.push({pattern:patternSelect.value,color:colorSelect.value});renderPatternList();renderBanner();
  });
  $("clearPatterns").addEventListener("click",()=>{bannerLayers=[];renderPatternList();renderBanner();});
  baseSelect.addEventListener("change",renderBanner);
  $("downloadBanner").addEventListener("click",()=>{
    const link=document.createElement("a");link.download="rqjey-minecraft-banner.png";link.href=canvas.toDataURL("image/png");link.click();
  });
  $("copyBannerCommand").addEventListener("click",async()=>{
    const entries=bannerLayers.map(layer=>'{pattern:"minecraft:'+layer.pattern+'",color:"'+layer.color+'"}');
    const component=entries.length?'[minecraft:banner_patterns=['+entries.join(",")+']]':'';
    const command='/give @p minecraft:'+baseSelect.value+'_banner'+component+' 1';
    try{await navigator.clipboard.writeText(command);$("copyBannerCommand").textContent="Команда скопирована ✓";}
    catch(error){$("copyBannerCommand").textContent="Не удалось скопировать";}
  });
  renderBanner();
})();
