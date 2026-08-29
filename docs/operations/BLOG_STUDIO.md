# Blog Studio 与学习笔记同步

Blog Studio 是仅在站主电脑上运行的维护面，不是公开网站的 `/admin`。它借用 IDE 的工作区结构，把内容树、Markdown/MDX 源文件、排版预览、笔记桥和固定质量门放在一张界面中；发布仍通过 Git 和既有部署流水线完成。

## 启动

```powershell
pnpm studio
```

终端会输出带一次性 token 的 `http://127.0.0.1:4317/` 地址。服务只绑定 loopback；API 要求该 token；文件读写被限制在 `src/content/posts`、`src/content/columns` 和 `src/content/notes`；工程命令使用白名单，不能从浏览器执行任意 Shell。关闭终端即关闭维护面。

## 内容维护

- 内容资源管理器读取文章、主题与学习笔记的 `index.md/mdx`。
- 保存先写临时文件再原子替换目标，降低中断造成半文件的风险。
- “新建”只建立草稿；文章仍需补齐主题引用、封面和正文后才能通过审计。
- 预览是安全的排版结构预览，不执行 MDX 私有组件。最终效果以本地 Astro 预览为准。
- 质量门包含内容审计、封面审计、单元测试、构建和完整验收。

## 从本地知识库同步

命令行：

```powershell
pnpm notes:sync -- --source "D:\Knowledge\Vault" --dry-run
pnpm notes:sync -- --source "D:\Knowledge\Vault"
```

也可以在 Studio 的 `NOTE BRIDGE` 输入同一个本机目录。同步器递归读取 Markdown/MDX，跳过隐藏目录，将 Wiki 链接转换为 `/notes/<slug>/`，将相对图片复制到笔记共置的 `assets/`，并写入 `.sync-manifest.json`。它不会删除目标中已有的其他内容。

只有源 frontmatter 明确包含 `publish: true`、`public: true` 或 `blog: true` 的笔记进入公开站点；其余条目可以同步到内容库，但公开页面会过滤。源文件绝对路径不会写入站点，只保留相对 `source`。同名或中文文件名使用稳定哈希避免 URL 漂移。

## 已知边界

- 同步是单向导入，不自动回写 Obsidian，也不做后台监听；需要站主主动触发。
- Wiki 嵌入支持常见图片语法，复杂 Obsidian 插件块仍保留为普通文本。
- 浏览器内预览不代表 Astro 构建成功。准备提交前必须运行 `pnpm verify`。
