// webpack.config.js
const path = require('path');

module.exports = {
  // other webpack configurations...
  resolve: {
    alias: {
      // Add an alias for fs module to prevent webpack from resolving it to an empty object
      fs: path.resolve(__dirname, 'empty'), // You can create a dummy file to stub fs
    },
  },
};