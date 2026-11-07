// GitHub Pages の一覧を描く
// 1. sites.json（手で書いた題名・説明・タグ）をすぐに表示する
// 2. GitHub API で Pages が有効な公開リポジトリを取得し、sites.json にないものを追加し、更新日を埋める
//    API が使えない（回数制限など）ときは sites.json の内容だけで表示する
(function () {
  var USER = "msk-1";
  var SELF = USER + ".github.io";
  var grid = document.getElementById("site-grid");
  var count = document.querySelector(".count");
  var HUES = [0, 150, 60, 210, 300, 30, 260, 110];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function fmtDate(iso) {
    var d = new Date(iso);
    return d.getFullYear() + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + String(d.getDate()).padStart(2, "0");
  }

  function render(sites) {
    grid.textContent = "";
    sites.forEach(function (s, i) {
      var a = el("a", "card");
      a.href = s.url;
      var cover = el("div", "card-cover");
      var hue = s.hue != null ? s.hue : HUES[i % HUES.length];
      cover.style.setProperty("--hue", hue + "deg");
      cover.style.setProperty("--bx", [80, 20, 65, 35, 90, 50][i % 6] + "%");
      cover.style.setProperty("--by", [15, 5, 30, 10, 40, 0][i % 6] + "%");
      cover.style.setProperty("--cx", [30, 75, 10, 60, 40, 85][i % 6] + "%");
      cover.appendChild(el("span", "card-num", String(i + 1).padStart(2, "0")));
      a.appendChild(cover);
      a.appendChild(el("h3", "card-title", s.title));
      if (s.description) a.appendChild(el("p", "card-desc", s.description));
      var meta = [];
      if (s.tags && s.tags.length) meta.push(s.tags.join(" / "));
      a.appendChild(el("p", "card-tags", meta.join("")));
      var foot = el("p", "card-foot");
      foot.appendChild(el("span", null, s.repo));
      if (s.updated) foot.appendChild(el("span", null, "updated " + fmtDate(s.updated)));
      a.appendChild(foot);
      grid.appendChild(a);
    });
    if (count) count.textContent = sites.length + " sites";
  }

  function pagesUrl(name) { return "https://" + USER + ".github.io/" + name + "/"; }

  fetch("sites.json", { cache: "no-cache" })
    .then(function (r) { return r.ok ? r.json() : []; })
    .catch(function () { return []; })
    .then(function (curated) {
      var sites = curated.map(function (c) {
        return { repo: c.repo, title: c.title || c.repo, description: c.description, tags: c.tags, hue: c.hue, url: c.url || pagesUrl(c.repo) };
      });
      render(sites);

      return fetch("https://api.github.com/users/" + USER + "/repos?per_page=100&type=owner&sort=pushed")
        .then(function (r) { if (!r.ok) throw new Error("GitHub API " + r.status); return r.json(); })
        .then(function (repos) {
          var byRepo = {};
          sites.forEach(function (s) { byRepo[s.repo] = s; });
          repos.forEach(function (r) {
            if (!r.has_pages || r.fork || r.private || r.name === SELF) return;
            var s = byRepo[r.name];
            if (!s) {
              var tags = [];
              if (r.language) tags.push(r.language);
              (r.topics || []).forEach(function (t) { tags.push(t); });
              s = { repo: r.name, title: r.name, description: r.description, tags: tags, url: r.homepage || pagesUrl(r.name) };
              sites.push(s);
              byRepo[r.name] = s;
            }
            s.updated = r.pushed_at;
          });
          // 更新日の新しい順。更新日が分からないものは後ろ
          sites.sort(function (a, b) { return (b.updated || "").localeCompare(a.updated || ""); });
          render(sites);
        })
        .catch(function () { /* API が使えなくても sites.json の内容で表示済み */ });
    });

  // 配色の切り替え
  var theme = document.querySelector(".theme-toggle");
  if (theme) {
    theme.addEventListener("click", function () {
      var light = document.documentElement.getAttribute("data-theme") === "light";
      if (light) document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", "light");
      try { localStorage.setItem("hub-theme", light ? "dark" : "light"); } catch (e) { /* 保存できなくても切り替えは効く */ }
    });
  }

  // ヘッダー: スクロールしたら背景を付ける
  var header = document.querySelector(".site-header");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
