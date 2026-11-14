/* Unified Amar Shopping admin workspace. Existing panel actions, permissions and data flows remain authoritative. */
(function () {
  "use strict";

  const EXPECTED = 16;
  const GROUPS = [
    { code: "01", title: "Orders & Customer Care", icon: "🤝", items: [
      { id: "adminChats", code: "01.01", label: "Customer Support Desk", keywords: "message chat help support inbox" },
      { id: "customerList", code: "01.02", label: "Customer Directory", keywords: "buyer customer list profile phone" }
    ]},
    { code: "02", title: "Marketplace Management", icon: "🛍️", items: [
      { id: "pendingProducts", code: "02.01", label: "Product Approval", keywords: "pending review approve reject" },
      { id: "manageProducts", code: "02.02", label: "Product Catalog", keywords: "all products inventory stock edit" },
      { id: "categoryManager", code: "02.03", label: "Category Management", keywords: "category collection taxonomy" },
      { id: "pendingSellers", code: "02.04", label: "Seller Applications", keywords: "seller vendor shop request approval" }
    ]},
    { code: "03", title: "Store & Checkout Settings", icon: "⚙️", items: [
      { id: "siteSettingsForm", code: "03.01", label: "Website & Store Settings", keywords: "website identity banner contact seo" },
      { id: "adminDelivery", code: "03.02", label: "Payment & Delivery", keywords: "payment bkash nagad cod shipping fee" },
      { id: "roleManager", code: "03.03", label: "User & Seller Roles", keywords: "access permission role account" }
    ]},
    { code: "04", title: "Finance & Business Reports", icon: "💰", items: [
      { id: "commissionReport", code: "04.01", label: "Commission & Earnings", keywords: "seller commission finance payout" },
      { id: "exportOrdersCsv", code: "04.02", label: "Sales Reports & CSV", keywords: "report analytics export excel download" }
    ]},
    { code: "05", title: "System & Infrastructure", icon: "🛡️", items: [
      { id: "adminHealth", code: "05.01", label: "System Health Monitor", keywords: "health status check diagnostics" },
      { id: "platformControlCenter", code: "05.02", label: "Hosting & Platform Control", keywords: "render github supabase server deploy" }
    ]},
    { code: "06", title: "Master Operations", icon: "🌐", items: [
      { id: "adminMasterControl", code: "06.01", label: "All-in-One Master Control", keywords: "central control operations shortcut" }
    ]}
  ];
  const OVERVIEW_ENTRY = { id: "adminOverview", code: "00.01", label: "Business Overview", keywords: "dashboard overview business summary kpi calculation" };
  const DASHBOARD_ENTRY = { id: "allOrders", code: "00.02", label: "Order Management Desk", keywords: "order orders live list tracking serial filter" };
  const FAVORITES_KEY = "amar-admin-favorites-v3";
  const RECENTS_KEY = "amar-admin-recents-v3";
  const ALL_ENTRIES = [OVERVIEW_ENTRY, DASHBOARD_ENTRY, ...GROUPS.flatMap(group => group.items)];
  const STYLE_ID = "amar-admin-workspace-unified-style";
  let observer = null;

  function readList(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value.filter(id => ALL_ENTRIES.some(item => item.id === id)) : [];
    } catch (_) { return []; }
  }
  function writeList(key, values) {
    try { localStorage.setItem(key, JSON.stringify(values)); } catch (_) {}
  }
  function recordRecent(id) {
    writeList(RECENTS_KEY, [id, ...readList(RECENTS_KEY).filter(item => item !== id)].slice(0, 5));
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* Keep the storefront/customer drawer available above the Admin workspace. */
      body.amar-admin-workspace-active.menu-open .side-shade { display:block!important; }
      body.amar-admin-workspace-active.menu-open .side-drawer { display:flex!important; }
      #dashContent:has(>.amar-global-admin-menu) {
        display:grid!important;
        grid-template-columns:minmax(225px,270px) minmax(0,1fr)!important;
        align-items:start; column-gap:14px; row-gap:0;
      }
      #dashContent>.admin-shell { display:none!important; }
      #dashContent>.amar-global-admin-menu {
        grid-column:1; grid-row:1 / span 80; position:sticky; top:10px;
        align-self:start; max-height:calc(100dvh - 20px); overflow:auto;
        padding:12px; border:1px solid #d8e8de; border-radius:15px;
        background:linear-gradient(180deg,#f7fbf8,#edf6f0);
        box-shadow:0 5px 20px #123b2b12; z-index:5;
      }
      #dashContent>.admin-home-panel,#dashContent>.admin-panel {
        grid-column:2!important; grid-row:auto; min-width:0!important;
        width:100%!important; margin:0 0 14px!important; scroll-margin-top:12px;
      }
      #dashContent>.amar-global-admin-menu h4 { margin:0 0 9px; color:#075b43; font-size:14px; }
      #dashContent>.amar-global-admin-menu .amar-admin-menu-hint { display:block; margin:0 0 10px; color:#63796d; font-size:10px; line-height:1.5; }
      #dashContent>.amar-global-admin-menu input { width:100%; box-sizing:border-box; padding:10px; border:1px solid #d5e3da; border-radius:9px; background:#fff; margin:0 0 10px; }
      #dashContent>.amar-global-admin-menu .amar-admin-order-entry {
        width:100%; margin:0 0 9px; padding:11px; border:1px solid #a9d9be;
        border-radius:10px; background:#e4f5eb; color:#075b43; text-align:left; font-weight:850;
      }
      #dashContent>.amar-global-admin-menu details { margin:7px 0; border:1px solid #dce8e0; border-radius:10px; background:#fff; overflow:hidden; }
      #dashContent>.amar-global-admin-menu summary { padding:11px 10px; cursor:pointer; color:#174c38; font-weight:850; font-size:12px; }
      #dashContent>.amar-global-admin-menu .amar-admin-items { display:grid; gap:5px; padding:0 7px 8px; }
      #dashContent>.amar-global-admin-menu .amar-admin-items button {
        width:100%; min-height:38px; padding:8px 9px; border:1px solid #e5eee8;
        border-radius:8px; background:#f7faf8; color:#244b39; text-align:left;
        font-size:11px; font-weight:700; line-height:1.4;
      }
      #dashContent>.amar-global-admin-menu .amar-admin-items button:hover,
      #dashContent>.amar-global-admin-menu .amar-admin-items button.active {
        background:#dff3e7; border-color:#8fc9a8; color:#064b36;
        box-shadow:inset 3px 0 #28a56f;
      }
      #dashContent>.amar-global-admin-menu .amar-admin-command-title { display:flex; align-items:center; justify-content:space-between; gap:8px; margin:4px 0 9px; color:#075b43; font-size:14px; font-weight:900; }
      #dashContent>.amar-global-admin-menu .amar-admin-kicker { font-size:9px; letter-spacing:1px; color:#6a8376; font-weight:800; }
      #dashContent>.amar-global-admin-menu .amar-admin-shortcuts { display:grid; gap:5px; margin:5px 0 10px; }
      #dashContent>.amar-global-admin-menu .amar-admin-shortcuts button { width:100%; text-align:left; padding:8px 9px; border:1px solid #dce9e1; border-radius:8px; background:#fff; color:#174c38; font-size:10px; font-weight:750; }
      #dashContent>.amar-global-admin-menu .amar-admin-shortcuts button:hover { background:#e5f5eb; border-color:#8fc9a8; }
      #dashContent>.amar-global-admin-menu .amar-admin-entry { display:grid; grid-template-columns:minmax(0,1fr) 30px; gap:4px; }
      #dashContent>.amar-global-admin-menu .amar-admin-entry button { min-width:0; }
      #dashContent>.amar-global-admin-menu .amar-admin-entry .amar-admin-fav { width:30px; min-height:36px; padding:4px; border:1px solid #e5eee8; border-radius:8px; background:#fff; color:#98721b; }
      #dashContent>.amar-global-admin-menu summary .amar-admin-group-code { display:inline-block; margin-right:5px; color:#087f5b; font-size:10px; }
      #dashContent>.amar-global-admin-menu .amar-admin-code { display:inline-block; min-width:38px; margin-right:5px; color:#087f5b; font-size:10px; font-weight:900; }
      #dashContent>.amar-global-admin-menu .amar-admin-search-hint { margin:-4px 0 8px; color:#71857a; font-size:9px; }
      #dashContent>.amar-global-admin-menu .amar-admin-section-label { margin:10px 0 4px; color:#71857a; font-size:9px; font-weight:900; letter-spacing:.8px; }
      #dashContent>.amar-global-admin-menu .amar-admin-order-entry { display:flex; align-items:center; justify-content:space-between; gap:5px; }
      #dashContent>.amar-global-admin-menu .amar-admin-order-entry small { font-size:9px; opacity:.75; }

      #dashContent>.amar-global-admin-menu [hidden] { display:none!important; }
      body.amar-admin-nav-collapsed #dashContent:has(>.amar-global-admin-menu) {
        grid-template-columns:54px minmax(0,1fr)!important;
      }
      body.amar-admin-nav-collapsed #dashContent>.amar-global-admin-menu { padding:8px 5px; overflow:hidden; }
      body.amar-admin-nav-collapsed #dashContent>.amar-global-admin-menu .amar-admin-menu-content { display:none!important; }
      #dashContent>.amar-global-admin-menu .amar-admin-collapse {
        width:100%; min-height:38px; border:1px solid #cfe2d6; border-radius:9px;
        background:#fff; color:#075b43; font-size:18px; font-weight:900; cursor:pointer;
      }
      @media(max-width:700px) {
        #dashContent:has(>.amar-global-admin-menu) { grid-template-columns:minmax(138px,40%) minmax(0,1fr)!important; column-gap:8px; }
        #dashContent>.amar-global-admin-menu { padding:8px 6px; max-height:calc(100dvh - 12px); }
        #dashContent>.amar-global-admin-menu summary { padding:9px 6px; font-size:10px; }
        #dashContent>.amar-global-admin-menu .amar-admin-items { padding:0 4px 6px; }
        #dashContent>.amar-global-admin-menu .amar-admin-items button { padding:8px 6px; font-size:10px; overflow-wrap:anywhere; }
        #dashContent>.admin-home-panel,#dashContent>.admin-panel { overflow-x:auto; }
        #dashContent>.amar-global-admin-menu .amar-admin-order-entry { padding:9px 6px; font-size:11px; }
        body.amar-admin-nav-collapsed #dashContent:has(>.amar-global-admin-menu) { grid-template-columns:44px minmax(0,1fr)!important; }
      }
    `;
    document.head.appendChild(style);
  }

  function getSources(dashboard) {
    const nav = dashboard?.querySelector(".admin-shell .admin-control-nav");
    return nav ? [...nav.querySelectorAll("[data-admin-jump]")] : [];
  }

  function selectPanel(dashboard, id) {
    const home = dashboard.querySelector("#adminPanel-adminHome");
    const source = getSources(dashboard).find(button => button.dataset.adminJump === id);
    const target = dashboard.querySelector("#" + CSS.escape(id));
    const panel = target?.closest(".admin-panel");
    if (!source || !target || !panel) {
      const status = dashboard.querySelector(".amar-admin-menu-status");
      if (status) status.textContent = "এই control-এর panel পাওয়া যায়নি — refresh করে আবার চেষ্টা করুন।";
      return false;
    }

    // Preserve the original permission-aware navigation callback, then enforce a single visible workspace panel.
    source.click();
    if (id === "allOrders") {
      dashboard.querySelectorAll(".admin-panel").forEach(item => { item.hidden = true; });
      if (home) home.hidden = false;
      const orderDesk = home?.querySelector("#amarDedicatedOrderDashboard");
      const legacyOrders = dashboard.querySelector("#adminPanel-allOrders");
      if (!orderDesk && legacyOrders) {
        home && (home.hidden = true);
        legacyOrders.hidden = false;
      }
      requestAnimationFrame(() => (orderDesk || legacyOrders || home)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } else {
      dashboard.querySelectorAll(".admin-panel").forEach(item => { item.hidden = item !== panel; });
      if (home) home.hidden = true;
      requestAnimationFrame(() => panel.scrollIntoView({ behavior: "smooth", block: "start" }));
    }

    dashboard.querySelectorAll(".amar-admin-items button[data-admin-target]").forEach(button => {
      button.classList.toggle("active", button.dataset.adminTarget === id);
      button.setAttribute("aria-current", button.dataset.adminTarget === id ? "page" : "false");
    });
    recordRecent(id);
    const menu = dashboard.querySelector(":scope > .amar-global-admin-menu");
    if (menu?._refreshShortcuts) menu._refreshShortcuts();
    const status = dashboard.querySelector(".amar-admin-menu-status");
    if (status) {
      const entry = ALL_ENTRIES.find(item => item.id === id);
      status.textContent = "খোলা: " + (entry ? entry.code + " · " + entry.label : source.textContent.trim()) + " · Menu stays open";
    }
    document.body.classList.add("amar-admin-workspace-active");
    document.body.classList.remove("amar-admin-nav-collapsed", "menu-open");
    return true;
  }

  function build(dashboard) {
    const settings = document.getElementById("adminMenuSettings");
    const sources = getSources(dashboard);
    if (!settings || settings.classList.contains("hidden") || sources.length < EXPECTED) return;

    const existing = dashboard.querySelector(":scope > .amar-global-admin-menu");
    const signature = sources.map(button => button.dataset.adminJump).join("|");
    if (existing?.dataset.signature === signature) {
      document.body.classList.add("amar-admin-workspace-active");
      return;
    }
    existing?.remove();
    installStyle();

    const section = document.createElement("aside");
    section.className = "amar-global-admin-menu";
    section.dataset.signature = signature;
    section.setAttribute("aria-label", "Admin Control Center navigation");

    const collapse = document.createElement("button");
    collapse.type = "button";
    collapse.className = "amar-admin-collapse";
    collapse.textContent = "☰";
    collapse.setAttribute("aria-label", "Admin menu collapse or expand");
    collapse.addEventListener("click", () => {
      document.body.classList.toggle("amar-admin-nav-collapsed");
    });
    section.appendChild(collapse);

    const content = document.createElement("div");
    content.className = "amar-admin-menu-content";
    const heading = document.createElement("div");
    heading.className = "amar-admin-command-title";
    heading.innerHTML = "<span>⚡ SMART COMMAND CENTER</span><span class='amar-admin-kicker'>OWNER WORKSPACE</span>";
    const hint = document.createElement("small");
    hint.className = "amar-admin-menu-hint";
    hint.textContent = "Code, নাম বা কাজ লিখে যেকোনো control খুলুন";
    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "⌕ Search · Ctrl + K";
    search.setAttribute("aria-label", "Search admin controls by code, name or action");
    search.setAttribute("autocomplete", "off");

    const dashboardButton = document.createElement("button");
    dashboardButton.type = "button";
    dashboardButton.className = "amar-admin-order-entry";
    dashboardButton.innerHTML = "<span>🚚 Order Management Desk</span><small>00.02</small>";
    dashboardButton.addEventListener("click", () => selectPanel(dashboard, DASHBOARD_ENTRY.id));
    const teamButton = document.createElement("button");
    teamButton.type = "button";
    teamButton.className = "amar-admin-order-entry";
    teamButton.innerHTML = "<span>👥 Team Operations</span><small>00.03</small>";
    teamButton.addEventListener("click", () => {
      const home = dashboard.querySelector("#adminPanel-adminHome");
      dashboard.querySelectorAll(".admin-panel").forEach(item => { item.hidden = true; });
      if (home) home.hidden = false;
      document.body.classList.add("amar-admin-workspace-active");
      document.body.classList.remove("amar-admin-nav-collapsed", "menu-open");
      requestAnimationFrame(() => (home?.querySelector("#amarTeamManager") || home)?.scrollIntoView({behavior:"smooth",block:"start"}));
      recordRecent("teamOperations");
      const status = dashboard.querySelector(".amar-admin-menu-status");
      if (status) status.textContent = "খোলা: 00.03 · Team Operations · Menu stays open";
    });
    const overviewButton = document.createElement("button");
    overviewButton.type = "button";
    overviewButton.className = "amar-admin-order-entry";
    overviewButton.innerHTML = "<span>📊 Business Overview</span><small>00.01</small>";
    overviewButton.addEventListener("click", () => selectPanel(dashboard, OVERVIEW_ENTRY.id));

    const favTitle = document.createElement("div");
    favTitle.className = "amar-admin-section-label";
    favTitle.textContent = "★ MY FAVOURITES";
    const favArea = document.createElement("div");
    favArea.className = "amar-admin-shortcuts";
    favArea.setAttribute("aria-label", "Favourite admin controls");
    const recentTitle = document.createElement("div");
    recentTitle.className = "amar-admin-section-label";
    recentTitle.textContent = "↻ RECENTLY OPENED";
    const recentArea = document.createElement("div");
    recentArea.className = "amar-admin-shortcuts";
    recentArea.setAttribute("aria-label", "Recently opened admin controls");

    const status = document.createElement("small");
    status.className = "amar-admin-menu-hint amar-admin-menu-status";
    status.setAttribute("role", "status");
    status.textContent = "সব Admin control এই মেনুর ভেতরে";
    content.append(heading, hint, search, overviewButton, dashboardButton, teamButton, favTitle, favArea, recentTitle, recentArea);

    const entries = [];
    const entryRows = [];
    const entryMap = new Map();
    ALL_ENTRIES.forEach(item => entryMap.set(item.id, item));

    function renderShortcutArea(area, ids, emptyText) {
      area.innerHTML = "";
      const unique = ids.filter((id, index) => ids.indexOf(id) === index).slice(0, 5);
      if (!unique.length) {
        const empty = document.createElement("small");
        empty.className = "amar-admin-menu-hint";
        empty.textContent = emptyText;
        area.appendChild(empty);
        return;
      }
      unique.forEach(id => {
        const item = entryMap.get(id);
        if (!item) return;
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = item.code + "  ·  " + item.label;
        button.addEventListener("click", () => selectPanel(dashboard, item.id));
        area.appendChild(button);
      });
    }
    function renderShortcuts() {
      renderShortcutArea(favArea, readList(FAVORITES_KEY), "কোনো Favourite নেই — ★ চাপ দিয়ে যোগ করুন");
      renderShortcutArea(recentArea, readList(RECENTS_KEY), "এখনো কোনো control খোলা হয়নি");
      favTitle.hidden = !readList(FAVORITES_KEY).length;
      recentTitle.hidden = !readList(RECENTS_KEY).length;
    }
    section._refreshShortcuts = renderShortcuts;

    GROUPS.forEach(group => {
      const details = document.createElement("details");
      details.open = group.code === "01";
      const summary = document.createElement("summary");
      summary.innerHTML = "<span class='amar-admin-group-code'>" + group.code + "</span>" + group.icon + "  " + group.title;
      const items = document.createElement("div");
      items.className = "amar-admin-items";
      group.items.forEach(item => {
        const source = sources.find(button => button.dataset.adminJump === item.id);
        if (!source) return;
        const row = document.createElement("div");
        row.className = "amar-admin-entry";
        row.dataset.adminSearch = (item.code + " " + item.label + " " + item.keywords + " " + source.textContent).toLocaleLowerCase();
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.adminTarget = item.id;
        button.innerHTML = "<span class='amar-admin-code'>" + item.code + "</span>" + item.label;
        button.title = item.label + " · " + item.code;
        button.addEventListener("click", () => selectPanel(dashboard, item.id));
        const fav = document.createElement("button");
        fav.type = "button";
        fav.className = "amar-admin-fav";
        fav.setAttribute("aria-label", "Add or remove favourite: " + item.label);
        function updateFav() {
          const active = readList(FAVORITES_KEY).includes(item.id);
          fav.textContent = active ? "★" : "☆";
          fav.setAttribute("aria-pressed", String(active));
          fav.title = active ? "Remove favourite" : "Add to favourites";
        }
        updateFav();
        fav.addEventListener("click", () => {
          const current = readList(FAVORITES_KEY);
          const next = current.includes(item.id) ? current.filter(id => id !== item.id) : [item.id, ...current].slice(0, 10);
          writeList(FAVORITES_KEY, next);
          updateFav();
          renderShortcuts();
        });
        row.append(button, fav);
        items.appendChild(row);
        entries.push({ button, row, item });
        entryRows.push(row);
      });
      if (items.children.length) {
        details.append(summary, items);
        content.appendChild(details);
      }
    });

    search.addEventListener("input", () => {
      const term = search.value.trim().toLocaleLowerCase();
      entries.forEach(({row}) => { row.hidden = !!term && !row.dataset.adminSearch.includes(term); });
      content.querySelectorAll("details").forEach(details => {
        const visible = [...details.querySelectorAll(".amar-admin-entry")].some(row => !row.hidden);
        details.hidden = !!term && !visible;
        if (term && visible) details.open = true;
      });
      dashboardButton.hidden = !!term && !(DASHBOARD_ENTRY.code + " " + DASHBOARD_ENTRY.label + " " + DASHBOARD_ENTRY.keywords).toLocaleLowerCase().includes(term);
      overviewButton.hidden = !!term && !(OVERVIEW_ENTRY.code + " " + OVERVIEW_ENTRY.label + " " + OVERVIEW_ENTRY.keywords).toLocaleLowerCase().includes(term);
      favTitle.hidden = !!term || !readList(FAVORITES_KEY).length;
      favArea.hidden = !!term || !readList(FAVORITES_KEY).length;
      recentTitle.hidden = !!term || !readList(RECENTS_KEY).length;
      recentArea.hidden = !!term || !readList(RECENTS_KEY).length;
    });
    renderShortcuts();
    content.appendChild(status);
    section.appendChild(content);
    dashboard.insertBefore(section, dashboard.firstChild);
    document.body.classList.add("amar-admin-workspace-active");
    document.body.classList.remove("menu-open", "amar-admin-nav-collapsed");
  }

  function watch() {
    const dashboard = document.getElementById("dashContent");
    if (!dashboard) return;
    if (observer) observer.disconnect();
    observer = new MutationObserver(() => {
      const root = document.getElementById("dashContent");
      if (root) build(root);
      else document.body.classList.remove("amar-admin-workspace-active", "amar-admin-nav-collapsed");
    });
    observer.observe(dashboard, { childList: true, subtree: true });
    build(dashboard);
  }

  function installHamburgerBehavior() {
    // Delegate at document capture phase so earlier/later drawer handlers cannot
    // swallow the Admin toggle. Outside a verified Admin session, leave the
    // storefront hamburger's original drawer behavior untouched.
    if (document.documentElement.dataset.amarAdminHamburgerFix === "1") return;
    document.documentElement.dataset.amarAdminHamburgerFix = "1";
    document.addEventListener("click", event => {
      const trigger = event.target?.closest?.(".amar-admin-collapse");
      if (!trigger || !document.body.classList.contains("amar-admin-workspace-active")) return;
      const settings = document.getElementById("adminMenuSettings");
      if (!settings || settings.classList.contains("hidden")) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const collapsed = document.body.classList.toggle("amar-admin-nav-collapsed");
      document.body.classList.remove("menu-open");
      const expanded = String(!collapsed);
      document.getElementById("menuTrigger")?.setAttribute("aria-expanded", expanded);
      trigger.setAttribute("aria-expanded", expanded);
      trigger.setAttribute("aria-label", collapsed ? "Admin menu expand" : "Admin menu collapse");
    }, true);
  }

  function installCommandPalette() {
    if (document.documentElement.dataset.amarAdminCommandPalette === "1") return;
    document.documentElement.dataset.amarAdminCommandPalette = "1";
    document.addEventListener("keydown", event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        const settings = document.getElementById("adminMenuSettings");
        const search = document.querySelector("#dashContent > .amar-global-admin-menu input[type='search']");
        if (!settings || settings.classList.contains("hidden") || !search) return;
        event.preventDefault();
        search.focus();
        search.select();
      }
      if (event.key === "Escape") {
        const search = document.querySelector("#dashContent > .amar-global-admin-menu input[type='search']");
        if (search && document.activeElement === search) {
          search.value = "";
          search.dispatchEvent(new Event("input", { bubbles: true }));
          search.blur();
        }
      }
    });
  }

  function start() {
    installHamburgerBehavior();
    installCommandPalette();
    watch();
    const settings = document.getElementById("adminMenuSettings");
    if (settings && !settings.dataset.amarWorkspaceAuthObserver) {
      settings.dataset.amarWorkspaceAuthObserver = "1";
      new MutationObserver(() => {
        if (settings.classList.contains("hidden")) {
          document.body.classList.remove("amar-admin-workspace-active", "amar-admin-nav-collapsed");
          document.querySelector("#dashContent > .amar-global-admin-menu")?.remove();
        } else {
          const dashboard = document.getElementById("dashContent");
          if (dashboard) build(dashboard);
        }
      }).observe(settings, { attributes: true, attributeFilter: ["class", "hidden"] });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
