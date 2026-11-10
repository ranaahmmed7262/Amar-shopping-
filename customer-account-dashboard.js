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
 document.head.appendChild(s);
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
  active("tracking");content.innerHTML='<section class="cad-shell"><h3 style="margin-top:0;color:#075b43">আপনার Order Tracking</h3><p class="cad-muted">শুধু আপনার account-এর অর্ডার ও status history দেখানো হবে।</p><div id="cadTrackingList">অর্ডারের তথ্য লোড হচ্ছে...</div></section>';
  const box=content.querySelector("#cadTrackingList");
  try{
   const {data:orders,error}=await d.db.from("orders").select("id,total_bdt,status,created_at,tracking_note,courier_name,tracking_number,order_items(quantity,products(name))").eq("customer_id",d.profile.id).order("created_at",{ascending:false}).limit(100);
   if(error)throw error;
   if(!orders?.length){box.innerHTML='<p class="cad-muted">আপনার account-এ এখনো কোনো order নেই।</p>';return}
   const ids=orders.map(o=>o.id);
   const {data:history,error:historyError}=await d.db.from("order_status_history").select("order_id,status,note,courier_name,tracking_number,created_at").in("order_id",ids).order("created_at",{ascending:true});
   if(historyError)throw historyError;
   const byOrder=new Map();for(const h of history||[]){if(!byOrder.has(h.order_id))byOrder.set(h.order_id,[]);byOrder.get(h.order_id).push(h)}
   box.innerHTML=orders.map(o=>{
    const hs=byOrder.get(o.id)||[];
    return '<article class="cad-order"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><b>Order #'+esc(o.id)+'</b><b>'+money(o.total_bdt)+'</b></div><p><b>বর্তমান অবস্থা:</b> '+esc(statusLabels[o.status]||o.status)+'</p><p class="cad-muted">'+new Date(o.created_at).toLocaleString("bn-BD")+'</p><p><b>Courier:</b> '+esc(o.courier_name||"এখনো নির্ধারিত হয়নি")+' &nbsp; <b>Tracking:</b> '+esc(o.tracking_number||"—")+'</p>'+(o.tracking_note?'<p><b>সর্বশেষ Update:</b> '+esc(o.tracking_note)+'</p>':"")+'<p><b>পণ্য:</b> '+(o.order_items||[]).map(i=>esc(i.products?.name||"পণ্য")+" × "+Number(i.quantity||0)).join(", ")+'</p><div class="cad-timeline">'+(hs.length?hs.map(h=>'<p><b>'+esc(statusLabels[h.status]||h.status)+'</b><br><span class="cad-muted">'+new Date(h.created_at).toLocaleString("bn-BD")+'</span>'+(h.note?'<br>'+esc(h.note):"")+(h.courier_name?'<br>Courier: '+esc(h.courier_name):"")+(h.tracking_number?'<br>Tracking: '+esc(h.tracking_number):"")+'</p>').join(""):'<p class="cad-muted">Status history এখনো যোগ হয়নি।</p>')+'</div></article>';
   }).join("");
  }catch(err){box.innerHTML='<p class="bad">Tracking load হয়নি: '+esc(err.message||"Unknown error")+'</p>'}
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
   try{const {error}=await d.db.auth.updateUser({password:next,current_password:current});if(error)throw error;form.reset();msg.textContent="পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।"}
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