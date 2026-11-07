(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const loginView = $('loginView'), dashboardView = $('dashboardView');
  let csrf = '', content = { projects: [] }, selectedId = null, dirty = false;

  async function api(url, options = {}) {
    const headers = { ...(options.body ? {'Content-Type':'application/json'} : {}), ...(options.headers || {}) };
    if (csrf && options.method && options.method !== 'GET') headers['X-CSRF-Token'] = csrf;
    const response = await fetch(url, { credentials:'same-origin', cache:'no-store', ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Ошибка ${response.status}`);
    return data;
  }
  function showNotice(message, type = '') { const el=$('notice'); el.textContent=message; el.className=`notice ${type}`; }
  function showLogin() { dashboardView.hidden=true; loginView.hidden=false; }
  function showDashboard() { loginView.hidden=true; dashboardView.hidden=false; }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  async function boot() {
    try {
      const session = await api('/api/admin/session');
      csrf = session.csrf;
      showDashboard();
      await loadContent();
    } catch { showLogin(); }
  }
  async function loadContent() {
    content = await api('/api/admin/content');
    renderList();
    if (content.projects.length) selectProject(content.projects[0].id);
    else $('editor').innerHTML = '<div class="empty-editor"><h2>Нет проектов</h2><p>Проверь data/content.json на сервере.</p></div>';
    dirty = false;
    showNotice('Данные загружены', 'success');
  }
  function renderList() {
    $('projectList').innerHTML = content.projects.map(p =>
      `<button type="button" class="project-choice ${p.id===selectedId?'active':''}" data-id="${escapeHtml(p.id)}"><span class="choice-icon">${escapeHtml(p.icon)}</span><span><b>${escapeHtml(p.name)}</b><small>${escapeHtml(p.category)}</small></span><span class="chevron">›</span></button>`
    ).join('');
    $('projectList').querySelectorAll('[data-id]').forEach(button => button.addEventListener('click', () => {
      if (dirty && !confirm('Есть несохранённые изменения. Переключиться без сохранения?')) return;
      if (dirty) loadContent().then(() => selectProject(button.dataset.id)).catch(e => showNotice(e.message,'error'));
      else selectProject(button.dataset.id);
    }));
  }
  function selectProject(id) {
    selectedId=id;
    const p=content.projects.find(x=>x.id===id);
    if (!p) return;
    renderList();
    $('editor').innerHTML = `<div class="editor-title"><div><p class="eyebrow">PROJECT SETTINGS</p><h2>${escapeHtml(p.name)}</h2></div><span class="id-tag">${escapeHtml(p.id)}</span></div>
      <div class="form-grid">
        <label>Название<input data-field="name" value="${escapeHtml(p.name)}" maxlength="80"></label>
        <label>Иконка<input data-field="icon" value="${escapeHtml(p.icon)}" maxlength="8"></label>
        <label>Категория<input data-field="category" value="${escapeHtml(p.category)}" maxlength="80"></label>
        <label>Версия Minecraft<input data-field="minecraft" value="${escapeHtml(p.minecraft)}" maxlength="60"></label>
        <label>Цвет карточки<select data-field="accent">${['violet','blue','green','purple','orange'].map(v=>`<option value="${v}" ${p.accent===v?'selected':''}>${v}</option>`).join('')}</select></label>
        <label class="full">Описание<textarea data-field="description" rows="5" maxlength="1200">${escapeHtml(p.description)}</textarea><small>До 1200 символов.</small></label>
        <label class="full">Особенности <span class="hint">Каждая с новой строки</span><textarea data-field="features" rows="5">${escapeHtml((p.features||[]).join('\n'))}</textarea></label>
      </div>
      <div class="editor-actions"><span class="muted">ID проекта менять нельзя.</span><button class="primary" id="saveOne" type="button">Сохранить проект</button></div>`;
    $('editor').querySelectorAll('[data-field]').forEach(input => input.addEventListener('input', () => {
      updateSelectedFromForm(); dirty=true; showNotice('Есть несохранённые изменения','warning');
    }));
    $('saveOne').addEventListener('click', saveContent);
  }
  function updateSelectedFromForm() {
    const p=content.projects.find(x=>x.id===selectedId);
    if (!p) return;
    $('editor').querySelectorAll('[data-field]').forEach(el => {
      const key=el.dataset.field;
      p[key]=key==='features'?el.value.split('\n').map(v=>v.trim()).filter(Boolean):el.value;
    });
    renderList();
  }
  async function saveContent() {
    updateSelectedFromForm();
    $('saveButton').disabled=true;
    const one=$('saveOne'); if(one) one.disabled=true;
    try {
      const result=await api('/api/admin/content',{method:'PUT',body:JSON.stringify(content)});
      dirty=false;
      showNotice(`Сохранено · ${new Date(result.savedAt).toLocaleString('ru-RU')}`,'success');
    } catch(e) { showNotice(e.message,'error'); }
    finally { $('saveButton').disabled=false; if(one) one.disabled=false; }
  }
  $('loginForm').addEventListener('submit', async event => {
    event.preventDefault(); $('loginError').textContent='';
    const form=new FormData(event.currentTarget);
    try {
      const result=await api('/api/admin/login',{method:'POST',body:JSON.stringify({username:form.get('username'),password:form.get('password')})});
      csrf=result.csrf; event.currentTarget.reset(); showDashboard(); await loadContent();
    } catch(e) { $('loginError').textContent=e.message; }
  });
  $('saveButton').addEventListener('click', saveContent);
  $('logoutButton').addEventListener('click', async () => {
    try { await api('/api/admin/logout',{method:'POST',body:'{}'}); } catch {}
    csrf=''; dirty=false; showLogin();
  });
  window.addEventListener('beforeunload', event => { if(dirty) { event.preventDefault(); event.returnValue=''; } });
  boot();
})();
