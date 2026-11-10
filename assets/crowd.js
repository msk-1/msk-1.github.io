// ヘッダの背景に AI くん（ai-jobs のダッシュボードの顔）を敷き詰める
// 形・目線・状態は位置から決まる乱数で選ぶ。幅が変わったら並べ直す
(function () {
  var box = document.getElementById("crowd");
  if (!box) return;

  // 不定形の顔。ai-jobs/dashboard.html の BLOBS と同じ形
  var BLOBS = [
    "M32 7c12 0 20 8 21 19 1 10-3 18-10 22-6 4-14 5-20 1C15 45 10 37 10 28 10 16 19 7 32 7z",
    "M31 8c11-1 21 6 22 18 1 11-4 19-11 22-7 3-15 2-21-3-5-4-8-11-7-19C15 16 21 9 31 8z",
    "M33 7c10 1 18 8 19 18 2 10-2 19-9 23-7 3-14 3-20-1-6-5-10-12-9-21 1-11 9-19 19-19z",
    "M32 9c11 0 19 6 20 17 2 11-3 19-9 22-8 4-16 3-22-2-5-4-8-12-6-20 2-10 8-17 17-17z"
  ];

  function rand(seed) {
    var x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  // state: ok（まばたき）/ look（目がきょろきょろ動く）/ run（揺れる）/ fail（目が線）/ idle（色が薄い）
  function face(seed) {
    var r = rand(seed);
    var state = r < 0.07 ? "fail" : r < 0.2 ? "run" : r < 0.32 ? "idle" : r < 0.52 ? "look" : "ok";
    var lx = Math.round((rand(seed + 0.1) - 0.5) * 6);
    var ly = Math.round((rand(seed + 0.2) - 0.5) * 4);
    var ex = 32 + lx, ey = 31 + ly;
    var eyes = state === "fail"
      ? '<rect class="eye" x="' + (ex - 8.5) + '" y="' + (ey - 0.9) + '" width="6" height="1.9" rx="1"/>' +
        '<rect class="eye" x="' + (ex + 2.5) + '" y="' + (ey - 0.4) + '" width="6" height="1.9" rx="1"/>'
      : '<ellipse class="eye" cx="' + (ex - 5) + '" cy="' + ey + '" rx="2.4" ry="2.7"/>' +
        '<ellipse class="eye" cx="' + (ex + 5) + '" cy="' + (ey + 0.6) + '" rx="2.4" ry="2.7"/>';
    var delay = (rand(seed + 0.3) * 6).toFixed(2);
    // きょろきょろする顔は、動き方（2通り）と速さを顔ごとに変える
    var look = state === "look"
      ? ' class="eyes look' + (rand(seed + 0.5) < 0.5 ? "1" : "2") + '" style="animation-duration:' + (3 + rand(seed + 0.6) * 3).toFixed(2) + "s;animation-delay:-" + delay + 's"'
      : ' class="eyes"';
    return '<svg class="kun ' + state + '" viewBox="0 0 64 68" style="animation-delay:' + delay + 's;--d:' + delay + 's">' +
      '<path class="skin" d="' + BLOBS[Math.floor(rand(seed + 0.4) * BLOBS.length)] + '"/><g' + look + ">" + eyes + "</g></svg>";
  }

  function layout() {
    var w = box.clientWidth, h = box.clientHeight;
    var cell = w < 600 ? 38 : 50;
    var cols = Math.ceil(w / cell) + 1;
    var rows = Math.ceil(h / (cell * 0.9)) + 1;
    var html = "";
    for (var y = 0; y < rows; y++) {
      var off = y % 2 ? cell / 2 : 0;
      for (var x = 0; x < cols; x++) {
        html += '<span style="left:' + (x * cell - off) + "px;top:" + Math.round(y * cell * 0.9) + "px;width:" + cell + 'px">' +
          face(y * 131 + x + 1) + "</span>";
      }
    }
    box.innerHTML = html;
  }

  var last = 0, timer;
  function onResize() {
    if (box.clientWidth === last) return;
    clearTimeout(timer);
    timer = setTimeout(function () { last = box.clientWidth; layout(); }, 150);
  }
  last = box.clientWidth;
  layout();
  window.addEventListener("resize", onResize);
})();
