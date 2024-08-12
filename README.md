# AUMI

<p>
  <a href="https://npmjs.com/package/@aumi/aumi">
   <img src="https://img.shields.io/npm/v/@aumi/aumi?style=flat-square" alt="npm version" />
  </a>
</p>

Build Umi based on Rsbuild

支持使用[Rsbuild](https://rsbuild.dev/zh/)作为Umi的bundler

## 特性

* [十倍以上](https://rsbuild.dev/zh/guide/start/index#-%E6%80%A7%E8%83%BD)的构建性能提升;
* 保留Umi插件体系，无差别的使用体验
* 低成本切换，5分钟内完成Umi历史项目的迁移

## 迁移

__Notice: Umi版本需要大于4.0.0__

### 安装

```bash
npm add @aumi/aumi@latest -S
```

### 更改文件

#### 更改Umi配置文件 `.umirc.ts` :

```ts
// .umirc.ts
import {defineAUMIConfig} from "@aumi/aumi";

export default defineAUMIConfig({
  ...,
});
```

`.umirc.ts`下的配置，因bundler兼容性，或未经过测试，不能够支持以下几个配置项

| 字段                   | 无法使用原因                                                              | 替换手段                                                                                                          |
|:---------------------|:--------------------------------------------------------------------|:--------------------------------------------------------------------------------------------------------------|
| autoprefixer         | 改用其他方式                                                              | 1. 改用browserlist<br/>2. 改用`.umirc.ts`下的targets配置                                                              |
| cssMinifier          | 改用其他方式                                                              | Rsbuild使用lightningcss，可通过`.umirc.ts`下的minify来配置                                                               |
| classPropertiesLoose | babel插件配置，Rsbuild使用swc                                              | 通过`.umirc.ts`下的swcLoader配置swc的选项                                                                              |
| deadCode             | webpack plugin，暂未测试rspack兼容性                                        | 无                                                                                                             |
| depTranspiler        | 用于指定使用esbuild等工具处理node_modules中符合条件的代码，实际上@umijs/bundler-webpack没用到 | 无                                                                                                             |
| esbuildMinifyIIFE    | 此字段用于修复 esbuild 压缩器自动引入的全局变量导致的命名冲突问题，不需要使用                         | 无                                                                                                             |
| extraBabelIncludes   | 改为extraIncludes                                                     | 通过`.umirc.ts`下的extraIncludes                                                                                  |
| extraBabelPlugins    | 不支持babel，改为swcLoader                                                | 改用swcLoader配置，具体详见[Rsbuild](https://rsbuild.dev/zh/config/tools/swc)                                          |
| extraBabelPresets    | 同上                                                                  | 同上                                                                                                            |
| exportStatic         | 暂未支持与测试                                                             | 无                                                                                                             |
| extraPostCSSPlugins  | 改为`postcssLoader`配置                                                 | 改用`.umirc.ts`下的`postcssLoader`, 类型参考[Rsbuild](https://rsbuild.dev/zh/config/tools/postcss)                    | 
| forget               | 暂未支持与测试                                                             | 无                                                                                                             |
| jsMinifier           | 改为`minify`配置来支持                                                     | 改用`.umirc.ts`下的`minify`来支持，类型参考[Rsbuid](https://rsbuild.dev/zh/config/output/minify)                          |
| jsMinifierOptions    | 同上                                                                  | 同上                                                                                                            |
| legacy               | 不支持                                                                 | 无                                                                                                             |
| mdx                  | 不支持                                                                 | 可通过chainWebpack自行配置                                                                                           |
| mfsu                 | 暂未支持与测试                                                             | 改为`.umirc.ts`下的新增配置`moduleFederation`来支持，参考[Rsbuild](https://rsbuild.dev/zh/config/module-federation/options) |
| runtimePublicPath    | 使用`RuntimePublicPathPlugin` webpack插件，暂未测试rspack兼容性                 | 暂无                                                                                                            |
| srcTranspiler        | 不支持，默认使用`swcLoader`                                                 | 无                                                                                                             |
| srcTranspilerOptions | 同上                                                                  | 同上                                                                                                            |

`defineAUMIConfig`方法，除去插件的配置TS类型无法提供之外，其余类型基于Rsbuild的类型，具有完善的TS类型

#### 更改`package.json`

更改`package.json`下的`scripts`字段
```json
{
  "scripts": {
    "dev": "aumi dev",
    "build": "aumi build",
    "analyze": "RSDOCTOR=true aumi build",
    "postinstall": "aumi setup",
    "setup": "aumi setup",
    "start": "npm run dev"
  }
}
```
其中analyze代替UMI原有的analyze功能，使用Rsdoctor做分析功能

## 新建项目

参考Umi的[快速上手](https://umijs.org/docs/guides/getting-started)，新建一个项目；然后遵循上述[迁移步骤](#迁移)进行变更

## 其他变更

### `.umirc.ts`新增配置

| 字段              | 默认值                                                                       | 作用                                                                                                                                                                              |
|:----------------|:--------------------------------------------------------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| rsbuildConfig   | undefined                                                                 | 完正的RsbuildConfig，优先级高于其他配置，会通过[mergeRsbuildConfig](https://rsbuild.dev/zh/api/javascript-api/core#mergersbuildconfig)与其他配置合并，类型参考[Rsbuild](https://rsbuild.dev/zh/config/index) |
| aliasStrategy   | 'prefer-alias'                                                            | `alias`配置的优先级，[参考](https://rsbuild.dev/zh/config/source/alias-strategy)                                                                                                         |
| transformImport | undefined                                                                 | 能力类似`babel-plugin-import`，参考[Rsbuild](https://rsbuild.dev/zh/config/source/transform-import)                                                                                    |
| react           | [参考](https://rsbuild.dev/zh/plugins/list/plugin-react#%E9%80%89%E9%A1%B9) | Rsbuild插件`@rsbuild/plugin-react`的[配置](https://rsbuild.dev/zh/plugins/list/plugin-react#%E9%80%89%E9%A1%B9)                                                                      |
| rspack          | undefined                                                                 | 修改rspack的配置项，[参考](https://rsbuild.dev/zh/config/tools/rspack)                                                                                                                                                             |

### Umi插件扩展方法变更

Umi通过插件体系，提供了大量的自定义方法，可以在构建流程中使用（[可查看Umi文档](https://umijs.org/docs/api/plugin-api)）。因bundler修改，部分底层构建流程与`@umijs/bundler-webpack`存在不一致的地方，因此去掉了部分自定义方法，如果在插件和构建流程中使用这些方法，则会报错，停止构建

去除了以下扩展方法，主要是babel相关

* [addExtraBabelPresets](https://umijs.org/docs/api/plugin-api#addextrababelpresets)
* [addExtraBabelPlugins](https://umijs.org/docs/api/plugin-api#addextrababelplugins)
* [addBeforeBabelPresets](https://umijs.org/docs/api/plugin-api#addbeforebabelpresets)
* [addBeforeBabelPlugins](https://umijs.org/docs/api/plugin-api#addbeforebabelplugins)
* [modifyWebpackConfig](https://umijs.org/docs/api/plugin-api#modifywebpackconfig)
* [modifyViteConfig](https://umijs.org/docs/api/plugin-api#modifyviteconfig)
* [modifyServerRendererPath](https://umijs.org/docs/api/plugin-api#modifyserverrendererpath)
* modifyBabelPresetOpts

新增了以下扩展方法

* `modifyRsbuildPlugins`: 用于修改Rsbuild插件

示例：
```typescript
api.modifyRsbuildPlugins(plugins => {
  return plugins.slice(1);
});
```

* `modifyRsbuildConfig`: 用于修改`RsbuildConfig`，优先级最高

示例：
```typescript
api.modifyRsbuildConfig(config => {
  config.root = './';
  return config;
});
```

## 遗留问题

TODO




