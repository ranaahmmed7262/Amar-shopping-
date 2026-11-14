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
