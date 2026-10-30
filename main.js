// Site behaviour:
// theme toggle, home page tabs, publications (publications.json), questions (questions.json),
// the writing list with tag filters (posts.json), and single posts on post.html?p=<slug>.

(function () {
  "use strict";

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function formatDate(iso) {
    var p = String(iso).split("-");
    if (p.length < 3) return iso;
    return Number(p[2]) + " " + MONTHS[Number(p[1]) - 1] + " " + p[0];
  }

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }

  function getJSON(path) {
    return fetch(path, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(path + " returned " + r.status);
      return r.json();
    });
  }

  function emptyItem(list, text) {
    list.innerHTML = "";
    list.appendChild(el("li")).appendChild(el("p", { class: "empty" }, text));
  }

  /* Theme toggle */

  function setupTheme() {
    var root = document.documentElement;
    var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    function current() { return root.dataset.theme || (media && media.matches ? "dark" : "light"); }
    function label() {
      document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
        b.setAttribute("aria-label", current() === "dark" ? "Switch to light mode" : "Switch to dark mode");
      });
    }
    document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
      b.addEventListener("click", function () {
        var next = current() === "dark" ? "light" : "dark";
        root.dataset.theme = next;
        try { localStorage.setItem("theme", next); } catch (e) {}
        label();
      });
    });
    if (media && media.addEventListener) media.addEventListener("change", label);
    label();
  }


  /* Tabs on the home page. The address bar hash picks the tab, so links like #pub-no-one-is-counting work. */

  function setupTabs() {
    var panels = document.querySelectorAll("[data-panel]");
    if (!panels.length) return;
    var links = document.querySelectorAll("[data-tab]");
    var names = Array.prototype.map.call(panels, function (p) { return p.dataset.panel; });

    function tabFor(hash) {
      var id = (hash || "").replace(/^#/, "");
      if (!id) return "about";
      if (names.indexOf(id) !== -1) return id;
      var target = document.getElementById(id);
      var panel = target && target.closest("[data-panel]");
      if (panel) return panel.dataset.panel;
      if (/^pub-/.test(id)) return "publications";
      if (id === "education") return "experience";
      return "about";
    }

    function show(fromUser) {
      var name = tabFor(location.hash);
      panels.forEach(function (p) { p.hidden = p.dataset.panel !== name; });
      links.forEach(function (a) {
        if (a.dataset.tab === name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
      });
      var active = document.querySelector('[data-tab="' + name + '"]');
      if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest", inline: "nearest" });
      var id = location.hash.replace(/^#/, "");
      var target = id && names.indexOf(id) === -1 ? document.getElementById(id) : null;
      if (target) target.scrollIntoView({ block: "start" });
      else if (fromUser) {
        var tabsBar = document.querySelector(".tabs");
        if (tabsBar && tabsBar.getBoundingClientRect().top < 0) tabsBar.scrollIntoView({ block: "start" });
      }
    }

    window.addEventListener("hashchange", function () { show(true); });
    show(false);
    return show;
  }

  var refreshTab = function () {};

  /* Papers and their sections. A section link opens the paper, at the right page when the link is a PDF. */

  function sectionLink(paper, section) {
    var url = paper.url || "";
    if (/\.pdf($|\?)/i.test(url) && section.page) url = url.split("#")[0] + "#page=" + section.page;
    return url;
  }

  function sectionLabel(section) {
    return section.title + (section.page ? ", page " + section.page : "");
  }

  var ICON = {
    doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
    sec: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h7"/></svg>',
    people: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/></svg>'
  };

  function iconLink(href, icon, text) {
    var a = el("a", { href: href });
    a.innerHTML = ICON[icon];
    a.appendChild(document.createTextNode(text));
    return a;
  }

  function renderPublications() {
    var list = document.getElementById("pubs");
    if (!list) return;
    var count = document.getElementById("pub-count");
    getJSON("publications.json").then(function (pubs) {
      list.innerHTML = "";
      if (count) count.textContent = pubs.length ? String(pubs.length) : "";
      if (!pubs.length) return emptyItem(list, "Papers will appear here as they are released.");
      pubs.forEach(function (p) {
        var li = el("li", { class: "card", id: "pub-" + p.id });
        var kind = el("p", { class: "card-kind" }, p.venue || "Paper");
        if (p.year) kind.appendChild(el("span", { class: "card-when" }, p.year));
        if (p.status) kind.appendChild(el("span", { class: "status" }, p.status));
        li.appendChild(kind);

        var title = el("h3", { class: "card-title" });
        if (p.url) title.appendChild(el("a", { href: p.url }, p.title)); else title.textContent = p.title;
        li.appendChild(title);

        if (p.authors) {
          var a = el("p", { class: "card-meta" });
          a.innerHTML = ICON.people;
          var names = el("span");
          p.authors.split(/,\s*/).forEach(function (name, i, all) {
            names.appendChild(el(/Akoth/.test(name) ? "strong" : "span", null, name));
            if (i < all.length - 1) names.appendChild(document.createTextNode(", "));
          });
          a.appendChild(names);
          li.appendChild(a);
        }
        if (p.summary) li.appendChild(el("p", { class: "card-text" }, p.summary));

        var links = el("ul", { class: "actions" });
        if (p.url) links.appendChild(el("li")).appendChild(iconLink(p.url, "doc", "Read the paper"));
        (p.sections || []).forEach(function (s) {
          var item = el("li", { id: "pub-" + p.id + "-" + s.id });
          item.appendChild(iconLink(sectionLink(p, s), "sec", "Section: " + sectionLabel(s)));
          links.appendChild(item);
        });
        li.appendChild(links);
        list.appendChild(li);
      });
      refreshTab(false);
    }).catch(function () {
      emptyItem(list, "Publications could not load. Refresh the page to try again.");
    });
  }

  /* Questions */

  function renderQuestions() {
    var box = document.getElementById("question-list");
    if (!box) return;
    getJSON("questions.json").then(function (groups) {
      box.innerHTML = "";
      groups.forEach(function (g) {
        var div = el("div", { class: "q-group" });
        div.appendChild(el("h3", null, g.theme));
        var ul = el("ul");
        (g.questions || []).forEach(function (q) { ul.appendChild(el("li", null, q)); });
        div.appendChild(ul);
        box.appendChild(div);
      });
    }).catch(function () {
      box.innerHTML = "";
      box.appendChild(el("p", { class: "empty" }, "Questions could not load. Refresh the page to try again."));
    });
  }

  /* Writing list. Only posts with "status": "published" are shown. */

  function tagChips(tags) {
    var wrap = el("div", { class: "post-tags tags" });
    (tags || []).forEach(function (t) { wrap.appendChild(el("span", { class: "tag" }, t)); });
    return wrap;
  }

  function renderIndex() {
    var list = document.getElementById("posts");
    var filters = document.getElementById("filters");
    var search = document.getElementById("post-search");
    var count = document.getElementById("post-count");
    var latest = document.getElementById("latest-post");
    if (!list) return;

    getJSON("posts.json").then(function (posts) {
      posts = posts.filter(function (p) { return p.status === "published"; });
      posts.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      list.innerHTML = "";
      if (count) count.textContent = posts.length ? String(posts.length) : "";
      if (latest) latest.textContent = posts.length ? posts[0].title.split(":")[0] : "The first post is on its way";
      if (!posts.length) {
        if (search) search.closest(".search").hidden = true;
        return emptyItem(list, "The first post is on its way.");
      }

      posts.forEach(function (p) {
        var li = el("li", { class: "card" });
        li.dataset.tags = (p.tags || []).join("|");
        li.dataset.title = (p.title + " " + (p.summary || "")).toLowerCase();
        var link = el("a", { class: "card-link", href: "post.html?p=" + encodeURIComponent(p.slug) });
        var kind = el("p", { class: "card-kind" }, "Essay");
        kind.appendChild(el("span", { class: "card-when" }, formatDate(p.date)));
        link.appendChild(kind);
        link.appendChild(el("h3", { class: "card-title" }, p.title));
        if (p.summary) link.appendChild(el("p", { class: "card-text" }, p.summary));
        link.appendChild(tagChips(p.tags));
        li.appendChild(link);
        list.appendChild(li);
      });
      var none = el("li", { class: "no-match" });
      none.appendChild(el("p", { class: "empty" }, "No posts match that search."));
      none.hidden = true;
      list.appendChild(none);

      var counts = {};
      posts.forEach(function (p) { (p.tags || []).forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
      var tags = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); });
      var active = null;

      function apply() {
        var q = search ? search.value.trim().toLowerCase() : "";
        Array.prototype.forEach.call(filters.querySelectorAll("button"), function (b) {
          b.setAttribute("aria-pressed", String(b.dataset.tag === (active || "")));
        });
        var shown = 0;
        Array.prototype.forEach.call(list.querySelectorAll("li.card"), function (li) {
          var t = (li.dataset.tags || "").split("|");
          var ok = (active === null || t.indexOf(active) !== -1) && (!q || li.dataset.title.indexOf(q) !== -1);
          li.hidden = !ok;
          if (ok) shown++;
        });
        none.hidden = shown > 0;
      }

      function addButton(label, value) {
        var li = el("li");
        var b = el("button", { class: "tag", type: "button", "aria-pressed": "false" }, label);
        b.dataset.tag = value;
        b.addEventListener("click", function () { active = value === "" || active === value ? null : value; apply(); });
        li.appendChild(b);
        filters.appendChild(li);
      }

      if (filters && posts.length > 1 && tags.length > 1) {
        addButton("All", "");
        tags.forEach(function (t) { addButton(t, t); });
      }
      if (search) search.addEventListener("input", apply);
      apply();
    }).catch(function () {
      if (latest) latest.textContent = "Essays on AI safety and policy";
      emptyItem(list, "Posts could not load. Refresh the page to try again.");
    });
  }

  /* Single post */

  function renderRelated(post, pubs, mount) {
    var refs = post.related || [];
    if (!refs.length) return;
    var items = [];
    refs.forEach(function (r) {
      var paper = pubs.filter(function (x) { return x.id === r.paper; })[0];
      if (!paper) return;
      var sec = (paper.sections || []).filter(function (s) { return s.id === r.section; })[0];
      items.push({
        href: sec ? sectionLink(paper, sec) : paper.url,
        text: sec ? sectionLabel(sec) : paper.title,
        from: sec ? paper.title : null
      });
    });
    if (!items.length) return;
    var box = el("aside", { class: "related" });
    box.appendChild(el("p", null, "This post draws on my paper"));
    var ul = el("ul");
    items.forEach(function (i) {
      var li = el("li");
      li.appendChild(el("a", { href: i.href }, i.text));
      if (i.from) li.appendChild(document.createTextNode(" in " + i.from));
      ul.appendChild(li);
    });
    box.appendChild(ul);
    mount.parentNode.insertBefore(box, mount);
  }

  function renderPost() {
    var root = document.getElementById("article");
    if (!root) return;
    var slug = new URLSearchParams(location.search).get("p");
    var title = document.getElementById("article-title");
    var meta = document.getElementById("article-meta");
    var body = document.getElementById("article-body");

    function fail(msg) {
      title.textContent = "Post not found";
      body.innerHTML = "";
      body.appendChild(el("p", null, msg));
    }

    if (!slug) return fail("This link is missing a post name. Go back to the writing list to pick one.");

    Promise.all([getJSON("posts.json"), getJSON("publications.json").catch(function () { return []; })]).then(function (res) {
      var p = res[0].filter(function (x) { return x.slug === slug && x.status === "published"; })[0];
      if (!p) return fail("There is no published post at this address. Go back to the writing list to pick one.");
      document.title = p.title + " | Ednah Akoth";
      title.textContent = p.title;
      meta.innerHTML = "";
      meta.appendChild(el("span", null, formatDate(p.date)));
      meta.appendChild(tagChips(p.tags));
      renderRelated(p, res[1], body);
      return fetch("posts/" + encodeURIComponent(slug) + ".md", { cache: "no-cache" }).then(function (r) {
        if (!r.ok) throw new Error("missing");
        return r.text();
      }).then(function (md) {
        var html = window.marked ? window.marked.parse(md) : md;
        body.innerHTML = window.DOMPurify ? window.DOMPurify.sanitize(html) : html;
      });
    }).catch(function () {
      fail("The post text could not load. Refresh the page to try again.");
    });
  }

  setupTheme();
  refreshTab = setupTabs() || refreshTab;
  renderPublications();
  renderQuestions();
  renderIndex();
  renderPost();
})();
