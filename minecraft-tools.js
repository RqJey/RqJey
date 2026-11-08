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
    ["Защита","protection",4,1,["helmet","turtle_helmet","chestplate","leggings","boots"]],
    ["Огнеупорность","fire_protection",4,2,["helmet","turtle_helmet","chestplate","leggings","boots"]],
    ["Взрывоустойчивость","blast_protection",4,2,["helmet","turtle_helmet","chestplate","leggings","boots"]],
    ["Защита от снарядов","projectile_protection",4,2,["helmet","turtle_helmet","chestplate","leggings","boots"]],
    ["Шипы","thorns",3,4,["chestplate","helmet","turtle_helmet","leggings","boots"]],
    ["Подводное дыхание","respiration",3,2,["helmet","turtle_helmet"]],
    ["Подводник","aqua_affinity",1,2,["helmet","turtle_helmet"]],
    ["Подводная ходьба","depth_strider",3,4,["boots"]],
    ["Ледоход","frost_walker",2,4,["boots"]],
    ["Скорость души","soul_speed",3,4,["boots"]],
    ["Бесшумное передвижение","swift_sneak",3,4,["leggings"]],
    ["Острота","sharpness",5,1,["sword","axe"]],
    ["Небесная кара","smite",5,2,["sword","axe"]],
    ["Бич членистоногих","bane_of_arthropods",5,2,["sword","axe"]],
    ["Отбрасывание","knockback",2,2,["sword"]],
    ["Заговор огня","fire_aspect",2,4,["sword"]],
    ["Мародёрство","looting",3,4,["sword"]],
    ["Разящий клинок","sweeping_edge",3,2,["sword"]],
    ["Эффективность","efficiency",5,1,["pickaxe","axe","shovel","hoe","shears"]],
    ["Шёлковое касание","silk_touch",1,4,["pickaxe","axe","shovel","hoe"]],
    ["Прочность","unbreaking",3,1,["helmet","turtle_helmet","chestplate","leggings","boots","elytra","sword","axe","pickaxe","shovel","hoe","bow","crossbow","trident","fishing_rod","mace","shield","shears","flint_and_steel"]],
    ["Удача","fortune",3,2,["pickaxe","shovel","axe","hoe"]],
    ["Сила","power",5,1,["bow"]],
    ["Откидывание","punch",2,2,["bow"]],
    ["Воспламенение","flame",1,2,["bow"]],
    ["Бесконечность","infinity",1,4,["bow"]],
    ["Морская удача","luck_of_the_sea",3,2,["fishing_rod"]],
    ["Приманка","lure",3,2,["fishing_rod"]],
    ["Верность","loyalty",3,1,["trident"]],
    ["Пронзатель","impaling",5,2,["trident"]],
    ["Тягун","riptide",3,2,["trident"]],
    ["Громовержец","channeling",1,4,["trident"]],
    ["Мультивыстрел","multishot",1,2,["crossbow"]],
    ["Пронзающая стрела","piercing",4,1,["crossbow"]],
    ["Быстрая перезарядка","quick_charge",3,1,["crossbow"]],
    ["Починка","mending",1,4,["helmet","turtle_helmet","chestplate","leggings","boots","elytra","sword","axe","pickaxe","shovel","hoe","bow","crossbow","trident","fishing_rod","mace","shield","shears","flint_and_steel"]],
    ["Проклятие утраты","vanishing_curse",1,4,["helmet","turtle_helmet","chestplate","leggings","boots","elytra","sword","axe","pickaxe","shovel","hoe","bow","crossbow","trident","fishing_rod","mace","shield","shears","flint_and_steel"]],
    ["Проклятие несъёмности","binding_curse",1,4,["helmet","turtle_helmet","chestplate","leggings","boots","elytra"]],
    ["Плотность","density",5,2,["mace"]],
    ["Пробитие","breach",4,4,["mace"]],
    ["Порыв ветра","wind_burst",3,4,["mace"]]
  ];
  const enchantItem=$("enchantItem"), choices=$("enchantChoices");
  const incompatible=[
    ["protection","fire_protection","blast_protection","projectile_protection"],
    ["sharpness","smite","bane_of_arthropods"],
    ["depth_strider","frost_walker"],
    ["silk_touch","fortune"],
    ["infinity","mending"],
    ["multishot","piercing"],
    ["loyalty","riptide"]
  ];
  function isIncompatible(id,selectedId) {
    return incompatible.some(group=>group.includes(id)&&group.includes(selectedId));
  }
  function renderEnchantChoices() {
    choices.replaceChildren();
    const available=enchantments.filter(item=>item[4].includes(enchantItem.value));
    available.forEach(item=>{
      const id=item[1], checked=selectedEnchants.has(id);
      const row=document.createElement("label"); row.className="mc-enchant-option";
      const checkbox=document.createElement("input"); checkbox.type="checkbox"; checkbox.checked=checked;
      checkbox.addEventListener("change",()=>{
        if(checkbox.checked) selectedEnchants.add(id); else selectedEnchants.delete(id);
        renderEnchantChoices(); updateEnchantCost();
      });
      const name=document.createElement("span"); name.className="mc-enchant-name"; name.textContent=item[0];
      const level=document.createElement("span"); level.className="mc-enchant-level"; level.textContent="Уровень "+item[2];
      const price=document.createElement("span"); price.className="mc-enchant-price"; price.textContent=(item[2]*item[3])+" ур.";
      const conflict=[...selectedEnchants].some(selectedId=>selectedId!==id&&isIncompatible(id,selectedId));
      if(conflict){row.classList.add("is-conflict");price.textContent="Несовместимо";}
      row.append(checkbox,name,level,price); choices.appendChild(row);
    });
    $("enchantCount").textContent="Выбрано: "+selectedEnchants.size;
  }
  let selectedEnchants=new Set();
  function updateEnchantCost() {
    const selected=enchantments.filter(item=>selectedEnchants.has(item[1])&&item[4].includes(enchantItem.value));
    const enchantCost=selected.reduce((sum,item)=>sum+item[2]*item[3],0);
    const workPenalty=Math.pow(2,Number($("targetWork").value))-1;
    const total=enchantCost+workPenalty;
    $("enchantCost").textContent=total+" "+(total===1?"уровень":"уровней");
    const conflicts=incompatible.some(group=>group.filter(id=>selectedEnchants.has(id)).length>1);
    let details="Зачарования: "+enchantCost+" · Предыдущие работы: "+workPenalty;
    let status=total>=40?"Слишком дорого! В обычном выживании операция недоступна.":"Стоимость укладывается в лимит 39 уровней.";
    if(conflicts) status+=" Есть несовместимые зачарования — их нельзя применить вместе.";
    $("enchantResult").innerHTML='<span class="mc-result-label">СТОИМОСТЬ НА НАКОВАЛЬНЕ</span><strong>'+total+' уровней опыта</strong><p>'+details+'</p><p>'+status+'</p>';
    $("enchantCount").textContent="Выбрано: "+selected.length;
  }
  enchantItem.addEventListener("change",()=>{selectedEnchants.clear();renderEnchantChoices();updateEnchantCost();});
  $("targetWork").addEventListener("change",updateEnchantCost);
  $("clearEnchants").addEventListener("click",()=>{selectedEnchants.clear();renderEnchantChoices();updateEnchantCost();});
  renderEnchantChoices(); updateEnchantCost();

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
