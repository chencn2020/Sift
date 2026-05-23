<h1 align="center">Sift</h1>

<p align="center">
  <b>一个本地优先的桌面端照片筛选工具，帮摄影师从成百上千张照片里更快找到值得交付的作品。</b>
</p>

<img src="./imgs/Sift/home.png" alt="Sift desktop home screen" style="height: auto; width: 100%; margin-bottom: 3%;">

<div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; width: 100%;">
  <a href="https://github.com/chencn2020/Sift/releases"><img src="https://img.shields.io/badge/下载-Releases-238636" alt="Download Releases" style="max-width: 100%; height: auto;"></a>
  <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Built%20with-Tauri-24c8db" alt="Built with Tauri" style="max-width: 100%; height: auto;"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-PolyForm%20Noncommercial%201.0.0-blue" alt="PolyForm Noncommercial License" style="max-width: 100%; height: auto;"></a>
  <a href="./COMMERCIAL-LICENSE.md"><img src="https://img.shields.io/badge/Commercial%20Use-Separate%20License-orange" alt="Commercial license required" style="max-width: 100%; height: auto;"></a>
  <a href="https://github.com/chencn2020/Sift/stargazers"><img src="https://img.shields.io/github/stars/chencn2020/Sift.svg?style=social" alt="GitHub stars" style="max-width: 100%; height: auto;"></a>
</div>

:rocket: :rocket: :rocket: **News:**

- ✅ **2026 年 5 月 23 日**：撤回 `v0.1.0-alpha.1`，将 Sift 调整为非商用 source-available 授权，并准备 `v0.1.0-alpha.2`。
- ✅ **2026 年 5 月 23 日**：发布第一版桌面端预览工作流：项目库、网格筛片、聚焦查看、对比查看、评分、选片 / 弃片和人物注册。
- ✅ **2026 年 5 月 23 日**：加入本地项目持久化、浏览缩略图缓存、最近删除和早期 Windows / macOS 打包流程。
- ✅ **2026 年 5 月 23 日**：创建 Sift 仓库。

## TODO List

- [x] 发布第一版 macOS / Windows 桌面预览版。
- [x] 加入项目库、最近项目和最近删除。
- [x] 加入网格、聚焦、对比三种筛片视图。
- [x] 加入选片、弃片和星级评分。
- [x] 加入人物参考照片注册。
- [ ] 加入人脸检测和人物匹配。
- [ ] 加入重复图和连拍分组检测。
- [ ] 加入眨眼 / 闭眼检测。
- [ ] 加入照片质量和美学评估模型。
- [ ] 加入正式签名发布和生产可用自动更新。

## Contents

1. [Introduction](#Introduction)
2. [Try Sift](#Try-Sift)
3. [Run Sift](#Run-Sift)
4. [Features](#Features)
5. [AI Roadmap](#AI-Roadmap)
6. [License](#License)
7. [Stars](#Stars)

English documentation: [README.md](README.md)

<div id="Introduction"></div>

## Introduction

<b>TL;DR:</b> Sift 面向活动、婚礼、旅行、人像、会议等拍摄场景，目标是把“大量照片筛选”做成一个快速、安静、可靠的桌面工作台。

筛片真正消耗时间的地方，不是判断某一张照片，而是要在大量相似照片里反复比较和取舍：连拍、重复图、虚焦、闭眼、表情不佳、人物筛选，都会拖慢交付节奏。

Sift 默认本地优先。原图保留在你的电脑上，筛选结果和项目状态单独保存；未来如果加入云端 AI，也应该是用户显式开启、按项目授权的可选能力。

<div id="Try-Sift"></div>

## Try Sift

从 GitHub Releases 下载最新预览版：

<a href="https://github.com/chencn2020/Sift/releases"><img src="https://img.shields.io/badge/下载-Sift%20Preview-238636?style=for-the-badge" alt="Download Sift preview" style="max-width: 100%; height: auto;"></a>

当前预览版目标：

- macOS 桌面端。
- Windows 安装包。
- 本地优先照片筛选工作流。

> [!IMPORTANT]
> Sift 目前仍处于早期 alpha。它适合体验产品方向和参与共建，AI 辅助筛片、正式签名和生产级自动更新仍在开发中。

<div id="Run-Sift"></div>

## Run Sift

### Preparation

安装依赖：

```bash
npm install
```

Tauri 开发还需要 Rust 和对应平台的原生构建工具。

### Development

本地运行桌面端：

```bash
npm run tauri:dev
```

### Build

构建本地桌面 App：

```bash
npm run tauri:build
```

运行检查：

```bash
npm run build
npm test
npm run python:test
cargo check --manifest-path src-tauri/Cargo.toml
```

<div id="Features"></div>

## Features

- 按项目导入和管理大型拍摄文件夹。
- 在网格视图中快速浏览照片。
- 在聚焦视图中查看单张大图、缩放和元数据。
- 在对比视图中从相似照片里快速做取舍。
- 支持选片和弃片。
- 支持照片和项目星级评分。
- 支持注册关键人物参考照片。
- 支持从最近删除中恢复项目。
- 默认本地优先，不改动原图，不主动上传照片。

<div id="AI-Roadmap"></div>

## AI Roadmap

Sift 的后续重点是本地 AI 辅助筛片：

- 人脸检测和人物匹配。
- 重复图片检测。
- 眨眼 / 闭眼检测。
- 对焦、曝光、噪点、运动模糊等质量评分。
- 构图、表情、画面观感、交付潜力等美学评估。
- 连拍推荐：从一组相似照片里推荐最值得保留的一张。
- 本地模型管理；云端 provider 只作为用户明确开启的可选能力。

<div id="License"></div>

## License

Sift 使用非商用 source-available 授权。

- 代码：[PolyForm Noncommercial License 1.0.0](./LICENSE)
- 文档、截图和媒体素材：[CC BY-NC 4.0](./LICENSE-DOCS.md)
- 商业使用：[需要单独商业授权](./COMMERCIAL-LICENSE.md)

公司内部使用、商业摄影工作室部署、转售、SaaS 集成、产品打包、二次商业分发等商业用途，不包含在公开仓库授权范围内。

> [!NOTE]
> `v0.1.0-alpha.1` 因 MIT 授权元数据不符合项目目标，已经从 GitHub Releases 撤回。后续版本使用以上非商用授权策略。

<div id="Stars"></div>

## Stars

<a href="https://star-history.com/#chencn2020/Sift&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=chencn2020/Sift&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=chencn2020/Sift&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=chencn2020/Sift&type=Date" />
 </picture>
</a>
