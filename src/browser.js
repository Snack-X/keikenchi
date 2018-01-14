const $ = require("jquery");
const prefectures = require("./prefectures");
const nPrefs = prefectures.length;

//========================================================================================

function $td(content) {
  return $("<td>").append(content);
}

function $radio(name, value, checked) {
  const radio = $("<input>").attr("type", "radio").attr("name", name).attr("value", value);
  if(checked) radio.attr("checked", "checked");
  return radio;
}

function $buildTr($tr, initial, i) {
  if(prefectures[i]) {
    $tr.append($td(prefectures[i][1]));
    $tr.append($td($radio("pref-" + i, 5, initial[i] === 5)));
    $tr.append($td($radio("pref-" + i, 4, initial[i] === 4)));
    $tr.append($td($radio("pref-" + i, 3, initial[i] === 3)));
    $tr.append($td($radio("pref-" + i, 2, initial[i] === 2)));
    $tr.append($td($radio("pref-" + i, 1, initial[i] === 1)));
    $tr.append($td($radio("pref-" + i, 0, initial[i] === 0)));
  }
  else {
    for(let j = 0 ; j < 7 ; j++)
      $tr.append($td());
  }
}

//========================================================================================

function update() {
  const keiken = [[], [], [], [], [], []];
  const keikenArr = [];

  for(let i = 0 ; i < nPrefs ; i++) {
    const value = $(`.table-prefectures input[name=pref-${i}]:checked`).val();
    const keikenchi = parseInt(value);
    keiken[keikenchi].push(i);
    keikenArr.push(keikenchi);

    // Update <span> list
    const prefName = prefectures[i][0];
    const $path = $(`.keikenchi .map svg path[data-name=${prefName}]`);
    $path.removeClass("keiken-0 keiken-1 keiken-2 keiken-3 keiken-4 keiken-5");
    $path.addClass("keiken-" + keikenchi);
  }

  // Update total score
  let totalKeikenchi = 0;
  for(let n = 0 ; n < keiken.length ; n++) {
    const prefIdxs = keiken[n];
    totalKeikenchi += n * prefIdxs.length;

    for(const prefIdx of prefIdxs) {
      const $span = $(`.keikenchi .score .list span.pref-${prefIdx}`).remove();
      $(`.keikenchi .score .list.lv-${n} td`).append($span);
    }

    $(`.keikenchi .score .legend.lv-${n} td:nth-child(4)`).text(prefIdxs.length);
  }

  $(".keikenchi .score .total td:nth-child(2)").text(totalKeikenchi);

  const keikenData = keikenArr.join("");

  // Update url
  const search = "?d=" + keikenData;
  const baseurl = location.protocol + "//" + location.host + location.pathname;
  history.replaceState(null, document.title, baseurl + search);

  // Update link
  const permalink = `https://kkn.snack.studio/map.html?d=${keikenData}`;
  const imageSvg = `https://kkni.snack.studio/image/${keikenData}.svg`;
  $(".links .permalink").val(permalink);
  $(".links .image-svg").val(imageSvg);
}

function onSvgPathClick() {
  const prefIdx = $(this).data("idx");
  const selector = `.table-prefectures input[name=pref-${prefIdx}]`;
  const current = parseInt($(selector + ":checked").val());
  const next = (current + 1) % 6;

  $(`${selector}[value=${next}]`).prop("checked", "checked");
  update();
}

$(function() {
  // Check initial state
  let initial = [];
  const search = location.search;
  const match = search.match(/[?&]d=([0-5]{47})(?:$|&)/);
  if(match) initial = match[1].split("").map(c => parseInt(c));
  else initial = new Array(47).fill(0);

  // Make DOM and set to initial state
  const perColumn = Math.ceil(nPrefs / 3);
  for(let i = 0 ; i < perColumn ; i++) {
    const $tr = $("<tr>");
    $buildTr($tr, initial, i);
    $buildTr($tr, initial, i + (perColumn * 1));
    $buildTr($tr, initial, i + (perColumn * 2));

    $(".table-prefectures tbody").append($tr);
  }

  for(let i = 0 ; i < nPrefs ; i++) {
    const [ nameJp, nameKr ] = prefectures[i];
    const $span = $("<span>").addClass("pref-" + i).text(nameKr);
    $(".keikenchi .score .list.lv-0 td").append($span);
    $(`.keikenchi .map svg path[data-name=${nameJp}]`).data("idx", i);
  }

  // Ready to go
  $(".table-prefectures tbody").find("input").on("change", update);
  update();

  $(".keikenchi .map svg path.prefecture").on("click", onSvgPathClick);
});
