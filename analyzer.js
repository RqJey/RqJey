(() => {
  const $ = id => document.getElementById(id);
  const fileInput = $("logFile"), dropZone = $("dropZone"), textInput = $("logText");
  const analyzeButton = $("analyzeButton"), fileName = $("fileName");
  let selectedFileName = "";
  let lastReport = "";

  const lang = () => document.documentElement.lang === "en" ? "en" : "ru";
  const t = (ru,en) => lang() === "en" ? en : ru;
  const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const setText = (id, value) => { $(id).textContent = value; };
  function updateButton(){ analyzeButton.disabled = !textInput.value.trim(); }
  async function readFile(file){
    if(!file) return;
    if(file.size > 8 * 1024 * 1024){ fileName.textContent=t("Файл больше 8 МБ — выбери меньший лог.","File is larger than 8 MB — choose a smaller log."); return; }
    try{
      textInput.value = await file.text();
      selectedFileName = file.name;
      fileName.textContent = file.name;
      updateButton();
    }catch(e){ fileName.textContent=t("Не удалось прочитать файл.","Could not read this file."); }
  }
  fileInput.addEventListener("change", () => readFile(fileInput.files[0]));
  ["dragenter","dragover"].forEach(name => dropZone.addEventListener(name, e => {e.preventDefault();dropZone.classList.add("drag-over");}));
  ["dragleave","drop"].forEach(name => dropZone.addEventListener(name, e => {e.preventDefault();dropZone.classList.remove("drag-over");}));
  dropZone.addEventListener("drop", e => { const file=e.dataTransfer.files[0]; if(file) readFile(file); });
  textInput.addEventListener("input", updateButton);

  function analyze(raw){
    const lines=raw.replace(/\r/g,"").split("\n");
    const lower=raw.toLowerCase();
    const errors=[];
    const add=(id,level,titleRu,titleEn,bodyRu,bodyEn,regex)=>{
      if(regex.test(raw) && !errors.some(e=>e.id===id)) errors.push({id,level,title:t(titleRu,titleEn),body:t(bodyRu,bodyEn)});
    };
    add("oom","error","Недостаточно памяти Java","Java ran out of memory","В логе найден OutOfMemoryError. Попробуй увеличить выделенную RAM, закрыть тяжёлые приложения и проверить, не вызывает ли утечку один из модов.","OutOfMemoryError was found. Try allocating more RAM, closing heavy apps, and checking whether a mod causes a memory leak.",/OutOfMemoryError|Java heap space|GC overhead limit exceeded/i);
    add("missing-class","error","Не найден класс или библиотека","Missing class or library","NoClassDefFoundError / ClassNotFoundException часто указывает на отсутствующую зависимость, неверную версию библиотеки или несовместимый мод.","NoClassDefFoundError / ClassNotFoundException often points to a missing dependency, wrong library version, or incompatible mod.",/NoClassDefFoundError|ClassNotFoundException/i);
    add("method","error","Несовместимые версии компонентов","Incompatible component versions","NoSuchMethodError / NoSuchFieldError обычно означает, что мод собран под другую версию Minecraft, загрузчика или библиотеки.","NoSuchMethodError / NoSuchFieldError usually means a mod targets a different Minecraft, loader, or library version.",/NoSuchMethodError|NoSuchFieldError|AbstractMethodError/i);
    add("mixin","error","Ошибка внедрения Mixin","Mixin injection failure","Не удалось применить Mixin. Частая причина — несовместимость модов или версии Minecraft. Проверь строки выше ошибки и обновления упомянутых модов.","A Mixin could not be applied. Common causes are mod conflicts or a Minecraft version mismatch. Check the lines above the failure and update the mentioned mods.",/Mixin apply failed|Critical injection failure|InjectionError|mixin.*failed/i);
    add("dependency","error","Проблема с зависимостью мода","Mod dependency problem","Загрузчик сообщает о недостающей или неподходящей зависимости. Найди указанный mod ID и установи совместимую версию библиотеки.","The loader reports a missing or incompatible dependency. Find the referenced mod ID and install a compatible library version.",/depends on|requires .* but|missing mandatory dependencies|depends.*which is missing|mod .* requires/i);
    add("unsupported-java","error","Неподходящая версия Java","Unsupported Java version","В логе есть ошибка версии байткода Java. Установи версию Java, требуемую твоей версией Minecraft и загрузчиком.","A Java bytecode version error was found. Install the Java version required by your Minecraft version and loader.",/UnsupportedClassVersionError|class file version .* only recognizes/i);
    add("graphics","warning","Возможная проблема графического драйвера","Possible graphics driver issue","Найден сбой OpenGL или создания графического контекста. Обнови драйвер видеокарты и проверь графические моды.","An OpenGL or graphics-context failure was found. Update your GPU driver and check graphics-related mods.",/GL_OUT_OF_MEMORY|OpenGL.*error|Failed to create.*(context|window)|Pixel format not accelerated/i);
    add("native","warning","Сбой нативной библиотеки","Native library failure","Ошибка загрузки нативной библиотеки может быть связана с драйверами, архитектурой Java или повреждёнными файлами игры.","A native-library load failure may be related to drivers, Java architecture, or corrupted game files.",/UnsatisfiedLinkError|Failed to load.*native|could not load.*\.dll/i);
    add("crash","warning","В логе зафиксировано завершение с ошибкой","Crash or error termination","Найдено сообщение о завершении работы с ошибкой. Оно подтверждает сбой, но само по себе не определяет виновника.","An error termination was found. This confirms a failure but does not identify its cause by itself.",/Process crashed with exit code|Exit Code: -1|The game crashed|Crash report saved/i);
    const mc=(raw.match(/Minecraft Version:\s*([^\r\n]+)|minecraft(?:Version)?[=: ]+v?([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i)||[]);
    const minecraft=mc[1]||mc[2]||"—";
    const loaderMatch=raw.match(/(Fabric Loader|Forge|NeoForge|Quilt)(?: version)?[ :v]+([0-9][\w.+-]*)/i);
    const loader=loaderMatch ? loaderMatch[1]+" "+loaderMatch[2] : (/fabric/i.test(lower)?"Fabric":/neoforge/i.test(lower)?"NeoForge":/forge/i.test(lower)?"Forge":"—");
    const javaMatch=raw.match(/Java Version:\s*([^\r\n]+)|java version ["']?([0-9][^"']*)/i);
    const java=javaMatch ? (javaMatch[1]||javaMatch[2]).trim() : "—";
    const modIds=[...new Set([...raw.matchAll(/\b([a-z][a-z0-9_.-]{2,})\b/g)].map(m=>m[1]).filter(s=>/(mod|fabric|forge|minecraft)/i.test(s)))].slice(0,8);
    const relevant=lines.map((line,i)=>({line,i})).filter(x=>/\b(error|exception|fatal|crash|failed|failure)\b|Caused by:/i.test(x.line)).slice(-12);
    const evidence=relevant.length?relevant.map(x=>x.line).join("\n"):lines.filter(x=>x.trim()).slice(-8).join("\n");
    return {minecraft,loader,java,errors,modIds,evidence,totalLines:lines.length};
  }
  function render(report){
    $("results").hidden=false;
    const hasErrors=report.errors.some(e=>e.level==="error");
    const title=report.errors.length?t("Обнаружены признаки проблемы","Potential issue detected"):t("Явная причина не найдена","No known issue detected");
    $("summary").innerHTML='<div class="summary-top"><span class="status-dot '+(report.errors.length?"":"good")+'"></span><span class="summary-title">'+escapeHtml(title)+'</span></div><div class="summary-meta"><span>Minecraft: <b>'+escapeHtml(report.minecraft)+'</b></span><span>Loader: <b>'+escapeHtml(report.loader)+'</b></span><span>Java: <b>'+escapeHtml(report.java)+'</b></span><span>'+t("Строк","Lines")+': <b>'+report.totalLines+'</b></span></div>';
    const cards=report.errors.length?report.errors:[{level:"info",title:t("Известные шаблоны ошибок не найдены","No known error patterns found"),body:t("В логе не обнаружены ошибки из текущей базы правил. Это не гарантирует отсутствие проблемы: проверь последние строки перед завершением игры и полный crash-report.","No patterns from the current rule set were found. This does not guarantee the log is problem-free: inspect the final lines before shutdown and the full crash report.")}];
    $("diagnostics").innerHTML=cards.map(e=>'<article class="diagnostic-card"><span class="diagnostic-level '+e.level+'">'+(e.level==="error"?t("ОШИБКА", "ERROR"):e.level==="warning"?t("ПРЕДУПРЕЖДЕНИЕ","WARNING"):t("ИНФОРМАЦИЯ","INFO"))+'</span><h3>'+escapeHtml(e.title)+'</h3><p>'+escapeHtml(e.body)+'</p></article>').join("");
    $("evidence").textContent=report.evidence||t("Подходящие строки не найдены.","No matching lines found.");
    lastReport=[title,"Minecraft: "+report.minecraft,"Loader: "+report.loader,"Java: "+report.java,...report.errors.map(e=>e.title+": "+e.body),"Evidence:",report.evidence].join("\n\n");
    $("results").scrollIntoView({behavior:"smooth",block:"start"});
  }
  analyzeButton.addEventListener("click",()=>{
    const raw=textInput.value.trim();
    if(!raw)return;
    render(analyze(raw));
  });
  $("copyReport").addEventListener("click",async()=>{
    if(!lastReport)return;
    try{await navigator.clipboard.writeText(lastReport);$("copyReport").textContent=t("Скопировано ✓","Copied ✓");}
    catch(e){$("copyReport").textContent=t("Не удалось скопировать","Copy failed");}
  });
  document.querySelectorAll("[data-ru][data-en]").forEach(el=>{
    const observer=new MutationObserver(()=>{const value=el.getAttribute("data-"+lang());if(value)el.textContent=value;});
    observer.observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  });
})();