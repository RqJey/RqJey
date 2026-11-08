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

})();
