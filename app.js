(() => {
  const config = window.SITE_CONFIG || {};
  const owner = (config.owner || "").trim();
  const releasesRepo = (config.releasesRepo || "Minecraft-Mods").trim();
  const projectMetadata = config.projects || [];
  const grid = document.getElementById("projectGrid");
  const search = document.getElementById("searchInput");
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

  const iconSvg = {
    arrow: '<svg viewBox="0 0 24 24"><path d="M7 17 17 7M7 7h10v10"/></svg>'
  };
  const fallbackIcons = ["✳", "⌖", "◇", "⌘", "↗", "✦", "◈"];
  const accents = ["violet", "blue", "green", "purple", "orange"];

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
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

  async function getAllReleases() {
    if (!owner || owner === "YOUR_GITHUB_USERNAME") throw new Error("Не указан GitHub username в config.js");
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(releasesRepo)}/releases?per_page=100`;
    const response = await fetch(url, {
      cache: "no-store",
      headers: { "Accept": "application/vnd.github+json" }
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Репозиторий ${releasesRepo} не найден или он приватный`);
      if (response.status === 403) throw new Error("GitHub API временно ограничил запросы");
      throw new Error(`GitHub вернул ошибку ${response.status}`);
    }
    return response.json();
  }

  function jarAssets(release) {
    return release.assets || [];
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
    }).sort((a,b) => a.name.localeCompare(b.name, "ru"));
  }

  function renderProjects(filter = "") {
    const term = filter.trim().toLowerCase();
    const visible = projects.filter(p => [p.name, p.category, p.description, p.minecraft].join(" ").toLowerCase().includes(term));
    grid.innerHTML = visible.map((p, i) => {
      const builds = allBuilds(p.releases);
      return `
      <article class="project-card accent-${escapeHtml(p.accent)}" style="--delay:${i * 45}ms">
        <div class="card-topline">
          <span class="project-category">${escapeHtml(p.category)}</span>
          <span class="card-index">${String(projects.indexOf(p) + 1).padStart(2,"0")}</span>
        </div>
        <div class="card-main">
          <div class="project-icon">${escapeHtml(p.icon)}</div>
          <div class="project-heading">
            <h3>${escapeHtml(p.name)}</h3>
            <span class="mc-version">Minecraft ${escapeHtml(p.minecraft)}</span>
          </div>
        </div>
        <p class="project-description">${escapeHtml(p.description)}</p>
        <div class="card-bottom">
          <span class="release-preview"><span class="tiny-dot"></span> ${builds.length} файлов · ${p.releases.length} релизов</span>
          <button class="details-button" data-project="${escapeHtml(p.id)}">Подробнее ${iconSvg.arrow}</button>
        </div>
      </article>`;
    }).join("");
    document.getElementById("visibleCount").textContent = `${String(visible.length).padStart(2,"0")} / ${String(projects.length).padStart(2,"0")}`;
    document.getElementById("emptyState").classList.toggle("hidden", visible.length !== 0);
    document.getElementById("projectCount").textContent = projects.length;
    grid.querySelectorAll("[data-project]").forEach(btn => btn.addEventListener("click", () => openProject(btn.dataset.project)));
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2800);
  }

  function openProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    activeProject = project;
    activeReleases = project.releases.filter(r => jarAssets(r).length > 0);
    document.getElementById("modalIcon").textContent = project.icon;
    document.getElementById("modalTitle").textContent = project.name;
    document.getElementById("modalSubtitle").textContent = `${project.category} · Minecraft ${project.minecraft}`;
    document.getElementById("modalDescription").textContent = project.description;
    document.getElementById("releaseInfo").textContent = project.features.join("  ·  ");
    select.innerHTML = "";
    fileSelect.innerHTML = '<option>Сначала выбери релиз</option>';
    fileSelect.disabled = true;
    status.textContent = `${allBuilds(activeReleases).length} файлов`;
    status.className = "release-status ready";
    setDownload(null);
    document.getElementById("releaseNotes").classList.add("hidden");
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");

    if (!activeReleases.length) {
      select.innerHTML = '<option value="">Нет релизов с .jar файлами</option>';
      status.textContent = "Нет сборок";
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
    const date = release.published_at ? new Date(release.published_at).toLocaleDateString("ru-RU") : "";
    const body = (release.body || "").trim();
    const releaseInfo = [
      date ? `Опубликовано: ${date}` : "",
      `${assets.length} ${assets.length === 1 ? "файл" : assets.length < 5 ? "файла" : "файлов"} в этом релизе`,
      body ? body.slice(0, 500) : "Описание релиза не добавлено."
    ].filter(Boolean);
    document.getElementById("releaseInfo").textContent = releaseInfo.join(" · ");
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
  select.addEventListener("change", updateSelectedRelease);
  fileSelect.addEventListener("change", updateSelectedFile);
  document.getElementById("modalClose").addEventListener("click", closeModal);
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
  download.addEventListener("click", e => { if (download.classList.contains("disabled")) e.preventDefault(); });
  document.getElementById("mobileMenu").addEventListener("click", () => {
    document.querySelector(".nav").classList.toggle("nav-open");
  });

  async function init() {
    document.getElementById("year").textContent = new Date().getFullYear();
    if (owner) {
      const profile = `https://github.com/${encodeURIComponent(owner)}`;
      document.getElementById("githubProfile").href = profile;
      document.getElementById("sourceLink").href = profile;
    }
    grid.innerHTML = '<div class="empty-state">Загрузка списка модов из GitHub Releases...</div>';
    try {
      allReleases = await getAllReleases();
      projects = buildProjects(allReleases);
      renderProjects();
    } catch (err) {
      grid.innerHTML = `<div class="empty-state">Не удалось загрузить релизы: ${escapeHtml(err.message)}. Проверь настройки config.js и публичный доступ к репозиторию.</div>`;
      document.getElementById("projectCount").textContent = "0";
      document.getElementById("visibleCount").textContent = "00 / 00";
      showToast(err.message);
    }
  }

  init();
})();
