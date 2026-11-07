// GitHub Pages の一覧を描く
// 1. sites.json（手で書いた題名・説明・カテゴリ・サムネイル）をすぐに表示する
// 2. GitHub API で Pages が有効な公開リポジトリを取得し、sites.json にないものを追加する
//    API が使えない（回数制限など）ときは sites.json の内容だけで表示する
(function () {
  var USER = "msk-1";
  var SELF = USER + ".github.io";
  var grid = document.getElementById("site-grid");
  var filterList = document.getElementById("filters");
  var current = "all";

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function pagesUrl(name) { return "https://" + USER + ".github.io/" + name + "/"; }

  function renderGrid(sites) {
    grid.textContent = "";
    sites.forEach(function (s) {
      var a = el("a", "tile");
      a.href = s.url;
      a.setAttribute("data-category", s.category);
      // サムネイルは毎日の自動撮影で thumbs/<repo>.jpg にできる。まだなければ文字のカードにする
      var img = el("img");
      img.src = s.thumb;
      img.alt = s.title;
      img.loading = "lazy";
      img.addEventListener("error", function () { img.replaceWith(el("div", "tile-type", s.repo)); });
      a.appendChild(img);
      var info = el("div", "tile-info");
      info.appendChild(el("p", "tile-title", s.title));
      info.appendChild(el("p", "tile-meta", [s.category].concat(s.tags || []).join(" / ")));
      a.appendChild(info);
      grid.appendChild(a);
    });
    applyFilter();
  }

  function renderFilters(sites) {
    var counts = { all: sites.length };
    var order = [];
    sites.forEach(function (s) {
      if (!(s.category in counts)) { counts[s.category] = 0; order.push(s.category); }
      counts[s.category] += 1;
    });
    filterList.textContent = "";
    ["all"].concat(order).forEach(function (key) {
      var li = el("li");
      var b = el("button", null, key === "all" ? "All" : key);
      b.type = "button";
      b.setAttribute("data-filter", key);
      b.setAttribute("aria-pressed", key === current ? "true" : "false");
      b.appendChild(el("span", "num", String(counts[key])));
      b.addEventListener("click", function () { current = key; renderFiltersState(); applyFilter(); });
      li.appendChild(b);
      filterList.appendChild(li);
    });
  }
  function renderFiltersState() {
    Array.prototype.forEach.call(filterList.querySelectorAll("button"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-filter") === current ? "true" : "false");
    });
  }
  function applyFilter() {
    Array.prototype.forEach.call(grid.children, function (t) {
      t.hidden = !(current === "all" || t.getAttribute("data-category") === current);
    });
  }
  function render(sites) { renderFilters(sites); renderGrid(sites); }

  fetch("sites.json", { cache: "no-cache" })
    .then(function (r) { return r.ok ? r.json() : []; })
    .catch(function () { return []; })
    .then(function (curated) {
      var sites = curated.map(function (c) {
        return {
          repo: c.repo,
          title: c.title || c.repo,
          description: c.description,
          category: c.category || "Other",
          tags: c.tags || [],
          thumb: c.thumb || "thumbs/" + c.repo + ".jpg",
          url: c.url || pagesUrl(c.repo)
        };
      });
      render(sites);

      return fetch("https://api.github.com/users/" + USER + "/repos?per_page=100&type=owner&sort=pushed")
        .then(function (r) { if (!r.ok) throw new Error("GitHub API " + r.status); return r.json(); })
        .then(function (repos) {
          var known = {};
          sites.forEach(function (s) { known[s.repo] = s; });
          var added = false;
          repos.forEach(function (r) {
            if (!r.has_pages || r.fork || r.private || r.name === SELF || known[r.name]) return;
            sites.push({
              repo: r.name,
              title: r.description || r.name,
              category: "Other",
              tags: [r.language].concat(r.topics || []).filter(Boolean),
              thumb: "thumbs/" + r.name + ".jpg",
              url: r.homepage || pagesUrl(r.name)
            });
            added = true;
          });
          if (added) render(sites);
        })
        .catch(function () { /* API が使えなくても sites.json の内容で表示済み */ });
    });
})();
