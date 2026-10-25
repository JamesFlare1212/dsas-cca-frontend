# DSAS CCA

DSAS 课外活动目录，使用 **Svelte 5 + SvelteKit 3 + Vite 8 + Tailwind CSS 4 + shadcn-svelte + Bun + TypeScript** 构建。

## 功能

- 活动目录：默认展示 API 返回的最新学年，支持分类、学年、年级和学生 / 教职工带领筛选。
- 支持英文 / 中文名称、活动 ID 的模糊搜索、排序、网格 / 列表视图与分页。
- 活动详情：中英文介绍、全部场次、地点、活动时间、负责人、费用、要求、材料和恶劣天气安排。
- 收藏清单：保存在当前浏览器，支持搜索、分页和跨标签页同步，不需要账户。
- 分享活动及筛选链接，支持刷新后恢复筛选。
- 教职工目录：按姓名或 ID 模糊搜索，分页与复制 ID。
- 支持浅色 / 深色模式、系统外观、键盘操作、手机筛选抽屉及减少动态效果偏好。
- API 请求包含超时、有限重试、取消过期筛选请求、详情去重和最多 6 个并发请求。

## 本地开发

推荐 Bun 1.4.4（锁文件与容器使用的版本）。

```bash
bun install --frozen-lockfile
bun run dev
```

开发地址：`http://localhost:5173`。

```bash
bun run check          # Svelte 与 TypeScript 检查
bun test               # 请求、搜索、数据兼容和收藏存储测试
bun run format:check   # 格式检查
bun run build          # 静态预渲染到 dist/
bun run preview        # 预览生产构建
```

## 数据与配置

默认连接现有公开 API：`https://dsas-cca.jamesflare.com/v1`，不包含模拟活动或虚构的教职工资料。

复制 `example.env` 到 `.env` 后可修改：

- `PUBLIC_API_BASE_URL`：公开的 API 基础地址，在构建时写入客户端；更改后需要重新构建。API 必须允许站点域名的浏览器跨域请求。
- `PORT`：Docker 对外端口，默认 `3040`。
- `APP_IMAGE`：Docker 部署镜像，默认 `ghcr.io/jamesflare1212/dsas-cca-frontend:latest`。
- `WATCHTOWER_POLL_INTERVAL`：自动检查镜像更新的间隔，默认 `300` 秒。
- `WATCHTOWER_DOCKER_API_VERSION`：Watchtower 使用的 Docker API 版本，默认 `1.44`。

活动和教职工数据在浏览器中请求，构建阶段无需访问 API。空白费用显示为“Not specified”，不会被标记为免费。收藏只保存在当前设备的浏览器中，不代表已完成学校活动注册。

年级筛选与分享链接统一使用后端编码：KG1=`-2`、KG2=`-1`、KG3=`0`，G1–G12=`1`–`12`。例如 `/?year=2026%2F2027&grade=0` 会恢复 KG3 筛选并发送 `grade=0`；卡片和详情将 `-1..0` 显示为 `KG2–KG3`。

首页照片取自现有活动数据，作为本地 AVIF 资源存放在 `static/images/`；目录照片仍使用 API 返回的地址。

## Docker 部署

采用与[后端](https://github.com/JamesFlare1212/dsas-cca-backend)一致的部署流程：GitHub 推送 → CI 检查与容器冒烟 → 发布 GHCR 镜像 → Watchtower 检测更新并重建前端容器。需要 Docker 25+ 和 Compose v2 或更高版本。

首次部署先复制配置；已有 `.env` 时保留原文件，对照 `example.env` 补全配置：

```bash
cp example.env .env
docker compose config --quiet
docker compose pull
docker compose up --detach
docker compose ps
curl --fail http://127.0.0.1:3040/healthz
```

Bun 构建后由 Nginx 提供静态页面，默认地址为 `http://localhost:3040`。容器内固定监听 `80`，`.env` 中的 `PORT` 仅修改宿主机端口；修改后需要同步调整上面的请求地址。已配置 `/staff/`、`/saved/` 的直接访问、404 页面、预压缩文件及不可变资源缓存。`/healthz` 和 Docker HEALTHCHECK 检查前端服务是否存活，不检查后端 API。

默认部署直接使用预构建镜像，不需要服务器安装 Bun 或下载源码依赖。首次使用须等默认分支 CI 的 `publish` 任务完成。新建 GHCR 包可能为私有；需要匿名拉取时，在[包设置](https://github.com/users/JamesFlare1212/packages/container/package/dsas-cca-frontend)中将其设为 Public。

**API 地址在构建时固定。** 官方预构建镜像使用 `https://dsas-cca.jamesflare.com/v1`。只修改部署 `.env` 中的 `PUBLIC_API_BASE_URL` 不会改变已构建镜像，需要按下方步骤从源码构建。API 地址必须能被用户浏览器访问，例如公开的 HTTPS 地址；不要填入 Compose 内部的服务名。后端的 `ALLOWED_ORIGINS` 需允许前端站点的完整 Origin。

### 自动更新与回滚

`latest` 跟随原仓库默认分支。CI 只对原仓库默认分支的推送发布，PR、fork、其他分支及手动运行只执行检查；每次还发布 `sha-<完整提交 SHA>` 标签用于回滚。当前 CI 发布 `linux/amd64` 镜像；其他架构请使用源码构建。

Watchtower 默认每 300 秒检查一次，通过标签和 Compose 项目 scope 仅更新当前前端项目的 `app`。前后端使用不同 scope，可以部署在同一 Docker 主机。Watchtower 自身不自动更新，日志有大小和文件数限制。

```bash
docker compose logs --tail=100 app watchtower
docker compose stop watchtower             # 暂停自动更新
docker compose up --detach watchtower      # 恢复自动更新
```

Watchtower 需要挂载宿主机 Docker socket；更新会重建容器，可能短暂中断服务，不提供自动回滚。同一主机上的其他 Watchtower 也应设置独立 scope，全局实例使用 `--scope none`，避免互相清理实例。沿用后端固定的 Watchtower 1.7.1 及镜像摘要；若主机拒绝 API 1.44，根据 `docker version` 调整 `WATCHTOWER_DOCKER_API_VERSION`。

修改 `.env` 或 Compose 文件后，执行 `docker compose up --detach` 应用配置。回滚时将 `APP_IMAGE` 改为已发布的 `ghcr.io/jamesflare1212/dsas-cca-frontend:sha-<完整 SHA>`，再执行：

```bash
docker compose pull app
docker compose up --detach app
```

固定 SHA 标签不会跟随新的分支发布。

### 从源码构建与自定义 API

在 `.env` 设置 `PUBLIC_API_BASE_URL`，然后启用本地构建覆盖文件：

```bash
docker compose --project-name dsas-cca-frontend-local -f docker-compose.yaml -f docker-compose.build.yaml up --build --detach
```

此模式使用 `dsas-cca-frontend:local`，关闭该应用的自动更新，Watchtower 默认不启动；更改 API 地址后重新运行相同命令即可。后续 `logs`、`down` 等命令也需带上相同的项目名和两个 `-f` 参数。若与镜像部署同时运行，请设置不同的 `PORT`。从已有部署切换到本地构建时，先使用原项目的 Compose 命令执行 `down`，避免端口冲突。

Docker 构建固定 Bun 1.4.4、Nginx 1.30.6 及多架构镜像摘要，使用锁文件安装依赖；构建上下文仅允许构建所需的源文件，排除 `.env`、登录凭据、宿主机依赖和本地工具配置。

### 私有 GHCR 镜像

保留私有包时，在服务器终端使用有 `read:packages` 权限的凭据登录。独立 Docker 配置同时供 Compose 和 Watchtower 使用：

```bash
mkdir -p .watchtower-auth
chmod 700 .watchtower-auth
docker --config ./.watchtower-auth login ghcr.io --username JamesFlare1212
docker --config ./.watchtower-auth compose -f docker-compose.yaml -f docker-compose.auth.yaml pull
docker --config ./.watchtower-auth compose -f docker-compose.yaml -f docker-compose.auth.yaml up --detach
```

`.watchtower-auth/` 已加入 Git 忽略。Watchtower 只读挂载整个配置目录，续期后可读取更新的 `config.json`；不要将该目录或凭据提交到仓库。

### CI 与容器验证

`.github/workflows/ci.yml` 执行类型检查、单元测试、格式检查、Compose 配置校验以及实际生产镜像构建。容器冒烟在禁用网络的容器中验证首页、教职工页、收藏页、HTTP 404、健康检查、缓存和 gzip，不访问真实 API。通过后发布同一份已验证镜像，提供 `latest` 和 `sha-<完整 SHA>` 标签。

本地有 Docker 权限时可执行同样的容器检查：

```bash
docker build --tag dsas-cca-frontend:ci .
sh scripts/test-container.sh dsas-cca-frontend:ci
```

Actions 固定提交 SHA，Dependabot 每周检查 Bun、Docker、Compose 和 Actions 更新。升级 Bun 时同步更新 `package.json`、Dockerfile、CI 与 README 中的版本。

也可将 `dist/` 部署到其他静态站点服务。服务需要支持目录内的 `index.html`，并将未知路径返回为 HTTP 404，使用生成的 `404.html`。

## 项目结构

```text
src/routes/                  页面、共享布局与错误页
src/lib/components/          页面组件
src/lib/components/ui/       shadcn-svelte 组件源码
src/lib/api.ts               真实 API 与请求调度
src/lib/catalog.ts           搜索、筛选与展示逻辑
src/lib/saved.svelte.ts      收藏状态
src/lib/saved-storage.ts     收藏持久化解析
src/app.css                  主题变量、Tailwind 与响应式布局
static/                      图标与本地照片
tests/                       Bun 测试
components.json              shadcn-svelte 配置
```

主题与布局在 `src/app.css` 中管理。组件使用 Nova 预设和 Lucide 图标，按 SvelteKit 3 规范通过 `#lib` 导入；组件的别名以 `components.json` 为准。

## shadcn-svelte MCP 与 Skill

项目已配置以下 AI 开发工具：

- **官方 Skill**：`.agents/skills/shadcn-svelte/`，来自
  [huntabyte/shadcn-svelte](https://github.com/huntabyte/shadcn-svelte/tree/6149e14107a9de3530a3083de2f1b7623b3c5d1f/skills/shadcn-svelte)，
  固定于提交 `6149e14107a9de3530a3083de2f1b7623b3c5d1f`，包含完整参考文件。
- **社区 MCP**：[Michael-Obele/shadcn-svelte-mcp](https://github.com/Michael-Obele/shadcn-svelte-mcp)，
  使用本地 stdio 服务 `npx -y shadcn-svelte-mcp@1.14.0`，提供组件列表、文档、搜索、Lucide 图标及 Bits UI API 查询。

需要 Node.js >= 20.9、npm/npx，以及访问 npm 和官方文档站点的网络连接。
首次启动时 npx 会下载固定版本；后续使用本机 npm 缓存。MCP 不作为网站运行时依赖。

项目级配置入口：

- Codex：`.codex/config.toml`。在受信任的项目中重新启动会话后加载，通过 `/mcp` 检查连接。
- Claude Code：`.mcp.json`。重新启动会话后通过 `/mcp` 检查连接。
- VS Code Copilot：`.vscode/mcp.json`。执行 `MCP: List Servers`，启动 `shadcn-svelte`。

支持 `.agents/skills` 的助手可在下一轮对话中发现 Skill。更新时重新从官方仓库安装整个 Skill 目录，并记录新的提交；升级 MCP 时同步修改以上三个配置中的版本号。

网站已完成从 Astro + React 到 SvelteKit 的迁移，并已配置 `components.json`。本地组件通过官方 CLI 安装：

```bash
bunx --bun shadcn-svelte@latest add <component>
```

CLI 增加组件时可能提示是否覆盖已存在的依赖组件。保留已定制的组件，并检查生成的导入与 `components.json` 中的别名一致。
