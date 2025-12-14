(() => {
  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const easings = {
    outExpo: "cubic-bezier(0.16, 1, 0.3, 1)",
    outCubic: "cubic-bezier(0.33, 1, 0.68, 1)",
    inCubic: "cubic-bezier(0.32, 0, 0.67, 0)",
  };

  const normalizeTargets = (targets) => {
    if (!targets) return [];
    if (typeof targets === "string") return $$(targets);
    if (targets instanceof Element) return [targets];
    if (Array.isArray(targets)) return targets.filter(Boolean);
    return [];
  };

  const asPair = (val) => (Array.isArray(val) ? [val[0], val[1]] : [undefined, val]);
  const px = (val) => (typeof val === "number" ? `${val}px` : val);

  const animate = ({
    targets,
    translateX,
    translateY,
    scale,
    opacity,
    width,
    duration = 400,
    easing = easings.outCubic,
    complete,
  }) => {
    const els = normalizeTargets(targets);
    if (!els.length) return;

    const [txFrom, txTo] = asPair(translateX);
    const [tyFrom, tyTo] = asPair(translateY);
    const [scaleFrom, scaleTo] = asPair(scale);
    const [opFrom, opTo] = asPair(opacity);
    const [wFrom, wTo] = asPair(width);

    const buildTransform = (tx, ty, sc) => {
      const parts = [];
      if (tx !== undefined && tx !== null) parts.push(`translateX(${px(tx)})`);
      if (ty !== undefined && ty !== null) parts.push(`translateY(${px(ty)})`);
      if (sc !== undefined && sc !== null) parts.push(`scale(${sc})`);
      return parts.join(" ");
    };

    const startTransform = buildTransform(txFrom, tyFrom, scaleFrom);
    const endTransform = buildTransform(txTo, tyTo, scaleTo);

    const transitionProps = [];
    if (endTransform) transitionProps.push("transform");
    if (opTo !== undefined) transitionProps.push("opacity");
    if (wTo !== undefined) transitionProps.push("width");

    const transition = transitionProps.map((p) => `${p} ${duration}ms ${easing}`).join(", ");

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (typeof complete === "function") complete();
    };

    els.forEach((el) => {
      if (opFrom !== undefined) el.style.opacity = opFrom;
      if (wFrom !== undefined) el.style.width = px(wFrom);
      if (startTransform) el.style.transform = startTransform;
      if (transition) el.style.transition = transition;

      requestAnimationFrame(() => {
        if (endTransform) el.style.transform = endTransform;
        if (opTo !== undefined) el.style.opacity = opTo;
        if (wTo !== undefined) el.style.width = px(wTo);
      });

      el.addEventListener("transitionend", finish, { once: true });
    });

    setTimeout(finish, duration + 50);
  };

  /* =========================
     Scroll progress
  ========================= */
  const progressBar = $("#scrollProgressBar");
  const updateProgress = () => {
    if (!progressBar) return;
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const height = Math.max(1, doc.scrollHeight - doc.clientHeight);
    const p = Math.max(0, Math.min(1, scrollTop / height));
    progressBar.style.width = `${(p * 100).toFixed(2)}%`;
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  window.addEventListener("load", updateProgress);

  /* =========================
     Nav
  ========================= */
  const navLinksWrap = $("#navLinks");
  const navToggle = $("#navToggle");
  const navIndicator = $("#navIndicator");
  const navLinks = $$(".nav-link");
  const ctaProjects = $("#ctaProjects");

  const setNavOpen = (open) => {
    navLinksWrap?.classList.toggle("is-open", open);
    navToggle?.setAttribute("aria-expanded", String(open));
  };

  navToggle?.addEventListener("click", () => {
    const open = navLinksWrap?.classList.contains("is-open");
    setNavOpen(!open);
  });

  navLinks.forEach((a) =>
    a.addEventListener("click", () => {
      setNavOpen(false);
      const href = a.getAttribute("href");
      if (href?.startsWith("#")) setActiveNavByHash(href);
    })
  );

  const scrollToId = (hash) => {
    const id = hash?.replace("#", "");
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
  };

  ctaProjects?.addEventListener("click", (e) => {
    e.preventDefault();
    scrollToId("#projects");
    history.pushState(null, "", "#projects");
  });

  const moveIndicatorTo = (el) => {
    if (!navIndicator || !el) return;
    const left = el.offsetLeft + 8;
    const width = Math.max(28, el.offsetWidth - 16);
    navIndicator.style.left = `${left}px`;
    navIndicator.style.width = `${width}px`;
  };

  const setActiveNavByHash = (hash) => {
    navLinks.forEach((a) => a.classList.remove("is-active"));
    const active = navLinks.find((a) => a.getAttribute("href") === hash) || navLinks[0];
    active.classList.add("is-active");
    moveIndicatorTo(active);
  };

  requestAnimationFrame(() => moveIndicatorTo($(".nav-link.is-active")));

  const sections = ["#about", "#projects", "#skills", "#contact"]
    .map((id) => document.querySelector(id))
    .filter(Boolean);

  const spy = () => {
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = "#about";
    for (const s of sections) {
      if (s.offsetTop <= y) current = `#${s.id}`;
    }
    setActiveNavByHash(current);
  };

  window.addEventListener("scroll", spy, { passive: true });
  window.addEventListener("resize", () => moveIndicatorTo($(".nav-link.is-active")));
  window.addEventListener("load", spy);

  /* =========================
     Hover lighting
  ========================= */
  $$(".panel").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width) * 100;
      const my = ((e.clientY - r.top) / r.height) * 100;
      card.style.setProperty("--mx", `${mx}%`);
      card.style.setProperty("--my", `${my}%`);
    });
  });

  $$(".project-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width) * 100;
      const my = ((e.clientY - r.top) / r.height) * 100;
      card.style.setProperty("--mx", `${mx}%`);
      card.style.setProperty("--my", `${my}%`);
    });
  });

  /* =========================
     Reveal + hero stagger
  ========================= */
  const revealEls = $$(".reveal");
  const revealNow = (el) => {
    if (el.dataset.revealed === "1") return;
    el.dataset.revealed = "1";

    if (prefersReduced) {
      el.style.opacity = 1;
      el.style.transform = "none";
      return;
    }

    const isHeroStagger = el.classList.contains("hero-stagger");
    if (isHeroStagger) {
      const idx = Number(el.dataset.stagger || "0");
      el.style.transitionDelay = `${Math.min(0.45, idx * 0.08)}s`;
    }

    animate({
      targets: el,
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 650,
      easing: easings.outCubic,
    });
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) revealNow(entry.target);
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach(revealNow);
  }

  /* =========================
     Orbs parallax
  ========================= */
  const orbs = $$(".orb");
  window.addEventListener(
    "mousemove",
    (e) => {
      if (prefersReduced || !orbs.length) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      orbs.forEach((o, i) => {
        const m = (i + 1) * 0.7;
        o.style.transform = `translate3d(${x * m}px, ${y * m}px, 0)`;
      });
    },
    { passive: true }
  );

  /* =========================
     Modal + focus trap (schema-safe)
  ========================= */
  const modal = $("#projectModal");
  const modalBody = $("#modalBody");
  const modalClose = $("#modalClose");
  const modalBackdrop = $("#modalBackdrop");

  let lastActiveEl = null;
  let removeTrap = null;

  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");

  const trapFocus = (container) => {
    const getFocusable = () =>
      $$(focusableSelector, container).filter(
        (el) => el.offsetParent !== null && el.getAttribute("aria-hidden") !== "true"
      );

    const onKeyDown = (e) => {
      if (e.key !== "Tab") return;
      const focusables = getFocusable();
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first || document.activeElement === container) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener("keydown", onKeyDown);
    return () => container.removeEventListener("keydown", onKeyDown);
  };

  const esc = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  // Unsplash Source helper: keyword-based images with stable sizing.
  // This avoids adding an API key and avoids local placeholder assets.
  const u = (keywords, sig) =>
    `https://source.unsplash.com/featured/1200x750?${encodeURIComponent(keywords)}&sig=${encodeURIComponent(
      String(sig)
    )}`;

  const PROJECTS = {
    dms: {
      title: "Donation Management System (DMS)",
      subtitle:
        "Centralized donation operations, receipts, reporting, and compliance for a real temple organization.",
      pills: [
        "Node.js",
        "Express",
        "TypeScript",
        "Prisma",
        "PostgreSQL",
        "React",
        "Docker",
        "RBAC",
        "Audit Logs",
      ],
      links: [
        {
          label: "GitHub Repository",
          url: "https://github.com/ManugaHewa/DonationManagamentSystem-DMS-/tree/Test",
        },
      ],
      problem:
        "Temple donation tracking was fragmented across channels (cash, cheque, Interac/EFT, CanadaHelps, in-kind), making reconciliation, receipts, and reporting slow and error-prone.",
      stakeholders: [
        "Temple administration / monks (oversight)",
        "Treasurers / accountants (reconciliation, tax compliance)",
        "Donors (individuals, families, organizations)",
        "Board/committee (governance + dashboards)",
        "Volunteers/staff (daily recording)",
        "Auditors (integrity + transparency)",
      ],
      scope: [
        "Donor + family records (merge duplicates, anonymous donations supported).",
        "Donation recording (cause/purpose, processor fees, net realized).",
        "Validation workflow (Pending Validation → verified → receipt).",
        "Receipts + acknowledgments (email + printable PDF, year-end tax receipts).",
        "Reporting exports (CSV/Excel/PDF), dashboards, audit trail.",
        "Donor portal (signup/login, manage family, view donation history).",
      ],
      requirementsProof: [
        "Pending Validation state before receipts (accountant verification).",
        "Role-based access control + audit logs.",
        "Support multi-channel donation types including in-kind.",
        "Family receipt consolidation option.",
      ],
      nonFunctional: [
        "WCAG 2.1 compliant + mobile-first.",
        "Performance target ~2s donation processing.",
        "Scalability target 10,000 donors.",
        "Security: encryption in transit/at rest, 2FA for admins/accountants.",
      ],
      successCriteria: [
        "Automated acknowledgements within 24 hours.",
        "Reduce admin workload by ~50%.",
        "Accurate reporting for board + regulators.",
      ],

      // Unsplash “UI shots” (generic but always available)
      shots: [
        { src: u("donation, charity, giving", 1), label: "Donations / giving" },
        { src: u("finance, accounting, spreadsheet", 2), label: "Finance / reconciliation" },
        { src: u("dashboard, analytics, data", 3), label: "Reporting dashboard" },
        { src: u("email, receipt, paperwork", 4), label: "Receipts / acknowledgements" },
        { src: u("community, temple, volunteers", 5), label: "Community operations" },
        { src: u("security, authentication, lock", 6), label: "Security / access control" },
      ],
    },

    exercise: {
      title: "Exercise Prescription App",
      subtitle:
        "Hand therapy companion app with video capture, reminders, accessibility, and progress tracking.",
      pills: ["React Native", "Node/Express", "Auth", "Notifications", "Video", "Subtitles", "iOS", "Android"],
      links: [
        {
          label: "Frontend",
          url: "https://github.com/ManugaHewa/Exercise-Prescription-App_CAPSTONE/tree/main/Exercise-Prescription-App-Front-End-main",
        },
        {
          label: "Backend",
          url: "https://github.com/ManugaHewa/Exercise-Prescription-App_CAPSTONE/tree/main/Exercise-Prescription-App-Back-End-main",
        },
      ],
      problem:
        "Patients need consistent reminders and an easy way to follow prescribed exercises; therapists need a simple workflow to review progress and video submissions.",
      scope: [
        "Video features: upload, title, record in-app, delete.",
        "User accounts: registration, login, change password.",
        "Notifications: reminders + editable schedule (and exploration of location-based reminders).",
        "Progress tracking: progress bar + checkboxes.",
        "Accessibility: subtitles for hearing impairment + multi-language audio/subtitles.",
        "UX modes: child-friendly UI option.",
        "Cross-platform: iOS + Android compatibility and testing.",
      ],
      deliveryProcess: [
        "Sprint planning + story point estimation (Fibonacci poker) with team consensus.",
        "Clear Definition of Done (auth + video + notifications + subtitles + cross-platform).",
        "Sprint 1: foundation (auth + core video features).",
        "Sprint 2: experience upgrades (notifications, progress, child-friendly UI, localization).",
      ],
      risksHandled: [
        "Large file upload + retries/network errors considered during estimation.",
        "Cross-device camera API + permissions complexity treated as high-effort story.",
        "Notification scheduling/editing complexity accounted for in planning.",
        "Localization + subtitle sync recognized as non-trivial work.",
      ],

      shots: [
        { src: u("physiotherapy, rehabilitation, clinic", 1), label: "Physiotherapy context" },
        { src: u("mobile app, smartphone, user interface", 2), label: "Mobile experience" },
        { src: u("video recording, camera, phone", 3), label: "Record / upload video" },
        { src: u("notification, reminder, alarm", 4), label: "Reminders / notifications" },
        { src: u("progress, checklist, habits", 5), label: "Progress tracking" },
        { src: u("accessibility, subtitles, hearing", 6), label: "Accessibility / subtitles" },
      ],
    },

    alice: {
      title: "Alice in Brussels",
      subtitle: "Interactive exhibition site focused on performance and accessibility.",
      pills: ["HTML5", "CSS3", "JavaScript", "Bootstrap", "A11y"],
      links: [],
      bullets: [
        "Immersive multimedia experience with smooth 60fps interactions",
        "Interactive overlay system for exploration-driven navigation",
        "WCAG-aligned accessibility patterns and keyboard navigation",
        "Optimized delivery with responsive images and lazy loading",
      ],
      shots: [
        { src: u("museum, exhibition, gallery", 1), label: "Exhibition" },
        { src: u("art installation, lights", 2), label: "Atmosphere" },
        { src: u("city, brussels, europe", 3), label: "Brussels" },
      ],
    },
  };

  const section = (title, innerHtml) => {
    if (!innerHtml) return "";
    return `
      <div class="modal-section">
        <div class="modal-section-title">${esc(title)}</div>
        ${innerHtml}
      </div>
    `;
  };

  const list = (items) => {
    if (!items?.length) return "";
    return `<ul style="margin:10px 0 0; padding-left:20px; color:var(--muted); line-height:1.8;">
      ${items.map((x) => `<li style="margin-bottom:10px;">${esc(x)}</li>`).join("")}
    </ul>`;
  };

  const renderLinks = (links) => {
    if (!links?.length) return "";
    return `
      <p style="margin:0;">
        ${links
          .map(
            (l) =>
              `<a class="link" href="${esc(l.url)}" target="_blank" rel="noreferrer">${esc(l.label)} →</a>`
          )
          .join(" &nbsp; ")}
      </p>
    `;
  };

  // Updated: shots render as clickable anchors (open in new tab)
  const renderShots = (shots) => {
    if (!shots?.length) return "";
    return `
      <div class="shots-grid">
        ${shots
          .map(
            (s) => `
            <a class="shot" href="${esc(s.src)}" target="_blank" rel="noreferrer" aria-label="Open image: ${esc(
              s.label
            )}">
              <img src="${esc(s.src)}" alt="${esc(s.label)}" loading="lazy" />
              <span class="shot-label">${esc(s.label)}</span>
            </a>
          `
          )
          .join("")}
      </div>
      <p class="muted" style="margin-top:10px;">
        Images are pulled from Unsplash by keyword for visual context (no local assets required).
      </p>
    `;
  };

  const openModal = (key, sourceEl) => {
    const p = PROJECTS[key];
    if (!p || !modal || !modalBody) return;

    lastActiveEl = sourceEl || document.activeElement;

    const pills = (p.pills || []).map((t) => `<span class="meta-pill">${esc(t)}</span>`).join("");

    const problem = p.problem
      ? `<p style="margin:0; color:var(--muted); line-height:1.65;">${esc(p.problem)}</p>`
      : "";

    modalBody.innerHTML = `
      <h3>${esc(p.title)}</h3>
      <p style="color:var(--muted2); font-size:14px; margin-bottom:14px;">${esc(p.subtitle)}</p>

      <div class="meta-row">${pills}</div>

      ${section("Links", renderLinks(p.links))}
      ${section("Problem", problem)}
      ${section("Stakeholders", list(p.stakeholders))}
      ${section("Scope", list(p.scope))}
      ${section("Requirements implemented", list(p.requirementsProof))}
      ${section("Non-functional requirements", list(p.nonFunctional))}
      ${section("Success criteria", list(p.successCriteria))}
      ${section("Delivery process", list(p.deliveryProcess))}
      ${section("Risks handled", list(p.risksHandled))}
      ${section("Key highlights", list(p.bullets))}
      ${section("UI shots", renderShots(p.shots))}
    `;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    if (!prefersReduced) {
      animate({
        targets: ".modal-card",
        opacity: [0, 1],
        translateY: [12, 0],
        scale: [0.98, 1],
        duration: 420,
        easing: easings.outExpo,
      });
      animate({ targets: ".modal-backdrop", opacity: [0, 1], duration: 280, easing: "linear" });
    }

    removeTrap?.();
    const modalCard = $(".modal-card", modal);
    if (modalCard) removeTrap = trapFocus(modalCard);

    modalClose?.focus();
  };

  const closeModal = () => {
    if (!modal?.classList.contains("is-open")) return;

    const finish = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";

      removeTrap?.();
      removeTrap = null;

      if (lastActiveEl && typeof lastActiveEl.focus === "function") lastActiveEl.focus();
      lastActiveEl = null;
    };

    if (prefersReduced) return finish();

    animate({
      targets: ".modal-card",
      opacity: [1, 0],
      translateY: [0, 10],
      scale: [1, 0.985],
      duration: 220,
      easing: easings.inCubic,
      complete: finish,
    });
    animate({ targets: ".modal-backdrop", opacity: [1, 0], duration: 220, easing: "linear" });
  };

  $$(".project-card").forEach((card) => {
    const key = card.dataset.project;
    card.addEventListener("click", () => openModal(key, card));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(key, card);
      }
    });
  });

  modalClose?.addEventListener("click", closeModal);
  modalBackdrop?.addEventListener("click", closeModal);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  if (location.hash) setActiveNavByHash(location.hash);

  /* ============================================================
     Skills neural canvas (2D) — unchanged logic
  ============================================================ */
  const skillsCanvas = document.getElementById("skillsCanvas");
  if (skillsCanvas) {
    const container = skillsCanvas.parentElement;
    const ctx = skillsCanvas.getContext("2d");
    const Tau = Math.PI * 2;

    const labels = [
      "TypeScript", "React", "Node.js", "JavaScript", "REST APIs", "CI/CD", "Docker", "Prisma",
      "React Native", "Redux", "TailwindCSS", "HTML5", "CSS3", "Vite", "Build Tools", "Express",
      "WebSockets", "Microservices", "PostgreSQL", "MongoDB", "MySQL", "Kubernetes",
      "GitHub Actions", "GCP", "AWS", "Azure", "Jest", "RTL", "Python"
    ];

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const radius = 0.56;
    const basePoints = labels.map((label, i) => {
      const y = 1 - (i / (labels.length - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      return { label, x: x * radius, y: y * radius, z: z * radius };
    });

    const nodes = basePoints;

    const buildLinks = () => {
      const total = basePoints.length;
      const indices = Array.from({ length: total }, (_, i) => i);
      indices.sort(() => Math.random() - 0.5);

      const activeCount = Math.max(3, Math.ceil(total * 0.7));
      const active = new Set(indices.slice(0, activeCount));

      const linksSet = new Set();
      const degrees = Array(total).fill(0);
      const add = (a, b) => {
        if (a === b) return false;
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (linksSet.has(key)) return false;
        linksSet.add(key);
        degrees[a] += 1;
        degrees[b] += 1;
        return true;
      };

      const activeArr = Array.from(active);
      const edges = [];
      for (let i = 0; i < activeArr.length; i++) {
        for (let j = i + 1; j < activeArr.length; j++) {
          const ai = activeArr[i];
          const aj = activeArr[j];
          const p = basePoints[ai];
          const q = basePoints[aj];
          const d = Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
          edges.push({ i: ai, j: aj, d });
        }
      }
      edges.sort((a, b) => a.d - b.d);

      edges.forEach(({ i, j }) => {
        if (degrees[i] < 5 && degrees[j] < 5) add(i, j);
      });

      const edgeMap = edges.reduce((m, e) => {
        (m[e.i] ||= []).push(e);
        (m[e.j] ||= []).push(e);
        return m;
      }, {});

      activeArr.forEach((idx) => {
        if (degrees[idx] >= 4) return;
        const sorted = (edgeMap[idx] || []).sort((a, b) => a.d - b.d);
        for (const e of sorted) {
          if (degrees[idx] >= 4) break;
          const other = e.i === idx ? e.j : e.i;
          if (degrees[other] >= 5) continue;
          add(idx, other);
        }
      });

      indices.forEach((idx) => {
        if (active.has(idx)) return;
        const candidates = activeArr
          .map((j) => {
            const p = basePoints[idx];
            const q = basePoints[j];
            return { j, d: Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) };
          })
          .sort((a, b) => a.d - b.d)
          .slice(0, 2);
        candidates.forEach(({ j }) => add(idx, j));
      });

      return Array.from(linksSet).map((k) => k.split("-").map(Number));
    };

    const links = buildLinks();

    let w = 0;
    let h = 0;
    let pointer = { x: null, y: null };
    const zOffsets = nodes.map(() => (Math.random() - 0.5) * 0.25);
    const zBias = 1.6;
    const focal = 1.25;
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const lineGradient = (x1, y1, x2, y2) => {
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, "rgba(78,242,255,0.6)");
      g.addColorStop(1, "rgba(255,79,216,0.6)");
      return g;
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      w = skillsCanvas.width = Math.max(280, rect.width);
      h = skillsCanvas.height = Math.max(260, rect.height);
      ctx.font = "12px 'Segoe UI', system-ui, sans-serif";
    };

    const draw = (t = 0) => {
      const time = prefersReduced ? 0 : t;
      const scale = 1.02;
      const rotX = time * 0.00025;
      const rotY = time * 0.00035;
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      const positions = nodes.map((n, i) => {
        let x = n.x * scale;
        let y = (n.y + 0.03) * scale;
        let z = (n.z + zOffsets[i] * 0.045) * scale;

        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;
        const y1 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX;

        const perspective = focal / (z2 + zBias);
        const px = clamp((x1 * perspective + 0.5) * w, 54, w - 54);
        const py = clamp((y1 * perspective + 0.5) * h, 46, h - 46);
        return { label: n.label, x: px, y: py, scale: perspective };
      });

      let hoverIndex = null;
      if (pointer.x !== null && pointer.y !== null) {
        let min = 9999;
        positions.forEach((p, idx) => {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < min && d < 32) {
            min = d;
            hoverIndex = idx;
          }
        });
      }

      ctx.clearRect(0, 0, w, h);

      ctx.lineWidth = 2.4;
      links.forEach(([a, b], i) => {
        const n1 = positions[a];
        const n2 = positions[b];
        const x1 = n1.x;
        const y1 = n1.y;
        const x2 = n2.x;
        const y2 = n2.y;

        ctx.strokeStyle = lineGradient(x1, y1, x2, y2);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        if (!prefersReduced) {
          const phase = (time * 0.003 + i * 0.22) % 2;
          const pVal = phase <= 1 ? phase : 2 - phase;
          const px = x1 + (x2 - x1) * pVal;
          const py = y1 + (y2 - y1) * pVal;
          const pulseSize = 4;
          const pulseGrad = ctx.createRadialGradient(px, py, 0, px, py, 26);
          pulseGrad.addColorStop(0, "rgba(255,255,255,1)");
          pulseGrad.addColorStop(0.2, "rgba(200,255,255,1)");
          pulseGrad.addColorStop(0.5, "rgba(140,240,255,1)");
          pulseGrad.addColorStop(1, "rgba(78,242,255,0)");
          ctx.fillStyle = pulseGrad;
          ctx.beginPath();
          ctx.arc(px, py, pulseSize, 0, Tau);
          ctx.fill();
        }
      });

      positions.forEach((p, idx) => {
        const hovered = idx === hoverIndex;
        const text = nodes[idx].label;

        const scaleFont = Math.max(0.95, Math.min(1.4, p.scale * 1.6));
        const baseFont = hovered ? 13.5 : 12.5;
        const fontPx = (baseFont * scaleFont).toFixed(1);

        ctx.font = `600 ${fontPx}px 'Segoe UI', system-ui, sans-serif`;
        const textWidth = ctx.measureText(text).width;

        const paddingX = hovered ? 15 : 13;
        const wRect = textWidth + paddingX * 2;
        const hRect = hovered ? 24 : 22;
        const radius = hovered ? 15 : 13;

        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, hovered ? 50 : 36);
        glow.addColorStop(0, hovered ? "rgba(78,242,255,0.38)" : "rgba(78,242,255,0.24)");
        glow.addColorStop(1, "rgba(255,79,216,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, hovered ? 34 : 30, 0, Tau);
        ctx.fill();

        const bubble = ctx.createLinearGradient(
          p.x - wRect / 2,
          p.y - hRect / 2,
          p.x + wRect / 2,
          p.y + hRect / 2
        );
        bubble.addColorStop(0, "rgba(12,14,20,0.95)");
        bubble.addColorStop(1, "rgba(24,26,38,0.92)");
        ctx.fillStyle = bubble;
        ctx.strokeStyle = hovered ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.14)";
        ctx.lineWidth = hovered ? 1.8 : 1.3;

        ctx.beginPath();
        ctx.roundRect(p.x - wRect / 2, p.y - hRect / 2, wRect, hRect, radius);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = hovered ? "#ffffff" : "#e8f1ff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, p.x, p.y + 1);
      });

      if (!prefersReduced) requestAnimationFrame(draw);
    };

    resize();
    draw(0);
    if (!prefersReduced) requestAnimationFrame(draw);

    window.addEventListener("resize", () => {
      resize();
      draw(0);
    });

    container.addEventListener("mousemove", (e) => {
      const rect = skillsCanvas.getBoundingClientRect();
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    });

    container.addEventListener("mouseleave", () => {
      pointer = { x: null, y: null };
    });
  }
})();
