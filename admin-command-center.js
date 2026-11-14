/* Additive Admin Command Center enhancements. Reuses existing panels and permissions. */
(function(){
"use strict";
const STYLE_ID="amar-admin-command-style";
function installStyle(){
 if(document.getElementById(STYLE_ID))return;
 const s=document.createElement("style");s.id=STYLE_ID;
 s.textContent="#dashContent .amar-admin-tools{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin:12px 0;padding:11px;border:1px solid #dce9e1;border-radius:13px;background:linear-gradient(110deg,#f3faf5,#fff)}#dashContent .amar-admin-tools input{flex:1;min-width:190px;padding:11px 13px;border:1px solid #d8e3dc;border-radius:10px;background:#fff}#dashContent .amar-admin-tools small{color:#63796d;font-size:11px}#dashContent .amar-admin-quick{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:9px;margin:14px 0}#dashContent .amar-admin-quick button{border:1px solid #dce9e1;border-radius:12px;background:#fff;color:#164b37;padding:12px;text-align:left;font-weight:800;box-shadow:0 3px 12px #103b2d09}#dashContent .amar-admin-quick button:hover{border-color:#9acdb0;background:#f2faf5}#dashContent .amar-admin-quick span{display:block;color:#718078;font-size:11px;font-weight:500;margin-top:4px}#dashContent .amar-admin-home-note{padding:13px;border-radius:12px;background:#edf7f1;color:#315b49;font-size:12px;line-height:1.7}";
 document.head.appendChild(s);
}
function mount(root){
 if(!root||root.dataset.amarCommandReady==="1")return;
 const shell=root.querySelector(".admin-shell"),nav=shell?.querySelector(".admin-control-nav"),home=root.querySelector("#adminPanel-adminOverview")||root.querySelector("#adminPanel-adminHome");
 if(!shell||!nav||!home)return;
 root.dataset.amarCommandReady="1";installStyle();
 const tools=document.createElement("div");tools.className="amar-admin-tools";
 tools.innerHTML='<input type="search" id="amarAdminCommandSearch" placeholder="⌕ Admin menu search — Orders, Products, Customers, Settings..." aria-label="Search admin menu"><small>Ctrl + K to focus · Esc to clear</small>';
 nav.before(tools);
 const input=tools.querySelector("input");
 const menuButtons=[...nav.querySelectorAll("[data-admin-jump]")];
 const filter=()=>{const term=input.value.trim().toLocaleLowerCase();menuButtons.forEach(button=>{button.hidden=!!term&&!button.textContent.toLocaleLowerCase().includes(term)});};
 input.addEventListener("input",filter);
 input.addEventListener("keydown",event=>{if(event.key==="Escape"){input.value="";filter();input.blur()}if(event.key==="Enter"){const first=menuButtons.find(button=>!button.hidden);if(first)first.click()}});
 document.addEventListener("keydown",event=>{
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"&&root.querySelector(".admin-shell")){event.preventDefault();input.focus();input.select()}
  if(event.altKey&&event.shiftKey&&root.querySelector(".admin-shell")){
   const shortcuts={"o":"allOrders","p":"manageProducts","c":"customerList","s":"siteSettingsForm","r":"exportOrdersCsv"};
   const target=shortcuts[event.key.toLowerCase()];
   if(target){event.preventDefault();menuButtons.find(button=>button.dataset.adminJump===target)?.click()}
  }
 });
 const quick=document.createElement("section");quick.className="amar-admin-quick";
 const actions=[
  ["📦","Order Command Center","Live orders, filters & customer updates","allOrders"],
  ["🛍️","Product Studio","Manage products, stock & pricing","manageProducts"],
  ["👥","Customer Desk","Customer profiles and order history","customerList"],
  ["⚙️","Website Control","Banners, identity and central settings","siteSettingsForm"],
  ["📈","Business Reports","Order reports and CSV export","exportOrdersCsv"],
  ["🩺","System Health","Website and database checks","adminHealth"]
 ];
 actions.forEach(([icon,title,desc,target])=>{
  const button=document.createElement("button");button.type="button";button.innerHTML=icon+" "+title+"<span>"+desc+"</span>";
  button.addEventListener("click",()=>menuButtons.find(item=>item.dataset.adminJump===target)?.click());
  quick.appendChild(button);
 });
 const heading=home.querySelector("h3");
 if(heading)heading.insertAdjacentElement("afterend",quick);else home.appendChild(quick);
 const note=document.createElement("p");note.className="amar-admin-home-note";
 note.textContent="⌨️ Quick navigation: Ctrl + K = menu search · Alt + Shift + O = Orders · P = Products · C = Customers · S = Settings · R = Reports. Existing categories and permissions remain unchanged.";
 quick.insertAdjacentElement("afterend",note);
}
function watch(){
 const root=document.getElementById("dashContent");if(!root)return;
 const tryMount=()=>{try{mount(root)}catch(error){console.error("Amar admin command tools:",error)}};
 tryMount();
 const observer=new MutationObserver(tryMount);observer.observe(root,{childList:true,subtree:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",watch,{once:true});else watch();
})();


/* Premium five-group admin drawer. Additive only: preserve every original panel ID and click action. */
(function(){
 "use strict";
 const STYLE_ID="amar-admin-drawer-style";
 const groups=[
  {title:"Marketplace Control",icon:"🌐",ids:["adminMasterControl","pendingProducts","manageProducts","categoryManager","pendingSellers"]},
  {title:"Orders & Customers",icon:"📦",ids:["allOrders","adminChats","customerList"]},
  {title:"Website & Operations",icon:"⚙️",ids:["siteSettingsForm","adminDelivery","roleManager"]},
  {title:"Finance & Reports",icon:"📈",ids:["commissionReport","exportOrdersCsv"]},
  {title:"System & Platform",icon:"🛡️",ids:["adminHealth","platformControlCenter"]}
 ];
 function style(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement("style");s.id=STYLE_ID;
  s.textContent=`
  #dashContent .admin-shell{position:relative;z-index:30;padding:18px 18px 18px 76px!important;background:linear-gradient(135deg,#052f29,#075b43 58%,#087f5b)!important;border:1px solid #ffffff20!important;min-height:112px}
  #dashContent .admin-shell h2{letter-spacing:.2px;font-size:20px}
  #dashContent .admin-menu-toggle{position:absolute!important;left:16px!important;top:18px!important;width:44px!important;height:44px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:5px!important;border:1px solid #ffffff55!important;border-radius:12px!important;background:#ffffff18!important;cursor:pointer!important;z-index:10002!important}
  #dashContent .admin-menu-toggle span{display:block!important;width:20px!important;height:2px!important;border-radius:2px!important;background:#fff!important}
  #dashContent .admin-control-nav{position:fixed!important;z-index:10001!important;inset:0 auto 0 0!important;width:min(350px,88vw)!important;max-width:350px!important;height:100dvh!important;overflow-y:auto!important;overscroll-behavior:contain!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:10px!important;padding:86px 16px 24px!important;margin:0!important;background:linear-gradient(180deg,#062f29,#064b3b 55%,#073b30)!important;box-shadow:16px 0 45px #001d1670!important;border-right:1px solid #ffffff20!important;transform:translateX(-110%)!important;transition:transform .24s ease!important;visibility:hidden!important}
  body.amar-admin-menu-open #dashContent .admin-control-nav{transform:translateX(0)!important;visibility:visible!important}
  #dashContent .amar-admin-drawer-brand{position:fixed;z-index:10003;top:18px;left:18px;width:min(314px,calc(88vw - 36px));color:#fff;font-weight:900;font-size:17px;pointer-events:none;opacity:0;transition:opacity .2s}
  body.amar-admin-menu-open #dashContent .amar-admin-drawer-brand{opacity:1}
  #dashContent .amar-admin-nav-overview{width:100%;min-height:44px;text-align:left!important;border:1px solid #ffffff38!important;border-radius:11px!important;background:#ffffff1a!important;color:#fff!important;padding:12px!important;font-weight:850!important}
  #dashContent .amar-admin-group{border:1px solid #ffffff22;border-radius:13px;background:#ffffff0b;overflow:hidden}
  #dashContent .amar-admin-group summary{list-style:none;cursor:pointer;padding:13px 12px;color:#e9fff2;font-weight:850;font-size:13px;display:flex;align-items:center;gap:9px}
  #dashContent .amar-admin-group summary::-webkit-details-marker{display:none}
  #dashContent .amar-admin-group summary:after{content:"⌄";margin-left:auto;color:#b7e8cd;font-size:18px}
  #dashContent .amar-admin-group[open] summary:after{content:"⌃"}
  #dashContent .amar-admin-group-items{display:grid;gap:5px;padding:0 8px 9px}
  #dashContent .admin-control-nav .amar-admin-group-items button{width:100%!important;min-height:40px!important;text-align:left!important;justify-content:flex-start!important;border:1px solid #ffffff16!important;border-radius:9px!important;background:#ffffff10!important;color:#f2fff6!important;padding:10px 11px!important;font-size:12px!important;font-weight:700!important}
  #dashContent .admin-control-nav .amar-admin-group-items button:hover,#dashContent .admin-control-nav .amar-admin-group-items button.active{background:#d8f5e4!important;color:#064b36!important}
  #dashContent .amar-admin-backdrop{position:fixed;z-index:10000;inset:0;border:0;background:#001b14a8;opacity:0;visibility:hidden;transition:opacity .2s;padding:0}
  body.amar-admin-menu-open #dashContent .amar-admin-backdrop{opacity:1;visibility:visible}
  #dashContent .admin-shell .admin-nav-note{margin-top:10px}
  @media(max-width:600px){#dashContent .admin-shell{padding:16px 12px 16px 66px!important}#dashContent .admin-shell h2{font-size:16px}#dashContent .admin-control-nav{width:min(330px,88vw)!important}}
  @media(prefers-reduced-motion:reduce){#dashContent .admin-control-nav,#dashContent .amar-admin-backdrop{transition:none!important}}
  `;
  document.head.appendChild(s);
 }
 function mount(){
  const root=document.getElementById("dashContent"),shell=root?.querySelector(".admin-shell"),nav=shell?.querySelector(".admin-control-nav"),toggle=shell?.querySelector("#adminMenuToggle");
  if(!root||!shell||!nav||!toggle||nav.dataset.premiumDrawer==="1")return;
  const buttons=[...nav.querySelectorAll("[data-admin-jump]")];
  const byId=id=>buttons.find(b=>b.dataset.adminJump===id);
  if(buttons.length<16)return;
  style();
  nav.dataset.premiumDrawer="1";
  const overview=byId("adminOverview");
  if(overview){overview.classList.add("amar-admin-nav-overview");overview.textContent="📊  Overview";}
  groups.forEach(group=>{
   const details=document.createElement("details");details.className="amar-admin-group";
   const summary=document.createElement("summary");summary.textContent=group.icon+"  "+group.title;
   const items=document.createElement("div");items.className="amar-admin-group-items";
   group.ids.forEach(id=>{const b=byId(id);if(b)items.appendChild(b)});
   details.append(summary,items);nav.appendChild(details);
  });
  const brand=document.createElement("div");brand.className="amar-admin-drawer-brand";brand.textContent="AMAR SHOPPING · CONTROL CENTER";shell.appendChild(brand);
  const backdrop=document.createElement("button");backdrop.type="button";backdrop.className="amar-admin-backdrop";backdrop.setAttribute("aria-label","Close admin menu");shell.appendChild(backdrop);
  const close=()=>{document.body.classList.remove("amar-admin-menu-open");toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-label","অ্যাডমিন মেনু খুলুন");};
  const open=()=>{document.body.classList.add("amar-admin-menu-open");toggle.setAttribute("aria-expanded","true");toggle.setAttribute("aria-label","অ্যাডমিন মেনু বন্ধ করুন");};
  toggle.onclick=event=>{event.preventDefault();document.body.classList.contains("amar-admin-menu-open")?close():open();};
  backdrop.addEventListener("click",close);
  buttons.forEach(button=>button.addEventListener("click",close));
  document.addEventListener("keydown",event=>{if(event.key==="Escape")close()});
  window.addEventListener("resize",()=>{if(window.innerWidth>900)close()},{passive:true});
 }
 function watch(){
  const root=document.getElementById("dashContent")||document.body;
  const observer=new MutationObserver(mount);observer.observe(root,{childList:true,subtree:true});mount();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",watch,{once:true});else watch();
})();

/* Persistent in-dashboard admin workspace: keep navigation visible while switching panels. */
(function(){
 "use strict";
 const STYLE_ID="amar-admin-workspace-layout";
 function mount(){
  const root=document.getElementById("dashContent"),shell=root?.querySelector(".admin-shell"),nav=shell?.querySelector(".admin-control-nav"),toggle=shell?.querySelector("#adminMenuToggle");
  if(!root||!shell||!nav||!toggle)return;
  if(!document.getElementById(STYLE_ID)){
   const style=document.createElement("style");style.id=STYLE_ID;
   style.textContent=`
   #dashContent:has(>.admin-shell){display:grid!important;grid-template-columns:minmax(260px,300px) minmax(0,1fr);align-items:start;column-gap:18px;row-gap:0}
   #dashContent>.admin-shell{grid-column:1;grid-row:1 / span 60;position:sticky!important;top:14px!important;align-self:start;min-height:calc(100vh - 28px);margin:0 0 18px!important;padding:76px 12px 16px!important;border-radius:18px!important}
   #dashContent .admin-shell h2,#dashContent .admin-shell>p.muted{display:none!important}
   #dashContent .admin-menu-toggle{position:absolute!important;left:14px!important;top:16px!important;z-index:10004!important}
   #dashContent .amar-admin-drawer-brand{position:absolute!important;left:68px!important;top:25px!important;width:auto!important;opacity:1!important;color:#fff!important;font-size:14px!important}
   #dashContent .admin-control-nav{position:static!important;inset:auto!important;width:auto!important;max-width:none!important;height:auto!important;max-height:calc(100vh - 125px)!important;overflow-y:auto!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:9px!important;margin:0!important;padding:12px 0 4px!important;transform:none!important;visibility:visible!important;box-shadow:none!important;border:0!important;background:transparent!important}
   #dashContent .admin-control-nav .amar-admin-group-items button.active{background:#d8f5e4!important;color:#064b36!important;box-shadow:inset 3px 0 #35c98b!important}
   #dashContent>.admin-home-panel,#dashContent>.admin-panel{grid-column:2!important;min-width:0!important;width:100%!important;margin:0 0 18px!important;scroll-margin-top:18px}
   #dashContent .amar-admin-backdrop{display:none!important}
   body:not(.amar-admin-menu-open) #dashContent:has(>.admin-shell){grid-template-columns:76px minmax(0,1fr)!important}
   body:not(.amar-admin-menu-open) #dashContent>.admin-shell{padding:72px 8px 12px!important;min-height:84px!important}
   body:not(.amar-admin-menu-open) #dashContent .amar-admin-drawer-brand,body:not(.amar-admin-menu-open) #dashContent .admin-control-nav{display:none!important}
   @media(max-width:800px){
    #dashContent:has(>.admin-shell){grid-template-columns:minmax(0,1fr)!important;row-gap:12px}
    #dashContent>.admin-shell{grid-column:1!important;grid-row:auto!important;position:relative!important;top:auto!important;min-height:0!important;padding:72px 12px 12px!important}
    #dashContent>.admin-home-panel,#dashContent>.admin-panel{grid-column:1!important}
    #dashContent .admin-control-nav{max-height:48vh!important}
    body:not(.amar-admin-menu-open) #dashContent>.admin-shell{min-height:72px!important}
   }`;
   document.head.appendChild(style);
  }
  if(shell.dataset.amarPersistentSidebar==="1")return;
  shell.dataset.amarPersistentSidebar="1";
  document.body.classList.add("amar-admin-menu-open");
  toggle.onclick=function(event){
   event.preventDefault();
   event.stopImmediatePropagation();
   const open=!document.body.classList.contains("amar-admin-menu-open");
   document.body.classList.toggle("amar-admin-menu-open",open);
   toggle.setAttribute("aria-expanded",String(open));
   toggle.setAttribute("aria-label",open?"Collapse admin sidebar":"Expand admin sidebar");
  };
  toggle.setAttribute("aria-expanded","true");
  nav.querySelectorAll(".amar-admin-group-items button").forEach(button=>button.addEventListener("click",()=>{document.body.classList.add("amar-admin-menu-open");toggle.setAttribute("aria-expanded","true");toggle.setAttribute("aria-label","Collapse admin sidebar");}));
 }
 function watch(){const root=document.getElementById("dashContent")||document.body;new MutationObserver(mount).observe(root,{childList:true,subtree:true});mount();}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",watch,{once:true});else watch();
})();


/* One global hamburger for storefront + admin controls. Admin permissions still come from the verified session. */
(function(){
 "use strict";
 const groups=[
  {title:"Overview & Master Control",icon:"📊",ids:["adminOverview","adminMasterControl"]},
  {title:"Marketplace & Products",icon:"🛍️",ids:["pendingProducts","manageProducts","categoryManager","pendingSellers"]},
  {title:"Customers & Support",icon:"👥",ids:["adminChats","customerList"]},
  {title:"Website & Operations",icon:"⚙️",ids:["siteSettingsForm","adminDelivery","roleManager"]},
  {title:"Finance & Reports",icon:"📈",ids:["commissionReport","exportOrdersCsv"]},
  {title:"System & Platform",icon:"🛡️",ids:["adminHealth","platformControlCenter"]}
 ];
 const styleId="amar-single-global-menu-style";
 function installStyle(){
  if(document.getElementById(styleId))return;
  const style=document.createElement("style");style.id=styleId;
  style.textContent=[
   "#dashContent:has(>.admin-shell){display:block!important;grid-template-columns:minmax(0,1fr)!important;column-gap:0!important}",
   "#dashContent>.admin-shell{grid-column:auto!important;grid-row:auto!important;position:relative!important;top:auto!important;min-height:0!important;padding:16px!important;margin:0 0 14px!important}",
   "#dashContent .admin-menu-toggle,#dashContent .admin-control-nav,#dashContent .amar-admin-tools,#dashContent .amar-admin-quick{display:none!important}",
   "#dashContent>.admin-home-panel,#dashContent>.admin-panel{grid-column:auto!important;grid-row:auto!important;width:100%!important;min-width:0!important}",
   ".amar-global-admin-menu{width:100%;margin:12px 0 4px;padding:12px;border:1px solid #dce9e1;border-radius:13px;background:#f7fbf8}",
   ".amar-global-admin-menu h4{margin:0 0 10px;color:#075b43;font-size:14px}",
   ".amar-global-admin-menu input{width:100%;padding:10px 12px;border:1px solid #d8e3dc;border-radius:9px;background:#fff;margin-bottom:10px}",
   ".amar-global-admin-menu .amar-admin-order-entry{width:100%;margin:0 0 10px;padding:12px;border:1px solid #b9dfc9;border-radius:10px;background:#e7f7ed;color:#075b43;text-align:left;font-weight:850}",
   ".amar-global-admin-menu details{margin:7px 0;border:1px solid #e0eae4;border-radius:10px;background:#fff;overflow:hidden}",
   ".amar-global-admin-menu summary{padding:11px 12px;cursor:pointer;color:#174c38;font-weight:800;font-size:13px}",
   ".amar-global-admin-menu .amar-admin-items{display:grid;gap:5px;padding:0 8px 9px}",
   ".amar-global-admin-menu .amar-admin-items button{width:100%;padding:10px 11px;border:0;border-radius:8px;background:#f4f8f5;color:#244b39;text-align:left;font-size:12px;font-weight:700}",
   ".amar-global-admin-menu .amar-admin-items button:active,.amar-global-admin-menu .amar-admin-items button:hover{background:#e3f3e9}",
   ".amar-global-admin-menu [hidden]{display:none!important}",
   "@media(max-width:600px){.amar-global-admin-menu{padding:10px}.amar-global-admin-menu summary{padding:10px}}"
  ].join("");
  document.head.appendChild(style);
 }
 function closeGlobalMenu(){
  document.body.classList.remove("menu-open");
  const trigger=document.getElementById("menuTrigger");
  if(trigger)trigger.setAttribute("aria-expanded","false");
 }
 function openGlobalMenu(){
  document.body.classList.add("menu-open");
  const trigger=document.getElementById("menuTrigger");
  if(trigger)trigger.setAttribute("aria-expanded","true");
  const contact=document.getElementById("publicContact"),drawer=document.getElementById("drawerContact");
  if(contact&&drawer)drawer.innerHTML=contact.innerHTML;
 }
 function renderAdminMenu(){
  const settings=document.getElementById("adminMenuSettings");
  const nav=document.querySelector("#sideDrawer .drawer-links");
  const dashboard=document.getElementById("dashContent");
  const originalNav=dashboard?.querySelector(".admin-control-nav");
  const enabled=!!(settings&&!settings.classList.contains("hidden")&&originalNav);
  let section=nav?.querySelector(".amar-global-admin-menu");
  if(!enabled){section?.remove();return}
  if(!nav||!originalNav)return;
  if(section?.dataset.sourceNav===String(originalNav.dataset.premiumDrawer||"pending"))return;
  section?.remove();
  installStyle();
  section=document.createElement("section");
  section.className="amar-global-admin-menu";
  section.dataset.sourceNav=String(originalNav.dataset.premiumDrawer||"pending");
  const heading=document.createElement("h4");heading.textContent="🔐 Admin Control Center";
  const search=document.createElement("input");search.type="search";search.placeholder="Admin control খুঁজুন...";search.setAttribute("aria-label","Search admin controls");
  section.append(heading,search);
  const orderButton=document.createElement("button");orderButton.type="button";orderButton.className="amar-admin-order-entry";orderButton.textContent="📦  Order Management  →";
  orderButton.addEventListener("click",()=>activate("allOrders"));
  section.append(orderButton);
  const entries=[];
  groups.forEach(group=>{
   const details=document.createElement("details");details.className="amar-admin-menu-group";
   const summary=document.createElement("summary");summary.textContent=group.icon+"  "+group.title;
   const items=document.createElement("div");items.className="amar-admin-items";
   group.ids.forEach(id=>{
    const source=[...originalNav.querySelectorAll("[data-admin-jump]")].find(b=>b.dataset.adminJump===id);
    if(!source)return;
    const button=document.createElement("button");button.type="button";button.textContent=source.textContent.trim();button.dataset.searchText=button.textContent.toLocaleLowerCase();
    button.addEventListener("click",()=>activate(id));items.appendChild(button);entries.push(button);
   });
   if(items.children.length){details.append(summary,items);section.append(details)}
  });
  search.addEventListener("input",()=>{
   const term=search.value.trim().toLocaleLowerCase();
   entries.forEach(button=>{button.hidden=!!term&&!button.dataset.searchText.includes(term)});
   section.querySelectorAll("details").forEach(details=>{
    const visible=[...details.querySelectorAll("button")].some(button=>!button.hidden);
    details.hidden=!!term&&!visible;if(term&&visible)details.open=true;
   });
   orderButton.hidden=!!term&&!"order management orders".includes(term);
  });
  function activate(id){
   const source=[...originalNav.querySelectorAll("[data-admin-jump]")].find(b=>b.dataset.adminJump===id);
   if(!source)return;
   closeGlobalMenu();
   source.click();
   if(id==="allOrders"){
    const panel=document.getElementById("amarDedicatedOrderDashboard");
    if(panel)panel.scrollIntoView({behavior:"smooth",block:"start"});
   }
  }
  if(settings.parentElement===nav)settings.insertAdjacentElement("afterend",section);else nav.appendChild(section);
 }
 function watch(){
  installStyle();
  const trigger=document.getElementById("menuTrigger");
  if(trigger&&!trigger.dataset.amarSingleMenu){
   trigger.dataset.amarSingleMenu="1";
   trigger.addEventListener("click",event=>{
    event.preventDefault();event.stopImmediatePropagation();
    document.body.classList.contains("menu-open")?closeGlobalMenu():openGlobalMenu();
   },true);
  }
  const settings=document.getElementById("adminMenuSettings");
  if(settings&&!settings.dataset.amarMenuObserver){
   settings.dataset.amarMenuObserver="1";
   new MutationObserver(renderAdminMenu).observe(settings,{attributes:true,attributeFilter:["class","hidden"]});
  }
  const dashboard=document.getElementById("dashContent");
  if(dashboard&&!dashboard.dataset.amarGlobalMenuObserver){
   dashboard.dataset.amarGlobalMenuObserver="1";
   new MutationObserver(renderAdminMenu).observe(dashboard,{childList:true,subtree:true});
  }
  renderAdminMenu();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",watch,{once:true});else watch();
})();
