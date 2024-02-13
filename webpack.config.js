const path = require('path');

module.exports = {
  target: 'electron-renderer',
  resolve: {
    alias: {
      fs: path.resolve(__dirname, 'empty'),
    },
  },
};