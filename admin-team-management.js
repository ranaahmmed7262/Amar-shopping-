/* Amar Shopping Team Operations — additive, internal workflow only. */
(function(){
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const labels={assigned:"Assigned",accepted:"Accepted",in_progress:"In Progress",waiting_info:"Waiting for Info",forwarded:"Forwarded",completed:"Completed",on_hold:"On Hold"};
const workflowStages=[
 ["received","Order Received / নতুন অর্ডার এসেছে"],["assigned","Assigned / দায়িত্ব দেওয়া হয়েছে"],["accepted","Accepted / দায়িত্ব গ্রহণ"],
 ["team_1","Team 1 / প্রথম ধাপ"],["team_2","Team 2 / দ্বিতীয় ধাপ"],["team_3","Team 3 / তৃতীয় ধাপ"],["team_4","Team 4 / চতুর্থ ধাপ"],["team_5","Team 5 / পঞ্চম ধাপ"],
 ["processing","Processing / কাজ চলছে"],["quality_check","Quality Check / যাচাই"],["waiting_info","Waiting for Info / তথ্য অপেক্ষমাণ"],
 ["packed","Packed / প্যাকিং সম্পন্ন"],["ready_for_dispatch","Ready for Dispatch / পাঠানোর জন্য প্রস্তুত"],["courier_handover","Courier Handover / কুরিয়ারে হস্তান্তর"],["delivery_followup","Delivery Follow-up / ডেলিভারি নিশ্চিতকরণ"],
 ["on_hold","On Hold / সাময়িক বিরতি"],["completed","Completed / ডেলিভারি সম্পন্ন"],["closed_cancelled","Closed / বাতিল অর্ডার"]
];
const call=async(db,name,args={})=>{const r=await db.rpc(name,args);if(r.error)throw r.error;return r.data};
function css(){if(document.getElementById("amar-team-style"))return;const s=document.createElement("style");s.id="amar-team-style";s.textContent=".amar-team{margin:18px 0;padding:16px;border:1px solid #d5e8dc;border-radius:16px;background:#f5fbf7;color:#173d2d}.amar-team h3{margin:0 0 8px;color:#075b43}.amar-team .at-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:9px;margin:12px 0}.amar-team .at-card{padding:12px;border:1px solid #dce9e1;border-radius:11px;background:white}.amar-team .at-muted{font-size:12px;color:#60776a}.amar-team input,.amar-team select,.amar-team textarea{width:100%;padding:9px;border:1px solid #cfddd4;border-radius:8px;background:white;color:#173d2d}.amar-team label{display:grid;gap:5px;font-size:12px;font-weight:700}.amar-team button{border:0;border-radius:8px;padding:9px 12px;background:#087f5b;color:white;font-weight:700;cursor:pointer}.amar-team button.secondary{background:#e6f2ea;color:#075b43;border:1px solid #d5e5da}.amar-team button.danger{background:#9c3333}.amar-team button:disabled{opacity:.5}.amar-team .at-list{display:grid;gap:8px;margin:10px 0}.amar-team .at-pill{display:inline-block;border-radius:20px;padding:4px 9px;background:#e2f3e8;color:#075b43;font-size:11px;font-weight:800}.amar-team .at-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.amar-team hr{border:0;border-top:1px solid #dce9e1;margin:14px 0}";document.head.appendChild(s)}
function manager(d){
 const initial=d.teamAccess||{};
 css();
 const host=d.el.querySelector("#adminPanel-adminHome")||d.el.querySelector("#allOrders")?.parentElement||d.el;
 if(!host)return false;
 let root=host.querySelector("#amarTeamManager");
 if(!root){root=document.createElement("section");root.id="amarTeamManager";root.className="amar-team";host.appendChild(root)}
 let activeTab="overview",loading=false,ov=null,orders=[],access=initial,matrix=null,people=[],taskEvents=[],memberEvents=[];
 const permissionNames={
  "team.overview":"Team Overview & Work Board",
  "team.members.view":"View Team Members",
  "orders.assign":"Assign / Reassign Orders",
  "orders.view_assigned":"View Assigned Orders",
  "orders.work.update":"Update Team Workflow Status",
  "orders.work.forward":"Forward Tasks"
 };
 const roleNames={manager:"Manager",admin:"Admin",employee:"Employee",viewer:"Viewer"};
 const workflow=workflowStages;
 const stageName=k=>(workflow.find(x=>x[0]===k)||[k,k])[1];
 const isCeo=()=>access.is_ceo===true;
 const perms=()=>access.permissions||{};
 const allowed=k=>isCeo()||perms()[k]===true;
 const notify=(message,error)=>{if(typeof d.toast==="function")d.toast(message,!!error)};
 const tabButton=(key,label)=>'<button type="button" class="'+(activeTab===key?"":"secondary")+'" data-tab="'+key+'">'+label+'</button>';
 function render(){
  const members=ov?.members||[],pending=members.filter(x=>x.status==="pending"),approved=members.filter(x=>x.status==="approved"),tasks=ov?.tasks||[],c=ov?.counts||{};
  const visibleMembers=matrix?.members||members,permissionRows=matrix?.permissions||[],permMap={};
  permissionRows.forEach(p=>{if(!permMap[p.member_auth_user_id])permMap[p.member_auth_user_id]={};permMap[p.member_auth_user_id][p.permission_key]=p.allowed});
  let html='<div class="at-row" style="justify-content:space-between"><div><h3>👥 Team Operations</h3><span class="at-muted">Members · Roles · Order workflow · Permissions · Activity</span></div><button class="secondary" id="atRefresh">↻ Refresh</button></div>';
  html+='<div class="at-row" style="margin:12px 0">'+tabButton("overview","Overview")+(isCeo()?tabButton("members","Team Members")+tabButton("requests","Join Requests")+tabButton("roles","Role Management")+tabButton("permissions","Tool Access Control"):"")+(allowed("orders.assign")||allowed("team.overview")?tabButton("orders","Order Workflow"):"")+tabButton("activity","Activity Log")+'</div>';
  if(activeTab==="overview"){
   html+='<div class="at-grid">'+[["New Received",c.received],["Unassigned",c.unassigned],["Assigned",c.assigned],["In Progress",c.in_progress],["Completed",c.completed],["Overdue",c.overdue],["Cancelled",c.cancelled],["Team Members",approved.length]].map(x=>'<div class="at-card"><span class="at-muted">'+x[0]+'</span><h3>'+String(x[1]??0)+'</h3></div>').join("")+'</div>';
   if(isCeo())html+='<div class="at-card"><b>CEO Control · Full Access</b><p class="at-muted">CEO-এর সব Team ও Order tools-এর পূর্ণ Access থাকবে। Team Mode-এ কাজ Assign করুন; Solo Mode-এ Employee assignment ছাড়াও পরিচালনা করতে পারবেন।</p><button class="secondary" id="atMode">'+(root.dataset.solo==="true"?"Switch to Team Mode":"Switch to Solo Mode")+'</button></div>';
   html+='<div class="at-card"><b>Order Workflow</b><p class="at-muted">Received → Assigned → Accepted → Team 1 → Team 2 → Team 3 → Team 4 → Team 5 → Processing → Quality Check → Packed → Ready for Dispatch → Courier Handover → Completed.</p><p class="at-muted">এটি Internal Team Status; এটি শুধু Internal Team Follow-up; Customer Order Status/Tracking একদম আলাদা থাকবে।</p></div>';
   html+='<h4>Recent Team Work</h4><div class="at-list">'+tasks.slice(0,8).map(t=>'<div class="at-card"><b>Order #'+esc(t.order_id)+'</b> <span class="at-pill">'+esc(stageName(t.work_status))+'</span><p class="at-muted">'+esc(t.assignee_name||"—")+' · '+esc(t.admin_number||"")+' · '+esc(t.updated_at?new Date(t.updated_at).toLocaleString():"")+'</p></div>').join("")+'</div>';
  }
  if(activeTab==="requests"&&isCeo()){
   html+='<h4>🛡️ Join Requests ('+pending.length+')</h4><div class="at-list">'+(pending.map(m=>'<div class="at-card"><b>'+esc(m.display_name)+' · '+esc(m.admin_number)+'</b><p class="at-muted">Request: '+esc(new Date(m.requested_at).toLocaleString())+'</p><div class="at-row"><button data-member="approved" data-id="'+esc(m.auth_user_id)+'">Approve as Employee</button><button class="danger" data-member="rejected" data-id="'+esc(m.auth_user_id)+'">Reject</button></div></div>').join("")||'<p class="at-muted">কোনো pending request নেই।</p>')+'</div>';
  }
  if(activeTab==="members"&&isCeo()){
   html+='<h4>👤 Team Members</h4><div class="at-list">'+(visibleMembers.map(m=>'<div class="at-card"><div class="at-row" style="justify-content:space-between"><b>'+esc(m.display_name)+' · '+esc(m.admin_number)+'</b><span class="at-pill">'+esc(m.status.toUpperCase())+'</span></div><p class="at-muted">Role: '+esc(roleNames[m.access_level]||m.access_level)+' · Joined: '+esc(new Date(m.requested_at).toLocaleDateString())+'</p>'+(m.auth_user_id===d.session?.user?.id?'<b>CEO · ALL ACCESS · LOCKED</b>':m.status==="approved"?'<button class="danger" data-member="suspended" data-id="'+esc(m.auth_user_id)+'">Suspend Access</button>':(m.status==="suspended"||m.status==="rejected")?'<button data-member="approved" data-id="'+esc(m.auth_user_id)+'">Restore as Employee</button>':"")+'</div>').join("")||'<p>এখনো কোনো Team Member নেই।</p>')+'</div>';
  }
  if(activeTab==="roles"&&isCeo()){
   html+='<h4>🎭 Role Management</h4><p class="at-muted">Role Template প্রয়োগ করলে সংশ্লিষ্ট Default Permission বসবে। CEO-এর Role স্থায়ী ও Locked থাকবে।</p><div class="at-list">';
   html+=visibleMembers.filter(m=>m.status==="approved").map(m=>{
    if(m.auth_user_id===d.session?.user?.id)return '<div class="at-card"><b>👑 '+esc(m.display_name)+' · CEO</b><span class="at-pill">ALL ACCESS · LOCKED</span></div>';
    return '<div class="at-card"><b>'+esc(m.display_name)+' · '+esc(m.admin_number)+'</b><label>Role<select data-role-member="'+esc(m.auth_user_id)+'">'+Object.keys(roleNames).map(k=>'<option value="'+k+'" '+(m.access_level===k?"selected":"")+'>'+roleNames[k]+'</option>').join("")+'</select></label></div>';
   }).join("")+'</div>';
  }
  if(activeTab==="permissions"&&isCeo()){
   html+='<h4>🔐 Tool Access Control</h4><p class="at-muted">প্রতিটি কর্মীর Tool Access আলাদাভাবে ON/OFF করুন। Server-side Permission প্রতিটি protected action-এ যাচাই হবে।</p><div class="at-list">';
   html+=visibleMembers.filter(m=>m.status==="approved").map(m=>{
    if(m.auth_user_id===d.session?.user?.id)return '<div class="at-card"><b>👑 '+esc(m.display_name)+' · CEO</b><span class="at-pill">ALL TOOLS · ALWAYS ON · LOCKED</span></div>';
    const selected=permMap[m.auth_user_id]||{};
    const checks=Object.keys(permissionNames).map(k=>'<label style="display:flex;grid-template-columns:auto 1fr;align-items:center;gap:8px;font-weight:500"><input type="checkbox" data-perm-member="'+esc(m.auth_user_id)+'" data-perm-key="'+k+'" '+(selected[k]===true?"checked":"")+' style="width:auto"> '+permissionNames[k]+'</label>').join("");
    return '<div class="at-card"><b>'+esc(m.display_name)+' · '+esc(m.admin_number)+'</b><div class="at-list">'+checks+'</div></div>';
   }).join("")+'</div>';
  }
  if(activeTab==="orders"&&(allowed("orders.assign")||allowed("team.overview"))){
   if(allowed("orders.assign"))html+='<h4>📥 New Orders · Unassigned Team Queue</h4><p class="at-muted">এখানে শুধু নতুন/এখনো কাউকে দেওয়া হয়নি এমন Order থাকবে। Customer status পরিবর্তন হবে না।</p><div class="at-grid"><label>Order<select id="atOrder"><option value="">Select unassigned order</option>'+orders.map(o=>'<option value="'+o.id+'">#'+o.id+' · '+esc(o.recipient_name||"Customer")+' · '+esc(o.status)+'</option>').join("")+'</select></label><label>Team Member<select id="atMember"><option value="">Select member</option>'+people.map(m=>'<option value="'+esc(m.auth_user_id)+'">'+esc(m.display_name)+' · '+esc(m.admin_number)+'</option>').join("")+'</select></label><label>Due date<input id="atDue" type="datetime-local"></label><label>Handover note<textarea id="atNote" rows="2" maxlength="1000" placeholder="কী কাজ করতে হবে"></textarea></label></div><button id="atAssign" '+(people.length?"":"disabled")+'>Assign to Team Member</button>';
   html+='<h4>📋 Internal Team Follow-up Board ('+tasks.length+')</h4><div class="at-list">'+(tasks.map(t=>'<div class="at-card" data-task="'+esc(t.id)+'"><div class="at-row" style="justify-content:space-between"><b>Order #'+esc(t.order_id)+'</b><span class="at-pill">'+esc(stageName(t.work_status))+'</span></div><p class="at-muted">'+esc(t.assignee_name||"Unassigned queue")+' · '+esc(t.admin_number||"")+' · '+esc(t.updated_at?new Date(t.updated_at).toLocaleString():"")+'</p><p>'+esc(t.internal_note||"No internal note")+'</p>'+(allowed("orders.work.update")&&t.assigned_to?'<label>Internal Work Stage<select data-task-status>'+workflow.filter(x=>["accepted","waiting_info","on_hold"].includes(x[0])).map(x=>'<option value="'+x[0]+'" '+(t.work_status===x[0]?"selected":"")+'>'+esc(x[1])+'</option>').join("")+'</select></label><label>Internal Note<textarea data-task-note rows="2" maxlength="1000"></textarea></label><button data-save-task>Save Internal Progress</button>':"")+(allowed("orders.work.forward")&&t.assigned_to?'<div class="at-grid"><label>Forward to Team Member<select data-manager-forward><option value="">Choose next person</option>'+people.filter(m=>m.auth_user_id!==t.assigned_to).map(m=>'<option value="'+esc(m.auth_user_id)+'">'+esc(m.display_name)+' · '+esc(m.admin_number)+'</option>').join("")+'</select></label><label>Next internal stage<select data-manager-next>'+workflow.filter(x=>["team_1","team_2","team_3","team_4","team_5","processing","quality_check","packed","ready_for_dispatch","courier_handover","delivery_followup","waiting_info","on_hold"].includes(x[0])).map(x=>'<option value="'+x[0]+'">'+esc(x[1])+'</option>').join("")+'</select></label><label>Handover note<textarea data-manager-forward-note rows="2"></textarea></label></div><button class="secondary" data-manager-send>Forward to Next Team</button>':"")+'</div>').join("")||'<p>No internal tasks found.</p>')+'</div>';
  }
  if(activeTab==="activity"){
   html+='<h4>🧾 Recent Team Activity</h4><div class="at-list">'+taskEvents.map(e=>'<div class="at-card"><b>Order #'+esc(e.order_id)+' · '+esc(e.event_type)+'</b><p class="at-muted">By '+esc(visibleMembers.find(m=>m.auth_user_id===e.actor_id)?.display_name||"Team member")+' · '+esc(stageName(e.from_status)||"—")+' → '+esc(stageName(e.to_status)||"—")+' · '+esc(new Date(e.created_at).toLocaleString())+'</p><p>'+esc(e.note||"")+'</p></div>').join("")+'</div><h4>Member Activity</h4><div class="at-list">'+memberEvents.map(e=>'<div class="at-card"><b>'+esc(e.event_type)+' · '+esc(visibleMembers.find(m=>m.auth_user_id===e.member_auth_user_id)?.display_name||"Team member")+'</b><p class="at-muted">By '+esc(visibleMembers.find(m=>m.auth_user_id===e.actor_auth_user_id)?.display_name||"Team admin")+' · '+esc(new Date(e.created_at).toLocaleString())+'</p><p>'+esc(e.note||"")+'</p></div>').join("")+'</div>';
  }
  root.innerHTML=html;
 }
 async function load(){
  if(loading)return;loading=true;
  root.innerHTML='<h3>👥 Team Operations</h3><p class="at-muted">Secure team data loading…</p>';
  try{
   access=await call(d.db,"get_my_team_access");
   if(!isCeo()&&!allowed("team.overview")){
    root.innerHTML='<h3>👥 Team Operations</h3><div class="at-card"><b>CEO / Team permission পাওয়া যায়নি</b><p class="at-muted">Server-side OTP verified session check সফল হয়নি, অথবা Team Overview permission নেই। Security bypass করা হয়নি। নিচে Server access result: '+esc(access.status||"unknown")+' · Role: '+esc(access.role||"unknown")+'</p><button class="secondary" id="atRefresh">↻ Retry</button></div>';
    return;
   }
   const results=await Promise.allSettled([
    call(d.db,"manager_get_team_overview"),
    allowed("orders.assign")?call(d.db,"manager_get_assignable_orders"):Promise.resolve([]),
    (allowed("orders.assign")||allowed("orders.work.forward"))?call(d.db,"get_approved_team_colleagues"):Promise.resolve([]),
    isCeo()?call(d.db,"manager_get_team_access_matrix"):Promise.resolve(null),
    d.db.from("team_order_task_events").select("order_id,event_type,from_status,to_status,note,created_at,actor_id").order("created_at",{ascending:false}).limit(60),
    d.db.from("team_member_events").select("event_type,note,created_at,member_auth_user_id,actor_auth_user_id").order("created_at",{ascending:false}).limit(40)
   ]);
   if(results[0].status==="rejected")throw results[0].reason;
   ov=results[0].value;orders=results[1].status==="fulfilled"?(results[1].value||[]):[];
   people=results[2].status==="fulfilled"?(results[2].value||[]):[];
   matrix=results[3].status==="fulfilled"?results[3].value:null;
   taskEvents=results[4].status==="fulfilled"?(results[4].value.data||[]):[];
   memberEvents=results[5].status==="fulfilled"?(results[5].value.data||[]):[];
   render();
   const errs=results.slice(1).map((r,i)=>r.status==="rejected"?["Order assignment","Team directory","CEO access matrix","Order activity","Member activity"][i]+": "+(r.reason?.message||"Load failed"):null).filter(Boolean);
   if(errs.length){const note=document.createElement("div");note.className="at-card";note.style.marginTop="10px";note.textContent="কিছু অতিরিক্ত তথ্য লোড হয়নি: "+errs.join(" · ");root.appendChild(note)}
  }catch(e){root.innerHTML='<h3>👥 Team Operations</h3><div class="at-card"><b>Team data load failed</b><p class="at-muted">'+esc(e?.message||"Unknown error")+'</p><button id="atRefresh">↻ Retry</button></div>'}
  finally{loading=false}
 }
 root.addEventListener("click",async e=>{
  if(e.target.closest("#atRefresh")){load();return}
  if(e.target.closest("[data-tab]")){activeTab=e.target.closest("[data-tab]").dataset.tab;render();return}
  if(e.target.closest("#atMode")&&isCeo()){root.dataset.solo=root.dataset.solo==="true"?"false":"true";render();return}
  const member=e.target.closest("[data-member]");
  if(member&&isCeo()){member.disabled=true;try{await call(d.db,"manager_set_team_member_status",{p_auth_user_id:member.dataset.id,p_status:member.dataset.member,p_admin_number:null});notify("Team member updated");await load()}catch(x){member.disabled=false;notify(x.message,true)}return}
  if(e.target.closest("#atAssign")&&allowed("orders.assign")){
   const order=Number(root.querySelector("#atOrder")?.value),person=root.querySelector("#atMember")?.value;
   if(!order||!person){notify("Order ও Team Member নির্বাচন করুন",true);return}
   const btn=e.target.closest("#atAssign");btn.disabled=true;
   try{await call(d.db,"manager_assign_order",{p_order_id:order,p_assignee:person,p_note:root.querySelector("#atNote").value,p_due_at:root.querySelector("#atDue").value?new Date(root.querySelector("#atDue").value).toISOString():null});notify("Order assigned successfully");activeTab="orders";await load()}catch(x){btn.disabled=false;notify(x.message,true)}
   return;
  }
  const forward=e.target.closest("[data-manager-send]");
  if(forward&&allowed("orders.work.forward")){
   const card=forward.closest("[data-task]"),to=card.querySelector("[data-manager-forward]").value,next=card.querySelector("[data-manager-next]").value,note=card.querySelector("[data-manager-forward-note]").value;
   if(!to){notify("পরবর্তী Team Member নির্বাচন করুন",true);return}
   forward.disabled=true;
   try{await call(d.db,"team_forward_order_task",{p_task_id:Number(card.dataset.task),p_to_member:to,p_next_status:next,p_note:note});notify("কাজটি পরবর্তী Team Member-কে পাঠানো হয়েছে");activeTab="orders";await load()}catch(x){forward.disabled=false;notify(x.message,true)}
   return;
  }
  const save=e.target.closest("[data-save-task]");
  if(save&&allowed("orders.work.update")){
   const card=save.closest("[data-task]");save.disabled=true;
   try{await call(d.db,"team_update_order_task",{p_task_id:Number(card.dataset.task),p_work_status:card.querySelector("[data-task-status]").value,p_note:card.querySelector("[data-task-note]").value});notify("Workflow status updated");activeTab="orders";await load()}catch(x){save.disabled=false;notify(x.message,true)}
  }
 });
 root.addEventListener("change",async e=>{
  const role=e.target.closest("[data-role-member]");
  if(role&&isCeo()){role.disabled=true;try{await call(d.db,"manager_set_team_member_role",{p_auth_user_id:role.dataset.roleMember,p_role:role.value});notify("Role template applied");activeTab="roles";await load()}catch(x){role.disabled=false;notify(x.message,true)}return}
  const check=e.target.closest("[data-perm-member]");
  if(check&&isCeo()){check.disabled=true;try{await call(d.db,"manager_set_team_tool_permission",{p_auth_user_id:check.dataset.permMember,p_permission_key:check.dataset.permKey,p_allowed:check.checked});notify("Tool permission updated");activeTab="roles";await load()}catch(x){check.disabled=false;check.checked=!check.checked;notify(x.message,true)}}
 });
 load();
 if(!window.__amarTeamRefreshTimer)window.__amarTeamRefreshTimer=setInterval(()=>{if(!document.hidden&&root.isConnected)load()},30000);
 return true;
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
    return '<div class="at-card" data-task="'+t.task_id+'"><b>Order #'+o.id+' · '+esc(o.recipient_name||"Customer")+'</b><p>'+esc(o.recipient_phone||"")+' · '+esc(o.delivery_address||"")+'<br>৳'+Number(o.total_bdt||0)+' · Customer status: '+esc(o.status)+'</p><p class="at-muted">Internal note: '+esc(t.internal_note||"—")+'</p>'+(canUpdate?'<div class="at-grid"><label>Work Status<select data-status>'+workflowStages.filter(x=>["accepted","waiting_info","on_hold"].includes(x[0])).map(x=>'<option value="'+x[0]+'">'+esc(x[1])+'</option>').join("")+'</select></label><label>Update note<textarea data-note rows="2"></textarea></label></div><button data-save>Save Status</button>':"")+(canForward?'<div class="at-grid"><label>Forward to next teammate<select data-forward><option value="">Select teammate</option>'+people.filter(p=>p.auth_user_id!==d.session.user.id).map(p=>'<option value="'+esc(p.auth_user_id)+'">'+esc(p.display_name)+' · '+esc(p.admin_number)+'</option>').join("")+'</select></label><label>Next internal stage<select data-forward-stage>'+workflowStages.filter(x=>["team_1","team_2","team_3","team_4","team_5","processing","quality_check","packed","ready_for_dispatch","courier_handover","delivery_followup","waiting_info","on_hold"].includes(x[0])).map(x=>'<option value="'+x[0]+'">'+esc(x[1])+'</option>').join("")+'</select></label><label>Handover note<textarea data-forward-note rows="2"></textarea></label></div><button class="secondary" data-send>Forward to Next Team</button>':"")+'</div>';
   }).join("")||'<p class="at-muted">No orders assigned to you.</p>')+'</div><p class="at-muted">Customer Order Status / Payment Status এখানে পরিবর্তন হয় না।</p>';
   root.querySelectorAll("[data-task]").forEach(card=>{const t=tasks.find(x=>String(x.task_id)===card.dataset.task);const select=card.querySelector("[data-status]");if(select)select.value=t.work_status==="assigned"?"accepted":t.work_status});
  }catch(e){root.innerHTML='<h3>Team Desk</h3><p class="at-muted">'+esc(e.message)+'</p><button id="atStaffRefresh">Retry</button>'}
 };
 root.addEventListener("click",async e=>{
  if(e.target.closest("#atJoin")){const b=e.target.closest("#atJoin");b.disabled=true;try{await call(d.db,"request_team_admin",{p_display_name:root.querySelector("#atJoinName").value,p_admin_number:root.querySelector("#atJoinNo").value});d.toast("Join request submitted");load()}catch(x){b.disabled=false;root.querySelector("#atJoinError").textContent=x.message}return}
  if(e.target.closest("#atStaffRefresh")){load();return}
  const card=e.target.closest("[data-task]");if(!card)return;
  if(e.target.closest("[data-save]")){const b=e.target.closest("[data-save]");b.disabled=true;try{await call(d.db,"team_update_order_task",{p_task_id:Number(card.dataset.task),p_work_status:card.querySelector("[data-status]").value,p_note:card.querySelector("[data-note]").value});d.toast("Work status updated");load()}catch(x){b.disabled=false;d.toast(x.message,true)}}
  if(e.target.closest("[data-send]")){const to=card.querySelector("[data-forward]").value;if(!to){d.toast("Select a teammate",true);return}const b=e.target.closest("[data-send]");b.disabled=true;try{await call(d.db,"team_forward_order_task",{p_task_id:Number(card.dataset.task),p_to_member:to,p_next_status:card.querySelector("[data-forward-stage]").value,p_note:card.querySelector("[data-forward-note]").value});d.toast("Task forwarded");load()}catch(x){b.disabled=false;d.toast(x.message,true)}}
 });
 load();
}
window.mountAmarShoppingTeamManager=manager;window.mountAmarShoppingTeamStaff=staff;
})();