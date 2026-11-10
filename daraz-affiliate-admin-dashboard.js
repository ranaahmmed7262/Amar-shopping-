/* Separate Daraz affiliate product manager.
 * This module only manages public affiliate listing metadata; it never reads
 * marketplace orders, customers, seller balances, payment accounts or payouts.
 */
(() => {
  "use strict";

  const safeHttpsUrl = (value) => {
    try {
      const parsed = new URL(String(value || "").trim());
      return parsed.protocol === "https:" ? parsed.href : null;
    } catch {
      return null;
    }
  };

  window.mountAmarShoppingAffiliateDashboard = ({ db, profile, el, toast, adminOtpVerified }) => {
    if (!db || !el || profile?.role !== "admin" || adminOtpVerified !== true) return;
    if (el.querySelector("#affiliateAdminPanel")) return;

    const nav = el.querySelector(".admin-control-nav");
    const home = el.querySelector("#adminPanel-adminHome");
    if (!nav || !home) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "light";
    button.dataset.affiliateAdminNav = "true";
    button.textContent = "🛒 Daraz Affiliate";
    nav.appendChild(button);

    const panel = document.createElement("section");
    panel.className = "admin-panel";
    panel.id = "affiliateAdminPanel";
    panel.hidden = true;
    panel.innerHTML = `
      <div class="adminitem" style="padding:16px">
        <div class="row" style="justify-content:space-between;gap:10px;flex-wrap:wrap">
          <div><h3 style="margin:0">Daraz Affiliate Manager</h3><p class="muted">শুধু Affiliate পণ্যের আলাদা ব্যবস্থাপনা</p></div>
          <button type="button" class="light" id="affiliateRefresh">Refresh</button>
        </div>
        <div class="adminitem" style="margin-top:12px;padding:14px">
          <div class="row" style="justify-content:space-between;gap:10px;align-items:center">
            <div><b>Daraz সংযোগ নিয়ন্ত্রণ</b><p id="darazConnectionStatus" class="muted" aria-live="polite">সংযোগের অবস্থা যাচাই হচ্ছে...</p></div>
            <div class="row" style="gap:8px">
              <button type="button" class="primary" id="darazConnectButton" disabled>Connect Daraz</button>
              <button type="button" class="light" id="darazDisconnectButton" disabled>Disconnect Daraz</button>
            </div>
          </div>
          <p class="muted">Disconnect করলে Daraz Affiliate integration বন্ধ হিসেবে চিহ্নিত হবে। Reconnect করলে আগের Affiliate পণ্য/তথ্য অক্ষত থাকবে। এটি Daraz অ্যাকাউন্ট বা তাদের সাইটে লগইন বাতিল করে না।</p>
        </div>
        <div class="notice">এটি Amar Shopping-এর নিজস্ব পণ্য, অর্ডার, কাস্টমার, Seller Panel বা পেমেন্ট নিয়ন্ত্রণ করে না। Daraz affiliate link ও পণ্যের তথ্য এখানে ম্যানুয়ালি যোগ হবে।</div>
        <form id="affiliateProductForm" class="adminitem" style="margin-top:14px">
          <h4 id="affiliateFormTitle">নতুন Daraz Affiliate পণ্য</h4>
          <input type="hidden" name="id">
          <div class="field"><label>পণ্যের নাম</label><input name="product_name" maxlength="180" required></div>
          <div class="field"><label>ক্যাটাগরি</label><input name="category" maxlength="80" placeholder="Electronics / Fashion" required></div>
          <div class="field"><label>সংক্ষিপ্ত বিবরণ</label><textarea name="description" maxlength="2000" rows="2"></textarea></div>
          <div class="field"><label>পণ্যের ছবি URL (HTTPS)</label><input name="image_url" type="url" placeholder="https://..." required></div>
          <div class="field"><label>Daraz product URL (HTTPS)</label><input name="product_url" type="url" placeholder="https://www.daraz.com.bd/..." required></div>
          <div class="field"><label>তোমার approved Affiliate Tracking URL (HTTPS)</label><input name="affiliate_url" type="url" placeholder="তোমার Daraz affiliate link" required></div>
          <div class="grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">
            <div class="field"><label>বর্তমান দাম (৳)</label><input name="current_price_bdt" type="number" min="0" step="1"></div>
            <div class="field"><label>আগের দাম (৳, ঐচ্ছিক)</label><input name="original_price_bdt" type="number" min="0" step="1"></div>
          </div>
          <div class="field"><label>স্ট্যাটাস</label><select name="status"><option value="draft">Draft / খসড়া</option><option value="active">Active / প্রকাশিত</option><option value="paused">Paused / বন্ধ</option></select></div>
          <label><input name="is_featured" type="checkbox"> Featured হিসেবে চিহ্নিত</label>
          <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:12px"><button class="primary" type="submit" id="affiliateSave">Save Affiliate Product</button><button class="light" type="button" id="affiliateCancel">Clear Form</button></div>
          <p id="affiliateFormMessage" class="muted" aria-live="polite"></p>
        </form>
        <h4 style="margin-top:22px">Affiliate Product List</h4>
        <p id="affiliateCount" class="muted">লোড হচ্ছে...</p>
        <div id="affiliateProductList" aria-live="polite"><p class="muted">Affiliate পণ্য লোড হচ্ছে...</p></div>
      </div>`;
    el.appendChild(panel);

    const form = panel.querySelector("#affiliateProductForm");
    const list = panel.querySelector("#affiliateProductList");
    const message = panel.querySelector("#affiliateFormMessage");
    const save = panel.querySelector("#affiliateSave");
    const count = panel.querySelector("#affiliateCount");
    const connectionStatus = panel.querySelector("#darazConnectionStatus");
    const connectButton = panel.querySelector("#darazConnectButton");
    const disconnectButton = panel.querySelector("#darazDisconnectButton");
    let darazConnected = false;
    const loadConnection = async () => {
      connectionStatus.textContent = "সংযোগের অবস্থা যাচাই হচ্ছে...";
      connectButton.disabled = true;
      disconnectButton.disabled = true;
      const { data, error } = await db.from("affiliate_integrations")
        .select("is_connected").eq("affiliate_platform", "daraz").maybeSingle();
      if (error) {
        connectionStatus.textContent = "অবস্থা লোড হয়নি। Database migration প্রয়োজন হতে পারে।";
        toast("Daraz connection status লোড হয়নি: " + error.message, true);
        return;
      }
      darazConnected = data?.is_connected === true;
      connectionStatus.textContent = darazConnected
        ? "Connected — Daraz Affiliate integration চালু"
        : "Disconnected — Daraz Affiliate integration বন্ধ";
      connectButton.disabled = darazConnected;
      disconnectButton.disabled = !darazConnected;
    };
    const setConnection = async (connected) => {
      if (profile?.role !== "admin" || adminOtpVerified !== true) {
        toast("Admin email OTP verification প্রয়োজন।", true);
        return;
      }
      const prompt = connected
        ? "Daraz Affiliate integration আবার Connect করবেন?"
        : "Daraz Affiliate integration এক ক্লিকে Disconnect করবেন? Affiliate listing বন্ধ থাকবে; সংরক্ষিত পণ্য মুছে যাবে না।";
      if (!window.confirm(prompt)) return;
      connectButton.disabled = true;
      disconnectButton.disabled = true;
      const { error } = await db.from("affiliate_integrations").upsert({
        affiliate_platform: "daraz",
        is_connected: connected,
        updated_at: new Date().toISOString()
      }, { onConflict: "affiliate_platform" });
      if (error) {
        toast("Daraz connection পরিবর্তন হয়নি: " + error.message, true);
        await loadConnection();
        return;
      }
      toast(connected ? "Daraz Affiliate connected হয়েছে" : "Daraz Affiliate disconnected হয়েছে");
      await loadConnection();
    };
    connectButton.addEventListener("click", () => setConnection(true));
    disconnectButton.addEventListener("click", () => setConnection(false));
    const value = (name) => String(form.elements[name]?.value || "").trim();
    const setMessage = (text, isError = false) => {
      message.textContent = text;
      message.className = isError ? "bad" : "muted";
    };

    const openPanel = () => {
      el.querySelectorAll(".admin-panel").forEach((item) => { item.hidden = item !== panel; });
      home.hidden = true;
      el.querySelectorAll("[data-admin-jump]").forEach((item) => item.classList.remove("active"));
      nav.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
      const menu = el.querySelector("#adminMenuToggle");
      if (menu) {
        const shell = menu.closest(".admin-shell");
        shell?.classList.remove("menu-open", "menu-collapsed");
        menu.setAttribute("aria-expanded", "true");
        menu.setAttribute("aria-label", "অ্যাডমিন মেনু বন্ধ করুন");
      }
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const resetForm = () => {
      form.reset();
      form.elements.id.value = "";
      panel.querySelector("#affiliateFormTitle").textContent = "নতুন Daraz Affiliate পণ্য";
      save.textContent = "Save Affiliate Product";
      setMessage("");
    };

    const makeAction = (label, handler) => {
      const action = document.createElement("button");
      action.type = "button";
      action.className = "light";
      action.textContent = label;
      action.addEventListener("click", handler);
      return action;
    };

    let cachedRows = [];
    const renderRows = (rows) => {
      list.replaceChildren();
      count.textContent = rows.length + " টি Affiliate পণ্য";
      if (!rows.length) {
        const empty = document.createElement("p");
        empty.className = "muted";
        empty.textContent = "এখনো কোনো Affiliate পণ্য যোগ করা হয়নি।";
        list.appendChild(empty);
        return;
      }
      rows.forEach((row) => {
        const card = document.createElement("article");
        card.className = "adminitem";
        card.style.margin = "10px 0";
        const title = document.createElement("b");
        title.textContent = row.product_name;
        const meta = document.createElement("p");
        meta.className = "muted";
        meta.textContent = row.category + " · " + row.status + (row.current_price_bdt != null ? " · ৳" + row.current_price_bdt : "");
        const link = document.createElement("a");
        link.href = row.affiliate_url;
        link.target = "_blank";
        link.rel = "noopener noreferrer sponsored";
        link.textContent = "Affiliate link পরীক্ষা করুন ↗";
        const actions = document.createElement("div");
        actions.className = "row";
        actions.style.gap = "8px";
        actions.style.marginTop = "8px";
        actions.append(makeAction("Edit", () => {
          form.elements.id.value = String(row.id);
          ["product_name", "category", "description", "image_url", "product_url", "affiliate_url", "current_price_bdt", "original_price_bdt", "status"].forEach((key) => {
            form.elements[key].value = row[key] == null ? "" : String(row[key]);
          });
          form.elements.is_featured.checked = row.is_featured === true;
          panel.querySelector("#affiliateFormTitle").textContent = "Affiliate পণ্য সম্পাদনা";
          save.textContent = "Update Affiliate Product";
          setMessage("পণ্য সম্পাদনা মোডে আছে।");
          form.scrollIntoView({ behavior: "smooth", block: "start" });
        }));
        if (row.status !== "paused") {
          actions.append(makeAction("Pause", async () => {
            if (!window.confirm("এই Affiliate পণ্যটি Pause করবেন?")) return;
            const { error } = await db.from("affiliate_products").update({ status: "paused", updated_at: new Date().toISOString() }).eq("id", row.id);
            if (error) { toast("পণ্য Pause হয়নি: " + error.message, true); return; }
            toast("Affiliate পণ্য Pause হয়েছে");
            await loadProducts();
          }));
        }
        card.append(title, meta, link, actions);
        list.appendChild(card);
      });
    };

    const loadProducts = async () => {
      list.textContent = "Affiliate পণ্য লোড হচ্ছে...";
      const { data, error } = await db.from("affiliate_products")
        .select("id,product_name,category,description,image_url,product_url,affiliate_url,current_price_bdt,original_price_bdt,status,is_featured,created_at,updated_at")
        .order("created_at", { ascending: false }).limit(200);
      if (error) {
        list.textContent = "Affiliate table এখনো প্রস্তুত নয় অথবা ডেটা লোড হয়নি: " + error.message;
        count.textContent = "লোড ব্যর্থ";
        return;
      }
      cachedRows = data || [];
      renderRows(cachedRows);
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (profile?.role !== "admin" || adminOtpVerified !== true) {
        setMessage("Admin email OTP verification প্রয়োজন।", true);
        return;
      }
      const imageUrl = safeHttpsUrl(value("image_url"));
      const productUrl = safeHttpsUrl(value("product_url"));
      const affiliateUrl = safeHttpsUrl(value("affiliate_url"));
      const currentRaw = value("current_price_bdt");
      const originalRaw = value("original_price_bdt");
      const currentPrice = currentRaw === "" ? null : Number(currentRaw);
      const originalPrice = originalRaw === "" ? null : Number(originalRaw);
      if (!imageUrl || !productUrl || !affiliateUrl) {
        setMessage("সব URL অবশ্যই বৈধ HTTPS URL হতে হবে।", true);
        return;
      }
      if (currentPrice !== null && (!Number.isSafeInteger(currentPrice) || currentPrice < 0)) {
        setMessage("বর্তমান দাম পূর্ণসংখ্যা হতে হবে।", true);
        return;
      }
      if (originalPrice !== null && (!Number.isSafeInteger(originalPrice) || originalPrice < 0)) {
        setMessage("আগের দাম পূর্ণসংখ্যা হতে হবে।", true);
        return;
      }
      if (currentPrice !== null && originalPrice !== null && originalPrice < currentPrice) {
        setMessage("আগের দাম বর্তমান দামের চেয়ে কম হতে পারবে না।", true);
        return;
      }
      const payload = {
        affiliate_platform: "daraz",
        product_name: value("product_name"),
        category: value("category"),
        description: value("description") || null,
        image_url: imageUrl,
        product_url: productUrl,
        affiliate_url: affiliateUrl,
        current_price_bdt: currentPrice,
        original_price_bdt: originalPrice,
        status: value("status"),
        is_featured: form.elements.is_featured.checked,
        updated_at: new Date().toISOString()
      };
      save.disabled = true;
      try {
        const id = value("id");
        const result = id
          ? await db.from("affiliate_products").update(payload).eq("id", Number(id))
          : await db.from("affiliate_products").insert(payload);
        if (result.error) throw result.error;
        toast(id ? "Affiliate পণ্য আপডেট হয়েছে" : "Affiliate পণ্য যোগ হয়েছে");
        resetForm();
        await loadProducts();
      } catch (error) {
        setMessage("সংরক্ষণ হয়নি: " + (error?.message || "আবার চেষ্টা করুন"), true);
      } finally {
        save.disabled = false;
      }
    });

    button.addEventListener("click", openPanel);
    nav.addEventListener("click", (event) => {
      if (event.target !== button && !button.contains(event.target)) panel.hidden = true;
    }, true);
    panel.querySelector("#affiliateRefresh").addEventListener("click", loadProducts);
    panel.querySelector("#affiliateCancel").addEventListener("click", resetForm);
    loadConnection();
    loadProducts();
  };
})();
