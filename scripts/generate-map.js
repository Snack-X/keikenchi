const fs = require('fs');
const path = require('path');
const d3 = require('d3-geo');
const topojson = require('topojson-client');
const svgo = require('svgo');

const geoCompositeProjectionJapan = require('./d3-geoCompositeProjectionJapan');

// Settings
const WIDTH = 1000, HEIGHT = 1000;

// Load TopoJSONs and convert into GeoJSON
const geometry = require('../tmp/japan-geometry-big.json');
const objPrefectures = topojson.feature(geometry, geometry.objects.prefectures);

// D3
const projection = geoCompositeProjectionJapan();
const geoPath = d3.geoPath().projection(projection);
const renderObject = obj => geoPath(obj).replace(/(\d+\.\d{1})\d*/g, '$1');

// Render
const outPath = path.join(__dirname, '../src/map-big.svg');
const outBuffer = [];

outBuffer.push(`
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<style>
svg { background: #dff; }
path { vector-effect: non-scaling-stroke; stroke-width: 1px; stroke-linejoin: round; stroke-linecap: round; stroke: #000; }
.prefecture { fill: #fff; }
.prefecture:hover { stroke-width: 2px; }
.keiken-1 { fill: #0ff; }
.keiken-2 { fill: #0f0; }
.keiken-3 { fill: #ff0; }
.keiken-4 { fill: #f00; }
.keiken-5 { fill: #f0f; }
.separator { fill: none; }
</style>
<g class="container">
`);

for (let i = 0 ; i < objPrefectures.features.length ; i++) {
  const f = objPrefectures.features[i];
  const svgPath = `<path class="prefecture" data-name="${f.properties.prefecture}" d="${renderObject(f)}" />\n`;
  outBuffer.push(svgPath);
}

outBuffer.push(`</g>\n`);

const svgBorder = `<path class="separator" d="${projection.getCompositionBorders()}" />\n`;
outBuffer.push(svgBorder);

outBuffer.push(`
<text fill="#aaa" text-anchor="end" font-size="24" x="995" y="990">경현치 (https://kkn.snack.studio)</text>
</svg>
`);

// Optimize and save
const optimizer = new svgo({
  plugins: [
    { convertPathData: true },
    { inlineStyles: false },
    { minifyStyles: false },
  ],
});

let output = outBuffer.join('');
output = optimizer.optimize(output).then(result => {
  const out = fs.createWriteStream(outPath);
  out.write(result.data);
  out.close();
});
