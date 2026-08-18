# 七夕心愿礼 · JUDYDOLL 橘朵礼物挑选页

根据天猫「JUDYDOLL橘朵旗舰店」初步抓取的 **40 条商品** 生成的七夕心愿礼物挑选页。

## 页面说明

- **配文**：我们逛了逛多次，“想买”说了好多遍……现在不用看价格啦！
- 所有宝贝统一标价 **￥0.00元**。
- 可选 **3 件**心愿礼物，每件通过**下拉列表选择具体型号/色号**。
- 无需选择收件人、页面也不展示邮箱：点「确认心愿」即可，心愿清单自动发送至 **luyx@psych.ac.cn**。
  - **已接 Web3Forms 中转发信**（纯前端、无需后端）：部署到 GitHub Pages 等静态托管后，她点「确认心愿」即可静默发信，不依赖她设备的邮件客户端。
  - 未配置 key 时自动回退为 `mailto:`（依赖她设备邮件客户端）。

## 文件结构

```
judydoll-catalog/
├── index.html      页面入口
├── style.css       七夕主题样式
├── app.js          交互逻辑（选择、心愿单、邮件发送）
├── products.json   40 条商品数据（型号选项来自抓取的 SKU）
├── images/         商品主图（images/p01 ~ p40）
└── README.md
```

## 数据说明

- 数据来源：`judydoll_products (4).json`（店铺内搜索页抓取）。
- 每条商品包含：名称、分类、主图、SKU 型号选项、0.00 元价格、天猫商品链接。
- 第 2 条商品（五色遮瑕盘）源数据缺少主图，使用占位图兜底。

## 本地运行

直接双击 `index.html` 即可打开（浏览器需允许本地 `fetch`）。如遇浏览器限制，可启动本地静态服务：

```bash
cd judydoll-catalog
python -m http.server 8080
# 访问 http://localhost:8080
```

## 配置自动发信（Web3Forms）

网页用 Web3Forms 把清单静默发到 `luyx@psych.ac.cn`，无需自己写后端，部署到 GitHub Pages 后照常工作。

1. 打开 https://web3forms.com ，用接收邮箱 **luyx@psych.ac.cn** 注册/生成 access_key。
2. 把得到的 key 填进 `app.js` 顶部的 `WEB3FORMS_KEY = ''`（引号内）。
3. 未填写时自动回退为 `mailto:`，不影响页面其它功能。

## 部署到 GitHub Pages

整个目录是纯静态站点，可直接推到 GitHub 仓库并开启 Pages：

```bash
git init
git add .
git commit -m "七夕心愿页"
git branch -M main
git remote add origin <你的仓库地址>
git push -u origin main
# 仓库 Settings → Pages → Source 选 main 分支 /(root)
```

部署后访问 `https://<用户名>.github.io/<仓库名>/` 即可。注意：图片为二进制（webp），正常 `git push` 即可，无大小问题。
