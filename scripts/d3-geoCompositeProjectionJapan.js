// Modified from https://github.com/rveciana/d3-composite-projections/blob/master/src/conicEquidistantJapan.js

const { geoMercator } = require('d3-geo');
const { path } = require('d3-path');
const { fitExtent, fitSize } = require('./d3-compositeFit');

function multiplex(streams) {
  const n = streams.length;

  return {
    point: function (x, y) {
      for (let i = 0; i < n; i++)
        streams[i].point(x, y);
    },
    sphere: function () {
      for (let i = 0; i < n; i++)
        streams[i].sphere();
    },
    lineStart: function () {
      for (let i = 0; i < n; i++)
        streams[i].lineStart();
    },
    lineEnd: function () {
      for (let i = 0; i < n; i++)
        streams[i].lineEnd();
    },
    polygonStart: function () {
      for (let i = 0; i < n; i++)
        streams[i].polygonStart();
    },
    polygonEnd: function () {
      for (let i = 0; i < n; i++)
        streams[i].polygonEnd();
    },
  };
}

module.exports = function () {
  let cache, cacheStream;

  const mainland = geoMercator().rotate([-136.5, -42]),
        okinawa = geoMercator().rotate([-133.5, -25]);
  let mainlandPoint, okinawaPoint;
  let point, pointStream = { point: (x, y) => { point = [x, y]; } };

  const mainlandRange = [ -0.141, -0.073, 0.153, 0.220 ];
  const okinawaRange = [ -0.126, -0.059, -0.026, 0.015 ];

  function compositeProjection(coordinates) {
    const x = coordinates[0], y = coordinates[1];
    
    return point = null,
      (mainlandPoint.point(x, y), point) ||
      (okinawaPoint.point(x, y), point);
  }
  
  function reset() {
    cache = cacheStream = null;
    return compositeProjection;
  }

  compositeProjection.invert = function (coordinates) {
    var k = mainland.scale(),
        t = mainland.translate(),
        x = (coordinates[0] - t[0]) / k,
        y = (coordinates[1] - t[1]) / k;

    const isOkinawa = (
      x <= okinawaRange[0] && x >= okinawaRange[2] &&
      y <= okinawaRange[1] && y >= okinawaRange[3]
    );

    return (isOkinawa ? okinawa : mainland).invert(coordinates);
  };

  compositeProjection.stream = function (stream) {
    if (!cache || cacheStream !== stream) {
      cacheStream = stream;
      cache = multiplex([
        mainland.stream(stream),
        okinawa.stream(stream)
      ]);
    }

    return cache;
  };

  compositeProjection.precision = function (_) {
    if (!arguments.length)
      return mainland.precision();

    mainland.precision(_);
    okinawa.precision(_);

    return reset();
  };

  compositeProjection.scale = function(_) {
    if (!arguments.length) return mainland.scale();

    mainland.scale(_);
    okinawa.scale(_ * 0.7);

    return compositeProjection.translate(mainland.translate());
  };

  compositeProjection.translate = function (_) {
    if (!arguments.length)
      return mainland.translate();

    const k = mainland.scale(), x = +_[0], y = +_[1];
    const mainlandClip = [
      [mainlandRange[0] * k + x, mainlandRange[1] * k + y],
      [mainlandRange[2] * k + x, mainlandRange[3] * k + y],
    ];
    const okinawaClip = [
      [okinawaRange[0] * k + x, okinawaRange[1] * k + y],
      [okinawaRange[2] * k + x, okinawaRange[3] * k + y],
    ];

    mainlandPoint = mainland
      .translate(_)
      .clipExtent(mainlandClip)
      .stream(pointStream);

    okinawaPoint = okinawa
      .translate(_)
      .clipExtent(okinawaClip)
      .stream(pointStream);

    return reset();
  };

  compositeProjection.fitExtent = function(extent, object) {
    return fitExtent(compositeProjection, extent, object);
  };

  compositeProjection.fitSize = function(size, object) {
    return fitSize(compositeProjection, size, object);
  };

  compositeProjection.drawCompositionBorders = function(context) {
    const okinawaP1 = mainland([ 135.78, 45.37 ]),
          okinawaP2 = mainland([ 135.80, 43.68 ]),
          okinawaP3 = mainland([ 131.42, 40.20 ]),
          okinawaP4 = mainland([ 127.04, 39.91 ]);

    context.moveTo(okinawaP1[0], okinawaP1[1]);
    context.lineTo(okinawaP2[0], okinawaP2[1]);
    context.lineTo(okinawaP3[0], okinawaP3[1]);
    context.lineTo(okinawaP4[0], okinawaP4[1]);
  };

  compositeProjection.getCompositionBorders = function() {
    var context = path();
    this.drawCompositionBorders(context);
    return context.toString();
  };

  return compositeProjection.scale(3400);
}
