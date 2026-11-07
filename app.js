(() => {
  const config = window.SITE_CONFIG || {};
  const owner = (config.owner || "").trim();
  const releasesRepo = (config.releasesRepo || "Minecraft-Mods").trim();
  const projectMetadata = config.projects || [];
  const grid = document.getElementById("projectGrid");
  const search = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const sortSelect = document.getElementById("sortSelect");
  const modal = document.getElementById("modalBackdrop");
  const select = document.getElementById("versionSelect");
  const fileSelect = document.getElementById("fileSelect");
  const download = document.getElementById("downloadButton");
  const status = document.getElementById("releaseStatus");
  const toast = document.getElementById("toast");
  let allReleases = [];
  let projects = [];
  let activeProject = null;
  let activeReleases = [];
  let activeCollection = projects;
  let utilities = [];

  const iconSvg = {
    arrow: '<svg viewBox="0 0 24 24"><path d="M7 17 17 7M7 7h10v10"/></svg>'
  };
  const fallbackIcons = ["✳", "⌖", "◇", "⌘", "↗", "✦", "◈"];
  const accents = ["violet", "blue", "green", "purple", "orange"];
  const translations = {
    ru: {utilitiesKicker:"БИБЛИОТЕКА УТИЛИТ",utilitiesTitle:"Полезные инструменты",utilitiesCopy:"Небольшие программы и утилиты. Версии и файлы автоматически загружаются из GitHub Releases.",utilitiesSearchPlaceholder:"Поиск по утилитам...",loadingUtilities:"Загрузка утилит из GitHub Releases...",utilitiesEmpty:"Утилиты не найдены.",utilitiesLoadError:"Не удалось загрузить библиотеку утилит",navCatalog:"Каталог",navAbout:"О проекте",notifications:"Уведомления",themeSystem:"Системная",themeLight:"Светлая",themeDark:"Тёмная",showcaseLabel:"КОЛЛЕКЦИЯ ИНСТРУМЕНТОВ",projectsWord:"проектов",autoReleases:"Автообновление из GitHub Releases",curatedMods:"ПОДБОРКА МОДОВ",heroCopy:"Полезные клиентские модификации для более удобной игры. Выбирай инструмент, изучай версии и скачивай актуальные сборки в пару кликов.",exploreMods:"Исследовать моды",openGithub:"Открыть GitHub",library:"БИБЛИОТЕКА МОДОВ",chooseTool:"Выбери свой инструмент",libraryCopy:"Все актуальные сборки и история релизов в одном месте.",category:"Категория",allCategories:"Все категории",sort:"Сортировка",sortName:"По названию",sortLatest:"Сначала новые",empty:"Ничего не найдено. Попробуй изменить запрос или фильтр.",aboutKicker:"ЗА КАЖДЫМ МОДОМ — ИДЕЯ",aboutTitle:"Меньше рутины. Больше игры.",aboutCopy:"RqJey Mods — коллекция небольших инструментов для Minecraft. Новые версии автоматически появляются здесь после публикации релиза на GitHub.",sourceCode:"Исходный код",footerTag:"Made for better Minecraft sessions",backTop:"Наверх ↑",downloadCenter:"· ЦЕНТР СКАЧИВАНИЯ",chooseVersion:"Выбери версию",buildFile:"Файл сборки",downloadBuild:"Скачать сборку",viewRelease:"Посмотреть релиз на GitHub",searchPlaceholder:"Поиск по названию, категории...",details:"Подробнее",files:"файлов",releases:"релизов",published:"Опубликовано",noRelease:"Нет релизов с .jar файлами",noBuilds:"Нет сборок",chooseRelease:"Сначала выбери релиз",notifyEnabled:"Уведомления включены",notifyDenied:"Разреши уведомления в настройках браузера",notifyUnsupported:"Этот браузер не поддерживает уведомления",notifyPrompt:"Разрешить уведомления о новых релизах?",copied:"Ссылка скопирована",shareError:"Не удалось поделиться ссылкой",newBadge:"НОВЫЙ",updatedBadge:"ОБНОВЛЁН",share:"Поделиться",copyLink:"Копировать ссылку",popularBadge:"ПОПУЛЯРНЫЙ",noDescription:"Описание релиза не добавлено.",loading:"Загрузка...",loadError:"Не удалось загрузить релизы",totalDownloads:"Всего скачиваний",publishedReleases:"Опубликовано релизов",downloadCountUnavailable:"Счётчик GitHub обновляется вместе с релизами"},
    en: {utilitiesKicker:"UTILITIES LIBRARY",utilitiesTitle:"Useful tools",utilitiesCopy:"Small programs and utilities. Versions and files are automatically loaded from GitHub Releases.",utilitiesSearchPlaceholder:"Search utilities...",loadingUtilities:"Loading utilities from GitHub Releases...",utilitiesEmpty:"No utilities found.",utilitiesLoadError:"Could not load the utilities library",navCatalog:"Catalog",navAbout:"About",notifications:"Notifications",themeSystem:"System",themeLight:"Light",themeDark:"Dark",showcaseLabel:"CURATED TOOLKIT",projectsWord:"projects",autoReleases:"Auto-updated from GitHub Releases",curatedMods:"CURATED MODS",heroCopy:"Useful client-side modifications for a smoother Minecraft experience. Pick a tool, explore versions, and get the latest build in a couple of clicks.",exploreMods:"Explore mods",openGithub:"Open GitHub",library:"MOD LIBRARY",chooseTool:"Choose your tool",libraryCopy:"All current builds and release history in one place.",category:"Category",allCategories:"All categories",sort:"Sort by",sortName:"Name",sortLatest:"Newest first",empty:"Nothing found. Try changing your search or filters.",aboutKicker:"AN IDEA BEHIND EVERY MOD",aboutTitle:"Less routine. More gameplay.",aboutCopy:"RqJey Mods is a collection of small tools for Minecraft. New versions appear here automatically after a GitHub release is published.",sourceCode:"Source code",footerTag:"Made for better Minecraft sessions",backTop:"Back to top ↑",downloadCenter:"· DOWNLOAD CENTER",chooseVersion:"Choose version",buildFile:"Build file",downloadBuild:"Download build",viewRelease:"View release on GitHub",searchPlaceholder:"Search by name or category...",details:"Details",files:"files",releases:"releases",published:"Published",noRelease:"No releases with .jar files",noBuilds:"No builds",chooseRelease:"Choose a release first",notifyEnabled:"Notifications enabled",notifyDenied:"Allow notifications in your browser settings",notifyUnsupported:"This browser does not support notifications",notifyPrompt:"Allow notifications about new releases?",copied:"Link copied",shareError:"Could not share this link",newBadge:"NEW",updatedBadge:"UPDATED",share:"Share",copyLink:"Copy link",popularBadge:"POPULAR",noDescription:"No release notes provided.",loading:"Loading...",loadError:"Could not load releases",totalDownloads:"Total downloads",publishedReleases:"Published releases",downloadCountUnavailable:"GitHub download count updates with releases"}
  };
  let language = localStorage.getItem("rqjey-language") || "ru";
  if (!translations[language]) language = "ru";
  const tr = key => translations[language][key] || translations.ru[key] || key;
  const projectTranslations = {
    itemly: {category:"Personalization", description:"Rename items locally and customize the color of displayed names and backgrounds."},
    nearyou: {category:"Navigation", description:"Find players on the server map, view their coordinates, and navigate to discovered players."},
    dropguard: {category:"Protection", description:"Prevent accidental pickup of selected items and manage your personal block list."},
    friendhub: {category:"Communication", description:"A friends list, private messages, and voice chat invitations in one convenient menu."},
    fastcmd: {category:"Tools", description:"A quick-access command wheel, custom commands, and convenient page management."}
  };
  function projectField(project, field) {
    return language === "en" ? (projectTranslations[project.id]?.[field] || project[field]) : project[field];
  }
  function applyLanguage() {
    document.documentElement.lang = language;
    document.querySelectorAll("[data-i18n]").forEach(el => { const key = el.dataset.i18n; el.textContent = tr(key); });
    document.querySelectorAll("[data-i18n-html]").forEach(el => { el.innerHTML = tr(el.dataset.i18nHtml); });
    search.placeholder = tr("searchPlaceholder");
    const utilitySearch = document.getElementById("utilitiesSearch");
    if (utilitySearch) utilitySearch.placeholder = tr("utilitiesSearchPlaceholder");
    renderUtilities(utilitySearch?.value || "");
    document.getElementById("languageSelect").value = language;
    const selectedCategory = categoryFilter.value;
    const categoryOptions = [...categoryFilter.options].slice(1).map(option => option.value);
    categoryFilter.innerHTML = `<option value="all">${escapeHtml(tr("allCategories"))}</option>` + categoryOptions.map(category => { const translated = language === "en" ? ({"Персонализация":"Personalization","Навигация":"Navigation","Защита":"Protection","Общение":"Communication","Инструменты":"Tools"}[category] || category) : category; return `<option value="${escapeHtml(category)}">${escapeHtml(translated)}</option>`; }).join("");
    categoryFilter.value = selectedCategory;
    renderProjects(search.value);
  }
  function applyTheme(theme) {
    const selected = ["light", "dark", "system"].includes(theme) ? theme : "system";
    document.documentElement.dataset.theme = selected;
    document.getElementById("themeSelect").value = selected;
    localStorage.setItem("rqjey-theme", selected);
    const color = selected === "light" ? "#f4f5f8" : selected === "dark" ? "#0b0c10" : "#0b0c10";
    document.querySelector('meta[name="theme-color"]').setAttribute("content", color);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  }

  // Безопасный небольшой Markdown-рендерер: поддерживает **жирный**, *курсив*, `код`,
  // списки, переносы строк и ссылки. HTML из описаний никогда не вставляется напрямую.
  function renderMarkdown(value) {
    const lines = String(value ?? "").replace(/\r/g, "").split("\n");
    const inline = text => {
      let html = escapeHtml(text);
      html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
      html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
      return html;
    };
    const out = []; let list = false;
    for (const raw of lines) {
      const line = raw.trim();
      const item = line.match(/^(?:[-*•])\s+(.+)/);
      if (item) { if (!list) { out.push("<ul>"); list = true; } out.push(`<li>${inline(item[1])}</li>`); continue; }
      if (list) { out.push("</ul>"); list = false; }
      if (!line) continue;
      const heading = line.match(/^(#{1,3})\s+(.+)/);
      if (heading) { const level = heading[1].length + 2; out.push(`<h${level}>${inline(heading[2])}</h${level}>`); }
      else out.push(`<p>${inline(line)}</p>`);
    }
    if (list) out.push("</ul>");
    return out.join("");
  }

  function getProjectDownloadCount(project) {
    return project.releases.reduce((total, release) => total + (release.assets || []).reduce((sum, asset) => sum + Math.max(0, Number(asset.download_count) || 0), 0), 0);
  }

  // Формат имени релиза: Test-Mod-Release, Test-Mod-Release-1.2,
  // Test-Mod-Release(описание). Имя мода — часть перед -Mod-Release.
  function getModName(release) {
    const candidates = [release.name, release.tag_name].filter(Boolean);
    for (const raw of candidates) {
      const value = String(raw).trim();
      const match = value.match(/^(.+?)-Mod-Release(?=$|[-_\s(])/i);
      if (match) return match[1].replace(/[-_]+/g, " ").trim();
    }
    // Дополнительный вариант: тег вида Test/1.2.0 или Test-1.2.0
    for (const raw of candidates) {
      const value = String(raw).trim();
      const match = value.match(/^([A-Za-zА-Яа-яЁё0-9][\wА-Яа-яЁё -]*?)(?:\/|[-_])v?\d+\.\d+/i);
      if (match) return match[1].replace(/[-_]+/g, " ").trim();
    }
    return null;
  }

  function makeId(name) {
    return name.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-|-$/g, "") || "mod";
  }

  async function getAllReleases(repo = releasesRepo) {
    if (!owner || owner === "YOUR_GITHUB_USERNAME") throw new Error("Не указан GitHub username в config.js");
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases?per_page=100`;
    const response = await fetch(url, {
      cache: "no-store",
      headers: { "Accept": "application/vnd.github+json" }
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Репозиторий ${repo} не найден или он приватный`);
      if (response.status === 403) throw new Error("GitHub API временно ограничил запросы");
      throw new Error(`GitHub вернул ошибку ${response.status}`);
    }
    return response.json();
  }

  // Дата публикации конкретного файла GitHub Release.
  // created_at — время загрузки asset; остальные поля нужны как запасной вариант.
  function getAssetPublishedAt(asset, release) {
    return Date.parse(
      asset.created_at ||
      asset.updated_at ||
      release.published_at ||
      release.created_at ||
      0
    ) || 0;
  }

  // Самые новые файлы идут первыми — первый файл будет выбран по умолчанию.
  function jarAssets(release) {
    return (release.assets || [])
      .slice()
      .sort((a, b) => getAssetPublishedAt(b, release) - getAssetPublishedAt(a, release));
  }

  function getLatestFilePublishedAt(release) {
    const assets = jarAssets(release);
    return assets.length ? getAssetPublishedAt(assets[0], release) : 0;
  }

  function compareReleasesByPublishedFile(a, b) {
    const dateA = getLatestFilePublishedAt(a);
    const dateB = getLatestFilePublishedAt(b);
    if (dateA !== dateB) return dateB - dateA;

    // Если даты файлов совпадают, используем дату публикации самого релиза.
    const releaseDateA = Date.parse(a.published_at || a.created_at || 0) || 0;
    const releaseDateB = Date.parse(b.published_at || b.created_at || 0) || 0;
    return releaseDateB - releaseDateA;
  }

  function allBuilds(releases) {
    return releases.flatMap(release => jarAssets(release).map(asset => ({ release, asset })));
  }

  function buildProjects(releases) {
    const groups = new Map();
    releases.forEach(release => {
      const modName = getModName(release);
      if (!modName) return;
      const key = modName.toLowerCase();
      if (!groups.has(key)) groups.set(key, { name: modName, releases: [] });
      groups.get(key).releases.push(release);
    });

    return Array.from(groups.values()).map((group, index) => {
      const metadata = projectMetadata.find(p => p.name.toLowerCase() === group.name.toLowerCase());
      return {
        ...(metadata || {}),
        id: metadata?.id || makeId(group.name),
        name: metadata?.name || group.name,
        icon: metadata?.icon || fallbackIcons[index % fallbackIcons.length],
        category: metadata?.category || "Minecraft-мод",
        description: metadata?.description || `Релизы и файлы мода ${group.name} из GitHub.`,
        minecraft: metadata?.minecraft || "См. описание релиза",
        accent: metadata?.accent || accents[index % accents.length],
        features: metadata?.features || [],
        releases: group.releases
      };
    }).sort((a,b) => {
      // FriendHub всегда закреплён первым; остальные моды — по алфавиту.
      const aPinned = a.name.toLowerCase() === "friendhub";
      const bPinned = b.name.toLowerCase() === "friendhub";
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      return a.name.localeCompare(b.name, "ru");
    });
  }

  function renderProjects(filter = "") {
    const term = filter.trim().toLowerCase();
    let ordered = projects.slice();
    if (sortSelect?.value === "latest") {
      ordered.sort((a, b) => compareReleasesByPublishedFile(a.releases.slice().sort(compareReleasesByPublishedFile)[0] || {}, b.releases.slice().sort(compareReleasesByPublishedFile)[0] || {}));
    }
    const category = categoryFilter?.value || "all";
    const visible = ordered.filter(p =>
      (category === "all" || p.category === category) &&
      [p.name, p.category, p.description, projectField(p, "category"), projectField(p, "description"), p.minecraft, ...(p.features || [])].join(" ").toLowerCase().includes(term)
    );
    grid.innerHTML = visible.map((p, i) => {
      const builds = allBuilds(p.releases);
      return `
      <article id="project-${escapeHtml(p.id)}" class="project-card accent-${escapeHtml(p.accent)}" style="--delay:${i * 45}ms">
        <div class="card-topline">
          <span class="project-category">${escapeHtml(projectField(p, "category"))}</span>
          <div class="card-top-actions">${getProjectBadge(p)}<span class="card-index">${String(projects.indexOf(p) + 1).padStart(2,"0")}</span></div>
        </div>
        <div class="card-main">
          <div class="project-icon">${escapeHtml(p.icon)}</div>
          <div class="project-heading">
            <h3>${escapeHtml(p.name)}</h3>
            <span class="mc-version">Minecraft ${escapeHtml(p.minecraft)}</span>
          </div>
        </div>
        <p class="project-description">${escapeHtml(projectField(p, "description"))}</p>
        <div class="card-bottom">
          <span class="release-preview"><span class="tiny-dot"></span> ${builds.length} ${tr("files")} · ${p.releases.length} ${tr("releases")}</span>
          <div class="card-actions"><button class="icon-action" data-copy="${escapeHtml(p.id)}" title="${escapeHtml(tr("copyLink"))}" aria-label="${escapeHtml(tr("copyLink"))}">⧉</button><button class="icon-action" data-share="${escapeHtml(p.id)}" title="${escapeHtml(tr("share"))}" aria-label="${escapeHtml(tr("share"))}">↗</button><button class="details-button" data-project="${escapeHtml(p.id)}">${escapeHtml(tr("details"))} ${iconSvg.arrow}</button></div>
        </div>
      </article>`;
    }).join("");
    document.getElementById("visibleCount").textContent = `${String(visible.length).padStart(2,"0")} / ${String(projects.length).padStart(2,"0")}`;
    document.getElementById("emptyState").classList.toggle("hidden", visible.length !== 0);
    document.getElementById("projectCount").textContent = projects.length;
    grid.querySelectorAll("[data-project]").forEach(btn => btn.addEventListener("click", () => openProject(btn.dataset.project)));
    grid.querySelectorAll("[data-copy]").forEach(btn => btn.addEventListener("click", () => copyProjectLink(btn.dataset.copy)));
    grid.querySelectorAll("[data-share]").forEach(btn => btn.addEventListener("click", () => shareProject(btn.dataset.share)));
  }


  function buildUtilities(releases) {
    const groups = new Map();
    releases.filter(release => !release.draft).forEach(release => {
      const assets = (release.assets || []).filter(asset => asset.state === "uploaded");
      if (!assets.length) return;
      const title = String(release.name || "").trim();
      const versionOnly = !title || /^v?\d+(?:[._-]\d+)*$/i.test(title);
      const fileBase = String(assets[0].name || "Utility").replace(/\.[^.]+$/, "").replace(/[-_ ]v?\d+(?:[._-]\d+)*.*$/i, "").replace(/[-_]+/g, " ").trim();
      const name = versionOnly ? (fileBase || release.tag_name || "Utility") : title;
      const key = name.toLowerCase();
      if (!groups.has(key)) groups.set(key, {name, releases: []});
      groups.get(key).releases.push(release);
    });
    return [...groups.values()].map((group, index) => ({
      id: "utility-" + makeId(group.name), name: group.name,
      icon: ["⌘", "⚙", "✦", "◇", "↗", "✳"][index % 6],
      category: language === "ru" ? "Утилита" : "Utility",
      description: (group.releases.slice().sort(compareReleasesByPublishedFile)[0]?.body || "").trim() || (language === "ru" ? "Файлы и версии утилиты из GitHub Releases." : "Utility files and versions from GitHub Releases."),
      minecraft: "", accent: accents[index % accents.length], features: [],
      releases: group.releases.sort(compareReleasesByPublishedFile)
    })).sort((a,b) => a.name.localeCompare(b.name, language === "ru" ? "ru" : "en"));
  }

  function renderUtilities(filter = "") {
    const utilityGrid = document.getElementById("utilitiesGrid");
    if (!utilityGrid) return;
    const term = filter.trim().toLowerCase();
    let ordered = utilities.slice();
    if (document.getElementById("utilitiesSort")?.value === "latest") {
      ordered.sort((a,b) => compareReleasesByPublishedFile(b.releases[0] || {}, a.releases[0] || {}));
    }
    const visible = ordered.filter(item => [item.name, item.description, ...item.releases.map(r => r.tag_name || r.name || "")].join(" ").toLowerCase().includes(term));
    utilityGrid.innerHTML = visible.map((item, index) => {
      const builds = allBuilds(item.releases);
      const latest = item.releases.slice().sort(compareReleasesByPublishedFile)[0];
      const version = latest?.tag_name || latest?.name || "";
      return '<article id="utility-' + escapeHtml(item.id) + '" class="project-card accent-' + escapeHtml(item.accent) + ' utility-card" style="--delay:' + (index * 45) + 'ms">' +
        '<div class="card-topline"><span class="project-category">' + (language === "ru" ? "УТИЛИТА" : "UTILITY") + '</span><div class="card-top-actions"><span class="card-index">' + String(index + 1).padStart(2,"0") + '</span></div></div>' +
        '<div class="card-main"><div class="project-icon">' + escapeHtml(item.icon) + '</div><div class="project-heading"><h3>' + escapeHtml(item.name) + '</h3><span class="mc-version">' + escapeHtml(version) + '</span></div></div>' +
        '<p class="project-description">' + escapeHtml(item.description.replace(/[#*_]/g, "").slice(0, 220)) + '</p>' +
        '<div class="card-bottom"><span class="release-preview"><span class="tiny-dot"></span> ' + builds.length + ' ' + tr("files") + ' · ' + item.releases.length + ' ' + tr("releases") + '</span><div class="card-actions"><button class="details-button" data-utility-project="' + escapeHtml(item.id) + '">' + escapeHtml(tr("details")) + ' ' + iconSvg.arrow + '</button></div></div></article>';
    }).join("");
    document.getElementById("utilitiesVisibleCount").textContent = String(visible.length).padStart(2,"0") + " / " + String(utilities.length).padStart(2,"0");
    document.getElementById("utilitiesEmpty").classList.toggle("hidden", visible.length !== 0);
    utilityGrid.querySelectorAll("[data-utility-project]").forEach(button => button.addEventListener("click", () => openProject(button.dataset.utilityProject, utilities)));
  }

  async function initUtilities() {
    const utilityGrid = document.getElementById("utilitiesGrid");
    if (!utilityGrid) return;
    try {
      const releases = await getAllReleases("Utilities");
      utilities = buildUtilities(releases);
      renderUtilities(document.getElementById("utilitiesSearch").value);
    } catch (error) {
      utilityGrid.innerHTML = '<div class="empty-state">' + escapeHtml(tr("utilitiesLoadError")) + ': ' + escapeHtml(error.message) + '. <a href="https://github.com/RqJey/Utilities/releases" target="_blank" rel="noreferrer">GitHub Releases ↗</a></div>';
      document.getElementById("utilitiesVisibleCount").textContent = "00 / 00";
    }
  }

  function getProjectBadge(project) {
    const latest = project.releases.slice().sort(compareReleasesByPublishedFile)[0];
    const date = Date.parse(latest?.published_at || latest?.created_at || 0) || 0;
    const age = date ? Date.now() - date : Infinity;
    if (age < 7 * 86400000) return `<span class="project-badge badge-new">${tr("newBadge")}</span>`;
    if (age < 30 * 86400000) return `<span class="project-badge badge-updated">${tr("updatedBadge")}</span>`;
    const totals = projects.map(p => p.releases.reduce((sum, release) => sum + (release.assets || []).reduce((n, asset) => n + (Number(asset.download_count) || 0), 0), 0));
    const highest = Math.max(0, ...totals);
    const current = project.releases.reduce((sum, release) => sum + (release.assets || []).reduce((n, asset) => n + (Number(asset.download_count) || 0), 0), 0);
    return highest > 0 && current === highest ? `<span class="project-badge badge-popular">${tr("popularBadge")}</span>` : "";
  }

  function projectUrl(project) { return `${location.origin}${location.pathname}#project-${encodeURIComponent(project.id)}`; }
  async function copyProjectLink(id) {
    const project = projects.find(p => p.id === id); if (!project) return;
    try { await navigator.clipboard.writeText(projectUrl(project)); showToast(tr("copied")); }
    catch { showToast(tr("shareError")); }
  }
  async function shareProject(id) {
    const project = projects.find(p => p.id === id); if (!project) return;
    const url = projectUrl(project);
    if (navigator.share) { try { await navigator.share({title:`${project.name} — RqJey Mods`, text:project.description, url}); } catch (e) { if (e.name !== "AbortError") showToast(tr("shareError")); } }
    else copyProjectLink(id);
  }

  function setupNotifications() {
    const button = document.getElementById("notifyButton");
    if (!("Notification" in window)) { button.addEventListener("click", () => showToast(tr("notifyUnsupported"))); return; }
    button.addEventListener("click", async () => {
      if (Notification.permission === "granted") { showToast(tr("notifyEnabled")); return; }
      if (Notification.permission === "denied") { showToast(tr("notifyDenied")); return; }
      const permission = await Notification.requestPermission();
      showToast(permission === "granted" ? tr("notifyEnabled") : tr("notifyDenied"));
      if (permission === "granted") checkNewReleases(true);
    });
  }
  function checkNewReleases(announce = false) {
    if (!("Notification" in window)) return;
    const latestIds = allReleases.map(r => `${r.id}:${(r.assets || []).map(a => `${a.id}-${a.created_at || a.updated_at || ""}`).join(",")}:${r.published_at || r.created_at || ""}`);
    const storageKey = "rqjey-known-releases";
    let known = [];
    try { known = JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch {}
    if (known.length && Notification.permission === "granted") {
      const fresh = allReleases.filter(r => !known.includes(`${r.id}:${(r.assets || []).map(a => `${a.id}-${a.created_at || a.updated_at || ""}`).join(",")}:${r.published_at || r.created_at || ""}`));
      if (fresh.length) {
        const first = fresh[0];
        const mod = getModName(first) || first.name || "RqJey Mods";
        new Notification("RqJey Mods", {body: `${mod}: ${language === "ru" ? "опубликован новый релиз" : "a new release is available"}`});
      }
    }
    localStorage.setItem(storageKey, JSON.stringify(latestIds));
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2800);
  }

  function openProject(id, collection = projects) {
    const project = collection.find(p => p.id === id);
    if (!project) return;
    activeProject = project;
    activeCollection = collection;
    activeReleases = project.releases
      .filter(r => jarAssets(r).length > 0)
      // Сначала релиз с самым поздно опубликованным файлом.
      .sort(compareReleasesByPublishedFile);
    document.getElementById("modalIcon").textContent = project.icon;
    document.getElementById("modalTitle").textContent = project.name;
    document.getElementById("modalSubtitle").textContent = `${projectField(project, "category")} · Minecraft ${project.minecraft}`;
    document.getElementById("modalDescription").innerHTML = renderMarkdown(projectField(project, "description"));
    document.getElementById("downloadCount").textContent = getProjectDownloadCount(project).toLocaleString(language === "ru" ? "ru-RU" : "en-US");
    document.getElementById("releaseCount").textContent = project.releases.length.toLocaleString(language === "ru" ? "ru-RU" : "en-US");
    document.getElementById("releaseInfo").textContent = project.features.join("  ·  ");
    document.getElementById("releaseBody").innerHTML = "";
    select.innerHTML = "";
    fileSelect.innerHTML = `<option>${tr("chooseRelease")}</option>`;
    fileSelect.disabled = true;
    status.textContent = `${allBuilds(activeReleases).length} файлов`;
    status.className = "release-status ready";
    setDownload(null);
    document.getElementById("releaseNotes").classList.add("hidden");
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");

    if (!activeReleases.length) {
      select.innerHTML = `<option value="">${tr("noRelease")}</option>`;
      status.textContent = tr("noBuilds");
      select.disabled = true;
      return;
    }
    activeReleases.forEach((release, i) => {
      const option = document.createElement("option");
      const tag = release.tag_name || release.name || `Релиз ${i + 1}`;
      const count = jarAssets(release).length;
      option.value = String(i);
      option.textContent = `${tag} · ${count} ${count === 1 ? "файл" : count < 5 ? "файла" : "файлов"}`;
      select.appendChild(option);
    });
    select.disabled = false;
    updateSelectedRelease();
  }

  function setDownload(asset) {
    if (!asset) {
      download.href = "#";
      download.classList.add("disabled");
      download.setAttribute("aria-disabled", "true");
      document.getElementById("downloadSize").textContent = "";
      return;
    }
    download.href = asset.browser_download_url;
    download.classList.remove("disabled");
    download.setAttribute("aria-disabled", "false");
    document.getElementById("downloadSize").textContent = formatBytes(asset.size);
  }

  function updateSelectedRelease() {
    const release = activeReleases[Number(select.value)];
    if (!release) return;
    const assets = jarAssets(release);
    fileSelect.innerHTML = "";
    assets.forEach((asset, i) => {
      const option = document.createElement("option");
      option.value = String(i);
      option.textContent = asset.name;
      fileSelect.appendChild(option);
    });
    fileSelect.disabled = assets.length <= 1;
    const notes = document.getElementById("releaseNotes");
    notes.href = release.html_url;
    notes.classList.remove("hidden");
    updateSelectedFile();
  }

  function updateSelectedFile() {
    const release = activeReleases[Number(select.value)];
    if (!release) return;
    const assets = jarAssets(release);
    const asset = assets[Number(fileSelect.value)] || assets[0];
    setDownload(asset);
    const date = release.published_at ? new Date(release.published_at).toLocaleDateString(language === "ru" ? "ru-RU" : "en-US") : "";
    const body = (release.body || "").trim();
    const releaseInfo = [
      date ? `${tr("published")}: ${date}` : "",
      `${assets.length} ${tr("files")}`
    ].filter(Boolean);
    document.getElementById("releaseInfo").textContent = releaseInfo.join(" · ");
    document.getElementById("releaseBody").innerHTML = body ? renderMarkdown(body) : `<p>${escapeHtml(tr("noDescription"))}</p>`;
  }

  function formatBytes(bytes) {
    if (!bytes) return "";
    const units = ["Б", "КБ", "МБ", "ГБ"];
    let n = bytes, i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  function closeModal() {
    modal.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }

  search.addEventListener("input", () => renderProjects(search.value));
  document.getElementById("utilitiesSearch")?.addEventListener("input", event => renderUtilities(event.target.value));
  document.getElementById("utilitiesSort")?.addEventListener("change", () => renderUtilities(document.getElementById("utilitiesSearch").value));
  document.getElementById("themeSelect").addEventListener("change", e => applyTheme(e.target.value));
  document.getElementById("languageSelect").addEventListener("change", e => { language = e.target.value; localStorage.setItem("rqjey-language", language); applyLanguage(); if (activeProject) openProject(activeProject.id, activeCollection); });
  setupNotifications();
  applyTheme(localStorage.getItem("rqjey-theme") || "system");
  applyLanguage();
  categoryFilter?.addEventListener("change", () => renderProjects(search.value));
  sortSelect?.addEventListener("change", () => renderProjects(search.value));
  document.addEventListener("keydown", e => {
    if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault(); search.focus();
    }
  });
  select.addEventListener("change", updateSelectedRelease);
  fileSelect.addEventListener("change", updateSelectedFile);
  document.getElementById("modalClose").addEventListener("click", closeModal);
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
  download.addEventListener("click", e => { if (download.classList.contains("disabled")) e.preventDefault(); });
  document.getElementById("mobileMenu").addEventListener("click", () => {
    const nav = document.querySelector(".nav");
    const opened = nav.classList.toggle("nav-open");
    document.getElementById("mobileMenu").setAttribute("aria-expanded", String(opened));
  });
  document.querySelectorAll(".nav a").forEach(link => link.addEventListener("click", () => {
    document.querySelector(".nav").classList.remove("nav-open");
    document.getElementById("mobileMenu").setAttribute("aria-expanded", "false");
  }));

  async function init() {
    document.getElementById("year").textContent = new Date().getFullYear();
    if (owner) {
      const releasesPage = `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(SITE_CONFIG.releasesRepo || "Minecraft-Mods")}/releases`;
      document.getElementById("githubProfile").href = releasesPage;
      document.getElementById("heroGithub").href = releasesPage;
    }
    grid.innerHTML = '<div class="empty-state">Загрузка списка модов из GitHub Releases...</div>';
    initUtilities();
    try {
      allReleases = await getAllReleases();
      projects = buildProjects(allReleases);
      const categories = [...new Set(projects.map(p => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ru"));
      categoryFilter.innerHTML = `<option value="all">${escapeHtml(tr("allCategories"))}</option>` + categories.map(category => { const translated = language === "en" ? ({"Персонализация":"Personalization","Навигация":"Navigation","Защита":"Protection","Общение":"Communication","Инструменты":"Tools"}[category] || category) : category; return `<option value="${escapeHtml(category)}">${escapeHtml(translated)}</option>`; }).join("");
      renderProjects();
      checkNewReleases();
    } catch (err) {
      grid.innerHTML = `<div class="empty-state">${tr("loadError")}: ${escapeHtml(err.message)}. ${language === "ru" ? "Проверь настройки config.js и публичный доступ к репозиторию." : "Check config.js and public repository access."}</div>`;
      document.getElementById("projectCount").textContent = "0";
      document.getElementById("visibleCount").textContent = "00 / 00";
      showToast(err.message);
    }
  }

  // Premium motion layer: reveal sections on scroll and add a subtle pointer glow to cards.
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    const revealTargets = document.querySelectorAll(".projects-section, .section-heading, .filter-bar, .about-strip, .footer");
    revealTargets.forEach((el, index) => {
      el.classList.add("js-reveal");
      el.style.transitionDelay = `${Math.min(index * 65, 260)}ms`;
      revealObserver.observe(el);
    });
    const cardObserver = new MutationObserver(() => {
      document.querySelectorAll(".project-card:not([data-reveal-ready])").forEach((card, index) => {
        card.dataset.revealReady = "true";
        card.classList.add("js-reveal");
        card.style.transitionDelay = `${Math.min(index % 6 * 55, 275)}ms`;
        revealObserver.observe(card);
      });
    });
    cardObserver.observe(grid, { childList: true });
  }
  if (!reduceMotion && window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    grid.addEventListener("pointermove", event => {
      const card = event.target.closest(".project-card");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--pointer-x", `${event.clientX - rect.left}px`);
      card.style.setProperty("--pointer-y", `${event.clientY - rect.top}px`);
    }, { passive: true });
  }

  init();
})();
