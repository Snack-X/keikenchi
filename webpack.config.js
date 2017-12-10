const path = require("path");

module.exports = {
  entry: {
    browser: "./src/browser.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: { loader: "babel-loader" },
    }],
  },
};
