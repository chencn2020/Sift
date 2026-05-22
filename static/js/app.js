/* ============================================================
   Sift — interactive prototype
   Vanilla JS state machine + render functions + key bindings.
   ============================================================ */

// ---------- State ----------
const state = {
  view: 'welcome',          // welcome | library | loupe | compare | people
  theme: 'dark',
  lang: 'cn',               // cn | en  (default Chinese)
  currentProjectId: null,
  selectedPhotoId: null,
  collection: 'all',
  filters: new Set(),
  thumbSize: 180,
  cmpLayout: 4,
  selectedPersonId: null,
  loupeIndex: 0,
  photos: [],
  sidebarCollapsed: false,
  inspectorCollapsed: false,
  profile: { name: null, avatar: null },
  gpu: true,
  aiRules: { 'best-of-burst': true, 'reject-eyes-closed': true, 'reject-blurry': true, 'reject-dups': false, 'pick-rated': false },
};

// ---------- i18n ----------
const STRINGS = {
  cn: {
    'crumb.back': '返回项目',
    'crumb.library': '图库', 'crumb.loupe': '聚焦', 'crumb.compare': '对比', 'crumb.people': '人物',

    'tb.export': '导出',

    'welcome.projects': '项目',
    'welcome.new': '+ 从文件夹新建',
    'welcome.drop': '将文件夹拖到这里',
    'welcome.browse-hint': '或按 <kbd>⌘O</kbd> 浏览',
    'welcome.recent': '最近',
    'welcome.sort.modified': '按修改时间',
    'welcome.sort.name': '按名称',
    'welcome.sort.size': '按大小',
    'welcome.add-project': '+ 新项目',
    'welcome.photos': '张照片',
    'welcome.in-progress': '进行中',

    'sb.head.library': '图库', 'sb.head.smart': '智能', 'sb.head.people': '人物',
    'sb.head.stacks': '堆栈', 'sb.head.tags': '标签',
    'sb.all': '全部', 'sb.picks': '已选', 'sb.rejects': '已弃', 'sb.unrated': '未评',
    'sb.smart.sharp': '清晰', 'sb.smart.blurry': '模糊',
    'sb.smart.eyes-closed': '闭眼', 'sb.smart.best': 'AI 连拍最佳',
    'sb.bursts': '连拍', 'sb.dups': '重复',
    'sb.tags.group': '合影', 'sb.tags.candid': '抓拍', 'sb.tags.detail': '细节',

    'tab.all': '全部', 'tab.picks': '已选', 'tab.rejects': '已弃', 'tab.unrated': '未评',
    'chip.sharp': '清晰', 'chip.eyes': '睁眼', 'chip.nodup': '非重复', 'chip.people': '+ 含人物',

    'common.person': '人物', 'common.unnamed': '未命名', 'common.more-unnamed': '其余',

    'insp.empty': '选择一张照片查看详情',
    'insp.h.camera': '相机', 'insp.body': '机身', 'insp.lens': '镜头',
    'insp.aperture': '光圈', 'insp.shutter': '快门', 'insp.iso': 'ISO', 'insp.time': '时间',
    'insp.h.ai': 'AI 质量',
    'insp.sharp': '清晰', 'insp.expo': '曝光', 'insp.noise': '噪点',
    'insp.eyes': '眼睛', 'insp.eyes.open': '✓ 睁眼', 'insp.eyes.closed': '✗ 闭眼',
    'insp.smile': '微笑',
    'insp.burst': '连拍', 'insp.burst.best': '★ AI 8 张连拍最佳',
    'insp.h.faces': '人脸', 'insp.no-faces': '未检测到人脸',
    'insp.h.tags': '标签', 'insp.add-tag': '+ 添加标签',
    'insp.tag.group': '合影', 'insp.tag.detail': '细节',

    'lou.pick': '✓ 选',
    'lou.reject': '✗ 弃',

    'cmp.title': '连拍 14:32 · 8 张',
    'cmp.suggests': 'AI 推荐',
    'cmp.as-best': '为最佳',
    'cmp.sharp': '清晰', 'cmp.eyes': '眼睛',
    'cmp.keep-best': '保留最佳 · 弃其余',
    'cmp.hint': '<kbd>1-9</kbd> 选择 · <kbd>Tab</kbd> 切布局 · <kbd>A</kbd> 保留最佳',
    'cmp.ai-best': 'AI 最佳',

    'ppl.head': '人物 · ',
    'ppl.register': '+ 注册人物',
    'ppl.registered': '已注册',
    'ppl.detected': '已检测',
    'ppl.unnamed': '个未命名',
    'ppl.merge': '合并', 'ppl.name': '命名', 'ppl.hide': '隐藏',
    'ppl.export': '↑ 导出该人物',
    'ppl.photos-suf': '张照片',

    'sb.tools': '工具', 'sb.size': '尺寸',
    'sb.sort.date': '排序：日期 ↓',
    'sb.sort.rating': '排序：评分',
    'sb.sort.score': '排序：AI 分',
    'sb.sort.name': '排序：名称',
    'mode.grid': '网格', 'mode.loupe': '聚焦', 'mode.compare': '对比',

    'export.title': '导出', 'export.photos': '张照片',
    'export.preset': '预设',
    'export.preset.web': 'Web · 1920px JPG · 80 质量',
    'export.preset.email': '邮件 · 1080px JPG · 70 质量',
    'export.preset.print': '打印 · 完整 TIFF',
    'export.preset.original': '原图',
    'export.dest': '目标位置', 'export.browse': '浏览',
    'export.naming': '命名', 'export.preview': '预览',
    'export.group': '分组方式',
    'export.group.none': '不分组', 'export.group.person': '按人物',
    'export.group.rating': '按评分', 'export.group.tag': '按标签',
    'export.group.hint': '→ 3 个子文件夹：Alice (142)、Bob (38)、Carol (67)',
    'export.watermark': '水印',
    'export.wm.br': '右下', 'export.wm.bl': '左下', 'export.wm.tr': '右上',
    'export.summary': '142 个文件 · 约 1.2 GB · 预计约 45 秒',
    'export.do': '导出',

    'tools.title': '工具 · 自动分析',
    'tools.quality': '质量评分', 'tools.quality.sub': '清晰度 · 曝光 · 噪点',
    'tools.eyes': '眼部检测', 'tools.eyes.sub': '睁眼 · 闭眼 · 眯眼',
    'tools.bursts': '连拍分组', 'tools.bursts.sub': '时间窗 + 相似度',
    'tools.faces': '人脸聚类', 'tools.faces.sub': '已注册 + 自动聚类',
    'tools.dups': '重复检测', 'tools.dups.sub': '感知哈希',
    'tools.smile': '微笑 / 情绪', 'tools.smile.sub': '可选',
    'tools.compose': '构图评分', 'tools.compose.sub': '可选',
    'tools.done': '完成', 'tools.idle': '空闲',
    'tools.config.sharp': '清晰阈值',
    'tools.config.burst': '连拍窗口',
    'tools.config.dup': '重复阈值',
    'tools.config.local': '所有模型本地运行（不上云）',
    'tools.rerun': '重新运行',

    'reg.title': '注册人物',
    'reg.name': '姓名', 'reg.name.ph': '例如：王小明',
    'reg.refs': '参考照片',
    'reg.drop': '拖入 1-5 张该人物的照片',
    'reg.drop.hint': '照片越多识别越准',
    'reg.do': '注册并查找',

    'cmdk.ph': '输入命令 —— 选所有清晰、导出已选、注册人脸…',
    'cmdk.quick': '快捷操作', 'cmdk.view': '视图',
    'cmdk.cmd1': '选择所有清晰且睁眼的照片',
    'cmdk.cmd2': '折叠所有连拍',
    'cmdk.cmd3': '导出当前选择',
    'cmdk.cmd4': '注册新人物',
    'cmdk.cmd5': '切换到网格',
    'cmdk.cmd6': '切换到聚焦',
    'cmdk.cmd7': '切换到对比',

    'set.title': '设置',
    'set.general': '通用', 'set.general.sub': '语言、外观、启动行为。',
    'set.storage': '存储', 'set.storage.sub': 'Sift 存放缓存与项目元数据的位置。',
    'set.people': '人物',
    'set.ai': 'AI 模型', 'set.ai.h': 'AI 模型',
    'set.ai.sub': '应用于新项目的默认设置；项目内可在「工具」面板单独覆盖。',
    'set.export': '导出', 'set.ex.h': '导出默认值',
    'set.ex.sub': '预填导出对话框，每次导出仍可单独调整。',
    'set.shortcuts': '快捷键',
    'set.shortcuts.head': '键盘快捷键',
    'set.shortcuts.sub': '大部分操作都有单键绑定，让你的手不离键盘。',
    'set.about': '关于',
    'set.about.app': 'AI 辅助的开源照片筛选工具。',
    'set.about.version': '版本',
    'set.about.repo': '在 GitHub 查看源代码',
    'set.about.license': '许可证 (MIT)',
    'set.about.changelog': '更新日志',
    'set.about.feedback': '反馈',

    'set.lang': '界面语言',
    'set.theme': '外观',
    'set.theme.light': '浅色', 'set.theme.dark': '深色', 'set.theme.system': '跟随系统',
    'set.startup': '启动时',
    'set.startup.welcome': '打开欢迎页',
    'set.startup.last': '打开上次的项目',
    'set.privacy': '隐私',
    'set.privacy.local': '所有 AI 模型在本机运行，绝不上传任何照片',
    'set.privacy.tel': '匿名遥测（仅崩溃报告）',

    'set.cache': '缓存路径',
    'set.cache.hint': '缩略图、AI 评分、感知哈希 —— 可放心删除，会自动重建。',
    'set.cache.clear': '清理缓存',
    'set.lib': '项目库路径',
    'set.lib.hint': '项目元数据、评分、已注册人脸 —— 已备份，请勿删除。',
    'set.disk': '磁盘占用',
    'set.disk.used': '已用',
    'set.disk.cache': '缓存', 'set.disk.meta': '元数据', 'set.disk.faces': '人脸',

    'set.ai.q': '质量', 'set.ai.q.sub': '清晰度 · 曝光 · 噪点（约 120 MB，本机 GPU）',
    'set.ai.eye': '眼部', 'set.ai.eye.sub': '睁眼 / 闭眼 / 眯眼',
    'set.ai.face': '人脸', 'set.ai.face.sub': '聚类 + 已注册比对',
    'set.ai.dup': '重复', 'set.ai.dup.sub': '感知哈希 + 容裁切',
    'set.ai.smile': '微笑', 'set.ai.smile.sub': '微笑 / 表情评分（可选）',
    'set.ai.compose': '构图', 'set.ai.compose.sub': '美学 / 构图评分（可选）',

    'set.ex.preset': '默认预设',
    'set.ex.naming': '默认命名',
    'set.ex.wm': '水印', 'set.ex.wm.use': '应用于所有导出',

    'set.faces.head': '已注册人物',
    'set.faces.sub': '跨所有项目使用的参考人脸。多上传几张参考可以提升识别准确度。',
    'set.faces.add': '+ 注册新人物',
    'set.faces.rename': '重命名',
    'set.faces.delete': '删除',
    'set.faces.refs': '张参考',
    'set.faces.unnamed': '未命名聚类',
    'set.faces.unnamed.sub': '当前项目里自动检测到、尚未命名的人脸聚类。',
    'set.faces.empty': '尚未注册任何人物',

    'btn.save': '保存', 'btn.cancel': '取消', 'btn.close': '关闭', 'btn.choose': '选择…',

    'flash.demo-folder': 'Demo：实际产品会从此文件夹导入照片',
    'flash.demo-picker': 'Demo：实际产品会打开文件选择器',
    'flash.dark': '深色模式', 'flash.light': '浅色模式',
    'flash.lang.cn': '已切换为中文',
    'flash.lang.en': 'Switched to English',
    'flash.picked': '✓ 已选', 'flash.pick-cleared': '取消已选',
    'flash.rejected': '✗ 已弃', 'flash.rej-cleared': '取消已弃',
    'flash.rating-cleared': '已清除评分',
    'flash.kept-best': '已保留最佳，弃 7 张',
    'flash.filter-person': '过滤：',
    'flash.all-photos': '全部照片',
    'flash.cache-cleared': '缓存已清理（demo）',
    'flash.cache-set': '缓存路径已更新（demo）',
    'flash.face-deleted': '已删除该人物（demo）',
    'flash.face-renamed': '已重命名（demo）',
    'flash.registering': '正在注册并扫描项目…',
    'flash.rating': '评分：',
    'flash.size-cap': '尺寸 ',

    'me.local-badge': '本地',
    'me.local-account': '账户与所有数据仅存于本机，绝不上云',
    'me.cache': '缓存',
    'me.gpu': 'GPU 加速',
    'me.gpu.on': '已启用',
    'me.gpu.off': '未启用',
    'me.models': '个 AI 模型已就绪',
    'me.all-settings': '全部设置 →',
    'me.default-name': '本地用户',
    'me.prompt-name': '设置一个昵称（仅本机可见）',

    'tb.toggle-sidebar': '折叠 / 展开 侧栏 (⌘[)',
    'tb.toggle-inspector': '折叠 / 展开 检视 (⌘])',
    'flash.sidebar-hide': '已隐藏侧栏',
    'flash.sidebar-show': '已展开侧栏',
    'flash.inspector-hide': '已隐藏检视',
    'flash.inspector-show': '已展开检视',
    'flash.gpu.on': 'GPU 加速已启用',
    'flash.gpu.off': 'GPU 加速已关闭',
    'flash.model-installed': '模型已安装',
    'flash.model-removed': '模型已删除',

    'ai.organize': 'AI 自动整理',
    'ai.title': 'AI 自动整理',
    'ai.intro-h': '一键智能筛选',
    'ai.subtitle': 'Sift 将分析全部 <b>1247</b> 张照片，并按勾选的规则一键应用。',
    'ai.rule1': '保留每组连拍中 AI 评分最高的一张',
    'ai.rule1.cnt': '12 组连拍',
    'ai.rule2': '弃掉所有闭眼的照片',
    'ai.rule2.cnt': '约 8 张',
    'ai.rule3': '弃掉极度模糊的照片（清晰度 < 0.6）',
    'ai.rule3.cnt': '约 15 张',
    'ai.rule4': '弃掉重复的照片（保留最锐利的）',
    'ai.rule4.cnt': '31 组',
    'ai.rule5': '保留所有星标 ≥ 4 的照片',
    'ai.rule5.cnt': '14 张',
    'ai.summary.head': '预计应用',
    'ai.summary.picks': '选中',
    'ai.summary.rejs': '弃掉',
    'ai.summary.untouched': '保持不变',
    'ai.note': '所有更改会写入撤销栈，可一键撤销。',
    'ai.apply': '应用整理',
    'ai.applied': 'AI 已整理',
    'ai.undo': '撤销',

    'set.ai.gpu': 'GPU 加速',
    'set.ai.gpu.sub': '使用本机 GPU 推理 AI 模型 —— CPU 模式约慢 8 倍。',
    'set.ai.gpu.detected': '✦ 检测到 Apple M2 Pro · 19 核',
    'set.ai.models': '模型管理',
    'set.ai.models.sub': '所有模型本地运行，可按需下载或删除。',
    'set.ai.model.installed': '已安装',
    'set.ai.model.download': '下载',
    'set.ai.model.remove': '删除',

    'export.format': '格式',
    'export.format.original': '原图',
    'export.format.hint.jpg': 'JPG · 兼容性最好，可调质量',
    'export.format.hint.png': 'PNG · 无损压缩，文件较大',
    'export.format.hint.original': '原图 · 不转换、不重命名，按目录复制',
    'export.quality': '质量',
    'export.quality.hint': '（越高越大）',
    'export.quality.email': '邮件',
    'export.quality.high': '高画质',
    'export.quality.max': '无损',
    'export.resolution': '分辨率',
    'export.res.original': '原始尺寸',
    'flash.project-renamed': '项目已重命名',
    'crumb.project.edit-hint': '点击修改项目名',

    'ai.subtitle-clean': '勾选你要应用的规则，点击 <b>开始整理</b> 后才会真正改动照片。',
    'ai.start': '开始整理',
    'ai.report.head': 'AI 整理完成',
    'ai.report.breakdown': '按规则统计',
    'ai.report.done': '完成',
    'ai.report.undo': '撤销整理',
    'ai.report.empty': '没有照片需要整理 —— 当前规则下没匹配的照片。',
    'ai.report.picks': '选中',
    'ai.report.rejs': '弃掉',
    'ai.report.keep': '保持不变',
    'rule.label.best-of-burst': '连拍最佳',
    'rule.label.reject-eyes-closed': '闭眼',
    'rule.label.reject-blurry': '模糊',
    'rule.label.reject-dups': '重复',
    'rule.label.pick-rated': '高评分',

    'reject.eyes-closed': '闭眼',
    'reject.blurry': '模糊',
    'reject.duplicate': '重复',
    'reject.manual': '手动',
    'reject.low-rated': '低评',
  },

  en: {
    'crumb.back': 'Projects',
    'crumb.library': 'Library', 'crumb.loupe': 'Loupe', 'crumb.compare': 'Compare', 'crumb.people': 'People',

    'tb.export': 'Export',

    'welcome.projects': 'Projects',
    'welcome.new': '+ New from folder',
    'welcome.drop': 'Drop a folder here',
    'welcome.browse-hint': 'or press <kbd>⌘O</kbd> to browse',
    'welcome.recent': 'Recent',
    'welcome.sort.modified': 'Modified',
    'welcome.sort.name': 'Name',
    'welcome.sort.size': 'Size',
    'welcome.add-project': '+ New project',
    'welcome.photos': 'photos',
    'welcome.in-progress': 'in progress',

    'sb.head.library': 'Library', 'sb.head.smart': 'Smart', 'sb.head.people': 'People',
    'sb.head.stacks': 'Stacks', 'sb.head.tags': 'Tags',
    'sb.all': 'All', 'sb.picks': 'Picks', 'sb.rejects': 'Rejected', 'sb.unrated': 'Unrated',
    'sb.smart.sharp': 'Sharp', 'sb.smart.blurry': 'Blurry',
    'sb.smart.eyes-closed': 'Eyes closed', 'sb.smart.best': 'AI best of burst',
    'sb.bursts': 'Bursts', 'sb.dups': 'Duplicates',
    'sb.tags.group': 'Group photos', 'sb.tags.candid': 'Candid', 'sb.tags.detail': 'Detail',

    'tab.all': 'All', 'tab.picks': 'Picks', 'tab.rejects': 'Rejected', 'tab.unrated': 'Unrated',
    'chip.sharp': 'Sharp ✓', 'chip.eyes': 'Eyes open',
    'chip.nodup': '¬ Duplicate', 'chip.people': '+ With people',

    'common.person': 'Person', 'common.unnamed': 'Unnamed', 'common.more-unnamed': 'more',

    'insp.empty': 'Select a photo to see details',
    'insp.h.camera': 'Camera', 'insp.body': 'Body', 'insp.lens': 'Lens',
    'insp.aperture': 'Aperture', 'insp.shutter': 'Shutter', 'insp.iso': 'ISO', 'insp.time': 'Time',
    'insp.h.ai': 'AI Quality',
    'insp.sharp': 'Sharp', 'insp.expo': 'Exposure', 'insp.noise': 'Noise',
    'insp.eyes': 'Eyes', 'insp.eyes.open': '✓ open', 'insp.eyes.closed': '✗ closed',
    'insp.smile': 'Smile',
    'insp.burst': 'Burst', 'insp.burst.best': '★ AI best of 8',
    'insp.h.faces': 'Faces', 'insp.no-faces': 'No faces detected',
    'insp.h.tags': 'Tags', 'insp.add-tag': '+ add tag',
    'insp.tag.group': 'group', 'insp.tag.detail': 'detail',

    'lou.pick': '✓ Pick', 'lou.reject': '✗ Reject',

    'cmp.title': 'Burst at 14:32 · 8 shots',
    'cmp.suggests': 'AI suggests',
    'cmp.as-best': 'as best',
    'cmp.sharp': 'Sharp', 'cmp.eyes': 'Eyes',
    'cmp.keep-best': 'Keep best · reject rest',
    'cmp.hint': 'Press <kbd>1-9</kbd> to pick · <kbd>Tab</kbd> cycle layouts · <kbd>A</kbd> keep best',
    'cmp.ai-best': 'AI best',

    'ppl.head': 'People · ',
    'ppl.register': '+ Register person',
    'ppl.registered': 'Registered',
    'ppl.detected': 'Detected',
    'ppl.unnamed': 'unnamed',
    'ppl.merge': 'merge', 'ppl.name': 'name', 'ppl.hide': 'hide',
    'ppl.export': '↑ Export pack',
    'ppl.photos-suf': 'photos',

    'sb.tools': 'Tools', 'sb.size': 'size',
    'sb.sort.date': 'Sort: Date ↓',
    'sb.sort.rating': 'Sort: Rating',
    'sb.sort.score': 'Sort: AI score',
    'sb.sort.name': 'Sort: Name',
    'mode.grid': 'Grid', 'mode.loupe': 'Loupe', 'mode.compare': 'Compare',

    'export.title': 'Export', 'export.photos': 'photos',
    'export.preset': 'Preset',
    'export.preset.web': 'Web · 1920px JPG · 80q',
    'export.preset.email': 'Email · 1080px JPG · 70q',
    'export.preset.print': 'Print · full TIFF',
    'export.preset.original': 'Original',
    'export.dest': 'Destination', 'export.browse': 'Browse',
    'export.naming': 'Naming', 'export.preview': 'Preview',
    'export.group': 'Group by',
    'export.group.none': 'none', 'export.group.person': 'person',
    'export.group.rating': 'rating', 'export.group.tag': 'tag',
    'export.group.hint': '→ 3 sub-folders: Alice (142), Bob (38), Carol (67)',
    'export.watermark': 'Watermark',
    'export.wm.br': 'bottom-right', 'export.wm.bl': 'bottom-left', 'export.wm.tr': 'top-right',
    'export.summary': '142 files · ~1.2 GB · ETA ~45 s',
    'export.do': 'Export',

    'tools.title': 'Tools · Auto-analysis',
    'tools.quality': 'Quality scoring', 'tools.quality.sub': 'sharpness · exposure · noise',
    'tools.eyes': 'Eye-state detection', 'tools.eyes.sub': 'open · closed · squint',
    'tools.bursts': 'Burst grouping', 'tools.bursts.sub': 'time-window + similarity',
    'tools.faces': 'Face clustering', 'tools.faces.sub': 'registered + auto',
    'tools.dups': 'Duplicate detection', 'tools.dups.sub': 'perceptual hash',
    'tools.smile': 'Smile / emotion', 'tools.smile.sub': 'opt-in',
    'tools.compose': 'Composition score', 'tools.compose.sub': 'opt-in',
    'tools.done': 'Done', 'tools.idle': 'Idle',
    'tools.config.sharp': 'Sharpness cutoff',
    'tools.config.burst': 'Burst window',
    'tools.config.dup': 'Duplicate threshold',
    'tools.config.local': 'Run all models locally (no cloud)',
    'tools.rerun': 'Re-run all',

    'reg.title': 'Register Person',
    'reg.name': 'Name', 'reg.name.ph': 'e.g. Alice Wong',
    'reg.refs': 'Reference photos',
    'reg.drop': 'Drop 1-5 photos of this person',
    'reg.drop.hint': 'More photos = better matching',
    'reg.do': 'Register & Find',

    'cmdk.ph': 'Type a command — pick all sharp, export selects, register face…',
    'cmdk.quick': 'Quick actions', 'cmdk.view': 'View',
    'cmdk.cmd1': 'Pick all sharp + eyes-open',
    'cmdk.cmd2': 'Collapse all bursts',
    'cmdk.cmd3': 'Export current selection',
    'cmdk.cmd4': 'Register new person',
    'cmdk.cmd5': 'Switch to Grid',
    'cmdk.cmd6': 'Switch to Loupe',
    'cmdk.cmd7': 'Switch to Compare',

    'set.title': 'Settings',
    'set.general': 'General', 'set.general.sub': 'Language, theme, and startup behaviour.',
    'set.storage': 'Storage', 'set.storage.sub': 'Where Sift keeps caches and project metadata.',
    'set.people': 'People',
    'set.ai': 'AI Models', 'set.ai.h': 'AI Models',
    'set.ai.sub': 'Defaults applied to new projects. Per-project overrides live in Tools.',
    'set.export': 'Export', 'set.ex.h': 'Export defaults',
    'set.ex.sub': 'Pre-fills the export dialog. Each export can still be tweaked individually.',
    'set.shortcuts': 'Shortcuts',
    'set.shortcuts.head': 'Keyboard shortcuts',
    'set.shortcuts.sub': 'Most actions have a single-key binding to keep your hands off the trackpad.',
    'set.about': 'About',
    'set.about.app': 'AI-assisted open-source photo culling.',
    'set.about.version': 'Version',
    'set.about.repo': 'Source on GitHub',
    'set.about.license': 'License (MIT)',
    'set.about.changelog': 'Changelog',
    'set.about.feedback': 'Send feedback',

    'set.lang': 'Language',
    'set.theme': 'Appearance',
    'set.theme.light': 'Light', 'set.theme.dark': 'Dark', 'set.theme.system': 'System',
    'set.startup': 'Startup',
    'set.startup.welcome': 'Open welcome page',
    'set.startup.last': 'Open last project',
    'set.privacy': 'Privacy',
    'set.privacy.local': 'Run all AI models locally — never upload photos',
    'set.privacy.tel': 'Anonymous telemetry (crash reports only)',

    'set.cache': 'Cache path',
    'set.cache.hint': 'Thumbnails, AI scores, perceptual hashes. Safe to delete; will rebuild.',
    'set.cache.clear': 'Clear cache',
    'set.lib': 'Library path',
    'set.lib.hint': 'Project metadata, ratings, registered faces. Backed up; do not delete.',
    'set.disk': 'Disk usage',
    'set.disk.used': 'Used',
    'set.disk.cache': 'Cache', 'set.disk.meta': 'Metadata', 'set.disk.faces': 'Faces',

    'set.ai.q': 'Quality', 'set.ai.q.sub': 'Sharpness · exposure · noise (~120 MB, on-device GPU)',
    'set.ai.eye': 'Eyes', 'set.ai.eye.sub': 'Open / closed / squint detection',
    'set.ai.face': 'Faces', 'set.ai.face.sub': 'Clustering + match against registered people',
    'set.ai.dup': 'Duplicates', 'set.ai.dup.sub': 'Perceptual hash + crop tolerance',
    'set.ai.smile': 'Smile', 'set.ai.smile.sub': 'Smile / expression score (opt-in)',
    'set.ai.compose': 'Composition', 'set.ai.compose.sub': 'Aesthetic / composition score (opt-in)',

    'set.ex.preset': 'Default preset',
    'set.ex.naming': 'Naming pattern',
    'set.ex.wm': 'Watermark', 'set.ex.wm.use': 'Apply to all exports',

    'set.faces.head': 'Registered people',
    'set.faces.sub': 'Reference faces used across all projects. Add references to improve matching.',
    'set.faces.add': '+ Register new person',
    'set.faces.rename': 'Rename',
    'set.faces.delete': 'Delete',
    'set.faces.refs': 'refs',
    'set.faces.unnamed': 'Unnamed clusters',
    'set.faces.unnamed.sub': 'Auto-detected face clusters in current project, not yet registered.',
    'set.faces.empty': 'No people registered yet',

    'btn.save': 'Save', 'btn.cancel': 'Cancel', 'btn.close': 'Close', 'btn.choose': 'Choose…',

    'flash.demo-folder': 'Demo: would import from this folder',
    'flash.demo-picker': 'Demo: would open file picker',
    'flash.dark': 'Dark mode', 'flash.light': 'Light mode',
    'flash.lang.cn': '已切换为中文',
    'flash.lang.en': 'Switched to English',
    'flash.picked': '✓ Picked', 'flash.pick-cleared': 'Pick cleared',
    'flash.rejected': '✗ Rejected', 'flash.rej-cleared': 'Reject cleared',
    'flash.rating-cleared': 'Rating cleared',
    'flash.kept-best': 'Kept best, rejected 7 others',
    'flash.filter-person': 'Filter: ',
    'flash.all-photos': 'All photos',
    'flash.cache-cleared': 'Cache cleared (demo)',
    'flash.cache-set': 'Cache path updated (demo)',
    'flash.face-deleted': 'Person removed (demo)',
    'flash.face-renamed': 'Renamed (demo)',
    'flash.registering': 'Registering, scanning project…',
    'flash.rating': 'Rating: ',
    'flash.size-cap': 'Size ',

    'me.local-badge': 'Local',
    'me.local-account': 'Account stays on this device · never uploaded',
    'me.cache': 'Cache',
    'me.gpu': 'GPU',
    'me.gpu.on': 'enabled',
    'me.gpu.off': 'disabled',
    'me.models': 'AI models ready',
    'me.all-settings': 'All settings →',
    'me.default-name': 'Local user',
    'me.prompt-name': 'Set a nickname (visible only on this device)',

    'tb.toggle-sidebar': 'Toggle sidebar (⌘[)',
    'tb.toggle-inspector': 'Toggle inspector (⌘])',
    'flash.sidebar-hide': 'Sidebar hidden',
    'flash.sidebar-show': 'Sidebar shown',
    'flash.inspector-hide': 'Inspector hidden',
    'flash.inspector-show': 'Inspector shown',
    'flash.gpu.on': 'GPU acceleration enabled',
    'flash.gpu.off': 'GPU acceleration disabled',
    'flash.model-installed': 'Model installed',
    'flash.model-removed': 'Model removed',

    'ai.organize': 'AI Auto-organize',
    'ai.title': 'AI Auto-organize',
    'ai.intro-h': 'One-click cleanup',
    'ai.subtitle': 'Sift will analyze all <b>1247</b> photos and apply the rules you check below.',
    'ai.rule1': 'Pick the AI-best of each burst',
    'ai.rule1.cnt': '12 bursts',
    'ai.rule2': 'Reject all closed-eye photos',
    'ai.rule2.cnt': '≈ 8 photos',
    'ai.rule3': 'Reject very blurry photos (sharpness < 0.6)',
    'ai.rule3.cnt': '≈ 15 photos',
    'ai.rule4': 'Reject duplicates (keep sharpest)',
    'ai.rule4.cnt': '31 groups',
    'ai.rule5': 'Pick all photos with rating ≥ 4',
    'ai.rule5.cnt': '14 photos',
    'ai.summary.head': 'Estimated outcome',
    'ai.summary.picks': 'picked',
    'ai.summary.rejs': 'rejected',
    'ai.summary.untouched': 'unchanged',
    'ai.note': 'All changes are written to the undo stack and can be reverted in one click.',
    'ai.apply': 'Apply',
    'ai.applied': 'AI organized',
    'ai.undo': 'undo',

    'set.ai.gpu': 'GPU acceleration',
    'set.ai.gpu.sub': 'Use on-device GPU for AI inference — CPU mode is ~8× slower.',
    'set.ai.gpu.detected': '✦ Apple M2 Pro · 19 cores detected',
    'set.ai.models': 'Model management',
    'set.ai.models.sub': 'All models run locally; download or remove as needed.',
    'set.ai.model.installed': 'Installed',
    'set.ai.model.download': 'Download',
    'set.ai.model.remove': 'Remove',

    'export.format': 'Format',
    'export.format.original': 'Original',
    'export.format.hint.jpg': 'JPG · widely compatible, adjustable quality',
    'export.format.hint.png': 'PNG · lossless, larger files',
    'export.format.hint.original': 'Original · no conversion or rename, copies as-is',
    'export.quality': 'Quality',
    'export.quality.hint': '(higher = larger file)',
    'export.quality.email': 'Email',
    'export.quality.high': 'High',
    'export.quality.max': 'Lossless',
    'export.resolution': 'Resolution',
    'export.res.original': 'Original',
    'flash.project-renamed': 'Project renamed',
    'crumb.project.edit-hint': 'Click to rename',

    'ai.subtitle-clean': 'Pick the rules you want Sift to apply. Nothing will change until you press <b>Start</b>.',
    'ai.start': 'Start',
    'ai.report.head': 'Organize complete',
    'ai.report.breakdown': 'By rule',
    'ai.report.done': 'Done',
    'ai.report.undo': 'Undo',
    'ai.report.empty': 'Nothing to do — no photos matched the selected rules.',
    'ai.report.picks': 'picked',
    'ai.report.rejs': 'rejected',
    'ai.report.keep': 'unchanged',
    'rule.label.best-of-burst': 'Best of burst',
    'rule.label.reject-eyes-closed': 'Eyes closed',
    'rule.label.reject-blurry': 'Blurry',
    'rule.label.reject-dups': 'Duplicates',
    'rule.label.pick-rated': 'High rating',

    'reject.eyes-closed': 'eyes closed',
    'reject.blurry': 'blurry',
    'reject.duplicate': 'duplicate',
    'reject.manual': 'manual',
    'reject.low-rated': 'low rated',
  },
};

function t(key) {
  return STRINGS[state.lang]?.[key] ?? STRINGS.en?.[key] ?? key;
}

// ---------- Mock data ----------
const projects = [
  { id: 'wedding', name: 'Wedding',  date: 'May 12', total: 1247, picks: 142, progress: 1.0,  seed: 'wedding-event-12' },
  { id: 'concert', name: 'Concert',  date: 'Apr 30', total: 832,  picks: 0,   progress: 0.38, seed: 'concert-night-77' },
  { id: 'hiking',  name: 'Hiking',   date: 'Apr 15', total: 2103, picks: 0,   progress: 0,    seed: 'mountain-trail' },
  { id: 'studio',  name: 'Studio',   date: 'Apr 03', total: 421,  picks: 87,  progress: 1.0,  seed: 'studio-portrait' },
];

const people = [
  { id: 'alice', name: 'Alice', count: 142, refs: 5, avatar: 'https://i.pravatar.cc/200?img=49' },
  { id: 'bob',   name: 'Bob',   count: 38,  refs: 3, avatar: 'https://i.pravatar.cc/200?img=12' },
  { id: 'carol', name: 'Carol', count: 67,  refs: 4, avatar: 'https://i.pravatar.cc/200?img=47' },
];

// Unnamed clusters get a stable num so we can label them "Person 1", "人物 1"…
const unnamedClusters = [
  { id: 'p1', num: 1, count: 21, avatar: 'https://i.pravatar.cc/200?img=33' },
  { id: 'p2', num: 2, count: 18, avatar: 'https://i.pravatar.cc/200?img=68' },
  { id: 'p3', num: 3, count: 12, avatar: 'https://i.pravatar.cc/200?img=20' },
  { id: 'p4', num: 4, count: 9,  avatar: 'https://i.pravatar.cc/200?img=59' },
  { id: 'p5', num: 5, count: 4,  avatar: 'https://i.pravatar.cc/200?img=11' },
];

function unnamedLabel(cluster) {
  return `${t('common.person')} ${cluster.num}`;
}
function personLookup(id) {
  return people.find(p => p.id === id) || unnamedClusters.find(p => p.id === id);
}
function personDisplay(id) {
  const p = personLookup(id);
  if (!p) return id;
  if (p.name) return p.name;
  return unnamedLabel(p);
}

function det(seed, mod = 100) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

function generatePhotos() {
  const photos = [];
  for (let i = 0; i < 36; i++) {
    const id = i + 1;
    const seed = `sift-${id}`;
    const inBurst = i >= 16 && i < 24;
    const sharp = (det(seed + 'sharp') / 100) * 0.5 + 0.5;
    const expo  = (det(seed + 'expo')  / 100) * 0.4 + 0.6;
    const noise = (det(seed + 'noise') / 100) * 0.3 + 0.65;
    const smile = det(seed + 'smile') / 100;
    const eyesClosed = det(seed + 'eyes') < 14;
    const r = det(seed + 'rate');
    const rating = i < 4 ? 0 : (r < 18 ? 0 : r < 50 ? Math.floor(r/12) : Math.min(5, Math.floor(r/15)));
    const stateRoll = det(seed + 'state');
    let pState = null;
    if (rating >= 4 && stateRoll > 30) pState = 'pick';
    else if (eyesClosed && stateRoll > 60) pState = 'reject';
    else if (rating === 0 && stateRoll < 6) pState = 'reject';

    const faces = [];
    if (i % 3 === 0) faces.push('alice');
    if (i % 5 === 0) faces.push('bob');
    if (i % 7 === 0) faces.push('carol');
    if (i % 11 === 0) faces.push('p1');
    if (i % 9 === 0) faces.push('p2');
    if (faces.length === 0 && i % 4 === 0) faces.push('p3');

    photos.push({
      id, seed,
      filename: `IMG_${String(420 + i).padStart(4, '0')}.CR3`,
      rating, state: pState,
      sharp, expo, noise,
      eyes: eyesClosed ? 'closed' : 'open',
      smile, faces,
      burst: inBurst ? 'burst-1432' : null,
      bestInBurst: i === 18,
      camera: 'Sony A7IV', lens: '70-200mm GM',
      aperture: 'f/2.8', shutter: '1/200s', iso: 800,
      time: `14:${String(30 + Math.floor(i/8)).padStart(2,'0')}:${String((i*7)%60).padStart(2,'0')}`,
    });
  }
  return photos;
}

// ---------- Image URLs ----------
function thumbUrl(photo, w = 600, h = 400) {
  return `https://picsum.photos/seed/${photo.seed}/${w}/${h}`;
}
function projectThumb(p) {
  return `https://picsum.photos/seed/${p.seed}/600/360`;
}

// ---------- Helpers ----------
const $  = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

function setView(v) {
  state.view = v;
  $$('.view').forEach(el => el.classList.toggle('active', el.dataset.view === v));
  $('#btn-back').hidden = (v === 'welcome');
  // Crumbs: only project name (and sub-context) — back button supplies the rest
  const crumbs = $('#tb-crumbs');
  if (v === 'welcome') {
    crumbs.textContent = 'Sift';
    crumbs.classList.remove('in-project', 'editable');
    crumbs.contentEditable = 'false';
    crumbs.title = '';
  } else {
    const proj = currentProject()?.name ?? '';
    const sub  = (v !== 'library') ? ' · ' + t('crumb.' + v) : '';
    crumbs.textContent = proj + sub;
    crumbs.classList.add('in-project', 'editable');
    crumbs.title = t('crumb.project.edit-hint');
  }
  $('#statusbar').style.display = (v === 'welcome' || v === 'people') ? 'none' : 'grid';
  $('#btn-export').hidden = (v === 'welcome');

  // Welcome page has no toolbar fluff — only the ⚙ master entry stays.
  // Theme + panel toggles are project-only; theme also lives in Settings.
  const onProject = (v !== 'welcome');
  $('#btn-theme').hidden            = !onProject;
  $('#btn-toggle-sidebar').hidden   = !onProject;
  $('#btn-toggle-inspector').hidden = !onProject;
  $('#btn-cmdk').hidden             = !onProject;

  $$('#view-seg .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === v));

  if (v === 'library') renderGrid();
  if (v === 'loupe')   renderLoupe();
  if (v === 'compare') renderCompare();
  if (v === 'people')  renderPeopleView();
}

// ---------- Editable project name ----------
function startEditProject() {
  const c = $('#tb-crumbs');
  if (!c || state.view === 'welcome') return;
  const proj = currentProject();
  if (!proj) return;
  c.contentEditable = 'true';
  c.classList.add('editing');
  // Edit only the project name (drop the sub-context like " · Compare")
  c.textContent = proj.name;
  const range = document.createRange();
  range.selectNodeContents(c);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  c.focus();
}
function endEditProject(commit = true) {
  const c = $('#tb-crumbs');
  if (!c || !c.classList.contains('editing')) return;
  const newName = c.textContent.trim();
  c.contentEditable = 'false';
  c.classList.remove('editing');
  if (commit && newName && currentProject()) {
    currentProject().name = newName;
    flash(t('flash.project-renamed'));
  }
  // Re-render breadcrumb (with sub-context restored), and refresh project list
  setView(state.view);
  renderProjects();
}
function cap(s) { return s[0].toUpperCase() + s.slice(1); }
function currentProject() { return projects.find(p => p.id === state.currentProjectId); }

// ---------- Welcome render ----------
function renderProjects() {
  const grid = $('#project-grid');
  grid.innerHTML = projects.map(p => `
    <div class="project-card" data-project="${p.id}">
      <div class="project-thumb"><img loading="lazy" src="${projectThumb(p)}" onerror="this.classList.add('broken'); this.removeAttribute('src');"></div>
      <div class="project-meta">
        <div class="project-name"><span>${p.name}</span></div>
        <div class="project-date">${p.date}</div>
        <div class="project-stats">
          <span class="pill">${p.total.toLocaleString()} ${t('welcome.photos')}</span>
          ${p.picks > 0 ? `<span class="pill picks">✓ ${p.picks}</span>` : ''}
          ${p.progress > 0 && p.progress < 1 ? `<span class="pill progress">${Math.round(p.progress*100)}%</span>` : ''}
        </div>
      </div>
    </div>
  `).join('') + `
    <div class="project-card add-new" id="add-project">${t('welcome.add-project')}</div>
  `;
  $$('#project-grid .project-card[data-project]').forEach(card => {
    card.addEventListener('click', () => openProject(card.dataset.project));
  });
  $('#add-project').addEventListener('click', () => flash(t('flash.demo-picker')));
}

function openProject(id) {
  state.currentProjectId = id;
  state.photos = generatePhotos();
  state.selectedPhotoId = null;
  state.collection = 'all';
  state.filters.clear();
  state.selectedPersonId = null;
  $$('.chip').forEach(c => c.classList.remove('active'));
  $$('.sb-item').forEach(b => b.classList.toggle('active', b.dataset.collection === 'all'));
  $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === 'all'));
  renderSidebarPeople();
  renderGrid();
  renderInspector();
  renderFilmstrip();
  updateCounts();
  setView('library');
}

// ---------- Sidebar people (now also shows unnamed clusters) ----------
function renderSidebarPeople() {
  const wrap = $('#sb-people');
  const named = people.map(p => `
    <div class="sb-person ${state.selectedPersonId === p.id ? 'active' : ''}" data-person="${p.id}">
      <div class="sb-person-avatar" style="background-image:url(${p.avatar})"></div>
      <div class="sb-person-name">${p.name}</div>
      <div class="sb-person-count">${p.count}</div>
    </div>
  `).join('');
  // First few unnamed clusters inline; remaining get a "+N more" link
  const showInline = unnamedClusters.slice(0, 3);
  const rest = unnamedClusters.slice(3);
  const unnamed = showInline.map(c => `
    <div class="sb-person ${state.selectedPersonId === c.id ? 'active' : ''}" data-person="${c.id}">
      <div class="sb-person-avatar" style="background-image:url(${c.avatar}); border:1.5px dashed var(--border-strong)"></div>
      <div class="sb-person-name" style="color:var(--text-muted)">${unnamedLabel(c)}</div>
      <div class="sb-person-count">${c.count}</div>
    </div>
  `).join('');
  const moreLink = rest.length ? `
    <div class="sb-person" id="sb-people-more">
      <div class="sb-person-avatar" style="background:transparent; border:1.5px dashed var(--border-strong)"></div>
      <div class="sb-person-name" style="color:var(--text-muted)">+ ${rest.length} ${t('common.more-unnamed')}</div>
    </div>
  ` : '';
  wrap.innerHTML = named + unnamed + moreLink;

  $$('#sb-people .sb-person[data-person]').forEach(el => {
    el.addEventListener('click', () => togglePerson(el.dataset.person));
  });
  const more = $('#sb-people-more');
  if (more) more.addEventListener('click', () => setView('people'));
}

function togglePerson(id) {
  state.selectedPersonId = state.selectedPersonId === id ? null : id;
  state.collection = 'all';
  $$('.sb-item').forEach(b => b.classList.toggle('active', b.dataset.collection === 'all'));
  renderSidebarPeople();
  renderGrid();
  flash(state.selectedPersonId
    ? t('flash.filter-person') + personDisplay(id)
    : t('flash.all-photos'));
}

// ---------- Photo filtering ----------
function passes(p) {
  switch (state.collection) {
    case 'picks':   if (p.state !== 'pick')   return false; break;
    case 'rejects': if (p.state !== 'reject') return false; break;
    case 'unrated': if (p.rating > 0 || p.state) return false; break;
    case 'smart-sharp':       if (p.sharp < 0.75) return false; break;
    case 'smart-blurry':      if (p.sharp >= 0.6) return false; break;
    case 'smart-eyes-closed': if (p.eyes !== 'closed') return false; break;
    case 'smart-best':        if (!p.bestInBurst) return false; break;
    case 'stacks-bursts':     if (!p.burst) return false; break;
    case 'stacks-dups':       if (p.id !== 27 && p.id !== 28) return false; break;
    case 'tag-group':  if (p.faces.length < 2) return false; break;
    case 'tag-candid': if (p.faces.length === 0) return false; break;
    case 'tag-detail': if (p.faces.length > 0) return false; break;
  }
  if (state.filters.has('rating') && p.rating < 3) return false;
  if (state.filters.has('sharp')  && p.sharp < 0.7) return false;
  if (state.filters.has('eyes')   && p.eyes === 'closed') return false;
  if (state.filters.has('nodup')  && (p.id === 28)) return false;
  if (state.filters.has('people') && p.faces.length === 0) return false;
  if (state.selectedPersonId && !p.faces.includes(state.selectedPersonId)) return false;
  return true;
}

// ---------- Grid ----------
function renderGrid() {
  const grid = $('#photo-grid');
  grid.style.setProperty('--thumb-size', state.thumbSize + 'px');
  const list = state.photos.filter(passes);
  const out = [];
  let burstShown = false;
  for (const p of list) {
    if (p.burst && !burstShown && state.collection !== 'stacks-bursts') {
      const burstCount = list.filter(x => x.burst === p.burst).length;
      out.push(`
        <div class="burst-row">
          <span>▼</span>
          <span>${t('insp.burst')} <b>14:32</b> · ${burstCount} ${t('welcome.photos')}</span>
          <span class="burst-line"></span>
        </div>
      `);
      burstShown = true;
    }
    out.push(photoCard(p));
  }
  grid.innerHTML = out.length ? out.join('') :
    `<div class="hint" style="grid-column:1/-1;text-align:center;padding:60px 0">—</div>`;

  $$('#photo-grid .photo').forEach(el => {
    el.addEventListener('click',     e => selectPhoto(parseInt(el.dataset.pid), e.shiftKey));
    el.addEventListener('dblclick',  () => { selectPhoto(parseInt(el.dataset.pid)); setView('loupe'); });
  });
}

function photoCard(p) {
  const isSel = p.id === state.selectedPhotoId;
  const reasons = (p.state === 'reject') ? getRejectReasons(p) : [];
  return `
    <div class="photo ${isSel ? 'selected' : ''} ${p.state === 'reject' ? 'dim' : ''}" data-pid="${p.id}">
      <img loading="lazy" src="${thumbUrl(p)}" alt="" onerror="this.classList.add('broken'); this.removeAttribute('src');">
      ${p.rating > 0 ? `<div class="photo-badge photo-rating">${'★'.repeat(p.rating)}</div>` : ''}
      ${p.state === 'pick'   ? `<div class="photo-badge photo-state pick">✓</div>` : ''}
      ${p.state === 'reject' ? `<div class="photo-badge photo-state rej">✗</div>` : ''}
      ${reasons.length
        ? `<div class="reject-reasons">${reasons.map(r => `<span class="reason ${r}">${t('reject.' + r)}</span>`).join('')}</div>`
        : (p.eyes === 'closed' ? `<div class="photo-eyes-closed">${t('insp.eyes.closed')}</div>` : '')
      }
      ${p.bestInBurst        ? `<div class="photo-bestburst">${t('cmp.ai-best')}</div>` : ''}
    </div>
  `;
}

function getRejectReasons(p) {
  if (p.state !== 'reject') return [];
  const reasons = [];
  if (p.eyes === 'closed')  reasons.push('eyes-closed');
  if (p.sharp < 0.6)        reasons.push('blurry');
  if (p.id === 28)          reasons.push('duplicate');
  // If no auto-detected reason matches, label as manual
  if (!reasons.length) reasons.push(p.rating === 0 ? 'low-rated' : 'manual');
  return reasons;
}

function selectPhoto(pid) {
  state.selectedPhotoId = pid;
  $$('#photo-grid .photo').forEach(el => el.classList.toggle('selected', parseInt(el.dataset.pid) === pid));
  renderInspector();
  renderFilmstrip();
}

// ---------- Inspector ----------
function renderInspector() {
  const p = state.photos.find(x => x.id === state.selectedPhotoId);
  const empty = $('#insp-empty');
  const content = $('#insp-content');
  if (!p) {
    empty.style.display = 'flex';
    content.hidden = true;
    return;
  }
  empty.style.display = 'none';
  content.hidden = false;

  content.innerHTML = `
    <div class="insp-thumb"><img src="${thumbUrl(p, 400, 270)}" onerror="this.classList.add('broken'); this.removeAttribute('src');"></div>
    <div class="insp-name">${p.filename}</div>

    <div class="insp-section">
      <h4>${t('insp.h.camera')}</h4>
      <div class="insp-row"><span class="k">${t('insp.body')}</span><span class="v">${p.camera}</span></div>
      <div class="insp-row"><span class="k">${t('insp.lens')}</span><span class="v">${p.lens}</span></div>
      <div class="insp-row"><span class="k">${t('insp.aperture')}</span><span class="v">${p.aperture}</span></div>
      <div class="insp-row"><span class="k">${t('insp.shutter')}</span><span class="v">${p.shutter}</span></div>
      <div class="insp-row"><span class="k">${t('insp.iso')}</span><span class="v">${p.iso}</span></div>
      <div class="insp-row"><span class="k">${t('insp.time')}</span><span class="v">${p.time}</span></div>
    </div>

    <div class="insp-section">
      <h4>${t('insp.h.ai')}</h4>
      ${barRow(t('insp.sharp'), p.sharp)}
      ${barRow(t('insp.expo'), p.expo)}
      ${barRow(t('insp.noise'), p.noise)}
      <div class="insp-row" style="margin-top:6px">
        <span class="k">${t('insp.eyes')}</span>
        <span class="v" style="color:${p.eyes==='open' ? 'var(--pick)' : 'var(--reject)'}">${p.eyes === 'open' ? t('insp.eyes.open') : t('insp.eyes.closed')}</span>
      </div>
      ${barRow(t('insp.smile'), p.smile)}
      ${p.bestInBurst ? `<div class="insp-row" style="margin-top:6px"><span class="k">${t('insp.burst')}</span><span class="v" style="color:var(--accent)">${t('insp.burst.best')}</span></div>` : ''}
    </div>

    <div class="insp-section insp-faces">
      <h4>${t('insp.h.faces')} (${p.faces.length})</h4>
      ${p.faces.length ? p.faces.map(faceChip).join('') : `<span class="hint">${t('insp.no-faces')}</span>`}
    </div>

    <div class="insp-section">
      <h4>${t('insp.h.tags')}</h4>
      <div class="insp-tags">
        ${p.faces.length >= 2 ? `<span class="chip active">${t('insp.tag.group')}</span>` : ''}
        ${p.faces.length === 0 ? `<span class="chip active">${t('insp.tag.detail')}</span>` : ''}
        <button class="insp-tag-add">${t('insp.add-tag')}</button>
      </div>
    </div>
  `;
}

function barRow(label, val) {
  const pct = Math.round(val * 100);
  return `
    <div class="bar">
      <span class="k">${label}</span>
      <span class="b"><i style="width:${pct}%"></i></span>
      <span class="v">${pct}</span>
    </div>
  `;
}

function faceChip(faceId) {
  const known = people.find(p => p.id === faceId);
  if (known) {
    return `<span class="face-chip" data-face="${faceId}">
      <span class="av" style="background-image:url(${known.avatar})"></span>
      <span>${known.name}</span>
    </span>`;
  }
  const unk = unnamedClusters.find(p => p.id === faceId);
  return `<span class="face-chip unknown" data-face="${faceId}">
    <span class="av" style="background-image:url(${unk?.avatar || ''})"></span>
    <span>${unk ? unnamedLabel(unk) : t('common.unnamed')}</span>
  </span>`;
}

// ---------- Loupe ----------
function renderLoupe() {
  const list = state.photos.filter(passes);
  if (!list.length) return;
  if (state.selectedPhotoId == null) state.selectedPhotoId = list[0].id;
  let idx = list.findIndex(p => p.id === state.selectedPhotoId);
  if (idx < 0) idx = 0;
  state.loupeIndex = idx;
  const p = list[idx];

  $('#loupe-frame').innerHTML = `<img src="${thumbUrl(p, 1600, 1100)}" onerror="this.classList.add('broken'); this.removeAttribute('src');">`;
  $('#loupe-meta').innerHTML = `
    <b>${p.filename}</b>
    ${idx + 1} / ${list.length}  ·  ${p.aperture} ${p.shutter} · ISO ${p.iso}
    ${p.bestInBurst ? `<br><span style="color:#0a84ff">${t('insp.burst.best')}</span>` : ''}
  `;
  $$('#rating-bar .rb-star').forEach((s, i) => s.classList.toggle('on', i < p.rating));
  $$('.fb-btn').forEach(b => b.classList.remove('on'));
  if (p.state === 'pick') $('.fb-btn.pick').classList.add('on');
  if (p.state === 'reject') $('.fb-btn.rej').classList.add('on');

  renderFilmstrip();
}

function renderFilmstrip() {
  const strip = $('#filmstrip');
  if (!strip) return;
  const list = state.photos.filter(passes);
  strip.innerHTML = list.map(p => `
    <div class="fs-photo ${p.id === state.selectedPhotoId ? 'current' : ''}" data-pid="${p.id}">
      <img src="${thumbUrl(p, 200, 130)}" onerror="this.classList.add('broken'); this.removeAttribute('src');">
      ${p.rating > 0 ? `<div class="photo-badge photo-rating">${'★'.repeat(p.rating)}</div>` : ''}
      ${p.state === 'pick' ? `<div class="photo-badge photo-state pick">✓</div>` : ''}
      ${p.state === 'reject' ? `<div class="photo-badge photo-state rej">✗</div>` : ''}
    </div>
  `).join('');
  $$('#filmstrip .fs-photo').forEach(el => {
    el.addEventListener('click', () => {
      state.selectedPhotoId = parseInt(el.dataset.pid);
      if (state.view === 'loupe') renderLoupe();
      else renderInspector();
      renderFilmstrip();
    });
  });
  const cur = $('#filmstrip .fs-photo.current');
  if (cur) cur.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

// ---------- Compare ----------
function renderCompare() {
  const burst = state.photos.filter(p => p.burst === 'burst-1432');
  const n = state.cmpLayout;
  const ordered = [...burst].sort((a, b) => (b.bestInBurst - a.bestInBurst) || (b.sharp - a.sharp));
  const cells = ordered.slice(0, n);

  $('#cmp-sub').innerHTML =
    `${t('cmp.suggests')} <b>IMG_0438</b> ${t('cmp.as-best')} — ${t('cmp.sharp')} <b>92</b> · ${t('cmp.eyes')} <b>${t('insp.eyes.open')}</b>`;

  const grid = $('#cmp-grid');
  grid.className = `cmp-grid layout-${n}`;
  grid.innerHTML = cells.map(p => `
    <div class="cmp-cell ${p.bestInBurst ? 'best' : ''} ${p.state === 'pick' ? 'pick' : ''} ${p.state === 'reject' ? 'rej' : ''}" data-pid="${p.id}">
      <img src="${thumbUrl(p, 1200, 800)}" onerror="this.classList.add('broken'); this.removeAttribute('src');">
      ${p.bestInBurst ? `<div class="cmp-best-pill">${t('cmp.ai-best')}</div>` : ''}
      <div class="cmp-info">
        <span class="nm">${p.filename}</span>
        <span class="sc">${t('cmp.sharp')} ${Math.round(p.sharp*100)}</span>
        <span class="sc">${t('cmp.eyes')} ${p.eyes === 'open' ? '✓' : '✗'}</span>
        ${p.rating ? `<span class="star">${'★'.repeat(p.rating)}</span>` : ''}
      </div>
    </div>
  `).join('');

  $$('#cmp-grid .cmp-cell').forEach(el => {
    el.addEventListener('click', () => {
      const pid = parseInt(el.dataset.pid);
      pickPhoto(pid);
      flash(t('flash.picked') + ' ' + state.photos.find(p => p.id === pid).filename.split('.')[0]);
      renderCompare();
    });
  });
}

// ---------- People view ----------
function renderPeopleView() {
  $('#ppl-head-title').textContent = t('ppl.head') + (currentProject()?.name ?? '');
  $('#ppl-registered-count').textContent = people.length;
  $('#ppl-detected-count').textContent = `${unnamedClusters.length} ${t('ppl.unnamed')}`;

  $('#ppl-registered').innerHTML = people.map(p => `
    <div class="ppl-card ${state.selectedPersonId === p.id ? 'active' : ''}" data-person="${p.id}">
      <div class="ppl-avatar" style="background-image:url(${p.avatar})"></div>
      <div class="ppl-meta">
        <div class="nm">${p.name}</div>
        <div class="sub">${p.count} ${t('ppl.photos-suf')}</div>
      </div>
    </div>
  `).join('');

  $('#ppl-detected').innerHTML = unnamedClusters.map(c => `
    <div class="ppl-card unnamed" data-cluster="${c.id}">
      <div class="ppl-avatar" style="background-image:url(${c.avatar})"></div>
      <div class="ppl-meta">
        <div class="nm">${unnamedLabel(c)}</div>
        <div class="sub">${c.count} ${t('ppl.photos-suf')}</div>
      </div>
    </div>
  `).join('');

  $$('#ppl-registered .ppl-card').forEach(el => {
    el.addEventListener('click', () => {
      state.selectedPersonId = el.dataset.person;
      renderPeopleView();
      renderPeopleSelected();
    });
  });
  $$('#ppl-detected .ppl-card').forEach(el => {
    el.addEventListener('click', () => openModal('modal-register'));
  });
  renderPeopleSelected();
}

function renderPeopleSelected() {
  const sel = $('#ppl-selected');
  if (!state.selectedPersonId) { sel.hidden = true; return; }
  const person = personLookup(state.selectedPersonId);
  if (!person) { sel.hidden = true; return; }
  sel.hidden = false;
  $('#ppl-selected-name').textContent = person.name || unnamedLabel(person);
  const matches = state.photos.filter(p => p.faces.includes(state.selectedPersonId));
  $('#ppl-selected-count').textContent = matches.length;
  $('#ppl-photos').innerHTML = matches.map(p => `
    <div class="photo" data-pid="${p.id}">
      <img loading="lazy" src="${thumbUrl(p, 400, 400)}" onerror="this.classList.add('broken'); this.removeAttribute('src');">
      ${p.rating > 0 ? `<div class="photo-badge photo-rating">${'★'.repeat(p.rating)}</div>` : ''}
      ${p.state === 'pick' ? `<div class="photo-badge photo-state pick">✓</div>` : ''}
    </div>
  `).join('');
}

// ---------- Counts ----------
function updateCounts() {
  const all = state.photos.length;
  const picks = state.photos.filter(p => p.state === 'pick').length;
  const rejects = state.photos.filter(p => p.state === 'reject').length;
  const unrated = state.photos.filter(p => p.rating === 0 && !p.state).length;
  const set = (k, v) => $$(`[data-count="${k}"]`).forEach(el => el.textContent = v);
  set('all', all); set('picks', picks); set('rejects', rejects); set('unrated', unrated);
  $('#sb-stats').textContent = `${all} · ✓${picks} · ✗${rejects}`;
  $('#exp-count').textContent = picks || all;
}

// ---------- Mutations ----------
function ratePhoto(rating) {
  const p = state.photos.find(x => x.id === state.selectedPhotoId);
  if (!p) return;
  p.rating = (p.rating === rating) ? 0 : rating;
  updateCounts();
  if (state.view === 'library') renderGrid();
  if (state.view === 'loupe') renderLoupe();
  renderInspector();
  flash(p.rating ? `${t('flash.rating')}${'★'.repeat(p.rating)}${'☆'.repeat(5 - p.rating)}` : t('flash.rating-cleared'));
}
function pickPhoto(pid) {
  const p = state.photos.find(x => x.id === (pid ?? state.selectedPhotoId));
  if (!p) return;
  p.state = (p.state === 'pick') ? null : 'pick';
  updateCounts();
  if (state.view === 'library') renderGrid();
  if (state.view === 'loupe') renderLoupe();
  renderInspector();
  flash(p.state === 'pick' ? t('flash.picked') : t('flash.pick-cleared'));
}
function rejectPhoto() {
  const p = state.photos.find(x => x.id === state.selectedPhotoId);
  if (!p) return;
  p.state = (p.state === 'reject') ? null : 'reject';
  updateCounts();
  if (state.view === 'library') renderGrid();
  if (state.view === 'loupe') renderLoupe();
  renderInspector();
  flash(p.state === 'reject' ? t('flash.rejected') : t('flash.rej-cleared'));
}

function navPhoto(delta) {
  const list = state.photos.filter(passes);
  if (!list.length) return;
  let idx = list.findIndex(p => p.id === state.selectedPhotoId);
  if (idx < 0) idx = 0;
  idx = (idx + delta + list.length) % list.length;
  state.selectedPhotoId = list[idx].id;
  if (state.view === 'loupe') renderLoupe();
  else { renderInspector(); selectPhoto(state.selectedPhotoId); }
  renderFilmstrip();
}

// ---------- Modals ----------
let modalStack = [];

const expState = { format: 'jpg', quality: 80, resolution: 'web' };

function openModal(id) {
  const modal = $('#' + id);
  if (!modal) return;
  if (!modalStack.includes(id)) modalStack.push(id);
  modal.hidden = false;
  // Most-recently-opened sits on top
  modal.style.zIndex = 100 + modalStack.indexOf(id) * 5;
  if (id === 'modal-cmdk') setTimeout(() => $('#cmdk-input').focus(), 30);
  if (id === 'modal-settings') openSettings();
  if (id === 'modal-export') refreshExportPreview();
}
function closeModal(target) {
  const modal = (typeof target === 'string') ? $('#' + target) : target;
  if (!modal) return;
  modal.hidden = true;
  modalStack = modalStack.filter(x => x !== modal.id);
}
function closeTopModal() {
  if (!modalStack.length) return;
  closeModal(modalStack[modalStack.length - 1]);
}
function closeAllModals() {
  while (modalStack.length) closeTopModal();
}

// ---------- Export modal ----------
function refreshExportPreview() {
  const fmt = expState.format;
  $('#exp-quality-row').hidden    = (fmt !== 'jpg');
  $('#exp-resolution-row').hidden = (fmt === 'original');
  $('#exp-format-hint').textContent = t(`export.format.hint.${fmt}`);
  // Naming preview extension
  const ext = fmt === 'png' ? 'png' : (fmt === 'original' ? 'CR3' : 'jpg');
  const naming = ($('#exp-naming')?.value || '{date}_{event}_{seq}')
    .replace('{date}', '2026-05-12')
    .replace('{event}', (currentProject()?.name || 'wedding').toLowerCase())
    .replace('{seq}', '001');
  $('#exp-preview').textContent = `${naming}.${ext}`;
  // Live size + ETA estimate
  const count = state.photos.filter(p => p.state === 'pick').length || 142;
  let bytesPerPic;
  if (fmt === 'original') {
    bytesPerPic = 30 * 1024 * 1024;
  } else {
    const resMul = { original: 1.0, '4k': 0.55, '2k': 0.32, web: 0.20, email: 0.08 }[expState.resolution] || 0.2;
    if (fmt === 'png') {
      bytesPerPic = 22 * 1024 * 1024 * resMul;
    } else {
      const qMul = Math.pow(expState.quality / 80, 1.6);
      bytesPerPic = 4 * 1024 * 1024 * resMul * qMul;
    }
  }
  const total = count * bytesPerPic;
  const sizeStr = total > 1024**3
    ? `${(total / 1024**3).toFixed(1)} GB`
    : `${(total / 1024**2).toFixed(0)} MB`;
  const eta = Math.max(3, Math.round(total / (40 * 1024 * 1024)));
  $('#exp-summary').textContent = `${count} files · ~${sizeStr} · ETA ~${eta} s`;
}

// ---------- Settings ----------
function openSettings() {
  // Sync current values
  $('#set-lang').value = state.lang;
  $('#set-theme-select').value = state.theme;
  $('#set-gpu').checked = state.gpu;
  renderFaceList();
  renderUnnamedList();
  renderShortcutList();
  renderModelList();
}
function setSettingsTab(name) {
  $$('#settings-tabs .settings-tab').forEach(b => b.classList.toggle('active', b.dataset.pane === name));
  $$('#settings-pane .pane-content').forEach(p => p.classList.toggle('active', p.dataset.pane === name));
}
function renderFaceList() {
  $('#set-face-list').innerHTML = people.length ? people.map(p => `
    <div class="face-row" data-face="${p.id}">
      <div class="av" style="background-image:url(${p.avatar})"></div>
      <div><span class="nm">${p.name}</span> <span class="ct">${p.count} ${t('ppl.photos-suf')} · ${p.refs} ${t('set.faces.refs')}</span></div>
      <div class="face-actions">
        <button class="rn" data-i18n="set.faces.rename">${t('set.faces.rename')}</button>
        <button class="del" data-i18n="set.faces.delete">${t('set.faces.delete')}</button>
      </div>
    </div>
  `).join('') : `<div class="hint" style="padding:12px 8px">${t('set.faces.empty')}</div>`;
  $$('#set-face-list .rn').forEach(b => b.addEventListener('click', () => flash(t('flash.face-renamed'))));
  $$('#set-face-list .del').forEach(b => b.addEventListener('click', () => flash(t('flash.face-deleted'))));
}
function renderUnnamedList() {
  $('#set-unnamed-list').innerHTML = unnamedClusters.map(c => `
    <div class="face-row unnamed" data-cluster="${c.id}">
      <div class="av" style="background-image:url(${c.avatar})"></div>
      <div><span class="nm">${unnamedLabel(c)}</span> <span class="ct">${c.count} ${t('ppl.photos-suf')}</span></div>
      <div class="face-actions">
        <button class="rn">${t('ppl.name')}</button>
        <button class="del">${t('ppl.hide')}</button>
      </div>
    </div>
  `).join('');
  $$('#set-unnamed-list .rn').forEach(b => b.addEventListener('click', () => openModal('modal-register')));
}

const SHORTCUTS = [
  { keys: '1-5', desc: { cn: '评分 1-5 星',         en: 'Rate 1–5 stars' } },
  { keys: '0',   desc: { cn: '清除评分',             en: 'Clear rating' } },
  { keys: 'P',   desc: { cn: '选 / 取消选',          en: 'Pick / unpick' } },
  { keys: 'X',   desc: { cn: '弃 / 取消弃',          en: 'Reject / unreject' } },
  { keys: '← →', desc: { cn: '上 / 下一张',           en: 'Prev / next photo' } },
  { keys: 'Space', desc: { cn: '网格 ↔ 聚焦',        en: 'Grid ↔ Loupe' } },
  { keys: 'Enter', desc: { cn: '进入聚焦',            en: 'Enter Loupe' } },
  { keys: 'G / L / C', desc: { cn: '切到网格/聚焦/对比', en: 'Go to Grid/Loupe/Compare' } },
  { keys: 'A',   desc: { cn: '保留连拍最佳，弃其余',   en: 'Keep burst best, reject rest' } },
  { keys: 'Tab', desc: { cn: '对比布局 2/4/9',         en: 'Cycle compare 2/4/9' } },
  { keys: 'T',   desc: { cn: '切换主题',              en: 'Toggle theme' } },
  { keys: '⌘K',  desc: { cn: '命令面板',              en: 'Command palette' } },
  { keys: '⌘E',  desc: { cn: '导出',                  en: 'Export' } },
  { keys: 'Esc', desc: { cn: '关闭弹窗',              en: 'Close modal' } },
];
function renderShortcutList() {
  $('#shortcut-list').innerHTML = SHORTCUTS.map(s => `
    <div class="row"><span class="desc">${s.desc[state.lang] || s.desc.en}</span><span class="keys">${s.keys}</span></div>
  `).join('');
}

// ---------- Model management ----------
const MODELS = [
  { id: 'quality',  name: { cn: '质量评分',  en: 'Quality scoring' },     size: '120 MB', installed: true,  glyph: '✓' },
  { id: 'eyes',     name: { cn: '眼部检测',  en: 'Eye detection' },        size: '24 MB',  installed: true,  glyph: '✓' },
  { id: 'faces',    name: { cn: '人脸聚类',  en: 'Face clustering' },      size: '89 MB',  installed: true,  glyph: '✓' },
  { id: 'dups',     name: { cn: '重复检测',  en: 'Duplicate detection' },  size: '12 MB',  installed: true,  glyph: '✓' },
  { id: 'smile',    name: { cn: '微笑评分',  en: 'Smile / emotion' },       size: '45 MB',  installed: false, glyph: '◯' },
  { id: 'compose',  name: { cn: '构图评分',  en: 'Composition score' },     size: '78 MB',  installed: false, glyph: '◯' },
];

function renderModelList() {
  $('#model-list').innerHTML = MODELS.map(m => `
    <div class="model-row ${m.installed ? 'installed' : ''}" data-model="${m.id}">
      <span class="mr-icon">${m.glyph}</span>
      <div class="mr-info">
        <b>${m.name[state.lang] || m.name.en}</b>
        <div class="hint">${m.installed ? t('set.ai.model.installed') : t('set.ai.model.download') + ' · ' + m.size}</div>
      </div>
      <span class="mr-size">${m.size}</span>
      ${m.installed
        ? `<button class="mr-action danger" data-act="remove">${t('set.ai.model.remove')}</button>`
        : `<button class="mr-action primary" data-act="install">${t('set.ai.model.download')}</button>`
      }
    </div>
  `).join('');
  $$('#model-list .mr-action').forEach(b => {
    b.addEventListener('click', () => {
      const row = b.closest('.model-row');
      const m = MODELS.find(x => x.id === row.dataset.model);
      m.installed = !m.installed;
      m.glyph = m.installed ? '✓' : '◯';
      renderModelList();
      flash(m.installed ? t('flash.model-installed') : t('flash.model-removed'));
    });
  });
}

// ---------- "Me" card on Welcome ----------
function renderMeCard() {
  const av = $('#me-avatar');
  const nm = $('#me-name-text');
  if (!av || !nm) return;
  nm.textContent = state.profile.name || t('me.default-name');
  // Avatar: image or initial-on-gradient
  if (state.profile.avatar) {
    av.style.backgroundImage = `url(${state.profile.avatar})`;
    av.textContent = '';
  } else {
    av.style.backgroundImage = '';
    const ch = (state.profile.name || t('me.default-name')).trim().charAt(0).toUpperCase() || 'U';
    av.textContent = ch;
  }
  // GPU status
  const gpuDot = $('#me-gpu-dot');
  const gpuState = $('#me-gpu-state');
  if (gpuDot) gpuDot.classList.toggle('off', !state.gpu);
  if (gpuState) gpuState.textContent = state.gpu ? t('me.gpu.on') : t('me.gpu.off');
}

// ---------- AI Auto-organize ----------
function openAIModal() {
  // Always reset to rules screen on open
  $('#ai-screen-rules').hidden  = false;
  $('#ai-screen-result').hidden = true;
  $('#ai-foot-rules').hidden    = false;
  $('#ai-foot-result').hidden   = true;
  // Sync rule checkboxes from state
  $$('#ai-rules .ai-rule').forEach(el => {
    const key = el.dataset.rule;
    el.querySelector('input').checked = !!state.aiRules[key];
  });
  openModal('modal-ai');
}

function planAIChanges() {
  const r = state.aiRules;
  const planned = state.photos.map(p => ({ p, change: false, ruleApplied: null, nextState: p.state }));

  for (const item of planned) {
    const p = item.p;
    let next = p.state;
    let rule = null;
    if (r['best-of-burst'] && p.bestInBurst)            { next = 'pick';   rule = 'best-of-burst'; }
    if (r['reject-eyes-closed'] && p.eyes === 'closed') { next = 'reject'; rule = 'reject-eyes-closed'; }
    if (r['reject-blurry'] && p.sharp < 0.6)            { next = 'reject'; rule = 'reject-blurry'; }
    if (r['reject-dups'] && p.id === 28)                { next = 'reject'; rule = 'reject-dups'; }
    if (r['pick-rated'] && p.rating >= 4)               { next = 'pick';   rule = 'pick-rated'; }
    item.nextState   = next;
    item.ruleApplied = rule;
    item.change      = (next !== p.state);
  }
  return planned;
}

let aiUndoSnapshot = null;
let aiLastBreakdown = null;

function applyAIOrganize() {
  // Read checkbox state into state.aiRules
  $$('#ai-rules .ai-rule').forEach(el => {
    state.aiRules[el.dataset.rule] = el.querySelector('input').checked;
  });

  if (!state.photos.length) {
    // Demo without project — fake a small report so users see the flow
    aiLastBreakdown = { 'best-of-burst': 12, 'reject-eyes-closed': 8, 'reject-blurry': 15 };
    showAIReport({ picks: 12, rejs: 23, keep: 1212 });
    return;
  }

  // Save snapshot for undo
  aiUndoSnapshot = state.photos.map(p => ({ id: p.id, rating: p.rating, state: p.state }));

  const planned = planAIChanges();
  let picks = 0, rejs = 0;
  const breakdown = {};
  for (const item of planned) {
    if (item.change) {
      item.p.state = item.nextState;
      if (item.nextState === 'pick')   picks++;
      else if (item.nextState === 'reject') rejs++;
      if (item.ruleApplied) {
        breakdown[item.ruleApplied] = (breakdown[item.ruleApplied] || 0) + 1;
      }
    }
  }
  const keep = state.photos.length - picks - rejs;
  aiLastBreakdown = breakdown;
  updateCounts();
  if (state.view === 'library') renderGrid();
  if (state.view === 'compare') renderCompare();
  showAIReport({ picks, rejs, keep });
}

function showAIReport({ picks, rejs, keep }) {
  // Switch to result screen
  $('#ai-screen-rules').hidden  = true;
  $('#ai-screen-result').hidden = false;
  $('#ai-foot-rules').hidden    = true;
  $('#ai-foot-result').hidden   = false;

  // Summary numbers
  $('#ai-result-summary').innerHTML = `
    <div class="stat pick"><b>${picks}</b><span class="lbl">${t('ai.report.picks')}</span></div>
    <div class="stat rej"><b>${rejs}</b><span class="lbl">${t('ai.report.rejs')}</span></div>
    <div class="stat keep"><b>${keep}</b><span class="lbl">${t('ai.report.keep')}</span></div>
  `;

  // Per-rule breakdown
  const rules = aiLastBreakdown || {};
  const order = ['best-of-burst', 'pick-rated', 'reject-eyes-closed', 'reject-blurry', 'reject-dups'];
  const rows = order
    .filter(k => (rules[k] || 0) > 0)
    .map(k => {
      const isPick = k === 'best-of-burst' || k === 'pick-rated';
      const cls    = isPick ? 'pick' : 'rej';
      const glyph  = isPick ? '✓' : '✗';
      const verb   = isPick ? t('ai.report.picks') : t('ai.report.rejs');
      return `
        <div class="breakdown-row ${cls}">
          <span class="br-glyph">${glyph}</span>
          <span class="br-label">${t('rule.label.' + k)}</span>
          <span class="br-cnt">${rules[k]} <small style="font-weight:400;color:var(--text-muted)">${verb}</small></span>
        </div>
      `;
    });

  $('#ai-result-breakdown').innerHTML = rows.length
    ? `<div class="ai-breakdown-head">${t('ai.report.breakdown')}</div>
       <div class="ai-breakdown-list">${rows.join('')}</div>`
    : `<div class="empty">${t('ai.report.empty')}</div>`;
}

function undoAIOrganize() {
  if (!aiUndoSnapshot) {
    closeModal('modal-ai');
    return;
  }
  for (const snap of aiUndoSnapshot) {
    const p = state.photos.find(x => x.id === snap.id);
    if (p) { p.rating = snap.rating; p.state = snap.state; }
  }
  aiUndoSnapshot = null;
  aiLastBreakdown = null;
  updateCounts();
  if (state.view === 'library') renderGrid();
  if (state.view === 'compare') renderCompare();
  closeModal('modal-ai');
  flash(state.lang === 'cn' ? '已撤销 AI 整理' : 'AI organize undone');
}

// ---------- Sidebar / Inspector collapse ----------
function applyCollapse() {
  const layout = $('#lib-layout');
  if (!layout) return;
  layout.classList.toggle('collapsed-sidebar',   state.sidebarCollapsed);
  layout.classList.toggle('collapsed-inspector', state.inspectorCollapsed);
  $('#btn-toggle-sidebar')?.classList.toggle('active',  !state.sidebarCollapsed);
  $('#btn-toggle-inspector')?.classList.toggle('active', !state.inspectorCollapsed);
  // Update edge-handle chevron direction
  const ptL = $('#pt-left');
  const ptR = $('#pt-right');
  if (ptL) ptL.textContent = state.sidebarCollapsed ? '›' : '‹';
  if (ptR) ptR.textContent = state.inspectorCollapsed ? '‹' : '›';
}
function toggleSidebar() {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  applyCollapse();
  flash(state.sidebarCollapsed ? t('flash.sidebar-hide') : t('flash.sidebar-show'));
}
function toggleInspector() {
  state.inspectorCollapsed = !state.inspectorCollapsed;
  applyCollapse();
  flash(state.inspectorCollapsed ? t('flash.inspector-hide') : t('flash.inspector-show'));
}

// ---------- Toast ----------
let flashTimer;
function flash(msg) {
  const el = $('#shortcut-hint');
  el.innerHTML = msg;
  el.hidden = false;
  el.style.animation = 'none'; void el.offsetHeight;
  el.style.animation = '';
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { el.hidden = true; }, 1400);
}

// ---------- Theme ----------
function setTheme(v) {
  if (v === 'system') {
    v = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  state.theme = v;
  document.documentElement.dataset.theme = v;
}
function toggleTheme() {
  setTheme(state.theme === 'dark' ? 'light' : 'dark');
  flash(state.theme === 'dark' ? t('flash.dark') : t('flash.light'));
}

// ---------- Language ----------
function setLanguage(lang) {
  state.lang = lang;
  document.documentElement.lang = (lang === 'cn') ? 'zh' : 'en';
  applyLanguage();
  flash(t('flash.lang.' + lang));
}
function applyLanguage() {
  $$('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    el.textContent = t(k);
  });
  $$('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  $$('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  // Re-render dynamic content
  renderProjects();
  renderMeCard();
  if (state.currentProjectId) {
    renderSidebarPeople();
    renderInspector();
    renderFilmstrip();
    if (state.view === 'library')  renderGrid();
    if (state.view === 'loupe')    renderLoupe();
    if (state.view === 'compare')  renderCompare();
    if (state.view === 'people')   renderPeopleView();
  }
  // Settings modal labels that get re-rendered
  if (!$('#modal-settings').hidden) {
    renderFaceList();
    renderUnnamedList();
    renderShortcutList();
    renderModelList();
  }
  // Crumbs (sub-context might use translated word)
  setView(state.view);
}

// ---------- Wire up ----------
function bindEvents() {
  // Title bar
  $('#btn-back').addEventListener('click', () => {
    if (state.view === 'library') setView('welcome');
    else setView('library');
  });
  $('#btn-theme').addEventListener('click', toggleTheme);
  $('#btn-cmdk').addEventListener('click', () => openModal('modal-cmdk'));
  $('#btn-settings').addEventListener('click', () => openModal('modal-settings'));
  $('#btn-export').addEventListener('click', () => openModal('modal-export'));

  // Status bar
  $('#btn-tools').addEventListener('click', () => openModal('modal-tools'));
  $('#sb-slider').addEventListener('input', e => {
    state.thumbSize = parseInt(e.target.value);
    $('#photo-grid').style.setProperty('--thumb-size', state.thumbSize + 'px');
  });
  $$('#view-seg .seg-btn').forEach(b => {
    b.addEventListener('click', () => {
      const m = b.dataset.mode;
      if (m === 'grid')    setView('library');
      if (m === 'loupe')   setView('loupe');
      if (m === 'compare') setView('compare');
    });
  });

  // Sidebar collections
  $$('.sb-item').forEach(b => {
    b.addEventListener('click', () => {
      $$('.sb-item').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      state.collection = b.dataset.collection;
      state.selectedPersonId = null;
      renderSidebarPeople();
      renderGrid();
      const tab = ['all','picks','rejects','unrated'].includes(state.collection) ? state.collection : null;
      if (tab) $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    });
  });

  // Tabs
  $$('.tab').forEach(b => {
    b.addEventListener('click', () => {
      $$('.tab').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      state.collection = b.dataset.tab;
      $$('.sb-item').forEach(x => x.classList.toggle('active', x.dataset.collection === state.collection));
      renderGrid();
    });
  });

  // Chips
  $$('.chip[data-chip]').forEach(b => {
    b.addEventListener('click', () => {
      const k = b.dataset.chip;
      if (state.filters.has(k)) state.filters.delete(k);
      else state.filters.add(k);
      b.classList.toggle('active');
      renderGrid();
    });
  });

  // Compare layout
  $$('#cmp-layout .seg-btn').forEach(b => {
    b.addEventListener('click', () => {
      $$('#cmp-layout .seg-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      state.cmpLayout = parseInt(b.dataset.layout);
      renderCompare();
    });
  });
  $('#cmp-keep-best').addEventListener('click', () => {
    const burst = state.photos.filter(p => p.burst === 'burst-1432');
    burst.forEach(p => { p.state = p.bestInBurst ? 'pick' : 'reject'; });
    updateCounts();
    renderCompare();
    flash(t('flash.kept-best'));
  });

  // Loupe rating / flag
  $$('#rating-bar .rb-star').forEach((s, i) => {
    s.addEventListener('click', () => ratePhoto(i + 1));
  });
  $('.fb-btn.pick').addEventListener('click', () => pickPhoto());
  $('.fb-btn.rej').addEventListener('click', () => rejectPhoto());
  $('#loupe-prev').addEventListener('click', () => navPhoto(-1));
  $('#loupe-next').addEventListener('click', () => navPhoto(1));
  $('#loupe-frame').addEventListener('click', () => setView('library'));

  // People view
  $('#btn-add-person').addEventListener('click', () => openModal('modal-register'));
  $('#btn-register-2').addEventListener('click', () => openModal('modal-register'));
  $('#reg-submit').addEventListener('click', () => {
    flash(t('flash.registering'));
    closeModal('modal-register');
  });
  $('#ppl-export').addEventListener('click', () => openModal('modal-export'));

  // Settings tabs
  $$('#settings-tabs .settings-tab').forEach(b => {
    b.addEventListener('click', () => setSettingsTab(b.dataset.pane));
  });
  $('#set-lang').addEventListener('change', e => setLanguage(e.target.value));
  $('#set-theme-select').addEventListener('change', e => setTheme(e.target.value));
  $('#set-cache-clear').addEventListener('click', () => flash(t('flash.cache-cleared')));
  $('#set-cache-browse').addEventListener('click', () => flash(t('flash.cache-set')));
  $('#set-lib-browse').addEventListener('click', () => flash(t('flash.cache-set')));
  $('#set-add-face').addEventListener('click', () => openModal('modal-register'));
  $('#set-gpu').addEventListener('change', e => {
    state.gpu = e.target.checked;
    renderMeCard();
    flash(state.gpu ? t('flash.gpu.on') : t('flash.gpu.off'));
  });

  // Welcome "Me" card
  $('#me-avatar').addEventListener('click', () => flash(t('flash.demo-picker')));
  $('#me-name').addEventListener('click', () => {
    const newName = prompt(t('me.prompt-name'), state.profile.name || '');
    if (newName !== null && newName.trim()) {
      state.profile.name = newName.trim();
      renderMeCard();
    }
  });
  $('#me-all-settings').addEventListener('click', () => openModal('modal-settings'));
  $$('.me-quick .clickable').forEach(el => {
    el.addEventListener('click', () => {
      openModal('modal-settings');
      setTimeout(() => setSettingsTab(el.dataset.jump), 50);
    });
  });

  // Title-bar collapse toggles
  $('#btn-toggle-sidebar').addEventListener('click', toggleSidebar);
  $('#btn-toggle-inspector').addEventListener('click', toggleInspector);
  $('#pt-left').addEventListener('click', toggleSidebar);
  $('#pt-right').addEventListener('click', toggleInspector);

  // AI auto-organize
  $('#cmp-ai-organize').addEventListener('click', openAIModal);
  $('#lib-ai-organize').addEventListener('click', openAIModal);
  $('#ai-apply').addEventListener('click', applyAIOrganize);
  $('#ai-undo-btn').addEventListener('click', undoAIOrganize);

  // Export modal — format / quality / resolution
  $$('#exp-format .seg-btn').forEach(b => b.addEventListener('click', () => {
    $$('#exp-format .seg-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    expState.format = b.dataset.fmt;
    refreshExportPreview();
  }));
  $$('#exp-resolution .seg-btn').forEach(b => b.addEventListener('click', () => {
    $$('#exp-resolution .seg-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    expState.resolution = b.dataset.res;
    refreshExportPreview();
  }));
  $('#exp-quality').addEventListener('input', e => {
    const q = parseInt(e.target.value);
    expState.quality = q;
    $('#exp-quality-val').textContent = q;
    $$('#exp-quality-snaps button').forEach(b =>
      b.classList.toggle('active', parseInt(b.dataset.q) === q));
    refreshExportPreview();
  });
  $$('#exp-quality-snaps button').forEach(b => b.addEventListener('click', () => {
    $('#exp-quality').value = b.dataset.q;
    $('#exp-quality').dispatchEvent(new Event('input'));
  }));
  $('#exp-naming').addEventListener('input', refreshExportPreview);

  // Editable project name in title bar
  const crumbs = $('#tb-crumbs');
  crumbs.addEventListener('click', () => {
    if (state.view !== 'welcome' && !crumbs.classList.contains('editing')) startEditProject();
  });
  crumbs.addEventListener('blur', () => endEditProject(true));
  crumbs.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); endEditProject(true);  crumbs.blur(); }
    if (e.key === 'Escape') { e.preventDefault(); endEditProject(false); crumbs.blur(); }
  });

  // Modal close
  // Modal close — only the parent modal, not all stacks
  $$('[data-close]').forEach(b => b.addEventListener('click', () => {
    const m = b.closest('.modal');
    if (m) closeModal(m);
  }));
  $$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeModal(m); }));

  // Dropzone
  const dz = $('#dropzone');
  ['dragenter','dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
  ['dragleave','drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
  dz.addEventListener('drop', () => {
    flash(t('flash.demo-folder'));
    setTimeout(() => openProject('wedding'), 600);
  });
  dz.addEventListener('click', () => flash(t('flash.demo-picker')));
  $('#btn-new-project').addEventListener('click', () => flash(t('flash.demo-picker')));

  window.addEventListener('keydown', onKey);
}

function onKey(e) {
  const inInput = ['INPUT','TEXTAREA'].includes(e.target.tagName);
  if (e.key === 'Escape') { closeTopModal(); return; }
  if (inInput) return;

  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openModal('modal-cmdk'); return; }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') { e.preventDefault(); openModal('modal-export'); return; }
  if ((e.metaKey || e.ctrlKey) && e.key === ',')               { e.preventDefault(); openModal('modal-settings'); return; }
  if ((e.metaKey || e.ctrlKey) && e.key === '[')               { e.preventDefault(); toggleSidebar(); return; }
  if ((e.metaKey || e.ctrlKey) && e.key === ']')               { e.preventDefault(); toggleInspector(); return; }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undoAIOrganize(); return; }

  if (e.key.toLowerCase() === 'g' && state.view !== 'welcome') { setView('library'); return; }
  if (e.key.toLowerCase() === 'l' && state.view !== 'welcome') { setView('loupe');   return; }
  if (e.key.toLowerCase() === 'c' && state.view !== 'welcome') { setView('compare'); return; }

  if (state.view === 'library' || state.view === 'loupe') {
    if (e.key >= '1' && e.key <= '5') { ratePhoto(parseInt(e.key)); return; }
    if (e.key === '0') { ratePhoto(0); return; }
    if (e.key.toLowerCase() === 'p') { pickPhoto(); return; }
    if (e.key.toLowerCase() === 'x') { rejectPhoto(); return; }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); navPhoto(1); return; }
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); navPhoto(-1); return; }
    if (e.key === 'Enter') { setView('loupe'); return; }
    if (e.key === ' ') { e.preventDefault(); setView(state.view === 'library' ? 'loupe' : 'library'); return; }
  }

  if (e.key.toLowerCase() === 't') toggleTheme();
}

// ---------- Boot ----------
document.addEventListener('DOMContentLoaded', () => {
  renderProjects();
  renderMeCard();
  applyCollapse();
  applyLanguage();
  bindEvents();
});
