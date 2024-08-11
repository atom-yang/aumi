import { z } from '@umijs/utils/compiled/zod';

export function getSchemas(): Record<string, (arg: { zod: typeof z }) => any> {
  return {
    crossorigin: ({ zod }) => zod.any(),
    exclude: ({ zod }) => zod.any(),
    extraIncludes: ({ zod }) => zod.any(),
    rspack: ({ zod }) => zod.record(zod.string(), zod.any()),
    swcLoader: ({ zod }) => zod.any(),
    react: ({ zod }) => zod.any(),
    moduleFederation: ({ zod }) => zod.any(),
    rsbuildConfig: ({ zod }) => zod.record(zod.string(), zod.any()),
    analyze: ({ zod }) => zod.record(zod.string(), zod.any()),
    alias: ({ zod }) => zod.record(zod.string(), zod.any()),
    aliasStrategy: ({ zod }) => zod.string(),
    // autoCSSModules: ({ zod }) => zod.boolean(),
    // autoprefixer: ({ zod }) => zod.record(zod.string(), zod.any()),
    // babelLoaderCustomize: ({ zod }) => zod.string(),
    // cacheDirectoryPath: ({ zod }) => zod.string(),
    chainWebpack: ({ zod }) => zod.function(),
    // checkDepCssModules: ({ zod }) => zod.boolean().default(false),
    copy: ({ zod }) =>
      zod.array(
        zod.union([
          zod.object({
            from: zod.string(),
            to: zod.string(),
          }),
          zod.string(),
        ]),
      ),
    cssLoader: ({ zod }) => zod.any(),
    cssLoaderModules: ({ zod }) => zod.any(),
    // cssMinifier: ({ zod }) =>
    //   zod.enum([
    //     CSSMinifier.cssnano,
    //     CSSMinifier.esbuild,
    //     CSSMinifier.parcelCSS,
    //     CSSMinifier.none,
    //   ]),
    // cssMinifierOptions: ({ zod }) => zod.record(zod.string(), zod.any()),
    // cssPublicPath: ({ zod }) => zod.string(),
    // deadCode: ({ zod }) =>
    //   zod
    //     .object({
    //       context: zod.string(),
    //       detectUnusedExport: zod.boolean(),
    //       detectUnusedFiles: zod.boolean(),
    //       exclude: zod.array(zod.string()),
    //       failOnHint: zod.boolean(),
    //       patterns: zod.array(zod.string()),
    //     })
    //     .deepPartial(),
    define: ({ zod }) => zod.record(zod.string(), zod.any()),
    // depTranspiler: ({ zod }) =>
    //   zod.enum([
    //     Transpiler.babel,
    //     Transpiler.esbuild,
    //     Transpiler.swc,
    //     Transpiler.none,
    //   ]),
    devtool: ({ zod }) => zod.string(),
    // esm: ({ zod }) => zod.object({}),
    externals: ({ zod }) =>
      zod.union([
        zod.record(zod.string(), zod.any()),
        zod.string(),
        zod.function(),
      ]),
    // extraBabelIncludes: ({ zod }) =>
    //   zod.array(zod.union([zod.string(), zod.instanceof(RegExp)])),
    // extraBabelPlugins: ({ zod }) =>
    //   zod.array(zod.union([zod.string(), zod.array(zod.any())])),
    // extraBabelPresets: ({ zod }) =>
    //   zod.array(zod.union([zod.string(), zod.array(zod.any())])),
    // extraPostCSSPlugins: ({ zod }) => zod.array(zod.any()),
    // fastRefresh: ({ zod }) => zod.boolean(),
    forkTSChecker: ({ zod }) => zod.record(zod.string(), zod.any()),
    hash: ({ zod }) => zod.boolean(),
    https: ({ zod }) => zod.record(zod.string(), zod.any()),
    ignoreMomentLocale: ({ zod }) => zod.boolean(),
    inlineLimit: ({ zod }) => zod.any(),
    // jsMinifier: ({ zod }) =>
    //   zod.enum([
    //     JSMinifier.esbuild,
    //     JSMinifier.swc,
    //     JSMinifier.terser,
    //     JSMinifier.uglifyJs,
    //     JSMinifier.none,
    //   ]),
    // jsMinifierOptions: ({ zod }) => zod.record(zod.string(), zod.any()),
    lessLoader: ({ zod }) => zod.any(),
    manifest: ({ zod }) => zod.any(),
    // mdx: ({ zod }) =>
    //   zod
    //     .object({
    //       loader: zod.string(),
    //       loaderOptions: zod.record(zod.string(), zod.any()),
    //     })
    //     .deepPartial(),
    // mfsu: ({ zod }) =>
    //   zod.union([
    //     zod
    //       .object({
    //         cacheDirectory: zod.string(),
    //         chainWebpack: zod.function(),
    //         esbuild: zod.boolean(),
    //         exclude: zod.array(
    //           zod.union([zod.string(), zod.instanceof(RegExp)]),
    //         ),
    //         include: zod.array(zod.string()),
    //         mfName: zod.string(),
    //         remoteAliases: zod.array(zod.string()),
    //         remoteName: zod.string(),
    //         runtimePublicPath: zod.boolean(),
    //         shared: zod.record(zod.string(), zod.any()),
    //         strategy: zod.enum(['eager', 'normal']).default('normal'),
    //       })
    //       .deepPartial(),
    //     zod.boolean(),
    //   ]),
    // normalCSSLoaderModules: ({ zod }) => zod.record(zod.string(), zod.any()),
    outputPath: ({ zod }) => zod.string(),
    postcssLoader: ({ zod }) => zod.record(zod.string(), zod.any()),
    proxy: ({ zod }) =>
      zod.union([zod.record(zod.string(), zod.any()), zod.array(zod.any())]),
    publicPath: ({ zod }) => zod.string(),
    // purgeCSS: ({ zod }) => zod.record(zod.string(), zod.any()),
    // runtimePublicPath: ({ zod }) => zod.object({}),
    sassLoader: ({ zod }) => zod.record(zod.string(), zod.any()),
    // srcTranspiler: ({ zod }) =>
    //   zod.enum([Transpiler.babel, Transpiler.esbuild, Transpiler.swc]),
    // srcTranspilerOptions: ({ zod }) =>
    //   zod
    //     .object({
    //       esbuild: zod.record(zod.string(), zod.any()),
    //       swc: zod.record(zod.string(), zod.any()),
    //     })
    //     .deepPartial(),
    styleLoader: ({ zod }) => zod.record(zod.string(), zod.any()),
    stylusLoader: ({ zod }) => zod.record(zod.string(), zod.any()),
    // svgo: ({ zod }) =>
    //   zod.union([zod.record(zod.string(), zod.any()), zod.boolean()]),
    svgr: ({ zod }) => zod.record(zod.string(), zod.any()),
    targets: ({ zod }) => zod.record(zod.string(), zod.any()),
    theme: ({ zod }) => zod.record(zod.string(), zod.any()),
    writeToDisk: ({ zod }) => zod.boolean(),
  };
}
