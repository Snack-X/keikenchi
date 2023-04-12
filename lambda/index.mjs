import { readFile } from 'node:fs/promises';
// import * as PImage from 'pureimage';
import { createCanvas, registerFont } from 'canvas';
import { drawPath } from './svg.mjs';

const PATH_TEMPLATE = new URL('template.svg', import.meta.url);
const PATH_FONT = new URL('LestoSansKR-Regular.ttf', import.meta.url);

export async function getSvg(value) {
  const template = await readFile(PATH_TEMPLATE, { encoding: 'utf8' });

  let output = template;
  for (let i = 0; i < 47; i++) {
    const idx = i.toString(10).padStart(2, '0');
    output = output.replace("__keiken_" + idx + "__", "keiken-" + value[i]);
  }

  return output;
}

export async function getImage(value) {
  const template = await readFile(PATH_TEMPLATE, { encoding: 'utf8' });
  registerFont(PATH_FONT, { family: 'Lesto Sans KR' });

  const cv = createCanvas(1000, 1000);
  const ctx = cv.getContext('2d');

  ctx.imageSmoothingEnabled = true;

  // background
  ctx.lineWidth = 0;
  ctx.fillStyle = '#dff';
  ctx.fillRect(0, 0, 1000, 1000);

  // paths
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000';

  const re = /<path class="prefecture __keiken_(\d+)__" data-name="(.+)" d="(.+)"\/>/g;
  let match;

  const colors = ['#fff', '#0ff', '#0f0', '#ff0', '#f00', '#f0f'];

  while ((match = re.exec(template)) !== null) {
    const idx = parseInt(match[1], 10);
    const v = parseInt(value[idx], 10);
    const path = match[3];

    ctx.fillStyle = colors[v];
    drawPath(ctx, path);
  }

  // others
  match = template.match(/<path class="separator" d="(.+)"\/>/);
  if (match) {
    drawPath(ctx, match[1]);
    ctx.stroke();
  }

  match = template.match(/<text fill="(.+)" text-anchor="end" font-size="(\d+)" x="(\d+)" y="(\d+)">(.+)<\/text>/);
  if (match) {
    ctx.fillStyle = match[1];
    ctx.font = `${parseFloat(match[2]) * 0.75}pt 'Lesto Sans KR'`;
    const metrics = ctx.measureText(match[5]);

    let targetX = parseFloat(match[3]), targetY = parseFloat(match[4]);
    targetX = (targetX - metrics.width);

    ctx.fillText(match[5], targetX, targetY);
  }

  return cv;
}

export async function main(event) {
  const method = event.httpMethod.toUpperCase();
  const url = event.path;

  if (method === 'GET' && url === '/') {
    return {
      isBase64Encoded: false,
      statusCode: 301,
      headers: { Location: 'https://kkn.snack.studio' },
    };
  }

  if (method !== 'GET') {
    return {
      isBase64Encoded: false,
      statusCode: 405,
      headers: { 'Content-Type': 'text/html; charset=UTF-8' },
      body: 'Method Not Allowed',
    };
  }

  const match = url.match(/^\/image\/([0-5]{47})\.(svg|jpg|png)$/i);
  if (!match) {
    return {
      isBase64Encoded: false,
      statusCode: 404,
      headers: { 'Content-Type': 'text/html; charset=UTF-8' },
      body: '<a href="https://kkn.snack.studio">kkn.snack.studio</a>',
    };
  }

  const [, value, type] = match;

  if (type === 'svg') {
    const body = await getSvg(value);

    return {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=UTF-8',
        'Cache-Control': 'max-age=86400',
      },
      body,
    };
  }

  if (type === 'jpg') {
    const image = await getImage(value);
    const body = image.toBuffer('image/jpeg', { quality: 0.9 });

    return {
      isBase64Encoded: true,
      statusCode: 200,
      headers: {
        'Content-Type': 'image/jpeg; charset=UTF-8',
        'Cache-Control': 'max-age=86400',
      },
      body: body.toString('base64'),
    };
  }

  if (type === 'png') {
    const image = await getImage(value);
    const body = image.toBuffer('image/png');

    return {
      isBase64Encoded: true,
      statusCode: 200,
      headers: {
        'Content-Type': 'image/png; charset=UTF-8',
        'Cache-Control': 'max-age=86400',
      },
      body: body.toString('base64'),
    };
  }

  return {
    isBase64Encoded: false,
    statusCode: 400,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
    body: 'Bad Request'
  };
}
