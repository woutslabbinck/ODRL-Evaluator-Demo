const path = require('path');
const webpack = require("webpack");
module.exports = {
    mode: "development",
    entry: './src/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'docs'),
    },
    devServer: {
        static: {
            directory: path.join(__dirname, "docs"),
          },
        compress: true,
        port: 8080
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: "process/browser",
      }),
    ],
    resolve: {
        fallback: {
          path: false,
          fs: false,
          crypto: false,
          perf_hooks: false,
          os:false,
          stream:false,
        }
      },
};