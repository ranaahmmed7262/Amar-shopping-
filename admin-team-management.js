/* Amar Shopping Team Operations — additive, internal workflow only. */
(function(){
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const labels={assigned:"Assigned",accepted:"Accepted",in_progress:"In Progress",waiting_info:"Waiting for Info",forwarded:"Forwarded",completed:"Completed",on_hold:"On Hold"};
const call=async(db,name,args={})=>{const r=await db.rpc(name,args);if(r.error)throw r.error;return r.data};
function css(){if(document.getElementById("amar-team-style"))return;const s=document.createElement("style");s.id="amar-team-style";s.textContent=".amar-team{margin:18px 0;padding:16px;border:1px solid #d5e8dc;border-radius:16px;background:#f5fbf7;color:#173d2d}.amar-team h3{margin:0 0 8px;color:#075b43}.amar-team .at-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:9px;margin:12px 0}.amar-team .at-card{padding:12px;border:1px solid #dce9e1;border-radius:11px;background:white}.amar-team .at-muted{font-size:12px;color:#60776a}.amar-team input,.amar-team select,.amar-team textarea{width:100%;padding:9px;border:1px solid #cfddd4;border-radius:8px;background:white;color:#173d2d}.amar-team label{display:grid;gap:5px;font-size:12px;font-weight:700}.amar-team button{border:0;border-radius:8px;padding:9px 12px;background:#087f5b;color:white;font-weight:700;cursor:pointer}.amar-team button.secondary{background:#e6f2ea;color:#075b43;border:1px solid #d5e5da}.amar-team button.danger{background:#9c3333}.amar-team button:disabled{opacity:.5}.amar-team .at-list{display:grid;gap:8px;margin:10px 0}.amar-team .at-pill{display:inline-block;border-radius:20px;padding:4px 9px;background:#e2f3e8;color:#075b43;font-size:11px;font-weight:800}.amar-team .at-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.amar-team hr{border:0;border-top:1px solid #dce9e1;margin:14px 0}";document.head.appendChild(s)}
function manager(d){
 const initial=d.teamAccess||{};
 // Always mount the Team Operations shell after the Admin dashboard opens.
 // Actual CEO/team access is decided by the OTP-protected Supabase RPCs in load();
 // a stale/missing client-side OTP flag must not hide the entire interface.

 css();
 const host=d.el.querySelector("#adminPanel-adminHome")||d.el.querySelector("#allOrders")?.parentElement||d.el;
 if(!host)return;
 let root=host.querySelector("#amarTeamManager");
 if(!root){root=document.createElement("section");root.id="amarTeamManager";root.className="amar-team";host.appendChild(root)}
 let solo=true,loading=false,ov=null,orders=[],access=initial,matrix=null,people=[];
 const permissionNames={
  "team.overview":"Team Overview & Work Board",
  "team.members.view":"View Team Members",
  "orders.assign":"Assign / Reassign Orders",
  "orders.view_assigned":"View Assigned Orders",
  "orders.work.update":"Update Work Status",
  "orders.work.forward":"Forward Tasks"
 };
 const roleNames={manager:"Manager",admin:"Admin",employee:"Employee",viewer:"Viewer"};
 const isCeo=()=>!!access.is_ceo;
 const perms=()=>access.permissions||{};
 const allowed=k=>isCeo()||perms()[k]===true;
 const render=()=>{
  const members=ov?.members||[],pending=members.filter(x=>x.status==="pending"),approved=members.filter(x=>x.status==="approved"),tasks=ov?.tasks||[],c=ov?.counts||{};
  const visibleMembers=matrix?.members||members;
  const permissionRows=matrix?.permissions||[];
  const permMap={};permissionRows.forEach(p=>{if(!permMap[p.member_auth_user_id])permMap[p.member_auth_user_id]={};permMap[p.member_auth_user_id][p.permission_key]=p.allowed});
  let html='<div class="at-row" style="justify-content:space-between"><div><h3>👥 Team Order Operations</h3><span class="at-muted">CEO-controlled access · Assignment · Handover · Team progress</span></div><button class="secondary" id="atRefresh">↻ Refresh</button></div>';
  html+='<div class="at-grid">'+[["Unassigned",c.unassigned],["Assigned",c.assigned],["In Progress",c.in_progress],["Completed",c.completed],["Overdue",c.overdue],["Team Members",approved.length]].map(x=>'<div class="at-card"><span class="at-muted">'+x[0]+'</span><h3>'+String(x[1]??0)+'</h3></div>').join("")+'</div>';
  if(isCeo())html+='<div class="at-card"><b>CEO Work Mode: '+(solo?"SOLO MODE":"TEAM MODE")+'</b><p class="at-muted">'+(solo?"তুমি একাই সব অর্ডার দেখতে, Status পরিবর্তন করতে ও পরিচালনা করতে পারবে। Assignment বাধ্যতামূলক নয়।":"Team Mode: কাজ ভাগ করে assign ও monitor করো। CEO-এর সবসময় Full Access থাকবে।")+'</p><button class="secondary" id="atMode">'+(solo?"Switch to Team Mode":"Switch to Solo Mode")+'</button></div>';
  else html+='<div class="at-card"><b>Team Manager Workspace</b><p class="at-muted">তোমার অনুমোদিত Tool অনুযায়ী Team ও Order পরিচালনা করো। CEO-এর Permission ছাড়া Role বা Tool Access পরিবর্তন করা যাবে না।</p></div>';
  if(isCeo()){
   html+='<hr><h4>🛡️ Join Requests ('+pending.length+')</h4><div class="at-list">'+(pending.map(m=>'<div class="at-card"><b>'+esc(m.display_name)+' · '+esc(m.admin_number)+'</b><p class="at-muted">Request: '+esc(new Date(m.requested_at).toLocaleString())+'</p><div class="at-row"><button data-member="approved" data-id="'+esc(m.auth_user_id)+'">Approve as Employee</button><button class="danger" data-member="rejected" data-id="'+esc(m.auth_user_id)+'">Reject</button></div></div>').join("")||'<p class="at-muted">কোনো pending request নেই।</p>')+'</div>';
  }
  if(allowed("team.members.view")){
   html+='<hr><h4>👤 Approved Members</h4><div class="at-list">'+(approved.map(m=>'<div class="at-card"><b>'+esc(m.display_name)+' · '+esc(m.admin_number)+'</b><span class="at-pill">'+esc(roleNames[m.access_level]||m.access_level)+'</span>'+(isCeo()&&m.auth_user_id!=="bae854b2-87f4-4934-9d4b-43ffd3ae2d4e"?'<div class="at-row" style="margin-top:8px"><button class="danger" data-member="suspended" data-id="'+esc(m.auth_user_id)+'">Suspend Access</button></div>':"")+'</div>').join("")||'<p class="at-muted">এখনো কেউ approve হয়নি।</p>')+'</div>';
  }
  if(isCeo()){
   html+='<hr><h4>🔐 CEO Access Control Center</h4><p class="at-muted">Role নির্বাচন করলে ওই Role-এর default tools বসবে। এরপর প্রতিটি Tool আলাদাভাবে On/Off করতে পারবে। CEO account এই তালিকায় locked এবং সীমাহীন।</p><div class="at-list">';
   html+=visibleMembers.filter(m=>m.status==="approved").map(m=>{
    const self=m.auth_user_id==="bae854b2-87f4-4934-9d4b-43ffd3ae2d4e";
    if(self)return '<div class="at-card"><b>👑 '+esc(m.display_name)+' · '+esc(m.admin_number)+'</b><span class="at-pill">CEO · ALL ACCESS · LOCKED</span><p class="at-muted">তোমার Role ও Permission কেউ পরিবর্তন বা সীমাবদ্ধ করতে পারবে না।</p></div>';
    const selected=permMap[m.auth_user_id]||{};
    const checks=Object.keys(permissionNames).map(k=>'<label style="display:flex;grid-template-columns:auto 1fr;align-items:center;gap:8px;font-weight:500"><input type="checkbox" data-perm-member="'+esc(m.auth_user_id)+'" data-perm-key="'+k+'" '+(selected[k]===true?"checked":"")+' style="width:auto"> '+permissionNames[k]+'</label>').join("");
    return '<div class="at-card"><div class="at-row" style="justify-content:space-between"><b>'+esc(m.display_name)+' · '+esc(m.admin_number)+'</b><span class="at-pill">'+esc(m.status)+'</span></div><label>Role<select data-role-member="'+esc(m.auth_user_id)+'">'+Object.keys(roleNames).map(k=>'<option value="'+k+'" '+(m.access_level===k?"selected":"")+'>'+roleNames[k]+'</option>').join("")+'</select></label><p class="at-muted">Role change applies default permission template and resets custom Tool settings.</p><div class="at-list">'+checks+'</div></div>';
   }).join("")+'</div>';
  }
  if(allowed("orders.assign")){
   html+='<hr><h4>📦 Assign / Reassign an Order</h4><div class="at-grid"><label>Order<select id="atOrder"><option value="">Select order</option>'+orders.map(o=>'<option value="'+o.id+'">#'+o.id+' · '+esc(o.recipient_name||"Customer")+' · '+esc(o.status)+'</option>').join("")+'</select></label><label>Team Member<select id="atMember"><option value="">Select member</option>'+people.map(m=>'<option value="'+esc(m.auth_user_id)+'">'+esc(m.display_name)+' · '+esc(m.admin_number)+'</option>').join("")+'</select></label><label>Due date (optional)<input id="atDue" type="datetime-local"></label><label>Handover note<textarea id="atNote" rows="2" maxlength="1000" placeholder="কী কাজ করতে হবে"></textarea></label></div><button id="atAssign" '+(people.length?"":"disabled")+'>Assign Order</button>';
  }
  if(allowed("team.overview")){
   html+='<hr><h4>📋 Team Work Board</h4><div class="at-list">'+tasks.map(t=>'<div class="at-card"><div class="at-row" style="justify-content:space-between"><b>Order #'+t.order_id+'</b><span class="at-pill">'+esc(labels[t.work_status]||t.work_status)+'</span></div><p class="at-muted">'+esc(t.assignee_name)+' · '+esc(t.admin_number)+' · '+esc(new Date(t.updated_at).toLocaleString())+'</p><p>'+esc(t.internal_note||"No note")+'</p></div>').join("")+'</div>';
  }
  html+='<p class="at-muted">Internal Work Status আলাদা। এটি Customer Order Status, Payment Status, KPI বা Tracking পরিবর্তন করে না।</p>';
  root.innerHTML=html;
 };
 async function load(){
  if(loading)return;loading=true;
  root.innerHTML='<div class="at-row"><h3>👥 Team Order Operations</h3><span class="at-muted">লোড হচ্ছে…</span></div><p class="at-muted">Team Members, Join Requests ও Tool Permissions নিরাপদভাবে আনা হচ্ছে।</p><button class="secondary" id="atRefresh">↻ Retry</button>';
  try{
   access=await call(d.db,"get_my_team_access");
   if(!isCeo()&&!allowed("team.overview")){
    root.innerHTML='<h3>👥 Team Order Operations</h3><div class="at-card"><b>Team access পাওয়া যায়নি</b><p class="at-muted">এই Admin OTP session CEO account হিসেবে স্বীকৃত নয়, অথবা Team Overview permission চালু নেই। CEO account দিয়ে OTP login করে আবার Refresh করো।</p><p class="at-muted">Account role: '+esc(access.role||"unknown")+' · Membership: '+esc(access.status||"unknown")+'</p><button class="secondary" id="atRefresh">↻ Retry</button></div>';
    return;
   }
   const results=await Promise.allSettled([
    call(d.db,"manager_get_team_overview"),
    allowed("orders.assign")?call(d.db,"manager_get_assignable_orders"):Promise.resolve([]),
    (allowed("orders.assign")||allowed("orders.work.forward"))?call(d.db,"get_approved_team_colleagues"):Promise.resolve([]),
    isCeo()?call(d.db,"manager_get_team_access_matrix"):Promise.resolve(null)
   ]);
   if(results[0].status==="rejected")throw results[0].reason;
   ov=results[0].value;
   orders=results[1].status==="fulfilled"?(results[1].value||[]):[];
   people=results[2].status==="fulfilled"?(results[2].value||[]):[];
   matrix=results[3].status==="fulfilled"?results[3].value:null;
   render();
   const auxiliaryErrors=results.slice(1).map((r,i)=>r.status==="rejected"?["Order assignment","Team directory","CEO access matrix"][i]+": "+(r.reason?.message||"Load failed"):null).filter(Boolean);
   if(auxiliaryErrors.length){const note=document.createElement("div");note.className="at-card";note.style.marginTop="12px";note.innerHTML='<b>কিছু অতিরিক্ত Tool লোড হয়নি</b><p class="at-muted">'+auxiliaryErrors.map(esc).join("<br>")+'</p>';root.appendChild(note)}
  }catch(e){
   root.innerHTML='<h3>👥 Team Order Operations</h3><div class="at-card"><b>Team data load failed</b><p class="at-muted">'+esc(e?.message||"Unknown error")+'</p><p class="at-muted">কোনো Team data পরিবর্তন করা হয়নি। Retry করো; সমস্যা থাকলে এই error text পাঠাও।</p><button id="atRefresh">↻ Retry</button></div>';
  }finally{loading=false}
 }
 root.addEventListener("click",async e=>{
  if(e.target.closest("#atRefresh")){load();return}
  if(e.target.closest("#atMode")&&isCeo()){solo=!solo;render();return}
  const m=e.target.closest("[data-member]");
  if(m&&isCeo()){m.disabled=true;try{await call(d.db,"manager_set_team_member_status",{p_auth_user_id:m.dataset.id,p_status:m.dataset.member,p_admin_number:null});d.toast("Team member updated");await load()}catch(x){m.disabled=false;d.toast(x.message,true)}return}
  if(e.target.closest("#atAssign")&&allowed("orders.assign")){
   const order=Number(root.querySelector("#atOrder")?.value),member=root.querySelector("#atMember")?.value;
   if(!order||!member){d.toast("Order ও Team Member নির্বাচন করুন",true);return}
   const b=e.target.closest("#atAssign");b.disabled=true;
   try{await call(d.db,"manager_assign_order",{p_order_id:order,p_assignee:member,p_note:root.querySelector("#atNote").value,p_due_at:root.querySelector("#atDue").value?new Date(root.querySelector("#atDue").value).toISOString():null});d.toast("Order assigned");await load()}
   catch(x){b.disabled=false;d.toast(x.message,true)}
  }
 });
 root.addEventListener("change",async e=>{
  const role=e.target.closest("[data-role-member]");
  if(role&&isCeo()){role.disabled=true;try{await call(d.db,"manager_set_team_member_role",{p_auth_user_id:role.dataset.roleMember,p_role:role.value});d.toast("Role template applied");await load()}catch(x){role.disabled=false;d.toast(x.message,true)}return}
  const check=e.target.closest("[data-perm-member]");
  if(check&&isCeo()){check.disabled=true;try{await call(d.db,"manager_set_team_tool_permission",{p_auth_user_id:check.dataset.permMember,p_permission_key:check.dataset.permKey,p_allowed:check.checked});d.toast("Tool permission updated");await load()}catch(x){check.disabled=false;check.checked=!check.checked;d.toast(x.message,true)}}
 });
 load();
 if(!window.__amarTeamRefreshTimer)window.__amarTeamRefreshTimer=setInterval(()=>{if(!document.hidden&&root.isConnected)load()},30000);
}
function staff(d){
 if(!d.session?.user?.id||d.profile?.role==="admin")return;
 css();const host=d.el.querySelector("#orders")||d.el.querySelector("#dashContent")||d.el;if(!host)return;
 let root=host.querySelector("#amarTeamJoin");if(!root){root=document.createElement("section");root.id="amarTeamJoin";root.className="amar-team";host.appendChild(root)}
 const load=async()=>{
  try{
   const [memberResult,access]=await Promise.all([
    d.db.from("team_admin_members").select("display_name,admin_number,status,requested_at").eq("auth_user_id",d.session.user.id).maybeSingle(),
    call(d.db,"get_my_team_access")
   ]);
   if(memberResult.error)throw memberResult.error;
   const m=memberResult.data;
   if(!m){root.innerHTML='<h3>🤝 Office Team Join Request</h3><p class="at-muted">Order Management team-এ কাজ করতে আবেদন করো। CEO approve না করা পর্যন্ত কোনো Order access পাওয়া যাবে না।</p><div class="at-grid"><label>Name<input id="atJoinName" value="'+esc(d.profile?.name||"")+'" maxlength="80"></label><label>Admin Number<input id="atJoinNo" placeholder="AS-1002" maxlength="24"></label></div><button id="atJoin">Submit Join Request</button><span class="at-muted" id="atJoinError"></span>';return}
   if(m.status!=="approved"){root.innerHTML='<h3>Team Access Request</h3><span class="at-pill">'+esc(m.status.toUpperCase())+'</span><p>'+esc(m.display_name)+' · '+esc(m.admin_number)+'</p><p class="at-muted">CEO approval pending. No order access until approved.</p>';return}
   if(access.permissions?.["team.overview"]===true){manager({...d,teamAccess:access});return}
   if(access.permissions?.["orders.view_assigned"]!==true){root.innerHTML='<h3>Team Access</h3><p class="at-muted">তোমার account-এ এখনো কোনো Order tool permission চালু নেই। CEO-র সঙ্গে যোগাযোগ করো।</p>';return}
   const canUpdate=access.permissions?.["orders.work.update"]===true,canForward=access.permissions?.["orders.work.forward"]===true;
   const [tasks,people]=await Promise.all([
    call(d.db,"get_my_team_order_tasks"),
    canForward?call(d.db,"get_approved_team_colleagues"):Promise.resolve([])
   ]);
   root.innerHTML='<div class="at-row" style="justify-content:space-between"><div><h3>📦 My Assigned Orders</h3><span class="at-muted">'+esc(m.display_name)+' · '+esc(m.admin_number)+'</span></div><button class="secondary" id="atStaffRefresh">↻ Refresh</button></div><div class="at-list">'+tasks.map(t=>{
    const o=t.order_data||{};
    return '<div class="at-card" data-task="'+t.task_id+'"><b>Order #'+o.id+' · '+esc(o.recipient_name||"Customer")+'</b><p>'+esc(o.recipient_phone||"")+' · '+esc(o.delivery_address||"")+'<br>৳'+Number(o.total_bdt||0)+' · Customer status: '+esc(o.status)+'</p><p class="at-muted">Internal note: '+esc(t.internal_note||"—")+'</p>'+(canUpdate?'<div class="at-grid"><label>Work Status<select data-status><option value="accepted">Accepted</option><option value="in_progress">In Progress</option><option value="waiting_info">Waiting for Info</option><option value="on_hold">On Hold</option><option value="completed">Completed</option></select></label><label>Update note<textarea data-note rows="2"></textarea></label></div><button data-save>Save Status</button>':"")+(canForward?'<div class="at-grid"><label>Forward to<select data-forward><option value="">Select teammate</option>'+people.map(p=>'<option value="'+esc(p.auth_user_id)+'">'+esc(p.display_name)+' · '+esc(p.admin_number)+'</option>').join("")+'</select></label><label>Forward note<input data-forward-note></label></div><button class="secondary" data-send>Forward</button>':"")+'</div>';
   }).join("")||'<p class="at-muted">No orders assigned to you.</p>')+'</div><p class="at-muted">Customer Order Status / Payment Status এখানে পরিবর্তন হয় না।</p>';
   root.querySelectorAll("[data-task]").forEach(card=>{const t=tasks.find(x=>String(x.task_id)===card.dataset.task);const select=card.querySelector("[data-status]");if(select)select.value=t.work_status==="assigned"?"accepted":t.work_status});
  }catch(e){root.innerHTML='<h3>Team Desk</h3><p class="at-muted">'+esc(e.message)+'</p><button id="atStaffRefresh">Retry</button>'}
 };
 root.addEventListener("click",async e=>{
  if(e.target.closest("#atJoin")){const b=e.target.closest("#atJoin");b.disabled=true;try{await call(d.db,"request_team_admin",{p_display_name:root.querySelector("#atJoinName").value,p_admin_number:root.querySelector("#atJoinNo").value});d.toast("Join request submitted");load()}catch(x){b.disabled=false;root.querySelector("#atJoinError").textContent=x.message}return}
  if(e.target.closest("#atStaffRefresh")){load();return}
  const card=e.target.closest("[data-task]");if(!card)return;
  if(e.target.closest("[data-save]")){const b=e.target.closest("[data-save]");b.disabled=true;try{await call(d.db,"team_update_order_task",{p_task_id:Number(card.dataset.task),p_work_status:card.querySelector("[data-status]").value,p_note:card.querySelector("[data-note]").value});d.toast("Work status updated");load()}catch(x){b.disabled=false;d.toast(x.message,true)}}
  if(e.target.closest("[data-send]")){const to=card.querySelector("[data-forward]").value;if(!to){d.toast("Select a teammate",true);return}const b=e.target.closest("[data-send]");b.disabled=true;try{await call(d.db,"team_forward_order_task",{p_task_id:Number(card.dataset.task),p_to_member:to,p_note:card.querySelector("[data-forward-note]").value});d.toast("Task forwarded");load()}catch(x){b.disabled=false;d.toast(x.message,true)}}
 });
 load();
}
window.mountAmarShoppingTeamManager=manager;window.mountAmarShoppingTeamStaff=staff;
})();