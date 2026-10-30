// Loads posts.json, draws the Writing list with tag filters on the home page,
// and renders a single post on post.html?p=<slug>.

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

  function loadPosts() {
    return fetch("posts.json", { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("posts.json returned " + r.status);
      return r.json();
    });
  }

  function sortPosts(posts) {
    // Published first, newest first. Upcoming after, soonest first.
    var pub = posts.filter(function (p) { return p.status === "published"; });
    var up = posts.filter(function (p) { return p.status === "upcoming"; });
    pub.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    up.sort(function (a, b) { return a.date > b.date ? 1 : -1; });
    return pub.concat(up);
  }

  function tagChips(tags) {
    var wrap = el("div", { class: "post-tags" });
    (tags || []).forEach(function (t) { wrap.appendChild(el("span", { class: "tag" }, t)); });
    return wrap;
  }

  function postItem(p) {
    var li = el("li", { class: "post" + (p.status === "upcoming" ? " upcoming" : "") });
    li.dataset.tags = (p.tags || []).join("|");
    var published = p.status === "published";
    var link = el(published ? "a" : "div", { class: "post-link" });
    if (published) link.href = "post.html?p=" + encodeURIComponent(p.slug);
    link.appendChild(el("span", { class: "post-date" }, published ? formatDate(p.date) : "Coming soon"));
    var body = el("div");
    body.appendChild(el("h3", { class: "post-title" }, p.title));
    if (p.summary) body.appendChild(el("p", { class: "post-sum" }, p.summary));
    body.appendChild(tagChips(p.tags));
    link.appendChild(body);
    li.appendChild(link);
    return li;
  }

  function renderIndex() {
    var list = document.getElementById("posts");
    var filters = document.getElementById("filters");
    if (!list) return;

    loadPosts().then(function (posts) {
      posts = sortPosts(posts.filter(function (p) { return p.status !== "draft"; }));
      list.innerHTML = "";
      if (!posts.length) {
        list.appendChild(el("li")).appendChild(el("p", { class: "empty" }, "No posts yet. The first one is on its way."));
        return;
      }
      posts.forEach(function (p) { list.appendChild(postItem(p)); });

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

      if (filters && tags.length > 1) {
        addButton("All", "");
        tags.forEach(function (t) { addButton(t, t); });
        apply();
      }
    }).catch(function () {
      list.innerHTML = "";
      list.appendChild(el("li")).appendChild(el("p", { class: "empty" }, "Posts could not load. Refresh the page to try again."));
    });
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

    loadPosts().then(function (posts) {
      var p = posts.filter(function (x) { return x.slug === slug && x.status === "published"; })[0];
      if (!p) return fail("There is no published post at this address. Go back to the writing list to pick one.");
      document.title = p.title + " | Ednah Akoth";
      title.textContent = p.title;
      meta.innerHTML = "";
      meta.appendChild(el("span", null, formatDate(p.date)));
      meta.appendChild(tagChips(p.tags));
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

  renderIndex();
  renderPost();
})();
