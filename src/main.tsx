import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type Page =
  | "home"
  | "projects"
  | "projectDetail"
  | "people"
  | "resources"
  | "resourceUpload"
  | "resourceDetail"
  | "brief"
  | "outline"
  | "aiJobs"
  | "settings";

type Risk = "正常" | "一般" | "紧急" | "严重";
type TaskStatus = "未开始" | "进行中" | "已完成" | "延期" | "暂停";
type Priority = "P1" | "P2" | "P3";

const riskOptions: Risk[] = ["正常", "一般", "紧急", "严重"];
const taskStatusOptions: TaskStatus[] = ["未开始", "进行中", "已完成", "延期", "暂停"];
const memberStatusOptions: Member["status"][] = ["正常", "请假", "加班"];

interface ProjectTask {
  id: number;
  phase: string;
  name: string;
  owner: string;
  ownerId?: number;
  department: string;
  start: string;
  end: string;
  dependency: string;
  status: TaskStatus;
  progress: number;
  delayReason?: string;
  risk: Risk;
  priority?: Priority;
}

interface Project {
  id: number;
  name: string;
  game: string;
  client: string;
  type: string;
  owner: string;
  ownerId?: number;
  stage: string;
  start: string;
  submit: string;
  pitch: string;
  status: string;
  risk: Risk;
  tasks: ProjectTask[];
  resourceIds?: number[];
}

interface Resource {
  id: number;
  title: string;
  type: string;
  summary: string;
  content: string;
  tags: string[];
  uploader: string;
  uploadedAt: string;
  visibility: string;
  sensitive: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  parseStatus?: "等待中" | "解析中" | "成功" | "失败";
  parseError?: string;
  chunks?: Array<{ id: string; text: string; embedding?: Record<string, number> }>;
}

interface AiJob {
  id: number;
  type: string;
  name: string;
  owner: string;
  createdAt: string;
  status: string;
  source: string;
}

interface Member {
  id: number;
  name: string;
  role: string;
  status: "正常" | "请假" | "加班";
  monthlyCapacity: number;
  avgDeliveryDays: number;
  skills: string[];
}

interface BriefApiConfig {
  endpoint: string;
  apiKey: string;
  model: string;
}

interface SearchSettings {
  mode: "local-semantic" | "keyword" | "external-embedding";
  embeddingEndpoint: string;
  embeddingApiKey: string;
  embeddingModel: string;
}

interface DemandDeconstructionForm {
  projectName: string;
  gameName: string;
  projectType: string;
  usage: string;
  goals: string;
  budget: string;
  timeline: string;
  forbidden: string;
  brandTone: string;
  brief: string;
  communication: string;
}

interface ProposalWorkbenchForm {
  projectType: string;
  usage: string;
  tone: string;
  brandElements: string;
  modules: string;
  pageLimit: string;
  visualAssets: string;
  pastTemplates: string;
  clientPreference: string;
}

interface WebAssetSource {
  id: number;
  url: string;
  focus: string;
  addedAt: string;
}

interface TemplateAsset {
  id: number;
  name: string;
  category: "历史方案" | "通用模板";
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

interface ContentCheckForm {
  draft: string;
  checkDimensions: string;
  forbidden: string;
  standards: string;
  constraints: string;
  commonIssues: string;
}

const initialTasks: ProjectTask[] = [
  {
    id: 1,
    phase: "前置调研",
    name: "用户与竞品资料整理",
    owner: "林岚",
    ownerId: 2,
    department: "策略",
    start: "04-29",
    end: "05-02",
    dependency: "-",
    status: "进行中",
    progress: 65,
    risk: "正常",
  },
  {
    id: 2,
    phase: "策略方案",
    name: "核心策略与创意主题",
    owner: "陈舟",
    ownerId: 3,
    department: "策略",
    start: "05-03",
    end: "05-06",
    dependency: "用户与竞品资料整理",
    status: "未开始",
    progress: 0,
    risk: "一般",
  },
  {
    id: 3,
    phase: "内部评审",
    name: "方案初稿评审",
    owner: "王西",
    ownerId: 4,
    department: "商务",
    start: "05-07",
    end: "05-07",
    dependency: "核心策略与创意主题",
    status: "延期",
    progress: 20,
    delayReason: "客户补充需求未确认",
    risk: "紧急",
  },
];

const projectsSeed: Project[] = [
  {
    id: 101,
    name: "星河边境新品上线投标",
    game: "星河边境",
    client: "某头部游戏厂商",
    type: "新品上线",
    owner: "周齐",
    ownerId: 1,
    stage: "方案制作",
    start: "2026-04-29",
    submit: "2026-05-08",
    pitch: "2026-05-10",
    status: "进行中",
    risk: "紧急",
    tasks: initialTasks,
    resourceIds: [1, 3],
  },
  {
    id: 102,
    name: "花间旅人周年活动方案",
    game: "花间旅人",
    client: "某女性向游戏团队",
    type: "活动推广",
    owner: "林岚",
    ownerId: 2,
    stage: "调研洞察",
    start: "2026-04-25",
    submit: "2026-05-05",
    pitch: "2026-05-06",
    status: "进行中",
    risk: "一般",
    tasks: initialTasks.slice(0, 2),
    resourceIds: [2],
  },
];

const resourcesSeed: Resource[] = [
  {
    id: 1,
    title: "二次元手游新品上线投标方案",
    type: "方案",
    summary: "围绕世界观、角色人设、预约转化和核心玩家扩散设计的新品上线方案。",
    content: "二次元手游新品上线投标方案，重点包括世界观预热、角色 PV、预约转化、核心玩家扩散、社区话题运营、KOL 首发测评、渠道资源整合。",
    tags: ["二次元", "新品上线", "投标", "高复用"],
    uploader: "陈舟",
    uploadedAt: "2026-04-20",
    visibility: "策略部门",
    sensitive: "内部",
  },
  {
    id: 2,
    title: "春节活动整合营销文案库",
    type: "文案",
    summary: "包含节日节点、社交传播、短视频口播、社区互动等多类型文案模板。",
    content: "春节活动整合营销文案库，覆盖红包福利、登录奖励、节日剧情、短视频口播、社区互动、玩家召回、休闲游戏节日氛围包装。",
    tags: ["春节", "活动推广", "文案", "休闲"],
    uploader: "林岚",
    uploadedAt: "2026-04-18",
    visibility: "项目成员",
    sensitive: "普通",
  },
  {
    id: 3,
    title: "女性向游戏舆情风险复盘",
    type: "复盘",
    summary: "整理女性向游戏在角色设定、福利节奏、商业化表达中的高频舆情风险。",
    content: "女性向游戏舆情风险复盘，包含角色人设争议、福利节奏、商业化强度、文案尺度、KOL 发言风险、玩家社群情绪管理。",
    tags: ["女性向", "舆情风险", "复盘", "避坑"],
    uploader: "王西",
    uploadedAt: "2026-04-12",
    visibility: "策略部门",
    sensitive: "保密",
  },
];

function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const cached = localStorage.getItem(key);
    return cached ? (JSON.parse(cached) as T) : initialValue;
  });
  const [backendReady, setBackendReady] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/state/${encodeURIComponent(key)}`)
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          const data = await response.json();
          setValue(data.value as T);
          setBackendAvailable(true);
        } else if (response.status === 404) {
          setBackendAvailable(true);
        }
      })
      .catch(() => {
        if (!cancelled) setBackendAvailable(false);
      })
      .finally(() => {
        if (!cancelled) setBackendReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
    if (!backendReady || !backendAvailable) return;
    fetch(`/api/state/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value }),
    }).catch(() => undefined);
  }, [backendAvailable, backendReady, key, value]);

  return [value, setValue] as const;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function memberName(members: Member[], ownerId?: number, fallback = "未分配") {
  if (!ownerId) return fallback || "未分配";
  return members.find((member) => member.id === ownerId)?.name ?? "未分配";
}

function findMemberIdByName(members: Member[], name: string) {
  return members.find((member) => member.name === name)?.id;
}

function downloadText(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: string | number | undefined) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function formatFileSize(size?: number) {
  if (!size) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function normalizeWebUrl(value: string) {
  const raw = value.trim();
  if (!raw) return "";
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function buildVisualAssetSummary(sources: WebAssetSource[], notes: string) {
  const lines = sources.map((source, index) => `${index + 1}. ${source.url}${source.focus ? `｜抓取重点：${source.focus}` : ""}`);
  if (notes.trim()) lines.push(`补充说明：${notes.trim()}`);
  return lines.join("\n");
}

function buildTemplateAssetSummary(templates: TemplateAsset[], notes: string) {
  const lines = templates.map((template, index) => `${index + 1}. ${template.category}：${template.name}（${template.fileName}，${formatFileSize(template.fileSize)}）`);
  if (notes.trim()) lines.push(`补充说明：${notes.trim()}`);
  return lines.join("\n");
}

function inferTags(text: string) {
  const rules: Array<[string, string[]]> = [
    ["二次元", ["二次元", "角色", "世界观"]],
    ["女性向", ["女性向", "乙游", "恋爱", "角色好感"]],
    ["新品上线", ["新品", "上线", "预约", "首发"]],
    ["活动推广", ["活动", "节日", "周年", "春节"]],
    ["投标", ["投标", "讲标", "客户", "报价"]],
    ["舆情风险", ["舆情", "负面", "风险", "争议"]],
    ["竞品分析", ["竞品", "对标", "竞对"]],
    ["文案", ["文案", "口播", "标题", "脚本"]],
  ];
  const matched = rules.filter(([, keywords]) => keywords.some((keyword) => text.includes(keyword))).map(([tag]) => tag);
  return Array.from(new Set(matched.length ? matched : ["待分类"]));
}

function summarize(text: string) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "暂无内容摘要，请补充资料正文或备注。";
  return compact.length > 92 ? `${compact.slice(0, 92)}...` : compact;
}

function buildBriefPrompt(form: { projectName: string; gameName: string; projectType: string; usage: string; forbidden: string; brief: string }) {
  return `请基于以下客户 Brief 输出一份中文需求解构报告。

输出结构：
1. 项目背景摘要
2. 核心需求
3. 需求优先级
4. 隐性需求
5. 禁忌与约束
6. 客户确认 QA
7. 自动标签

项目名称：${form.projectName || "未命名项目"}
游戏名称：${form.gameName || "未填写"}
项目类型：${form.projectType}
方案用途：${form.usage}
禁忌要求：${form.forbidden || "暂无"}
客户 Brief：
${form.brief || "暂无正文"}`;
}

function inferModelsEndpoint(endpoint: string) {
  const trimmed = endpoint.trim();
  if (!trimmed) return "";
  if (trimmed.endsWith("/models")) return trimmed;
  return trimmed.replace(/\/chat\/completions\/?$/, "").replace(/\/responses\/?$/, "").replace(/\/$/, "") + "/models";
}

function buildLocalBriefReport(form: { projectName: string; gameName: string; projectType: string; usage: string; forbidden: string; brief: string }) {
  const text = `${form.projectName} ${form.gameName} ${form.projectType} ${form.usage} ${form.forbidden} ${form.brief}`;
  const tags = inferTags(text);
  return `项目：${form.projectName || "未命名项目"}
游戏：${form.gameName || "未填写"}
项目类型：${form.projectType}
方案用途：${form.usage}

项目背景摘要：
${summarize(form.brief || text)}

核心需求：
1. 围绕“${form.gameName || "目标游戏"}”建立清晰的营销主线，避免只罗列执行动作。
2. 结合“${form.projectType}”场景，明确目标用户、传播卖点、渠道节奏和效果衡量方式。
3. 输出可落地的执行排期，便于策略、商务、媒介、设计协同推进。

需求优先级：
P1：核心策略、用户洞察、执行路径。
P2：创意玩法、渠道组合、案例支撑。
P3：视觉包装、延展文案、备选玩法。

隐性需求：
1. 客户大概率关注方案是否既有创意又能落地。需人工确认。
2. 如果这是${form.usage}场景，建议强化公司资源、历史案例和风险应对。需人工确认。

禁忌与约束：
${form.forbidden || "暂无明确禁忌，建议向客户确认预算、渠道限制、不可使用素材和敏感表达。"}

客户确认 QA：
1. 是否已有明确预算区间？
2. 是否有不可使用的渠道或 KOL 类型？
3. 讲标时更关注创意亮点、数据支撑还是执行可落地性？
4. 是否有必须复用的历史素材、品牌规范或客户偏好模板？

AI 标签：
${tags.join("、")}`;
}

function buildDemandPrompt(form: DemandDeconstructionForm) {
  return `你是游戏营销策略中心的需求解构顾问。请基于以下客户 BF 资料与沟通记录，输出一份完整的需求解构结果。

请严格按照以下结构输出：
1. 需求解构报告
- 核心需求
- 次要需求
- 隐性需求
- 每项需求的优先级
- 约束条件（预算、时间、品牌禁忌、资源限制）
2. 需求疑问梳理
- 列出不明确、有歧义或信息缺失的点
- 输出对客户的 QA 清单，按优先级排序
3. 需求匹配建议
- 结合现有资源做可行性分析
- 标注哪些需求可能需要外部资源支持
- 给出方案制作时建议重点强调的核心方向

项目信息：
- 项目名称：${form.projectName || "未命名项目"}
- 游戏名称：${form.gameName || "未填写"}
- 项目类型：${form.projectType || "未填写"}
- 方案用途：${form.usage || "未填写"}
- 项目目标：${form.goals || "未填写"}
- 预算信息：${form.budget || "未明确"}
- 时间节点：${form.timeline || "未明确"}
- 品牌调性：${form.brandTone || "未明确"}
- 禁忌要求：${form.forbidden || "暂无"}

客户 BF 资料：
${form.brief || "暂无 BF 正文"}

客户沟通记录：
${form.communication || "暂无补充沟通记录"}`;
}

function buildLocalDemandReport(form: DemandDeconstructionForm) {
  const source = [form.projectName, form.gameName, form.projectType, form.usage, form.goals, form.budget, form.timeline, form.brandTone, form.forbidden, form.brief, form.communication].join(" ");
  const tags = inferTags(source);
  const constraintLines = [
    form.budget ? `- 预算约束：${form.budget}` : "- 预算约束：客户尚未给出明确预算区间，需优先确认。",
    form.timeline ? `- 时间约束：${form.timeline}` : "- 时间约束：时间节点未明确，需确认提案、上线和复盘节奏。",
    form.forbidden ? `- 禁忌要求：${form.forbidden}` : "- 禁忌要求：暂未提供明确禁忌，需确认敏感话题、竞品边界和素材限制。",
    form.brandTone ? `- 品牌调性：${form.brandTone}` : "- 品牌调性：品牌表达边界未明确，建议确认客户偏好的叙事风格。",
  ];
  const qaItems = [
    form.budget ? "1. 预算区间是否已经锁定？是否包含达人、媒介、制作和线下资源？" : "1. 请确认预算区间，以及预算是否区分媒介投放、内容制作、达人/KOL 和活动执行。",
    form.timeline ? "2. 当前时间节点是否包含提案确认、素材制作、上线执行和复盘交付四个阶段？" : "2. 请确认提案时间、执行起止时间、里程碑节点以及客户内部评审节奏。",
    "3. 是否有必须使用或明确禁止使用的渠道、资源位、联动对象或传播话题？",
    "4. 客户更看重创意新鲜感、执行可落地性，还是效果转化与数据证明？",
    "5. 是否已有历史方案、品牌模板或必须复用的内容资产？",
  ];
  return `需求解构报告
项目：${form.projectName || "未命名项目"} / ${form.gameName || "未填写游戏"} / ${form.projectType || "未填写类型"} / ${form.usage || "未填写用途"}
背景摘要：${summarize(`${form.goals} ${form.brief} ${form.communication}` || source)}

一. 核心需求
1. 围绕“${form.goals || "达成项目目标"}”构建可执行方案，优先解决客户最直接的业务结果诉求。
2. 结合“${form.projectType || "当前项目类型"}”场景，明确用户、渠道、创意与执行闭环，避免只停留在概念层。
3. 方案需兼顾客户的品牌调性与时间节奏，确保讲法清晰且能落地执行。

二. 次要需求
1. 优化玩家口碑、内容讨论度或品牌认知表现，作为核心目标的辅助证明。
2. 补齐客户在渠道偏好、案例支撑、预算拆分上的信心，提升方案说服力。

三. 隐性需求
1. 客户大概率希望方案既有创新感，又不要脱离执行现实。
2. 客户会关注我们能否调用内部资源或补足跨团队协同能力。
3. 如果用于${form.usage || "客户提案"}，客户通常还会在意方案是否“像成熟团队做出来的”。

四. 优先级与约束
- P1：项目目标、核心转化链路、主策略与执行路径。
- P2：创意包装、渠道组合、案例支撑、资源整合。
- P3：延展玩法、视觉优化、备选表达与补充素材。
${constraintLines.join("\n")}

需求疑问梳理
${qaItems.join("\n")}

需求匹配建议
1. 可行性分析：若客户目标偏向转化增长，建议把渠道投放、转化活动和节点运营作为主轴；若偏向品牌认知，建议强化内容事件、世界观表达和传播议题设计。
2. 资源匹配建议：对需要达人、媒介、跨界合作或线下资源的需求，应尽早确认是否需要外部资源支持。
3. 方案方向建议：优先输出“目标拆解 + 策略逻辑 + 执行排期 + 预算拆分 + 风险预案”的主框架，再决定创意包装层。
4. AI 标签：${tags.join("、")}`;
}

function buildProposalPrompt(form: ProposalWorkbenchForm, briefOutput: string, resources: Resource[]) {
  const related = resources.slice(0, 6).map((resource) => `${resource.title}（${resource.type}）`).join("；");
  return `你是游戏营销提案制作顾问。请基于以下输入，输出“方案制作工作台结果”，用于生成 PPT 模板和页面指引。

请按照以下结构输出：
1. PPT 模板
- 封面、目录、各必含模块页面框架
- 适配的游戏视觉风格建议
2. 页面布局建议
- 每页标题位置、图文比例、数据展示方式、视觉元素搭配
3. 内容填充提示
- 按页面逐条说明应填什么内容、重点突出什么
4. 模板优化建议
- 结合方案类型、客户偏好和品牌元素提出优化方向

方案类型：
- 项目类型：${form.projectType || "未填写"}
- 方案用途：${form.usage || "未填写"}

核心要求：
- PPT 调性：${form.tone || "专业严谨"}
- 品牌元素：${form.brandElements || "未填写"}
- 必含模块：${form.modules || "项目背景、目标、策略、执行计划、预算、效果预期"}
- 页数限制：${form.pageLimit || "未填写"}

参考素材：
- 游戏视觉素材：${form.visualAssets || "未填写"}
- 过往 PPT 模板：${form.pastTemplates || "未填写"}
- 客户偏好风格：${form.clientPreference || "未填写"}
- 资料库参考：${related || "暂无资料库参考"}

需求解构摘要：
${briefOutput || "暂无需求解构结果，请根据当前配置给出通用模板建议。"}`;
}

function buildLocalProposalReport(form: ProposalWorkbenchForm, briefOutput: string, resources: Resource[]) {
  const modules = form.modules.split(/[,，、]/).map((item) => item.trim()).filter(Boolean);
  const pages = modules.length ? modules : ["项目背景", "目标拆解", "核心策略", "执行计划", "预算", "效果预期"];
  const resourceHints = resources.slice(0, 4).map((resource) => `- ${resource.title}：可用于补充 ${resource.type} 参考`).join("\n") || "- 暂无资料库素材，建议先补充游戏视觉图、竞品案例和历史提案截图。";
  return `PPT 模板
方案类型：${form.projectType || "未填写"} / ${form.usage || "未填写"}
模板调性：${form.tone || "专业严谨"}
推荐页数：${form.pageLimit || "建议 15-20 页"}

基础页面框架
1. 封面：项目名 + 游戏名 + 提案主题 + 品牌视觉主画面。
2. 目录：按“背景 > 目标 > 策略 > 执行 > 预算 > 预期”铺开，保持叙事顺序。
${pages.map((page, index) => `${index + 3}. ${page}：保留标题区、结论区、视觉/数据展示区、行动建议区。`).join("\n")}

页面布局建议
1. 标题区建议统一放在页面左上，搭配一句结论型副标题，先给客户看“这一页想说明什么”。
2. 洞察与策略页建议采用 4:6 或 5:5 图文比例；预算、排期和效果预估页建议用表格 + 图标 + 标签强调重点。
3. 如有游戏视觉素材，优先使用角色立绘、场景大图和 UI 截图作为背景或氛围图，再用深色蒙版压住文字可读性。
4. 数据展示页尽量使用三段式：关键数字卡片、趋势图/结构图、业务解释，避免只堆数字。

内容填充提示
${pages.map((page, index) => {
  const lower = page.toLowerCase();
  let hint = "说明本页结论、支撑依据和下一步动作，避免只写描述性文字。";
  if (page.includes("背景")) hint = "交代游戏现状、市场环境、项目缘起和客户当前挑战。";
  if (page.includes("目标")) hint = "拆解客户核心目标、阶段性 KPI 和判断成功的标准。";
  if (page.includes("策略")) hint = "明确人群、卖点、传播主线和策略逻辑，说明为什么这样做。";
  if (page.includes("执行") || page.includes("计划")) hint = "按阶段拆执行动作、渠道节奏、负责人和资源需求。";
  if (page.includes("预算")) hint = "突出核心成本拆分、弹性预算项和预算对应的预期结果。";
  if (page.includes("效果") || page.includes("预期")) hint = "给出效果预估口径、关键指标和风险区间，避免口径模糊。";
  if (lower.includes("创意")) hint = "聚焦创意主题、内容玩法、视觉锤和传播记忆点。";
  return `${index + 1}. ${page}：${hint}`;
}).join("\n")}

模板优化建议
1. 如果客户偏好“${form.clientPreference || "简洁专业"}”，建议减少大段文案，改成结论句 + 证据块的表达。
2. 品牌元素“${form.brandElements || "待补充"}”建议沉淀成统一页眉、标签色、标题字体和数据高亮规则。
3. 若方案用于${form.usage || "客户提案"}，建议增加“为什么我们能做到”或“资源保障”页面，增强可信度。
4. 参考素材建议
${resourceHints}

需求解构引用
${briefOutput ? summarize(briefOutput) : "暂无需求解构结果，建议先完成需求解构后再细化模板。"}
`;
}

function buildContentCheckPrompt(form: ContentCheckForm, briefOutput: string) {
  return `你是游戏营销方案质检顾问。请基于以下方案大纲/PPT 初稿和检查要求，输出一份内容检查报告。

请按照以下结构输出：
1. 严重问题
2. 一般问题
3. 优化建议

每条问题都需要包含：
- 所属页面/模块
- 问题分类（需求匹配度 / 逻辑连贯性 / 内容完整性 / 数据准确性 / 文案规范性 / 视觉美观度）
- 问题说明
- 修改建议

方案大纲 / PPT 初稿：
${form.draft || "暂无草稿内容"}

检查要求：
- 检查维度：${form.checkDimensions || "需求匹配度、逻辑连贯性、内容完整性、数据准确性、文案规范性、视觉美观度"}
- 客户禁忌要求：${form.forbidden || "暂无"}
- 公司方案标准：${form.standards || "暂无"}
- 项目约束条件：${form.constraints || "暂无"}
- 过往常见问题：${form.commonIssues || "暂无"}

客户 BF 核心需求摘要：
${briefOutput || "暂无需求解构结果"}`;
}

function buildLocalContentCheckReport(form: ContentCheckForm, briefOutput: string) {
  const draftSummary = summarize(form.draft);
  return `内容检查报告
检查范围：${form.checkDimensions || "需求匹配度、逻辑连贯性、内容完整性、数据准确性、文案规范性、视觉美观度"}
草稿摘要：${draftSummary}

严重问题
1. 需求匹配度：若草稿中没有明确回应“${briefOutput ? summarize(briefOutput) : "客户核心需求"}”，方案容易出现讲得完整但答非所问的问题。建议在开头增加“客户目标拆解”页，并在后续每个模块对应目标。
2. 逻辑连贯性：如果策略、执行、预算三部分没有一一对应，客户会质疑方案落地性。建议为每个策略动作补充执行载体、资源需求和预算口径。

一般问题
1. 内容完整性：检查是否缺少项目背景、目标拆解、执行排期、预算拆分、效果预估、风险预案等基本模块。
2. 文案规范性：如果存在口语化表达、结论不明确或标题过长，建议改成“结论先行 + 证据支撑”的商务表达。
3. 数据准确性：若引用了市场数据、投放数据或历史案例，需补充来源、时间口径和适用前提。

优化建议
1. 视觉美观度：关键页尽量控制在 1 个主结论、3 个支撑点和 1 个视觉焦点，避免信息堆叠。
2. 客户禁忌对齐：${form.forbidden || "建议再次核对是否存在敏感话题、竞品提法或不可用素材。"}
3. 公司标准对齐：${form.standards || "建议补齐数据标注方式、预算说明口径和统一文案风格。"}
4. 项目约束提醒：${form.constraints || "请补充预算、时间和资源边界，避免方案看起来过满。"}
5. 常见问题回避：${form.commonIssues || "建议检查是否存在目标过虚、执行过散、预算过粗、亮点不够集中的问题。"}
`;
}

function daysUntil(dateText: string) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return 999;
  const todayDate = new Date(today());
  return Math.ceil((date.getTime() - todayDate.getTime()) / 86400000);
}

function parseScheduleDate(dateText: string, fallbackYear: string) {
  const normalized = /^\d{2}-\d{2}$/.test(dateText) ? `${fallbackYear}-${dateText}` : dateText;
  const date = new Date(`${normalized}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatMonthDay(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function daysBetween(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeTaskDate(dateText: string, project: Project) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return dateText;
  if (/^\d{2}-\d{2}$/.test(dateText)) return `${project.submit.slice(0, 4)}-${dateText}`;
  return dateText;
}

function inferTaskRisk(task: ProjectTask, project: Project): Risk {
  if (task.status === "已完成") return "正常";
  if (task.status === "延期") return task.progress < 30 ? "严重" : "紧急";
  if (task.status === "暂停") return "严重";

  const endDays = daysUntil(normalizeTaskDate(task.end, project));
  const submitDays = daysUntil(project.submit);
  const pitchDays = daysUntil(project.pitch);

  if (endDays < 0 && task.progress < 100) return "严重";
  if (endDays <= 1 && task.progress < 60) return "紧急";
  if (submitDays <= 2 && task.progress < 80) return "紧急";
  if (pitchDays <= 3 && task.progress < 80) return "紧急";
  if (endDays <= 3 && task.progress < 50) return "一般";
  if (task.status === "未开始" && submitDays <= 5) return "一般";
  return "正常";
}

function inferProjectRisk(project: Project): Risk {
  const tasks = project.tasks.map((task) => ({ ...task, risk: inferTaskRisk(task, project) }));
  const incompleteTasks = tasks.filter((task) => task.status !== "已完成");
  const delayedTasks = tasks.filter((task) => task.status === "延期");
  const severeTasks = tasks.filter((task) => task.risk === "严重");
  const urgentTasks = tasks.filter((task) => task.risk === "紧急");
  const averageProgress = project.tasks.length
    ? project.tasks.reduce((total, task) => total + task.progress, 0) / project.tasks.length
    : 100;
  const submitDays = daysUntil(project.submit);
  const pitchDays = daysUntil(project.pitch);

  if (severeTasks.length > 0 || delayedTasks.length >= 2 || (submitDays < 0 && incompleteTasks.length > 0)) return "严重";
  if (delayedTasks.length > 0 || urgentTasks.length > 0 || (submitDays <= 2 && incompleteTasks.length > 0) || (pitchDays <= 3 && averageProgress < 80)) return "紧急";
  if (tasks.some((task) => task.risk === "一般") || (submitDays <= 5 && incompleteTasks.length > 0) || averageProgress < 60) return "一般";
  return "正常";
}

function projectRiskReasons(project: Project) {
  const reasons: string[] = [];
  const incompleteTasks = project.tasks.filter((task) => task.status !== "已完成");
  const delayedTasks = project.tasks.filter((task) => task.status === "延期");
  const riskyTasks = project.tasks.filter((task) => {
    const risk = inferTaskRisk(task, project);
    return risk === "紧急" || risk === "严重";
  });
  const submitDays = daysUntil(project.submit);
  const pitchDays = daysUntil(project.pitch);

  if (delayedTasks.length) reasons.push(`${delayedTasks.length} 个任务已延期`);
  if (riskyTasks.length) reasons.push(`${riskyTasks.length} 个任务存在紧急或严重风险`);
  if (submitDays <= 5 && incompleteTasks.length) reasons.push(`距离方案提交 ${submitDays} 天，仍有 ${incompleteTasks.length} 个未完成任务`);
  if (pitchDays <= 3 && incompleteTasks.length) reasons.push(`距离讲标 ${pitchDays} 天，仍有未完成任务`);
  if (!reasons.length) reasons.push("当前任务进度、风险和关键节点未触发预警规则");
  return reasons;
}

function buildMemberLoadStats(members: Member[], projects: Project[]) {
  return members.map((member) => {
    const tasks = projects.flatMap((project) => project.tasks.filter((task) => task.ownerId === member.id || (!task.ownerId && task.owner === member.name)));
    const activeTasks = tasks.filter((task) => task.status !== "已完成");
    const delayedTasks = tasks.filter((task) => task.status === "延期");
    const loadRate = Math.round((activeTasks.length / Math.max(member.monthlyCapacity, 1)) * 100);
    const loadStatus = loadRate >= 90 ? "过载" : loadRate >= 70 ? "偏高" : loadRate >= 35 ? "正常" : "偏低";
    return { member, tasks, activeTasks, delayedTasks, loadRate, loadStatus };
  });
}

function projectSkillNeeds(project: Project) {
  return Array.from(
    new Set(
      project.tasks
        .filter((task) => task.status === "延期" || inferTaskRisk(task, project) === "紧急" || inferTaskRisk(task, project) === "严重")
        .flatMap((task) => [project.type, task.phase, task.name, task.department])
        .join(" ")
        .split(/\s+|、|与|和|\/|，/)
        .filter((word) => ["投标", "新品上线", "活动推广", "竞品", "洞察", "方案", "评审", "PPT", "商务", "文案", "用户"].some((keyword) => word.includes(keyword))),
    ),
  );
}

function recommendBackupMembers(project: Project, members: Member[], projects: Project[]) {
  const riskyTasks = project.tasks.filter((task) => task.status !== "已完成" && (task.status === "延期" || inferTaskRisk(task, project) !== "正常"));
  const needs = projectSkillNeeds(project);
  const currentOwnerIds = new Set(project.tasks.map((task) => task.ownerId).filter(Boolean));
  const loadStats = buildMemberLoadStats(members, projects);
  const currentAverage = project.tasks.length ? Math.round(project.tasks.reduce((total, task) => total + task.progress, 0) / project.tasks.length) : 100;
  const remainingWork = riskyTasks.reduce((total, task) => total + Math.max(0, 100 - task.progress), 0);

  return loadStats
    .filter((item) => item.member.status === "正常" && !currentOwnerIds.has(item.member.id) && item.loadStatus !== "过载")
    .map((item) => {
      const skillScore = needs.reduce((total, need) => total + (item.member.skills.some((skill) => skill.includes(need) || need.includes(skill)) ? 1 : 0), 0);
      const capacityScore = Math.max(0, 100 - item.loadRate);
      const matchScore = skillScore * 18 + capacityScore + (item.loadStatus === "偏低" ? 15 : 0);
      const addedCapacity = Math.max(10, Math.round((100 - item.loadRate) / 2) + skillScore * 6);
      const improvedRemaining = Math.max(0, remainingWork - addedCapacity);
      const projectedProgress = project.tasks.length
        ? Math.min(100, Math.round(100 - improvedRemaining / project.tasks.length))
        : currentAverage;
      return {
        ...item,
        skillScore,
        matchScore,
        projectedProgress: Math.max(currentAverage, projectedProgress),
        improvement: Math.max(0, projectedProgress - currentAverage),
        riskyTasks,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 4);
}

function generateProjectTasks(project: Project): ProjectTask[] {
  const ownerName = project.owner || "未分配";
  return [
    {
      id: Date.now() + 1,
      phase: "前置调研",
      name: `${project.game} 用户与竞品资料整理`,
      owner: ownerName,
      ownerId: project.ownerId,
      department: "策略",
      start: project.start.slice(5),
      end: "05-02",
      dependency: "-",
      status: "进行中",
      progress: 30,
      risk: "正常",
    },
    {
      id: Date.now() + 2,
      phase: "需求解构",
      name: "客户 Brief 拆解与 QA 清单",
      owner: ownerName,
      ownerId: project.ownerId,
      department: "策略/商务",
      start: "05-02",
      end: "05-03",
      dependency: "前置调研",
      status: "未开始",
      progress: 0,
      risk: "正常",
    },
    {
      id: Date.now() + 3,
      phase: "策略方案",
      name: "核心策略与方案大纲",
      owner: ownerName,
      ownerId: project.ownerId,
      department: "策略",
      start: "05-03",
      end: "05-06",
      dependency: "需求解构",
      status: "未开始",
      progress: 0,
      risk: project.submit ? "一般" : "正常",
    },
    {
      id: Date.now() + 4,
      phase: "内部评审",
      name: "方案初稿评审与修改",
      owner: ownerName,
      ownerId: project.ownerId,
      department: "策略/设计/商务",
      start: "05-06",
      end: project.submit.slice(5) || "05-08",
      dependency: "策略方案",
      status: "未开始",
      progress: 0,
      risk: "一般",
    },
  ];
}

const jobsSeed: AiJob[] = [
  { id: 1, type: "Brief 解析", name: "星河边境 Brief 需求解构", owner: "陈舟", createdAt: "11:10", status: "成功", source: "客户Brief.docx" },
  { id: 2, type: "文档解析", name: "二次元手游新品上线投标方案", owner: "林岚", createdAt: "10:48", status: "成功", source: "资料库" },
  { id: 3, type: "排期生成", name: "星河边境项目排期", owner: "周齐", createdAt: "10:22", status: "成功", source: "项目跟进" },
];

const membersSeed: Member[] = [
  { id: 1, name: "周齐", role: "主策划", status: "正常", monthlyCapacity: 8, avgDeliveryDays: 5, skills: ["新品上线", "投标", "策略统筹"] },
  { id: 2, name: "林岚", role: "调研策划", status: "正常", monthlyCapacity: 10, avgDeliveryDays: 3, skills: ["用户洞察", "竞品分析", "女性向"] },
  { id: 3, name: "陈舟", role: "执行策划", status: "加班", monthlyCapacity: 9, avgDeliveryDays: 4, skills: ["方案大纲", "二次元", "活动推广"] },
  { id: 4, name: "王西", role: "执行策划", status: "正常", monthlyCapacity: 7, avgDeliveryDays: 6, skills: ["商务协同", "PPT跟进", "内部评审"] },
];

function App() {
  const [page, setPage] = useState<Page>("home");
  const [projects, setProjects] = usePersistentState<Project[]>("strategy-center-projects", projectsSeed);
  const [resources, setResources] = usePersistentState<Resource[]>("strategy-center-resources", resourcesSeed);
  const [jobs, setJobs] = usePersistentState<AiJob[]>("strategy-center-ai-jobs", jobsSeed);
  const [members, setMembers] = usePersistentState<Member[]>("strategy-center-members", membersSeed);
  const [selectedProjectId, setSelectedProjectId] = useState(101);
  const [selectedResourceId, setSelectedResourceId] = useState(1);
  const [briefOutput, setBriefOutput] = usePersistentState("strategy-center-brief-output", "");
  const [outlineOutput, setOutlineOutput] = usePersistentState("strategy-center-outline-output", "");
  const [contentCheckOutput, setContentCheckOutput] = usePersistentState("strategy-center-content-check-output", "");
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? projects[0];
  const selectedResource = resources.find((resource) => resource.id === selectedResourceId) ?? resources[0];

  useEffect(() => {
    setProjects((current) => {
      let changed = false;
      const migrated = current.map((project) => {
        const ownerId = project.ownerId ?? findMemberIdByName(members, project.owner);
        const owner = ownerId ? memberName(members, ownerId, project.owner) : project.owner;
        const tasks = project.tasks.map((task) => {
          const taskOwnerId = task.ownerId ?? findMemberIdByName(members, task.owner);
          const taskOwner = taskOwnerId ? memberName(members, taskOwnerId, task.owner) : task.owner;
          if (taskOwnerId !== task.ownerId || taskOwner !== task.owner) changed = true;
          return taskOwnerId ? { ...task, ownerId: taskOwnerId, owner: taskOwner } : task;
        });
        if (ownerId !== project.ownerId || owner !== project.owner) changed = true;
        return ownerId ? { ...project, ownerId, owner, tasks } : { ...project, tasks };
      });
      return changed ? migrated : current;
    });
  }, [members, setProjects]);

  const addJob = (type: string, name: string, source: string) => {
    setJobs((current) => [
      { id: Date.now(), type, name, owner: "当前用户", createdAt: "刚刚", status: "成功", source },
      ...current,
    ]);
  };

  const navigateProject = (id: number) => {
    setSelectedProjectId(id);
    setPage("projectDetail");
  };

  const navigateResource = (id: number) => {
    setSelectedResourceId(id);
    setPage("resourceDetail");
  };

  const deleteResource = (resourceId: number) => {
    const resource = resources.find((item) => item.id === resourceId);
    setResources((current) => current.filter((item) => item.id !== resourceId));
    setProjects((current) =>
      current.map((project) => ({ ...project, resourceIds: (project.resourceIds ?? []).filter((id) => id !== resourceId) })),
    );
    addJob("资料删除", resource?.title ?? `资料 ${resourceId}`, "资料库");
    setPage("resources");
  };

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} />
      <main className="workspace">
        <Topbar setPage={setPage} />
        {page === "home" && <Home projects={projects} members={members} jobs={jobs} setPage={setPage} openProject={navigateProject} />}
        {page === "projects" && <Projects projects={projects} members={members} openProject={navigateProject} setProjects={setProjects} addJob={addJob} />}
        {page === "projectDetail" && <ProjectDetail project={selectedProject} members={members} projects={projects} resources={resources} openResource={navigateResource} setPage={setPage} setProjects={setProjects} addJob={addJob} />}
        {page === "people" && <PeopleManagement members={members} setMembers={setMembers} projects={projects} addJob={addJob} />}
        {page === "resources" && <Resources resources={resources} openResource={navigateResource} deleteResource={deleteResource} setPage={setPage} />}
        {page === "resourceUpload" && <ResourceUpload setResources={setResources} setPage={setPage} addJob={addJob} />}
        {page === "resourceDetail" && <ResourceDetail resource={selectedResource} deleteResource={deleteResource} setPage={setPage} addJob={addJob} />}
        {page === "brief" && <BriefAssistant briefOutput={briefOutput} setBriefOutput={setBriefOutput} outlineOutput={outlineOutput} setOutlineOutput={setOutlineOutput} contentCheckOutput={contentCheckOutput} setContentCheckOutput={setContentCheckOutput} resources={resources} setResources={setResources} setPage={setPage} addJob={addJob} />}
        {page === "outline" && <OutlineAssistant briefOutput={briefOutput} setBriefOutput={setBriefOutput} resources={resources} setResources={setResources} outlineOutput={outlineOutput} setOutlineOutput={setOutlineOutput} contentCheckOutput={contentCheckOutput} setContentCheckOutput={setContentCheckOutput} setPage={setPage} addJob={addJob} />}
        {page === "aiJobs" && <AiJobs jobs={jobs} />}
        {page === "settings" && <Settings />}
      </main>
    </div>
  );
}

function Sidebar({ page, setPage }: { page: Page; setPage: (page: Page) => void }) {
  const items: Array<{ key: Page; label: string; icon: string }> = [
    { key: "home", label: "首页", icon: "⌂" },
    { key: "projects", label: "项目跟进", icon: "▦" },
    { key: "people", label: "人员管理", icon: "◉" },
    { key: "brief", label: "方案助手", icon: "✦" },
    { key: "resources", label: "资料库", icon: "◫" },
    { key: "aiJobs", label: "AI 任务记录", icon: "◎" },
    { key: "settings", label: "系统设置", icon: "⚙" },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">策</div>
        <div>
          <strong>策略中心</strong>
          <span>AI Workbench</span>
        </div>
      </div>
      <nav className="nav-list">
        {items.map((item) => (
          <button className={page === item.key ? "nav-item active" : "nav-item"} key={item.key} onClick={() => setPage(item.key)}>
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-card">
        <span>试点版本</span>
        <strong>MVP 0.1</strong>
        <p>资料库、方案助手工作台、项目跟进已接入前端流程。</p>
      </div>
    </aside>
  );
}

function Topbar({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <header className="topbar">
      <div className="search-box">搜索项目、资料、任务，例如“二次元新品上线方案”</div>
      <div className="topbar-actions">
        <button className="ghost-button" onClick={() => setPage("resourceUpload")}>上传资料</button>
        <button className="primary-button" onClick={() => setPage("brief")}>解析 Brief</button>
        <div className="avatar">ZY</div>
      </div>
    </header>
  );
}

function Home({ projects, members, jobs, setPage, openProject }: { projects: Project[]; members: Member[]; jobs: AiJob[]; setPage: (page: Page) => void; openProject: (id: number) => void }) {
  const overdueTasks = projects.flatMap((project) => project.tasks.filter((task) => task.status === "延期"));
  const dueTasks = projects.flatMap((project) => project.tasks.filter((task) => task.status !== "已完成"));

  return (
    <section className="page">
      <PageTitle title="首页" subtitle="聚合待办、项目风险和 AI 快捷入口。" />
      <div className="metric-grid">
        <Metric label="进行中项目" value={projects.length} tone="blue" />
        <Metric label="我的待办" value={dueTasks.length} tone="green" />
        <Metric label="即将到期" value={3} tone="orange" />
        <Metric label="已延期" value={overdueTasks.length} tone="red" />
      </div>
      <div className="two-column">
        <Card title="我的待办">
          <TaskTable tasks={dueTasks.slice(0, 5)} members={members} />
        </Card>
        <Card title="风险预警">
          <div className="warning-list">
            {projects.map((project) => (
              <button key={project.id} className="warning-card" onClick={() => openProject(project.id)}>
                <RiskBadge risk={project.risk} />
                <strong>{project.name}</strong>
                <span>{project.risk === "紧急" ? "方案评审延期可能影响讲标节点" : "存在轻微排期压缩风险"}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
      <div className="quick-panel">
        <button onClick={() => setPage("resourceUpload")}>上传资料</button>
        <button onClick={() => setPage("brief")}>解析 Brief</button>
        <button onClick={() => setPage("outline")}>生成方案大纲</button>
        <button onClick={() => setPage("projects")}>新建项目</button>
      </div>
      <Card title="最近 AI 任务">
        <AiJobs jobs={jobs.slice(0, 3)} embedded />
      </Card>
    </section>
  );
}

function Projects({ projects, members, openProject, setProjects, addJob }: { projects: Project[]; members: Member[]; openProject: (id: number) => void; setProjects: React.Dispatch<React.SetStateAction<Project[]>>; addJob: (type: string, name: string, source: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    query: "",
    status: "",
    type: "",
    risk: "",
    ownerId: "",
  });
  const [form, setForm] = useState({
    name: "",
    game: "",
    client: "",
    type: "新品上线",
    ownerId: members[0]?.id ? `${members[0].id}` : "",
    start: today(),
    submit: "2026-05-08",
    pitch: "2026-05-10",
  });

  const createProject = () => {
    if (!form.name.trim() || !form.game.trim()) return;
    const next: Project = {
      id: Date.now(),
      name: form.name.trim(),
      game: form.game.trim(),
      client: form.client.trim() || "待确认客户",
      type: form.type,
      owner: memberName(members, Number(form.ownerId), "未分配"),
      ownerId: Number(form.ownerId) || undefined,
      stage: "项目启动",
      start: form.start,
      submit: form.submit,
      pitch: form.pitch,
      status: "进行中",
      risk: "正常",
      tasks: [],
    };
    const projectWithTasks = { ...next, tasks: generateProjectTasks(next) };
    setProjects((current) => [projectWithTasks, ...current]);
    addJob("项目创建", next.name, "项目跟进");
    addJob("排期生成", `${next.name} 标准排期`, "项目跟进");
    setShowForm(false);
  };

  const removeProject = (projectId: number) => {
    setProjects((current) => current.filter((project) => project.id !== projectId));
    addJob("项目删除", `项目 ${projectId}`, "项目跟进");
  };

  const projectTypes = Array.from(new Set(projects.map((project) => project.type).filter(Boolean)));
  const projectStatuses = Array.from(new Set(projects.map((project) => project.status).filter(Boolean)));
  const filteredProjects = projects.filter((project) => {
    const corpus = `${project.name}${project.game}${project.client}${project.type}${project.stage}${memberName(members, project.ownerId, project.owner)}`;
    return (
      (!filters.query.trim() || corpus.includes(filters.query.trim())) &&
      (!filters.status || project.status === filters.status) &&
      (!filters.type || project.type === filters.type) &&
      (!filters.risk || project.risk === filters.risk) &&
      (!filters.ownerId || project.ownerId === Number(filters.ownerId))
    );
  });

  const exportProjects = () => {
    const rows = [
      ["项目名称", "游戏", "客户", "类型", "负责人", "当前阶段", "启动日期", "方案提交", "讲标日期", "状态", "风险"],
      ...filteredProjects.map((project) => [
        project.name,
        project.game,
        project.client,
        project.type,
        memberName(members, project.ownerId, project.owner),
        project.stage,
        project.start,
        project.submit,
        project.pitch,
        project.status,
        project.risk,
      ]),
    ];
    downloadText(`项目列表-${today()}.csv`, rows.map((row) => row.map(csvCell).join(",")).join("\n"), "text/csv;charset=utf-8");
    addJob("项目导出", `导出 ${filteredProjects.length} 个项目`, "项目跟进");
  };

  return (
    <section className="page">
      <PageTitle
        title="项目跟进"
        subtitle="查看项目、关键节点、风险等级和负责人。"
        action={<div className="card-actions"><button className="ghost-button" onClick={exportProjects}>导出列表</button><button className="primary-button" onClick={() => setShowForm((current) => !current)}>新建项目</button></div>}
      />
      {showForm && (
        <Card title="新建项目">
          <div className="form-grid">
            <Field label="项目名称" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
            <Field label="游戏名称" value={form.game} onChange={(value) => setForm({ ...form, game: value })} />
            <Field label="客户名称" value={form.client} onChange={(value) => setForm({ ...form, client: value })} />
            <Field label="项目类型" value={form.type} onChange={(value) => setForm({ ...form, type: value })} />
            <label>
              <span>项目负责人</span>
              <select value={form.ownerId} onChange={(event) => setForm({ ...form, ownerId: event.target.value })}>
                <option value="">未分配</option>
                {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
              </select>
            </label>
            <Field label="启动日期" type="date" value={form.start} onChange={(value) => setForm({ ...form, start: value })} />
            <Field label="方案提交日期" type="date" value={form.submit} onChange={(value) => setForm({ ...form, submit: value })} />
            <Field label="讲标日期" type="date" value={form.pitch} onChange={(value) => setForm({ ...form, pitch: value })} />
          </div>
          <button className="primary-button wide" onClick={createProject}>保存并生成排期</button>
        </Card>
      )}
      <div className="filter-bar">
        <input value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder="搜索项目、游戏、客户、负责人" />
        <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">全部状态</option>
          {projectStatuses.map((status) => <option key={status}>{status}</option>)}
        </select>
        <select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
          <option value="">全部类型</option>
          {projectTypes.map((type) => <option key={type}>{type}</option>)}
        </select>
        <select value={filters.risk} onChange={(event) => setFilters({ ...filters, risk: event.target.value })}>
          <option value="">全部风险</option>
          {riskOptions.map((risk) => <option key={risk}>{risk}</option>)}
        </select>
        <select value={filters.ownerId} onChange={(event) => setFilters({ ...filters, ownerId: event.target.value })}>
          <option value="">全部负责人</option>
          {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
        </select>
      </div>
      <ProjectGanttOverview projects={filteredProjects} members={members} openProject={openProject} />
      <Card title="项目列表">
        <table>
          <thead>
            <tr>
              <th>项目名称</th>
              <th>游戏</th>
              <th>客户</th>
              <th>类型</th>
              <th>负责人</th>
              <th>当前阶段</th>
              <th>方案提交</th>
              <th>风险</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project) => (
              <tr key={project.id}>
                <td>{project.name}</td>
                <td>{project.game}</td>
                <td>{project.client}</td>
                <td>{project.type}</td>
                <td>{memberName(members, project.ownerId, project.owner)}</td>
                <td>{project.stage}</td>
                <td>{project.submit}</td>
                <td><RiskBadge risk={project.risk} /></td>
                <td>
                  <div className="table-actions">
                    <button className="link-button" onClick={() => openProject(project.id)}>查看</button>
                    <button className="link-button danger" onClick={() => removeProject(project.id)}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}

function ProjectDetail({ project, members, projects, resources, openResource, setPage, setProjects, addJob }: { project: Project; members: Member[]; projects: Project[]; resources: Resource[]; openResource: (id: number) => void; setPage: (page: Page) => void; setProjects: React.Dispatch<React.SetStateAction<Project[]>>; addJob: (type: string, name: string, source: string) => void }) {
  const [tab, setTab] = useState("排期表");
  const [resourceToAttach, setResourceToAttach] = useState("");
  const inferredRisk = inferProjectRisk(project);
  const inferredReasons = projectRiskReasons(project);
  const linkedResources = resources.filter((resource) => project.resourceIds?.includes(resource.id));
  const availableResources = resources.filter((resource) => !project.resourceIds?.includes(resource.id));
  const backupRecommendations = recommendBackupMembers(project, members, projects);
  const currentAverageProgress = project.tasks.length ? Math.round(project.tasks.reduce((total, task) => total + task.progress, 0) / project.tasks.length) : 100;

  useEffect(() => {
    const tasksWithRisk = project.tasks.map((task) => ({ ...task, risk: inferTaskRisk(task, project) }));
    const taskRiskChanged = tasksWithRisk.some((task, index) => task.risk !== project.tasks[index]?.risk);
    if (project.risk !== inferredRisk || taskRiskChanged) {
      setProjects((current) =>
        current.map((item) => (item.id === project.id ? { ...item, risk: inferredRisk, tasks: tasksWithRisk } : item)),
      );
    }
  }, [inferredRisk, project, setProjects]);

  const finishTask = (taskId: number) => {
    setProjects((current) =>
      current.map((item) =>
        item.id === project.id
          ? {
              ...item,
              tasks: item.tasks.map((task) =>
                task.id === taskId ? { ...task, status: "已完成", progress: 100, risk: "正常" } : task,
              ),
            }
          : item,
      ),
    );
  };

  const updateProjectField = <K extends keyof Project>(key: K, value: Project[K]) => {
    setProjects((current) => current.map((item) => (item.id === project.id ? { ...item, [key]: value } : item)));
  };

  const updateProjectOwner = (ownerId: number | undefined) => {
    setProjects((current) =>
      current.map((item) =>
        item.id === project.id ? { ...item, ownerId, owner: memberName(members, ownerId, "未分配") } : item,
      ),
    );
  };

  const updateTaskField = <K extends keyof ProjectTask>(taskId: number, key: K, value: ProjectTask[K]) => {
    setProjects((current) =>
      current.map((item) =>
        item.id === project.id
          ? {
              ...item,
              tasks: item.tasks.map((task) => {
                if (task.id !== taskId) return task;
                const updatedTask = { ...task, [key]: value };
                return { ...updatedTask, risk: inferTaskRisk(updatedTask, item) };
              }),
            }
          : item,
      ),
    );
  };

  const updateTaskOwner = (taskId: number, ownerId: number | undefined) => {
    setProjects((current) =>
      current.map((item) =>
        item.id === project.id
          ? {
              ...item,
              tasks: item.tasks.map((task) => {
                if (task.id !== taskId) return task;
                const updatedTask = { ...task, ownerId, owner: memberName(members, ownerId, "未分配") };
                return { ...updatedTask, risk: inferTaskRisk(updatedTask, item) };
              }),
            }
          : item,
      ),
    );
  };

  const addTask = () => {
    const task: ProjectTask = {
      id: Date.now(),
      phase: "新增环节",
      name: "新增任务",
      owner: memberName(members, project.ownerId, project.owner),
      ownerId: project.ownerId,
      department: "策略",
      start: today().slice(5),
      end: today().slice(5),
      dependency: "-",
      status: "未开始",
      progress: 0,
      risk: "正常",
    };
    setProjects((current) => current.map((item) => (item.id === project.id ? { ...item, tasks: [...item.tasks, task] } : item)));
    addJob("任务新增", task.name, "项目详情");
  };

  const removeTask = (taskId: number) => {
    setProjects((current) =>
      current.map((item) => (item.id === project.id ? { ...item, tasks: item.tasks.filter((task) => task.id !== taskId) } : item)),
    );
  };

  const generateSchedule = () => {
    setProjects((current) =>
      current.map((item) =>
        item.id === project.id ? { ...item, tasks: item.tasks.length ? item.tasks : generateProjectTasks(item) } : item,
      ),
    );
    addJob("排期生成", `${project.name} 标准排期`, "项目详情");
  };

  const attachResource = () => {
    const resourceId = Number(resourceToAttach);
    if (!resourceId) return;
    setProjects((current) =>
      current.map((item) =>
        item.id === project.id ? { ...item, resourceIds: Array.from(new Set([...(item.resourceIds ?? []), resourceId])) } : item,
      ),
    );
    const resource = resources.find((item) => item.id === resourceId);
    addJob("资料引用", `${project.name} 引用 ${resource?.title ?? resourceId}`, "项目详情");
    setResourceToAttach("");
  };

  const detachResource = (resourceId: number) => {
    setProjects((current) =>
      current.map((item) =>
        item.id === project.id ? { ...item, resourceIds: (item.resourceIds ?? []).filter((id) => id !== resourceId) } : item,
      ),
    );
    addJob("资料移除", `${project.name} 移除资料 ${resourceId}`, "项目详情");
  };

  const applyBackupMember = (memberId: number) => {
    const member = members.find((item) => item.id === memberId);
    if (!member) return;
    setProjects((current) =>
      current.map((item) => {
        if (item.id !== project.id) return item;
        return {
          ...item,
          tasks: item.tasks.map((task) => {
            const taskRisk = inferTaskRisk(task, item);
            if (task.status === "已完成" || (task.status !== "延期" && taskRisk === "正常")) return task;
            const department = task.department.includes(member.name) ? task.department : `${task.department} / 备用：${member.name}`;
            return { ...task, department };
          }),
        };
      }),
    );
    addJob("备用人员加入", `${member.name} 加入 ${project.name} 风险任务`, "AI 预警");
  };

  return (
    <section className="page">
      <PageTitle
        title={project.name}
        subtitle={`${project.game} / ${project.type} / 负责人：${memberName(members, project.ownerId, project.owner)}`}
        action={
          <div className="card-actions">
            <button className="ghost-button" onClick={() => setPage("projects")}>返回项目列表</button>
            <RiskBadge risk={inferredRisk} />
          </div>
        }
      />
      <div className="tabs">
        {["概览", "排期表", "甘特图", "项目资料", "AI 预警"].map((item) => (
          <button key={item} className={tab === item ? "tab active" : "tab"} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>
      {tab === "概览" && (
        <div className="overview-grid">
          <Card title="项目信息">
            <div className="form-grid">
              <Field label="项目名称" value={project.name} onChange={(value) => updateProjectField("name", value)} />
              <Field label="游戏名称" value={project.game} onChange={(value) => updateProjectField("game", value)} />
              <Field label="客户名称" value={project.client} onChange={(value) => updateProjectField("client", value)} />
              <Field label="项目类型" value={project.type} onChange={(value) => updateProjectField("type", value)} />
              <label>
                <span>负责人</span>
                <select value={project.ownerId ?? ""} onChange={(event) => updateProjectOwner(event.target.value ? Number(event.target.value) : undefined)}>
                  <option value="">未分配</option>
                  {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                </select>
              </label>
              <Field label="当前阶段" value={project.stage} onChange={(value) => updateProjectField("stage", value)} />
              <Field label="启动日期" type="date" value={project.start} onChange={(value) => updateProjectField("start", value)} />
              <Field label="方案提交" type="date" value={project.submit} onChange={(value) => updateProjectField("submit", value)} />
              <Field label="讲标日期" type="date" value={project.pitch} onChange={(value) => updateProjectField("pitch", value)} />
              <Field label="项目状态" value={project.status} onChange={(value) => updateProjectField("status", value)} />
            </div>
            <div className="note-box">
              <strong>风险等级：<RiskBadge risk={inferredRisk} /></strong>
              <p>风险由任务状态、任务风险、进度和关键节点自动计算，不支持手动编辑。</p>
            </div>
          </Card>
          <Card title="项目摘要">
            <p className="muted">当前项目处于方案制作阶段，AI 判断内部评审延期可能影响讲标准备，建议提前确认客户补充需求并增加一名协作成员。</p>
          </Card>
        </div>
      )}
      {tab === "排期表" && (
        <Card title="项目排期" action={<div className="card-actions"><button className="ghost-button" onClick={addTask}>新增任务</button><button className="primary-button" onClick={generateSchedule}>AI 生成排期</button></div>}>
          <table>
            <thead>
              <tr>
                <th>环节</th>
                <th>任务</th>
                <th>负责人</th>
                <th>协作部门</th>
                <th>开始</th>
                <th>截止</th>
                <th>状态</th>
                <th>进度</th>
                <th>风险</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {project.tasks.length === 0 && (
                <tr>
                  <td colSpan={10}><div className="empty-inline">暂无任务，可以点击“新增任务”手动添加，或点击“AI 生成排期”。</div></td>
                </tr>
              )}
              {project.tasks.map((task) => (
                <tr key={task.id}>
                  <td><input className="table-input" value={task.phase} onChange={(event) => updateTaskField(task.id, "phase", event.target.value)} /></td>
                  <td><input className="table-input" value={task.name} onChange={(event) => updateTaskField(task.id, "name", event.target.value)} /></td>
                  <td>
                    <select className="table-input" value={task.ownerId ?? ""} onChange={(event) => updateTaskOwner(task.id, event.target.value ? Number(event.target.value) : undefined)}>
                      <option value="">未分配</option>
                      {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                    </select>
                  </td>
                  <td><input className="table-input" value={task.department} onChange={(event) => updateTaskField(task.id, "department", event.target.value)} /></td>
                  <td><input className="table-input small" value={task.start} onChange={(event) => updateTaskField(task.id, "start", event.target.value)} /></td>
                  <td><input className="table-input small" value={task.end} onChange={(event) => updateTaskField(task.id, "end", event.target.value)} /></td>
                  <td>
                    <select className="table-input" value={task.status} onChange={(event) => updateTaskField(task.id, "status", event.target.value as TaskStatus)}>
                      {taskStatusOptions.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </td>
                  <td><input className="table-input tiny" type="number" min="0" max="100" value={task.progress} onChange={(event) => updateTaskField(task.id, "progress", Number(event.target.value))} /></td>
                  <td><RiskBadge risk={inferTaskRisk(task, project)} /></td>
                  <td>
                    <div className="table-actions">
                      <button className="link-button" onClick={() => finishTask(task.id)}>完成</button>
                      <button className="link-button danger" onClick={() => removeTask(task.id)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {tab === "甘特图" && <Gantt project={project} tasks={project.tasks} members={members} />}
      {tab === "项目资料" && (
        <Card title="关联资料">
          <div className="attach-row">
            <select value={resourceToAttach} onChange={(event) => setResourceToAttach(event.target.value)}>
              <option value="">选择资料引用到项目</option>
              {availableResources.map((resource) => <option key={resource.id} value={resource.id}>{resource.title}</option>)}
            </select>
            <button className="primary-button" onClick={attachResource}>引用资料</button>
          </div>
          {linkedResources.length ? (
            <div className="resource-grid compact-resources">
              {linkedResources.map((resource) => (
                <div className="resource-card static-card" key={resource.id}>
                  <div className="resource-type">{resource.type}</div>
                  <h3>{resource.title}</h3>
                  <p>{resource.summary}</p>
                  <div className="tag-row">{resource.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                  <div className="table-actions">
                    <button className="link-button" onClick={() => openResource(resource.id)}>查看</button>
                    <button className="link-button danger" onClick={() => detachResource(resource.id)}>移除</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">暂无关联资料，可以从上方选择资料引用到当前项目。</div>
          )}
        </Card>
      )}
      {tab === "AI 预警" && (
        <Card title="AI 延期预警">
          <div className="ai-report">
            <h3>风险结论：{inferredRisk}</h3>
            <p>{inferredReasons.join("；")}。</p>
            <ul>
              <li>如存在延期任务，优先拆分阻塞项并指定备份负责人。</li>
              <li>如距离方案提交或讲标不足 5 天，建议冻结非关键新增需求。</li>
              <li>如任务风险为紧急或严重，建议在项目例会中单独跟进处理动作。</li>
            </ul>
          </div>
          <div className="forecast-panel">
            <div>
              <span>当前平均进度</span>
              <strong>{currentAverageProgress}%</strong>
            </div>
            <div>
              <span>可调配备用人员</span>
              <strong>{backupRecommendations.length}</strong>
            </div>
            <div>
              <span>最佳预计进度</span>
              <strong>{backupRecommendations[0]?.projectedProgress ?? currentAverageProgress}%</strong>
            </div>
          </div>
          <div className="backup-list">
            {backupRecommendations.length ? backupRecommendations.map((item) => (
              <div className="backup-card" key={item.member.id}>
                <div>
                  <strong>{item.member.name}</strong>
                  <p>{item.member.role} / {item.loadStatus} {item.loadRate}% / 技能：{item.member.skills.join("、")}</p>
                  <p>匹配分：{item.matchScore}，技能匹配 {item.skillScore} 项；加入后预计进度 {item.projectedProgress}%（+{item.improvement}%）。</p>
                </div>
                <button className="primary-button" onClick={() => applyBackupMember(item.member.id)}>加入备用</button>
              </div>
            )) : (
              <div className="empty-state">当前没有可直接加入的正常状态低负载成员，建议调整截止时间或新增外部资源。</div>
            )}
          </div>
        </Card>
      )}
    </section>
  );
}

function Resources({ resources, openResource, deleteResource, setPage }: { resources: Resource[]; openResource: (id: number) => void; deleteResource: (id: number) => void; setPage: (page: Page) => void }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    sensitive: "",
    parseStatus: "",
  });
  const [searchResults, setSearchResults] = useState<Array<{ resource: Resource; score: number; keywordScore?: number; semanticScore?: number; snippets: string[] }>>([]);
  const [searchMessage, setSearchMessage] = useState("");

  const localResults = useMemo(() => {
    const words = query.trim().split(/\s+/);
    return resources
      .filter((resource) =>
        (!filters.type || resource.type === filters.type) &&
        (!filters.sensitive || resource.sensitive === filters.sensitive) &&
        (!filters.parseStatus || (resource.parseStatus || "成功") === filters.parseStatus)
      )
      .map((resource) => {
        const corpus = `${resource.title}${resource.summary}${resource.content}${resource.tags.join("")}`;
        const score = query.trim() ? words.reduce((total, word) => total + (corpus.includes(word) ? 1 : 0), 0) : 0;
        const snippet = query.trim() && resource.content.includes(words[0]) ? resource.content.slice(Math.max(0, resource.content.indexOf(words[0]) - 40), resource.content.indexOf(words[0]) + 100) : resource.summary;
        return { resource, score, keywordScore: score, semanticScore: 0, snippets: snippet ? [snippet] : [] };
      })
      .filter((item) => !query.trim() || item.score > 0)
      .sort((a, b) => b.score - a.score)
  }, [filters, query, resources]);

  useEffect(() => {
    let cancelled = false;
    setSearchMessage("");
    fetch("/api/resources/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, filters }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("后端全文检索不可用，已使用本地检索。");
        const data = await response.json();
        if (!cancelled) setSearchResults(data.results ?? []);
      })
      .catch((error) => {
        if (!cancelled) {
          setSearchResults(localResults);
          setSearchMessage(error instanceof Error ? error.message : "后端全文检索不可用，已使用本地检索。");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [filters, localResults, query]);

  const results = searchResults.length || query.trim() || Object.values(filters).some(Boolean) ? searchResults : localResults;
  const resourceTypes = Array.from(new Set(resources.map((resource) => resource.type).filter(Boolean)));
  const sensitiveLevels = Array.from(new Set(resources.map((resource) => resource.sensitive).filter(Boolean)));

  return (
    <section className="page">
      <PageTitle title="资料库" subtitle="上传、解析、检索和复用策略资产。" action={<button className="primary-button" onClick={() => setPage("resourceUpload")}>上传资料</button>} />
      <div className="search-panel">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入关键词，或描述你想找的资料，例如：找一个适合二次元手游新品上线的投标方案" />
      </div>
      <div className="filter-bar">
        <select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
          <option value="">全部资料类型</option>
          {resourceTypes.map((type) => <option key={type}>{type}</option>)}
        </select>
        <select value={filters.sensitive} onChange={(event) => setFilters({ ...filters, sensitive: event.target.value })}>
          <option value="">全部敏感等级</option>
          {sensitiveLevels.map((level) => <option key={level}>{level}</option>)}
        </select>
        <select value={filters.parseStatus} onChange={(event) => setFilters({ ...filters, parseStatus: event.target.value })}>
          <option value="">全部解析状态</option>
          <option value="成功">解析成功</option>
          <option value="失败">解析失败</option>
        </select>
        <span>结果：{results.length}</span>
      </div>
      {searchMessage && <div className="note-box"><p>{searchMessage}</p></div>}
      <div className="resource-grid">
        {results.map(({ resource, score, keywordScore = score, semanticScore = 0, snippets }) => (
          <div className="resource-card static-card" key={resource.id}>
            <div className="resource-type">{resource.type}</div>
            <h3>{resource.title}</h3>
            <p>{resource.summary}</p>
            {query.trim() && <p className="match-reason">相关度：{score}，关键词：{keywordScore}，语义：{Math.round(semanticScore * 100)}</p>}
            {snippets.map((snippet, index) => <p className="snippet" key={`${resource.id}-${index}`}>{snippet}</p>)}
            <div className="tag-row">{resource.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <div className="table-actions">
              <button className="link-button" onClick={() => openResource(resource.id)}>查看</button>
              <button className="link-button danger" onClick={() => deleteResource(resource.id)}>删除</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ResourceUpload({ setResources, setPage, addJob }: { setResources: React.Dispatch<React.SetStateAction<Resource[]>>; setPage: (page: Page) => void; addJob: (type: string, name: string, source: string) => void }) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    type: "方案",
    project: "",
    gameType: "",
    projectType: "新品上线",
    node: "",
    visibility: "策略部门",
    sensitive: "内部",
    content: "",
  });

  const addFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setSelectedFiles((current) => {
      const next = [...current];
      Array.from(fileList).forEach((file) => {
        const exists = next.some((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified);
        if (!exists) next.push(file);
      });
      return next;
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const saveResource = async () => {
    setIsParsing(true);
    setParseMessage("");
    if (selectedFiles.length) {
      try {
        const body = new FormData();
        selectedFiles.forEach((file) => body.append("files", file));
        Object.entries(form).forEach(([key, value]) => body.append(key, value));
        const response = await fetch("/api/resources/upload", {
          method: "POST",
          body,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "文件上传解析失败。");
        setResources((current) => [...result.resources, ...current]);
        addJob("文档解析", `真实解析 ${result.resources.length} 份资料`, "资料上传");
        setPage("resources");
        return;
      } catch (error) {
        setParseMessage(error instanceof Error ? error.message : "文件上传解析失败，已使用本地记录兜底。");
      } finally {
        setIsParsing(false);
      }
    }

    const files = selectedFiles.length ? selectedFiles : [undefined];
    const resources = files.map((file, index) => {
      const fileName = file?.name ?? "";
      const sourceText = `${form.title} ${fileName} ${form.type} ${form.project} ${form.gameType} ${form.projectType} ${form.node} ${form.content}`;
      const title = selectedFiles.length > 1
        ? fileName || `${form.title || "新上传策略资料"}-${index + 1}`
        : form.title.trim() || fileName || "新上传策略资料";
      return {
        id: Date.now() + index,
        title,
        type: form.type,
        summary: summarize(sourceText),
        content: form.content || sourceText,
        tags: inferTags(sourceText),
        uploader: "当前用户",
        uploadedAt: today(),
        visibility: form.visibility,
        sensitive: form.sensitive,
        fileName,
        fileSize: file?.size,
        mimeType: file?.type,
        parseStatus: file ? "失败" as const : "成功" as const,
        parseError: file ? "本地 API 不可用，未完成真实文件解析。" : "",
      };
    });
    setResources((current) => [...resources, ...current]);
    addJob("文档解析", `批量解析 ${resources.length} 份资料`, "资料上传");
    setIsParsing(false);
    setPage("resources");
  };

  return (
    <section className="page">
      <PageTitle
        title="上传资料"
        subtitle="上传文件并补充分类信息，AI 将异步解析。"
        action={<button className="ghost-button" onClick={() => setPage("resources")}>返回资料库</button>}
      />
      <div className="split-panel">
        <Card title="文件上传">
          <label
            className={isDragging ? "upload-zone dragging" : "upload-zone"}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              addFiles(event.dataTransfer.files);
            }}
          >
            <strong>拖拽文件到这里</strong>
            <span>支持多选 PPT、Word、PDF、Excel、图片</span>
            <input type="file" multiple onChange={(event) => addFiles(event.target.files)} />
            <em>{selectedFiles.length ? `已选择 ${selectedFiles.length} 个文件` : "点击选择文件，或直接拖入上传区"}</em>
          </label>
          {selectedFiles.length > 0 && (
            <div className="file-list">
              {selectedFiles.map((file, index) => (
                <div className="file-item" key={`${file.name}-${file.size}-${file.lastModified}`}>
                  <span>{file.name}</span>
                  <button className="link-button danger" onClick={() => removeFile(index)}>移除</button>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title="资料信息">
          <div className="form-grid">
            <Field label="资料名称" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
            <Field label="资料类型" value={form.type} onChange={(value) => setForm({ ...form, type: value })} />
            <Field label="所属项目" value={form.project} onChange={(value) => setForm({ ...form, project: value })} />
            <Field label="游戏类型" value={form.gameType} onChange={(value) => setForm({ ...form, gameType: value })} />
            <Field label="项目类型" value={form.projectType} onChange={(value) => setForm({ ...form, projectType: value })} />
            <Field label="营销节点" value={form.node} onChange={(value) => setForm({ ...form, node: value })} />
            <Field label="可见范围" value={form.visibility} onChange={(value) => setForm({ ...form, visibility: value })} />
            <Field label="敏感等级" value={form.sensitive} onChange={(value) => setForm({ ...form, sensitive: value })} />
          </div>
          <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="粘贴资料正文、摘要、关键内容或备注。MVP 会基于这里的文本生成摘要、标签和检索内容。" />
          {parseMessage && <div className="note-box"><p>{parseMessage}</p></div>}
          <button className="primary-button wide" onClick={saveResource} disabled={isParsing}>{isParsing ? "解析中..." : "保存并解析"}</button>
        </Card>
      </div>
    </section>
  );
}

function ResourceDetail({ resource, deleteResource, setPage, addJob }: { resource: Resource; deleteResource: (id: number) => void; setPage: (page: Page) => void; addJob: (type: string, name: string, source: string) => void }) {
  const [advice, setAdvice] = useState("");

  const generateAdvice = () => {
    setAdvice(`适用场景：${resource.tags.join("、")}相关项目。

可复用点：
1. 可复用资料中的核心结构和表达方式。
2. 可提取其中的策略论证、文案方向或风险提示。
3. 可作为方案大纲、客户沟通或内部评审的参考材料。

使用建议：
1. 替换为当前游戏卖点、客户资源和执行周期。
2. 涉及客户、报价、竞品和内部复盘的信息需人工确认后再外发。
3. 如果用于投标方案，建议补充当前项目的数据支撑。`);
    addJob("复用建议", resource.title, "资料详情");
  };

  return (
    <section className="page">
      <PageTitle
        title={resource.title}
        subtitle={`${resource.type} / 上传人：${resource.uploader} / 敏感等级：${resource.sensitive}`}
        action={<div className="card-actions"><button className="ghost-button" onClick={() => setPage("resources")}>返回资料库</button><button className="link-button danger" onClick={() => deleteResource(resource.id)}>删除资料</button><button className="primary-button" onClick={generateAdvice}>生成复用建议</button></div>}
      />
      <div className="split-panel large-left">
        <Card title="文件预览">
          <div className="document-preview">
            <h2>{resource.title}</h2>
            <p>{resource.summary}</p>
            <p>{resource.content}</p>
            <div className="preview-lines" />
          </div>
        </Card>
        <Card title="AI 摘要与标签">
          <Info label="解析状态" value={resource.parseStatus || "成功"} />
          <Info label="文件名" value={resource.fileName || "-"} />
          <Info label="文件大小" value={formatFileSize(resource.fileSize)} />
          {resource.parseError && <div className="note-box"><strong>解析提示</strong><p>{resource.parseError}</p></div>}
          <hr />
          <p className="muted">{resource.summary}</p>
          <div className="tag-row">{resource.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          <hr />
          <h3>复用建议</h3>
          <p className="muted">{advice || "点击“生成复用建议”后，AI 将输出适用场景、可复用结构和风险提示。"}</p>
        </Card>
      </div>
    </section>
  );
}

function AssistantCapability({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="assistant-mini-card">
      <strong>{title}</strong>
      <ul className="assistant-list">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function BriefAssistant({
  briefOutput,
  setBriefOutput,
  outlineOutput,
  setOutlineOutput,
  contentCheckOutput,
  setContentCheckOutput,
  resources,
  setResources,
  setPage,
  addJob,
  initialTool = "deconstruct",
}: {
  briefOutput: string;
  setBriefOutput: (value: string) => void;
  outlineOutput: string;
  setOutlineOutput: (value: string) => void;
  contentCheckOutput: string;
  setContentCheckOutput: (value: string) => void;
  resources: Resource[];
  setResources: React.Dispatch<React.SetStateAction<Resource[]>>;
  setPage: (page: Page) => void;
  addJob: (type: string, name: string, source: string) => void;
  initialTool?: "deconstruct" | "proposal" | "check";
}) {
  const [apiConfig, setApiConfig] = usePersistentState<BriefApiConfig>("strategy-center-brief-api-config", {
    endpoint: "",
    apiKey: "",
    model: "",
  });
  const [activeTool, setActiveTool] = useState<"deconstruct" | "proposal" | "check">(initialTool);
  const [isRunning, setIsRunning] = useState<"" | "deconstruct" | "proposal" | "check">("");
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [modelMessage, setModelMessage] = useState("");
  const [demandForm, setDemandForm] = useState<DemandDeconstructionForm>({
    projectName: "",
    gameName: "",
    projectType: "新品上线",
    usage: "投标",
    goals: "",
    budget: "",
    timeline: "",
    forbidden: "",
    brandTone: "",
    brief: "",
    communication: "",
  });
  const [proposalForm, setProposalForm] = useState<ProposalWorkbenchForm>({
    projectType: "新品上线",
    usage: "投标",
    tone: "专业严谨",
    brandElements: "游戏 LOGO、主色、核心角色、世界观符号",
    modules: "项目背景、目标、策略、创意、执行计划、预算、效果预期",
    pageLimit: "15-20 页",
    visualAssets: "",
    pastTemplates: "",
    clientPreference: "",
  });
  const [assetSourceUrl, setAssetSourceUrl] = useState("");
  const [assetSourceFocus, setAssetSourceFocus] = useState("");
  const [webAssetSources, setWebAssetSources] = useState<WebAssetSource[]>([]);
  const [templateAssets, setTemplateAssets] = useState<TemplateAsset[]>([]);
  const [templateUploadCategory, setTemplateUploadCategory] = useState<TemplateAsset["category"]>("历史方案");
  const [checkForm, setCheckForm] = useState<ContentCheckForm>({
    draft: "",
    checkDimensions: "需求匹配度、逻辑连贯性、内容完整性、数据准确性、文案规范性、视觉美观度",
    forbidden: "",
    standards: "标题结论先行、数据要标注来源、预算口径需统一、避免口语化表达",
    constraints: "",
    commonIssues: "策略页讲得漂亮但执行脱节、预算拆分过粗、亮点不够集中",
  });
  const proposalPayload = useMemo<ProposalWorkbenchForm>(() => ({
    ...proposalForm,
    visualAssets: buildVisualAssetSummary(webAssetSources, proposalForm.visualAssets),
    pastTemplates: buildTemplateAssetSummary(templateAssets, proposalForm.pastTemplates),
  }), [proposalForm, templateAssets, webAssetSources]);

  useEffect(() => {
    setActiveTool(initialTool);
  }, [initialTool]);

  const loadModels = async () => {
    setIsLoadingModels(true);
    setModelMessage("");
    try {
      if (!inferModelsEndpoint(apiConfig.endpoint)) throw new Error("请先填写接口地址。");
      const response = await fetch("/api/brief-models", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          endpoint: apiConfig.endpoint,
          apiKey: apiConfig.apiKey,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || result.error || "模型列表拉取失败。");
      const models = Array.isArray(result.data)
        ? result.data.map((item: { id?: string; name?: string }) => item.id || item.name).filter(Boolean)
        : Array.isArray(result.models)
          ? result.models.map((item: string | { id?: string; name?: string }) => (typeof item === "string" ? item : item.id || item.name)).filter(Boolean)
          : [];
      if (!models.length) throw new Error("接口返回中没有找到模型列表。");
      setModelOptions(models);
      setApiConfig((current) => ({ ...current, model: current.model || models[0] }));
      setModelMessage(`已拉取 ${models.length} 个模型。`);
    } catch (error) {
      setModelOptions([]);
      setModelMessage(error instanceof Error ? error.message : "模型列表拉取失败。");
    } finally {
      setIsLoadingModels(false);
    }
  };

  const runDemand = async () => {
    setIsRunning("deconstruct");
    try {
      if (apiConfig.endpoint.trim()) {
        setBriefOutput("正在调用需求解构 API...");
        const response = await fetch("/api/brief-run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            endpoint: apiConfig.endpoint.trim(),
            apiKey: apiConfig.apiKey.trim(),
            model: apiConfig.model.trim() || undefined,
            input: demandForm,
            prompt: buildDemandPrompt(demandForm),
            messages: [
              { role: "system", content: "你是游戏营销策略中心的需求解构助手。" },
              { role: "user", content: buildDemandPrompt(demandForm) },
            ],
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || result.error || "需求解构 API 调用失败。");
        const output = result.output || result.report || result.content || result.choices?.[0]?.message?.content;
        setBriefOutput(output || JSON.stringify(result, null, 2));
        addJob("需求解构", `${demandForm.projectName || "未命名项目"} API 需求解构`, "方案助手");
        return;
      }
      setBriefOutput(buildLocalDemandReport(demandForm));
      addJob("需求解构", `${demandForm.projectName || "未命名项目"} 本地需求解构`, "方案助手");
    } catch (error) {
      setBriefOutput(error instanceof Error ? error.message : "需求解构 API 调用失败。");
    } finally {
      setIsRunning("");
    }
  };

  const runProposal = async () => {
    setIsRunning("proposal");
    try {
      if (apiConfig.endpoint.trim()) {
        setOutlineOutput("正在调用方案制作 API...");
        const response = await fetch("/api/brief-run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            endpoint: apiConfig.endpoint.trim(),
            apiKey: apiConfig.apiKey.trim(),
            model: apiConfig.model.trim() || undefined,
            input: { proposalForm: proposalPayload, briefOutput, resources: resources.slice(0, 6) },
            prompt: buildProposalPrompt(proposalPayload, briefOutput, resources),
            messages: [
              { role: "system", content: "你是游戏营销提案制作助手。" },
              { role: "user", content: buildProposalPrompt(proposalPayload, briefOutput, resources) },
            ],
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || result.error || "方案制作 API 调用失败。");
        const output = result.output || result.report || result.content || result.choices?.[0]?.message?.content;
        setOutlineOutput(output || JSON.stringify(result, null, 2));
        addJob("方案制作", `${proposalForm.projectType} ${proposalForm.usage} 模板建议`, "方案助手");
        return;
      }
      setOutlineOutput(buildLocalProposalReport(proposalPayload, briefOutput, resources));
      addJob("方案制作", `${proposalForm.projectType} ${proposalForm.usage} 模板建议`, "方案助手");
    } catch (error) {
      setOutlineOutput(error instanceof Error ? error.message : "方案制作 API 调用失败。");
    } finally {
      setIsRunning("");
    }
  };

  const runCheck = async () => {
    setIsRunning("check");
    try {
      if (apiConfig.endpoint.trim()) {
        setContentCheckOutput("正在调用内容检查 API...");
        const response = await fetch("/api/brief-run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            endpoint: apiConfig.endpoint.trim(),
            apiKey: apiConfig.apiKey.trim(),
            model: apiConfig.model.trim() || undefined,
            input: { checkForm, briefOutput },
            prompt: buildContentCheckPrompt(checkForm, briefOutput),
            messages: [
              { role: "system", content: "你是游戏营销方案内容检查助手。" },
              { role: "user", content: buildContentCheckPrompt(checkForm, briefOutput) },
            ],
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || result.error || "内容检查 API 调用失败。");
        const output = result.output || result.report || result.content || result.choices?.[0]?.message?.content;
        setContentCheckOutput(output || JSON.stringify(result, null, 2));
        addJob("内容检查", "方案初稿检查报告", "方案助手");
        return;
      }
      setContentCheckOutput(buildLocalContentCheckReport(checkForm, briefOutput));
      addJob("内容检查", "方案初稿检查报告", "方案助手");
    } catch (error) {
      setContentCheckOutput(error instanceof Error ? error.message : "内容检查 API 调用失败。");
    } finally {
      setIsRunning("");
    }
  };

  const addWebAssetSource = () => {
    const url = normalizeWebUrl(assetSourceUrl);
    if (!url) return;
    const focus = assetSourceFocus.trim();
    setWebAssetSources((current) => [{ id: Date.now(), url, focus, addedAt: today() }, ...current]);
    setAssetSourceUrl("");
    setAssetSourceFocus("");
  };

  const removeWebAssetSource = (sourceId: number) => {
    setWebAssetSources((current) => current.filter((item) => item.id !== sourceId));
  };

  const addSampleWebSource = () => {
    setWebAssetSources((current) => [
      {
        id: Date.now(),
        url: "https://game.example.com/",
        focus: "世界观、角色立绘、核心卖点",
        addedAt: today(),
      },
      ...current,
    ]);
  };

  const handleTemplateUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const uploadedAt = today();
    const nextTemplates = files.map((file, index) => ({
        id: Date.now() + index,
        name: file.name.replace(/\.[^.]+$/, ""),
        category: templateUploadCategory,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt,
      }));
    setTemplateAssets((current) => [...nextTemplates, ...current]);
    const nextResources = nextTemplates.map((template) => {
      const sourceText = `${template.category} ${template.name} ${template.fileName} ${proposalForm.projectType} ${proposalForm.usage} PPT 模板`;
      return {
        id: Date.now() + template.id,
        title: `${template.name}${template.category === "通用模板" ? "（通用模板）" : "（历史方案）"}`,
        type: template.category === "通用模板" ? "PPT模板" : "历史提案",
        summary: summarize(sourceText),
        content: `来源：方案助手模板上传\n分类：${template.category}\n文件名：${template.fileName}\n文件大小：${formatFileSize(template.fileSize)}\n适用场景：${proposalForm.projectType} / ${proposalForm.usage}`,
        tags: inferTags(sourceText),
        uploader: "当前用户",
        uploadedAt,
        visibility: "策略部门",
        sensitive: "内部",
        fileName: template.fileName,
        fileSize: template.fileSize,
        mimeType: "application/vnd.ms-powerpoint",
        parseStatus: "成功" as const,
      } satisfies Resource;
    });
    setResources((current) => [...nextResources, ...current]);
    addJob("模板入库", `同步入库 ${nextTemplates.length} 份模板`, "方案助手");
    event.target.value = "";
  };

  const removeTemplateAsset = (templateId: number) => {
    setTemplateAssets((current) => current.filter((item) => item.id !== templateId));
  };

  return (
    <section className="page">
      <PageTitle title="方案助手" subtitle="先梳理客户需求，再补充素材和模板生成方案，最后做内容检查，帮助使用者快速完成提案。" />
      <div className="assistant-tabs">
        {[
          { key: "deconstruct", label: "一. 需求解构" },
          { key: "proposal", label: "二. 方案制作" },
          { key: "check", label: "三. 内容检查" },
        ].map((item) => (
          <button key={item.key} className={activeTool === item.key ? "assistant-tab active" : "assistant-tab"} onClick={() => setActiveTool(item.key as "deconstruct" | "proposal" | "check")}>
            {item.label}
          </button>
        ))}
      </div>
      {activeTool === "deconstruct" && (
        <div className="split-panel">
          <Card title="需求解构输入">
            <div className="form-grid">
              <Field label="项目名称" value={demandForm.projectName} onChange={(value) => setDemandForm({ ...demandForm, projectName: value })} />
              <Field label="游戏名称" value={demandForm.gameName} onChange={(value) => setDemandForm({ ...demandForm, gameName: value })} />
              <Field label="项目类型" value={demandForm.projectType} onChange={(value) => setDemandForm({ ...demandForm, projectType: value })} />
              <Field label="方案用途" value={demandForm.usage} onChange={(value) => setDemandForm({ ...demandForm, usage: value })} />
              <Field label="项目目标" value={demandForm.goals} onChange={(value) => setDemandForm({ ...demandForm, goals: value })} />
              <Field label="预算信息" value={demandForm.budget} onChange={(value) => setDemandForm({ ...demandForm, budget: value })} />
              <Field label="时间节点" value={demandForm.timeline} onChange={(value) => setDemandForm({ ...demandForm, timeline: value })} />
              <Field label="品牌调性" value={demandForm.brandTone} onChange={(value) => setDemandForm({ ...demandForm, brandTone: value })} />
            </div>
            <textarea value={demandForm.forbidden} onChange={(event) => setDemandForm({ ...demandForm, forbidden: event.target.value })} placeholder="客户禁忌要求、品牌边界、不可提资源或敏感表达..." />
            <textarea value={demandForm.brief} onChange={(event) => setDemandForm({ ...demandForm, brief: event.target.value })} placeholder="粘贴客户 BF 资料：项目目标、预算、时间节点、核心需求、禁忌要求、品牌调性..." />
            <textarea value={demandForm.communication} onChange={(event) => setDemandForm({ ...demandForm, communication: event.target.value })} placeholder="补充客户沟通记录：渠道偏好、临时变更、口头确认、讲标关注点..." />
            <button className="primary-button wide" onClick={runDemand} disabled={isRunning === "deconstruct"}>{isRunning === "deconstruct" ? "解构中..." : "生成需求解构"}</button>
          </Card>
          <Card title="需求解构结果" action={<button className="ghost-button" onClick={() => setActiveTool("proposal")}>进入方案制作</button>}>
            <pre className="ai-output">{briefOutput || "这里会输出：核心需求、次要需求、隐性需求、QA 清单和需求匹配建议。"}</pre>
          </Card>
        </div>
      )}
      {activeTool === "proposal" && (
        <div className="split-panel">
          <Card title="方案制作输入">
            <div className="form-grid">
              <Field label="方案类型" value={proposalForm.projectType} onChange={(value) => setProposalForm({ ...proposalForm, projectType: value })} />
              <Field label="方案用途" value={proposalForm.usage} onChange={(value) => setProposalForm({ ...proposalForm, usage: value })} />
              <Field label="PPT 调性" value={proposalForm.tone} onChange={(value) => setProposalForm({ ...proposalForm, tone: value })} />
              <Field label="页数限制" value={proposalForm.pageLimit} onChange={(value) => setProposalForm({ ...proposalForm, pageLimit: value })} />
            </div>
            <textarea value={proposalForm.brandElements} onChange={(event) => setProposalForm({ ...proposalForm, brandElements: event.target.value })} placeholder="品牌元素：游戏 LOGO、配色、视觉风格、角色、世界观关键词..." />
            <textarea value={proposalForm.modules} onChange={(event) => setProposalForm({ ...proposalForm, modules: event.target.value })} placeholder="必含模块：项目背景、目标、策略、执行计划、预算、效果预期..." />
            <div className="assistant-entry-card">
              <div className="assistant-entry-head">
                <div>
                  <strong>网页素材抓取入口</strong>
                  <p>输入游戏官网、活动专题页或角色设定页，按链接沉淀可用于 PPT 的视觉素材来源与抓取重点。</p>
                </div>
                <button className="ghost-button" type="button" onClick={addSampleWebSource}>添加示例来源</button>
              </div>
              <div className="assistant-entry-grid">
                <label>
                  <span>网页地址</span>
                  <input value={assetSourceUrl} onChange={(event) => setAssetSourceUrl(event.target.value)} placeholder="https://game.example.com / 活动专题页 / 角色百科页" />
                </label>
                <label>
                  <span>抓取重点</span>
                  <input value={assetSourceFocus} onChange={(event) => setAssetSourceFocus(event.target.value)} placeholder="如角色立绘、战斗截图、主 KV、UI 风格" />
                </label>
              </div>
              <div className="inline-actions">
                <button className="primary-button" type="button" onClick={addWebAssetSource} disabled={!normalizeWebUrl(assetSourceUrl)}>添加网页素材来源</button>
                {!normalizeWebUrl(assetSourceUrl) && assetSourceUrl.trim() && <span>请输入有效的网页链接。</span>}
              </div>
              <div className="assistant-entry-list">
                {webAssetSources.length ? webAssetSources.map((source) => (
                  <div key={source.id} className="assistant-entry-item">
                    <div>
                      <a href={source.url} target="_blank" rel="noreferrer">{source.url}</a>
                      <p>{source.focus || "未填写抓取重点"} · 添加于 {source.addedAt}</p>
                    </div>
                    <button className="link-button danger" type="button" onClick={() => removeWebAssetSource(source.id)}>移除</button>
                  </div>
                )) : <div className="assistant-entry-empty">还没有添加网页素材来源。</div>}
              </div>
              <label className="assistant-entry-stack">
                <span>素材补充说明</span>
                <textarea value={proposalForm.visualAssets} onChange={(event) => setProposalForm({ ...proposalForm, visualAssets: event.target.value })} placeholder="补充备注：比如哪些页面优先抓、哪些图适合作为封面或章节页..." />
              </label>
            </div>
            <div className="assistant-entry-card">
              <div className="assistant-entry-head">
                <div>
                  <strong>历史方案 / 通用模板入口</strong>
                  <p>上传以往 PPT 方案、客户历史提案和最终通用模板，统一沉淀为当前提案可复用的模板清单。</p>
                </div>
              </div>
              <div className="assistant-entry-grid assistant-entry-grid-template">
                <label>
                  <span>模板分类</span>
                  <select value={templateUploadCategory} onChange={(event) => setTemplateUploadCategory(event.target.value as TemplateAsset["category"])}>
                    <option value="历史方案">历史方案</option>
                    <option value="通用模板">通用模板</option>
                  </select>
                </label>
                <label>
                  <span>上传模板文件</span>
                  <input type="file" accept=".ppt,.pptx,.pot,.potx,.pdf,.key" multiple onChange={handleTemplateUpload} />
                </label>
              </div>
              <div className="assistant-entry-list">
                {templateAssets.length ? templateAssets.map((template) => (
                  <div key={template.id} className="assistant-entry-item">
                    <div>
                      <strong>{template.name}</strong>
                      <p>{template.category} · {template.fileName} · {formatFileSize(template.fileSize)} · 上传于 {template.uploadedAt}</p>
                    </div>
                    <button className="link-button danger" type="button" onClick={() => removeTemplateAsset(template.id)}>移除</button>
                  </div>
                )) : <div className="assistant-entry-empty">还没有上传模板文件。</div>}
              </div>
              <label className="assistant-entry-stack">
                <span>模板补充说明</span>
                <textarea value={proposalForm.pastTemplates} onChange={(event) => setProposalForm({ ...proposalForm, pastTemplates: event.target.value })} placeholder="补充备注：例如这个模板更适合投标、哪个版本更偏数据页、客户过去更偏好的版式..." />
              </label>
              <div className="note-box">
                <strong>已汇总的模板上下文</strong>
                <p>{proposalPayload.pastTemplates || "上传的历史方案和通用模板会自动汇总到这里，供后续生成方案时使用。"}</p>
              </div>
            </div>
            <textarea value={proposalForm.clientPreference} onChange={(event) => setProposalForm({ ...proposalForm, clientPreference: event.target.value })} placeholder="客户偏好的 PPT 风格：简洁大气 / 图文结合 / 数据导向 / 热血氛围..." />
            <div className="note-box">
              <strong>已载入需求解构</strong>
              <p>{briefOutput ? summarize(briefOutput) : "建议先完成“需求解构”，这样模板和页面建议会更贴题。"}</p>
            </div>
            <button className="primary-button wide" onClick={runProposal} disabled={isRunning === "proposal"}>{isRunning === "proposal" ? "生成中..." : "生成方案制作建议"}</button>
          </Card>
          <Card title="PPT 模板与页面建议" action={<button className="ghost-button" onClick={() => setActiveTool("check")}>进入内容检查</button>}>
            <pre className="ai-output">{outlineOutput || "这里会输出：PPT 模板、页面布局建议、内容填充提示和模板优化方向。"}</pre>
            <hr />
            <div className="note-box">
              <strong>可用参考资料</strong>
              <p>{resources.length ? resources.slice(0, 4).map((resource) => resource.title).join("、") : "资料库暂时为空，可先上传游戏视觉素材和历史模板。"}</p>
            </div>
          </Card>
        </div>
      )}
      {activeTool === "check" && (
        <div className="split-panel">
          <Card title="内容检查输入">
            <textarea value={checkForm.draft} onChange={(event) => setCheckForm({ ...checkForm, draft: event.target.value })} placeholder="粘贴方案大纲、PPT 初稿、逐页文案、数据口径或评审记录..." />
            <div className="form-grid">
              <Field label="检查维度" value={checkForm.checkDimensions} onChange={(value) => setCheckForm({ ...checkForm, checkDimensions: value })} />
              <Field label="项目约束" value={checkForm.constraints} onChange={(value) => setCheckForm({ ...checkForm, constraints: value })} />
            </div>
            <textarea value={checkForm.forbidden} onChange={(event) => setCheckForm({ ...checkForm, forbidden: event.target.value })} placeholder="客户禁忌要求：不可碰的话题、不可出现的竞品、不可夸大的结果..." />
            <textarea value={checkForm.standards} onChange={(event) => setCheckForm({ ...checkForm, standards: event.target.value })} placeholder="公司方案标准：文案风格、标题规范、数据标注、预算口径..." />
            <textarea value={checkForm.commonIssues} onChange={(event) => setCheckForm({ ...checkForm, commonIssues: event.target.value })} placeholder="过往方案常见问题：目标过虚、结构跳跃、策略与执行脱节、预算拆分过粗..." />
            <div className="note-box">
              <strong>检查参考依据</strong>
              <p>{briefOutput ? summarize(briefOutput) : "暂无需求解构结果；建议补充客户 BF 核心需求后再检查。"}</p>
            </div>
            <button className="primary-button wide" onClick={runCheck} disabled={isRunning === "check"}>{isRunning === "check" ? "检查中..." : "生成内容检查报告"}</button>
          </Card>
          <Card title="内容检查报告" action={<button className="ghost-button" onClick={() => setPage("resources")}>去资料库补素材</button>}>
            <pre className="ai-output">{contentCheckOutput || "这里会输出：严重问题 / 一般问题 / 优化建议，并标明问题分类和修改建议。"}</pre>
          </Card>
        </div>
      )}
      <section className="assistant-guide">
        <div className="assistant-guide-head">
          <h2>引导帮助</h2>
          <p>先在上方完成操作，再参考下面的投喂建议和模型配置补全内容。</p>
        </div>
        <div className="assistant-help-grid">
          <AssistantCapability title="AI 会输出" items={activeTool === "deconstruct"
            ? ["需求解构报告", "需求疑问 QA 清单", "需求匹配与落地建议"]
            : activeTool === "proposal"
              ? ["PPT 模板框架", "页面布局建议", "内容填充提示与模板优化建议"]
              : ["逐页/逐模块内容检查报告", "严重问题 / 一般问题 / 优化建议分类", "针对性修改建议"]} />
          <AssistantCapability title="建议投喂" items={activeTool === "deconstruct"
            ? ["客户 BF 资料", "客户沟通记录", "预算 / 时间 / 禁忌 / 品牌调性"]
            : activeTool === "proposal"
              ? ["方案类型与用途", "调性、品牌元素、必含模块、页数限制", "视觉素材、历史模板、客户风格偏好"]
              : ["方案大纲或 PPT 初稿", "检查维度与禁忌要求", "公司标准、项目约束和常见问题"]} />
          <Card title="模型接口">
            <div className="form-grid compact-grid">
              <Field label="接口地址" value={apiConfig.endpoint} onChange={(value) => setApiConfig({ ...apiConfig, endpoint: value })} />
              <label>
                <span>API Key</span>
                <input type="password" value={apiConfig.apiKey} onChange={(event) => setApiConfig({ ...apiConfig, apiKey: event.target.value })} placeholder="可选，自动放入 Authorization Bearer" />
              </label>
              <label>
                <span>模型</span>
                <select value={apiConfig.model} onChange={(event) => setApiConfig({ ...apiConfig, model: event.target.value })}>
                  <option value="">先拉取模型列表</option>
                  {modelOptions.map((model) => <option key={model} value={model}>{model}</option>)}
                </select>
              </label>
            </div>
            <div className="inline-actions">
              <button className="ghost-button" onClick={loadModels} disabled={isLoadingModels}>{isLoadingModels ? "拉取中..." : "拉取模型列表"}</button>
              {modelMessage && <span>{modelMessage}</span>}
            </div>
            <div className="note-box">
              <p>接口留空时会继续使用本地规则兜底，方便先快速产出结构化草案。</p>
            </div>
          </Card>
        </div>
      </section>
    </section>
  );
}

function OutlineAssistant(props: {
  briefOutput: string;
  setBriefOutput: (value: string) => void;
  resources: Resource[];
  setResources: React.Dispatch<React.SetStateAction<Resource[]>>;
  outlineOutput: string;
  setOutlineOutput: (value: string) => void;
  contentCheckOutput: string;
  setContentCheckOutput: (value: string) => void;
  setPage: (page: Page) => void;
  addJob: (type: string, name: string, source: string) => void;
}) {
  return <BriefAssistant {...props} initialTool="proposal" />;
}

function PeopleManagement({ members, setMembers, projects, addJob }: { members: Member[]; setMembers: React.Dispatch<React.SetStateAction<Member[]>>; projects: Project[]; addJob: (type: string, name: string, source: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [advice, setAdvice] = useState("");
  const [form, setForm] = useState({
    name: "",
    role: "执行策划",
    status: "正常" as Member["status"],
    monthlyCapacity: "8",
    avgDeliveryDays: "4",
    skills: "新品上线, 活动推广",
  });

  const taskStats = useMemo(() => {
    return buildMemberLoadStats(members, projects);
  }, [members, projects]);

  const addMember = () => {
    if (!form.name.trim()) return;
    const member: Member = {
      id: Date.now(),
      name: form.name.trim(),
      role: form.role.trim() || "执行策划",
      status: form.status,
      monthlyCapacity: Number(form.monthlyCapacity) || 8,
      avgDeliveryDays: Number(form.avgDeliveryDays) || 4,
      skills: form.skills.split(/[,，]/).map((skill) => skill.trim()).filter(Boolean),
    };
    setMembers((current) => [member, ...current]);
    addJob("人员维护", `${member.name} 成员档案`, "人员管理");
    setShowForm(false);
  };

  const updateMember = <K extends keyof Member>(memberId: number, key: K, value: Member[K]) => {
    setMembers((current) => current.map((member) => (member.id === memberId ? { ...member, [key]: value } : member)));
  };

  const removeMember = (memberId: number) => {
    setMembers((current) => current.filter((member) => member.id !== memberId));
    addJob("人员删除", `成员 ${memberId}`, "人员管理");
  };

  const generateAdvice = () => {
    const allTasks = projects.flatMap((project) => project.tasks.map((task) => ({ project, task })));
    const delayedTasks = allTasks.filter(({ task }) => task.status === "延期");
    const riskyProjects = projects.filter((project) => project.risk === "紧急" || project.risk === "严重");
    const unavailable = taskStats.filter(({ member }) => member.status === "请假");
    const overtime = taskStats.filter(({ member }) => member.status === "加班");
    const overloaded = taskStats.filter((item) => item.loadStatus === "过载" || item.loadStatus === "偏高" || item.delayedTasks.length > 0 || item.member.status === "加班");
    const available = taskStats
      .filter((item) => item.member.status === "正常" && (item.loadStatus === "偏低" || item.loadStatus === "正常"))
      .sort((a, b) => a.loadRate - b.loadRate);
    const criticalOwners = new Set([
      ...delayedTasks.map(({ task }) => memberName(members, task.ownerId, task.owner)),
      ...riskyProjects.map((project) => memberName(members, project.ownerId, project.owner)),
      ...overtime.map(({ member }) => member.name),
    ]);

    const skillNeeds = Array.from(
      new Set(
        [...delayedTasks, ...allTasks.filter(({ project }) => project.risk === "紧急" || project.risk === "严重")]
          .flatMap(({ project, task }) => [project.type, task.phase, task.name])
          .join(" ")
          .split(/\s+|、|与|和/)
          .filter((word) => ["投标", "新品上线", "活动推广", "竞品", "洞察", "方案", "评审", "PPT", "商务"].some((keyword) => word.includes(keyword))),
      ),
    );

    const matches = available.map((item) => {
      const score = skillNeeds.reduce((total, need) => total + (item.member.skills.some((skill) => skill.includes(need) || need.includes(skill)) ? 1 : 0), 0);
      return { ...item, score };
    }).sort((a, b) => b.score - a.score || a.loadRate - b.loadRate);

    const highRiskLines = overloaded.length
      ? overloaded.map(({ member, activeTasks, delayedTasks: memberDelayedTasks, loadRate, loadStatus }) => {
          const flags = [
            `${loadStatus} ${loadRate}%`,
            activeTasks.length ? `未完成 ${activeTasks.length} 个` : "",
            memberDelayedTasks.length ? `延期 ${memberDelayedTasks.length} 个` : "",
            member.status !== "正常" ? `状态为${member.status}` : "",
          ].filter(Boolean).join("，");
          return `- ${member.name}：${flags}。`;
        }).join("\n")
      : "- 暂无明显高风险成员。";

    const availableLines = matches.length
      ? matches.slice(0, 4).map(({ member, loadRate, loadStatus, score }) => `- ${member.name}：${loadStatus} ${loadRate}%，技能 ${member.skills.join("、")}${score ? `，匹配当前风险技能 ${score} 项` : ""}。`).join("\n")
      : "- 暂无适合继续承接任务的正常状态成员。";

    const actionLines = [
      delayedTasks.length ? `1. 先处理 ${delayedTasks.length} 个延期任务，优先把延期任务从加班、请假或偏高负载成员手上拆出。` : "1. 当前没有延期任务，重点保持讲标和提交节点前的缓冲。",
      riskyProjects.length ? `2. 对 ${riskyProjects.map((project) => project.name).join("、")} 设置每日同步，风险等级保持紧急或严重时不再追加非关键任务。` : "2. 当前高风险项目较少，可维持现有排期，但保留 10%-20% 机动容量。",
      matches[0] ? `3. 建议优先让 ${matches[0].member.name} 承接拆分出的协作任务，原因是状态正常、负载较低${matches[0].score ? "且技能匹配" : ""}。` : "3. 暂无可直接承接成员，建议调整项目截止时间或临时增加外部协作。",
      unavailable.length ? `4. ${unavailable.map(({ member }) => member.name).join("、")} 当前请假，不建议分配新任务；如已挂关键任务，需要指定备份负责人。` : "4. 暂无请假成员，关键任务仍需设置备份负责人。",
      criticalOwners.size ? `5. 重点关注 ${Array.from(criticalOwners).join("、")} 的任务集中度，避免同一成员同时承担风险项目负责人和延期任务。` : "5. 当前任务集中度可控，后续新增项目时优先查成员容量再分配。",
    ];

    setAdvice(`本地规则分析结论：
团队当前共有 ${members.length} 名成员，未完成任务 ${taskStats.reduce((total, item) => total + item.activeTasks.length, 0)} 个，延期任务 ${delayedTasks.length} 个，高风险项目 ${riskyProjects.length} 个。

高风险成员：
${highRiskLines}

可调配成员：
${availableLines}

建议动作：
${actionLines.join("\n")}

人工确认项：
- 任务负责人名称需要与成员姓名一致，否则负载会漏算。
- 月度容量是估算值，涉及讲标、客户沟通、PPT 美化等隐性工作时需要人工上调工作量。
- “偏低”不代表一定空闲，还需要确认成员是否有未录入项目或临时支持事项。`);
    addJob("人员负载分析", "本地规则成员负载与排班建议", "人员管理");
  };

  return (
    <section className="page">
      <PageTitle
        title="人员管理"
        subtitle="查看成员能力、任务压力和可调配状态。"
        action={<button className="primary-button" onClick={() => setShowForm((current) => !current)}>新增成员</button>}
      />
      <div className="metric-grid">
        <Metric label="团队成员" value={members.length} tone="blue" />
        <Metric label="进行中任务" value={taskStats.reduce((total, item) => total + item.activeTasks.length, 0)} tone="green" />
        <Metric label="偏高负载" value={taskStats.filter((item) => item.loadStatus === "偏高" || item.loadStatus === "过载").length} tone="orange" />
        <Metric label="延期任务" value={taskStats.reduce((total, item) => total + item.delayedTasks.length, 0)} tone="red" />
      </div>
      {showForm && (
        <Card title="新增成员">
          <div className="form-grid">
            <Field label="姓名" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
            <Field label="角色" value={form.role} onChange={(value) => setForm({ ...form, role: value })} />
            <Field label="状态" value={form.status} onChange={(value) => setForm({ ...form, status: value as Member["status"] })} />
            <Field label="月度容量" value={form.monthlyCapacity} onChange={(value) => setForm({ ...form, monthlyCapacity: value })} />
            <Field label="平均交付天数" value={form.avgDeliveryDays} onChange={(value) => setForm({ ...form, avgDeliveryDays: value })} />
            <Field label="能力标签" value={form.skills} onChange={(value) => setForm({ ...form, skills: value })} />
          </div>
          <button className="primary-button wide" onClick={addMember}>保存成员</button>
        </Card>
      )}
      <div className="people-grid">
        {taskStats.map(({ member, activeTasks, delayedTasks, loadRate, loadStatus }) => (
          <Card title={member.name} key={member.id}>
            <div className="person-card">
              <div className="editable-stack">
                <Field label="姓名" value={member.name} onChange={(value) => updateMember(member.id, "name", value)} />
                <Field label="角色" value={member.role} onChange={(value) => updateMember(member.id, "role", value)} />
                <label className="field-block">
                  <span>状态</span>
                  <select value={member.status} onChange={(event) => updateMember(member.id, "status", event.target.value as Member["status"])}>
                    {memberStatusOptions.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
              </div>
              <Progress value={Math.min(loadRate, 100)} />
              <div className="person-stats">
                <Info label="未完成任务" value={`${activeTasks.length} 个`} />
                <Info label="延期任务" value={`${delayedTasks.length} 个`} />
                <Info label="负载状态" value={loadStatus} />
              </div>
              <div className="editable-stack">
                <Field label="月度容量" type="number" value={`${member.monthlyCapacity}`} onChange={(value) => updateMember(member.id, "monthlyCapacity", Number(value) || 0)} />
                <Field label="平均交付天数" type="number" value={`${member.avgDeliveryDays}`} onChange={(value) => updateMember(member.id, "avgDeliveryDays", Number(value) || 0)} />
                <Field label="能力标签" value={member.skills.join(", ")} onChange={(value) => updateMember(member.id, "skills", value.split(/[,，]/).map((skill) => skill.trim()).filter(Boolean))} />
              </div>
              <div className="tag-row">{member.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
              <button className="link-button danger" onClick={() => removeMember(member.id)}>删除成员</button>
            </div>
          </Card>
        ))}
      </div>
      <div className="split-panel">
        <Card title="成员负载表" action={<button className="primary-button" onClick={generateAdvice}>AI 分析负载</button>}>
          <table>
            <thead>
              <tr>
                <th>成员</th>
                <th>角色</th>
                <th>状态</th>
                <th>当前任务</th>
                <th>延期</th>
                <th>容量</th>
                <th>负载</th>
              </tr>
            </thead>
            <tbody>
              {taskStats.map(({ member, activeTasks, delayedTasks, loadStatus }) => (
                <tr key={member.id}>
                  <td><input className="table-input" value={member.name} onChange={(event) => updateMember(member.id, "name", event.target.value)} /></td>
                  <td><input className="table-input" value={member.role} onChange={(event) => updateMember(member.id, "role", event.target.value)} /></td>
                  <td>
                    <select className="table-input" value={member.status} onChange={(event) => updateMember(member.id, "status", event.target.value as Member["status"])}>
                      {memberStatusOptions.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </td>
                  <td>{activeTasks.length}</td>
                  <td>{delayedTasks.length}</td>
                  <td><input className="table-input tiny" type="number" value={member.monthlyCapacity} onChange={(event) => updateMember(member.id, "monthlyCapacity", Number(event.target.value) || 0)} /></td>
                  <td>{loadStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="AI 排班建议">
          <pre className="ai-output compact">{advice || "点击“AI 分析负载”后，这里会生成成员调配建议和延期任务处理策略。"}</pre>
        </Card>
      </div>
    </section>
  );
}

function AiJobs({ jobs, embedded = false }: { jobs: AiJob[]; embedded?: boolean }) {
  return (
    <section className={embedded ? "" : "page"}>
      {!embedded && <PageTitle title="AI 任务记录" subtitle="追踪文档解析、Brief 解析、方案大纲和排期生成任务。" />}
      <Card title={embedded ? "" : "任务列表"}>
        <table>
          <thead>
            <tr>
              <th>任务类型</th>
              <th>任务名称</th>
              <th>发起人</th>
              <th>时间</th>
              <th>状态</th>
              <th>输入来源</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.type}</td>
                <td>{job.name}</td>
                <td>{job.owner}</td>
                <td>{job.createdAt}</td>
                <td><span className="status success">{job.status}</span></td>
                <td>{job.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}

function Settings() {
  const [searchSettings, setSearchSettings] = useState<SearchSettings>({
    mode: "local-semantic",
    embeddingEndpoint: "",
    embeddingApiKey: "",
    embeddingModel: "",
  });
  const [settingsMessage, setSettingsMessage] = useState("");
  const capabilities = [
    { name: "数据存储", status: "MVP", detail: "当前使用浏览器 localStorage 保存项目、资料、成员和 AI 任务；后续可替换为后端数据库。" },
    { name: "权限体系", status: "待接入", detail: "用户管理和角色权限仍为占位，试点阶段暂不做登录鉴权。" },
    { name: "文件解析", status: "待接入", detail: "上传资料当前读取表单文本和文件名，暂未解析 PPT、Word、PDF、Excel 正文。" },
    { name: "资料引用", status: "已接入", detail: "项目详情已支持关联资料、查看资料和移除引用。" },
    { name: "Brief API", status: "已接入", detail: "Brief 解析支持自定义接口、API Key、模型列表拉取和本地规则兜底。" },
    { name: "导出能力", status: "部分接入", detail: "项目列表已支持 CSV 导出，后续可补 Brief 报告和方案大纲导出。" },
  ];

  useEffect(() => {
    fetch("/api/search-settings")
      .then(async (response) => {
        if (!response.ok) throw new Error("无法读取检索设置");
        const data = await response.json();
        setSearchSettings(data.settings);
      })
      .catch(() => setSettingsMessage("本地 API 不可用，检索方式暂时使用默认本地语义。"));
  }, []);

  const saveSearchSettings = async () => {
    setSettingsMessage("");
    try {
      const response = await fetch("/api/search-settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ settings: searchSettings }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "保存失败");
      setSearchSettings(data.settings);
      setSettingsMessage("检索方式已保存。");
    } catch (error) {
      setSettingsMessage(error instanceof Error ? error.message : "保存失败");
    }
  };

  return (
    <section className="page">
      <PageTitle title="系统设置" subtitle="MVP 阶段包含用户、角色、标签和资料分类维护。" />
      <Card title="知识库检索方式">
        <div className="form-grid">
          <label>
            <span>检索模式</span>
            <select value={searchSettings.mode} onChange={(event) => setSearchSettings({ ...searchSettings, mode: event.target.value as SearchSettings["mode"] })}>
              <option value="local-semantic">本地轻量语义</option>
              <option value="keyword">纯关键词</option>
              <option value="external-embedding">外部 Embedding</option>
            </select>
          </label>
          <Field label="Embedding 接口" value={searchSettings.embeddingEndpoint} onChange={(value) => setSearchSettings({ ...searchSettings, embeddingEndpoint: value })} />
          <label>
            <span>Embedding API Key</span>
            <input type="password" value={searchSettings.embeddingApiKey} onChange={(event) => setSearchSettings({ ...searchSettings, embeddingApiKey: event.target.value })} placeholder="外部 Embedding 模式使用" />
          </label>
          <Field label="Embedding 模型" value={searchSettings.embeddingModel} onChange={(value) => setSearchSettings({ ...searchSettings, embeddingModel: value })} />
        </div>
        <div className="inline-actions">
          <button className="primary-button" onClick={saveSearchSettings}>保存检索设置</button>
          {settingsMessage && <span>{settingsMessage}</span>}
        </div>
        <div className="note-box">
          <p>本地轻量语义不依赖外部服务；纯关键词只按标题、标签、摘要和正文命中排序；外部 Embedding 会预留接口，接口不可用时后端自动回退本地轻量语义。</p>
        </div>
      </Card>
      <Card title="试点能力清单">
        <div className="capability-list">
          {capabilities.map((item) => (
            <div className="capability-item" key={item.name}>
              <div>
                <strong>{item.name}</strong>
                <p>{item.detail}</p>
              </div>
              <span>{item.status}</span>
            </div>
          ))}
        </div>
      </Card>
      <div className="settings-grid">
        {["用户管理", "角色权限", "标签管理", "资料分类"].map((item) => (
          <Card title={item} key={item}>
            <p className="muted">这里预留 {item} 的配置入口。</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function PageTitle({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="card">
      {title && (
        <div className="card-header">
          <h2>{title}</h2>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TaskTable({ tasks, members }: { tasks: ProjectTask[]; members: Member[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>任务</th>
          <th>负责人</th>
          <th>截止</th>
          <th>状态</th>
          <th>风险</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => (
          <tr key={task.id}>
            <td>{task.name}</td>
            <td>{memberName(members, task.ownerId, task.owner)}</td>
            <td>{task.end}</td>
            <td><StatusBadge status={task.status} /></td>
            <td><RiskBadge risk={task.risk} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RiskBadge({ risk }: { risk: Risk }) {
  return <span className={`risk risk-${risk}`}>{risk}</span>;
}

function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`status status-${status}`}>{status}</span>;
}

function Progress({ value }: { value: number }) {
  return (
    <div className="progress">
      <span style={{ width: `${value}%` }} />
      <em>{value}%</em>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label>
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={`请输入${label}`} />
    </label>
  );
}

function FormGrid({ fields }: { fields: string[] }) {
  return (
    <div className="form-grid">
      {fields.map((field) => (
        <label key={field}>
          <span>{field}</span>
          <input placeholder={`请输入${field}`} />
        </label>
      ))}
    </div>
  );
}

interface GanttTimelineItem {
  id: number;
  title: string;
  meta: string;
  start: Date;
  end: Date;
  progress: number;
  status: string;
  risk: Risk;
  onClick?: () => void;
}

function buildTimeline(items: GanttTimelineItem[]) {
  const starts = items.map((item) => item.start.getTime());
  const ends = items.map((item) => item.end.getTime());
  const earliest = starts.length ? new Date(Math.min(...starts)) : new Date(`${today()}T00:00:00`);
  const latest = ends.length ? new Date(Math.max(...ends)) : addDays(earliest, 6);
  const paddedStart = addDays(earliest, -1);
  const paddedEnd = addDays(latest, 1);
  const totalDays = Math.max(1, daysBetween(paddedStart, paddedEnd));
  const scale = Array.from({ length: 7 }, (_, index) => formatMonthDay(addDays(paddedStart, Math.round((totalDays * index) / 6))));
  return { start: paddedStart, totalDays, scale };
}

function timelineStyle(item: GanttTimelineItem, timeline: ReturnType<typeof buildTimeline>) {
  const left = clamp((daysBetween(timeline.start, item.start) / timeline.totalDays) * 100, 0, 96);
  const width = clamp(((daysBetween(item.start, item.end) + 1) / timeline.totalDays) * 100, 4, 100 - left);
  return { left: `${left}%`, width: `${width}%` };
}

function projectProgress(project: Project) {
  if (!project.tasks.length) return 0;
  return Math.round(project.tasks.reduce((total, task) => total + task.progress, 0) / project.tasks.length);
}

function projectEndDate(project: Project) {
  const fallbackYear = project.start.slice(0, 4) || today().slice(0, 4);
  const taskEnds = project.tasks
    .map((task) => parseScheduleDate(task.end, fallbackYear))
    .filter((date): date is Date => Boolean(date));
  const milestones = [parseScheduleDate(project.submit, fallbackYear), parseScheduleDate(project.pitch, fallbackYear), ...taskEnds].filter((date): date is Date => Boolean(date));
  if (!milestones.length) return parseScheduleDate(project.start, fallbackYear) ?? new Date(`${today()}T00:00:00`);
  return new Date(Math.max(...milestones.map((date) => date.getTime())));
}

function ProjectGanttOverview({ projects, members, openProject }: { projects: Project[]; members: Member[]; openProject: (id: number) => void }) {
  const items = projects
    .map((project) => {
      const fallbackYear = project.start.slice(0, 4) || project.submit.slice(0, 4) || today().slice(0, 4);
      return {
        id: project.id,
        title: project.name,
        meta: `${project.type} / ${memberName(members, project.ownerId, project.owner)} / ${project.stage}`,
        start: parseScheduleDate(project.start, fallbackYear) ?? new Date(`${today()}T00:00:00`),
        end: projectEndDate(project),
        progress: projectProgress(project),
        status: project.status,
        risk: inferProjectRisk(project),
        onClick: () => openProject(project.id),
      };
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const timeline = buildTimeline(items);

  return (
    <Card title="项目总进度甘特图" action={<span className="soft-pill">共 {items.length} 个项目</span>}>
      {items.length ? <GanttTimeline items={items} timeline={timeline} /> : <div className="empty-state compact">暂无符合筛选条件的项目</div>}
    </Card>
  );
}

function GanttTimeline({ items, timeline }: { items: GanttTimelineItem[]; timeline: ReturnType<typeof buildTimeline> }) {
  return (
    <div className="gantt">
      <div className="gantt-scale">
        <span />
        <div className="gantt-scale-days">
          {timeline.scale.map((day) => <span key={day}>{day}</span>)}
        </div>
      </div>
      {items.map((item) => {
        const row = (
          <>
            <strong>{item.title}<small>{item.meta}</small></strong>
            <div className="gantt-track">
              <span className={item.status === "延期" || item.risk === "紧急" || item.risk === "严重" ? "gantt-bar delayed" : "gantt-bar"} style={timelineStyle(item, timeline)}>
                {item.progress}%
              </span>
            </div>
          </>
        );
        return item.onClick ? (
          <button className="gantt-row gantt-row-button" key={item.id} onClick={item.onClick}>{row}</button>
        ) : (
          <div className="gantt-row" key={item.id}>{row}</div>
        );
      })}
    </div>
  );
}

function Gantt({ project, tasks, members }: { project: Project; tasks: ProjectTask[]; members: Member[] }) {
  const fallbackYear = project.submit.slice(0, 4) || project.start.slice(0, 4) || today().slice(0, 4);
  const items = tasks.map((task) => ({
    id: task.id,
    title: task.name,
    meta: `${task.phase} / ${memberName(members, task.ownerId, task.owner)}`,
    start: parseScheduleDate(task.start, fallbackYear) ?? parseScheduleDate(project.start, fallbackYear) ?? new Date(`${today()}T00:00:00`),
    end: parseScheduleDate(task.end, fallbackYear) ?? parseScheduleDate(project.submit, fallbackYear) ?? new Date(`${today()}T00:00:00`),
    progress: task.progress,
    status: task.status,
    risk: inferTaskRisk(task, project),
  }));
  const timeline = buildTimeline(items);

  return (
    <Card title="甘特图">
      {items.length ? <GanttTimeline items={items} timeline={timeline} /> : <div className="empty-state compact">暂无排期任务</div>}
    </Card>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
