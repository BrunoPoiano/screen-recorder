module.exports = {
  packagerConfig: {
    out: "release",
    platform: ["linux"],
    arch: ["x64"],
  },
  makers: [
    {
      name: "@electron-forge/maker-zip",
      platforms: ["linux"],
    },
  ],
};
