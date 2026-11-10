/* Owner-only serial-wise customer account desk. No passwords, OTPs or payment data. */
(function(){
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const date=v=>v?new Date(v).toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short"}):"—";
const statusLabel=s=>s==="active"?"Active":"Deactive";
function csvCell(value){
 let v=String(value??"");
 if(/^[=+\-@\t\r]/.test(v))v="'"+v;
 return '"'+v.replace(/"/g,'""')+'"';
}
function downloadCsv(rows,filename){
 const csv=["Serial,Customer ID,Name,Email,Mobile,Account Status,Registered At,Order Count,Latest Order At",
 ...rows.map((u,i)=>[
 i+1,"CUS-"+u.id,u.name,u.email,u.phone,statusLabel(u.account_status),u.created_at,u.orderCount,u.latestOrderAt
 ].map(csvCell).join(","))].join("\r\n");
 const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
window.mountAmarShoppingCustomerDashboard=function(d){
 if(!d||d.profile?.role!=="admin"||!d.adminOtpVerified||!d.el?.querySelector("#customerList"))return false;
 const box=d.el.querySelector("#customerList");
 let customers=[],orders=[],selected=null,filter="all",query="",page=0,loading=false;
 const pageSize=50;
 box.innerHTML='<section id="amcDesk"><div class="row"><div><h3 style="margin:0;color:#075b43">👥 Customer Account Management</h3><small class="muted">Private Admin-only • Serial-wise customer register</small></div><div class="row"><button type="button" class="light" id="amcRefresh">↻ Refresh</button><button type="button" class="btn" id="amcExport">⬇ Excel Download (.csv)</button></div></div><div class="notice">শুধু Registered customer account দেখানো হবে। Password, OTP, payment ও secret তথ্য এখানে বা export-এ থাকবে না।</div><div class="grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:9px;margin:12px 0"><div class="adminitem"><small class="muted">Total Accounts</small><h2 id="amcTotal">—</h2></div><div class="adminitem"><small class="muted">Active</small><h2 id="amcActive">—</h2></div><div class="adminitem"><small class="muted">Deactive</small><h2 id="amcDeactive">—</h2></div></div><div class="row" style="margin:10px 0"><input id="amcSearch" placeholder="Serial / Customer ID / Name / Email / Mobile" style="flex:2;min-width:210px;padding:11px;border:1px solid #d8e3dc;border-radius:9px"><select id="amcStatus" style="flex:1;min-width:140px;padding:11px;border:1px solid #d8e3dc;border-radius:9px"><option value="all">All Status</option><option value="active">Active</option><option value="deactive">Deactive</option></select></div><p id="amcCount" class="muted">Customer list loading...</p><div id="amcTable"></div><div class="row" style="justify-content:center;margin:12px 0"><button type="button" class="light" id="amcPrev">← Previous</button><span id="amcPage" class="muted"></span><button type="button" class="light" id="amcNext">Next →</button></div><section id="amcDetail" class="adminitem" hidden style="margin-top:16px;padding:15px;border-radius:13px"></section></section>';
 const root=box.querySelector("#amcDesk");
 const csvRows=()=>customers.map(u=>({...u,orderCount:orders.filter(o=>o.customer_id===u.id).length,latestOrderAt:orders.filter(o=>o.customer_id===u.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0]?.created_at||""}));
 async function fetchAll(table,select,orderColumn){
  const out=[];let offset=0;const size=500;
  while(true){
   let q=d.db.from(table).select(select).order(orderColumn,{ascending:false}).range(offset,offset+size-1);
   if(table==="users")q=q.eq("role","customer");
   const {data,error}=await q;
   if(error)throw error;
   out.push(...(data||[]));if(!data||data.length<size)break;offset+=size;
  }
  return out;
 }
 async function refresh(){
  if(loading)return;loading=true;root.querySelector("#amcCount").textContent="Customer list loading...";
  try{
   const [u,o]=await Promise.all([
    fetchAll("users","id,name,email,phone,role,created_at,account_status","created_at"),
    fetchAll("orders","id,customer_id,created_at,status","created_at")
   ]);
   customers=u.map(x=>({...x,account_status:x.account_status||"active"}));orders=o;
   const active=customers.filter(x=>x.account_status==="active").length;
   root.querySelector("#amcTotal").textContent=customers.length.toLocaleString("en");
   root.querySelector("#amcActive").textContent=active.toLocaleString("en");
   root.querySelector("#amcDeactive").textContent=(customers.length-active).toLocaleString("en");
   render();
  }catch(error){root.querySelector("#amcCount").textContent="Customer list load হয়নি: "+(error?.message||"Unknown error");root.querySelector("#amcTable").innerHTML='<p class="bad">তথ্য লোড করা যায়নি। Admin OTP/session যাচাই করে Refresh দিন।</p>'}
  finally{loading=false}
 }
 function filtered(){
  return customers.filter(u=>(filter==="all"||u.account_status===filter)&&[u.id,"CUS-"+u.id,u.name,u.email,u.phone].some(v=>String(v??"").toLowerCase().includes(query)));
 }
 function render(){
  const rows=filtered(),pages=Math.max(1,Math.ceil(rows.length/pageSize));page=Math.min(page,pages-1);
  const start=page*pageSize,visible=rows.slice(start,start+pageSize);
  root.querySelector("#amcCount").textContent=rows.length.toLocaleString("en")+" registered accounts • "+(rows.length?("Showing "+(start+1)+"–"+Math.min(start+pageSize,rows.length)):"No accounts");
  root.querySelector("#amcPage").textContent="Page "+(page+1)+" / "+pages;
  root.querySelector("#amcPrev").disabled=page===0;root.querySelector("#amcNext").disabled=page>=pages-1;
  const serial=new Map(customers.map((u,i)=>[u.id,i+1]));
  root.querySelector("#amcTable").innerHTML=visible.length?'<div style="overflow:auto;border:1px solid #e1ebe4;border-radius:11px;background:white"><table style="border-collapse:collapse;width:100%;min-width:720px"><thead><tr style="background:#f1f7f3"><th style="padding:10px">SL</th><th style="padding:10px">Customer</th><th style="padding:10px">Email / Mobile</th><th style="padding:10px">Joined</th><th style="padding:10px">Orders</th><th style="padding:10px">Status</th></tr></thead><tbody>'+visible.map(u=>{const count=orders.filter(o=>o.customer_id===u.id).length;return '<tr style="border-top:1px solid #edf1ee"><td style="padding:10px"><button type="button" data-amc-open="'+u.id+'" style="border:0;background:#e8f5ed;color:#075b43;border-radius:8px;padding:8px 11px;font-weight:900">'+serial.get(u.id)+'</button></td><td style="padding:10px"><b>'+esc(u.name||"Name not set")+'</b><br><small class="muted">CUS-'+u.id+'</small></td><td style="padding:10px">'+esc(u.email||"—")+'<br>'+esc(u.phone||"—")+'</td><td style="padding:10px">'+esc(date(u.created_at))+'</td><td style="padding:10px">'+count+'</td><td style="padding:10px"><span style="display:inline-block;padding:5px 9px;border-radius:999px;background:'+(u.account_status==="active"?"#e7f7ed":"#fff0ef")+';color:'+(u.account_status==="active"?"#17643e":"#963c34")+';font-weight:800;font-size:12px">'+statusLabel(u.account_status)+'</span></td></tr>'}).join("")+'</tbody></table></div>':'<div class="empty">কোনো registered customer পাওয়া যায়নি। Guest checkout account হিসেবে গণনা করা হয়নি।</div>';
  if(selected)showDetail(selected);
 }
 function showDetail(id){
  const u=customers.find(x=>x.id===id),panel=root.querySelector("#amcDetail");if(!u){panel.hidden=true;return}
  selected=id;panel.hidden=false;
  const related=orders.filter(o=>o.customer_id===id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const history=related.slice(0,15).map(o=>'<div class="line"><span><b>Order #'+o.id+'</b><br><small class="muted">'+esc(date(o.created_at))+'</small></span><span>'+esc(o.status)+'</span></div>').join("")||'<p class="muted">এখনো কোনো order নেই।</p>';
  panel.innerHTML='<div class="row"><div><h3 style="margin:0">Customer #'+id+' — Details</h3><small class="muted">Registered account profile</small></div><button type="button" class="light" data-amc-close>Close</button></div><div class="grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:9px;margin-top:12px"><div class="adminitem"><small class="muted">Full Name</small><p><b>'+esc(u.name||"—")+'</b></p></div><div class="adminitem"><small class="muted">Email</small><p>'+esc(u.email||"—")+'</p></div><div class="adminitem"><small class="muted">Mobile</small><p>'+esc(u.phone||"—")+'</p></div><div class="adminitem"><small class="muted">Customer ID</small><p>CUS-'+u.id+'</p></div><div class="adminitem"><small class="muted">Registered</small><p>'+esc(date(u.created_at))+'</p></div><div class="adminitem"><small class="muted">Account Status</small><p><b>'+statusLabel(u.account_status)+'</b></p></div><div class="adminitem"><small class="muted">Total Orders</small><p><b>'+related.length+'</b></p></div><div class="adminitem"><small class="muted">Last Order</small><p>'+esc(date(related[0]?.created_at))+'</p></div></div><div class="adminitem" style="margin-top:12px"><div class="row"><b>Account Status Control</b><button type="button" class="light" id="amcToggleStatus">'+(u.account_status==="active"?"Deactivate Account":"Activate Account")+'</button></div><small class="muted">Deactive করলে customer-এর account access বন্ধ হবে; পুরোনো order বা profile data delete হবে না।</small></div><h4>Recent Orders (latest 15)</h4>'+history;
 }
 root.addEventListener("click",async e=>{
  const open=e.target.closest("[data-amc-open]");if(open){showDetail(Number(open.dataset.amcOpen));root.querySelector("#amcDetail").scrollIntoView({behavior:"smooth",block:"start"});return}
  if(e.target.closest("[data-amc-close]")){selected=null;root.querySelector("#amcDetail").hidden=true;return}
  if(e.target.closest("#amcToggleStatus")){
   const u=customers.find(x=>x.id===selected);if(!u)return;
   const next=u.account_status==="active"?"deactive":"active";
   if(!confirm(next==="deactive"?"এই customer account Deactive করবেন? Customer আর account ব্যবহার করতে পারবে না।":"এই customer account আবার Active করবেন?"))return;
   const button=root.querySelector("#amcToggleStatus");button.disabled=true;
   const {error}=await d.db.rpc("admin_set_customer_status",{p_user_id:u.id,p_status:next});
   button.disabled=false;
   if(error){d.toast("Status update হয়নি: "+error.message,true);return}
   u.account_status=next;d.toast("Customer account status "+statusLabel(next)+" হয়েছে");render();showDetail(u.id);
  }
 });
 root.querySelector("#amcSearch").addEventListener("input",e=>{query=e.target.value.trim().toLowerCase();page=0;render()});
 root.querySelector("#amcStatus").addEventListener("change",e=>{filter=e.target.value;page=0;render()});
 root.querySelector("#amcPrev").onclick=()=>{page=Math.max(0,page-1);render()};
 root.querySelector("#amcNext").onclick=()=>{page++;render()};
 root.querySelector("#amcRefresh").onclick=refresh;
 root.querySelector("#amcExport").onclick=()=>downloadCsv(csvRows(),"amar-shopping-customers-excel.csv");
 refresh();return true;
};
})();