# 项目结构说明

这个仓库现在是“原生页面 + 少量 React islands + Tailwind 结构迁移并存”的状态。

后续继续开发时，优先按下面的规则放代码，避免再次混乱。

## 1. 页面入口

- [index.html](/Users/mac/Documents/vibcoding/前端作品集主介绍废弃/index.html)
  - 首页页面骨架
  - 适合放 section 结构、语义节点、稳定的 Tailwind 结构/布局类

- [project.html](/Users/mac/Documents/vibcoding/前端作品集主介绍废弃/project.html)
  - 项目详情页骨架

- [script.js](/Users/mac/Documents/vibcoding/前端作品集主介绍废弃/script.js)
  - 原生模块统一启动入口

## 2. 原生站点运行层

- [js/site-config.js](/Users/mac/Documents/vibcoding/前端作品集主介绍废弃/js/site-config.js)
  - 站点配置主源
  - 首页内容、资源列表、项目总表、模块配置优先改这里
  - 如果是“数据/配置”，先想能不能放这里

- [js/site-runtime.js](/Users/mac/Documents/vibcoding/前端作品集主介绍废弃/js/site-runtime.js)
  - 运行时基础能力

- [js/site-sections.js](/Users/mac/Documents/vibcoding/前端作品集主介绍废弃/js/site-sections.js)
  - 页面 section / node 查询缓存
  - 首页结构查询主入口，后续不要再额外加一层 layout bridge

- [js/site-utils.js](/Users/mac/Documents/vibcoding/前端作品集主介绍废弃/js/site-utils.js)
- [js/site-helpers.js](/Users/mac/Documents/vibcoding/前端作品集主介绍废弃/js/site-helpers.js)
  - 通用工具函数

## 3. 原生交互模块

目录：

- [js/modules](/Users/mac/Documents/vibcoding/前端作品集主介绍废弃/js/modules)

这里放首页原生交互和动画模块，例如：

- `head-tracker`
- `hero-text-float`
- `logo-physics`
- `photo-reveal`
- `portfolio-featured`
- `portfolio-infinite-cards`

规则：

- 新增“原生交互模块”就放这里
- 这类文件通常依赖现有 DOM、CSS 基线和动画初始状态
- 不要把它们当普通静态样式随便清理

## 4. React islands / 组件层

目录：

- [src](/Users/mac/Documents/vibcoding/前端作品集主介绍废弃/src)

主要包括：

- React 挂载入口
- React 小组件
- React 版卡片/光标/菜单图标
- 项目详情页 React 逻辑

重点文件：

- [src/bootstrap.jsx](/Users/mac/Documents/vibcoding/前端作品集主介绍废弃/src/bootstrap.jsx)
  - 首页 React 挂载入口

- [src/project-page-entry.jsx](/Users/mac/Documents/vibcoding/前端作品集主介绍废弃/src/project-page-entry.jsx)
  - 详情页 React 入口

- [src/projectCatalog.js](/Users/mac/Documents/vibcoding/前端作品集主介绍废弃/src/projectCatalog.js)
  - React 侧项目数据入口
  - 现在优先读取 `window.__siteConfig.projectCatalog`

## 5. 样式分层

- [styles.css](/Users/mac/Documents/vibcoding/前端作品集主介绍废弃/styles.css)
  - 全局主样式
  - 保留：
    - 全局 token
    - 字体定义
    - 动画基线
    - 特殊视觉模块
    - 原生交互依赖样式

- [src/app.tailwind.css](/Users/mac/Documents/vibcoding/前端作品集主介绍废弃/src/app.tailwind.css)
  - Tailwind 入口

规则：

- 结构层 / 布局层 / 响应式层，优先继续往 Tailwind 收
- 动画初始化样式、交互 transform 基线、特殊标题效果，优先留在 `styles.css`
- 原先那层 `homeLayout / site-layout` 桥接已经移除，布局直接以 HTML 结构 + Tailwind 类为准

## 6. 资源目录

- [imag](/Users/mac/Documents/vibcoding/前端作品集主介绍废弃/imag)
  - 当前主图片资源目录

- [font](/Users/mac/Documents/vibcoding/前端作品集主介绍废弃/font)
  - 字体资源

- [vendor](/Users/mac/Documents/vibcoding/前端作品集主介绍废弃/vendor)
  - 第三方脚本资源

- [public](/Users/mac/Documents/vibcoding/前端作品集主介绍废弃/public)
  - 当前实际只保留 `favicon.png`，用于通过 Vite `publicDir` 直接透传

规则：

- 新页面图片优先放 `imag/`
- 新字体放 `font/`
- 新第三方脚本放 `vendor/`
- 不要再往 `public/` 塞一套镜像资源

## 7. 现在已经收成单点的内容

优先改这里，不要再在多处复制：

- 首页内容主源：`js/site-config.js -> homeContent`
- 首页模板差异：`js/site-config.js -> homeTemplates`
  - 当前主要保留 logo 资源这类“模板型列表”，不要再和 `homeContent` 重复放文案
- 预加载资源：`js/site-config.js -> preloader`
- 项目总表：`js/site-config.js -> projectCatalog`
  - 现在 `projectCatalog / logoItems / preloader` 已经共用同批资源源头，新增图片优先从这里串起来，不要再手写复制多份

## 8. 后续开发建议

如果你要继续加功能，先判断属于哪类：

- 配置/文案/资源列表
  - 先改 `js/site-config.js`

- 原生首页交互
  - 放 `js/modules/`

- React 小组件 / React 页面逻辑
  - 放 `src/`

- 静态结构 / section 布局
  - 优先改 `index.html` / `project.html` + Tailwind 类

- 动画基线 / 特殊视觉效果
  - 优先留在 `styles.css`

## 9. 当前明确不要随便动的高风险区

这些地方改动前要特别小心：

- 首屏 head tracker
- hero 浮动字
- `play-title` 特殊标题效果
- `logo-wall` 掉落动画
- `photo-reveal`
- `bounce cards`
- `portfolio-featured` 卡片交互

因为它们都不是“普通样式”，而是依赖 DOM + CSS + JS 三者共同成立。
