# AUmi

<p>
  <a href="https://npmjs.com/package/@aumi/aumi">
   <img src="https://img.shields.io/npm/v/@aumi/aumi?style=flat-square" alt="npm version" />
  </a>
</p>

Build Umi based on Rsbuild

English | [简体中文](./README.zh-CN.md)

AUmi switches Umi's default bundler from Webpack to [Rsbuild](https://rsbuild.dev/zh/)

## Features

* [10x performance improvement](https://rsbuild.dev/zh/guide/start/index#-%E6%80%A7%E8%83%BD);
* Retain Umi plugin system and the same user experience;
* Migration Umi project in 5 minutes.

## Migration

**Notice: Make sure your Umi version is >= 4.0**

**Notice: V**

### Installation

```bash
npm add @aumi/aumi@latest -S
```

### File changes

#### Updating `.umirc.ts` :

```diff title=".umirc.ts"
- import { defineConfig } from 'umi';
+ import {defineAUMIConfig} from "@aumi/aumi";

- export default defineConfig({
+ export default defineAUMIConfig({
  ...,
});
```

Due to compatibility or lacking of testing, cannot support the following configurations.

| Field                | Unsupported Reason                                                                                                   | Replacement method                                                                                                                                  |
| :------------------- | :------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| autoprefixer         | Use another approach                                                                                                 | 1. use browserlist<br/>2. `targets` configuration of `.umirc.ts`                                                                                    |
| cssMinifier          | Use another approach                                                                                                 | `minify` configuration of `.umirc.ts`                                                                                                               |
| classPropertiesLoose | This is a babel configuration in Umi, Rsbuild uses swc by default                                                    | `swcLoader` configuration of `.umirc.ts`                                                                                                            |
| deadCode             | Webpack plugin, rspack compatibility is no tested                                                                    | None                                                                                                                                                |
| depTranspiler        | Not used in `@umijs/bundler-webpack`                                                                                 | None                                                                                                                                                |
| esbuildMinifyIIFE    | Fix the namespace conflict caused by global variables automatically introduced by the esbuild compressor, not needed | None                                                                                                                                                |
| extraBabelIncludes   | Switching to `extraIncludes` configuration                                                                           | `extraIncludes` configuration of `.umirc.ts`                                                                                                        |
| extraBabelPlugins    | Switching to `swcLoader` configuration                                                                               | Use `swcLoader` configuration of `.umirc.ts`, check [Rsbuild](https://rsbuild.dev/zh/config/tools/swc) for details                                  |
| extraBabelPresets    | As above                                                                                                             | As above                                                                                                                                            |
| exportStatic         | Not tested                                                                                                           | 无                                                                                                                                                  |
| extraPostCSSPlugins  | Switching to `postcssLoader` configuration                                                                           | Use `postcssLoader` configuration of `.umirc.ts`, check [Rsbuild](https://rsbuild.dev/zh/config/tools/postcss) for details                          |
| forget               | Not tested                                                                                                           | None                                                                                                                                                |
| jsMinifier           | Switching to `minify` configuration                                                                                  | Use `minify` configuration of `.umirc.ts`, check [Rsbuid](https://rsbuild.dev/zh/config/output/minify) for details                                  |
| jsMinifierOptions    | As above                                                                                                             | As above                                                                                                                                            |
| legacy               | Not supported                                                                                                        | None                                                                                                                                                |
| mdx                  | Not supported                                                                                                        | Use `chainWebpack` function of `.umirc.ts`                                                                                                          |
| mfsu                 | Not tested                                                                                                           | Use new added configuration `moduleFederation` of `.umirc.ts`, check [Rsbuild](https://rsbuild.dev/zh/config/module-federation/options) for details |
| runtimePublicPath    | Hasn't test compatibility of webpack plugin `RuntimePublicPathPlugin`                                                | None                                                                                                                                                |
| srcTranspiler        | Not supported, use `swcLoader`                                                                                       | None                                                                                                                                                |
| srcTranspilerOptions | As above                                                                                                             | None                                                                                                                                                |

`defineAUMIConfig` has comprehensive TypeScript typing support except Umi plugins' typing


### Updating `package.json`

Updating `scripts` field of `package.json`.

```diff title="package.json"
{
  "scripts": {
-   "dev": "umi dev",
+   "dev": "aumi dev",
-   "build": "umi build",
+   "build": "aumi build",
+   "analyze": "RSDOCTOR=true aumi build",
-   "postinstall": "umi setup",
+   "postinstall": "aumi setup",
-   "setup": "umi setup",
+   "setup": "aumi setup",
    "start": "npm run dev"
  }
}
```

The `analyze` command replaces Umi's `analyze` functionality by using [Rsdoctor](https://rsbuild.dev/zh/guide/debug/rsdoctor).

## Start a new Project

Take Umi [Getting Started](https://umijs.org/en-US/docs/guides/getting-started) as a reference to start a new project, and follow instructions above [Migration](#Migration)

## Other changes

### New configuration in `.umirc.ts`

| Field           | Default value                                                                   | Usage                                                                                                                                                                                                                |
|:----------------|:--------------------------------------------------------------------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| rsbuildConfig   | undefined                                                                       | Full RsbuildConfig and has higher priority than other configs, will be merged by [mergeRsbuildConfig](https://rsbuild.dev/api/javascript-api/core#mergersbuildconfig), [Reference](https://rsbuild.dev/config/index) |
| aliasStrategy   | 'prefer-alias'                                                                  | The strategy of `alias` configuration, [Reference](https://rsbuild.dev/config/source/alias-strategy)                                                                                                                 |
| transformImport | undefined                                                                       | Similar to `babel-plugin-import`, [Reference](https://rsbuild.dev/config/source/transform-import)                                                                                                                    |
| react           | [reference](https://rsbuild.dev/plugins/list/plugin-react#%E9%80%89%E9%A1%B9)   | The configuration of Rsbuild plugin `@rsbuild/plugin-react`, [Reference](https://rsbuild.dev/plugins/list/plugin-react#%E9%80%89%E9%A1%B9)                                                                           |
| rspack          | undefined                                                                       | Modify rspack configuration, [Reference](https://rsbuild.dev/config/tools/rspack)                                                                                                                                    |

### Changes of Umi plugins' extended methods

Umi provides massive extended methods by its plugin mechanism [Umi Plugin Api](https://umijs.org/en-US/docs/api/plugin-api).
Due to we switch the bundler from `@umijs/bundler-webpack` to `Rsbuild`, some underlying build processes are inconsistent with `@umijs/bundler-webpack`. As a result, certain custom methods have been removed, if any removed methods are called, an error will be thrown out.


Remove extended methods as below, most are `Babel` related:

* [addExtraBabelPresets](https://umijs.org/docs/api/plugin-api#addextrababelpresets)
* [addExtraBabelPlugins](https://umijs.org/docs/api/plugin-api#addextrababelplugins)
* [addBeforeBabelPresets](https://umijs.org/docs/api/plugin-api#addbeforebabelpresets)
* [addBeforeBabelPlugins](https://umijs.org/docs/api/plugin-api#addbeforebabelplugins)
* [modifyWebpackConfig](https://umijs.org/docs/api/plugin-api#modifywebpackconfig)
* [modifyViteConfig](https://umijs.org/docs/api/plugin-api#modifyviteconfig)
* [modifyServerRendererPath](https://umijs.org/docs/api/plugin-api#modifyserverrendererpath)
* modifyBabelPresetOpts

Add new extended methods for `Rsbuild`

* `modifyRsbuildPlugins`: modifying `Rsbuild` plugins

Example: 
```typescript
api.modifyRsbuildPlugins(plugins => {
  return plugins.slice(1);
});
```

* `modifyRsbuildConfig`: modifying `RsbuildConfig` with the highest priority

example:
```typescript
api.modifyRsbuildConfig(config => {
  config.root = './';
  return config;
});
```

## Remain issues

TODO




