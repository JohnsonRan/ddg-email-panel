# DDG Email Panel

<a href='https://github.com/whatk233/ddg-email-panel/blob/main/README.md'>English</a>

> 开源的非官方 [DuckDuckGo Email Protection](https://duckduckgo.com/email) 面板。

![GitHub Repo stars](https://img.shields.io/github/stars/whatk233/ddg-email-panel?style=social)

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-black?style=for-the-badge&logo=Vercel&logoColor=white) ![GitHub](https://img.shields.io/github/license/whatk233/ddg-email-panel?style=for-the-badge) ![Docker Pulls](https://img.shields.io/docker/pulls/whatk233/ddg-email-panel?style=for-the-badge)


> **Warning**   
> DDG Email Panel 是一个由社区开源的 DuckDuckGo Email Protection 管理面板，虽然不属于 DuckDuckGo 官方 ，但我们仍然会尊重您的隐私，不会存储或出售任何个人信息。
> 
> 由于 DDG Email Panel 是一个开源项目，任何人都可以部署它。因此，我们无法保证公开部署的站点能被信任。为了确保您的隐私和安全，我们强烈建议您使用我们的托管的站点或自行部署 DDG Email Panel。

## ⭐ 特性
* 无需安装 DuckDuckGo 浏览器扩展
* 支持所有现代浏览器
* PWA
* 生成新的隐私别名
* **别名仓库** —— 生成过的别名都会保存在本地，可添加备注、标签和搜索，并支持 JSON 导出/导入备份
* **多账户管理** —— 可添加多个 `@duck.com` 账户并随时切换
* **账户概览** —— 加入时间、Cohort、已生成地址数量与转发地址
* **反向别名工具** —— 把收件人地址转换为 DuckDuckGo 反向别名，用 Duck 地址发起对话
* 服务端不存储任何用户信息
* 多语言支持（English、简体中文、日本語）
* 夜间模式

## 📒 Todo
* 修改转发地址
* DuckDuckGo Email 账户注销
* 服务端别名列表或删除 —— 无法实现，DuckDuckGo 的 API 只提供登录、面板和生成地址三个接口

## 🔐 数据存放在哪里
账户、别名、备注和标签**只保存在浏览器的 `localStorage` 中**，面板的服务端不会持久化这些数据，对外请求仅发往 DuckDuckGo 官方 API。清除浏览器数据会丢失仓库内容，请先在仓库页面使用「导出」备份。

## 🌏 在线使用
* [DDG Email Panel](http://ddgep.whatk.me/)
* [DDG Email Panel (vercel.app 子域名)](https://ddgep.vercel.app/)

## 🚀 快速部署
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwhatk233%2Fddg-email-panel&demo-title=DDG%20Email%20Panel&demo-description=DDG%20Email%20Panel%20is%20the%20open%20source%20unofficial%20DuckDuckGo%20Email%20Protection%20panel.&demo-url=https%3A%2F%2Fduckduckgo.email)

## ⚓ Docker 部署
```shell
docker run -d --restart=always -p 3000:3000 --name ddg-email-panel whatk233/ddg-email-panel
```

## 🔧 本地部署

### 环境要求
* Node.js 20.9 或更高版本（推荐 Node.js 24，Docker 镜像即使用该版本）
* 本仓库使用 pnpm 开发，npm 与 yarn 同样可用

```bash
git clone https://github.com/whatk233/ddg-email-panel.git
cd ddg-email-panel

#pnpm
pnpm install
pnpm build
pnpm start

#yarn
yarn install
yarn build
yarn start

#npm
npm install
npm run build
npm run start

```

### 技术栈
Next.js 16（pages router） · React 19 · Tailwind CSS 4 · jotai · next-i18next · TypeScript 6

> TypeScript 特意锁定在 6.x：当前的 `typescript-eslint` 尚未支持 TypeScript 7。

## ❤️ 支持
<a href='https://afdian.net/@whatk' target='_blank'>爱发电</a> · <a href='https://ko-fi.com/whatk' target='_blank'>Buy Me a Coffee</a>

## License
MIT

<hr />

Made with ♥ by <a href='https://whatk.me' target='_blank'>Whatk</a>
