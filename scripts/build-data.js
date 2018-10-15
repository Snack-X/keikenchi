const mapshaper = require('mapshaper');
mapshaper.enableLogging();

const runMapshaper = commands => new Promise((resolve, reject) => {
  mapshaper.runCommands(commands, err => {
    if(err) reject(err);
    else resolve();
  });
});

(async function() {
  // Build Japan geometry data
  await runMapshaper(
   `-i src/data/N03-18_180101.shp encoding=shiftjis snap \
    -each 'prefecture = N03_001,
           municipality = ((N03_003 || "") + " " + (N03_004 || "")).trim(),
           fullname = prefecture + " " + municipality' \
    -filter '!(N03_001 == "北海道" && N03_003 == "色丹郡")' \
    -filter '!(N03_001 == "北海道" && N03_003 == "国後郡")' \
    -filter '!(N03_001 == "北海道" && N03_003 == "択捉郡")' \
    -filter '!(N03_001 == "北海道" && N03_003 == "紗那郡")' \
    -filter '!(N03_001 == "北海道" && N03_003 ==  "蘂取郡")' \
    -dissolve target=1 + name=country \
    -dissolve prefecture target=1 + name=prefectures \
    -dissolve fullname copy-fields=prefecture,municipality target=1 + name=municipalities \
    -drop target=1 \
    -filter-islands min-area=100000 \
    -simplify 5% stats \
    -o tmp/japan-geometry-base.json precision=0.00001 format=topojson combine-layers`);

  await runMapshaper(
   `-i tmp/japan-geometry-base.json
    -drop target=1,3
    -simplify 0.5% stats
    -o tmp/japan-geometry-big.json precision=0.0001`);
})()
  .then(() => { process.exit(0); })
  .catch(err => { console.error(err.stack || err); process.exit(1); });