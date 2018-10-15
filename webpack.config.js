const path = require('path');

const mode = process.env.NODE_ENV || 'production';
const isDev = mode === 'development';

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const styleLoader = isDev ? 'style-loader' : MiniCssExtractPlugin.loader;

const config = {
  mode,
  entry: {
    keikenchi: './src/keikenchi.js',
  },
  output: {
    path: __dirname,
    publicPath: '/',
    filename: 'dist/[name].js?hash=[contenthash:6]',
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              interpolate: true,
            },
          },
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [ 'babel-loader' ],
      },
      {
        test: /\.s[ac]ss$/,
        exclude: /node_modules/,
        use: [ styleLoader, 'css-loader', 'sass-loader' ],
      },
      {
        test: /\.svg$/,
        use: [ 'svg-inline-loader' ],
      },
    ],
  },
};

if (!isDev) {
  const minifyOptions = {
    removeComments: true,
    collapseWhitespace: true,
  };

  config.plugins = [
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      filename: 'index.html',
      minify: minifyOptions,
    }),
    new HtmlWebpackPlugin({
      template: 'src/map.html',
      filename: 'map.html',
      minify: minifyOptions,
    }),
    new MiniCssExtractPlugin({
      filename: 'dist/[name].css?hash=[contenthash:6]',
      chunkFilename: 'dist/[id].css',
    }),
  ];
}

module.exports = config;
