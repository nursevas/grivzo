/* =========================================================
   GRIVZO — логика онлайн-меню
   Каталог, корзина, оформление заказа в WhatsApp.
   Данные: js/menu-data.js, настройки: js/config.js
   ========================================================= */
(function () {
  "use strict";

  const CONFIG = window.GRIVZO_CONFIG || {};
  const CUR = CONFIG.currency || "₸";
  const STORE_KEY = "grivzo.cart.v1";
  const PREFS_KEY = "grivzo.prefs.v1";

  const BADGES = {
    hit: { cls: "badge--hit", key: "badgeHit" },
    new: { cls: "badge--new", key: "badgeNew" },
    spicy: { cls: "badge--spicy", key: "badgeSpicy" },
    gift: { cls: "badge--hit", key: "badgeGift" }
  };

  /* ---------- Язык (RU / KZ) ---------- */
  const I18N = window.GRIVZO_I18N || { ru: {}, kk: {} };
  const MKK = window.GRIVZO_MENU_KK || {};
  const LANG_KEY = "grivzo.lang.v1";
  let lang = "ru";
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "ru" || saved === "kk") lang = saved;
    else if (/^kk/i.test(navigator.language || "")) lang = "kk";
  } catch { /* приватный режим */ }

  const isKk = () => lang === "kk";
  const t = (key, ...args) => {
    const v = (I18N[lang] && I18N[lang][key]) ?? (I18N.ru && I18N.ru[key]) ?? key;
    return typeof v === "function" ? v(...args) : v;
  };
  // выполнить код на другом языке (например, текст заказа для оператора — всегда по-русски)
  const inLang = (l, fn) => { const prev = lang; lang = l; try { return fn(); } finally { lang = prev; } };
  // переведённые тексты меню; если перевода нет — русский
  const sTitle = (s) => (isKk() && MKK.sections && MKK.sections[s.id] && MKK.sections[s.id].title) || s.title;
  const sNote = (s) => (isKk() && MKK.sections && MKK.sections[s.id] && MKK.sections[s.id].note) || s.note;
  const pName = (p) => (isKk() && MKK.items && MKK.items[p.id] && MKK.items[p.id].name) || p.name;
  const pDesc = (p) => (isKk() && MKK.items && MKK.items[p.id] && MKK.items[p.id].desc) || p.desc;
  const vLabel = (v) => (isKk() && MKK.variants && MKK.variants[v.label]) || v.label;
  const vTitle = (p) => (isKk() && MKK.variantTitles && MKK.variantTitles[p.variantTitle]) || p.variantTitle || t("variant");
  const bName = (b) => (isKk() && b.nameKk) || b.name;
  const bAddr = (b) => (isKk() && b.addressKk) || b.address;
  const payName = (p) => (isKk() && I18N.kk.payNames && I18N.kk.payNames[p]) || p;

  /* ---------- Данные меню ---------- */
  const SECTIONS = (window.GRIVZO_MENU || [])
    .map((s) => ({ ...s, items: (s.items || []).filter((i) => !i.hidden) }))
    .filter((s) => s.items.length);

  const PRODUCTS = new Map();
  SECTIONS.forEach((s) => s.items.forEach((i) => PRODUCTS.set(i.id, i)));

  /* ---------- Варианты товара (кол-во штук, бортик…) ----------
     Ключ позиции в корзине: "id" или "id|variantId". */
  const hasVariants = (p) => Array.isArray(p.variants) && p.variants.length > 0;
  // короткие варианты — кнопками на карточке, длинные — в окне товара
  const pillsOnCard = (p) => hasVariants(p) && p.variants.length <= 4 &&
    p.variants.reduce((n, v) => n + v.label.length, 0) <= 20;
  const minPrice = (p) => hasVariants(p) ? Math.min(...p.variants.map((v) => v.price)) : p.price;
  const selectedVariant = {}; // productId → variantId, выбранный на карточке
  const getVariant = (p, vid) => hasVariants(p) ? (p.variants.find((v) => v.id === vid) || p.variants[0]) : null;
  const keyOf = (p, v) => v ? `${p.id}|${v.id}` : p.id;
  function resolveKey(key) {
    const [pid, vid] = String(key).split("|");
    const p = PRODUCTS.get(pid);
    if (!p) return null;
    if (hasVariants(p)) {
      const v = p.variants.find((x) => x.id === vid);
      if (!v) return null;
      return { p, v, price: v.price, name: `${pName(p)} (${vLabel(v).replace(/\s*\(.*\)$/, "")})` };
    }
    if (vid) return null;
    return { p, v: null, price: p.price, name: pName(p) };
  }
  const cardKey = (p) => keyOf(p, getVariant(p, selectedVariant[p.id]));

  /* ---------- Утилиты ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const money = (n) => `${Math.round(n).toLocaleString("ru-RU").replace(/ |,/g, " ")} ${CUR}`;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const plural = (n, one, few, many) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  };
  const load = (key, fallback) => {
    try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
  };
  const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* приватный режим */ } };

  const ICON_PLUS = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  const ICON_MINUS = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  const ICON_TRASH = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- Состояние ---------- */
  // cart: { [productId]: qty }. Цена всегда берётся из меню — изменения цен применяются сразу.
  let cart = load(STORE_KEY, {});
  Object.keys(cart).forEach((k) => { if (!resolveKey(k) || !(cart[k] > 0)) delete cart[k]; });

  const branches = (CONFIG.branches && CONFIG.branches.length) ? CONFIG.branches : [{ id: "main", name: CONFIG.brand || "GRIVZO", address: "" }];
  const deliveryEnabled = !CONFIG.delivery || CONFIG.delivery.enabled !== false;
  const payments = (CONFIG.payments && CONFIG.payments.length) ? CONFIG.payments : ["Наличные"];

  const prefs = Object.assign(
    { mode: "pickup", branch: branches[0].id, address: "", name: "", phone: "", payment: payments[0], comment: "" },
    load(PREFS_KEY, {})
  );
  if (!deliveryEnabled) prefs.mode = "pickup";
  if (!branches.some((b) => b.id === prefs.branch)) prefs.branch = branches[0].id;
  if (!payments.includes(prefs.payment)) prefs.payment = payments[0];
  const savePrefs = () => save(PREFS_KEY, prefs);

  const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const cartItemsTotal = () => Object.entries(cart).reduce((sum, [k, q]) => sum + (resolveKey(k)?.price || 0) * q, 0);
  // сколько штук товара (во всех вариантах) уже в корзине
  const productQty = (pid) => Object.entries(cart).reduce((n, [k, q]) => n + (k.split("|")[0] === pid ? q : 0), 0);

  function deliveryInfo(itemsTotal) {
    const d = CONFIG.delivery || {};
    if (prefs.mode !== "delivery") return { fee: 0, label: null, blocked: false };
    const minOrder = d.minOrder || 0;
    const blocked = minOrder > 0 && itemsTotal < minOrder;
    if (d.freeFrom > 0 && itemsTotal >= d.freeFrom) return { fee: 0, label: t("free"), blocked, minOrder };
    if (d.fee > 0) return { fee: d.fee, label: money(d.fee), blocked, minOrder };
    return { fee: 0, label: t("operatorCalc"), blocked, minOrder };
  }

  /* =========================================================
     Рендер каталога
     ========================================================= */
  function renderNav() {
    // Одна полоса категорий — под плитками (как в референсе)
    $("#catScroll").innerHTML = SECTIONS
      .map((s) => `<button type="button" class="chip" data-target="${esc(s.id)}">${esc(sTitle(s))}</button>`).join("");
  }

  function renderPromos() {
    const pick = (secId) => SECTIONS.find((s) => s.id === secId);
    const tiles = [
      { sec: "combo", cls: "promo--dark", kicker: t("promoComboK"), title: t("promoComboT") },
      { sec: "basket", cls: "promo--gold", kicker: t("promoBasketK"), title: t("promoBasketT") },
      { sec: "pizza", cls: "promo--light", kicker: t("promoPizzaK"), title: t("promoPizzaT") }
    ].filter((tile) => pick(tile.sec));
    const el = $("#promos");
    if (!tiles.length) { el.hidden = true; return; }
    el.innerHTML = tiles.map((tile) => {
      const s = pick(tile.sec);
      const img = s.items[0].img;
      return `<button type="button" class="promo ${tile.cls}" data-target="${esc(s.id)}">
        <div>
          <div class="promo__kicker">${esc(tile.kicker)}</div>
          <h2 class="promo__title">${tile.title}</h2>
        </div>
        <span class="promo__link">${t("view")} ${ICON_ARROW}</span>
        <img class="promo__img" src="${esc(img)}" alt="" loading="lazy">
      </button>`;
    }).join("");
  }

  // Кнопка «В корзину» или счётчик для позиции корзины (key = "id" или "id|variant")
  function cardAction(key, light) {
    const q = cart[key] || 0;
    if (!q) {
      return `<button type="button" class="add-btn" data-add="${esc(key)}" aria-label="${esc(t("addAria"))}">${ICON_PLUS}<span>${esc(t("add"))}</span></button>`;
    }
    return `<div class="stepper${light ? " stepper--light" : ""}">
      <button type="button" data-dec="${esc(key)}" aria-label="${esc(t("dec"))}">${ICON_MINUS}</button>
      <span class="stepper__val" aria-live="polite">${q}</span>
      <button type="button" data-inc="${esc(key)}" aria-label="${esc(t("inc"))}">${ICON_PLUS}</button>
    </div>`;
  }

  // Действие на карточке каталога
  function cardActionFor(p) {
    if (hasVariants(p) && !pillsOnCard(p)) {
      const n = productQty(p.id);
      return `<button type="button" class="add-btn" data-open="${esc(p.id)}">${ICON_PLUS}<span>${esc(t("choose"))}</span>${n ? `<span class="add-btn__count">${n}</span>` : ""}</button>`;
    }
    return cardAction(cardKey(p));
  }

  function cardPrice(p) {
    if (hasVariants(p) && !pillsOnCard(p)) return `<span class="card__from">${esc(t("from"))}</span> ${money(minPrice(p))}`;
    const v = getVariant(p, selectedVariant[p.id]);
    return money(v ? v.price : p.price);
  }

  function variantPills(p, selectedId, compact) {
    return `<div class="vpills${compact ? " vpills--card" : ""}" role="radiogroup" aria-label="${esc(vTitle(p))}">
      ${p.variants.map((v) => {
        const on = v.id === selectedId;
        // на узкой карточке «16 дана» не помещается — показываем просто число
        const text = compact && isKk() ? vLabel(v).replace(/\s*(дана|шт)$/, "") : vLabel(v);
        return `<button type="button" role="radio" aria-checked="${on}" aria-label="${esc(vLabel(v))}" class="vpill${on ? " is-active" : ""}" data-vpick="${esc(p.id)}" data-v="${esc(v.id)}">${esc(text)}</button>`;
      }).join("")}
    </div>`;
  }

  function renderCardVariantArea(p) {
    const card = $(`.card[data-id="${CSS.escape(p.id)}"]`);
    if (!card) return;
    $(".card__price-val", card).innerHTML = cardPrice(p);
    $("[data-action-for]", card).innerHTML = cardActionFor(p);
    const pills = $(".card__variants", card);
    if (pills) pills.innerHTML = variantPills(p, getVariant(p, selectedVariant[p.id]).id, true);
  }

  // текст для поиска: на обоих языках, чтобы искать можно было и по-русски, и по-казахски
  function searchText(p, s) {
    const kkItem = (MKK.items && MKK.items[p.id]) || {};
    const kkSec = (MKK.sections && MKK.sections[s.id]) || {};
    return [p.name, p.desc, s.title, kkItem.name, kkItem.desc, kkSec.title].filter(Boolean).join(" ").toLowerCase();
  }

  function renderCatalog() {
    $("#catalog").innerHTML = SECTIONS.map((s) => `
      <section class="section" id="sec-${esc(s.id)}" data-section="${esc(s.id)}" aria-labelledby="h-${esc(s.id)}">
        <div class="section__head">
          <h2 class="section__title" id="h-${esc(s.id)}">${esc(sTitle(s))}</h2>
        </div>
        ${sNote(s) ? `<p class="section__note">${esc(sNote(s))}</p>` : ""}
        <div class="grid">
          ${s.items.map((p) => {
            const b = BADGES[p.badge];
            return `<article class="card" data-id="${esc(p.id)}" data-search="${esc(searchText(p, s))}">
              <div class="card__media" data-open="${esc(p.id)}" role="button" tabindex="0" aria-label="${esc(t("details"))}: ${esc(pName(p))}">
                ${b ? `<span class="badge ${b.cls}">${esc(t(b.key))}</span>` : ""}
                <img src="${esc(p.img)}" alt="${esc(pName(p))}" loading="lazy" decoding="async" width="720" height="720">
              </div>
              <div class="card__body">
                <h3 class="card__title" data-open="${esc(p.id)}">${esc(pName(p))}</h3>
                ${pDesc(p) ? `<p class="card__desc">${esc(pDesc(p))}</p>` : ""}
                ${pillsOnCard(p) ? `<div class="card__variants">${variantPills(p, getVariant(p, selectedVariant[p.id]).id, true)}</div>` : ""}
                <div class="card__footer">
                  <div class="card__price"><span class="card__price-val">${cardPrice(p)}</span>${p.weight ? `<span class="card__weight">${esc(p.weight)}</span>` : ""}</div>
                  <div class="card__action" data-action-for="${esc(p.id)}">${cardActionFor(p)}</div>
                </div>
              </div>
            </article>`;
          }).join("")}
        </div>
      </section>`).join("");

    // плавное появление фото после загрузки
    $$(".card__media img, .promo__img").forEach((img) => {
      const done = () => img.classList.add("is-loaded");
      if (img.complete && img.naturalWidth) done(); else img.addEventListener("load", done, { once: true });
    });
  }

  function renderFooter() {
    const c = CONFIG.contacts || {};
    const addrs = branches.map((b) => bAddr(b)).filter(Boolean);
    const contacts = [];
    if (c.phone) contacts.push(`<a href="tel:${esc(c.phone.replace(/[^\d+]/g, ""))}">${esc(c.phone)}</a>`);
    const wa = String(CONFIG.whatsappPhone || "").replace(/\D/g, "");
    if (c.whatsapp && wa) contacts.push(`<a href="https://wa.me/${wa}" target="_blank" rel="noopener">${esc(t("footWa"))}</a>`);
    if (c.instagram) contacts.push(`<a href="https://instagram.com/${esc(c.instagram.replace(/^@/, ""))}" target="_blank" rel="noopener">@${esc(c.instagram.replace(/^@/, ""))}</a>`);
    if (c.hours) contacts.push(`<span>${esc(c.hours)}</span>`);

    const col = (title, items) => items.length
      ? `<div class="footer__col"><h3 class="footer__title">${title}</h3><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul></div>` : "";
    $("#footerCols").innerHTML =
      col(t("footAddresses"), addrs.map((a) => esc(a))) + col(t("footContacts"), contacts);
    const now = new Date().getFullYear();
    const years = CONFIG.founded && CONFIG.founded < now ? `${CONFIG.founded}–${now}` : `${now}`;
    $("#footerCopy").textContent = `© ${years} ${CONFIG.brand || "GRIVZO"}`;
  }

  /* ---------- Появление карточек ---------- */
  function setupReveal() {
    const cards = $$(".card");
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cards.forEach((c) => c.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting);
      visible.forEach((e, i) => {
        e.target.style.transitionDelay = `${Math.min(i, 6) * 60}ms`;
        e.target.classList.add("is-visible");
        setTimeout(() => { e.target.style.transitionDelay = ""; }, 900);
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -40px 0px", threshold: 0.08 });
    cards.forEach((c) => io.observe(c));
  }

  /* =========================================================
     Навигация: прокрутка, подсветка активной категории
     ========================================================= */
  const catbar = $("#catbar");
  const catScroll = $("#catScroll");

  function scrollToSection(id) {
    const sec = document.getElementById(`sec-${id}`);
    if (!sec) return;
    const offset = catbar.offsetHeight + 4;
    const y = sec.getBoundingClientRect().top + window.scrollY - offset + 12;
    window.scrollTo({ top: Math.max(0, y), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    setActive(id, true);
    lockSpyUntil = Date.now() + 900;
  }

  let activeId = null;
  let lockSpyUntil = 0;
  function setActive(id, force) {
    if (!force && id === activeId) return;
    activeId = id;
    $$(".chip", catScroll).forEach((c) => c.classList.toggle("is-active", c.dataset.target === id));
    $$("#topNav a").forEach((a) => a.classList.toggle("is-active", a.dataset.target === id));
    const chip = $(`.chip[data-target="${id}"]`, catScroll);
    if (chip) {
      const left = chip.offsetLeft - catScroll.clientWidth / 2 + chip.offsetWidth / 2;
      catScroll.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
    }
  }

  function onScroll() {
    catbar.classList.toggle("is-stuck", catbar.getBoundingClientRect().top <= 0.5);
    if (Date.now() < lockSpyUntil) return;
    const line = catbar.offsetHeight + 40;
    let current = null;
    $$(".section").forEach((s) => {
      if (s.offsetParent !== null && s.getBoundingClientRect().top <= line) current = s.dataset.section;
    });
    if (!current) {
      $$(".chip, #topNav a").forEach((c) => c.classList.remove("is-active"));
      activeId = null;
      return;
    }
    setActive(current);
  }

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });

  /* =========================================================
     Поиск
     ========================================================= */
  const searchBar = $("#searchBar");
  const searchInput = $("#searchInput");
  const searchToggle = $("#searchToggle");

  function applySearch(q) {
    const query = q.trim().toLowerCase();
    let anyVisible = false;
    $$(".section").forEach((sec) => {
      let n = 0;
      $$(".card", sec).forEach((card) => {
        const ok = !query || card.dataset.search.includes(query);
        card.hidden = !ok;
        if (ok) { n++; card.classList.add("is-visible"); }
      });
      sec.hidden = n === 0;
      if (n) anyVisible = true;
    });
    $$(".chip", catScroll).forEach((c) => {
      const sec = document.getElementById(`sec-${c.dataset.target}`);
      c.hidden = sec ? sec.hidden : false;
    });
    $("#emptySearch").hidden = anyVisible;
    $("#promos").hidden = !!query;
    onScroll();
  }
  function openSearch() {
    searchBar.hidden = false;
    searchToggle.setAttribute("aria-expanded", "true");
    searchInput.focus();
  }
  function closeSearch() {
    searchBar.hidden = true;
    searchToggle.setAttribute("aria-expanded", "false");
    searchInput.value = "";
    applySearch("");
  }
  searchToggle.addEventListener("click", () => (searchBar.hidden ? openSearch() : closeSearch()));
  $("#searchClose").addEventListener("click", closeSearch);
  $("#emptySearchReset").addEventListener("click", () => { searchInput.value = ""; applySearch(""); searchInput.focus(); });
  searchInput.addEventListener("input", () => {
    applySearch(searchInput.value);
    if (searchInput.value.trim()) {
      const first = $(".section:not([hidden])");
      if (first && first.getBoundingClientRect().top < 0) scrollToSection(first.dataset.section);
    }
  });
  searchInput.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSearch(); });

  /* =========================================================
     Корзина
     ========================================================= */
  function setQty(key, qty) {
    if (!resolveKey(key)) return;
    if (qty > 0) cart[key] = Math.min(qty, 99); else delete cart[key];
    save(STORE_KEY, cart);
    updateCartUI(key.split("|")[0]);
  }
  function addToCart(key) {
    const r = resolveKey(key);
    if (!r) return;
    setQty(key, (cart[key] || 0) + 1);
    showToast(`<b>+1</b> ${esc(r.name)}`);
    $$(".cart-btn, .floating-cart").forEach((b) => {
      b.classList.remove("is-bump"); void b.offsetWidth; b.classList.add("is-bump");
    });
  }

  function updateCartUI(changedId) {
    const count = cartCount();
    const total = cartItemsTotal();

    $$("[data-cart-count]").forEach((el) => {
      el.textContent = count > 99 ? "99+" : count;
      if (!el.closest(".floating-cart")) el.hidden = count === 0;
    });
    $$("[data-cart-sum]").forEach((el) => { el.textContent = money(total); });
    $("#floatingCart").hidden = count === 0;
    document.body.classList.toggle("has-cart", count > 0);

    const ids = changedId ? [changedId] : Array.from(PRODUCTS.keys());
    ids.forEach((id) => {
      const p = PRODUCTS.get(id);
      if (!p) return;
      $$(`[data-action-for="${CSS.escape(id)}"]`).forEach((el) => { el.innerHTML = cardActionFor(p); });
    });
    if (modalProductId && (!changedId || changedId === modalProductId)) renderModalAction();
    renderCartList();
  }

  function renderCartList() {
    const entries = Object.entries(cart);
    const list = $("#cartList");
    const itemsTotal = cartItemsTotal();
    const d = deliveryInfo(itemsTotal);

    $("#cartEmpty").hidden = entries.length > 0;
    $("#cartFoot").hidden = entries.length === 0;

    list.innerHTML = entries.map(([id, q]) => {
      const { p, v, price } = resolveKey(id);
      return `<li class="cart-item">
        <img class="cart-item__img" src="${esc(p.img)}" alt="" loading="lazy">
        <div>
          <p class="cart-item__name">${esc(pName(p))}</p>
          <p class="cart-item__unit">${v ? esc(vLabel(v).replace(/\s*\(.*\)$/, "")) + " · " : ""}${money(price)}${p.weight ? " · " + esc(p.weight) : ""}</p>
          <div class="stepper stepper--light">
            <button type="button" data-dec="${esc(id)}" aria-label="${esc(t("dec"))}">${ICON_MINUS}</button>
            <span class="stepper__val">${q}</span>
            <button type="button" data-inc="${esc(id)}" aria-label="${esc(t("inc"))}">${ICON_PLUS}</button>
          </div>
        </div>
        <div class="cart-item__side">
          <button type="button" class="cart-item__remove" data-remove="${esc(id)}" aria-label="${esc(t("remove"))} ${esc(pName(p))}">${ICON_TRASH}</button>
          <span class="cart-item__total">${money(price * q)}</span>
        </div>
      </li>`;
    }).join("");

    const count = cartCount();
    $("#sumCount").textContent = `${count} ${t("pcs")}`;
    $("#sumItems").textContent = money(itemsTotal);
    $("#sumDeliveryRow").hidden = !d.label;
    $("#sumDelivery").textContent = d.label || "";
    $("#sumTotal").textContent = money(itemsTotal + d.fee);

    $("#coItems").textContent = money(itemsTotal);
    $("#coDeliveryRow").hidden = !d.label;
    $("#coDelivery").textContent = d.label || "";
    $("#coTotal").textContent = money(itemsTotal + d.fee);

    const note = $("#minOrderNote");
    note.hidden = !d.blocked;
    if (d.blocked) note.textContent = t("minOrder", money(d.minOrder));
    $("#toCheckout").disabled = !!d.blocked;
  }

  // Делегирование кликов: добавить / + / − / удалить / открыть товар
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-vpick],[data-add],[data-inc],[data-dec],[data-remove],[data-open],[data-target]");
    if (!t) return;
    if (t.dataset.vpick) {
      const p = PRODUCTS.get(t.dataset.vpick);
      if (!p) return;
      if (t.closest(".modal")) { modalVariant = t.dataset.v; renderModalVariant(); }
      else { selectedVariant[p.id] = t.dataset.v; renderCardVariantArea(p); }
      return;
    }
    if (t.dataset.add) return addToCart(t.dataset.add);
    if (t.dataset.inc) return setQty(t.dataset.inc, (cart[t.dataset.inc] || 0) + 1);
    if (t.dataset.dec) return setQty(t.dataset.dec, (cart[t.dataset.dec] || 0) - 1);
    if (t.dataset.remove) return setQty(t.dataset.remove, 0);
    if (t.dataset.open) return openProduct(t.dataset.open);
    if (t.dataset.target) { e.preventDefault(); return scrollToSection(t.dataset.target); }
  });
  document.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-open][role=button]")) {
      e.preventDefault(); openProduct(e.target.dataset.open);
    }
  });

  $("#clearCart").addEventListener("click", () => {
    if (!cartCount()) return;
    if (!confirm(t("clearConfirm"))) return;
    cart = {};
    save(STORE_KEY, cart);
    updateCartUI();
  });

  /* =========================================================
     Окна: товар, корзина, выбор адреса
     ========================================================= */
  let lastFocus = null;
  const openLayers = [];

  function openLayer(el) {
    lastFocus = document.activeElement;
    el.hidden = false;
    openLayers.push(el);
    document.body.classList.add("no-scroll");
    const f = el.querySelector("[data-autofocus]") || el.querySelector(".modal__close, .drawer__close");
    if (f) setTimeout(() => f.focus({ preventScroll: true }), 30);
  }
  function closeLayer(el) {
    el.hidden = true;
    const i = openLayers.indexOf(el);
    if (i >= 0) openLayers.splice(i, 1);
    if (!openLayers.length) document.body.classList.remove("no-scroll");
    if (el === productModal) modalProductId = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-close]");
    if (!c) return;
    const layer = c.closest(".modal, .drawer");
    if (layer) closeLayer(layer);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && openLayers.length) closeLayer(openLayers[openLayers.length - 1]);
  });

  // --- Товар ---
  const productModal = $("#productModal");
  let modalProductId = null;
  let modalVariant = null;
  function modalKey() {
    const p = PRODUCTS.get(modalProductId);
    return keyOf(p, getVariant(p, modalVariant));
  }
  function renderModalAction() {
    if (!modalProductId) return;
    $("#pmAction").innerHTML = cardAction(modalKey());
  }
  function renderModalVariant() {
    const p = PRODUCTS.get(modalProductId);
    const box = $("#pmVariants");
    if (!hasVariants(p)) { box.hidden = true; box.innerHTML = ""; $("#pmPrice").textContent = money(p.price); renderModalAction(); return; }
    const v = getVariant(p, modalVariant);
    box.hidden = false;
    box.innerHTML = `<span class="pm__vtitle">${esc(vTitle(p))}</span>${variantPills(p, v.id, false)}`;
    $("#pmPrice").textContent = money(v.price);
    renderModalAction();
  }
  function openProduct(id) {
    const p = PRODUCTS.get(id);
    if (!p) return;
    modalProductId = id;
    modalVariant = hasVariants(p) ? getVariant(p, selectedVariant[id]).id : null;
    renderProductModal();
    openLayer(productModal);
  }
  function renderProductModal() {
    const p = PRODUCTS.get(modalProductId);
    if (!p) return;
    const img = $("#pmImg");
    img.src = p.img; img.alt = pName(p);
    const b = BADGES[p.badge];
    $("#pmBadges").innerHTML = b ? `<span class="badge ${b.cls}">${esc(t(b.key))}</span>` : "";
    $("#pmTitle").textContent = pName(p);
    $("#pmMeta").textContent = p.weight || "";
    $("#pmDesc").textContent = pDesc(p) || "";
    renderModalVariant();
  }

  // --- Корзина ---
  const drawer = $("#cartDrawer");
  let currentView = "cart";
  function showView(name) {
    currentView = name;
    $$(".drawer__view", drawer).forEach((v) => { v.hidden = v.dataset.view !== name; });
    $("#drawerTitle").textContent = name === "checkout" ? t("drawerCheckout") : name === "done" ? t("drawerDone") : t("cart");
    $("#drawerBack").hidden = name !== "checkout";
  }
  function openCart() {
    showView("cart");
    renderCartList();
    openLayer(drawer);
  }
  ["#cartOpenTop", "#cartOpenSticky", "#floatingCart"].forEach((s) => $(s).addEventListener("click", openCart));
  $("#toCheckout").addEventListener("click", () => {
    if (!cartCount()) return;
    fillCheckout();
    showView("checkout");
    $(".drawer__view[data-view=checkout] .drawer__scroll").scrollTop = 0;
  });
  $("#drawerBack").addEventListener("click", () => showView("cart"));

  // --- Способ получения ---
  function setMode(mode) {
    if (mode === "delivery" && !deliveryEnabled) mode = "pickup";
    prefs.mode = mode;
    savePrefs();
    $$(".segmented__btn").forEach((b) => {
      const on = b.dataset.mode === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    $$("[data-show]").forEach((el) => { el.hidden = el.dataset.show !== mode; });
    if (mode === "delivery" && whereMenu && !whereMenu.hidden) toggleWhereMenu(false);
    updateWhere();
    renderCartList();
  }
  function updateWhere() {
    const txt = $("#whereText");
    if (prefs.mode === "delivery") {
      txt.textContent = prefs.address ? `${t("whereDeliveryPrefix")}: ${prefs.address}` : t("whereDeliveryAsk");
    } else {
      const b = branches.find((x) => x.id === prefs.branch) || branches[0];
      txt.textContent = bAddr(b) ? `${t("wherePickupPrefix")}: ${bAddr(b)}` : t("whereAsk");
    }
  }
  $$(".segmented__btn").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
  if (!deliveryEnabled) $$('.segmented__btn[data-mode="delivery"]').forEach((b) => { b.hidden = true; });

  // Окно выбора филиала / адреса (создаётся из JS)
  const whereModal = document.createElement("div");
  whereModal.className = "modal";
  whereModal.hidden = true;
  whereModal.innerHTML = `
    <div class="modal__backdrop" data-close></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="wmTitle" style="max-width:520px">
      <button class="modal__close" type="button" data-close aria-label="${esc(t("close"))}" data-i18n-aria="close">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      </button>
      <form class="pm__body" id="wmForm" novalidate>
        <h3 class="pm__title" id="wmTitle"></h3>
        <div id="wmFields"></div>
        <button type="submit" class="btn btn--dark btn--block" style="margin-top:22px" data-i18n="save">${esc(t("save"))}</button>
      </form>
    </div>`;
  document.body.appendChild(whereModal);

  // Выпадающий список адресов под кнопкой «Откуда заберёте заказ?»
  const whereBtn = $("#whereBtn");
  const whereMenu = $("#whereMenu");
  const PIN = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" fill="currentColor"/><circle cx="12" cy="10" r="2.6" fill="#fff"/></svg>';
  const CHECK = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function renderWhereMenu() {
    whereMenu.innerHTML = `<p class="where-menu__title">${esc(t("whereAsk"))}</p>` + branches.map((b) => {
      const on = b.id === prefs.branch;
      return `<button type="button" role="option" aria-selected="${on}" class="where-opt${on ? " is-active" : ""}" data-branch="${esc(b.id)}">
        <span class="where-opt__pin">${PIN}</span>
        <span class="where-opt__text">${esc(bAddr(b) || bName(b))}</span>
        <span class="where-opt__check">${on ? CHECK : ""}</span>
      </button>`;
    }).join("");
  }
  function toggleWhereMenu(open) {
    whereMenu.hidden = !open;
    whereBtn.setAttribute("aria-expanded", open ? "true" : "false");
    whereBtn.classList.toggle("is-open", open);
    if (open) { renderWhereMenu(); const a = $(".where-opt.is-active", whereMenu) || $(".where-opt", whereMenu); if (a) a.focus({ preventScroll: true }); }
  }
  whereMenu.addEventListener("click", (e) => {
    const o = e.target.closest("[data-branch]");
    if (!o) return;
    prefs.branch = o.dataset.branch;
    savePrefs();
    updateWhere();
    fBranch.value = prefs.branch;
    toggleWhereMenu(false);
    whereBtn.focus({ preventScroll: true });
  });
  document.addEventListener("click", (e) => {
    if (!whereMenu.hidden && !e.target.closest(".where-wrap")) toggleWhereMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !whereMenu.hidden) { toggleWhereMenu(false); whereBtn.focus(); }
  });

  whereBtn.addEventListener("click", () => {
    if (prefs.mode !== "delivery") { toggleWhereMenu(whereMenu.hidden); return; }
    const fields = $("#wmFields");
    if (prefs.mode === "delivery") {
      $("#wmTitle").textContent = t("wmDelivery");
      fields.innerHTML = `<label class="field"><span class="field__label">${esc(t("wmStreet"))}</span>
        <input id="wmAddress" type="text" data-autofocus value="${esc(prefs.address)}" placeholder="${esc(t("wmStreetPh"))}" autocomplete="street-address"></label>`;
    } else {
      $("#wmTitle").textContent = t("whereAsk");
      fields.innerHTML = branches.map((b) => `
        <label class="field" style="grid-template-columns:auto 1fr;align-items:center;gap:12px;cursor:pointer">
          <input type="radio" name="wmBranch" value="${esc(b.id)}" ${b.id === prefs.branch ? "checked" : ""} style="width:20px;min-height:20px;accent-color:#0e0e0e">
          <span><b>${esc(bName(b))}</b>${bAddr(b) ? `<br><span style="color:var(--muted)">${esc(bAddr(b))}</span>` : ""}</span>
        </label>`).join("");
    }
    openLayer(whereModal);
  });
  $("#wmForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (prefs.mode === "delivery") {
      prefs.address = $("#wmAddress").value.trim();
    } else {
      const r = $('input[name="wmBranch"]:checked', whereModal);
      if (r) prefs.branch = r.value;
    }
    savePrefs();
    updateWhere();
    closeLayer(whereModal);
  });

  /* =========================================================
     Оформление заказа → WhatsApp
     ========================================================= */
  const fName = $("#fName"), fPhone = $("#fPhone"), fAddress = $("#fAddress"), fComment = $("#fComment"), fBranch = $("#fBranch");

  function renderCheckoutOptions() {
    fBranch.innerHTML = branches.map((b) => `<option value="${esc(b.id)}">${esc(bName(b))}${bAddr(b) ? " — " + esc(bAddr(b)) : ""}</option>`).join("");
    fBranch.value = prefs.branch;
    $("#fPayment").innerHTML = payments.map((p) => `<button type="button" data-pay="${esc(p)}">${esc(payName(p))}</button>`).join("");
    $$("#fPayment button").forEach((x) => x.classList.toggle("is-active", x.dataset.pay === prefs.payment));
  }
  renderCheckoutOptions();
  $("#fPayment").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pay]");
    if (!b) return;
    prefs.payment = b.dataset.pay; savePrefs();
    $$("#fPayment button").forEach((x) => x.classList.toggle("is-active", x === b));
  });

  function fillCheckout() {
    fName.value = prefs.name;
    fPhone.value = prefs.phone;
    fAddress.value = prefs.address;
    fComment.value = prefs.comment;
    fBranch.value = prefs.branch;
    $$("#fPayment button").forEach((x) => x.classList.toggle("is-active", x.dataset.pay === prefs.payment));
    $$(".field.has-error").forEach((f) => f.classList.remove("has-error"));
    $$("[data-error-for]").forEach((f) => { f.textContent = ""; });
    setMode(prefs.mode);
  }

  // Маска телефона: +7 (777) 123-45-67
  function formatPhone(v) {
    let d = v.replace(/\D/g, "");
    if (!d) return "";
    if (d[0] === "8") d = "7" + d.slice(1);
    if (d[0] !== "7") d = "7" + d;
    d = d.slice(0, 11);
    let out = "+7";
    if (d.length > 1) out += " (" + d.slice(1, 4);
    if (d.length >= 4) out += ")";
    if (d.length > 4) out += " " + d.slice(4, 7);
    if (d.length > 7) out += "-" + d.slice(7, 9);
    if (d.length > 9) out += "-" + d.slice(9, 11);
    return out;
  }
  fPhone.addEventListener("input", () => { fPhone.value = formatPhone(fPhone.value); });

  [fName, fPhone, fAddress, fComment].forEach((el) => el.addEventListener("input", () => {
    prefs.name = fName.value; prefs.phone = fPhone.value; prefs.address = fAddress.value; prefs.comment = fComment.value;
    savePrefs(); updateWhere();
    const f = el.closest(".field");
    if (f) { f.classList.remove("has-error"); const er = $(`[data-error-for="${el.id}"]`); if (er) er.textContent = ""; }
  }));
  fBranch.addEventListener("change", () => { prefs.branch = fBranch.value; savePrefs(); updateWhere(); });

  function setError(input, msg) {
    input.closest(".field").classList.add("has-error");
    $(`[data-error-for="${input.id}"]`).textContent = msg;
  }

  // Сообщение для оператора всегда по-русски, какой бы язык ни выбрал клиент
  function buildMessage() {
    return inLang("ru", () => {
      const lines = [];
      lines.push(`*${t("msgNew")} — ${CONFIG.brand || "GRIVZO"}*`, "");
      Object.entries(cart).forEach(([key, q]) => {
        const r = resolveKey(key);
        lines.push(`• ${r.name} × ${q} = ${money(r.price * q)}`);
      });
      const itemsTotal = cartItemsTotal();
      const d = deliveryInfo(itemsTotal);
      lines.push("");
      lines.push(`${t("msgGoods")}: ${money(itemsTotal)}`);
      if (d.label) lines.push(`${t("msgDelivery")}: ${d.label}`);
      lines.push(`*${t("msgTotal")}: ${money(itemsTotal + d.fee)}*`, "");
      if (prefs.mode === "delivery") {
        lines.push(`${t("msgMethod")}: ${t("delivery")}`, `${t("msgAddress")}: ${prefs.address.trim()}`);
      } else {
        const b = branches.find((x) => x.id === prefs.branch) || branches[0];
        lines.push(`${t("msgMethod")}: ${t("pickup")}`, `${t("msgBranch")}: ${b.name}${b.address ? ", " + b.address : ""}`);
      }
      lines.push(`${t("msgName")}: ${prefs.name.trim()}`, `${t("msgPhone")}: ${prefs.phone.trim()}`, `${t("msgPay")}: ${prefs.payment}`);
      if (prefs.comment.trim()) lines.push(`${t("msgComment")}: ${prefs.comment.trim()}`);
      return lines.join("\n");
    });
  }

  function whatsappUrl(text) {
    const phone = String(CONFIG.whatsappPhone || "").replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  $("#checkoutForm").addEventListener("submit", (e) => {
    e.preventDefault();
    let firstBad = null;
    if (prefs.mode === "delivery" && fAddress.value.trim().length < 5) { setError(fAddress, t("errAddr")); firstBad = firstBad || fAddress; }
    if (fName.value.trim().length < 2) { setError(fName, t("errName")); firstBad = firstBad || fName; }
    if (fPhone.value.replace(/\D/g, "").length !== 11) { setError(fPhone, t("errPhone")); firstBad = firstBad || fPhone; }
    if (firstBad) { firstBad.focus(); firstBad.scrollIntoView({ block: "center", behavior: "smooth" }); return; }
    if (!cartCount()) return showView("cart");
    if (deliveryInfo(cartItemsTotal()).blocked) return showView("cart");

    const url = whatsappUrl(buildMessage());
    $("#waAgain").href = url;
    // Без флага "noopener": с ним window.open всегда возвращает null,
    // и сайт по ошибке уходил бы на WhatsApp вслед за новой вкладкой.
    const win = window.open(url, "_blank");
    if (win) { try { win.opener = null; } catch { /* ок */ } }
    else location.href = url; // всплывающие окна заблокированы — открываем здесь
    showView("done");
  });

  $("#newOrder").addEventListener("click", () => {
    cart = {};
    save(STORE_KEY, cart);
    prefs.comment = ""; savePrefs();
    updateCartUI();
    closeLayer(drawer);
    showView("cart");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------- Уведомление ---------- */
  let toastTimer;
  function showToast(html) {
    const t = $("#toast");
    t.innerHTML = html;
    t.classList.add("is-shown");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-shown"), 1800);
  }

  /* ---------- Синхронизация между вкладками ---------- */
  window.addEventListener("storage", (e) => {
    if (e.key === STORE_KEY) {
      cart = load(STORE_KEY, {});
      Object.keys(cart).forEach((k) => { if (!resolveKey(k)) delete cart[k]; });
      updateCartUI();
    }
  });

  /* =========================================================
     Переключение языка RU / KZ
     ========================================================= */
  function applyStatic() {
    document.documentElement.lang = isKk() ? "kk" : "ru";
    document.title = t("title");
    const meta = $('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("metaDesc"));
    $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$("[data-i18n-ph]").forEach((el) => el.setAttribute("placeholder", t(el.dataset.i18nPh)));
    $$("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    $$(".lang__btn").forEach((b) => {
      const on = b.dataset.lang === lang;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  // перерисовать всё, что собирается из JS
  function renderAll() {
    applyStatic();
    renderNav();
    renderPromos();
    renderCatalog();
    $$(".card").forEach((c) => c.classList.add("is-visible"));
    renderFooter();
    renderCheckoutOptions();
    updateWhere();
    if (!whereMenu.hidden) renderWhereMenu();
    showView(currentView);
    updateCartUI();
    if (modalProductId) renderProductModal();
    if (searchInput.value.trim()) applySearch(searchInput.value);
    if (activeId) setActive(activeId, true);
    onScroll();
  }

  function setLang(l) {
    if (l !== "ru" && l !== "kk") return;
    if (l === lang) return;
    lang = l;
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* приватный режим */ }
    renderAll();
  }
  $$(".lang__btn").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));

  /* ---------- Старт ---------- */
  applyStatic();
  renderNav();
  renderPromos();
  renderCatalog();
  renderFooter();
  setMode(prefs.mode);
  updateCartUI();
  setupReveal();
  onScroll();
})();
