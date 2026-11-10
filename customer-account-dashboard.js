/* Customer-only account dashboard. Uses existing Supabase Auth and ownership-based RLS; no schema changes. */
(function(){
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=v=>"৳"+Number(v||0).toLocaleString("en-BD");
const statusLabels={placed:"অর্ডার গ্রহণ করা হয়েছে",confirmed:"নিশ্চিত হয়েছে",processing:"প্রস্তুত করা হচ্ছে",packed:"প্যাকেট করা হয়েছে",shipped:"কুরিয়ারে পাঠানো হয়েছে",out_for_delivery:"ডেলিভারির পথে",delivered:"ডেলিভারি সম্পন্ন",cancelled:"বাতিল",rejected:"বাতিল"};
function addStyle(){
 if(document.getElementById("acdash-style"))return;
 const s=document.createElement("style");s.id="acdash-style";
 s.textContent="#customerAccountNav{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 16px}#customerAccountNav button{border:1px solid #dce9e1;background:#fff;color:#245443;border-radius:11px;padding:10px 14px;font-weight:750}#customerAccountNav button.active{background:#075b43;color:#fff;border-color:#075b43}#dashContent .cad-shell{background:linear-gradient(135deg,#f0faf4,#fff);border:1px solid #dcebe2;border-radius:16px;padding:16px;margin-bottom:14px}#dashContent .cad-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}#dashContent .cad-field{display:grid;gap:6px;margin:10px 0}#dashContent .cad-field input{width:100%;padding:11px;border:1px solid #d8e3dc;border-radius:9px;background:#fff}#dashContent .cad-muted{color:#687a72;font-size:13px}#dashContent .cad-order{background:#fff;border:1px solid #e1ebe4;border-radius:13px;padding:14px;margin:10px 0}#dashContent .cad-timeline{border-left:2px solid #b7ddc8;margin:10px 0 4px 6px;padding-left:14px}#dashContent .cad-timeline p{margin:7px 0;font-size:13px}#customerAccountNav button:focus-visible{outline:3px solid #8bd5ad;outline-offset:2px}@media(max-width:600px){#customerAccountNav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}#customerAccountNav button{padding:10px 7px;font-size:13px}}";
 s.textContent+="#dashContent .cad-progress{display:flex;gap:4px;align-items:flex-start;margin:17px 0 13px;overflow-x:auto;padding:3px 0 7px}#dashContent .cad-progress span{position:relative;display:grid;justify-items:center;gap:6px;flex:1;min-width:48px;color:#93a59b;font-size:10px;text-align:center}#dashContent .cad-progress span:before{content:\"\";position:absolute;top:5px;left:0;right:0;height:3px;background:#e6eee9}#dashContent .cad-progress span:first-child:before{left:50%}#dashContent .cad-progress span:last-child:before{right:50%}#dashContent .cad-progress i{position:relative;z-index:1;width:13px;height:13px;border:3px solid #dce8e0;border-radius:50%;background:#fff}#dashContent .cad-progress span.done:before,#dashContent .cad-progress span.current:before{background:#16a36d}#dashContent .cad-progress span.done i,#dashContent .cad-progress span.current i{border-color:#16a36d;background:#16a36d}#dashContent .cad-progress span.current i{box-shadow:0 0 0 4px #16a36d20}#dashContent .cad-progress small{font-size:10px;line-height:1.35}#dashContent .cad-status{display:inline-block;padding:5px 9px;border-radius:999px;background:#e7f6ed;color:#075b43;font-weight:800}#dashContent .cad-shipping{display:flex;gap:8px 16px;flex-wrap:wrap;padding:10px;border-radius:10px;background:#f4f8f5;font-size:12px;overflow-wrap:anywhere}#dashContent .cad-update{padding:10px;border-left:3px solid #f0b54d;background:#fff9eb;border-radius:8px;font-size:13px}#dashContent .cad-timeline h4{margin:0 0 8px;color:#075b43}";document.head.appendChild(s);
}
window.mountAmarShoppingCustomerDashboard=function(d){
 if(!d||d.profile?.role!=="customer"||!d.session?.user?.id||!d.el)return false;
 const root=d.el,nav=root.querySelector(".tabrow"),content=root.querySelector("#dashContent");
 if(!nav||!content)return false;
 addStyle();
 let bar=root.querySelector("#customerAccountNav");
 if(!bar){bar=document.createElement("nav");bar.id="customerAccountNav";bar.setAttribute("aria-label","Customer account");nav.insertAdjacentElement("afterend",bar)}
 bar.innerHTML='<button type="button" data-cad="profile">👤 Profile</button><button type="button" data-cad="orders">📦 My Orders</button><button type="button" data-cad="tracking">🚚 Order Tracking</button><button type="button" data-cad="password">🔐 Change Password</button><button type="button" data-cad="logout">↪ Logout</button>';
 const active=key=>bar.querySelectorAll("[data-cad]").forEach(b=>{b.classList.toggle("active",b.dataset.cad===key);b.setAttribute("aria-current",b.dataset.cad===key?"page":"false")});
 const profile=()=>d.profile;
 function showProfile(){
  active("profile");const p=profile();
  content.innerHTML='<section class="cad-shell"><h3 style="margin-top:0;color:#075b43">আপনার Profile</h3><p class="cad-muted">শুধু আপনার নিজের account information এখানে দেখানো হবে।</p><form id="cadProfileForm"><div class="cad-grid"><label class="cad-field">আপনার নাম<input name="name" maxlength="100" required value="'+esc(p.name||"")+'"></label><label class="cad-field">মোবাইল নম্বর<input name="phone" maxlength="30" value="'+esc(p.phone||"")+'" placeholder="01XXXXXXXXX"></label><label class="cad-field">ইমেইল ঠিকানা<input value="'+esc(p.email||d.session.user.email||"")+'" readonly aria-readonly="true"></label><label class="cad-field">Account Status<input value="Active" readonly aria-readonly="true"></label></div><button class="primary" id="cadSaveProfile" type="submit">পরিবর্তন Save করুন</button></form></section>';
  content.querySelector("#cadProfileForm").onsubmit=async e=>{
   e.preventDefault();const form=new FormData(e.currentTarget),name=String(form.get("name")||"").trim(),phone=String(form.get("phone")||"").trim(),btn=content.querySelector("#cadSaveProfile");
   if(!name){d.toast("আপনার নাম লিখুন",true);return}
   btn.disabled=true;btn.textContent="Save হচ্ছে...";
   try{
    const {data,error}=await d.db.from("users").update({name,phone:phone||null}).eq("id",p.id).eq("auth_user_id",d.session.user.id).eq("role","customer").select("id,name,email,phone,role,account_status").maybeSingle();
    if(error)throw error;if(!data)throw new Error("Profile update করা যায়নি। আবার Login করে চেষ্টা করুন।");
    Object.assign(p,data);d.profile=p;const accountButton=document.getElementById("accountBtn");if(accountButton)accountButton.textContent=p.name||"অ্যাকাউন্ট";
    d.toast("আপনার Profile আপডেট হয়েছে।");showProfile();
   }catch(err){d.toast("Profile update হয়নি: "+(err.message||"Unknown error"),true)}
   finally{if(btn.isConnected){btn.disabled=false;btn.textContent="পরিবর্তন Save করুন"}}
  };
 }
 async function showTracking(){
  active("tracking");
  content.innerHTML='<section class="cad-shell"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><h3 style="margin:0;color:#075b43">আপনার Order Tracking</h3><p class="cad-muted">অর্ডারের বর্তমান অবস্থা, ডেলিভারি ও আপডেট দেখুন।</p></div><button type="button" class="light" id="cadTrackingRefresh">↻ Refresh</button></div><div id="cadTrackingList" aria-live="polite">অর্ডারের তথ্য লোড হচ্ছে...</div></section>';
  const box=content.querySelector("#cadTrackingList"),refresh=content.querySelector("#cadTrackingRefresh");
  const steps=[["placed","অর্ডার গ্রহণ"],["confirmed","নিশ্চিত"],["processing","প্রস্তুত হচ্ছে"],["packed","প্যাকেট"],["shipped","পাঠানো হয়েছে"],["out_for_delivery","ডেলিভারির পথে"],["delivered","ডেলিভারি সম্পন্ন"]];
  const render=async()=>{
   box.innerHTML='<p class="cad-muted">অর্ডারের তথ্য লোড হচ্ছে...</p>';
   try{
    const {data:orders,error}=await d.db.from("orders").select("id,total_bdt,status,created_at,tracking_note,courier_name,tracking_number,order_items(quantity,products(name))").eq("customer_id",d.profile.id).order("created_at",{ascending:false}).limit(100);
    if(error)throw error;
    if(!orders?.length){box.innerHTML='<p class="cad-muted">আপনার account-এ এখনো কোনো order নেই। Guest order হলে Order ID ও মোবাইল নম্বর দিয়ে public tracking ব্যবহার করুন।</p>';return}
    const ids=orders.map(o=>o.id);
    const {data:history,error:historyError}=await d.db.from("order_status_history").select("order_id,status,note,courier_name,tracking_number,created_at").in("order_id",ids).order("created_at",{ascending:true});
    const byOrder=new Map();if(!historyError){for(const h of history||[]){if(!byOrder.has(h.order_id))byOrder.set(h.order_id,[]);byOrder.get(h.order_id).push(h)}}
    box.innerHTML=orders.map(o=>{
     const hs=byOrder.get(o.id)||[],current=steps.findIndex(s=>s[0]===o.status),special=["cancelled","rejected"].includes(o.status);
     const progress=special?'<p class="cad-muted" style="color:#a33b32;font-weight:800">এই অর্ডারটি '+esc(statusLabels[o.status]||o.status)+'।</p>':'<div class="cad-progress" aria-label="অর্ডারের অগ্রগতি">'+steps.map((s,i)=>'<span class="'+(current>=0&&i<current?'done':i===current?'current':'')+'"><i></i><small>'+s[1]+'</small></span>').join("")+'</div>';
     const timeline=hs.length?hs.map(h=>'<p><b>'+esc(statusLabels[h.status]||h.status)+'</b><br><span class="cad-muted">'+new Date(h.created_at).toLocaleString("bn-BD")+'</span>'+(h.note?'<br>'+esc(h.note):"")+(h.courier_name?'<br>Courier: '+esc(h.courier_name):"")+(h.tracking_number?'<br>Tracking: '+esc(h.tracking_number):"")+'</p>').join(""):'<p class="cad-muted">'+(historyError?'বিস্তারিত Status History এখন পাওয়া যাচ্ছে না। ':'Status History এখনো যোগ হয়নি। ')+'বর্তমান অবস্থা: '+esc(statusLabels[o.status]||o.status)+'</p>';
     return '<article class="cad-order"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><b>Order #'+esc(o.id)+'</b><b>'+money(o.total_bdt)+'</b></div><p><b>বর্তমান অবস্থা:</b> <span class="cad-status">'+esc(statusLabels[o.status]||o.status)+'</span></p><p class="cad-muted">'+new Date(o.created_at).toLocaleString("bn-BD")+'</p>'+progress+'<div class="cad-shipping"><span>🚚 Courier: <b>'+esc(o.courier_name||"এখনো নির্ধারিত হয়নি")+'</b></span><span>🔎 Tracking: <b>'+esc(o.tracking_number||"—")+'</b></span></div>'+(o.tracking_note?'<p class="cad-update">✦ '+esc(o.tracking_note)+'</p>':'')+'<p><b>পণ্য:</b> '+(o.order_items||[]).map(i=>esc(i.products?.name||"পণ্য")+" × "+Number(i.quantity||0)).join(", ")+'</p><div class="cad-timeline"><h4>Order Journey</h4>'+timeline+'</div></article>';
    }).join("");
   }catch(err){box.innerHTML='<p class="bad">Tracking load হয়নি: '+esc(err.message||"Unknown error")+'</p>'}
  };
  refresh.onclick=async()=>{refresh.disabled=true;refresh.textContent="লোড হচ্ছে...";await render();if(refresh.isConnected){refresh.disabled=false;refresh.textContent="↻ Refresh"}};
  await render();
 }
 function showPassword(){
  active("password");content.innerHTML='<section class="cad-shell"><h3 style="margin-top:0;color:#075b43">পাসওয়ার্ড পরিবর্তন</h3><p class="cad-muted">বর্তমান পাসওয়ার্ড দিয়ে যাচাই করে নতুন পাসওয়ার্ড সেট করুন। আপনার password আমাদের website database-এ সংরক্ষণ করা হয় না।</p><form id="cadPasswordForm"><label class="cad-field">বর্তমান পাসওয়ার্ড<input name="current" type="password" autocomplete="current-password" required></label><label class="cad-field">নতুন পাসওয়ার্ড<input name="next" type="password" minlength="8" autocomplete="new-password" required></label><label class="cad-field">নতুন পাসওয়ার্ড আবার লিখুন<input name="confirm" type="password" minlength="8" autocomplete="new-password" required></label><button type="submit" class="primary" id="cadPasswordSave">পাসওয়ার্ড পরিবর্তন করুন</button></form><div style="margin-top:12px"><button type="button" class="light" id="cadPasswordReset">ইমেইলে Reset Link নিন (বিকল্প)</button></div><p class="cad-muted" id="cadResetMsg" aria-live="polite"></p></section>';
  const form=content.querySelector("#cadPasswordForm"),msg=content.querySelector("#cadResetMsg");
  form.onsubmit=async e=>{
   e.preventDefault();const fd=new FormData(form),current=String(fd.get("current")||""),next=String(fd.get("next")||""),confirmPassword=String(fd.get("confirm")||""),btn=content.querySelector("#cadPasswordSave");
   if(next.length<8){msg.textContent="নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।";return}
   if(next!==confirmPassword){msg.textContent="নতুন পাসওয়ার্ড দুটি মিলছে না।";return}
   if(next===current){msg.textContent="নতুন পাসওয়ার্ডটি বর্তমান পাসওয়ার্ড থেকে আলাদা দিন।";return}
   btn.disabled=true;btn.textContent="যাচাই ও পরিবর্তন হচ্ছে...";
   try{
    const email=d.session.user.email||d.profile.email;
    if(!email)throw new Error("Account email পাওয়া যায়নি।");
    const {data:verified,error:verifyError}=await d.db.auth.signInWithPassword({email,password:current});
    if(verifyError)throw new Error("বর্তমান পাসওয়ার্ড সঠিক নয়।");
    if(!verified?.user?.id||verified.user.id!==d.session.user.id)throw new Error("Account verification মেলেনি; নিরাপত্তার জন্য পরিবর্তন বন্ধ করা হয়েছে।");
    const {error}=await d.db.auth.updateUser({password:next});
    if(error)throw error;
    d.session=verified.session||d.session;
    form.reset();msg.textContent="পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।"}
   catch(err){msg.textContent="পাসওয়ার্ড পরিবর্তন হয়নি: "+(err.message||"বর্তমান password যাচাই করুন অথবা ইমেইল Reset Link ব্যবহার করুন।")}
   finally{btn.disabled=false;btn.textContent="পাসওয়ার্ড পরিবর্তন করুন"}
  };
  content.querySelector("#cadPasswordReset").onclick=async e=>{
   const btn=e.currentTarget;btn.disabled=true;
   try{const email=d.session.user.email||d.profile.email;if(!email)throw new Error("Account email পাওয়া যায়নি।");const {error}=await d.db.auth.resetPasswordForEmail(email,{redirectTo:"https://amar-shopping-bd-live.onrender.com/"});if(error)throw error;msg.textContent="Reset link পাঠানো হয়েছে। Inbox ও Spam folder দেখুন।"}
   catch(err){msg.textContent="Reset link পাঠানো যায়নি: "+(err.message||"আবার চেষ্টা করুন")}
   finally{btn.disabled=false}
  };
 }
 bar.onclick=async e=>{
  const b=e.target.closest("[data-cad]");if(!b)return;
  const key=b.dataset.cad;
  if(key==="profile")showProfile();
  else if(key==="tracking")await showTracking();
  else if(key==="password")showPassword();
  else if(key==="orders"){active("orders");const old=root.querySelector('[data-tab="orders"]');if(old)old.click();else showTracking()}
  else if(key==="logout"){if(!confirm("আপনি কি Amar Shopping থেকে Logout করতে চান?"))return;const {error}=await d.db.auth.signOut();if(error)d.toast("Logout হয়নি: "+error.message,true)}
 };
 const oldOrders=root.querySelector('[data-tab="orders"]');if(oldOrders)oldOrders.addEventListener("click",()=>active("orders"));
 showProfile();
 return true;
};
})();