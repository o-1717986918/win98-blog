# 内容工作流

## 1. 新建

```powershell
pnpm content:new post stable-kebab-slug "文章标题"
pnpm content:new column stable-kebab-slug "主题标题"
```

命令只接受小写 kebab-case，并在 `src/content/posts|columns/<slug>/index.mdx` 创建草稿。图片、Astro 组件和文章私有样式放在同一目录；不要把仅供一篇内容使用的资产提升到全站目录。

## 2. 文章 frontmatter

| 字段 | 作用 |
|---|---|
| `title` / `description` | 列表、搜索和 SEO 的准确摘要 |
| `date` / `updated` | 首次发布与最近实质更新；`updated` 不得早于 `date` |
| `draft` | `true` 时仅开发预览可见 |
| `tags` | 主题标签；自动生成标签目录 |
| `columns` | 主题 ID 数组；至少保留一个真实主题引用 |
| `cover` | 可选的 `{ src, alt }` 真实图片；缺省时使用稳定的程序化校样封面，相对路径由 Astro 图片管线处理 |
| `chrome` | `full / minimal / none`，只表示装配的外壳资源 |
| `theme` | `mist / abyss`；旧名称仅作为迁移兼容输入，不再形成额外视觉主题 |
| `featured` | 精选标记，供策展排序扩展使用 |
| `comments` | `inherit / enabled / disabled`；外部 provider 未配置时仍不加载 |
| `noindex` | 输出搜索引擎 robots 指令 |
| `license` | 文章页尾许可说明 |

主题使用相同的 `chrome/theme/cover/draft`，另有 `accent`、`nav`、`navLabel`、`order` 与 `showPosts`。`accent` 可取 `aqua / coral / violet / gold`，文章在发现界面继承首个主题的 accent。主题不是文章层级，文章可以同时属于多个主题；`columns` 只是为兼容既有内容保留的内部字段名。

程序化封面只保证默认状态完整。重要内容应在内容目录中共置一张与正文有关的真实图片，并写具体 `alt`。`pnpm content:covers` 会检查尺寸、比例、可读性与默认封面数量；详细比例与 none 边界见 `docs/handover/CONTENT_COVER_SYSTEM.md`。

正文可从 `src/components/content/` 显式导入 `Callout.astro`、`DataChart.astro` 与 `CodePlayground.astro`。图表必须同时提供准确的标题、说明和数据；代码预览只适合可以在无同源权限 iframe 中运行的前端片段。

标准 full/minimal 文章会自动把正文包入 Pagefind 索引边界。`none` 文章自行控制 DOM，仍需在希望被搜索的正文容器上写 `data-pagefind-body`；否则页面只保留 SEO 元数据，不会把交互说明等整页外壳误收为正文。

## 3. 预览与发布

- `pnpm dev` 会显示草稿和未来日期内容，便于本地审阅；
- 正常 `pnpm build` 排除草稿和构建时刻之后的内容；日期按 ISO 时间解析，精确排期建议写完整时区，例如 `2026-09-01T09:00:00+08:00`；
- 需要生成包含未发布内容的私有预览时，设置 `PREVIEW_DRAFTS=true`，不得把该产物部署到公开生产环境；
- 发布前依次执行 `pnpm content:audit`、`pnpm content:covers` 与 `pnpm verify`；首次本地运行端到端测试需执行 `pnpm exec playwright install chromium`，之后可用 `pnpm test:e2e`。

## 4. 审查清单

1. 标题和摘要能独立表达文章价值，没有占位文案；
2. 内部链接存在，主题引用有效，图片都有具体替代文本；
3. 标题层级连续，表格和代码块在窄屏可滚动；
4. `none` 页面只显式导入自己需要的资源，并为可搜索正文声明 `data-pagefind-body`；
5. 更新文章时同步 `updated`，必要时在正文说明重大修订；
6. 合并通过 CI 后再由托管平台发布预览或生产版本。

## 5. 回滚

内容和配置都在 Git 中。错误发布优先回退对应提交并重新构建；不要在托管平台手改 `dist`。评论属于外部系统，回滚站点不会删除评论数据。
