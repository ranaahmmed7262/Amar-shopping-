/* Unified Amar Shopping admin workspace. Existing panel actions, permissions and data flows remain authoritative. */
(function () {
  "use strict";

  const EXPECTED = 16;
  const GROUPS = [
    { title: "Overview & Master Control", icon: "📊", ids: ["adminOverview", "adminMasterControl"] },
    { title: "Marketplace & Products", icon: "🛍️", ids: ["pendingProducts", "manageProducts", "categoryManager", "pendingSellers"] },
    { title: "Orders & Customers", icon: "📦", ids: ["allOrders", "adminChats", "customerList"] },
    { title: "Website & Operations", icon: "⚙️", ids: ["siteSettingsForm", "adminDelivery", "roleManager"] },
    { title: "Finance & Reports", icon: "📈", ids: ["commissionReport", "exportOrdersCsv"] },
    { title: "System & Platform", icon: "🛡️", ids: ["adminHealth", "platformControlCenter"] }
  ];
  const STYLE_ID = "amar-admin-workspace-unified-style";
  let observer = null;

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
    const status = dashboard.querySelector(".amar-admin-menu-status");
    if (status) status.textContent = "খোলা বিভাগ: " + source.textContent.trim() + " · মেনু খোলা থাকবে";
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
    const heading = document.createElement("h4");
    heading.textContent = "🔐 Admin Control Center";
    const hint = document.createElement("small");
    hint.className = "amar-admin-menu-hint";
    hint.textContent = "একই মেনু খোলা রেখে যেকোনো বিভাগে কাজ করুন";
    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "Control খুঁজুন...";
    search.setAttribute("aria-label", "Search admin controls");
    const orderButton = document.createElement("button");
    orderButton.type = "button";
    orderButton.className = "amar-admin-order-entry";
    orderButton.textContent = "📦 Order Management · Live";
    orderButton.addEventListener("click", () => selectPanel(dashboard, "allOrders"));
    const status = document.createElement("small");
    status.className = "amar-admin-menu-hint amar-admin-menu-status";
    status.setAttribute("role", "status");
    status.textContent = "সব Admin control এই মেনুর ভেতরে";
    content.append(heading, hint, search, orderButton);

    const entries = [];
    GROUPS.forEach(group => {
      const details = document.createElement("details");
      details.open = group.title === "Orders & Customers";
      const summary = document.createElement("summary");
      summary.textContent = group.icon + "  " + group.title;
      const items = document.createElement("div");
      items.className = "amar-admin-items";
      group.ids.forEach(id => {
        const source = sources.find(button => button.dataset.adminJump === id);
        if (!source) return;
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.adminTarget = id;
        button.textContent = source.textContent.trim();
        button.addEventListener("click", () => selectPanel(dashboard, id));
        items.appendChild(button);
        entries.push(button);
      });
      if (items.children.length) {
        details.append(summary, items);
        content.appendChild(details);
      }
    });
    search.addEventListener("input", () => {
      const term = search.value.trim().toLocaleLowerCase();
      entries.forEach(button => { button.hidden = !!term && !button.textContent.toLocaleLowerCase().includes(term); });
      content.querySelectorAll("details").forEach(details => {
        const visible = [...details.querySelectorAll("button")].some(button => !button.hidden);
        details.hidden = !!term && !visible;
        if (term && visible) details.open = true;
      });
      orderButton.hidden = !!term && !"order management live orders".includes(term);
    });
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

  function start() {
    installHamburgerBehavior();
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
