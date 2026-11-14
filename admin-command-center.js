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
 const shell=root.querySelector(".admin-shell"),nav=shell?.querySelector(".admin-control-nav"),home=root.querySelector("#adminPanel-adminHome");
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
  nav.querySelectorAll(".amar-admin-group-items button").forEach(button=>button.addEventListener("click",()=>{document.body.classList.add("amar-admin-menu-open");toggle.setAttribute("aria-expanded","true");}));
  toggle.addEventListener("click",()=>requestAnimationFrame(()=>toggle.setAttribute("aria-expanded",String(document.body.classList.contains("amar-admin-menu-open")))));
 }
 function watch(){const root=document.getElementById("dashContent")||document.body;new MutationObserver(mount).observe(root,{childList:true,subtree:true});mount();}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",watch,{once:true});else watch();
})();