/**
 * Da'Vinci Burger — SPA cart, menu, WhatsApp checkout
 */
(function () {
  "use strict";

  /** @type {string} Número WhatsApp destino (código país + número, sin +) */
  const WHATSAPP_NUMBER = "584121391113";

  const CATEGORY_LABELS = {
    all: "Todo",
    hamburguesas: "Hamburguesas",
    perros: "Perros Calientes",
    salchipapas: "Salchipapas",
  };

  /** @type {Array<object>} */
  let products = [];
  /** @type {string[]} */
  let featuredIds = [];
  /** @type {Map<string, number>} */
  const cart = new Map();
  let activeCategory = "all";

  const els = {
    menuGrid: document.getElementById("menu-grid"),
    heroSlides: document.getElementById("hero-slides"),
    tabs: document.querySelectorAll(".tab-btn"),
    cartBar: document.getElementById("cart-bar"),
    cartCount: document.getElementById("cart-count"),
    cartBarTotal: document.getElementById("cart-bar-total"),
    cartDrawer: document.getElementById("cart-drawer"),
    drawerOverlay: document.getElementById("drawer-overlay"),
    drawerClose: document.getElementById("drawer-close"),
    cartItems: document.getElementById("cart-items"),
    cartEmpty: document.getElementById("cart-empty"),
    cartDrawerTotal: document.getElementById("cart-drawer-total"),
    orderForm: document.getElementById("order-form"),
    customerName: document.getElementById("customer-name"),
    customerAddress: document.getElementById("customer-address"),
    addressField: document.getElementById("address-field"),
    deliveryMethod: document.getElementById("delivery-method"),
    paymentMethod: document.getElementById("payment-method"),
    submitOrder: document.getElementById("submit-order"),
    navToggle: document.getElementById("nav-toggle"),
    navDrawer: document.getElementById("nav-drawer"),
    toast: document.getElementById("toast"),
    lightbox: document.getElementById("photo-lightbox"),
    lightboxOverlay: document.getElementById("photo-lightbox-overlay"),
    lightboxImg: document.getElementById("photo-lightbox-img"),
    lightboxCaption: document.getElementById("photo-lightbox-caption"),
    lightboxClose: document.getElementById("photo-lightbox-close"),
  };

  function money(value) {
    return "$" + Number(value).toFixed(2);
  }

  function badgeClass(badge) {
    if (!badge) return "";
    const key = String(badge).toUpperCase();
    if (key === "BEST SELLER") return "product-badge--best";
    if (key === "NEW") return "product-badge--new";
    if (key === "LEGENDARY") return "product-badge--legendary";
    return "product-badge--best";
  }

  function getProduct(id) {
    return products.find((p) => p.id === id);
  }

  function cartEntries() {
    return Array.from(cart.entries())
      .map(([id, qty]) => {
        const product = getProduct(id);
        if (!product) return null;
        return { product, qty, lineTotal: product.price * qty };
      })
      .filter(Boolean);
  }

  function cartTotals() {
    const entries = cartEntries();
    const itemCount = entries.reduce((sum, e) => sum + e.qty, 0);
    const total = entries.reduce((sum, e) => sum + e.lineTotal, 0);
    return { entries, itemCount, total };
  }

  function showToast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      els.toast.classList.remove("is-visible");
    }, 1800);
  }

  /* ——— Menu render ——— */
  function filteredProducts() {
    if (activeCategory === "all") return products;
    return products.filter((p) => p.category === activeCategory);
  }

  function productPhoto(p) {
    return p.photo || p.image;
  }

  function renderMenu() {
    if (!els.menuGrid) return;
    const list = filteredProducts();

    if (!list.length) {
      els.menuGrid.innerHTML =
        '<div class="menu-status">No hay platos en esta categoría… aún.</div>';
      return;
    }

    els.menuGrid.innerHTML = list
      .map(function (p, index) {
        const delay = "floating-delay-" + ((index % 3) + 1);
        const photoSrc = productPhoto(p);
        const badgeHtml = p.badge
          ? '<span class="product-badge ' +
            badgeClass(p.badge) +
            '">' +
            escapeHtml(p.badge) +
            "</span>"
          : "";

        return (
          '<article class="product-card" data-id="' +
          escapeAttr(p.id) +
          '" data-category="' +
          escapeAttr(p.category) +
          '">' +
          badgeHtml +
          '<div class="product-card__media">' +
          '<img class="floating ' +
          delay +
          '" src="' +
          escapeAttr(p.image) +
          '" alt="' +
          escapeAttr(p.name) +
          '" loading="lazy" width="160" height="160" />' +
          "</div>" +
          '<h3 class="product-card__name font-display">' +
          escapeHtml(p.name) +
          "</h3>" +
          '<p class="product-card__ingredients">' +
          escapeHtml(p.ingredients) +
          "</p>" +
          '<div class="product-card__footer">' +
          '<div class="product-card__meta">' +
          '<span class="product-card__price">' +
          money(p.price) +
          "</span>" +
          '<span class="product-card__cal">' +
          escapeHtml(p.calories) +
          "</span>" +
          "</div>" +
          '<div class="product-card__actions">' +
          '<button type="button" class="preview-toggle" data-preview-toggle aria-expanded="false" aria-controls="preview-' +
          escapeAttr(p.id) +
          '">' +
          '<i class="fa-solid fa-chevron-down preview-toggle__icon" aria-hidden="true"></i>' +
          '<span class="preview-toggle__label">(toque para visualizar el producto)</span>' +
          "</button>" +
          '<button type="button" class="add-btn" data-add="' +
          escapeAttr(p.id) +
          '" aria-label="Agregar ' +
          escapeAttr(p.name) +
          ' al carrito">' +
          '<i class="fa-solid fa-plus" aria-hidden="true"></i>' +
          "</button>" +
          "</div>" +
          "</div>" +
          '<div class="product-preview" id="preview-' +
          escapeAttr(p.id) +
          '">' +
          '<button type="button" class="product-preview__shot" data-lightbox="' +
          escapeAttr(photoSrc) +
          '" data-lightbox-alt="' +
          escapeAttr(p.name) +
          '" aria-label="Ampliar foto de ' +
          escapeAttr(p.name) +
          '">' +
          '<img src="' +
          escapeAttr(photoSrc) +
          '" alt="Foto real de ' +
          escapeAttr(p.name) +
          '" loading="lazy" data-fallback="' +
          escapeAttr(p.image) +
          '" />' +
          '<span class="product-preview__hint"><i class="fa-solid fa-expand" aria-hidden="true"></i> Toca para ampliar</span>' +
          "</button>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function setActiveTab(category) {
    activeCategory = category;
    els.tabs.forEach(function (btn) {
      const isActive = btn.dataset.category === category;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    renderMenu();
  }

  /* ——— Hero slides ——— */
  function renderHero() {
    if (!els.heroSlides) return;

    const featured = featuredIds
      .map(function (id) {
        return getProduct(id);
      })
      .filter(Boolean);

    const slides = featured.length
      ? featured
      : products.slice(0, 4);

    els.heroSlides.innerHTML = slides
      .map(function (p, index) {
        const delay = "floating-delay-" + ((index % 3) + 1);
        const cta = index % 2 === 0 ? "ORDENAR AHORA" : "PROBAR";
        return (
          '<div class="swiper-slide hero-slide" data-category="' +
          escapeAttr(p.category) +
          '" data-product-id="' +
          escapeAttr(p.id) +
          '" role="button" tabindex="0" aria-label="Ver ' +
          escapeAttr(p.name) +
          ' en el menú">' +
          '<div class="hero-slide__img floating ' +
          delay +
          '">' +
          '<img src="' +
          escapeAttr(p.image) +
          '" alt="' +
          escapeAttr(p.name) +
          '" width="220" height="220" />' +
          "</div>" +
          '<h3 class="hero-slide__name font-display">' +
          escapeHtml(p.name) +
          "</h3>" +
          '<p class="hero-slide__meta">' +
          money(p.price) +
          " · " +
          escapeHtml(p.calories) +
          "</p>" +
          '<button type="button" class="btn-comic btn-comic--cream hero-cta" data-category="' +
          escapeAttr(p.category) +
          '">' +
          cta +
          ' <i class="fa-solid fa-arrow-down" aria-hidden="true"></i>' +
          "</button>" +
          "</div>"
        );
      })
      .join("");

    if (window.DaVinciSwiper && typeof window.DaVinciSwiper.init === "function") {
      window.DaVinciSwiper.init();
    }
  }

  function goToMenuCategory(category) {
    setActiveTab(category || "all");
    const menu = document.getElementById("menu");
    if (menu) {
      menu.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  /* ——— Cart ——— */
  function addToCart(id, amount) {
    const delta = typeof amount === "number" ? amount : 1;
    const current = cart.get(id) || 0;
    const next = current + delta;
    if (next <= 0) {
      cart.delete(id);
    } else {
      cart.set(id, next);
    }
    renderCart();
  }

  function renderCart() {
    const { entries, itemCount, total } = cartTotals();

    if (els.cartCount) els.cartCount.textContent = String(itemCount);
    if (els.cartBarTotal) els.cartBarTotal.textContent = money(total);
    if (els.cartDrawerTotal) els.cartDrawerTotal.textContent = money(total);

    if (els.cartBar) {
      els.cartBar.classList.toggle("is-hidden", itemCount === 0);
    }

    if (els.submitOrder) {
      els.submitOrder.disabled = itemCount === 0;
    }

    if (els.cartEmpty) {
      els.cartEmpty.hidden = entries.length > 0;
    }

    if (!els.cartItems) return;

    els.cartItems.innerHTML = entries
      .map(function (e) {
        return (
          '<div class="cart-item" data-id="' +
          escapeAttr(e.product.id) +
          '">' +
          '<img src="' +
          escapeAttr(e.product.image) +
          '" alt="" width="56" height="56" />' +
          '<div class="cart-item__info">' +
          "<h3>" +
          escapeHtml(e.product.name) +
          "</h3>" +
          "<p>" +
          money(e.lineTotal) +
          "</p>" +
          "</div>" +
          '<div class="qty-controls">' +
          '<button type="button" class="qty-btn qty-btn--minus" data-qty-delta="-1" data-id="' +
          escapeAttr(e.product.id) +
          '" aria-label="Restar">−</button>' +
          '<span class="qty-value">' +
          e.qty +
          "</span>" +
          '<button type="button" class="qty-btn" data-qty-delta="1" data-id="' +
          escapeAttr(e.product.id) +
          '" aria-label="Sumar">+</button>' +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function openDrawer() {
    if (!els.cartDrawer || !els.drawerOverlay) return;
    els.drawerOverlay.hidden = false;
    requestAnimationFrame(function () {
      els.drawerOverlay.classList.add("is-open");
      els.cartDrawer.classList.add("is-open");
    });
    els.cartDrawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
  }

  function closeDrawer() {
    if (!els.cartDrawer || !els.drawerOverlay) return;
    els.drawerOverlay.classList.remove("is-open");
    els.cartDrawer.classList.remove("is-open");
    els.cartDrawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("drawer-open");
    setTimeout(function () {
      if (!els.cartDrawer.classList.contains("is-open")) {
        els.drawerOverlay.hidden = true;
      }
    }, 320);
  }

  /* ——— Choice buttons ——— */
  function updateAddressRequirement() {
    const method = els.deliveryMethod ? els.deliveryMethod.value : "Delivery";
    const isDelivery = method === "Delivery";
    if (els.addressField) {
      els.addressField.style.display = isDelivery ? "" : "none";
    }
    if (els.customerAddress) {
      els.customerAddress.required = isDelivery;
      if (!isDelivery) {
        els.customerAddress.value =
          els.customerAddress.value || "Retiro en local (Pick-up)";
      }
    }
  }

  /* ——— WhatsApp ——— */
  function buildWhatsAppMessage() {
    const { entries, total } = cartTotals();
    const name = (els.customerName && els.customerName.value.trim()) || "—";
    const method =
      (els.deliveryMethod && els.deliveryMethod.value) || "Delivery";
    const address =
      (els.customerAddress && els.customerAddress.value.trim()) || "—";
    const payment =
      (els.paymentMethod && els.paymentMethod.value) || "Pago Móvil";

    const lines = entries.map(function (e) {
      return (
        "- " +
        e.qty +
        "x " +
        e.product.name +
        " ($" +
        e.lineTotal.toFixed(2) +
        ")"
      );
    });

    return (
      " *¡Pedido Da'Vinci Burger!* \n" +
      "---------------------------------\n" +
      " *Cliente:* " +
      name +
      "\n" +
      " *Método:* " +
      method +
      "\n" +
      " *Dirección:* " +
      address +
      "\n" +
      " *Método de Pago:* " +
      payment +
      "\n\n" +
      " *Detalle de la Orden:*\n" +
      lines.join("\n") +
      "\n\n" +
      " *TOTAL A PAGAR:* $" +
      total.toFixed(2) +
      "\n" +
      "---------------------------------"
    );
  }

  function sendWhatsApp(event) {
    event.preventDefault();
    const { itemCount } = cartTotals();
    if (itemCount === 0) {
      showToast("El carrito está vacío");
      return;
    }

    if (!els.orderForm.checkValidity()) {
      els.orderForm.reportValidity();
      return;
    }

    const message = buildWhatsAppMessage();
    const url =
      "https://wa.me/" +
      WHATSAPP_NUMBER +
      "?text=" +
      encodeURIComponent(message);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  /* ——— Escape helpers ——— */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }

  /* ——— Events ——— */
  function bindEvents() {
    els.tabs.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setActiveTab(btn.dataset.category || "all");
      });
    });

    if (els.menuGrid) {
      els.menuGrid.addEventListener("click", function (e) {
        const addBtn = e.target.closest("[data-add]");
        if (addBtn) {
          const id = addBtn.getAttribute("data-add");
          if (!id) return;
          addToCart(id, 1);
          const product = getProduct(id);
          showToast((product ? product.name : "Producto") + " agregado");
          return;
        }

        const toggleBtn = e.target.closest("[data-preview-toggle]");
        if (toggleBtn) {
          const card = toggleBtn.closest(".product-card");
          if (!card) return;
          const willOpen = !card.classList.contains("is-preview-open");
          card.classList.toggle("is-preview-open", willOpen);
          toggleBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
          return;
        }

        const lightboxBtn = e.target.closest("[data-lightbox]");
        if (lightboxBtn) {
          openLightbox(
            lightboxBtn.getAttribute("data-lightbox"),
            lightboxBtn.getAttribute("data-lightbox-alt") || ""
          );
        }
      });

      els.menuGrid.addEventListener(
        "error",
        function (e) {
          const img = e.target;
          if (!(img instanceof HTMLImageElement)) return;
          if (!img.closest(".product-preview")) return;
          const fallback = img.getAttribute("data-fallback");
          if (!fallback || img.src.indexOf(fallback) !== -1) return;
          img.src = fallback;
          const shot = img.closest("[data-lightbox]");
          if (shot) shot.setAttribute("data-lightbox", fallback);
        },
        true
      );
    }

    if (els.lightboxClose) {
      els.lightboxClose.addEventListener("click", closeLightbox);
    }
    if (els.lightboxOverlay) {
      els.lightboxOverlay.addEventListener("click", closeLightbox);
    }

    if (els.heroSlides) {
      els.heroSlides.addEventListener("click", function (e) {
        const slide = e.target.closest(".hero-slide");
        const cta = e.target.closest(".hero-cta");
        const target = cta || slide;
        if (!target) return;
        e.preventDefault();
        const category = target.getAttribute("data-category");
        goToMenuCategory(category);
      });

      els.heroSlides.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        const slide = e.target.closest(".hero-slide");
        if (!slide) return;
        e.preventDefault();
        goToMenuCategory(slide.getAttribute("data-category"));
      });
    }

    if (els.cartBar) {
      els.cartBar.addEventListener("click", openDrawer);
    }
    if (els.drawerClose) {
      els.drawerClose.addEventListener("click", closeDrawer);
    }
    if (els.drawerOverlay) {
      els.drawerOverlay.addEventListener("click", closeDrawer);
    }

    if (els.cartItems) {
      els.cartItems.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-qty-delta]");
        if (!btn) return;
        const id = btn.getAttribute("data-id");
        const delta = Number(btn.getAttribute("data-qty-delta"));
        if (!id || !delta) return;
        addToCart(id, delta);
      });
    }

    document.querySelectorAll("[data-choice-group]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const group = btn.getAttribute("data-choice-group");
        const value = btn.getAttribute("data-value");
        document
          .querySelectorAll('[data-choice-group="' + group + '"]')
          .forEach(function (b) {
            b.classList.toggle("is-selected", b === btn);
          });
        if (group === "delivery" && els.deliveryMethod) {
          els.deliveryMethod.value = value;
          updateAddressRequirement();
        }
        if (group === "payment" && els.paymentMethod) {
          els.paymentMethod.value = value;
        }
      });
    });

    if (els.orderForm) {
      els.orderForm.addEventListener("submit", sendWhatsApp);
    }

    if (els.navToggle && els.navDrawer) {
      els.navToggle.addEventListener("click", function () {
        const open = !els.navDrawer.classList.contains("is-open");
        els.navDrawer.classList.toggle("is-open", open);
        els.navDrawer.hidden = !open;
        els.navToggle.setAttribute("aria-expanded", open ? "true" : "false");
        els.navToggle.setAttribute(
          "aria-label",
          open ? "Cerrar menú" : "Abrir menú"
        );
      });

      els.navDrawer.querySelectorAll("[data-nav-link]").forEach(function (link) {
        link.addEventListener("click", function () {
          els.navDrawer.classList.remove("is-open");
          els.navDrawer.hidden = true;
          els.navToggle.setAttribute("aria-expanded", "false");
        });
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (els.lightbox && els.lightbox.classList.contains("is-open")) {
          closeLightbox();
          return;
        }
        closeDrawer();
      }
    });
  }

  function openLightbox(src, alt) {
    if (!els.lightbox || !els.lightboxImg || !src) return;
    els.lightboxImg.src = src;
    els.lightboxImg.alt = alt || "Foto del producto";
    if (els.lightboxCaption) {
      els.lightboxCaption.textContent = alt || "";
    }
    els.lightbox.hidden = false;
    requestAnimationFrame(function () {
      els.lightbox.classList.add("is-open");
    });
    els.lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
  }

  function closeLightbox() {
    if (!els.lightbox) return;
    els.lightbox.classList.remove("is-open");
    els.lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
    setTimeout(function () {
      if (!els.lightbox.classList.contains("is-open")) {
        els.lightbox.hidden = true;
        if (els.lightboxImg) {
          els.lightboxImg.removeAttribute("src");
        }
      }
    }, 220);
  }

  /* ——— Boot ——— */
  async function init() {
    bindEvents();
    updateAddressRequirement();
    renderCart();

    try {
      const res = await fetch("data/menu.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      products = Array.isArray(data.products) ? data.products : [];
      featuredIds = Array.isArray(data.featured) ? data.featured : [];
      renderHero();
      renderMenu();
    } catch (err) {
      console.error("Error cargando menú:", err);
      if (els.menuGrid) {
        els.menuGrid.innerHTML =
          '<div class="menu-status">No se pudo cargar el menú. Abrí la página con un servidor local.</div>';
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
