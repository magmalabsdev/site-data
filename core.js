(function () {
  // Content JSON + stylesheet live in the site-data submodule, served from its
  // own GitHub Pages. All data fetches below load from this base URL.
  const SITE_DATA_BASE = "https://magmalabsdev.github.io/site-data";

  const toastEl = document.querySelector("[data-toast]");
  let toastTimer = null;

  function toast(message) {
    if (!toastEl) return;

    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastEl.classList.remove("is-visible");
    }, 3200);
  }

  function updateYear() {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  function getCurrentPage() {
    const path = String(window.location.pathname || "");
    const parts = path.split("/").filter(Boolean);
    if (!parts.length) return "";
    const last = parts[parts.length - 1];
    if (last.includes(".")) return last;
    return last;
  }

  const PUBLISHED_HOSTS = new Set(["magmalabs.dev", "magmalabsdev.github.io"]);

  function getCurrentHostname() {
    return String(window.location.hostname || "")
      .trim()
      .toLowerCase()
      .replace(/^www\./, "");
  }

  function isPublishedSite() {
    return PUBLISHED_HOSTS.has(getCurrentHostname());
  }

  // True only on a local development host. Used to gate dev-only tools (e.g. the
  // blog builder) so they stay hidden on every deployed host, known or not.
  function isLocalHost() {
    const host = getCurrentHostname();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "[::1]" ||
      host === "::1" ||
      host === "" ||
      host.endsWith(".local") ||
      host.endsWith(".localhost")
    );
  }

  function isCurrentLink(link, href, currentPage) {
    if (Array.isArray(link?.currentFor) && link.currentFor.includes(currentPage)) {
      return true;
    }
    const hrefRaw = String(href || "").trim();
    if (!hrefRaw) return false;

    // Avoid marking in-page anchors (e.g. #contact) as the active page.
    if (hrefRaw.includes("#")) {
      const base = hrefRaw.split("#")[0].replace(/^\/|\/$/g, "");
      if (!base || base === currentPage) return false;
    }

    const hrefBase = hrefRaw.split("#")[0].replace(/^\/|\/$/g, "");
    return hrefBase === currentPage;
  }

  function resolveHref(link, isHomePage) {
    const raw = isHomePage && link?.hrefHome ? link.hrefHome : link?.href;
    return String(raw || "").trim();
  }

  function createNavLink(link, currentPage, isHomePage, { variant }) {
    const href = resolveHref(link, isHomePage);
    const a = document.createElement("a");
    a.href = href || "#";
    a.textContent = String(link?.label || "").trim() || href;

    if (variant === "desktop" && link?.desktopClass) {
      a.className = String(link.desktopClass || "").trim();
    }

    if (variant !== "mobile" && a.className && a.className.includes("btn")) {
      // Keep CTA links out of aria-current highlighting.
    } else if (isCurrentLink(link, href, currentPage)) {
      a.setAttribute("aria-current", "page");
    }

    return a;
  }

  function renderSiteHeader(host, config) {
    if (!host) return;
    host.textContent = "";

    const currentPage = getCurrentPage();
    const isHomePage = currentPage === "";

    const container = document.createElement("div");
    container.className = "container header-inner";
    host.appendChild(container);

    const brand = document.createElement("a");
    brand.className = "brand";
    brand.href = String(config?.brand?.href || "/");
    brand.setAttribute(
      "aria-label",
      String(config?.brand?.ariaLabel || "Magma Labs home")
    );

    const brandImg = document.createElement("img");
    brandImg.src = String(config?.brand?.logo?.src || `${SITE_DATA_BASE}/logo.svg`);
    brandImg.alt = String(config?.brand?.logo?.alt ?? "Magma Labs logo");
    brandImg.width = Number(config?.brand?.logo?.width || 34);
    brandImg.height = Number(config?.brand?.logo?.height || 34);
    brand.appendChild(brandImg);

    const brandText = document.createElement("span");
    brandText.textContent = String(config?.brand?.text || "Magma Labs");
    brand.appendChild(brandText);
    container.appendChild(brand);

    const nav = document.createElement("nav");
    nav.className = "nav";
    nav.setAttribute("aria-label", "Primary");
    container.appendChild(nav);

    const links = Array.isArray(config?.links) ? config.links : [];
    links.forEach((link) => {
      nav.appendChild(createNavLink(link, currentPage, isHomePage, { variant: "desktop" }));
    });

    const toggle = document.createElement("button");
    toggle.className = "nav-toggle";
    toggle.type = "button";
    toggle.setAttribute("data-nav-toggle", "");
    toggle.setAttribute("aria-label", "Open menu");
    toggle.setAttribute("aria-controls", "mobile-nav");
    toggle.setAttribute("aria-expanded", "false");

    const toggleLines = document.createElement("span");
    toggleLines.className = "nav-toggle-lines";
    toggleLines.setAttribute("aria-hidden", "true");
    toggle.appendChild(toggleLines);
    container.appendChild(toggle);

    const mobileNav = document.createElement("div");
    mobileNav.id = "mobile-nav";
    mobileNav.className = "mobile-nav";
    mobileNav.setAttribute("data-mobile-nav", "");
    mobileNav.hidden = true;

    const mobileInner = document.createElement("div");
    mobileInner.className = "container mobile-nav-inner";
    mobileNav.appendChild(mobileInner);

    links.forEach((link) => {
      mobileInner.appendChild(
        createNavLink(link, currentPage, isHomePage, { variant: "mobile" })
      );
    });

    host.appendChild(mobileNav);
  }

  function renderFineprint(container, template) {
    const raw = String(template || "").trim();
    const fallback = "© {year} Magma Labs. All rights reserved.";
    const text = raw || fallback;
    const parts = text.split("{year}");

    container.textContent = "";
    if (parts.length === 1) {
      container.textContent = text;
      return;
    }

    container.append(parts[0]);
    const year = document.createElement("span");
    year.id = "year";
    year.textContent = String(new Date().getFullYear());
    container.appendChild(year);
    container.append(parts.slice(1).join("{year}"));
  }

  function renderSiteFooter(host, config) {
    if (!host) return;
    host.textContent = "";

    const currentPage = getCurrentPage();
    const isHomePage = currentPage === "";

    const container = document.createElement("div");
    container.className = "container footer-inner";
    host.appendChild(container);

    const top = document.createElement("div");
    top.className = "footer-top";
    container.appendChild(top);

    const brand = document.createElement("a");
    brand.className = "brand";
    brand.href = String(config?.brand?.href || "/");
    brand.setAttribute(
      "aria-label",
      String(config?.brand?.ariaLabel || "Magma Labs home")
    );

    const brandImg = document.createElement("img");
    brandImg.src = String(config?.brand?.logo?.src || `${SITE_DATA_BASE}/logo.svg`);
    brandImg.alt = String(config?.brand?.logo?.alt ?? "");
    brandImg.width = Number(config?.brand?.logo?.width || 34);
    brandImg.height = Number(config?.brand?.logo?.height || 34);
    brand.appendChild(brandImg);

    const brandText = document.createElement("span");
    brandText.textContent = String(config?.brand?.text || "Magma Labs");
    brand.appendChild(brandText);
    top.appendChild(brand);

    const columns = document.createElement("div");
    columns.className = "footer-columns";
    columns.setAttribute("aria-label", "Footer navigation");
    top.appendChild(columns);

    const cols = Array.isArray(config?.columns) ? config.columns : [];
    cols.forEach((col) => {
      const colEl = document.createElement("div");
      colEl.className = "footer-col";

      const title = document.createElement("div");
      title.className = "footer-col-title";
      title.textContent = String(col?.title || "").trim();
      colEl.appendChild(title);

      const list = document.createElement("div");
      list.className = "footer-col-links";

      const links = Array.isArray(col?.links) ? col.links : [];
      links.forEach((link) => {
        list.appendChild(createNavLink(link, currentPage, isHomePage, { variant: "footer" }));
      });

      colEl.appendChild(list);
      columns.appendChild(colEl);
    });

    const fineprint = document.createElement("div");
    fineprint.className = "fineprint";
    renderFineprint(fineprint, config?.fineprint);
    container.appendChild(fineprint);
  }

  function initHeaderInteractions() {
    // Sticky header shadow
    const header = document.querySelector("[data-header]");
    function updateHeader() {
      if (!header) return;
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }
    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();

    // Mobile nav toggle
    const navToggle = document.querySelector("[data-nav-toggle]");
    const mobileNav = document.querySelector("[data-mobile-nav]");

    function closeMobileNav() {
      if (!navToggle || !mobileNav) return;
      mobileNav.hidden = true;
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
      document.body.classList.remove("nav-open");
    }

    function openMobileNav() {
      if (!navToggle || !mobileNav) return;
      mobileNav.hidden = false;
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.setAttribute("aria-label", "Close menu");
      document.body.classList.add("nav-open");
    }

    if (navToggle && mobileNav) {
      navToggle.addEventListener("click", () => {
        const isOpen = navToggle.getAttribute("aria-expanded") === "true";
        if (isOpen) closeMobileNav();
        else openMobileNav();
      });

      mobileNav.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.closest("a")) closeMobileNav();
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMobileNav();
      });

      document.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (mobileNav.hidden) return;
        if (target.closest("[data-mobile-nav]")) return;
        if (target.closest("[data-nav-toggle]")) return;
        closeMobileNav();
      });
    }
  }

  const chromeHeaderHost = document.querySelector("[data-site-header]");
  const chromeFooterHost = document.querySelector("[data-site-footer]");

  const DEFAULT_CHROME = {
    header: {
      brand: {
        href: "/",
        ariaLabel: "Magma Labs home",
        logo: { src: `${SITE_DATA_BASE}/logo.svg`, alt: "Magma Labs logo", width: 34, height: 34 },
        text: "Magma Labs"
      },
      links: [
        { label: "Home", href: "/" },
        { label: "Projects", href: "/products/" },
        { label: "Partnerships", href: "/partnerships/" },
        { label: "Events", href: "https://events.magmalabs.dev/" },
        { label: "Awards", href: "/awards/" },
        { label: "Blog", href: "/blog/", currentFor: ["blog", "post"] },
        { label: "Team", href: "/team/" }
      ]
    },
    footer: {
      brand: {
        href: "/",
        ariaLabel: "Magma Labs home",
        logo: { src: `${SITE_DATA_BASE}/logo.svg`, alt: "", width: 34, height: 34 },
        text: "Magma Labs"
      },
      columns: [
        {
          title: "Menu",
          links: [
            { label: "Home", href: "/" },
            { label: "Team", href: "/team/" },
            { label: "Films", href: "/films/" },
            { label: "Contact", href: "/#contact", hrefHome: "#contact" }
          ]
        },
        {
          title: "Projects",
          links: [
            { label: "Projects", href: "/products/" },
            { label: "Partnerships", href: "/partnerships/" }
          ]
        },
        {
          title: "Media",
          links: [
            { label: "Events", href: "https://events.magmalabs.dev/" },
            { label: "Awards", href: "/awards/" },
            { label: "Blog", href: "/blog/", currentFor: ["blog", "post"] }
          ]
        }
      ],
      fineprint: "© {year} Magma Labs. All rights reserved."
    }
  };

  // A page can point at a different nav config (e.g. the standalone films/ecp
  // sites) by setting window.MAGMA_SITE_JSON_URL before core.js runs.
  const SITE_JSON_URL = window.MAGMA_SITE_JSON_URL || `${SITE_DATA_BASE}/site.json`;

  async function loadSiteChrome() {
    const response = await fetch(SITE_JSON_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load site.json (${response.status})`);
    }
    return response.json();
  }

  if (chromeHeaderHost || chromeFooterHost) {
    loadSiteChrome()
      .catch(() => DEFAULT_CHROME)
      .then((chrome) => {
        if (chromeHeaderHost) renderSiteHeader(chromeHeaderHost, chrome?.header || DEFAULT_CHROME.header);
        if (chromeFooterHost) renderSiteFooter(chromeFooterHost, chrome?.footer || DEFAULT_CHROME.footer);
        updateYear();
        initHeaderInteractions();
      });
  } else {
    updateYear();
    initHeaderInteractions();
  }

  // Copy-to-clipboard triggers (supports dynamically-added buttons)
  async function copyToClipboard(value) {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      toast("Copied to clipboard.");
    } catch {
      const temp = document.createElement("textarea");
      temp.value = value;
      temp.setAttribute("readonly", "true");
      temp.style.position = "absolute";
      temp.style.left = "-9999px";
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
      toast("Copied to clipboard.");
    }
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const copyEl = target.closest("[data-copy]");
    if (!copyEl) return;
    const value = copyEl.getAttribute("data-copy") || "";
    if (!value) return;
    event.preventDefault();
    copyToClipboard(value);
  });

  // Expose universal helpers for the site-specific script (script.js).
  window.MagmaCore = {
    SITE_DATA_BASE,
    toast,
    copyToClipboard,
    getCurrentPage,
    getCurrentHostname,
    isPublishedSite,
    isLocalHost
  };
})();
