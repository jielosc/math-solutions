# 数学题解仓库

把 HTML 放在这个文件夹里，发布到 GitHub Pages。不会生成网页或改写你的 HTML。

## 日常使用

1. 双击 `start-auto-publish.cmd`，在后台开启自动发布。
2. 把 HTML 拖进仓库根目录，或任意子文件夹。图片、CSS、JS 等配套文件保持原来的相对路径一起放入。
3. 文件连续 6 秒没有变化后，工具会自动提交并推送，GitHub Actions 随后部署。
4. 双击 `stop-auto-publish.cmd` 可停止；重启电脑后需再次开启。电脑离线时会每 30 秒重试上传。

不开监听时，可以双击 `publish-now.cmd` 手动发布一次。监听已启动时，手动发布会提示已有进程，避免重复提交。

发布的是公开网站。自动上传范围：HTML、CSS、JS、常见图片、PDF 和字体文件；删除这些文件也会同步。隐藏文件夹、`private/`、`scripts/`、`tests/` 和其他文件类型不自动上传。工作流和工具本身的修改需要手动提交。

## 访问地址

- 网站地址：`https://jielosc.github.io/math-solutions/`
- GitHub 仓库：`https://github.com/jielosc/math-solutions`
- `index.html`：网站首页。
- `一道题.html`：网站地址后加 `一道题.html`。
- `微积分/第一题.html`：网站地址后加 `微积分/第一题.html`。

没有 `index.html` 时，网站根地址会返回 404，单个 HTML 的链接仍可使用。仓库暂时没有网页，第一次放入 HTML 后才会部署。

## 环境与故障排查

需要 Git、Node.js 22+，以及有推送权限的 GitHub 登录。当前分支必须是 `main`。

- 发布记录：`.local/watch.log`；启动错误：`.local/watch-error.log`。
- 登录失效：运行 `gh auth login -h github.com -p https -w`，然后 `gh auth setup-git`。
- 已有暂存文件或合并冲突时会暂停自动发布；处理后重试。
- GitHub 有别人推送的新提交时不会强制覆盖；停止监听后先运行 `git pull --rebase`，解决冲突，再启动监听。
- 网页引用请使用相对路径（例如 `./images/figure.png`）；以 `/` 开头的路径指向域名根目录。

GitHub Pages 使用 GitHub Actions 作为发布源，配置参考 [GitHub 官方文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
