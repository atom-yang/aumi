import { join } from 'path';

function resolvePresetUmiPath(path: string) {
  return require.resolve(join(`@umijs/preset-umi/dist`, path));
}

export default () => {
  return {
    plugins: [
      // 注册hook方法
      require.resolve('@umijs/preset-umi/dist/registerMethods'),
      // 必须在preset-umi的后面
      require.resolve('./RUMIRegisterMethods'),
      // features
      // 不需要
      // process.env.DID_YOU_KNOW !== 'none' &&
      //   resolvePresetUmiPath('@umijs/did-you-know/dist/plugin'),
      resolvePresetUmiPath('./features/404/404'),
      // 修改appData
      resolvePresetUmiPath('./features/appData/appData'),
      // 全局添加window.g_umi信息，目前只有版本
      resolvePresetUmiPath('./features/appData/umiInfo'),
      // 检察引用，publicPath等，需要重写，内部有写死为umi
      resolvePresetUmiPath('./features/check/check'),
      // 处理babel版本大于7.22的提醒和处理
      // resolvePresetUmiPath('./features/check/babel722'),
      // 文件bundle切割
      resolvePresetUmiPath('./features/codeSplitting/codeSplitting'),
      // 提供初始化配置的插件，处理了react，react dom等
      require.resolve('./plugins/configPlugins'),
      // 通过 crossOriginLoading 配置项，你可以为动态加载的 chunks 设置 crossorigin 属性，去除，通过crossorigin配置来使用
      // resolvePresetUmiPath('./features/crossorigin/crossorigin'),
      // 其他插件中调用api.addOnDemandDeps，可以将依赖添加到项目package.json中
      resolvePresetUmiPath('./features/depsOnDemand/depsOnDemand'),
      // 在bundle完成之前，给出一个loading页；去除，和bundler client绑定
      // resolvePresetUmiPath('./features/devTool/devTool'),
      // 检测esbuild产物，防止不规范，不需要
      // resolvePresetUmiPath(
      //   './features/esbuildHelperChecker/esbuildHelperChecker',
      // ),
      // vite的，不需要
      // resolvePresetUmiPath('./features/esmi/esmi'),
      // 针对每个路由生成html文件，暂不需要
      // resolvePresetUmiPath('./features/exportStatic/exportStatic'),
      // 改用rsbuild能力
      // resolvePresetUmiPath('./features/favicons/favicons'),
      // 集成helmet能力
      resolvePresetUmiPath('./features/helmet/helmet'),
      // 自动安装Icon，不需要
      resolvePresetUmiPath('./features/icons/icons'),
      // mock本地文件，需要
      resolvePresetUmiPath('./features/mock/mock'),
      // mpa，暂不支持
      // resolvePresetUmiPath('./features/mpa/mpa'),
      // mako，暂不需要
      // resolvePresetUmiPath('./features/okam/okam'),
      // 覆盖写入less，saas，css
      resolvePresetUmiPath('./features/overrides/overrides'),
      // 检测幻影依赖
      resolvePresetUmiPath('./features/phantomDependency/phantomDependency'),
      // babel polyfill，引用corejs，弃用，改用rsbuild能力
      // resolvePresetUmiPath('./features/polyfill/polyfill'),
      // ie兼容，去除
      // resolvePresetUmiPath('./features/polyfill/publicPathPolyfill'),
      // 准备工作，暂时去除
      // resolvePresetUmiPath('./features/prepare/prepare'),
      // 路由预加载
      resolvePresetUmiPath('./features/routePrefetch/routePrefetch'),
      // 用于在开发阶段在浏览器向 node 终端输出日志的工具；client不支持，先删除
      // resolvePresetUmiPath('./features/terminal/terminal'),

      // 生成临时文件用，有部分代码写死，需要改进
      // 1. generate tmp files
      resolvePresetUmiPath('./features/tmpFiles/tmpFiles'),
      // 路由数据预加载
      // 2. `clientLoader` and `routeProps` depends on `tmpFiles` files
      resolvePresetUmiPath('./features/clientLoader/clientLoader'),
      // 生成routerProps
      resolvePresetUmiPath('./features/routeProps/routeProps'),
      // ssr绑定了固定的bundler，需要去除。支持的话需要单独为rsbuild写
      // 3. `ssr` needs to be run last
      // resolvePresetUmiPath('./features/ssr/ssr'),
      // 生成configSchema，用于config配置校验
      resolvePresetUmiPath('./features/tmpFiles/configTypes'),
      // 收集文件的依赖，目前在check插件中使用。但是实际上用的babel，需要改为swc
      // resolvePresetUmiPath('./features/transform/transform'),
      // Low Import 研发模式。 这是 Umi 4 的试验性功能之一，目前已开发完成，解的问题是让开发者少些或不写 import 语句。项目中大量的 import 其实都可以通过工程化的方式自动处理。Umi 4 里通过 lowImport:{' '} {} 开启，然后就可以无 import 直接用路由相关的 Link、useLocation 等，数据流相关的 connect、useModel，antd 组件 Button、Calendar 等，以及其他更多
      // 暂时已关闭，使用了babel，之后改成swc
      // resolvePresetUmiPath('./features/lowImport/lowImport'),
      // 不需要vite
      // resolvePresetUmiPath('./features/vite/vite'),
      // api路由+serverless，暂不支持
      // resolvePresetUmiPath('./features/apiRoute/apiRoute'),
      // monorepo的redirect功能
      resolvePresetUmiPath('./features/monorepo/redirect'),
      resolvePresetUmiPath('./features/test/test'),
      resolvePresetUmiPath('./features/clickToComponent/clickToComponent'),
      // 兼容至IE 11，可删除
      // resolvePresetUmiPath('./features/legacy/legacy'),
      // 开启babel  class properties loose，使用了babel，需要重新写为rsbuild
      // resolvePresetUmiPath(
      //   './features/classPropertiesLoose/classPropertiesLoose',
      // ),
      // 调用了webpack，改用rsbuild
      // resolvePresetUmiPath('./features/webpack/webpack'),
      // 启用swc，去掉，改用rsbuild
      // resolvePresetUmiPath('./features/swc/swc'),
      // umi ui
      resolvePresetUmiPath('./features/ui/ui'),
      // resolvePresetUmiPath('./features/mako/mako'),
      // hmr模式下才启用，有使用babel，需要去除
      // resolvePresetUmiPath('./features/hmrGuardian/hmrGuardian'),
      resolvePresetUmiPath('./features/routePreloadOnLoad/routePreloadOnLoad'),
      // react 19 forget能力，暂时去除
      // resolvePresetUmiPath('./features/forget/forget'),

      // commands
      // build和dev改用自己的，调用rsbuild
      require.resolve('./commands/build'),
      require.resolve('./commands/dev'),
      resolvePresetUmiPath('./commands/help'),
      resolvePresetUmiPath('./commands/config/config'),
      resolvePresetUmiPath('./commands/lint'),
      // 读取配置，生成临时文件在src/${tmpPath}下面
      resolvePresetUmiPath('./commands/setup'),
      resolvePresetUmiPath('./commands/deadcode'),
      resolvePresetUmiPath('./commands/version'),
      resolvePresetUmiPath('./commands/generators/page'),
      resolvePresetUmiPath('./commands/generators/prettier'),
      resolvePresetUmiPath('./commands/generators/tsconfig'),
      resolvePresetUmiPath('./commands/generators/jest'),
      resolvePresetUmiPath('./commands/generators/tailwindcss'),
      resolvePresetUmiPath('./commands/generators/dva'),
      resolvePresetUmiPath('./commands/generators/component'),
      resolvePresetUmiPath('./commands/generators/mock'),
      resolvePresetUmiPath('./commands/generators/cypress'),
      resolvePresetUmiPath('./commands/generators/api'),
      resolvePresetUmiPath('./commands/generators/precommit'),
      resolvePresetUmiPath('./commands/plugin'),
      resolvePresetUmiPath('./commands/verify-commit'),
      resolvePresetUmiPath('./commands/preview'),
      // 暂不提供mfsu
      // resolvePresetUmiPath('./commands/mfsu/mfsu'),
      resolvePresetUmiPath('@umijs/plugin-run'),
    ],
  };
};
