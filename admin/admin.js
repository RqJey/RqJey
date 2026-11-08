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
    $("projectList").innerHTML=content.projects.map(p=>'<div class="record"><div><strong>'+esc(p.name)+'</strong><small>'+esc(p.category)+' · '+esc(p.id)+'</small></div><div class="record-actions"><button data-edit-project="'+esc(p.id)+'">Изменить</button><button class="danger" data-delete-project="'+esc(p.id)+'">Удалить</button></div></div>').join("")||'<p class="hint">Пока нет проектов.</p>';
  }
  function renderNews() {
    $("newsList").innerHTML=content.news.map(n=>'<div class="record"><div><strong>'+esc(n.title)+'</strong><small>'+esc(n.date||"")+' · '+esc(n.id)+'</small></div><div class="record-actions"><button class="danger" data-delete-news="'+esc(n.id)+'">Удалить</button></div></div>').join("")||'<p class="hint">Новостей пока нет.</p>';
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
  $("newsList").addEventListener("click",e=>{const del=e.target.closest("[data-delete-news]");if(del&&confirm("Подготовить удаление новости?"))setPayload({action:"delete_news",id:del.dataset.deleteNews});});
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
  });
  $("categoriesForm").addEventListener("submit",e=>{e.preventDefault();setPayload({action:"save_categories",categories:$("categoriesText").value.split("\n").map(x=>x.trim()).filter(Boolean)});});
  $("homepageForm").addEventListener("submit",e=>{e.preventDefault();setPayload({action:"update_homepage",homepage:{heroCopy:$("hHero").value.trim(),aboutTitle:$("hAboutTitle").value.trim(),aboutCopy:$("hAboutCopy").value.trim()}});});
  $("copyPayload").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("payload").value);toast("JSON скопирован. Теперь открой GitHub Actions.");}catch(_){$("payload").select();document.execCommand("copy");toast("JSON скопирован.");}});
  $("workflowLink").href=WORKFLOW_URL;
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
