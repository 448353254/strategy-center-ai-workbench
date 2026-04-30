# 策略中心 AI 工作台

## 启动

开发模式建议同时启动本地 API 和 Vite：

```bash
npm run dev:all
```

也可以分两个终端启动：

```bash
npm run api
npm run dev
```

构建并预览：

```bash
npm run build
npm run preview
```

项目进度页可在开发服务启动后访问：

```text
http://localhost:5173/progress.html
```

## 本地数据

项目、资料、成员、AI 任务、Brief 配置等状态会同步到：

```text
data/workbench-db.json
```

浏览器 `localStorage` 仍作为后端不可用时的兜底。

## 本地 API

本地 API 默认运行在：

```text
http://localhost:8787
```

已实现接口：

- `GET /api/state/:key`：读取状态
- `PUT /api/state/:key`：写入状态
- `POST /api/brief-models`：代理拉取模型列表
- `POST /api/brief-run`：代理调用 Brief 解析接口
- `POST /api/resources/upload`：上传并解析 PDF、Word、Excel、TXT/Markdown/CSV
- `POST /api/resources/search`：关键词 + 本地语义向量检索资料库
- `GET /api/search-settings`：读取知识库检索方式
- `PUT /api/search-settings`：保存知识库检索方式

Brief 外部 API Key 只发送到本地 Node 服务，再由本地服务调用外部接口，避免浏览器直接请求外部模型接口。

## 资料库检索

文件解析成功后会生成正文切块和轻量本地向量，保存在资料记录内。资料库搜索会同时计算：

- 标题、标签、摘要、正文的关键词命中分
- 正文切块与查询文本的本地语义相似度

当前语义检索为本地轻量实现，不依赖外部 embedding API；后续可以替换为 OpenAI、DeepSeek 或其他 embedding 服务。

可在“系统设置 > 知识库检索方式”切换：

- 本地轻量语义：默认模式，不依赖外部接口
- 纯关键词：只按标题、标签、摘要和正文命中排序
- 外部 Embedding：预留外部 embedding 接口、Key 和模型配置；接口不可用时后端回退本地轻量语义
