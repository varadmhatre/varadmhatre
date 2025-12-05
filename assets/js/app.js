// --- Simple "backend" using localStorage --- //

const LS_KEYS = {
  USERS: "qs_users",
  CURRENT_USER: "qs_current_user",
  CART: "qs_cart",
  LAST_ORDER: "qs_last_order",
};

function getUsers() {
  return JSON.parse(localStorage.getItem(LS_KEYS.USERS) || "[]");
}

function saveUsers(users) {
  localStorage.setItem(LS_KEYS.USERS, JSON.stringify(users));
}

function getCurrentUser() {
  const raw = localStorage.getItem(LS_KEYS.CURRENT_USER);
  return raw ? JSON.parse(raw) : null;
}

function setCurrentUser(user) {
  if (user) localStorage.setItem(LS_KEYS.CURRENT_USER, JSON.stringify(user));
  else localStorage.removeItem(LS_KEYS.CURRENT_USER);
}

function getCart() {
  return JSON.parse(localStorage.getItem(LS_KEYS.CART) || "[]");
}

function saveCart(cart) {
  localStorage.setItem(LS_KEYS.CART, JSON.stringify(cart));
  updateCartCount();
}

// --- Products list --- //

const PRODUCTS = [
  {
    id: "notebook-ruled-a5",
    name: "A5 Ruled Notebook (200 pages)",
    price: 89,
    category: "notebooks",
    tag: "college essentials",
  },
  {
    id: "notebook-dotted-a5",
    name: "A5 Dotted Journal",
    price: 149,
    category: "notebooks",
    tag: "bullet journaling",
  },
  {
    id: "pen-gel-smooth",
    name: "Smooth Gel Pen (Pack of 3)",
    price: 59,
    category: "pens",
    tag: "exam friendly",
  },
  {
    id: "pen-ball-blue",
    name: "Blue Ball Pen (Pack of 10)",
    price: 75,
    category: "pens",
    tag: "everyday writing",
  },
  {
    id: "marker-highlighter",
    name: "Pastel Highlighters (Set of 5)",
    price: 199,
    category: "art",
    tag: "study notes",
  },
  {
    id: "sketchbook-a4",
    name: "A4 Sketchbook (120 gsm)",
    price: 249,
    category: "art",
    tag: "artists choice",
  },
  {
    id: "sticky-notes-neon",
    name: "Neon Sticky Notes (Pack of 4)",
    price: 99,
    category: "supplies",
    tag: "quick reminders",
  },
  {
    id: "binder-clips",
    name: "Binder Clips (Assorted, 24 pcs)",
    price: 69,
    category: "supplies",
    tag: "organize papers",
  },
];

// --- UI helpers --- //

function byId(id) {
  return document.getElementById(id);
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const el = byId("cartCount");
  if (el) el.textContent = count;
}

function initHeader() {
  const user = getCurrentUser();
  const authButton = byId("navAuthButton");
  const profileLink = byId("navProfileLink");

  if (authButton) {
    if (user) {
      authButton.textContent = "Logout";
    } else {
      authButton.textContent = "Login";
    }
  }

  if (profileLink) {
    if (user) {
      profileLink.style.display = "inline-flex";
    } else {
      profileLink.style.display = "none";
    }
  }

  const yearEl = byId("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  updateCartCount();
}

function handleAuthClick() {
  const user = getCurrentUser();
  if (user) {
    // Logout
    setCurrentUser(null);
    window.location.href = "index.html";
  } else {
    window.location.href = "login.html";
  }
}

// --- Hero helpers --- //

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleGlobalSearch() {
  const input = byId("globalSearch");
  if (!input) return;
  const q = input.value.trim();
  if (!q) return;
  // Save query and redirect to shop
  sessionStorage.setItem("qs_search_query", q);
  window.location.href = "shop.html";
}

// --- Shop page logic --- //

let activeCategory = "all";

function goToShopWithFilter(cat) {
  sessionStorage.setItem("qs_category_filter", cat);
  window.location.href = "shop.html";
}

function setCategoryFilter(cat, btn) {
  activeCategory = cat;

  const chips = document.querySelectorAll(".chip");
  chips.forEach((c) => c.classList.remove("chip-active"));
  if (btn) btn.classList.add("chip-active");

  renderProducts();
}

function filterProducts() {
  const searchEl = byId("shopSearch");
  const query = searchEl ? searchEl.value.trim() : "";
  sessionStorage.setItem("qs_search_query", query);
  renderProducts();
}

function renderProducts() {
  const grid = byId("productsGrid");
  if (!grid) return;

  const searchEl = byId("shopSearch");
  const query = searchEl ? searchEl.value.trim().toLowerCase() : "";

  const cart = getCart();
  grid.innerHTML = "";

  PRODUCTS.forEach((product) => {
    if (activeCategory !== "all" && product.category !== activeCategory) return;

    if (
      query &&
      !product.name.toLowerCase().includes(query) &&
      !product.tag.toLowerCase().includes(query)
    ) {
      return;
    }

    const inCart = cart.find((c) => c.id === product.id);
    const qty = inCart ? inCart.qty : 0;

    const div = document.createElement("div");
    div.className = "card product-card";
    div.innerHTML = `
      <div class="product-title">${product.name}</div>
      <div class="product-meta">
        <span class="product-price">₹${product.price}</span>
        <span>${product.tag}</span>
      </div>
      <div class="product-actions">
        ${
          qty === 0
            ? `<button class="btn btn-outline" data-role="add" data-id="${product.id}">Add</button>`
            : `
          <div class="product-qty">
            <button data-role="dec" data-id="${product.id}">-</button>
            <span>${qty}</span>
            <button data-role="inc" data-id="${product.id}">+</button>
          </div>`
        }
      </div>
    `;

    grid.appendChild(div);
  });

  // Attach listeners for add/inc/dec
  grid.querySelectorAll("[data-role]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const role = btn.getAttribute("data-role");
      if (role === "add") addToCart(id);
      if (role === "inc") changeCartQty(id, 1);
      if (role === "dec") changeCartQty(id, -1);
    });
  });
}

// --- Cart operations --- //

function addToCart(productId) {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return;

  const cart = getCart();
  const existing = cart.find((c) => c.id === productId);

  if (existing) existing.qty += 1;
  else cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });

  saveCart(cart);
  if (document.body.dataset.page === "shop") {
    renderProducts();
  }
}

function changeCartQty(productId, delta) {
  let cart = getCart();
  const item = cart.find((c) => c.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((c) => c.id !== productId);
  }
  saveCart(cart);
  if (document.body.dataset.page === "shop") {
    renderProducts();
  }
  if (document.body.dataset.page === "cart") {
    renderCartPage();
  }
}

// --- Cart page rendering --- //

function renderCartPage() {
  const container = byId("cartItems");
  const itemsTotalEl = byId("itemsTotal");
  const grandTotalEl = byId("grandTotal");
  const msgEl = byId("cartMessage");

  if (!container) return;

  const cart = getCart();
  container.innerHTML = "";

  if (cart.length === 0) {
    container.innerHTML = `<p class="muted">Your cart is empty. <a href="shop.html">Add some stationery</a>.</p>`;
    if (itemsTotalEl) itemsTotalEl.textContent = "0";
    if (grandTotalEl) grandTotalEl.textContent = "0";
    if (msgEl) msgEl.textContent = "";
    return;
  }

  let total = 0;

  cart.forEach((item) => {
    total += item.price * item.qty;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <div class="cart-item-main">
        <div class="cart-item-title">${item.name}</div>
        <div class="cart-item-meta">₹${item.price} × ${item.qty}</div>
      </div>
      <div class="cart-item-actions">
        <button class="btn-ghost" data-role="dec" data-id="${item.id}">-</button>
        <span>${item.qty}</span>
        <button class="btn-ghost" data-role="inc" data-id="${item.id}">+</button>
        <button class="btn-ghost" data-role="remove" data-id="${item.id}">✕</button>
      </div>
    `;
    container.appendChild(div);
  });

  if (itemsTotalEl) itemsTotalEl.textContent = String(total);
  if (grandTotalEl) grandTotalEl.textContent = String(total);

  container.querySelectorAll("[data-role]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const role = btn.getAttribute("data-role");
      if (role === "inc") changeCartQty(id, 1);
      if (role === "dec") changeCartQty(id, -1);
      if (role === "remove") changeCartQty(id, -999); // brute remove
    });
  });
}

function proceedToCheckout() {
  const cart = getCart();
  const msgEl = byId("cartMessage");
  if (!cart.length) {
    if (msgEl) msgEl.textContent = "Cart is empty. Add some items first.";
    return;
  }

  const user = getCurrentUser();
  if (!user) {
    if (msgEl)
      msgEl.textContent = "Please log in or sign up before placing an order.";
    window.location.href = "login.html";
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const order = {
    id: "QS" + Math.floor(Math.random() * 1_000_000),
    total,
    timestamp: Date.now(),
  };

  localStorage.setItem(LS_KEYS.LAST_ORDER, JSON.stringify(order));
  saveCart([]);
  window.location.href = "order-success.html";
}

// --- Order success page --- //

function renderOrderSuccess() {
  const orderIdEl = byId("orderId");
  const orderTotalEl = byId("orderTotal");
  const raw = localStorage.getItem(LS_KEYS.LAST_ORDER);
  if (!raw) return;
  const order = JSON.parse(raw);
  if (orderIdEl) orderIdEl.textContent = order.id;
  if (orderTotalEl) orderTotalEl.textContent = String(order.total || 0);
}

// --- Auth (signup & login) --- //

function initSignup() {
  const form = byId("signupForm");
  if (!form) return;
  const errorEl = byId("signupError");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = byId("signupName").value.trim();
    const email = byId("signupEmail").value.trim().toLowerCase();
    const password = byId("signupPassword").value;

    const users = getUsers();
    if (users.find((u) => u.email === email)) {
      if (errorEl) errorEl.textContent = "An account with this email already exists.";
      return;
    }

    const user = { name, email, password };
    users.push(user);
    saveUsers(users);
    setCurrentUser(user);
    window.location.href = "shop.html";
  });
}

function initLogin() {
  const form = byId("loginForm");
  if (!form) return;
  const errorEl = byId("loginError");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = byId("loginEmail").value.trim().toLowerCase();
    const password = byId("loginPassword").value;

    const users = getUsers();
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) {
      if (errorEl) errorEl.textContent = "Incorrect email or password.";
      return;
    }

    setCurrentUser(user);
    window.location.href = "shop.html";
  });
}

function logoutUser() {
  setCurrentUser(null);
  window.location.href = "index.html";
}

// --- Profile page --- //

function initProfile() {
  const user = getCurrentUser();
  const greeting = byId("profileGreeting");
  if (!greeting) return;

  if (!user) {
    greeting.textContent = "You are not logged in. Please log in to view your profile.";
    return;
  }

  greeting.textContent = `Hi, ${user.name}. This is your QuickStationery profile.`;
}

// --- Page bootstrapping --- //

document.addEventListener("DOMContentLoaded", () => {
  initHeader();

  const page = document.body.dataset.page;

  // Restore search & category filters on shop page
  if (page === "shop") {
    const savedCategory = sessionStorage.getItem("qs_category_filter");
    if (savedCategory) {
      activeCategory = savedCategory;
      const chips = document.querySelectorAll(".chip");
      chips.forEach((chip) => {
        chip.classList.toggle(
          "chip-active",
          chip.getAttribute("data-category") === savedCategory
        );
      });
    }

    const savedQuery = sessionStorage.getItem("qs_search_query");
    if (savedQuery && byId("shopSearch")) {
      byId("shopSearch").value = savedQuery;
    }

    renderProducts();
  }

  if (page === "cart") {
    renderCartPage();
  }

  if (page === "order-success") {
    renderOrderSuccess();
  }

  if (page === "signup") {
    initSignup();
  }

  if (page === "login") {
    initLogin();
  }

  if (page === "profile") {
    initProfile();
  }

  // If coming from home search, push that query into shop search
  if (page === "shop" && !byId("shopSearch").value) {
    const q = sessionStorage.getItem("qs_search_query");
    if (q && byId("shopSearch")) {
      byId("shopSearch").value = q;
      renderProducts();
    }
  }
});
