(() => {
  "use strict";
  const DEMO_USERNAME = "admin";
  const DEMO_PASSWORD = "admin";
  const SESSION_KEY = "rqjey_cms_demo_session";
  const loginScreen = document.getElementById("loginScreen");
  const adminShell = document.getElementById("adminShell");
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  function showAdmin() {
    loginScreen.hidden = true;
    adminShell.hidden = false;
  }
  function showLogin() {
    sessionStorage.removeItem(SESSION_KEY);
    adminShell.hidden = true;
    loginScreen.hidden = false;
    document.getElementById("loginPassword").value = "";
    const tokenField = document.getElementById("githubToken");
    if (tokenField) tokenField.value = "";
  }
  if (sessionStorage.getItem(SESSION_KEY) === "ok") showAdmin();
  loginForm.addEventListener("submit", event => {
    event.preventDefault();
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "ok");
      loginError.textContent = "";
      showAdmin();
    } else {
      loginError.textContent = "Неверный логин или пароль. Попробуй ещё раз.";
      document.getElementById("loginPassword").select();
    }
  });
  document.getElementById("logoutButton").addEventListener("click", showLogin);

  const CONTENT_URL = "../content/site-content.json";
  const WORKFLOW_URL = "https://github.com/RqJey/RqJey/actions/workflows/cms-publish.yml";
  let content = {homepage:{},categories:[],projects:[],news:[]};
  let pending = null;
  const $ = id => document.getElementById(id);
  const toast = message => { const el=$("toast"); el.textContent=message; el.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove("show"),2600); };
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const setPayload = value => { pending=value; $("payload").value=JSON.stringify(value,null,2); $("payloadState").textContent="ГОТОВО К ПУБЛИКАЦИИ"; $("copyPayload").textContent="Скопировать JSON"; showView("publish"); };
  function showView(name) {
    document.querySelectorAll(".view").forEach(el=>el.classList.toggle("active",el.id==="view-"+name));
    document.querySelectorAll(".nav-item").forEach(el=>el.classList.toggle("active",el.dataset.view===name));
    const titles={overview:"Обзор",projects:"Проекты",news:"Новости",categories:"Категории",homepage:"Главная страница",publish:"Публикация"};
    $("pageTitle").textContent=titles[name]||"Обзор";
  }
  function refreshOverview() {
    $("statProjects").textContent=content.projects.length;
    $("statNews").textContent=content.news.length;
    $("statCategories").textContent=content.categories.length;
    $("categoryOptions").innerHTML=content.categories.map(x=>'<option value="'+esc(x)+'">').join("");
  }
  function renderProjects() {
    $("projectList").innerHTML=content.projects.map(p=>'<article class="content-record">' + (p.image?'<img class="content-record-image" src="../'+esc(p.image)+'" alt="">':"") + '<div class="content-record-main"><div class="content-record-title"><span class="content-record-icon">'+esc(p.icon||"✳")+'</span><strong>'+esc(p.name)+'</strong><span class="content-record-accent">'+esc(p.accent||"") + '</span></div><small>'+esc(p.category)+' · Minecraft '+esc(p.minecraft||"")+' · ID: '+esc(p.id)+'</small><p>'+esc(p.description||"")+'</p>'+(p.features?.length?'<ul>'+p.features.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>':"")+'</div><div class="record-actions"><button data-edit-project="'+esc(p.id)+'">Изменить</button><button class="danger" data-delete-project="'+esc(p.id)+'">Удалить</button></div></article>').join("")||'<p class="hint">Пока нет проектов.</p>';
  }
  function renderNews() {
    $("newsList").innerHTML=content.news.map(n=>'<article class="content-record news-record">'+(n.image?'<img class="content-record-image" src="../'+esc(n.image)+'" alt="">':"")+'<div class="content-record-main"><div class="content-record-title"><strong>'+esc(n.title)+'</strong><span class="content-record-date">'+esc(n.date||"") + '</span></div><small>ID: '+esc(n.id)+'</small><p class="news-record-body">'+esc(n.body||"")+'</p></div><div class="record-actions"><button data-edit-news="'+esc(n.id)+'">Изменить</button><button class="danger" data-delete-news="'+esc(n.id)+'">Удалить</button></div></article>').join("")||'<p class="hint">Новостей пока нет.</p>';
  }
  function resetProject() {
    $("projectForm").reset(); $("pIcon").value="✳"; $("pMinecraft").value="26.3"; $("pAccent").value="violet"; $("projectFormTitle").textContent="Новый проект"; $("pId").disabled=false;
  }
  function editProject(id) {
    const p=content.projects.find(x=>x.id===id); if(!p)return;
    $("pId").value=p.id; $("pId").disabled=true; $("pName").value=p.name||""; $("pCategory").value=p.category||""; $("pMinecraft").value=p.minecraft||""; $("pIcon").value=p.icon||"✳"; $("pAccent").value=p.accent||"violet"; $("pDescription").value=p.description||""; $("pFeatures").value=(p.features||[]).join("\n"); $("pImage").value="";
    $("projectFormTitle").textContent="Редактировать: "+p.name; $("projectForm").scrollIntoView({behavior:"smooth",block:"start"});
  }
  document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>showView(btn.dataset.view)));
  document.querySelectorAll("[data-go]").forEach(btn=>btn.addEventListener("click",()=>showView(btn.dataset.go)));
  $("projectList").addEventListener("click",e=>{
    const edit=e.target.closest("[data-edit-project]"), del=e.target.closest("[data-delete-project]");
    if(edit)editProject(edit.dataset.editProject);
    if(del){const id=del.dataset.deleteProject;if(confirm("Подготовить удаление проекта "+id+"?"))setPayload({action:"delete_project",id});}
  });
  $("newsList").addEventListener("click",e=>{
    const edit=e.target.closest("[data-edit-news]"), del=e.target.closest("[data-delete-news]");
    if(edit){const n=content.news.find(item=>item.id===edit.dataset.editNews);if(!n)return;$("nId").value=n.id;$("nTitle").value=n.title||"";$("nBody").value=n.body||"";$("nImage").value="";$("newsForm").scrollIntoView({behavior:"smooth",block:"start"});$("newsForm").querySelector('button[type="submit"]').textContent="Подготовить обновление новости";}
    if(del&&confirm("Подготовить удаление новости?"))setPayload({action:"delete_news",id:del.dataset.deleteNews});
  });
  $("resetProject").addEventListener("click",resetProject);
  $("projectForm").addEventListener("submit",e=>{
    e.preventDefault();
    const id=$("pId").value.trim().toLowerCase();
    if(!/^[a-z0-9][a-z0-9-]*$/.test(id)){toast("Проверь ID проекта");return;}
    const old=content.projects.find(p=>p.id===id);
    setPayload({action:"save_project",project:{id,name:$("pName").value.trim(),category:$("pCategory").value.trim(),minecraft:$("pMinecraft").value.trim()||"Любая",icon:$("pIcon").value.trim()||"✳",accent:$("pAccent").value,description:$("pDescription").value.trim(),features:$("pFeatures").value.split("\n").map(x=>x.trim()).filter(Boolean),image_url:$("pImage").value.trim(),...(old?.image&&!$("pImage").value.trim()?{image:old.image}:{})}});
  });
  $("newsForm").addEventListener("submit",e=>{
    e.preventDefault();const id=$("nId").value.trim().toLowerCase();if(!/^[a-z0-9][a-z0-9-]*$/.test(id)){toast("Проверь ID новости");return;}
    setPayload({action:"publish_news",news:{id,title:$("nTitle").value.trim(),body:$("nBody").value.trim(),image_url:$("nImage").value.trim()}});
    $("newsForm").querySelector('button[type="submit"]').textContent="Подготовить новость";
  });
  $("categoriesForm").addEventListener("submit",e=>{e.preventDefault();setPayload({action:"save_categories",categories:$("categoriesText").value.split("\n").map(x=>x.trim()).filter(Boolean)});});
  $("homepageForm").addEventListener("submit",e=>{e.preventDefault();setPayload({action:"update_homepage",homepage:{heroCopy:$("hHero").value.trim(),aboutTitle:$("hAboutTitle").value.trim(),aboutCopy:$("hAboutCopy").value.trim()}});});
  $("copyPayload").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("payload").value);toast("JSON скопирован. Теперь открой GitHub Actions.");}catch(_){$("payload").select();document.execCommand("copy");toast("JSON скопирован.");}});
  $("workflowLink").href=WORKFLOW_URL;

  const GITHUB_API = "https://api.github.com";
  const REPO = "RqJey/RqJey";
  const WORKFLOW_FILE = "cms-publish.yml";
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function githubApi(path, token, options = {}) {
    const response = await fetch(GITHUB_API + path, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + token,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      let detail = "";
      try { detail = (await response.json()).message || ""; } catch (_) {}
      throw new Error("GitHub API " + response.status + (detail ? ": " + detail : ""));
    }
    if (response.status === 204) return null;
    return response.json();
  }
  function payloadIsPresent(data, payload) {
    const id = payload.id || payload.news?.id || payload.project?.id;
    switch (payload.action) {
      case "publish_news":
        return (data.news || []).some(item => item.id === payload.news.id && item.title === payload.news.title);
      case "delete_news":
        return !(data.news || []).some(item => item.id === payload.id);
      case "save_project": {
        const item = (data.projects || []).find(project => project.id === payload.project.id);
        return !!item && item.name === payload.project.name && item.description === payload.project.description;
      }
      case "delete_project":
        return (data.hiddenProjects || []).includes(payload.id) || !(data.projects || []).some(item => item.id === payload.id);
      case "save_categories":
        return JSON.stringify(data.categories || []) === JSON.stringify(payload.categories || []);
      case "update_homepage":
        return Object.entries(payload.homepage || {}).every(([key, value]) => data.homepage?.[key] === value);
      default:
        return false;
    }
  }
  async function waitForRun(token, previousIds, startedAt) {
    const endpoint = "/repos/" + REPO + "/actions/workflows/" + WORKFLOW_FILE + "/runs?branch=main&event=workflow_dispatch&per_page=10";
    let run = null;
    for (let i = 0; i < 30 && !run; i++) {
      const result = await githubApi(endpoint, token);
      run = (result.workflow_runs || []).find(item =>
        !previousIds.has(item.id) &&
        new Date(item.created_at).getTime() >= startedAt - 15000 &&
        item.actor?.login === "RqJey"
      ) || null;
      if (!run) await sleep(2000);
    }
    if (!run) throw new Error("GitHub принял запрос, но запуск workflow не появился в списке. Открой журнал публикаций и проверь Actions.");
    $("publishStatus").innerHTML = 'Запуск найден: <a href="' + esc(run.html_url) + '" target="_blank" rel="noopener">открыть GitHub Actions ↗</a>. Жду завершения…';
    for (let i = 0; i < 180; i++) {
      const current = await githubApi("/repos/" + REPO + "/actions/runs/" + run.id, token);
      if (current.status === "completed") {
        if (current.conclusion !== "success") throw new Error("GitHub Actions завершился со статусом " + current.conclusion + ". Подробности: " + current.html_url);
        return current;
      }
      await sleep(2000);
    }
    throw new Error("Публикация выполняется дольше обычного. Проверь запуск: " + run.html_url);
  }
  async function verifySitePayload(payload) {
    const url = CONTENT_URL + "?publish_check=" + Date.now();
    for (let i = 0; i < 90; i++) {
      try {
        const response = await fetch(url + "_" + i, {cache:"no-store"});
        if (response.ok) {
          const data = await response.json();
          if (payloadIsPresent(data, payload)) return true;
        }
      } catch (_) {}
      await sleep(2000);
    }
    return false;
  }
  $("publishNow").addEventListener("click", async () => {
    const token = $("githubToken").value.trim();
    if (!token) { toast("Сначала вставь GitHub token"); $("githubToken").focus(); return; }
    let payload;
    try { payload = JSON.parse($("payload").value); }
    catch (_) { toast("JSON публикации повреждён. Подготовь изменение заново."); return; }
    if (!payload || typeof payload !== "object" || !payload.action) { toast("Сначала подготовь изменение"); return; }
    const button = $("publishNow");
    button.disabled = true;
    button.textContent = "Публикую…";
    $("publishStatus").textContent = "Проверяю доступ к GitHub…";
    $("payloadState").textContent = "ПУБЛИКАЦИЯ";
    try {
      const endpoint = "/repos/" + REPO + "/actions/workflows/" + WORKFLOW_FILE + "/runs?branch=main&event=workflow_dispatch&per_page=10";
      const before = await githubApi(endpoint, token);
      const previousIds = new Set((before.workflow_runs || []).map(run => run.id));
      const startedAt = Date.now();
      await githubApi("/repos/" + REPO + "/actions/workflows/" + WORKFLOW_FILE + "/dispatches", token, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ref:"main",inputs:{payload:JSON.stringify(payload)}})
      });
      $("publishStatus").textContent = "GitHub принял запрос. Ожидаю запуск и завершение сборки…";
      const run = await waitForRun(token, previousIds, startedAt);
      $("publishStatus").textContent = "Workflow завершился успешно. Проверяю, что изменения уже доступны на сайте…";
      const visible = await verifySitePayload(payload);
      if (!visible) {
        $("payloadState").textContent = "ЗАПИСАНО В MAIN";
        $("publishStatus").innerHTML = 'GitHub записал изменения в <code>main</code>, но сайт пока не отдал обновлённые данные. <a href="' + esc(run.html_url) + '" target="_blank" rel="noopener">Открыть успешный запуск ↗</a>. Подожди минуту и обнови сайт.';
        return;
      }
      $("payloadState").textContent = "ОПУБЛИКОВАНО";
      $("publishStatus").textContent = "Готово! GitHub Actions завершился успешно, а обновлённые данные уже доступны на сайте.";
      toast("Изменения опубликованы на сайте!");
      await init();
    } catch (error) {
      $("payloadState").textContent = "ОШИБКА";
      $("publishStatus").textContent = "Не опубликовано: " + error.message;
      toast("Публикация не удалась");
    } finally {
      button.disabled = false;
      button.textContent = "Опубликовать на сайт ↗";
    }
  });
  async function init(){
    try{
      const response=await fetch(CONTENT_URL,{cache:"no-store"});if(!response.ok)throw new Error("HTTP "+response.status);content=await response.json();
      content.projects ||= [];content.news ||= [];content.categories ||= [];content.homepage ||= {};
      refreshOverview();renderProjects();renderNews();
      $("categoriesText").value=content.categories.join("\n");
      $("hHero").value=content.homepage.heroCopy||"";$("hAboutTitle").value=content.homepage.aboutTitle||"";$("hAboutCopy").value=content.homepage.aboutCopy||"";
    }catch(error){toast("Не удалось загрузить CMS-данные: "+error.message);}
  }
  init();
})();
