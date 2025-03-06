const path = require('path');

module.exports = {
    mode: "development",
    entry: './src/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    devServer: {
        static: {
            directory: path.join(__dirname, "dist"),
          },
        compress: true,
        port: 8080
    },

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