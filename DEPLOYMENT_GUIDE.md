# 🚀 GitHub Pages 部署指南 (针对设计师)

既然您已经有了 `tongfangsun.github.io` 这个域名，部署过程非常简单。

## 第一步：创建仓库
1. 登录 GitHub，创建一个名为 `tongfangsun.github.io` 的**公共 (Public)** 仓库。
2. **不要**勾选 "Initialize this repository with a README"。

## 第二步：上传代码
您可以选择两种方式：

### 方法 A：直接网页上传 (最简单)
1. 在您的仓库页面点击 "Upload files"。
2. 将我为您提供的所有文件和文件夹上传到根目录。
   - `_config.yml`
   - `index.html`
   - `about.md`
   - `blog.md`
   - `projects.html`
   - `_layouts/` (文件夹)
   - `_projects/` (文件夹)
   - `_posts/` (文件夹)
   - `assets/` (文件夹)

### 方法 B：使用 Git 命令行 (专业)
```bash
git clone https://github.com/tongfangsun/tongfangsun.github.io.git
cd tongfangsun.github.io
# 将我生成的文件复制到此文件夹
git add .
git commit -m "Initial design commit"
git push origin main
```

## 第三步：开启 GitHub Pages
1. 进入仓库的 **Settings** -> **Pages**。
2. 在 "Build and deployment" 下，确保 Source 是 "Deploy from a branch"。
3. Branch 选择 `main` 目录 `/ (root)`。
4. 点击 Save。

## 第四步：等待上线
大约 1-3 分钟后，访问 `https://tongfangsun.github.io` 即可看到您的新主页！

---

## 🎨 如何自定义内容？
- **修改个人信息**：编辑 `_config.yml`。
- **添加新项目**：在 `_projects/` 文件夹下新建 `.md` 文件，参考 `project-one.md`。
- **写博客**：在 `_posts/` 文件夹下新建文件，文件名必须遵循 `YYYY-MM-DD-title.md` 格式。
- **调整设计**：编辑 `assets/css/style.css`。
