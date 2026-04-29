import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type Page =
  | "home"
  | "projects"
  | "projectDetail"
  | "people"
  | "marketingResearch"
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
type BidResult = "跟进中" | "中标" | "未中标";
type LostReasonCategory = "需求匹配度" | "报价" | "创意" | "竞品冲击" | "方案打磨" | "客户资源" | "其他";

const riskOptions: Risk[] = ["正常", "一般", "紧急", "严重"];
const taskStatusOptions: TaskStatus[] = ["未开始", "进行中", "已完成", "延期", "暂停"];
const memberStatusOptions: Member["status"][] = ["正常", "请假", "加班"];
const clientTypeOptions = ["大厂", "中小厂商", "渠道方", "发行商", "代理商", "其他"];
const bidResultOptions: BidResult[] = ["跟进中", "中标", "未中标"];
const lostReasonOptions: LostReasonCategory[] = ["需求匹配度", "报价", "创意", "竞品冲击", "方案打磨", "客户资源", "其他"];

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
  gameType?: string;
  clientType?: string;
  bidDate?: string;
  bidAmount?: number;
  clientCoreNeeds?: string;
  bidResult?: BidResult;
  lostReasonCategory?: LostReasonCategory;
  lostReasonDetail?: string;
  winningFactors?: string;
  competitorContext?: string;
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
  structuredContent?: SpreadsheetContent;
  chunks?: Array<{ id: string; text: string; embedding?: Record<string, number> }>;
}

interface SpreadsheetContent {
  kind: "spreadsheet";
  sheets: Array<{
    name: string;
    rows: string[][];
    rowCount?: number;
    text?: string;
  }>;
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

interface BriefInputFile {
  id: number;
  name: string;
  fileSize?: number;
  mimeType?: string;
  parseStatus: "成功" | "失败";
  parseError?: string;
  summary: string;
  content: string;
  structuredContent?: SpreadsheetContent;
}

interface SearchSettings {
  mode: "local-semantic" | "keyword" | "external-embedding";
  embeddingEndpoint: string;
  embeddingApiKey: string;
  embeddingModel: string;
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
    gameType: "二次元",
    clientType: "大厂",
    bidDate: "2026-04-29",
    bidAmount: 180,
    clientCoreNeeds: "重视数据支撑、渠道资源和执行确定性。",
    bidResult: "未中标",
    lostReasonCategory: "方案打磨",
    lostReasonDetail: "内部评审延期，客户补充需求确认不充分。",
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
    gameType: "女性向",
    clientType: "中小厂商",
    bidDate: "2026-04-25",
    bidAmount: 80,
    clientCoreNeeds: "看重创意玩法、社群情绪和玩家口碑风险控制。",
    bidResult: "中标",
    winningFactors: "用户洞察准确，创意与周年节点结合紧密，风险预案完整。",
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

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }
  row.push(current.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function parseLegacySpreadsheetText(content: string): SpreadsheetContent | undefined {
  if (!content.includes("# ") || !content.includes(",")) return undefined;
  const sheets = content
    .split(/\n(?=# )/)
    .map((block) => {
      const firstLineEnd = block.indexOf("\n");
      const name = block.slice(0, firstLineEnd > -1 ? firstLineEnd : undefined).replace(/^#\s*/, "").trim() || "工作表";
      const csvText = firstLineEnd > -1 ? block.slice(firstLineEnd + 1) : "";
      const rows = parseCsvRows(csvText).map((row) => row.map((cell) => cell.trim())).filter((row) => row.some(Boolean));
      return { name, rows, rowCount: rows.length };
    })
    .filter((sheet) => sheet.rows.length);
  return sheets.length ? { kind: "spreadsheet", sheets } : undefined;
}

function spreadsheetFromResource(resource: Resource) {
  if (resource.structuredContent?.kind === "spreadsheet") return resource.structuredContent;
  const isSpreadsheet = /\.(xlsx|xls|csv)$/i.test(resource.fileName || "") || resource.mimeType?.includes("spreadsheet");
  return isSpreadsheet ? parseLegacySpreadsheetText(resource.content) : undefined;
}

function compactRow(row: string[]) {
  return row.map((cell) => cell.trim()).filter(Boolean);
}

function spreadsheetEntries(rows: string[][]) {
  return rows
    .map(compactRow)
    .filter((cells) => cells.length >= 2)
    .map((cells) => ({ label: cells[0], value: cells.slice(1).join(" / ") }))
    .filter((item) => item.label.length <= 28 && item.value)
    .slice(0, 80);
}

function spreadsheetSections(rows: string[][]) {
  const sections: Array<{ title: string; entries: Array<{ label: string; value: string }> }> = [];
  let current: { title: string; entries: Array<{ label: string; value: string }> } | undefined;
  rows.map(compactRow).forEach((cells) => {
    if (!cells.length) return;
    const [label, ...values] = cells;
    const isHeading = cells.length === 1 && /^([一二三四五六七八九十]+、|第.+部分|[0-9]+[.、])/.test(label);
    if (isHeading) {
      current = { title: label, entries: [] };
      sections.push(current);
      return;
    }
    const entry = { label, value: values.join(" / ") };
    if (!current) {
      current = { title: "基础信息", entries: [] };
      sections.push(current);
    }
    if (entry.value) current.entries.push(entry);
  });
  return sections.filter((section) => section.entries.length);
}

function importantSpreadsheetEntries(rows: string[][]) {
  const keywords = ["背景", "目的", "重点", "难点", "需求详情", "效果指标", "考核", "附件", "保密", "排竞", "周期", "预算", "节点", "内容"];
  return spreadsheetEntries(rows).filter((entry) => keywords.some((keyword) => entry.label.includes(keyword) || entry.value.includes(keyword))).slice(0, 12);
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

function classifyBriefFile(fileName: string, content: string) {
  const source = `${fileName} ${content}`;
  if (/qa|q&a|答疑|问答|确认/i.test(source)) return "客户 QA / 答疑";
  if (/补充|附件|资料|素材|背景|介绍/i.test(source)) return "补充资料";
  if (/brief|需求|需求单|比选|rfp/i.test(source)) return "客户 Brief";
  return "项目输入资料";
}

function buildCurrentInputPackage(form: { projectName: string; gameName: string; projectType: string; usage: string; forbidden: string; brief: string }, files: BriefInputFile[]) {
  const fileSections = files.map((file, index) => {
    const kind = classifyBriefFile(file.name, file.content);
    return `## ${index + 1}. ${kind}：${file.name}
解析状态：${file.parseStatus}${file.parseError ? `（${file.parseError}）` : ""}
摘要：${file.summary}
正文：
${file.content || "暂无可解析正文"}`;
  });
  return `本次项目输入包：
项目名称：${form.projectName || "未命名项目"}
游戏名称：${form.gameName || "未填写"}
项目类型：${form.projectType}
方案用途：${form.usage}
禁忌要求：${form.forbidden || "暂无"}

手动补充 Brief / 沟通记录：
${form.brief || "暂无"}

上传文件解析内容：
${fileSections.length ? fileSections.join("\n\n") : "暂无上传文件"}`;
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

function tokenizeForMatch(text: string) {
  return Array.from(
    new Set(
      inferTags(text)
        .concat(text.split(/\s+|,|，|。|、|\/|：|:|；|;|\n|\(|\)|（|）/))
        .map((word) => word.trim())
        .filter((word) => word.length >= 2 && word.length <= 18),
    ),
  );
}

function matchScore(text: string, keywords: string[]) {
  return keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 1 : 0), 0);
}

function buildBriefReferenceContext(form: { projectName: string; gameName: string; projectType: string; usage: string; forbidden: string; brief: string }, projects: Project[], resources: Resource[], inputText = "") {
  const queryText = `${form.projectName} ${form.gameName} ${form.projectType} ${form.usage} ${form.forbidden} ${form.brief} ${inputText}`;
  const keywords = tokenizeForMatch(queryText);
  const resourceMatches = resources
    .map((resource) => {
      const corpus = `${resource.title} ${resource.type} ${resource.summary} ${resource.content} ${resource.tags.join(" ")}`;
      const score = matchScore(corpus, keywords);
      const isBrief = /brief|需求|需求单|客户|比选|RFP/i.test(`${resource.type} ${resource.title} ${resource.content}`);
      const isQa = /QA|Q&A|答疑|问答|确认|客户确认|补充需求/i.test(`${resource.type} ${resource.title} ${resource.content}`);
      const isWinning = /中标|成功|高复用|获胜|定标|投标方案|案例|复盘/i.test(`${resource.type} ${resource.title} ${resource.summary} ${resource.content} ${resource.tags.join(" ")}`);
      return { resource, score: score + (isBrief ? 2 : 0) + (isQa ? 2 : 0) + (isWinning ? 2 : 0), isBrief, isQa, isWinning };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  const projectMatches = projects
    .map((project) => {
      const corpus = `${project.name} ${project.game} ${project.client} ${project.type} ${project.stage} ${project.status} ${project.tasks.map((task) => `${task.phase} ${task.name} ${task.delayReason ?? ""}`).join(" ")}`;
      return { project, score: matchScore(corpus, keywords) + (project.type === form.projectType ? 2 : 0) + (project.status.includes("完成") ? 1 : 0) };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const historicalBriefs = resourceMatches.filter((item) => item.isBrief).slice(0, 3);
  const qaItems = resourceMatches.filter((item) => item.isQa).slice(0, 3);
  const winningCases = resourceMatches.filter((item) => item.isWinning).slice(0, 3);
  const relatedProjects = projectMatches.slice(0, 3);
  const fallbackResources = resourceMatches.slice(0, 3);

  const lines = [
    "历史参照检索：",
    `命中关键词：${keywords.slice(0, 12).join("、") || "暂无"}`,
    "",
    "相似历史需求：",
    ...(historicalBriefs.length ? historicalBriefs.map(({ resource, score }) => `- ${resource.title}（${resource.type}，匹配 ${score}）：${summarize(resource.summary || resource.content)}`) : ["- 暂无明确 Brief/需求类命中，已参考综合资料。"]),
    "",
    "历史 QA / 答疑线索：",
    ...(qaItems.length ? qaItems.map(({ resource, score }) => `- ${resource.title}（匹配 ${score}）：${summarize(resource.content || resource.summary)}`) : ["- 暂无明确 QA/答疑资料，建议在本次输出中补齐客户确认问题。"]),
    "",
    "中标/高复用案例：",
    ...(winningCases.length ? winningCases.map(({ resource, score }) => `- ${resource.title}（匹配 ${score}）：${summarize(resource.summary || resource.content)}`) : fallbackResources.map(({ resource, score }) => `- ${resource.title}（综合参考，匹配 ${score}）：${summarize(resource.summary || resource.content)}`)),
    "",
    "相关项目进展经验：",
    ...(relatedProjects.length ? relatedProjects.map(({ project, score }) => `- ${project.name}（${project.type}，匹配 ${score}）：阶段 ${project.stage}，风险 ${inferProjectRisk(project)}，平均进度 ${projectProgress(project)}%。`) : ["- 暂无匹配项目。"]),
  ];

  return {
    text: lines.join("\n"),
    historicalBriefs,
    qaItems,
    winningCases: winningCases.length ? winningCases : fallbackResources,
    relatedProjects,
  };
}

function buildBriefReportWithReferences(form: { projectName: string; gameName: string; projectType: string; usage: string; forbidden: string; brief: string }, referenceText: string) {
  return `${buildLocalBriefReport(form)}

历史资料分析：
${referenceText}

基于历史资料的策略提示：
1. 优先复用相似需求中的考核口径、资源清单和提案附件要求，避免遗漏客户显性评分项。
2. 对历史 QA 中反复出现的预算、排竞、素材授权、KOL 口径、效果预估问题，提前放入客户确认清单。
3. 中标或高复用案例只作为结构和论证方式参考，具体资源、报价和数据需按本项目重新确认。`;
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
  const [selectedProjectTab, setSelectedProjectTab] = useState("概览");
  const [selectedResourceId, setSelectedResourceId] = useState(1);
  const [briefOutput, setBriefOutput] = usePersistentState("strategy-center-brief-output", "");
  const [outlineOutput, setOutlineOutput] = usePersistentState("strategy-center-outline-output", "");
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

  const navigateProject = (id: number, initialTab = "概览") => {
    setSelectedProjectId(id);
    setSelectedProjectTab(initialTab);
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
        <Topbar />
        {page === "home" && <Home projects={projects} members={members} jobs={jobs} setPage={setPage} openProject={navigateProject} />}
        {page === "projects" && <Projects projects={projects} members={members} openProject={navigateProject} setProjects={setProjects} addJob={addJob} />}
        {page === "projectDetail" && <ProjectDetail project={selectedProject} initialTab={selectedProjectTab} members={members} projects={projects} resources={resources} openResource={navigateResource} setPage={setPage} setProjects={setProjects} addJob={addJob} />}
        {page === "people" && <PeopleManagement members={members} setMembers={setMembers} projects={projects} openProject={navigateProject} addJob={addJob} />}
        {page === "marketingResearch" && <MarketingResearch addJob={addJob} />}
        {page === "resources" && <Resources resources={resources} openResource={navigateResource} deleteResource={deleteResource} setPage={setPage} />}
        {page === "resourceUpload" && <ResourceUpload setResources={setResources} setPage={setPage} addJob={addJob} />}
        {page === "resourceDetail" && <ResourceDetail resource={selectedResource} deleteResource={deleteResource} setPage={setPage} addJob={addJob} />}
        {page === "brief" && <BriefAssistant briefOutput={briefOutput} setBriefOutput={setBriefOutput} projects={projects} resources={resources} setPage={setPage} addJob={addJob} />}
        {page === "outline" && <OutlineAssistant briefOutput={briefOutput} resources={resources} outlineOutput={outlineOutput} setOutlineOutput={setOutlineOutput} addJob={addJob} />}
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
    { key: "marketingResearch", label: "营销调研", icon: "◈" },
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
        <p>资料库、方案助手、项目跟进已接入前端流程。</p>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="topbar">
      <div className="search-box">搜索项目、资料、任务，例如“二次元新品上线方案”</div>
      <div className="topbar-actions">
        <div className="avatar">ZY</div>
      </div>
    </header>
  );
}

function Home({ projects, members, jobs, setPage, openProject }: { projects: Project[]; members: Member[]; jobs: AiJob[]; setPage: (page: Page) => void; openProject: (id: number, initialTab?: string) => void }) {
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

function Projects({ projects, members, openProject, setProjects, addJob }: { projects: Project[]; members: Member[]; openProject: (id: number, initialTab?: string) => void; setProjects: React.Dispatch<React.SetStateAction<Project[]>>; addJob: (type: string, name: string, source: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    query: "",
    status: "",
    type: "",
    risk: "",
    ownerId: "",
  });
  const [bidPeriod, setBidPeriod] = useState<"月" | "季度" | "年">("月");
  const [form, setForm] = useState({
    name: "",
    game: "",
    client: "",
    type: "新品上线",
    gameType: "",
    clientType: "大厂",
    bidAmount: "",
    clientCoreNeeds: "",
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
      gameType: form.gameType.trim() || form.type,
      clientType: form.clientType,
      bidDate: form.start,
      bidAmount: Number(form.bidAmount) || undefined,
      clientCoreNeeds: form.clientCoreNeeds.trim(),
      bidResult: "跟进中",
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
  const bidAnalysis = buildBidAnalysis(projects, bidPeriod);
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
      ["项目名称", "游戏", "客户", "类型", "游戏类型", "客户类型", "投标时间", "投标金额", "客户核心需求", "投标结果", "未中标原因分类", "未中标原因", "负责人", "当前阶段", "启动日期", "方案提交", "讲标日期", "状态", "风险"],
      ...filteredProjects.map((project) => [
        project.name,
        project.game,
        project.client,
        project.type,
        projectGameType(project),
        projectClientType(project),
        project.bidDate || project.start,
        project.bidAmount ?? "",
        project.clientCoreNeeds ?? "",
        projectBidResult(project),
        project.lostReasonCategory ?? "",
        project.lostReasonDetail ?? "",
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
            <Field label="游戏类型" value={form.gameType} onChange={(value) => setForm({ ...form, gameType: value })} />
            <label>
              <span>客户类型</span>
              <select value={form.clientType} onChange={(event) => setForm({ ...form, clientType: event.target.value })}>
                {clientTypeOptions.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <Field label="投标金额（万）" type="number" value={form.bidAmount} onChange={(value) => setForm({ ...form, bidAmount: value })} />
            <Field label="客户核心需求" value={form.clientCoreNeeds} onChange={(value) => setForm({ ...form, clientCoreNeeds: value })} />
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
      <BidAnalyticsPanel projects={projects} analysis={bidAnalysis} period={bidPeriod} setPeriod={setBidPeriod} />
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

function BidAnalyticsPanel({ projects, analysis, period, setPeriod }: { projects: Project[]; analysis: ReturnType<typeof buildBidAnalysis>; period: "月" | "季度" | "年"; setPeriod: (period: "月" | "季度" | "年") => void }) {
  const total = analysis.finished.length;
  const rate = winRate(analysis.won.length, total);
  const maxTrendTotal = Math.max(...analysis.trend.map((item) => item.total), 1);
  const targetProject = projects.find((project) => projectBidResult(project) === "跟进中") ?? projects[0];
  const targetAdvice = targetProject
    ? [
        `${projectClientType(targetProject)}投标建议：${projectClientType(targetProject) === "大厂" ? "重点突出数据支撑、渠道资源和执行确定性" : "强化创意差异化、报价弹性和可快速落地的样板玩法"}。`,
        targetProject.bidAmount ? `报价参考：当前投标金额 ${targetProject.bidAmount} 万，建议对照同客户类型历史中标项目拆分权益明细和可选包。` : "报价参考：建议补充投标金额，便于和历史同类项目比较。",
        analysis.lostReasons[0] ? `风险规避：近期未中标高频原因是“${analysis.lostReasons[0].key}”，本项目需要提前做专项检查。` : "风险规避：未中标原因样本较少，建议先补齐历史客户反馈。",
      ]
    : ["暂无项目可生成投标优化建议。"];

  return (
    <Card
      title="中标率统计与分析"
      action={
        <div className="segmented-control">
          {(["月", "季度", "年"] as const).map((item) => <button key={item} className={period === item ? "active" : ""} onClick={() => setPeriod(item)}>{item}</button>)}
        </div>
      }
    >
      <div className="bid-metric-grid">
        <Metric label="已完结投标" value={total} tone="blue" />
        <Metric label="中标项目" value={analysis.won.length} tone="green" />
        <Metric label="未中标项目" value={analysis.lost.length} tone="red" />
        <div className="metric metric-orange"><span>中标率</span><strong>{rate}%</strong></div>
      </div>
      <div className="bid-dashboard">
        <div className="trend-panel">
          <h3>中标率趋势</h3>
          <div className="trend-chart">
            {analysis.trend.length ? analysis.trend.map((item, index) => {
              const previous = analysis.trend[index - 1];
              const change = previous ? item.rate - previous.rate : 0;
              return (
                <div className="trend-item" key={item.key}>
                  <div className="trend-bars">
                    <span className="trend-volume" style={{ height: `${Math.max(12, (item.total / maxTrendTotal) * 100)}%` }} />
                    <span className="trend-rate" style={{ height: `${Math.max(8, item.rate)}%` }} />
                  </div>
                  <strong>{item.rate}%</strong>
                  <small>{item.key}</small>
                  {previous && <em className={change >= 0 ? "up" : "down"}>{change >= 0 ? "+" : ""}{change}</em>}
                </div>
              );
            }) : <div className="empty-inline">暂无已完结投标数据</div>}
          </div>
        </div>
        <div className="ai-report compact-report">
          <h3>AI 统计解读</h3>
          <ul>
            {analysis.report.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </div>
      </div>
      <div className="bid-grid">
        <BidStatsTable title="按客户类型" rows={analysis.byClient} />
        <BidStatsTable title="按游戏类型" rows={analysis.byGame} />
        <BidStatsTable title="未中标原因" rows={analysis.lostReasons} />
      </div>
      <div className="bid-insight-grid">
        <div className="insight-box">
          <h3>中标关键因素清单</h3>
          {analysis.factors.length ? analysis.factors.map((factor) => <span key={factor}>{factor}</span>) : <p className="muted">请在中标项目中补充中标因素，系统会自动沉淀可复用清单。</p>}
        </div>
        <div className="insight-box">
          <h3>投标优化建议</h3>
          {targetAdvice.map((line) => <p key={line}>{line}</p>)}
        </div>
      </div>
    </Card>
  );
}

function BidStatsTable({ title, rows }: { title: string; rows: Array<{ key: string; total: number; won: number; lost: number; rate: number }> }) {
  return (
    <div className="mini-table">
      <h3>{title}</h3>
      <table>
        <thead>
          <tr><th>维度</th><th>投标</th><th>中标率</th></tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row) => (
            <tr key={row.key}>
              <td>{row.key}</td>
              <td>{row.total}</td>
              <td>{row.rate}%</td>
            </tr>
          )) : <tr><td colSpan={3}>暂无数据</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function ProjectDetail({ project, initialTab, members, projects, resources, openResource, setPage, setProjects, addJob }: { project: Project; initialTab: string; members: Member[]; projects: Project[]; resources: Resource[]; openResource: (id: number) => void; setPage: (page: Page) => void; setProjects: React.Dispatch<React.SetStateAction<Project[]>>; addJob: (type: string, name: string, source: string) => void }) {
  const [tab, setTab] = useState(initialTab);
  const [resourceToAttach, setResourceToAttach] = useState("");
  const inferredRisk = inferProjectRisk(project);
  const inferredReasons = projectRiskReasons(project);
  const linkedResources = resources.filter((resource) => project.resourceIds?.includes(resource.id));
  const availableResources = resources.filter((resource) => !project.resourceIds?.includes(resource.id));
  const backupRecommendations = recommendBackupMembers(project, members, projects);
  const currentAverageProgress = project.tasks.length ? Math.round(project.tasks.reduce((total, task) => total + task.progress, 0) / project.tasks.length) : 100;

  useEffect(() => {
    setTab(initialTab);
  }, [project.id, initialTab]);

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
              <Field label="游戏类型" value={project.gameType || ""} onChange={(value) => updateProjectField("gameType", value)} />
              <label>
                <span>客户类型</span>
                <select value={projectClientType(project)} onChange={(event) => updateProjectField("clientType", event.target.value)}>
                  {clientTypeOptions.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
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
              <Field label="投标时间" type="date" value={project.bidDate || project.start} onChange={(value) => updateProjectField("bidDate", value)} />
              <Field label="投标金额（万）" type="number" value={`${project.bidAmount ?? ""}`} onChange={(value) => updateProjectField("bidAmount", Number(value) || undefined)} />
              <Field label="客户核心需求" value={project.clientCoreNeeds || ""} onChange={(value) => updateProjectField("clientCoreNeeds", value)} />
              <label>
                <span>投标结果</span>
                <select value={projectBidResult(project)} onChange={(event) => updateProjectField("bidResult", event.target.value as BidResult)}>
                  {bidResultOptions.map((result) => <option key={result}>{result}</option>)}
                </select>
              </label>
              <label>
                <span>未中标原因分类</span>
                <select value={project.lostReasonCategory || "其他"} onChange={(event) => updateProjectField("lostReasonCategory", event.target.value as LostReasonCategory)}>
                  {lostReasonOptions.map((reason) => <option key={reason}>{reason}</option>)}
                </select>
              </label>
              <Field label="未中标原因" value={project.lostReasonDetail || ""} onChange={(value) => updateProjectField("lostReasonDetail", value)} />
              <Field label="中标关键因素" value={project.winningFactors || ""} onChange={(value) => updateProjectField("winningFactors", value)} />
              <Field label="竞品情况" value={project.competitorContext || ""} onChange={(value) => updateProjectField("competitorContext", value)} />
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
  const spreadsheet = spreadsheetFromResource(resource);

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
          {spreadsheet ? <SpreadsheetPreview spreadsheet={spreadsheet} title={resource.title} summary={resource.summary} /> : (
            <div className="document-preview">
              <h2>{resource.title}</h2>
              <p>{resource.summary}</p>
              <p>{resource.content}</p>
              <div className="preview-lines" />
            </div>
          )}
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

function SpreadsheetPreview({ spreadsheet, title, summary }: { spreadsheet: SpreadsheetContent; title: string; summary: string }) {
  return (
    <div className="spreadsheet-preview">
      <div className="spreadsheet-hero">
        <span>Excel 结构化预览</span>
        <h2>{title}</h2>
        <p>{summary}</p>
      </div>
      {spreadsheet.sheets.map((sheet) => {
        const entries = spreadsheetEntries(sheet.rows);
        const importantEntries = importantSpreadsheetEntries(sheet.rows);
        const sections = spreadsheetSections(sheet.rows);
        const tableRows = sheet.rows.map(compactRow).filter((row) => row.length);
        const columnCount = Math.min(6, Math.max(...tableRows.map((row) => row.length), 2));
        return (
          <div className="sheet-block" key={sheet.name}>
            <div className="sheet-heading">
              <strong>{sheet.name}</strong>
              <span>{sheet.rowCount ?? sheet.rows.length} 行</span>
            </div>
            {importantEntries.length > 0 && (
              <div className="important-box">
                <strong>重点信息</strong>
                <div className="important-list">
                  {importantEntries.map((entry, index) => (
                    <div key={`${sheet.name}-important-${entry.label}-${index}`}>
                      <span>{entry.label}</span>
                      <p>{entry.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {sections.length > 0 ? (
              <div className="sheet-section-list">
                {sections.map((section) => (
                  <div className="sheet-section" key={`${sheet.name}-${section.title}`}>
                    <h3>{section.title}</h3>
                    <div className="excel-entry-grid">
                      {section.entries.map((entry, index) => (
                        <div className="excel-entry" key={`${section.title}-${entry.label}-${index}`}>
                          <span>{entry.label}</span>
                          <p>{entry.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : entries.length > 0 && (
              <div className="excel-entry-grid">
                {entries.map((entry, index) => (
                  <div className="excel-entry" key={`${sheet.name}-${entry.label}-${index}`}>
                    <span>{entry.label}</span>
                    <p>{entry.value}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="excel-table-wrap">
              <table className="excel-preview-table">
                <tbody>
                  {tableRows.map((row, rowIndex) => (
                    <tr key={`${sheet.name}-${rowIndex}`}>
                      {Array.from({ length: columnCount }, (_, cellIndex) => (
                        <td key={cellIndex}>{row[cellIndex] || ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BriefAssistant({ briefOutput, setBriefOutput, projects, resources, setPage, addJob }: { briefOutput: string; setBriefOutput: (value: string) => void; projects: Project[]; resources: Resource[]; setPage: (page: Page) => void; addJob: (type: string, name: string, source: string) => void }) {
  const [apiConfig, setApiConfig] = usePersistentState<BriefApiConfig>("strategy-center-brief-api-config", {
    endpoint: "",
    apiKey: "",
    model: "",
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parsedFiles, setParsedFiles] = useState<BriefInputFile[]>([]);
  const [isParsingFiles, setIsParsingFiles] = useState(false);
  const [fileMessage, setFileMessage] = useState("");
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [modelMessage, setModelMessage] = useState("");
  const [form, setForm] = useState({
    projectName: "",
    gameName: "",
    projectType: "新品上线",
    usage: "投标",
    forbidden: "",
    brief: "",
  });
  const currentInputPackage = useMemo(() => buildCurrentInputPackage(form, parsedFiles), [form, parsedFiles]);
  const referenceContext = useMemo(() => buildBriefReferenceContext(form, projects, resources, currentInputPackage), [currentInputPackage, form, projects, resources]);

  const addBriefFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setSelectedFiles((current) => {
      const next = [...current];
      Array.from(fileList).forEach((file) => {
        const exists = next.some((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified);
        if (!exists) next.push(file);
      });
      return next;
    });
    setFileMessage("已加入文件，点击解析文件后会读取正文。");
  };

  const removeBriefFile = (index: number) => {
    setSelectedFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const parseBriefFiles = async () => {
    if (!selectedFiles.length) {
      setFileMessage("请先选择客户 Brief、QA 或补充资料文件。");
      return parsedFiles;
    }
    setIsParsingFiles(true);
    setFileMessage("");
    try {
      const body = new FormData();
      selectedFiles.forEach((file) => body.append("files", file));
      let response = await fetch("/api/brief-files", { method: "POST", body });
      if (response.status === 404) {
        const fallbackBody = new FormData();
        selectedFiles.forEach((file) => fallbackBody.append("files", file));
        fallbackBody.append("type", "Brief输入");
        fallbackBody.append("projectType", form.projectType);
        fallbackBody.append("title", form.projectName || "Brief 输入文件");
        fallbackBody.append("content", form.brief);
        response = await fetch("/api/resources/upload", { method: "POST", body: fallbackBody });
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Brief 输入文件解析失败。");
      const files = (result.files ?? result.resources ?? []).map((item: Partial<BriefInputFile & Resource>) => ({
        id: item.id ?? Date.now(),
        name: item.name ?? item.fileName ?? item.title ?? "Brief 输入文件",
        fileSize: item.fileSize,
        mimeType: item.mimeType,
        parseStatus: item.parseStatus === "失败" ? "失败" : "成功",
        parseError: item.parseError,
        summary: item.summary ?? summarize(item.content ?? ""),
        content: item.content ?? "",
        structuredContent: item.structuredContent,
      })) as BriefInputFile[];
      setParsedFiles(files);
      setFileMessage(`已解析 ${files.length} 个输入文件。`);
      addJob("Brief 文件解析", `解析 ${files.length} 个客户输入文件`, "方案助手");
      return files;
    } catch (error) {
      setFileMessage(error instanceof Error ? error.message : "Brief 输入文件解析失败。");
      return parsedFiles;
    } finally {
      setIsParsingFiles(false);
    }
  };

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

  const run = async () => {
    setIsRunning(true);
    try {
      const inputFiles = selectedFiles.length && !parsedFiles.length ? await parseBriefFiles() : parsedFiles;
      const inputPackage = buildCurrentInputPackage(form, inputFiles);
      const liveReferenceContext = buildBriefReferenceContext(form, projects, resources, inputPackage);
      const systemPrompt = `你是游戏营销策略中心的 Brief 解析专家。请基于系统设定流程分析“本次项目输入包”，输入包可能包含客户下发 Brief、QA/答疑、补充资料、附件要求、历史沟通记录。

输出时必须：
1. 区分客户明确要求、AI 推断、历史参照启发、需要人工确认的信息。
2. 先综合本次上传文件，再结合历史参照文件，不要只复述单个文件。
3. 自动识别需求背景、目标、预算、节点、考核标准、排竞/保密、交付物、风险与缺失信息。
4. 输出客户确认 QA，优先覆盖预算、资源授权、排竞、素材、KOL/达人、效果预估、提交附件和时间节点。
5. 如历史中标/高复用案例可参考，只提炼结构和策略方法，不把旧项目数据当成当前事实。`;
      const prompt = `${systemPrompt}

${inputPackage}

请同时参考以下系统自动检索到的历史资料，分析相似需求、历史 QA/答疑、中标或高复用案例，并明确哪些结论来自历史资料、哪些需要人工确认。

${liveReferenceContext.text}`;
      if (apiConfig.endpoint.trim()) {
        setBriefOutput("正在调用 Brief 解析 API...");
        const response = await fetch("/api/brief-run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            endpoint: apiConfig.endpoint.trim(),
            apiKey: apiConfig.apiKey.trim(),
            model: apiConfig.model.trim() || undefined,
            input: form,
            prompt,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || result.error || "Brief 解析 API 调用失败。");
        const output = result.output || result.report || result.content || result.choices?.[0]?.message?.content;
        setBriefOutput(output || JSON.stringify(result, null, 2));
        addJob("Brief 解析", `${form.projectName || "未命名项目"} Brief API 需求解构`, "方案助手");
        return;
      }
      setBriefOutput(`${buildBriefReportWithReferences(form, liveReferenceContext.text)}

本次上传文件综合：
${inputFiles.length ? inputFiles.map((file) => `- ${classifyBriefFile(file.name, file.content)}：${file.name}；${file.summary}`).join("\n") : "- 暂无上传文件，当前仅基于手动输入和历史参照生成。"}

客户确认 QA 优先级：
1. 预算拆分、报价口径、权益明细和效果预估是否已有固定模板？
2. 是否存在排竞、保密、IP/明星/异业资源使用限制？
3. 提案附件是否必须包含 PPT、费用表、成功案例、执行排期和数据支撑？
4. QA/补充资料中未明确的节点、素材、达人范围和审批流程是否需要客户确认？`);
      addJob("Brief 解析", `${form.projectName || "未命名项目"} Brief 本地需求与历史资料分析`, "方案助手");
    } catch (error) {
      setBriefOutput(error instanceof Error ? error.message : "Brief 解析 API 调用失败。");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="page">
      <PageTitle title="Brief 解析" subtitle="上传或粘贴客户 Brief，生成需求解构和 QA 清单。" />
      <div className="split-panel">
        <Card title="输入信息">
          <div className="form-grid">
            <Field label="项目名称" value={form.projectName} onChange={(value) => setForm({ ...form, projectName: value })} />
            <Field label="游戏名称" value={form.gameName} onChange={(value) => setForm({ ...form, gameName: value })} />
            <Field label="项目类型" value={form.projectType} onChange={(value) => setForm({ ...form, projectType: value })} />
            <Field label="方案用途" value={form.usage} onChange={(value) => setForm({ ...form, usage: value })} />
          </div>
          <div className="brief-file-panel">
            <label className="upload-zone compact-upload">
              <strong>上传本次项目输入文件</strong>
              <span>支持客户 Brief、QA、补充资料、Excel、Word、PDF、TXT</span>
              <input type="file" multiple onChange={(event) => addBriefFiles(event.target.files)} />
              <em>{selectedFiles.length ? `已选择 ${selectedFiles.length} 个文件` : "点击选择文件"}</em>
            </label>
            {selectedFiles.length > 0 && (
              <div className="file-list">
                {selectedFiles.map((file, index) => (
                  <div className="file-item" key={`${file.name}-${file.size}-${file.lastModified}`}>
                    <span>{file.name}</span>
                    <button className="link-button danger" onClick={() => removeBriefFile(index)}>移除</button>
                  </div>
                ))}
              </div>
            )}
            <div className="inline-actions">
              <button className="ghost-button" onClick={parseBriefFiles} disabled={isParsingFiles}>{isParsingFiles ? "解析中..." : "解析文件"}</button>
              {fileMessage && <span>{fileMessage}</span>}
            </div>
            {parsedFiles.length > 0 && (
              <div className="brief-input-list">
                {parsedFiles.map((file) => (
                  <div className="brief-input-card" key={file.id}>
                    <strong>{classifyBriefFile(file.name, file.content)}</strong>
                    <span>{file.name} / {formatFileSize(file.fileSize)} / {file.parseStatus}</span>
                    <p>{file.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <textarea value={form.forbidden} onChange={(event) => setForm({ ...form, forbidden: event.target.value })} placeholder="禁忌要求，例如：不可使用负面热点、不可过度强调氪金、不可提未确认资源..." />
          <textarea value={form.brief} onChange={(event) => setForm({ ...form, brief: event.target.value })} placeholder="可选：粘贴额外客户沟通记录、会议纪要或人工补充说明..." />
          <div className="note-box">
            <strong>API 调用接口</strong>
            <p>填写接口地址后会调用外部 Brief 解析 API；留空则使用本地规则生成报告。</p>
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
          </div>
          <button className="primary-button wide" onClick={run} disabled={isRunning}>{isRunning ? "解析中..." : "开始解析"}</button>
        </Card>
        <div className="stack-panel">
          <Card title="历史参照检索" action={<span className="soft-pill">自动匹配</span>}>
            <div className="reference-grid">
              <ReferenceColumn title="相似历史需求" items={referenceContext.historicalBriefs.map(({ resource, score }) => ({ title: resource.title, meta: `${resource.type} / 匹配 ${score}`, summary: resource.summary }))} />
              <ReferenceColumn title="历史 QA / 答疑" items={referenceContext.qaItems.map(({ resource, score }) => ({ title: resource.title, meta: `${resource.type} / 匹配 ${score}`, summary: summarize(resource.content || resource.summary) }))} />
              <ReferenceColumn title="中标/高复用案例" items={referenceContext.winningCases.map(({ resource, score }) => ({ title: resource.title, meta: `${resource.type} / 匹配 ${score}`, summary: resource.summary }))} />
            </div>
            <div className="reference-projects">
              <strong>相关项目经验</strong>
              {referenceContext.relatedProjects.length ? referenceContext.relatedProjects.map(({ project, score }) => (
                <span key={project.id}>{project.name} / {project.stage} / 风险 {inferProjectRisk(project)} / 匹配 {score}</span>
              )) : <span>暂无匹配项目</span>}
            </div>
          </Card>
          <Card title="AI 需求解构报告" action={<button className="ghost-button" onClick={() => setPage("outline")}>用于生成大纲</button>}>
            <pre className="ai-output">{briefOutput || "填写左侧信息后，AI 将结合历史需求、QA 答疑和中标案例输出需求解构、风险点和客户确认 QA。"}</pre>
          </Card>
        </div>
      </div>
    </section>
  );
}

function ReferenceColumn({ title, items }: { title: string; items: Array<{ title: string; meta: string; summary: string }> }) {
  return (
    <div className="reference-column">
      <strong>{title}</strong>
      {items.length ? items.map((item) => (
        <div className="reference-item" key={`${title}-${item.title}`}>
          <span>{item.meta}</span>
          <b>{item.title}</b>
          <p>{item.summary}</p>
        </div>
      )) : <p className="muted">暂无匹配资料</p>}
    </div>
  );
}

function OutlineAssistant({ briefOutput, resources, outlineOutput, setOutlineOutput, addJob }: { briefOutput: string; resources: Resource[]; outlineOutput: string; setOutlineOutput: (value: string) => void; addJob: (type: string, name: string, source: string) => void }) {
  const [form, setForm] = useState({
    tone: "专业严谨",
    pageRange: "18-22",
    modules: "背景、洞察、策略、创意、执行、预算、排期、风险",
    preference: "",
  });

  const run = () => {
    const related = resources.slice(0, 3).map((resource) => resource.title).join("、");
    setOutlineOutput(`方案调性：${form.tone}
页数范围：${form.pageRange}
必含模块：${form.modules}
客户偏好：${form.preference || "暂无特殊偏好"}

整体叙事逻辑：
先用市场和用户洞察证明机会，再提出核心策略和创意主题，随后拆解传播玩法、资源组合、执行排期、预算与效果预估，最后用风险预案和团队能力增强可信度。

已参考资料：
${related || "暂无资料库参考"}

需求依据：
${briefOutput ? summarize(briefOutput) : "未选择需求解构报告，当前基于通用游戏营销方案结构生成。"}`);
    addJob("方案大纲", "新品上线投标方案大纲", "方案助手");
  };

  const pages = ["封面", "项目背景", "市场与用户洞察", "竞品与机会分析", "核心策略", "创意与传播玩法", "执行规划", "项目排期", "预算与效果预估", "风险与应对"];

  return (
    <section className="page">
      <PageTitle title="方案大纲生成" subtitle="基于需求解构、调性和参考资料生成可编辑 PPT 结构。" />
      <div className="split-panel">
        <Card title="生成配置">
          <div className="form-grid">
            <Field label="方案调性" value={form.tone} onChange={(value) => setForm({ ...form, tone: value })} />
            <Field label="页数范围" value={form.pageRange} onChange={(value) => setForm({ ...form, pageRange: value })} />
            <Field label="必含模块" value={form.modules} onChange={(value) => setForm({ ...form, modules: value })} />
            <Field label="客户偏好" value={form.preference} onChange={(value) => setForm({ ...form, preference: value })} />
          </div>
          <div className="note-box">
            <strong>已载入需求解构</strong>
            <p>{briefOutput ? summarize(briefOutput) : "还没有 Brief 解析结果，可以先去“方案助手 > Brief 解析”生成。"}</p>
          </div>
          <button className="primary-button wide" onClick={run}>生成大纲</button>
        </Card>
        <Card title="方案大纲">
          <p className="muted">{outlineOutput || "配置左侧参数后生成方案大纲。"}</p>
          <div className="outline-list">
            {pages.map((page, index) => (
              <div className="outline-item" key={page}>
                <span>{index + 1}</span>
                <div>
                  <strong>{page}</strong>
                  <p>页面目标、核心内容、建议素材和引用资料将在这里展示。</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

function PeopleManagement({ members, setMembers, projects, openProject, addJob }: { members: Member[]; setMembers: React.Dispatch<React.SetStateAction<Member[]>>; projects: Project[]; openProject: (id: number, initialTab?: string) => void; addJob: (type: string, name: string, source: string) => void }) {
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
  const assignmentRows = useMemo(() => {
    return projects.map((project) => {
      const activeTasks = project.tasks.filter((task) => task.status !== "已完成");
      const delayedTasks = project.tasks.filter((task) => task.status === "延期");
      const riskyTasks = project.tasks.filter((task) => {
        const risk = inferTaskRisk(task, project);
        return risk === "紧急" || risk === "严重";
      });
      const ownerGroups = activeTasks.reduce<Array<{ name: string; count: number; progress: number }>>((groups, task) => {
        const name = memberName(members, task.ownerId, task.owner);
        const existing = groups.find((item) => item.name === name);
        if (existing) {
          existing.count += 1;
          existing.progress += task.progress;
        } else {
          groups.push({ name, count: 1, progress: task.progress });
        }
        return groups;
      }, []);
      const collaborators = ownerGroups
        .map((item) => `${item.name} ${item.count} 项/${Math.round(item.progress / item.count)}%`)
        .join("；") || "暂无未完成任务";
      const recommendations = recommendBackupMembers(project, members, projects).slice(0, 3);
      const nextMilestone = daysUntil(project.submit) <= daysUntil(project.pitch) ? `方案提交 ${project.submit}` : `讲标 ${project.pitch}`;
      return {
        project,
        progress: projectProgress(project),
        risk: inferProjectRisk(project),
        activeTasks,
        delayedTasks,
        riskyTasks,
        collaborators,
        recommendations,
        nextMilestone,
      };
    }).sort((a, b) => {
      const riskRank: Record<Risk, number> = { 严重: 4, 紧急: 3, 一般: 2, 正常: 1 };
      return riskRank[b.risk] - riskRank[a.risk] || b.delayedTasks.length - a.delayedTasks.length || a.progress - b.progress;
    });
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
      <Card title="项目人员分工总表" action={<span className="soft-pill">随项目排期自动更新</span>}>
        <div className="table-scroll">
          <table className="joined-table">
            <thead>
              <tr>
                <th>项目</th>
                <th>负责人</th>
                <th>进度</th>
                <th>风险</th>
                <th>当前分工</th>
                <th>风险任务</th>
                <th>匹配协助人员</th>
                <th>下一节点</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {assignmentRows.map(({ project, progress, risk, delayedTasks, riskyTasks, collaborators, recommendations, nextMilestone }) => (
                <tr key={project.id}>
                  <td>
                    <strong>{project.name}</strong>
                    <span className="table-subtext">{project.type} / {project.stage}</span>
                  </td>
                  <td>{memberName(members, project.ownerId, project.owner)}</td>
                  <td>
                    <div className="table-progress">
                      <Progress value={progress} />
                      <span>{progress}%</span>
                    </div>
                  </td>
                  <td><RiskBadge risk={risk} /></td>
                  <td>{collaborators}</td>
                  <td>
                    {riskyTasks.length || delayedTasks.length ? (
                      <span>{riskyTasks.length} 个高风险 / {delayedTasks.length} 个延期</span>
                    ) : (
                      <span className="table-subtext">暂无</span>
                    )}
                  </td>
                  <td>
                    <div className="assist-list">
                      {recommendations.length ? recommendations.map((item) => (
                        <span key={item.member.id}>{item.member.name} · {item.loadStatus} · 匹配 {item.matchScore}</span>
                      )) : <span className="assist-empty">暂无可推荐人员</span>}
                    </div>
                  </td>
                  <td>{nextMilestone}</td>
                  <td><button className="link-button" onClick={() => openProject(project.id, "排期表")}>查看排期</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
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

const marketingResearchModules = [
  {
    name: "目标用户洞察",
    summary: "围绕目标用户画像、需求痛点和偏好趋势，明确项目的核心营销方向。",
    aiProvides: [
      "目标用户画像：精准拆解用户年龄、性别、地域、兴趣爱好、游戏习惯、消费观念、活跃时段、付费场景、留存周期，标注核心用户与潜在用户差异。",
      "用户需求分析：提炼用户核心需求、痛点和未被满足的需求，例如竞技类用户看重公平性和操作手感，休闲类用户看重轻量化和趣味性。",
      "用户偏好趋势：结合行业数据分析目标用户偏好变化，给出营销适配建议，例如强化剧情向内容或社交互动场景。",
      "调研结论总结：用简洁语言梳理核心洞察，明确营销方向，例如针对18-25岁男性用户突出竞技性和社交属性。",
    ],
    needs: [
      "调研需求框架：游戏类型、调研核心目标，例如用户偏好、付费意愿、留存痛点或新用户画像。",
      "基础信息：游戏核心玩法、目标年龄段、核心市场。",
      "已有数据：过往用户调研报告、后台用户数据、用户评论等。",
    ],
  },
  {
    name: "竞品分析",
    summary: "拆解竞品营销动作、口碑和趋势，沉淀差异化打法与避坑建议。",
    aiProvides: [
      "竞品营销报告：梳理竞品核心营销动作，标注时间节点和效果，例如预热活动、节日营销、KOL合作和渠道投放。",
      "竞品优劣势分析：对比营销优势与劣势，结合自身项目给出差异化建议。",
      "竞品用户口碑分析：提炼应用商店、社交平台、论坛中的正负面评价，为亮点打造和风险规避提供参考。",
      "竞品营销趋势预判：基于竞品过往动作预判后续营销方向，并给出自身应对策略。",
    ],
    needs: [
      "竞品范围：核心竞品、潜在竞品、标杆竞品的名称及基础信息。",
      "需求分析维度：营销渠道分配、线上线下活动、内容创意、用户口碑、付费模式、舆情表现等。",
      "覆盖周期：近3个月、半年或指定营销周期的竞品动作。",
    ],
  },
  {
    name: "热点对齐",
    summary: "筛选可借势的全网热点，输出创意灵感、素材框架和风险提示。",
    aiProvides: [
      "热点筛选匹配：抓取游戏圈、娱乐、社会、节日等热点，标注热度、持续时间和适配场景。",
      "热点灵感库：结合游戏核心卖点，提供3-5个可落地营销创意点，明确创意核心、执行思路和预期效果。",
      "素材库：整理热点相关文案、图片思路、短视频脚本框架，可直接复用或修改。",
      "热点风险提示：标注时效性、争议性等潜在风险，并给出备用热点、尺度控制等规避建议。",
    ],
    needs: [
      "核心需求：游戏类型、营销场景、营销调性，例如新品预热、版本更新、节日活动或品牌联动。",
      "禁忌要求：不可使用的热点类型、需规避的创意方向，尤其适用于女性向、乙游等舆情敏感方案。",
      "补充信息：游戏核心卖点、IP联动、画质优势、目标用户关注的热点领域。",
    ],
  },
  {
    name: "舆情分析",
    summary: "监测游戏、活动和合作对象的舆情变化，形成预警、趋势和应对建议。",
    aiProvides: [
      "负面舆情预警：针对突发负面舆情第一时间推送预警，标注影响范围，并给出官方回应和安抚话术建议。",
      "舆情趋势分析：生成舆情趋势图，分析变化原因，预判舆情走向。",
      "舆情总结与建议：按周或按月汇总舆情情况，提炼核心问题并给出优化建议。",
    ],
    needs: [
      "监测对象：游戏名称、别名、项目名称、核心关键词、活动名称、品牌联动对象和相关人员。",
      "监测范围：微博、抖音、小红书、TapTap、B站、应用商店、新闻媒体等平台。",
      "监测周期：实时监测、每日监测或特定时段监测，例如活动执行期间或新品上线后一周。",
    ],
  },
  {
    name: "往期营销内容",
    summary: "整理历史方案、素材和效果数据，为当前项目提供可复用资产和适配建议。",
    aiProvides: [
      "过往内容分类整理：按类型、场景、节点分类过往营销内容，生成可检索内容库。",
      "参考提炼：针对当前需求提炼过往内容亮点、不足、可复用点和需规避点。",
      "内容适配建议：结合当前项目需求，将过往成功内容进行适配修改，给出修改方向。",
      "数据关联分析：将营销内容与播放量、转化率、用户反馈等效果数据关联，识别高转化内容形式。",
    ],
    needs: [
      "产品信息：游戏名称、过往营销项目、营销类型，例如线上推广、线下活动、KOL合作。",
      "参考需求：方案大纲、PPT内容、文案、活动流程、投放渠道等。",
      "过往资料：营销方案、PPT、文案、活动数据、复盘报告。",
    ],
  },
];

function buildTargetUserInsightPrompt(form: { projectName: string; gameName: string; gameType: string; researchGoal: string; coreGameplay: string; targetAge: string; coreMarket: string; existingData: string; userComments: string; extraNotes: string }) {
  return `你是游戏营销调研专家，请基于用户投喂的信息生成“目标用户洞察”。

输出要求：
1. 必须用中文输出，结构清晰，可直接放入营销策略方案。
2. 不要编造精确数据；没有被投喂的数据请标注“需补充数据”或“基于输入推断”。
3. 需要区分核心用户与潜在用户，输出画像、需求、痛点、偏好趋势、营销适配建议和总结。
4. 结合游戏类型与玩法判断用户习惯、消费观念、活跃时段、付费场景、留存周期，但必须注明依据。
5. 最后给出3-5条可执行营销方向。

请按以下结构输出：
一、目标用户画像
- 核心用户
- 潜在用户
- 核心用户与潜在用户差异

二、用户需求分析
- 核心需求
- 主要痛点
- 未被满足的需求

三、用户偏好趋势与营销适配
- 偏好变化判断
- 内容/渠道/活动适配建议

四、调研结论总结
- 一句话核心洞察
- 营销方向建议
- 仍需补充的数据

投喂信息：
项目 / 游戏名称：${form.projectName || form.gameName || "未填写"}
游戏名称：${form.gameName || "未填写"}
游戏类型：${form.gameType || "未填写"}
调研核心目标：${form.researchGoal || "未填写"}
游戏核心玩法：${form.coreGameplay || "未填写"}
目标年龄段：${form.targetAge || "未填写"}
核心市场：${form.coreMarket || "未填写"}

已有数据：
${form.existingData || "暂无"}

用户评论 / 社交平台反馈：
${form.userComments || "暂无"}

补充信息：
${form.extraNotes || "暂无"}`;
}

type MarketingResearchForm = Record<string, string>;

const defaultMarketingResearchForms: Record<string, MarketingResearchForm> = {
  竞品分析: {
    projectName: "",
    gameName: "",
    competitorScope: "",
    analysisDimensions: "营销渠道分配 / 线上线下推广活动 / 内容创意 / 用户口碑 / 付费模式 / 舆情表现",
    coveragePeriod: "近3个月",
    competitorActions: "",
    userReputation: "",
    extraNotes: "",
  },
  热点对齐: {
    projectName: "",
    gameType: "",
    marketingScene: "新品预热",
    marketingTone: "",
    coreSellingPoints: "",
    forbiddenTopics: "",
    targetHotFields: "",
    extraNotes: "",
  },
  舆情分析: {
    projectName: "",
    gameName: "",
    monitorKeywords: "",
    monitorPlatforms: "微博 / 抖音 / 小红书 / TapTap / B站 / 应用商店 / 新闻媒体",
    monitorPeriod: "实时监测 / 每日监测 / 活动执行期间",
    currentSignals: "",
    historicalIssues: "",
    extraNotes: "",
  },
  往期营销内容: {
    projectName: "",
    gameName: "",
    pastProjects: "",
    marketingTypes: "线上推广 / 线下活动 / KOL合作",
    referenceNeeds: "方案大纲 / PPT内容 / 文案 / 活动流程 / 投放渠道",
    pastMaterials: "",
    performanceData: "",
    extraNotes: "",
  },
};

const marketingResearchFormConfigs: Record<string, { title: string; apiTitle: string; fields: Array<{ key: string; label: string; placeholder?: string }>; textareas: Array<{ key: string; placeholder: string }> }> = {
  竞品分析: {
    title: "竞品分析生成",
    apiTitle: "竞品分析 API",
    fields: [
      { key: "projectName", label: "项目 / 游戏名称", placeholder: "例如：星河边境新品上线" },
      { key: "gameName", label: "自身游戏名称", placeholder: "例如：星河边境" },
      { key: "competitorScope", label: "竞品范围", placeholder: "核心竞品、潜在竞品、标杆竞品名称" },
      { key: "analysisDimensions", label: "分析维度", placeholder: "营销渠道、内容创意、用户口碑等" },
      { key: "coveragePeriod", label: "覆盖周期", placeholder: "例如：近3个月 / 半年" },
    ],
    textareas: [
      { key: "competitorActions", placeholder: "粘贴竞品营销动作：预热活动、节日营销、KOL合作、渠道投放、效果数据等。" },
      { key: "userReputation", placeholder: "粘贴竞品用户口碑：应用商店、社交平台、论坛评论、负面舆情等。" },
      { key: "extraNotes", placeholder: "补充信息：自身项目目标、客户关注点、需重点对比的竞品打法等。" },
    ],
  },
  热点对齐: {
    title: "热点对齐生成",
    apiTitle: "热点对齐 API",
    fields: [
      { key: "projectName", label: "项目 / 游戏名称", placeholder: "例如：国风版本更新营销" },
      { key: "gameType", label: "游戏类型", placeholder: "例如：国风MMORPG / 女性向 / 竞技手游" },
      { key: "marketingScene", label: "营销场景", placeholder: "新品预热 / 版本更新 / 节日活动 / 品牌联动" },
      { key: "marketingTone", label: "营销调性", placeholder: "热血 / 休闲 / 国风 / 科幻 / 治愈" },
      { key: "targetHotFields", label: "目标热点领域", placeholder: "游戏圈 / 娱乐圈 / 体育圈 / 节日节点" },
    ],
    textareas: [
      { key: "coreSellingPoints", placeholder: "粘贴游戏核心卖点：独特玩法、IP联动、画质优势、角色设定、版本内容等。" },
      { key: "forbiddenTopics", placeholder: "粘贴禁忌要求：不可使用的热点类型、敏感方向、负面热点、与调性不符的创意等。" },
      { key: "extraNotes", placeholder: "补充信息：当前已关注热点、目标用户偏好的话题、客户特别要求等。" },
    ],
  },
  舆情分析: {
    title: "舆情分析生成",
    apiTitle: "舆情分析 API",
    fields: [
      { key: "projectName", label: "项目名称", placeholder: "例如：春节活动上线" },
      { key: "gameName", label: "游戏名称", placeholder: "含别名" },
      { key: "monitorKeywords", label: "监测关键词", placeholder: "玩法、活动名、联动对象、制作人、KOL等" },
      { key: "monitorPlatforms", label: "监测范围", placeholder: "微博、抖音、小红书、TapTap、B站等" },
      { key: "monitorPeriod", label: "监测周期", placeholder: "实时 / 每日 / 活动期间 / 上线后一周" },
    ],
    textareas: [
      { key: "currentSignals", placeholder: "粘贴当前舆情信号：用户投诉、讨论量变化、热门评论、媒体报道、客服反馈等。" },
      { key: "historicalIssues", placeholder: "粘贴历史舆情问题：Bug、逼氪、活动争议、版本延期、官方回应记录等。" },
      { key: "extraNotes", placeholder: "补充信息：希望重点判断的风险、需要输出的话术类型、内部处理限制等。" },
    ],
  },
  往期营销内容: {
    title: "往期营销内容生成",
    apiTitle: "往期营销内容 API",
    fields: [
      { key: "projectName", label: "当前项目 / 游戏名称", placeholder: "例如：新品预热方案" },
      { key: "gameName", label: "游戏名称", placeholder: "例如：星河边境" },
      { key: "pastProjects", label: "过往营销项目", placeholder: "例如：2025新品上线、2026春节活动" },
      { key: "marketingTypes", label: "营销类型", placeholder: "线上推广 / 线下活动 / KOL合作" },
      { key: "referenceNeeds", label: "参考需求", placeholder: "方案大纲 / PPT / 文案 / 活动流程 / 投放渠道" },
    ],
    textareas: [
      { key: "pastMaterials", placeholder: "粘贴过往资料：营销方案、PPT摘录、文案、活动流程、渠道计划、复盘报告等。" },
      { key: "performanceData", placeholder: "粘贴效果数据：播放量、转化率、用户反馈、投放成本、渠道效果、复盘结论等。" },
      { key: "extraNotes", placeholder: "补充信息：当前项目希望复用或规避的内容、客户偏好、风格要求等。" },
    ],
  },
};

function buildMarketingResearchPrompt(moduleName: string, form: MarketingResearchForm) {
  const moduleOutputMap: Record<string, string> = {
    竞品分析: `一、竞品营销报告
- 核心竞品动作
- 时间节点与效果

二、竞品优劣势分析
- 优势
- 劣势
- 自身差异化建议

三、竞品用户口碑分析
- 正面评价
- 负面评价
- 自身营销避坑与亮点打造

四、竞品营销趋势预判
- 后续动作预测
- 自身应对策略`,
    热点对齐: `一、热点筛选匹配
- 匹配热点
- 热度、持续时间、适配场景

二、热点灵感库
- 3-5个可落地创意点
- 创意核心、执行思路、预期效果

三、素材库
- 文案方向
- 图片思路
- 短视频脚本框架

四、热点风险提示
- 潜在风险
- 规避建议`,
    舆情分析: `一、负面舆情预警
- 风险事件
- 影响范围
- 官方回应/安抚话术建议

二、舆情趋势分析
- 趋势判断
- 变化原因
- 走向预判

三、舆情总结与建议
- 核心问题
- 优先处理动作
- 后续监测建议`,
    往期营销内容: `一、过往内容分类整理
- 类型
- 场景
- 节点

二、参考提炼
- 亮点
- 不足
- 可复用点
- 需规避点

三、内容适配建议
- 当前项目修改方向
- 可复用结构/文案/活动玩法

四、数据关联分析
- 高转化内容特征
- 用户反馈好的内容形式
- 当前创作建议`,
  };
  const formLines = Object.entries(form).map(([key, value]) => `${key}：${value || "未填写"}`).join("\n");
  return `你是资深游戏营销调研专家，请基于用户投喂的信息生成“${moduleName}”报告。

输出要求：
1. 必须用中文输出，结构清晰，可直接放入营销策略方案。
2. 不要编造精确数据；未提供的数据请标注“需补充数据”或“基于输入推断”。
3. 明确区分事实、推断、建议和风险。
4. 输出必须可落地，给出具体营销动作或判断依据。

请按以下结构输出：
${moduleOutputMap[moduleName] || "一、核心结论\n二、详细分析\n三、营销建议\n四、风险与待补充数据"}

投喂信息：
${formLines}`;
}

function extractAiText(result: any) {
  return (
    result.output_text ||
    result.output ||
    result.report ||
    result.content ||
    result.choices?.[0]?.message?.content ||
    result.choices?.[0]?.text ||
    result.data?.content ||
    (Array.isArray(result.output)
      ? result.output.map((item: any) => item.content?.map?.((content: any) => content.text).filter(Boolean).join("\n") || item.text || "").filter(Boolean).join("\n")
      : "")
  );
}

function MarketingResearch({ addJob }: { addJob: (type: string, name: string, source: string) => void }) {
  const [activeModule, setActiveModule] = useState(marketingResearchModules[0].name);
  const [apiConfig, setApiConfig] = usePersistentState<BriefApiConfig>("strategy-center-marketing-research-api-config", {
    endpoint: "",
    apiKey: "",
    model: "",
  });
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [modelMessage, setModelMessage] = useState("");
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [insightOutput, setInsightOutput] = usePersistentState("strategy-center-target-user-insight-output", "");
  const [researchOutputs, setResearchOutputs] = usePersistentState<Record<string, string>>("strategy-center-marketing-research-outputs", {});
  const [researchForms, setResearchForms] = usePersistentState<Record<string, MarketingResearchForm>>("strategy-center-marketing-research-forms", defaultMarketingResearchForms);
  const [form, setForm] = useState({
    projectName: "",
    gameName: "",
    gameType: "",
    researchGoal: "用户偏好 / 付费意愿 / 留存痛点 / 新用户画像",
    coreGameplay: "",
    targetAge: "",
    coreMarket: "",
    existingData: "",
    userComments: "",
    extraNotes: "",
  });
  const current = marketingResearchModules.find((item) => item.name === activeModule) ?? marketingResearchModules[0];
  const isTargetUserInsight = current.name === "目标用户洞察";
  const currentResearchForm = researchForms[current.name] ?? defaultMarketingResearchForms[current.name] ?? {};
  const currentFormConfig = marketingResearchFormConfigs[current.name];
  const currentOutput = isTargetUserInsight ? insightOutput : researchOutputs[current.name] || "";

  const updateResearchForm = (key: string, value: string) => {
    setResearchForms((currentForms) => ({
      ...currentForms,
      [current.name]: {
        ...(defaultMarketingResearchForms[current.name] ?? {}),
        ...(currentForms[current.name] ?? {}),
        [key]: value,
      },
    }));
  };

  const loadResearchModels = async () => {
    setIsLoadingModels(true);
    setModelMessage("");
    try {
      if (!inferModelsEndpoint(apiConfig.endpoint)) throw new Error("请先填写接口地址。");
      const response = await fetch("/api/marketing-research-models", {
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
      setApiConfig((currentConfig) => ({ ...currentConfig, model: currentConfig.model || models[0] }));
      setModelMessage(`已拉取 ${models.length} 个模型。`);
    } catch (error) {
      setModelOptions([]);
      setModelMessage(error instanceof Error ? error.message : "模型列表拉取失败。");
    } finally {
      setIsLoadingModels(false);
    }
  };

  const runTargetUserInsight = async () => {
    if (!apiConfig.endpoint.trim()) {
      setInsightOutput("请先填写目标用户洞察 API 接口地址。");
      return;
    }
    setIsRunning(true);
    try {
      const prompt = buildTargetUserInsightPrompt(form);
      setInsightOutput("正在调用目标用户洞察 API...");
      const response = await fetch("/api/marketing-research-run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          endpoint: apiConfig.endpoint.trim(),
          apiKey: apiConfig.apiKey.trim(),
          model: apiConfig.model.trim() || undefined,
          input: form,
          prompt,
          messages: [
            { role: "system", content: "你是资深游戏营销调研专家，擅长基于用户数据、评论和游戏玩法生成目标用户洞察。输出必须可落地、注明事实与推断边界。" },
            { role: "user", content: prompt },
          ],
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || result.error || "目标用户洞察 API 调用失败。");
      const output = extractAiText(result);
      setInsightOutput(output || JSON.stringify(result, null, 2));
      addJob("营销调研", `${form.projectName || form.gameName || "未命名项目"} 目标用户洞察`, "营销调研");
    } catch (error) {
      setInsightOutput(error instanceof Error ? error.message : "目标用户洞察 API 调用失败。");
    } finally {
      setIsRunning(false);
    }
  };

  const runMarketingResearch = async () => {
    if (!apiConfig.endpoint.trim()) {
      setResearchOutputs((currentOutputs) => ({ ...currentOutputs, [current.name]: `请先填写${current.name} API 接口地址。` }));
      return;
    }
    setIsRunning(true);
    try {
      const prompt = buildMarketingResearchPrompt(current.name, currentResearchForm);
      setResearchOutputs((currentOutputs) => ({ ...currentOutputs, [current.name]: `正在调用${current.name} API...` }));
      const response = await fetch("/api/marketing-research-run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          endpoint: apiConfig.endpoint.trim(),
          apiKey: apiConfig.apiKey.trim(),
          model: apiConfig.model.trim() || undefined,
          input: { module: current.name, ...currentResearchForm },
          prompt,
          messages: [
            { role: "system", content: `你是资深游戏营销调研专家，正在生成${current.name}报告。输出必须可落地、注明事实与推断边界。` },
            { role: "user", content: prompt },
          ],
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || result.error || `${current.name} API 调用失败。`);
      const output = extractAiText(result);
      setResearchOutputs((currentOutputs) => ({ ...currentOutputs, [current.name]: output || JSON.stringify(result, null, 2) }));
      addJob("营销调研", `${currentResearchForm.projectName || currentResearchForm.gameName || "未命名项目"} ${current.name}`, "营销调研");
    } catch (error) {
      setResearchOutputs((currentOutputs) => ({ ...currentOutputs, [current.name]: error instanceof Error ? error.message : `${current.name} API 调用失败。` }));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="page">
      <PageTitle title="营销调研" subtitle="沉淀用户、竞品、热点、舆情和往期内容分析，支撑策略方案前置判断。" />
      <div className="research-shell">
        <div className="research-nav">
          {marketingResearchModules.map((item) => (
            <button key={item.name} className={activeModule === item.name ? "research-nav-item active" : "research-nav-item"} onClick={() => setActiveModule(item.name)}>
              <strong>{item.name}</strong>
              <span>{item.summary}</span>
            </button>
          ))}
        </div>
        <div className="research-content">
          {isTargetUserInsight && (
          <Card title="目标用户洞察生成">
            <div className="research-template-grid">
              <Field label="项目 / 游戏名称" value={form.projectName} onChange={(value) => setForm({ ...form, projectName: value })} />
              <Field label="游戏类型" value={form.gameType} onChange={(value) => setForm({ ...form, gameType: value })} />
              <Field label="调研核心目标" value={form.researchGoal} onChange={(value) => setForm({ ...form, researchGoal: value })} />
              <Field label="目标年龄段" value={form.targetAge} onChange={(value) => setForm({ ...form, targetAge: value })} />
              <Field label="核心市场" value={form.coreMarket} onChange={(value) => setForm({ ...form, coreMarket: value })} />
              <Field label="游戏核心玩法" value={form.coreGameplay} onChange={(value) => setForm({ ...form, coreGameplay: value })} />
            </div>
            <textarea className="research-textarea" value={form.existingData} onChange={(event) => setForm({ ...form, existingData: event.target.value })} placeholder="粘贴已有数据：过往用户调研报告、后台用户数据、留存率、付费率、活跃时段等。" />
            <textarea className="research-textarea" value={form.userComments} onChange={(event) => setForm({ ...form, userComments: event.target.value })} placeholder="粘贴用户评论：应用商店、社交平台、社区论坛、客服反馈等。" />
            <textarea className="research-textarea" value={form.extraNotes} onChange={(event) => setForm({ ...form, extraNotes: event.target.value })} placeholder="补充信息：竞品线索、投放背景、客户特别关注点、禁忌方向等。" />
            <div className="note-box">
              <strong>目标用户洞察 API</strong>
              <p>填写兼容 chat/completions 或 responses 的接口地址；系统会把上面的投喂内容组织成提示词后，由 AI 生成洞察报告。</p>
              <div className="research-template-grid">
                <Field label="接口地址" value={apiConfig.endpoint} onChange={(value) => setApiConfig({ ...apiConfig, endpoint: value })} />
                <label>
                  <span>API Key</span>
                  <input type="password" value={apiConfig.apiKey} onChange={(event) => setApiConfig({ ...apiConfig, apiKey: event.target.value })} placeholder="可选，自动放入 Authorization Bearer" />
                </label>
                <label>
                  <span>模型</span>
                  <select value={apiConfig.model} onChange={(event) => setApiConfig({ ...apiConfig, model: event.target.value })}>
                    <option value="">先拉取模型列表，或手动填写后保存</option>
                    {modelOptions.map((model) => <option key={model} value={model}>{model}</option>)}
                  </select>
                </label>
              </div>
              <div className="inline-actions">
                <button className="ghost-button" onClick={loadResearchModels} disabled={isLoadingModels}>{isLoadingModels ? "拉取中..." : "拉取模型列表"}</button>
                {modelMessage && <span>{modelMessage}</span>}
              </div>
            </div>
            <div className="inline-actions">
              <button className="primary-button" onClick={runTargetUserInsight} disabled={isRunning}>{isRunning ? "生成中..." : "生成目标用户洞察"}</button>
              <span>结果会基于投喂内容生成，并标注事实、推断和需补充数据。</span>
            </div>
          </Card>
          )}
          {isTargetUserInsight && (
          <Card title="AI 目标用户洞察报告">
            <pre className="ai-output compact">{insightOutput || "填写投喂信息并配置 API 后，这里会生成目标用户画像、需求痛点、偏好趋势和营销方向。"}</pre>
          </Card>
          )}
          {!isTargetUserInsight && currentFormConfig && (
          <Card title={currentFormConfig.title}>
            <div className="research-template-grid">
              {currentFormConfig.fields.map((field) => (
                <Field key={field.key} label={field.label} value={currentResearchForm[field.key] || ""} onChange={(value) => updateResearchForm(field.key, value)} />
              ))}
            </div>
            {currentFormConfig.textareas.map((field) => (
              <textarea key={field.key} className="research-textarea" value={currentResearchForm[field.key] || ""} onChange={(event) => updateResearchForm(field.key, event.target.value)} placeholder={field.placeholder} />
            ))}
            <div className="note-box">
              <strong>{currentFormConfig.apiTitle}</strong>
              <p>填写兼容 chat/completions 或 responses 的接口地址；系统会把当前模块投喂内容组织成提示词后，由 AI 生成{current.name}报告。</p>
              <div className="research-template-grid">
                <Field label="接口地址" value={apiConfig.endpoint} onChange={(value) => setApiConfig({ ...apiConfig, endpoint: value })} />
                <label>
                  <span>API Key</span>
                  <input type="password" value={apiConfig.apiKey} onChange={(event) => setApiConfig({ ...apiConfig, apiKey: event.target.value })} placeholder="可选，自动放入 Authorization Bearer" />
                </label>
                <label>
                  <span>模型</span>
                  <select value={apiConfig.model} onChange={(event) => setApiConfig({ ...apiConfig, model: event.target.value })}>
                    <option value="">先拉取模型列表，或手动填写后保存</option>
                    {modelOptions.map((model) => <option key={model} value={model}>{model}</option>)}
                  </select>
                </label>
              </div>
              <div className="inline-actions">
                <button className="ghost-button" onClick={loadResearchModels} disabled={isLoadingModels}>{isLoadingModels ? "拉取中..." : "拉取模型列表"}</button>
                {modelMessage && <span>{modelMessage}</span>}
              </div>
            </div>
            <div className="inline-actions">
              <button className="primary-button" onClick={runMarketingResearch} disabled={isRunning}>{isRunning ? "生成中..." : `生成${current.name}`}</button>
              <span>结果会基于投喂内容生成，并标注事实、推断、建议和风险。</span>
            </div>
          </Card>
          )}
          {!isTargetUserInsight && (
          <Card title={`AI ${current.name}报告`}>
            <pre className="ai-output compact">{currentOutput || `填写投喂信息并配置 API 后，这里会生成${current.name}报告。`}</pre>
          </Card>
          )}
        </div>
      </div>
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

function projectBidResult(project: Project): BidResult {
  if (project.bidResult) return project.bidResult;
  if (project.status.includes("中标")) return "中标";
  if (project.status.includes("未中标") || project.status.includes("失败")) return "未中标";
  return "跟进中";
}

function projectClientType(project: Project) {
  return project.clientType || (project.client.includes("头部") || project.client.includes("大厂") ? "大厂" : project.client.includes("渠道") ? "渠道方" : "中小厂商");
}

function projectGameType(project: Project) {
  return project.gameType || project.type || "未分类";
}

function periodKey(dateText: string | undefined, period: "月" | "季度" | "年") {
  const date = parseScheduleDate(dateText || today(), today().slice(0, 4)) ?? new Date(`${today()}T00:00:00`);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  if (period === "年") return `${year}`;
  if (period === "季度") return `${year} Q${Math.ceil(month / 3)}`;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function winRate(won: number, total: number) {
  return total ? Math.round((won / total) * 100) : 0;
}

function bidStatsBy<T extends string>(projects: Project[], keyGetter: (project: Project) => T) {
  const groups = new Map<T, { key: T; total: number; won: number; lost: number; rate: number }>();
  projects.forEach((project) => {
    const result = projectBidResult(project);
    if (result === "跟进中") return;
    const key = keyGetter(project);
    const group = groups.get(key) ?? { key, total: 0, won: 0, lost: 0, rate: 0 };
    group.total += 1;
    if (result === "中标") group.won += 1;
    if (result === "未中标") group.lost += 1;
    group.rate = winRate(group.won, group.total);
    groups.set(key, group);
  });
  return Array.from(groups.values()).sort((a, b) => b.total - a.total || b.rate - a.rate);
}

function buildBidAnalysis(projects: Project[], period: "月" | "季度" | "年") {
  const finished = projects.filter((project) => projectBidResult(project) !== "跟进中");
  const won = finished.filter((project) => projectBidResult(project) === "中标");
  const lost = finished.filter((project) => projectBidResult(project) === "未中标");
  const trend = bidStatsBy(finished, (project) => periodKey(project.bidDate || project.submit || project.start, period)).sort((a, b) => a.key.localeCompare(b.key));
  const byClient = bidStatsBy(finished, projectClientType);
  const byGame = bidStatsBy(finished, projectGameType);
  const lostReasons = bidStatsBy(lost, (project) => project.lostReasonCategory || "其他");
  const topLostReason = lostReasons[0];
  const bestClient = byClient.slice().sort((a, b) => b.rate - a.rate || b.total - a.total)[0];
  const weakClient = byClient.slice().sort((a, b) => a.rate - b.rate || b.total - a.total)[0];
  const factors = Array.from(new Set(won.flatMap((project) => (project.winningFactors || project.clientCoreNeeds || `${project.type} ${projectGameType(project)} ${projectClientType(project)}`).split(/[,，、；;。\n]/).map((item) => item.trim()).filter(Boolean)))).slice(0, 8);
  const latestChange = trend.length >= 2 ? trend[trend.length - 1].rate - trend[trend.length - 2].rate : 0;
  const report = [
    `整体中标率 ${winRate(won.length, finished.length)}%，已完结投标 ${finished.length} 个，中标 ${won.length} 个，未中标 ${lost.length} 个。`,
    trend.length >= 2 ? `最近${period}中标率${latestChange >= 0 ? "上升" : "下降"} ${Math.abs(latestChange)} 个百分点，可能与${topLostReason ? `${topLostReason.key}类问题` : "样本结构变化"}有关。` : "历史样本仍偏少，建议继续补齐近 12 个月投标数据。",
    topLostReason ? `未中标首要原因是“${topLostReason.key}”，涉及 ${topLostReason.total} 个项目，建议建立专项复盘模板和素材库。` : "暂无明确未中标原因，建议在项目详情中补齐客户反馈和内部复盘。",
    bestClient ? `${bestClient.key}客户当前中标率 ${bestClient.rate}%，可沉淀为优先复用方法。` : "暂无客户类型维度样本。",
    weakClient && weakClient.total ? `${weakClient.key}客户中标率 ${weakClient.rate}%，后续投标需强化报价、创意或资源匹配。` : "",
  ].filter(Boolean);
  return { finished, won, lost, trend, byClient, byGame, lostReasons, factors, report };
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
