const targets = [
  'es5',
  'es6',
  'es2015',
  'es2016',
  'es2017',
  'es2018',
  'es2019',
  'es2020',
  'es2021',
  'es2022',
  'esnext',
];

const npmLibraryPresetConfig = [
  {
    format: 'cjs',
    target: 'es6',
    buildType: 'bundleless',
    outDir: './dist',
    dts: true,
  },
];

const libraryPresetWithTarget = targets.reduce((ret, target) => {
  ret[`npm-library-${target}`] = npmLibraryPresetConfig.map(config => {
    return { ...config, target };
  });
  return ret;
}, {});

module.exports = {
  targets,
  libraryPresetWithTarget,
  npmLibraryPresetConfig,
};
