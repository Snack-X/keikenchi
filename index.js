const fs = require("fs");
const path = require("path");
const koa = require("koa");
const canvas = require("./node_modules/canvas-prebuilt/canvas/index");

const WEB_PORT = 20012;

async function main() {
  const app = new koa();

  // Preload
  const templatePath = path.join(__dirname, "template.svg");
  const template = fs.readFileSync(templatePath, { encoding: "utf8" });
  app.context.imageTemplate = template;

  // Start webhook server
  app.use(requestHandler);

  app.listen(WEB_PORT);
}

main()
  .then(_ => { })
  .catch(err => { console.error(err.stack || err); process.exit(1); });

//==============================================================================

const errorBody = "<a href='https://kkn.snack.studio'>kkn.snack.studio</a>";

async function requestHandler(ctx) {
  const method = ctx.method.toUpperCase();
  const url = ctx.url;

  if(method === "GET" && url === "/") {
    ctx.redirect("https://kkn.snack.studio");
    return;
  }

  const matchImage = url.match(/^\/image\/([0-5]{47})\.(svg|jpg|png)$/);
  if(method === "GET" && matchImage) {
    const data = matchImage[1], type = matchImage[2];

    if(type === "svg") {
      ctx.type = "image/svg+xml";
      ctx.body = renderAsSvg(ctx.imageTemplate, data);
      return;
    }
    else if(type === "jpg" || type === "png") {
      const cv = renderAsCanvas(ctx.imageTemplate, data);
      let outputStream;

      if(type === "jpg") {
        ctx.type = "image/jpg";
        outputStream = cv.jpegStream();
      }
      else if(type === "png") {
        ctx.type = "image/png";
        outputStream = cv.pngStream();
      }

      const buffers = [];
      outputStream.on("data", function(chunk) { buffers.push(chunk); });
      outputStream.on("end", function() { ctx.body = Buffer.concat(buffers); });
    }
    else {
      ctx.status = 415;
      ctx.body = errorBody;
      return;
    }
  }

  ctx.status = 404;
  ctx.body = errorBody;
}

//==============================================================================

function renderAsSvg(template, data) {
  let output = template;

  for(let i = 0 ; i < 47 ; i++) {
    let idx = i < 10 ? "0" + i : "" + i;
    output = output.replace("__keiken_" + idx + "__", "keiken-" + data[i]);
  }

  return output;
}

//==============================================================================

function renderAsCanvas(template, data) {
  const cv = canvas.createCanvas(1000, 1000);
  const ctx = cv.getContext("2d");

  // Background
  ctx.lineWidth = 0;
  ctx.fillStyle = "#dff";
  ctx.rect(0, 0, 1000, 1000);
  ctx.fill();

  // Get paths
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#000";

  const re = /<path class="prefecture __keiken_(\d+)__" data-name="(.+)" d="(.+)"\/>/g;
  let match;

  while((match = re.exec(template)) !== null) {
    // Parse path data and draw
    const index = parseInt(match[1], 10), d = match[3];

    ctx.fillStyle = [ "#fff", "#0ff", "#0f0", "#ff0", "#f00", "#f0f" ][parseInt(data[index])];
    drawPath(ctx, d);
  }

  // Draw other elements
  match = template.match(/<path class="separator" d="(.+)"\/>/);
  if(match) {
    drawPath(ctx, match[1]);
    ctx.stroke();
  }

  match = template.match(/<text fill="(.+)" text-anchor="end" font-size="(\d+)" x="(\d+)" y="(\d+)">(.+)<\/text>/);
  if(match) {
    ctx.fillStyle = match[1];
    ctx.font = `${parseFloat(match[2]) * 0.75}pt sans-serif`;
    const metrics = ctx.measureText(match[5]);

    let targetX = parseFloat(match[3]), targetY = parseFloat(match[4]);
    targetX = (targetX - metrics.width);

    ctx.fillText(match[5], targetX, targetY);
  }

  // Finished
  return cv;
}

function drawPath(ctx, d) {
  const re = /([MLHVZ])(?:(\-?[0-9.]+),?(\-?[0-9.]+)?)?/gi;
  let op, posX = 0, posY = 0;

  while((op = re.exec(d)) !== null) {
    switch(op[1]) {
      case "M":
        ctx.beginPath();
        posX = parseFloat(op[2]);
        posY = parseFloat(op[3]);
        ctx.moveTo(posX, posY);
        break;

      case "L":
        posX = parseFloat(op[2]);
        posY = parseFloat(op[3]);
        ctx.lineTo(posX, posY);
        break;

      case "l":
        posX += parseFloat(op[2]);
        posY += parseFloat(op[3]);
        ctx.lineTo(posX, posY);
        break;

      case "H":
        posX = parseFloat(op[2]);
        ctx.lineTo(posX, posY);
        break;

      case "h":
        posX += parseFloat(op[2]);
        ctx.lineTo(posX, posY);
        break;

      case "V":
        posY = parseFloat(op[2]);
        ctx.lineTo(posX, posY);
        break;

      case "v":
        posY += parseFloat(op[2]);
        ctx.lineTo(posX, posY);
        break;

      case "z": case "Z":
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        break;
    }
  }
}
