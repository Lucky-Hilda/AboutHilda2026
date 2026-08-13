(function () {
  "use strict";

  const C = window.SITE_CONTENT;
  if (!C) {
    console.error("缺少 data/content.js 中的 SITE_CONTENT");
    return;
  }

  document.title = C.meta.title;
  const metaDesc = document.getElementById("meta-desc");
  if (metaDesc) metaDesc.setAttribute("content", C.meta.description);

  const B = C.branding || {};
  var logoEl = document.getElementById("brand-logo");
  if (logoEl && B.logo) logoEl.textContent = B.logo;

  /* ---------- Landing ---------- */
  document.getElementById("landing-sub").textContent = C.home.subline || "";
  const cta = document.getElementById("landing-cta");
  (C.home.cta || []).forEach(function (item) {
    const a = document.createElement("a");
    a.href = item.href;
    a.textContent = item.label;
    cta.appendChild(a);
  });

  /* ---------- About ---------- */
  document.getElementById("about-title").textContent = C.about.title;
  var aboutName = document.getElementById("about-name");
  if (aboutName) {
    aboutName.textContent = B.logo || "";
    if (!aboutName.textContent.trim()) aboutName.style.display = "none";
  }
  document.getElementById("about-intro").textContent = C.about.intro;
  document.getElementById("about-why").textContent = C.about.why;

  var aboutEdu = document.getElementById("about-edu");
  if (aboutEdu && C.about.education && C.about.education.length) {
    aboutEdu.innerHTML = C.about.education
      .map(function (e) {
        return (
          '<div class="edu-item">' +
          '<div class="edu-period">' +
          escapeHtml(e.period || "") +
          "</div>" +
          "<strong>" +
          escapeHtml(e.school || "") +
          "</strong>" +
          '<div class="edu-detail">' +
          escapeHtml(e.detail || "") +
          "</div>" +
          (e.note ? '<div class="edu-note">' + escapeHtml(e.note) + "</div>" : "") +
          "</div>"
        );
      })
      .join("");
  } else if (aboutEdu) {
    aboutEdu.style.display = "none";
  }

  /* ---------- 项目时间线 ---------- */
  const timeline = document.getElementById("timeline");
  (C.projects || []).forEach(function (p, idx) {
    const card = document.createElement("article");
    card.className = "timeline-item project-card";
    card.style.animationDelay = idx * 0.08 + "s";

    const header = document.createElement("div");
    header.className = "project-card-header";
    header.innerHTML =
      (p.kind ? '<span class="project-kind">' + escapeHtml(p.kind) + "</span>" : "") +
      '<span class="project-time">' +
      escapeHtml(p.time) +
      "</span>" +
      "<h3 class=\"project-card-title\">" +
      escapeHtml(p.title) +
      "</h3>" +
      '<p class="project-role">' +
      escapeHtml(p.role) +
      "</p>";
    card.appendChild(header);

    const body = document.createElement("div");
    body.className = "project-body";

    const summary = document.createElement("p");
    summary.className = "project-summary";
    summary.textContent = p.summary || "";
    body.appendChild(summary);

    if (p.media && p.media.type) {
      body.appendChild(buildMedia(p.media));
    }
    if (p.links && p.links.length) {
      body.appendChild(buildLinkBar(p.links));
    }

    const bg = document.createElement("div");
    bg.className = "project-section";
    bg.innerHTML = "<h4>背景</h4><p>" + escapeHtml(p.background || "") + "</p>";
    body.appendChild(bg);

    const did = document.createElement("div");
    did.className = "project-section";
    did.innerHTML = "<h4>主要工作</h4><ul>" + (p.did || []).map(function (x) { return "<li>" + escapeHtml(x) + "</li>"; }).join("") + "</ul>";
    body.appendChild(did);

    const exp = p.expand || {};
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "project-toggle";
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "查看项目复盘 ▼";

    const wrap = document.createElement("div");
    wrap.className = "project-expand";
    const inner = document.createElement("div");
    inner.className = "project-expand-inner";
    inner.innerHTML =
      '<div class="expand-blocks">' +
      blockHtml("项目判断", exp.thinking) +
      blockHtml("关键难点", exp.problems) +
      blockHtml("后续优化", exp.iteration) +
      "</div>";
    wrap.appendChild(inner);

    toggle.addEventListener("click", function () {
      const open = !wrap.classList.contains("is-open");
      wrap.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open);
      toggle.textContent = open ? "收起项目复盘 ▲" : "查看项目复盘 ▼";
    });

    body.appendChild(toggle);
    body.appendChild(wrap);
    card.appendChild(body);
    timeline.appendChild(card);
  });

  function blockHtml(title, text) {
    if (!text) return "";
    return (
      '<div class="expand-block"><h5>' +
      escapeHtml(title) +
      "</h5><p>" +
      escapeHtml(text) +
      "</p></div>"
    );
  }

  function buildMedia(m) {
    const wrap = document.createElement("div");
    wrap.className = "project-media";
    if (!m || !m.type) {
      wrap.innerHTML = '<div class="media-placeholder">暂无演示媒体 — 在 content.js 的 project.media 中配置</div>';
      return wrap;
    }
    if (m.type === "video") {
      const v = document.createElement("video");
      v.controls = true;
      v.playsInline = true;
      v.preload = "metadata";
      if (m.poster) v.poster = m.poster;
      const source = document.createElement("source");
      source.src = m.src;
      source.type = "video/mp4";
      v.appendChild(source);
      v.addEventListener("error", function () {
        wrap.replaceChildren();
        wrap.appendChild(placeholder("视频文件未找到或格式不支持，请将文件放到路径：" + m.src));
      });
      wrap.appendChild(v);
    } else if (m.type === "bilibili") {
      var bvid = m.bvid || "";
      if (!bvid && m.src) {
        var match = String(m.src).match(/BV[\w]+/i);
        if (match) bvid = match[0];
      }
      if (!bvid) {
        wrap.appendChild(placeholder("未配置有效的 Bilibili BV 号"));
      } else {
        var ratio = document.createElement("div");
        ratio.className = "project-bilibili-wrap";
        var iframe = document.createElement("iframe");
        iframe.className = "project-bilibili-iframe";
        iframe.title = m.caption || "Bilibili 演示";
        iframe.loading = "lazy";
        iframe.setAttribute(
          "src",
          "https://player.bilibili.com/player.html?bvid=" + encodeURIComponent(bvid) + "&page=1&high_quality=1&danmaku=0"
        );
        iframe.setAttribute("allowfullscreen", "true");
        iframe.setAttribute(
          "sandbox",
          "allow-scripts allow-same-origin allow-popups allow-presentation"
        );
        ratio.appendChild(iframe);
        wrap.appendChild(ratio);
      }
    } else if (m.type === "links") {
      wrap.appendChild(buildLinkBar(m.links || [], true));
    } else {
      const img = document.createElement("img");
      img.src = m.src;
      img.alt = m.caption || "项目配图";
      img.loading = "lazy";
      img.addEventListener("error", function () {
        wrap.replaceChildren();
        wrap.appendChild(placeholder("图片未找到：" + m.src));
      });
      wrap.appendChild(img);
    }
    if (m.caption) {
      const cap = document.createElement("p");
      cap.className = "media-caption";
      cap.textContent = m.caption;
      wrap.appendChild(cap);
    }
    return wrap;
  }

  /** @param {boolean} [insideMedia] 是否在 project-media 内（避免重复外边距） */
  function buildLinkBar(links, insideMedia) {
    const bar = document.createElement("div");
    bar.className = "project-link-buttons" + (insideMedia ? " project-link-buttons--flush" : "");
    (links || []).forEach(function (item) {
      if (!item || !item.href) return;
      const a = document.createElement("a");
      a.className = "btn-pixel project-outlink pixel-border-sm";
      a.href = item.href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = item.label || item.href;
      bar.appendChild(a);
    });
    if (!bar.children.length) {
      bar.appendChild(placeholder("暂无有效链接"));
    }
    return bar;
  }

  function placeholder(msg) {
    const d = document.createElement("div");
    d.className = "media-placeholder";
    d.textContent = msg;
    return d;
  }

  function escapeHtml(s) {
    if (!s) return "";
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  /* ---------- 能力概览 ---------- */
  document.getElementById("skills-title").textContent = C.skills.title;
  const skillMap = document.getElementById("skill-map");
  (C.skills.categories || []).forEach(function (cat) {
    const card = document.createElement("article");
    card.className = "skill-node";
    card.dataset.cat = cat.id;

    const head = document.createElement("h3");
    head.className = "skill-node-header";
    head.textContent = cat.name || "";
    card.appendChild(head);

    const body = document.createElement("div");
    body.className = "skill-node-body";
    body.innerHTML =
      "<ul>" +
      (cat.items || [])
        .map(function (item) {
          return "<li>" + escapeHtml(item) + "</li>";
        })
        .join("") +
      "</ul>";
    card.appendChild(body);
    skillMap.appendChild(card);
  });

  /* ---------- 本科项目与技术实践 ---------- */
  const earlyWorkGrid = document.getElementById("early-work-grid");
  (C.earlyProjects || []).forEach(function (p) {
    const card = document.createElement("article");
    card.className = "early-card" + (p.featured ? " early-card--featured" : "");

    const head = document.createElement("div");
    head.className = "early-card__head";
    head.innerHTML =
      '<span class="project-kind">' +
      escapeHtml(p.kind || "本科项目") +
      "</span>" +
      '<span class="early-card__time">' +
      escapeHtml(p.time || "") +
      "</span>";
    card.appendChild(head);

    const title = document.createElement("h3");
    title.className = "early-card__title";
    title.textContent = p.title || "";
    card.appendChild(title);

    const summary = document.createElement("p");
    summary.className = "early-card__summary";
    summary.textContent = p.summary || "";
    card.appendChild(summary);

    const tags = document.createElement("div");
    tags.className = "early-card__tags";
    (p.tags || []).forEach(function (tag) {
      const span = document.createElement("span");
      span.textContent = tag;
      tags.appendChild(span);
    });
    card.appendChild(tags);

    if (p.media && p.media.type === "bilibili" && p.media.bvid) {
      const link = document.createElement("a");
      link.className = "early-card__link";
      link.href = "https://www.bilibili.com/video/" + encodeURIComponent(p.media.bvid) + "/";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "查看演示 ↗";
      card.appendChild(link);
    }

    earlyWorkGrid.appendChild(card);
  });

  /* ---------- 联系 ---------- */
  const contact = C.contact;
  document.getElementById("contact-title").textContent = contact.title;
  document.getElementById("contact-note").textContent = contact.note || "";
  const emailLink = document.getElementById("email-link");
  emailLink.href = "mailto:" + contact.email;
  emailLink.textContent = contact.email;

  document.getElementById("copy-email").addEventListener("click", function () {
    const btn = this;
    const email = contact.email;
    function done() {
      btn.classList.add("is-done");
      var orig = btn.textContent;
      btn.textContent = btn.getAttribute("data-copied") || "已复制";
      window.setTimeout(function () {
        btn.classList.remove("is-done");
        btn.textContent = orig;
      }, 2000);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(done).catch(function () {
        fallbackCopy(email, done);
      });
    } else {
      fallbackCopy(email, done);
    }
  });

  function fallbackCopy(text, cb) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      cb();
    } catch (e) {
      alert("请手动复制：" + text);
    }
    document.body.removeChild(ta);
  }

  /* ---------- 导航 ---------- */
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.getElementById("site-nav");
  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      const open = !siteNav.classList.contains("is-open");
      siteNav.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", open);
    });
    siteNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        siteNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

})();
