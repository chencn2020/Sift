# Sift

> 一个本地优先的桌面端照片筛选工具，帮摄影师从成百上千张照片里更快找到值得交付的作品。

[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-blue)](https://github.com/chencn2020/Sift/releases)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri-24c8db)](https://tauri.app/)
[![Local First](https://img.shields.io/badge/privacy-local--first-30d158)](#隐私优先)
[![License: MIT](https://img.shields.io/badge/license-MIT-black)](LICENSE)

Sift 面向活动、婚礼、旅行、人像、会议等拍摄场景。很多摄影师一次活动会带回几百到几千张照片，其中包含连拍、重复图、虚焦、闭眼、表情不佳和需要按人物筛选的图片。Sift 的目标是把这个筛选过程做成一个快速、安静、可靠的桌面工作台。

English documentation: [README.md](README.md)

## 为什么做 Sift

筛片真正消耗时间的地方，不是判断某一张照片，而是要在大量相似照片里反复比较和取舍。

Sift 希望解决这些具体问题：

| 使用场景 | Sift 能帮你做什么 |
| --- | --- |
| 活动结束后导入整批照片 | 把一个拍摄文件夹变成可以持续管理的项目。 |
| 快速找出可交付照片 | 用选片、弃片和星级评分快速做第一轮筛选。 |
| 比较相似照片 | 在网格、聚焦和对比视图之间切换，处理连拍和相似构图。 |
| 围绕人物筛选 | 注册关键人物，为后续人物筛选和人脸识别做准备。 |
| 保护隐私 | 默认本地运行，不主动上传原图。 |

## 产品功能

- Windows 和 macOS 桌面端照片筛选体验。
- 按项目导入和管理大型拍摄文件夹。
- 网格浏览、聚焦查看、对比查看三种核心视图。
- 支持选片、弃片和星级评分。
- 支持注册人物参考照片。
- 最近项目、所有项目、最近删除和项目操作。
- 默认本地优先，不改动原图，不主动上传照片。
- 为后续本地 AI 模型预留清晰的产品路径。

## NEWS

| 日期 | 更新 |
| --- | --- |
| 2026-05-23 | 发布 `v0.1.0-alpha.1`，包含第一版本地优先桌面筛片工作流、项目库、个人资料编辑、注册人物、缩略图缓存和 README 重写。 |
| 2026-05-23 | 完成第一版 Tauri 桌面端外壳，支持 macOS / Windows 打包路径。 |
| 2026-05-23 | 加入项目导入、最近项目、项目菜单和最近删除。 |
| 2026-05-23 | 加入网格、聚焦、对比、键盘导航、评分、选片和弃片。 |
| 2026-05-23 | 加入注册人物流程，支持参考照片。 |
| 2026-05-23 | 加入本地构建流程和早期检查更新入口。 |

## TODO

下一阶段会重点加入 AI 能力：

- 人脸检测和人物匹配。
- 重复图片检测。
- 眨眼 / 闭眼检测。
- 照片质量评估：对焦、曝光、噪点、运动模糊。
- 美学评估大模型：构图、表情、画面观感、交付潜力。
- 连拍推荐：从一组相似照片里推荐最值得保留的一张。
- 本地模型管理；云端 provider 只作为用户明确开启的可选能力。
- 真正的导出流程：复制、转换和按规则整理已选照片。
- Windows / macOS 签名发布与自动更新。

## 怎么用

普通用户可以从 [GitHub Releases](https://github.com/chencn2020/Sift/releases) 下载对应的 Windows 或 macOS 安装包。

项目还处于早期阶段，如果暂时没有公开 Release，可以先从源码构建。

## 从源码构建

需要提前安装：

- Node.js 和 npm
- Rust toolchain，用于 Tauri
- Python 3，用于后续 sidecar 和测试

安装依赖：

```bash
npm install
```

开发模式运行桌面端：

```bash
npm run tauri:dev
```

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

## 隐私优先

Sift 的默认路径是本地优先：照片保留在用户自己的电脑上，筛选结果和项目状态单独保存，不会改写原图。未来如果加入云端 AI，也应该是用户显式开启、按项目授权的可选能力。

## 参与贡献

Sift 希望成为一个真正能帮到摄影师的开源项目。欢迎这些方向的贡献：

- 更贴近真实摄影师工作流的 UI 和交互。
- 大批量照片导入和浏览性能优化。
- Python AI 模型和本地推理能力。
- Windows / macOS 打包、签名和发布流程。
- 文档、截图、示例项目和真实使用反馈。

## Star History

| Star History |
| --- |
| [![Star History Chart](https://api.star-history.com/svg?repos=chencn2020/Sift&type=Date)](https://www.star-history.com/#chencn2020/Sift&Date) |

## License

Sift 使用 [MIT License](LICENSE)。
