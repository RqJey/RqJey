(() => {
  const $ = id => document.getElementById(id);
  const tabs=[...document.querySelectorAll("[data-tool-tab]")],panels=[...document.querySelectorAll("[data-tool-panel]")];
  function showTool(name,hash){if(!panels.some(p=>p.dataset.toolPanel===name))name="enchantments";tabs.forEach(t=>t.setAttribute("aria-selected",String(t.dataset.toolTab===name)));panels.forEach(p=>p.hidden=p.dataset.toolPanel!==name);if(hash)history.replaceState(null,"","#"+name);}
  tabs.forEach(t=>t.addEventListener("click",()=>showTool(t.dataset.toolTab,true)));showTool(location.hash.slice(1),false);
  const E=[
    ["Защита","protection",4,1,["helmet","turtle_helmet","chestplate","leggings","boots"]],["Огнеупорность","fire_protection",4,2,["helmet","turtle_helmet","chestplate","leggings","boots"]],["Взрывоустойчивость","blast_protection",4,2,["helmet","turtle_helmet","chestplate","leggings","boots"]],["Защита от снарядов","projectile_protection",4,2,["helmet","turtle_helmet","chestplate","leggings","boots"]],
    ["Шипы","thorns",3,4,["helmet","turtle_helmet","chestplate","leggings","boots"]],["Подводное дыхание","respiration",3,2,["helmet","turtle_helmet"]],["Подводник","aqua_affinity",1,2,["helmet","turtle_helmet"]],["Подводная ходьба","depth_strider",3,4,["boots"]],["Ледоход","frost_walker",2,4,["boots"]],["Скорость души","soul_speed",3,4,["boots"]],["Бесшумное передвижение","swift_sneak",3,4,["leggings"]],
    ["Острота","sharpness",5,1,["sword","axe"]],["Небесная кара","smite",5,2,["sword","axe"]],["Бич членистоногих","bane_of_arthropods",5,2,["sword","axe"]],["Отбрасывание","knockback",2,2,["sword"]],["Заговор огня","fire_aspect",2,4,["sword"]],["Мародёрство","looting",3,4,["sword"]],["Разящий клинок","sweeping_edge",3,2,["sword"]],
    ["Эффективность","efficiency",5,1,["pickaxe","axe","shovel","hoe","shears"]],["Шёлковое касание","silk_touch",1,4,["pickaxe","axe","shovel","hoe"]],["Удача","fortune",3,2,["pickaxe","shovel","axe","hoe"]],
    ["Сила","power",5,1,["bow"]],["Откидывание","punch",2,2,["bow"]],["Воспламенение","flame",1,2,["bow"]],["Бесконечность","infinity",1,4,["bow"]],
    ["Морская удача","luck_of_the_sea",3,2,["fishing_rod"]],["Приманка","lure",3,2,["fishing_rod"]],["Верность","loyalty",3,1,["trident"]],["Пронзатель","impaling",5,2,["trident"]],["Тягун","riptide",3,2,["trident"]],["Громовержец","channeling",1,4,["trident"]],
    ["Мультивыстрел","multishot",1,2,["crossbow"]],["Пронзающая стрела","piercing",4,1,["crossbow"]],["Быстрая перезарядка","quick_charge",3,1,["crossbow"]],
    ["Плотность","density",5,2,["mace"]],["Пробитие","breach",4,4,["mace"]],["Порыв ветра","wind_burst",3,4,["mace"]],
    ["Прочность","unbreaking",3,1,["helmet","turtle_helmet","chestplate","leggings","boots","elytra","sword","axe","pickaxe","shovel","hoe","bow","crossbow","trident","fishing_rod","mace","shield","shears","flint_and_steel"]],
    ["Починка","mending",1,2,["helmet","turtle_helmet","chestplate","leggings","boots","elytra","sword","axe","pickaxe","shovel","hoe","bow","crossbow","trident","fishing_rod","mace","shield","shears","flint_and_steel"]],
    ["Проклятие утраты","vanishing_curse",1,4,["helmet","turtle_helmet","chestplate","leggings","boots","elytra","sword","axe","pickaxe","shovel","hoe","bow","crossbow","trident","fishing_rod","mace","shield","shears","flint_and_steel"]],
    ["Проклятие несъёмности","binding_curse",1,4,["helmet","turtle_helmet","chestplate","leggings","boots","elytra"]],
    ["Удача моря","luck_of_the_sea",3,2,["fishing_rod"]]
  ];
  const conflicts=[["protection","fire_protection","blast_protection","projectile_protection"],["sharpness","smite","bane_of_arthropods"],["depth_strider","frost_walker"],["silk_touch","fortune"],["infinity","mending"],["multishot","piercing"],["loyalty","riptide"]];
  const item=$("enchantItem"), choices=$("enchantChoices"), existingBox=$("existingEnchantChoices"), booksBox=$("selectedBooks");
  let books=new Map(),existing=new Set();
  const label=id=>E.find(e=>e[1]===id)?.[0]||id, data=id=>E.find(e=>e[1]===id);
  const maxPenalty=n=>Math.pow(2,n)-1;
  const incompatible=(id,set)=>conflicts.some(g=>g.includes(id)&&g.some(x=>x!==id&&set.has(x)));
  const allowed=()=>E.filter(e=>e[4].includes(item.value));
  function renderExisting(){
    existingBox.replaceChildren();
    allowed().forEach(e=>{const l=document.createElement("label");l.className="mc-existing-option";const c=document.createElement("input");c.type="checkbox";c.checked=existing.has(e[1]);c.addEventListener("change",()=>{c.checked?existing.add(e[1]):existing.delete(e[1]);renderBooks();renderChoices();calculate();});l.append(c,document.createTextNode(e[0]));existingBox.append(l);});
  }
  function renderChoices(){
    choices.replaceChildren();const current=new Set([...existing,...books.keys()]);
    allowed().forEach(e=>{const [name,id,max,cost]=e;const b=document.createElement("button");b.type="button";b.className="mc-enchant-pick";b.disabled=existing.has(id)||books.has(id);b.innerHTML='<span class="mc-pick-plus">＋</span><span class="mc-pick-name"></span><small>Макс. '+max+'</small>';b.querySelector(".mc-pick-name").textContent=name;b.addEventListener("click",()=>{books.set(id,max);renderAll();});if(incompatible(id,current)){b.classList.add("is-conflict");b.title="Конфликтует с уже выбранным зачарованием";}choices.append(b);});
    $("enchantCount").textContent="Выбрано книг: "+books.size;
  }
  function renderBooks(){
    booksBox.replaceChildren();if(!books.size){const p=document.createElement("p");p.className="mc-empty";p.textContent="Пока нет книг. Выбери зачарования выше.";booksBox.append(p);return;}
    books.forEach((level,id)=>{const e=data(id),row=document.createElement("div");row.className="mc-selected-book";const name=document.createElement("strong");name.textContent=e[0];const select=document.createElement("select");select.setAttribute("aria-label","Уровень "+e[0]);for(let n=1;n<=e[2];n++){const o=document.createElement("option");o.value=n;o.textContent="Уровень "+n+" · "+(n*e[3])+" ур.";o.selected=n===level;select.append(o);}select.addEventListener("change",()=>{books.set(id,Number(select.value));calculate();});const remove=document.createElement("button");remove.type="button";remove.className="mc-remove-book";remove.textContent="×";remove.setAttribute("aria-label","Удалить "+e[0]);remove.addEventListener("click",()=>{books.delete(id);renderAll();});row.append(name,select,remove);booksBox.append(row);});
  }
  function renderAll(){renderChoices();renderBooks();calculate();}
  function node(ids,penalty=0){return {ids:[...ids].sort(),penalty};}
  function nodeKey(n){return n.ids.join(",")+"@"+n.penalty;}
  function enchCost(ids){return ids.reduce((s,id)=>s+data(id)[2] /* placeholder */,0);}
  function bookCost(ids){return ids.reduce((s,id)=>{const e=data(id);return s+e[2] /* replaced by chosen level below */;},0);}
  function optimize(){
    const selected=[...books.entries()].map(([id,level])=>({id,level}));
    const byId=new Map(selected.map(x=>[x.id,x.level]));
    const costOf=ids=>ids.reduce((s,id)=>{const e=data(id);return s+e[3]*byId.get(id);},0);
    const initialPenalty=maxPenalty(Number($("targetWork").value));
    const memo=new Map();let states=0;
    function solve(targetIds,targetPenalty,rawBooks){
      if(!rawBooks.length)return {cost:0,steps:[],targetPenalty,targetIds};
      const bs=rawBooks.slice().sort((a,b)=>nodeKey(a).localeCompare(nodeKey(b)));
      const key=targetIds.slice().sort().join(",")+"#"+targetPenalty+"#"+bs.map(nodeKey).join("|");
      if(memo.has(key))return memo.get(key);
      if(++states>45000) return null;
      let best=null;
      const consider=(step,nextTarget,nextPenalty,nextBooks)=>{
        const tail=solve(nextTarget,nextPenalty,nextBooks);if(!tail)return;
        const total=step.cost+tail.cost;
        if(!best||total<best.cost||(total===best.cost&&step.cost<best.steps[0].cost))best={cost:total,steps:[step,...tail.steps],targetPenalty:tail.targetPenalty,targetIds:tail.targetIds};
      };
      for(let i=0;i<bs.length;i++){
        const book=bs[i],cost=targetPenalty+book.penalty+costOf(book.ids);
        const step={kind:"apply",left:targetIds.slice(),right:book.ids.slice(),result:[...new Set([...targetIds,...book.ids])].sort(),cost,penalty:2*Math.max(targetPenalty,book.penalty)+1};
        consider(step,step.result,step.penalty,bs.filter((_,j)=>j!==i));
      }
      for(let i=0;i<bs.length;i++)for(let j=0;j<bs.length;j++)if(i!==j){
        const a=bs[i],b=bs[j],merged=[...new Set([...a.ids,...b.ids])].sort();
        const cost=a.penalty+b.penalty+costOf(b.ids),penalty=2*Math.max(a.penalty,b.penalty)+1;
        const step={kind:"merge",left:a.ids.slice(),right:b.ids.slice(),result:merged,cost,penalty};
        consider(step,targetIds,targetPenalty,bs.filter((_,k)=>k!==i&&k!==j).concat(node(merged,penalty)));
      }
      memo.set(key,best);return best;
    }
    const initialBooks=selected.map(x=>node([x.id],0));
    const result=solve([...existing],initialPenalty,initialBooks);
    return {result,states,initialPenalty};
  }
  function calculate(){
    if(!books.size){$("enchantResult").innerHTML='<span class="mc-result-label">ПЛАН НАКОВАЛЬНИ</span><strong>Добавь книги для расчёта</strong><p>Выбери зачарования — здесь появится самый дешёвый порядок операций.</p>';$("anvilTree").replaceChildren();$("anvilSteps").replaceChildren();return;}
    const invalid=conflicts.some(g=>g.filter(id=>existing.has(id)||books.has(id)).length>1);
    if(invalid){$("enchantResult").innerHTML='<span class="mc-result-label">НЕСОВМЕСТИМЫЕ ЧАРЫ</span><strong>Нельзя применить выбранный набор</strong><p>Убери конфликтующие зачарования или отметь только те, что уже есть на предмете.</p>';$("anvilTree").replaceChildren();$("anvilSteps").replaceChildren();return;}
    if(books.size>9){$("enchantResult").innerHTML='<span class="mc-result-label">СЛИШКОМ МНОГО КНИГ</span><strong>Выбери не более 9 книг за раз</strong><p>Это ограничение нужно для быстрого точного перебора вариантов.</p>';$("anvilTree").replaceChildren();$("anvilSteps").replaceChildren();return;}
    const {result,states}=optimize();
    if(!result){$("enchantResult").innerHTML='<span class="mc-result-label">РАСЧЁТ НЕ ЗАВЕРШЁН</span><strong>Слишком много вариантов</strong><p>Попробуй убрать одну книгу или разделить сборку на части.</p>';return;}
    const maxStep=Math.max(...result.steps.map(s=>s.cost)),over=result.steps.some(s=>s.cost>=40),normal=result.steps.reduce((s,x)=>s+x.cost,0);
    $("enchantResult").innerHTML='<span class="mc-result-label">ИТОГОВАЯ СТОИМОСТЬ</span><strong>'+result.cost+' уровней опыта</strong><p>'+result.steps.length+' операций · самая дорогая: '+maxStep+' / 39 · штраф предмета после плана: '+result.targetPenalty+'</p><p class="'+(over?"mc-danger":"mc-success")+'">'+(over?"Внимание: одна или несколько операций стоят 40+ уровней — в обычном выживании они недоступны.":"Все операции укладываются в лимит наковальни.")+' · Проверено вариантов: '+states+'</p>';
    const tree=$("anvilTree");tree.replaceChildren();const treeTitle=document.createElement("div");treeTitle.className="mc-tree-title";treeTitle.textContent="Дерево объединений";tree.append(treeTitle);
    result.steps.forEach((s,i)=>{const row=document.createElement("div");row.className="mc-tree-row";const num=document.createElement("span");num.className="mc-tree-number";num.textContent=String(i+1);const desc=document.createElement("div");desc.className="mc-tree-desc";desc.innerHTML='<strong></strong><small></small>';desc.querySelector("strong").textContent=s.kind==="merge"?"Объединить книги":"Наложить книгу на предмет";desc.querySelector("small").textContent=(s.kind==="merge"?s.left.map(label).join(" + ")+" → "+s.result.map(label).join(", "):"Предмет + "+s.right.map(label).join(", ")+" → "+s.result.map(label).join(", "));const price=document.createElement("b");price.textContent="+"+s.cost+" ур.";if(s.cost>=40)price.classList.add("mc-danger");row.append(num,desc,price);tree.append(row);});
    const steps=$("anvilSteps");steps.replaceChildren();const h=document.createElement("div");h.className="mc-steps-title";h.textContent="Пошаговый порядок";steps.append(h);
    result.steps.forEach((s,i)=>{const card=document.createElement("article");card.className="mc-operation-card";const head=document.createElement("div");head.className="mc-operation-head";const title=document.createElement("strong");title.textContent=(i+1)+". "+(s.kind==="merge"?"Объединить две книги":"Перенести книгу на предмет");const cost=document.createElement("b");cost.textContent=s.cost+" уровней";if(s.cost>=40)cost.classList.add("mc-danger");head.append(title,cost);const detail=document.createElement("p");detail.textContent=(s.kind==="merge"?"Слева: "+s.left.map(label).join(", ")+" · Справа: "+s.right.map(label).join(", "):"Книга: "+s.right.map(label).join(", "))+" · Штраф после операции: "+s.penalty;card.append(head,detail);steps.append(card);});
  }
  item.addEventListener("change",()=>{books.clear();existing.clear();renderAll();renderExisting();});
  $("targetWork").addEventListener("change",calculate);
  $("clearEnchants").addEventListener("click",()=>{books.clear();renderAll();});
  $("resetAnvil").addEventListener("click",()=>{books.clear();existing.clear();$("targetWork").value="0";item.value="sword";renderExisting();renderAll();});
  // Portal coordinate calculator.
  $("calculatePortal").addEventListener("click",()=>{const x=Number($("portalX").value),z=Number($("portalZ").value),y=$("portalY").value.trim(),out=$("portalResult");if(!$("portalX").value.trim()||!$("portalZ").value.trim()||!Number.isFinite(x)||!Number.isFinite(z)){out.innerHTML='<span class="mc-result-label">ОШИБКА ВВОДА</span><strong>Введи корректные координаты X и Z</strong>';return;}const scale=$("portalDirection").value==="overworld"?1/8:8,tx=x*scale,tz=z*scale,target=scale===.125?"Незер":"Верхний мир",fmt=n=>Number(n.toFixed(2)).toLocaleString("ru-RU");out.innerHTML='<span class="mc-result-label">КООРДИНАТЫ В '+target.toUpperCase()+'</span><strong>X: '+fmt(tx)+' · Z: '+fmt(tz)+'</strong><p>Ближайшие целые координаты: X '+Math.round(tx)+' · Z '+Math.round(tz)+(y&&Number.isFinite(Number(y))?' · Y '+Number(y):'')+'</p>';});
  renderExisting();renderAll();
})();