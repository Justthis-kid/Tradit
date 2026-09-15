const products = [
  {
    id: "mariner-86",
    name: "Mariner 86 High",
    detail: "Cream / rust canvas",
    price: 138,
    size: "8.5",
    condition: "Very good",
    story: "Worn for one summer on the coast. The patina is the point.",
    image: "editorial-shoe.jpg",
    category: "High-tops",
    isNew: true
  },
  {
    id: "silver-pace",
    name: "Pace Runner 04",
    detail: "Silver mesh / poppy",
    price: 92,
    size: "7",
    condition: "Excellent",
    story: "A barely-run pair from a collector who prefers the next colorway.",
    image: "runner-silver.jpg",
    category: "Runners"
  },
  {
    id: "night-shift",
    name: "Night Shift Loafer",
    detail: "Polished leather / gold",
    price: 178,
    size: "9",
    condition: "Good",
    story: "Found in a tiny Lisbon shop. Soft leather, serious sole.",
    image: "loafers-black.jpg",
    category: "Loafers"
  },
  {
    id: "court-side",
    name: "Court Side 73",
    detail: "Bone / forest / ochre",
    price: 116,
    size: "8",
    condition: "Very good",
    story: "A daily pair that got better with every city block.",
    image: "court-white.jpg",
    category: "Low-tops"
  }
];

const history = [
  { label: "Credit from Mariner 86 sale", date: "Jun 14, 2024", amount: "+ $68.40", type: "in" },
  { label: "Applied to Pace Runner 04", date: "May 29, 2024", amount: "− $22.00", type: "out" },
  { label: "Welcome credit", date: "May 07, 2024", amount: "+ $10.00", type: "in" }
];

const state = {
  favorites: new Set(),
  bag: [],
  mobileMenu: false,
  notice: "",
  shopQuery: "",
  shopCategory: "All pairs",
  shopSort: "Featured",
  evaluator: { status: "idle", fileName: "" },
  useCredit: false,
  topUp: false
};

const icon = (name, size = 18) => {
  const paths = {
    arrowRight: `<path d="M5 12h14M13 6l6 6-6 6"/>`,
    arrowUpRight: `<path d="M7 17 17 7M7 7h10v10"/>`,
    arrowDown: `<path d="M12 5v14m6-6-6 6-6-6"/>`,
    arrowUp: `<path d="M12 19V5m-6 6 6-6 6 6"/>`,
    bag: `<path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>`,
    camera: `<path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Z"/><circle cx="12" cy="13" r="3"/>`,
    check: `<path d="m5 12 4 4L19 6"/>`,
    checkCircle: `<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>`,
    heart: `<path d="M20.8 8.7c0 5.5-8.8 10.3-8.8 10.3S3.2 14.2 3.2 8.7A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.6Z"/>`,
    menu: `<path d="M4 7h16M4 12h16M4 17h16"/>`,
    search: `<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>`,
    scan: `<path d="M6 4H4v4M18 4h2v4M6 20H4v-4M18 20h2v-4"/><circle cx="12" cy="12" r="3"/>`,
    shield: `<path d="M12 21s8-3.6 8-10V5l-8-3-8 3v6c0 6.4 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>`,
    sliders: `<path d="M4 6h7M15 6h5M4 12h3M11 12h9M4 18h9M17 18h3"/><circle cx="13" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="18" r="2"/>`,
    sparkles: `<path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3ZM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/>`,
    upload: `<path d="M12 16V4m0 0L8 8m4-4 4 4"/><path d="M5 15v4h14v-4"/>`,
    wallet: `<path d="M4 6h16v14H4z"/><path d="M4 6V4h13v2M16 13h4"/><circle cx="16" cy="13" r=".7"/>`,
    clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
    x: `<path d="m6 6 12 12M18 6 6 18"/>`
  };
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ""}</svg>`;
};

function header() {
  return `
    <div class="topline">Every pair has a past. Give it another good one.</div>
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="#/" aria-label="Tradits home">
          <span class="brand-mark">${icon("scan", 18)}</span>
          <span class="brand-wordmark">Tradits</span>
        </a>
        <nav class="main-nav" aria-label="Main navigation">
          <a href="#/shop">Shop the archive</a>
          <a href="#/evaluate">Evaluate a pair</a>
          <a href="#/credit">My credit</a>
        </nav>
        <div class="header-actions">
          <a class="icon-button" href="#/shop" aria-label="Search marketplace">${icon("search", 19)}</a>
          <button class="icon-button bag-button" data-action="open-bag" aria-label="Open bag">
            ${icon("bag", 19)}${state.bag.length ? `<span class="bag-count">${state.bag.length}</span>` : ""}
          </button>
          <button class="icon-button menu-button" data-action="toggle-menu" aria-label="Toggle menu">${icon(state.mobileMenu ? "x" : "menu", 20)}</button>
        </div>
      </div>
      ${state.mobileMenu ? `<nav class="mobile-nav"><a href="#/shop">Shop the archive</a><a href="#/evaluate">Evaluate a pair</a><a href="#/credit">My credit</a></nav>` : ""}
    </header>
  `;
}

function footer() {
  return `
    <footer class="site-footer">
      <div class="footer-grid">
        <div>
          <p class="footer-brand">Tradits</p>
          <p class="footer-copy">The considered way to pass good shoes forward. Condition checked, stories kept.</p>
        </div>
        <div>
          <p class="eyebrow footer-label">Explore</p>
          <div class="footer-links"><a class="text-link" href="#/shop">Shop the archive</a><a class="text-link" href="#/evaluate">Evaluate a pair</a><a class="text-link" href="#/credit">My credit</a></div>
        </div>
        <div>
          <p class="eyebrow footer-label">The exchange</p>
          <div class="footer-links"><button class="text-link" data-action="condition-guide">Condition guide</button><button class="text-link" data-action="contact">Contact the desk</button></div>
        </div>
        <div>
          <p class="eyebrow footer-label">Notes from the archive</p>
          <form class="newsletter" data-form="newsletter"><input aria-label="Email address" type="email" placeholder="Your email address" required /><button aria-label="Subscribe">${icon("arrowRight", 18)}</button></form>
        </div>
      </div>
      <div class="footer-bottom"><span>© 2024 Tradits</span><span>Not a storefront. A second life.</span></div>
    </footer>
  `;
}

// (rest of script.js content continues unchanged)
[TRUNCATED FOR BREVITY IN THIS OUTPUT]
