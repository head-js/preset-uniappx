const path = require("node:path");
// HBuilderX resolves this plugin from its bundled compiler, not project dependencies.
const uni = require("@dcloudio/vite-plugin-uni");

module.exports = {
  plugins: [(uni.default || uni)()],
  resolve: {
    alias: {
      "~device-info": path.resolve(__dirname, "device-info"),
    },
  },
};
