# 前端部署文档（sell-front）1

> 目标：把本前端项目构建为静态站点并部署到宝塔 `web.mia-fly.cn`。

## 1. 线上架构（现状）

| 项 | 值 |
|---|---|
| 站点域名 | `web.mia-fly.cn` |
| 静态根目录 | `/www/wwwroot/web.mia-fly.cn`（宝塔/nginx 托管） |
| 后端 API | `https://api.mia-fly.cn/api`（由 nginx 反代到后端容器 4000 端口） |
| 构建产物 | `dist/` 目录（`index.html` + `assets/`） |

前端通过构建时的环境变量 `VITE_API_BASE` 决定运行时调用的 API 地址，**所以"切线上接口"只需在构建时设对这个值**，无需改代码。

## 2. 构建（关键：设置 API 地址）

```bash
cd sell-front   # 本仓库根目录（含 package.json / src）

# 线上环境：API 指向 api.mia-fly.cn
VITE_API_BASE=https://api.mia-fly.cn/api npm run build

# 本地联调：API 指向本机后端（默认 /api 代理到 localhost:4000）
npm run build
# 或直接 npm run dev
```

构建产物输出到 `dist/`。

> ⚠️ 务必确认 `dist/index.html` 里引用的 `assets/*.js` 中包含了 `api.mia-fly.cn/api`，说明线上接口已正确打入。

## 3. 一键部署（推荐）

前端不单独部署——它由**后端仓库的 `deploy.py` 统一打包并上传**。只要在后端的 `deploy.py` 里正确指向本仓库（默认 `../sell-front/---`），运行一次即可同时完成前后端上线：

```bash
# 在后端仓库目录执行
cd ../sell-server
DEPLOY_PW='服务器密码' python deploy.py
```

脚本会自动：用 `VITE_API_BASE=https://api.mia-fly.cn/api` 构建本前端 → 打包 `dist` → 上传 → 解压到 `/www/wwwroot/web.mia-fly.cn`。

## 4. 手动部署（不用脚本时）

```bash
# 1) 本地构建
VITE_API_BASE=https://api.mia-fly.cn/api npm run build

# 2) 打包 dist
cd dist && zip -r /tmp/sell-front-dist.zip . && cd ..

# 3) 上传到服务器并解压（需 sudo，因为 www 目录属主为 www）
scp /tmp/sell-front-dist.zip workuser@139.224.162.142:/tmp/
ssh workuser@139.224.162.142
sudo bash -c '
  FDIR=/www/wwwroot/web.mia-fly.cn
  cp -r $FDIR /tmp/web.mia-fly.cn.bak.$(date +%s)
  rm -rf $FDIR/assets $FDIR/index.html
  unzip -o /tmp/sell-front-dist.zip -d $FDIR
  chown -R www:www $FDIR/assets $FDIR/index.html
'
```

> 保留服务器上的 `.htaccess` / `.user.ini` / `.well-known` / `404.html` 等由宝塔管理的文件，不要整体删除 `web.mia-fly.cn` 目录。

## 5. 验证

- [ ] `https://web.mia-fly.cn` 可访问，标题正确
- [ ] 登录后接口调用走 `https://api.mia-fly.cn/api/*`（浏览器 DevTools → Network 确认）
- [ ] 增删改查数据正常

## 6. 注意事项

- 前端是纯静态站，**无状态、无本地数据**，部署只需覆盖 `index.html` + `assets/` 即可，风险低。
- 若需 SPA 路由（history 模式）刷新不 404，需宝塔/nginx 对 `web.mia-fly.cn` 配置 `try_files $uri /index.html`；当前构建为默认配置，按需要使用。
- 构建环境变量 `VITE_API_BASE` 必须以 `/api` 结尾（如 `https://api.mia-fly.cn/api`），前端代码在路径后拼接具体接口。
