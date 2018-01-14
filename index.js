const fs = require("fs");
const path = require("path");
const koa = require("koa");

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

  const matchImage = url.match(/^\/image\/([0-5]{47})\.(svg)$/);
  if(method === "GET" && matchImage) {
    const data = matchImage[1], type = matchImage[2];

    if(type === "svg") {
      ctx.type = "image/svg+xml";
      ctx.body = renderAsSvg(ctx.imageTemplate, data);
      return;
    }
    else {
      ctx.status = 415;
      ctx.body = errorBody;
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
