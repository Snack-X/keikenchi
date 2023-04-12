export function drawPath(ctx, d) {
  const re1 = /([MLHVZ])((?:-?[0-9.]+(?:,|\s*))+)?/gi;
  const re2 = /(?:(-?(?:[0-9]+\.[0-9]+|\.[0-9]+|[0-9]+))(?:,|\s*|$))/g;
  let op, posX = 0, posY = 0, startX = 0, startY = 0;

  while ((op = re1.exec(d)) !== null) {
    re2.lastIndex = 0;
    // console.log('found', op[1], op[2]);

    switch (op[1]) {
      case 'M':
        ctx.beginPath();

        while (true) {
          let _x = re2.exec(op[2]); if (_x === null) break;
          let _y = re2.exec(op[2]); if (_y === null) break;
          // console.log('- fetched', _x[1], _y[1]);

          posX = parseFloat(_x);
          posY = parseFloat(_y);
          ctx.moveTo(posX, posY);

          startX = posX;
          startY = posY;
        }

        break;

      case 'm':
        ctx.beginPath();

        while (true) {
          let _x = re2.exec(op[2]); if (_x === null) break;
          let _y = re2.exec(op[2]); if (_y === null) break;
          // console.log('- fetched', _x[1], _y[1]);

          posX += parseFloat(_x);
          posY += parseFloat(_y);
          ctx.moveTo(posX, posY);

          startX = posX;
          startY = posY;
        }

        break;

      case 'L':
        while (true) {
          let _x = re2.exec(op[2]); if (_x === null) break;
          let _y = re2.exec(op[2]); if (_y === null) break;
          // console.log('- fetched', _x[1], _y[1]);

          posX = parseFloat(_x[1]);
          posY = parseFloat(_y[1]);
          ctx.lineTo(posX, posY);
        }

        break;

      case 'l':
        while (true) {
          let _x = re2.exec(op[2]); if (_x === null) break;
          let _y = re2.exec(op[2]); if (_y === null) break;
          // console.log('- fetched', _x[1], _y[1]);

          posX += parseFloat(_x[1]);
          posY += parseFloat(_y[1]);
          ctx.lineTo(posX, posY);
        }

        break;

      case 'H':
        while (true) {
          let _x = re2.exec(op[2]); if (_x === null) break;
          // console.log('- fetched', _x[1]);

          posX = parseFloat(_x[1]);
          ctx.lineTo(posX, posY);
        }

        break;

      case 'h':
        while (true) {
          let _x = re2.exec(op[2]); if (_x === null) break;
          // console.log('- fetched', _x[1]);

          posX += parseFloat(_x[1]);
          ctx.lineTo(posX, posY);
        }

        break;

      case 'V':
        while (true) {
          let _y = re2.exec(op[2]); if (_y === null) break;
          // console.log('- fetched', _y[1]);

          posY = parseFloat(_y[1]);
          ctx.lineTo(posX, posY);
        }

        break;

      case 'v':
        while (true) {
          let _y = re2.exec(op[2]); if (_y === null) break;
          // console.log('- fetched', _y[1]);

          posY += parseFloat(_y[1]);
          ctx.lineTo(posX, posY);
        }

        break;

      case 'z': case 'Z':
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        // console.log('- started at', startX, startY);
        // console.log('- closed at', posX, posY);
        posX = startX;
        posY = startY;
        break;
    }
  }
}
