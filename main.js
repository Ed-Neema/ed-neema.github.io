// Site behaviour:
// theme toggle, publications (publications.json), questions (questions.json),
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

  /* Papers and their sections. A section link opens the paper, at the right page when the link is a PDF. */

  function sectionLink(paper, section) {
    var url = paper.url || "";
    if (/\.pdf($|\?)/i.test(url) && section.page) url = url.split("#")[0] + "#page=" + section.page;
    return url;
  }

  function sectionLabel(section) {
    return section.title + (section.page ? ", page " + section.page : "");
  }

  function renderPublications() {
    var list = document.getElementById("pubs");
    if (!list) return;
    getJSON("publications.json").then(function (pubs) {
      list.innerHTML = "";
      if (!pubs.length) return emptyItem(list, "Papers will appear here as they are released.");
      pubs.forEach(function (p) {
        var li = el("li", { class: "pub", id: "pub-" + p.id });
        var head = el("div", { class: "pub-head" });
        if (p.status) head.appendChild(el("span", { class: "status" }, p.status));
        if (p.venue || p.year) head.appendChild(el("span", { class: "pub-year" }, [p.venue, p.year].filter(Boolean).join(", ")));
        li.appendChild(head);

        var title = el("h3", { class: "pub-title" });
        if (p.url) title.appendChild(el("a", { href: p.url }, p.title)); else title.textContent = p.title;
        li.appendChild(title);

        if (p.authors) {
          var a = el("p", { class: "pub-authors" });
          p.authors.split(/,\s*/).forEach(function (name, i, all) {
            var isMe = /Akoth/.test(name);
            a.appendChild(el(isMe ? "strong" : "span", null, name));
            if (i < all.length - 1) a.appendChild(document.createTextNode(", "));
          });
          li.appendChild(a);
        }
        if (p.summary) li.appendChild(el("p", { class: "pub-sum" }, p.summary));

        var links = el("ul", { class: "pub-links" });
        if (p.url) links.appendChild(el("li")).appendChild(el("a", { href: p.url }, "Read the paper"));
        (p.sections || []).forEach(function (s) {
          var item = el("li", { id: "pub-" + p.id + "-" + s.id });
          item.appendChild(el("span", { class: "sec" }, "Section: "));
          item.appendChild(el("a", { href: sectionLink(p, s) }, sectionLabel(s)));
          links.appendChild(item);
        });
        li.appendChild(links);
        list.appendChild(li);
      });
      if (location.hash && document.querySelector(location.hash)) document.querySelector(location.hash).scrollIntoView();
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
    var wrap = el("div", { class: "post-tags" });
    (tags || []).forEach(function (t) { wrap.appendChild(el("span", { class: "tag" }, t)); });
    return wrap;
  }

  function renderIndex() {
    var list = document.getElementById("posts");
    var filters = document.getElementById("filters");
    if (!list) return;

    getJSON("posts.json").then(function (posts) {
      posts = posts.filter(function (p) { return p.status === "published"; });
      posts.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      list.innerHTML = "";
      if (!posts.length) return emptyItem(list, "The first post is on its way.");

      posts.forEach(function (p) {
        var li = el("li", { class: "post" });
        li.dataset.tags = (p.tags || []).join("|");
        var link = el("a", { class: "post-link", href: "post.html?p=" + encodeURIComponent(p.slug) });
        link.appendChild(el("span", { class: "post-date" }, formatDate(p.date)));
        var body = el("div");
        body.appendChild(el("h3", { class: "post-title" }, p.title));
        if (p.summary) body.appendChild(el("p", { class: "post-sum" }, p.summary));
        body.appendChild(tagChips(p.tags));
        link.appendChild(body);
        li.appendChild(link);
        list.appendChild(li);
      });

      var counts = {};
      posts.forEach(function (p) { (p.tags || []).forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
      var tags = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); });
      var active = null;

      function apply() {
        Array.prototype.forEach.call(filters.querySelectorAll("button"), function (b) {
          b.setAttribute("aria-pressed", String(b.dataset.tag === (active || "")));
        });
        Array.prototype.forEach.call(list.children, function (li) {
          var t = (li.dataset.tags || "").split("|");
          li.hidden = active !== null && t.indexOf(active) === -1;
        });
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
        apply();
      }
    }).catch(function () {
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
  renderPublications();
  renderQuestions();
  renderIndex();
  renderPost();
})();
