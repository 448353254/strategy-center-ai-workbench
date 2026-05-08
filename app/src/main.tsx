import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import {
  importedJobsSeed,
  importedMembersSeed,
  importedProjectsSeed,
  importedResourcesSeed,
} from "./importedSeedData";

type Page =
  | "home"
  | "projects"
  | "projectDetail"
  | "people"
  | "marketingResearch"
  | "research"
  | "resources"
  | "resourceUpload"
  | "resourceDetail"
  | "brief"
  | "outline"
  | "script"
  | "aiJobs"
  | "settings";

type OutlineTab = "template" | "audit";
type AssistantTab = "brief" | "outline" | "template";
type PeopleDetailView = "members" | "active" | "overload" | "delayed";
type BidQuickFilter = "finished" | "won" | "lost" | null;
type UserRole = "admin" | "user";

interface AuthUser {
  name: string;
  role: UserRole;
}

const demoUsers: Array<AuthUser & { account: string; password: string; title: string }> = [
  { account: "admin", password: "admin123", name: "管理员", role: "admin", title: "策略中心管理员" },
  { account: "user", password: "user123", name: "普通用户", role: "user", title: "项目执行用户" },
];

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

const globalAiConfigKey = "strategy-center-global-ai-config";
const defaultAiConfig: BriefApiConfig = {
  endpoint: "",
  apiKey: "",
  model: "",
};

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

interface TemplateSlide {
  id: string;
  module: string;
  title: string;
  objective: string;
  editableBlocks: string[];
  layoutTips: string[];
  visualTips: string[];
  contentPrompts: string[];
  highlightTips: string[];
}

interface OutlineTemplatePlan {
  version: "ppt-template-v1";
  title: string;
  projectType: string;
  usage: string;
  visualStyle: string;
  visualKeywords: string[];
  storytelling: string;
  editableGuide: string;
  optimizationSuggestions: string[];
  referenceAssets: string[];
  slides: TemplateSlide[];
}

type AuditSeverity = "严重问题" | "一般问题" | "优化建议";
type AuditCategory = "需求匹配度" | "逻辑连贯性" | "数据准确性" | "结构完整性" | "表达完整性";

interface AuditFinding {
  id: string;
  severity: AuditSeverity;
  category: AuditCategory;
  issue: string;
  detail: string;
  suggestion: string;
}

interface AuditSectionReport {
  id: string;
  title: string;
  module: string;
  status: "高风险" | "需调整" | "可优化" | "通过";
  summary: string;
  findings: AuditFinding[];
}

interface ContentAuditReport {
  version: "content-audit-v1";
  title: string;
  requirements: string[];
  briefSummary: string;
  overallSummary: string;
  totals: {
    severe: number;
    general: number;
    suggestion: number;
  };
  overallSuggestions: string[];
  sections: AuditSectionReport[];
}

interface ParsedAuditSection {
  id: string;
  title: string;
  module: string;
  body: string;
  searchable: string;
}

type ResearchTab = "brief" | "fixed" | "variable" | "report";

type FlowStepStatus = "已完成" | "缺资料" | "可继续生成";

interface FlowStep {
  key: ResearchTab;
  title: string;
  status: FlowStepStatus;
  detail: string;
  transfer: string;
}

interface StandardResearchModule {
  title: string;
  goal: string;
  output: string;
  checklist: string[];
}

interface VariableResearchScenario {
  scene: string;
  modules: string[];
  questions: string[];
  output: string;
}

const fixedResearchModules: StandardResearchModule[] = [
  {
    title: "用户深度调查",
    goal: "统一目标用户、内容偏好和触达渠道判断。",
    output: "用户分层表 + 内容偏好判断 + 渠道触点建议",
    checklist: [
      "用户分层与画像：核心硬核、休闲活跃、轻度回流、新用户；年龄、性别、职业、设备偏好、游戏场景。",
      "玩家游戏动机：竞争、成就、沉浸、逃避、社交、创作。",
      "游戏外高频讨论话题：角色、剧情、平衡性、活动、BUG。",
      "客户过往投放类型：攻略向、整活向、剧情向、测评向。",
      "玩家喜欢看的内容：搞笑、攻略、二创、赛事、测评。",
      "传播触点与信息渠道：抖音、B站、小红书、TapTap、贴吧、社群。",
    ],
  },
  {
    title: "游戏黑话与文化手册",
    goal: "避免外行表达，识别社群梗、身份标签和雷区。",
    output: "黑话词典 + 梗/表情包清单 + 禁忌表达表",
    checklist: [
      "社群自创缩略词，例如 yy、py、jjc、ssr 等。",
      "内部梗与表情包：官方有意或无意形成的梗。",
      "玩家身份认同标签：称谓、IP 符号、台词、场景的情感意义。",
      "禁忌词与敏感话题：平衡性、数值膨胀、运营节奏、容易引战表达。",
    ],
  },
  {
    title: "游戏产品自身调研",
    goal: "明确产品本身能被传播的主题感、卖点和品宣态度。",
    output: "产品传播定位 + 卖点优先级 + 节点品宣口径",
    checklist: [
      "当前版本或游戏本身已有主题感：废土、希望、轻松、治愈、热血等。",
      "核心卖点：玩法、美术、剧情、社交、IP 优势。",
      "各大节点品宣态度：预热、爆发、延续、复盘阶段分别怎么说。",
    ],
  },
  {
    title: "竞品与行业动态分析",
    goal: "判断同赛道近期打法、风险案例和可借鉴形式。",
    output: "竞品动作表 + 翻车案例库 + 行业玩法参考",
    checklist: [
      "同赛道近 3 个月新品及营销动作：头部和新入局者都要看。",
      "竞品翻车案例与玩家高频吐槽：活动、文案、定价、达人合作、运营节奏。",
      "同赛道热门营销形式：直播整活、UGC 挑战赛、线下快闪等。",
      "政策合规要求：未成年人保护、广告标注规范、平台内容规则。",
    ],
  },
];

const variableResearchScenarios: VariableResearchScenario[] = [
  {
    scene: "异业品牌联动",
    modules: ["联动对象用户画像匹配度", "联动偏好与形式接受度", "联动风险雷点排查"],
    questions: [
      "双方用户重合度有多高？",
      "用户最反感什么联动形式，例如扫码领礼包、换皮肤、割韭菜式联动？",
      "玩家对品牌的认知与偏好是什么，是否有联名期待？",
      "品牌近期有无舆情风险，以及品牌方有哪些合规要求？",
    ],
    output: "联动适配度判断 + 形式建议 + 风险排查表",
  },
  {
    scene: "推出贵价皮肤 / 稀有道具",
    modules: ["付费动机与定价敏感度", "皮肤功能/外观偏好", "过往社群态度", "炫耀动机强度"],
    questions: [
      "目标付费人群的接受区间、心理预期和付费决策因素是什么？",
      "外观、特效、限定、收藏价值、专属语音/动作里，哪个最适合种草？",
      "过往玩家好评、差评、争议点是什么？",
      "用户是否会受稀缺感、身份展示、从众心理影响而购买？",
    ],
    output: "定价风险判断 + 种草卖点 + 反感点规避清单",
  },
  {
    scene: "版本大更新 / 新角色上线",
    modules: ["核心信息拆解", "新内容预期管理", "老玩家回归阻力", "历史传播素材适配"],
    questions: [
      "版本或角色核心抓手是什么？",
      "用户对当前版本最不满意的点，新版本是否解决？",
      "流失用户回来的最低门槛是什么，例如送十连、签到福利、新角色试用？",
      "过去表现最好的预告形式是什么，实机演示、KOL 试玩还是剧情 PV？",
      "需规避哪些敏感点，例如平衡性调整、肝度争议？",
    ],
    output: "版本传播主线 + 回流门槛判断 + 素材适配建议",
  },
  {
    scene: "破圈事件 / 线下展会活动",
    modules: ["城市选择依据", "破圈目标人群调研", "线下互动意愿", "天气/人流/竞品活动"],
    questions: [
      "线下活动为什么选这个城市或商圈？",
      "非核心玩家、路人用户的 IP 认知度和兴趣点是什么？",
      "用户愿意排队多久，愿意做什么任务，例如集章、cosplay 合影？",
      "同时段是否有其他游戏或二次元活动分流？",
    ],
    output: "城市/点位依据 + 互动机制建议 + 分流风险判断",
  },
  {
    scene: "IP 衍生与 UGC 内容活动",
    modules: ["用户创作能力评估", "奖励吸引力", "素材开放程度", "衍生内容适配性", "传播形式参考"],
    questions: [
      "玩家二创兴趣浓度是否足够？",
      "什么奖励能驱动普通用户参与？",
      "官方能开放哪些素材包？",
      "适合破圈的 IP 亮点是什么，角色人设、剧情片段还是世界观设定？",
      "同 IP 或同赛道有哪些成功破圈案例？",
    ],
    output: "UGC 活动门槛 + 奖励设计 + 素材开放清单",
  },
  {
    scene: "大型营销事件",
    modules: ["事件主题与品牌/赛季契合度", "事件形式与内容结构", "舆情风险"],
    questions: [
      "营销事件的核心看点是什么？",
      "用户主动参与或传播该事件的驱动因素是什么？",
      "事件在线上还是线下，内容结构如何排布？",
      "历史大型活动中哪些环节口碑最好，哪些环节被吐槽？",
      "是否存在选手、达人、品牌或内容尺度相关舆情风险？",
    ],
    output: "事件核心看点 + 内容结构 + 风险预案",
  },
];

interface UserInsightProfile {
  id: number;
  label: string;
  segmentType: "核心用户" | "潜在用户";
  age: string;
  gender: string;
  region: string;
  interests: string[];
  habits: string[];
  spendingMindset: string;
  activeHours: string;
  paymentScenes: string[];
  retentionCycle: string;
  needs: string[];
  painPoints: string[];
  unmetNeeds: string[];
  trend: string;
  marketingAdvice: string[];
}

interface CompetitorMarketingReport {
  id: number;
  name: string;
  stage: string;
  keyActions: Array<{ node: string; action: string; effect: string }>;
  strengths: string[];
  weaknesses: string[];
  userPraise: string[];
  userComplaints: string[];
  likelyNextMove: string;
  counterAdvice: string[];
}

interface HotspotItem {
  id: number;
  title: string;
  category: string;
  heat: string;
  duration: string;
  fitScene: string;
  fitGames: string[];
  ideas: Array<{ title: string; execution: string; expected: string }>;
  copyAssets: string[];
  scriptIdeas: string[];
  risks: string[];
}

interface SentimentInsight {
  id: number;
  topic: string;
  severity: "高" | "中" | "低";
  impact: string;
  trigger: string;
  responseTemplate: string;
  weeklySummary: string;
  monthlyAdvice: string[];
}

interface MarketingArchiveItem {
  id: number;
  title: string;
  type: string;
  scene: string;
  node: string;
  highlight: string[];
  weaknesses: string[];
  reusable: string[];
  avoid: string[];
  adaptation: string[];
  metrics: Array<{ label: string; value: string }>;
}

interface MarketingResearchReportSection {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
}

interface MarketingResearchReport {
  version: "marketing-research-v1";
  title: string;
  projectName: string;
  gameName: string;
  projectType: string;
  usage: string;
  projectFocus: string;
  briefSummary: string;
  generatedNote: string;
  sections: MarketingResearchReportSection[];
  finalDirection: string[];
}

const projectsSeed = importedProjectsSeed as Project[];
const resourcesSeed = importedResourcesSeed as Resource[];

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

function readStoredAiConfig(key: string): BriefApiConfig | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BriefApiConfig>;
    if (!parsed.endpoint && !parsed.apiKey && !parsed.model) return null;
    return {
      endpoint: parsed.endpoint ?? "",
      apiKey: parsed.apiKey ?? "",
      model: parsed.model ?? "",
    };
  } catch {
    return null;
  }
}

function useGlobalAiConfig() {
  return usePersistentState<BriefApiConfig>(globalAiConfigKey, defaultAiConfig);
}

function useMigratedGlobalAiConfig() {
  const [apiConfig, setApiConfig] = useGlobalAiConfig();

  useEffect(() => {
    if (apiConfig.endpoint || apiConfig.apiKey || apiConfig.model) return;
    const legacyKeys = [
      "strategy-center-brief-api-config",
      "strategy-center-marketing-brief-api-config",
      "strategy-center-script-api-config",
      "strategy-center-marketing-research-api-config",
    ];
    const legacyConfig = legacyKeys.map(readStoredAiConfig).find((config): config is BriefApiConfig => Boolean(config));
    if (legacyConfig) setApiConfig(legacyConfig);
  }, [apiConfig.apiKey, apiConfig.endpoint, apiConfig.model, setApiConfig]);

  return [apiConfig, setApiConfig] as const;
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

function summarize(text: string, maxLength = 92) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "暂无内容摘要，请补充资料正文或备注。";
  return compact.length > maxLength ? `${compact.slice(0, maxLength)}...` : compact;
}

function includesQuery(values: Array<string | number | undefined | null | string[]>, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  return values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((value): value is string | number => value !== undefined && value !== null)
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
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

function buildMarketingBriefInputPackage(form: { projectName: string; gameName: string; projectType: string; marketingGoal: string; forbidden: string; brief: string }, files: BriefInputFile[]) {
  const fileSections = files.map((file, index) => `## ${index + 1}. ${classifyBriefFile(file.name, file.content)}：${file.name}
解析状态：${file.parseStatus}${file.parseError ? `（${file.parseError}）` : ""}
摘要：${file.summary}
正文：
${file.content || "暂无可解析正文"}`);
  return `本次营销调研 Brief 输入包：
项目名称：${form.projectName || "未命名项目"}
游戏名称：${form.gameName || "未填写"}
项目类型：${form.projectType || "未填写"}
营销目标/场景：${form.marketingGoal || "未填写"}
禁忌/限制：${form.forbidden || "暂无"}

手动补充 Brief / 沟通记录：
${form.brief || "暂无"}

上传文件解析内容：
${fileSections.length ? fileSections.join("\n\n") : "暂无上传文件"}`;
}

function resourceToInputFile(resource: Resource): BriefInputFile {
  return {
    id: resource.id,
    name: resource.title || resource.fileName || "资料库文件",
    fileSize: resource.fileSize,
    mimeType: resource.mimeType,
    parseStatus: resource.parseStatus === "失败" ? "失败" : "成功",
    parseError: resource.parseError,
    summary: resource.summary || summarize(resource.content || ""),
    content: resource.content || resource.summary || "",
    structuredContent: resource.structuredContent,
  };
}

function buildResourceContext(resources: Resource[]) {
  if (!resources.length) return "未选择资料库文件。";
  return resources.map((resource, index) => `## 资料库引用 ${index + 1}：${resource.title}
类型：${resource.type || "未分类"}
标签：${resource.tags?.join(" / ") || "无"}
摘要：${resource.summary || "无"}
正文摘录：
${summarize(resource.content || resource.summary || "", 1200)}`).join("\n\n");
}

function scoreResource(resource: Resource, context: string) {
  const source = `${resource.title} ${resource.type} ${resource.summary} ${resource.content} ${(resource.tags || []).join(" ")}`.toLowerCase();
  const keywords = Array.from(new Set(context.toLowerCase().match(/[\u4e00-\u9fa5a-z0-9]{2,}/g) || []));
  const keywordScore = keywords.slice(0, 80).reduce((score, keyword) => score + (source.includes(keyword) ? 1 : 0), 0);
  const typeBoost = /方案|竞品|复盘|brief|qa|调研|案例/i.test(resource.type) ? 3 : 0;
  const tagBoost = (resource.tags || []).some((tag) => context.includes(tag)) ? 2 : 0;
  return keywordScore + typeBoost + tagBoost;
}

function missingMarketingInputs(form: { projectName: string; gameName: string; projectType: string; marketingGoal: string; forbidden: string; brief: string }, hasBriefBreakdown: boolean, fixedDoneCount: number, selectedVariableCount: number, linkedResourceCount: number) {
  const missing = [
    !form.projectName.trim() && "项目名称",
    !form.gameName.trim() && "游戏名称",
    !form.marketingGoal.trim() && "营销目标 / 场景",
    !form.forbidden.trim() && "预算、时间、素材或品牌红线",
    !form.brief.trim() && !hasBriefBreakdown && "客户 Brief 正文或沟通记录",
    linkedResourceCount === 0 && "历史方案 / 竞品资料 / 复盘报告",
    fixedDoneCount === 0 && "至少 1 个固定模块分析",
    selectedVariableCount === 0 && "按客户需求选择可变模块",
  ].filter(Boolean) as string[];
  return missing.slice(0, 8);
}

function downloadMarkdown(filename: string, title: string, content: string) {
  downloadText(filename, `# ${title}\n\n${content || "暂无内容"}`, "text/markdown;charset=utf-8");
}

function buildMarketingBriefPrompt(inputPackage: string) {
  return `你是资深游戏营销前期调研负责人。请以专业策划人员身份拆解本次 Brief，用于后续“跑固定模块、选可变模块、形成输出”的调研工作台。

你必须输出以下结构：
一、Brief 一句话判断
- 用一句话说明这次客户真正想解决什么问题。

二、需求拆解表
- 核心需求：列出 1-3 条，例如提升游戏转化、强化品牌认知、促进老玩家回流。每条标注优先级 P0/P1/P2、依据、对调研的影响。
- 次要需求：列出 1-3 条，例如优化用户口碑、拓展年轻用户、提升社群讨论。
- 隐性需求：列出 1-3 条，例如客户希望方案有创新性、可落地性强、能规避舆情、能讲清 ROI。

三、约束条件
- 预算限制
- 时间限制
- 资源限制
- 合规/品牌/舆情限制
- 不确定或需客户确认的信息

四、调研优先级建议
- 固定模块中哪些必须重点跑，哪些可用已有资料覆盖。
- 可变模块建议选择哪一个或哪几个场景，原因是什么。
- 哪些信息会影响后续策略判断，必须优先补齐。

五、下一步执行清单
- 按“先做什么、用什么资料、输出什么判断”的方式列 5-8 条。

规则：
1. 不要编造客户没有说过的事实；可以标注“基于输入推断”。
2. 必须区分明确需求、推断需求、待确认事项。
3. 输出要短、准、可执行，避免空泛营销术语。
4. 如 Brief 信息不足，要明确告诉用户还缺什么。

${inputPackage}`;
}

function buildLocalMarketingBriefBreakdown(form: { projectName: string; gameName: string; projectType: string; marketingGoal: string; forbidden: string; brief: string }, files: BriefInputFile[]) {
  const combined = `${form.projectName} ${form.gameName} ${form.projectType} ${form.marketingGoal} ${form.forbidden} ${form.brief} ${files.map((file) => `${file.name} ${file.summary} ${file.content}`).join("\n")}`;
  const hasConversion = /转化|拉新|新增|预约|下载|注册|回流|付费|购买|留存/.test(combined);
  const hasBrand = /品牌|认知|声量|曝光|破圈|出圈|影响力/.test(combined);
  const hasReputation = /口碑|舆情|评价|负面|社区|玩家情绪|吐槽/.test(combined);
  const hasYoung = /年轻|Z世代|学生|小红书|抖音|B站|二创|UGC/.test(combined);
  const hasBudget = /预算|费用|成本|报价|金额|ROI|投放/.test(combined);
  const hasTime = /时间|节点|周期|上线|发布|截止|提案|讲标|预热/.test(combined);
  const scenario =
    variableResearchScenarios.find((item) => /联动|品牌/.test(combined) && item.scene.includes("联动")) ??
    variableResearchScenarios.find((item) => /皮肤|道具|付费|定价/.test(combined) && item.scene.includes("皮肤")) ??
    variableResearchScenarios.find((item) => /版本|角色|更新|回流/.test(combined) && item.scene.includes("版本")) ??
    variableResearchScenarios.find((item) => /线下|展会|城市|快闪|破圈/.test(combined) && item.scene.includes("破圈")) ??
    variableResearchScenarios.find((item) => /UGC|二创|攻略|表情包|创作/.test(combined) && item.scene.includes("UGC")) ??
    variableResearchScenarios[0];
  const coreNeeds = [
    hasConversion ? "提升游戏转化或关键节点转化效率" : "",
    hasBrand ? "强化品牌认知与项目声量" : "",
    /回流|老玩家|留存/.test(combined) ? "促进老玩家回流与留存" : "",
  ].filter(Boolean);
  const secondaryNeeds = [
    hasReputation ? "优化用户口碑与社区讨论氛围" : "",
    hasYoung ? "拓展年轻用户或内容平台触点" : "",
    "提升内容传播效率，形成可复用素材方向",
  ].filter(Boolean);

  return `一、Brief 一句话判断
- ${form.projectName || form.gameName || "本次项目"}需要围绕“${form.marketingGoal || summarize(combined)}”完成前期调研，先确认用户、产品、文化和竞品底盘，再按“${scenario.scene}”增补场景调研。

二、需求拆解表
核心需求：
${(coreNeeds.length ? coreNeeds : ["明确本次营销项目的主目标与转化路径"]).map((item, index) => `- P${index}｜${item}｜依据：${hasConversion || hasBrand ? "Brief/补充信息中出现相关目标词" : "当前输入较少，基于项目类型推断"}｜调研影响：优先决定用户分层、卖点排序和渠道选择。`).join("\n")}

次要需求：
${secondaryNeeds.slice(0, 3).map((item, index) => `- P${index + 1}｜${item}｜依据：${hasReputation || hasYoung ? "输入中出现口碑/年轻用户/内容平台相关信号" : "营销项目常规配套需求"}。`).join("\n")}

隐性需求：
- P1｜方案要有创新性，不能只是常规投放堆砌｜依据：营销提案通常需要可讲的新抓手｜调研影响：需要补充黑话文化、热点形式、竞品翻车与成功案例。
- P1｜方案要可落地，能解释资源、时间和风险｜依据：客户通常会追问执行可行性｜调研影响：必须标注预算、节点、素材、渠道和合规约束。
- P2｜需要降低舆情和玩家反感风险｜依据：游戏营销容易受社区情绪影响｜调研影响：必须跑禁忌词、敏感话题和竞品翻车案例。

三、约束条件
- 预算限制：${hasBudget ? "Brief 中出现预算/成本/ROI 线索，需进一步拆具体金额和投放口径。" : "未明确，需客户确认预算区间和报价口径。"}
- 时间限制：${hasTime ? "Brief 中出现节点/上线/提案等时间线索，需整理关键截止日期。" : "未明确，需客户确认提案、预热、上线和复盘节点。"}
- 资源限制：需确认可用素材、IP 授权、达人/KOL、渠道资源、线下资源。
- 合规/品牌/舆情限制：${form.forbidden || "需确认禁忌表达、广告标注、未成年人保护、品牌调性和社群敏感点。"}
- 待确认信息：核心 KPI、预算、素材授权、审核流程、竞品范围、交付物格式。

四、调研优先级建议
- 固定模块重点：用户深度调查、游戏黑话与文化手册、产品自身调研必须先跑；竞品与行业动态用于校准打法风险。
- 可变模块建议：优先选择“${scenario.scene}”，原因是它最接近当前输入中的营销场景或需求表达。
- 优先补齐：目标用户证据、转化/KPI 口径、预算与时间节点、禁忌表达、可用素材和渠道资源。

五、下一步执行清单
1. 整理 Brief 中的明确目标、KPI、时间节点和交付物。
2. 按用户深度调查模板补用户分层、动机、内容偏好和渠道触点。
3. 建黑话与文化手册，先标出玩家称谓、梗、禁忌词和敏感话题。
4. 拆产品卖点和当前版本主题感，形成可传播卖点优先级。
5. 拉近 3 个月同赛道新品、竞品动作和翻车案例。
6. 按“${scenario.scene}”补充可变模块问题：${scenario.questions.slice(0, 2).join("；")}。
7. 把缺失信息整理成客户确认 QA，优先问预算、节点、授权、合规和 KPI。`;
}

function buildFixedModuleAnalysisPrompt(module: StandardResearchModule, briefContext: string, form: { projectName: string; gameName: string; projectType: string; marketingGoal: string; forbidden: string; brief: string }) {
  return `你是资深游戏营销前期调研专家。请基于上一步 Brief 拆解结果，对固定模块“${module.title}”进行深度分析。

项目基础信息：
项目名称：${form.projectName || "未填写"}
游戏名称：${form.gameName || "未填写"}
项目类型：${form.projectType || "未填写"}
营销目标/场景：${form.marketingGoal || "未填写"}
约束/禁忌：${form.forbidden || "暂无"}

上一步 Brief 拆解结果：
${briefContext || "暂无 Brief 拆解结果，请基于项目基础信息和手动 Brief 谨慎推断，并标注需补充数据。"}

当前模块标准要求：
模块目标：${module.goal}
标准输出：${module.output}
必分析问题：
${module.checklist.map((item) => `- ${item}`).join("\n")}

输出要求：
1. 不要复述框架说明，要直接生成“本次项目”的分析结论。
2. 对每个结论标明依据类型：Brief 明确 / 基于输入推断 / 需补充数据。
3. 结论必须服务本次营销需求，说明对内容、渠道、素材、风险或执行的影响。
4. 输出要可操作，避免泛泛描述。

请按以下结构输出：
一、模块核心结论
- 3-5 条最重要判断

二、逐项深度分析
- 严格覆盖当前模块的必分析问题
- 每项包含：结论 / 依据 / 对营销动作的影响 / 需补充数据

三、可直接进入方案的内容
- 可写进 PPT 的洞察句
- 可做成素材或活动的方向
- 需要规避的表达或动作

四、下一步补数清单
- 列出本模块继续推进前必须补齐的信息`;
}

function buildLocalFixedModuleAnalysis(module: StandardResearchModule, briefContext: string, form: { projectName: string; gameName: string; projectType: string; marketingGoal: string; forbidden: string; brief: string }) {
  const context = `${briefContext} ${form.projectName} ${form.gameName} ${form.projectType} ${form.marketingGoal} ${form.forbidden} ${form.brief}`;
  const scenario =
    variableResearchScenarios.find((item) => /联动|品牌/.test(context) && item.scene.includes("联动")) ??
    variableResearchScenarios.find((item) => /皮肤|道具|付费|定价/.test(context) && item.scene.includes("皮肤")) ??
    variableResearchScenarios.find((item) => /版本|角色|更新|回流/.test(context) && item.scene.includes("版本")) ??
    variableResearchScenarios.find((item) => /线下|展会|城市|快闪|破圈/.test(context) && item.scene.includes("破圈")) ??
    variableResearchScenarios.find((item) => /UGC|二创|攻略|表情包|创作/.test(context) && item.scene.includes("UGC")) ??
    variableResearchScenarios[0];
  const project = form.projectName || form.gameName || "本次项目";
  const moduleAdvice: Record<string, string[]> = {
    用户深度调查: [
      "优先把用户分成核心硬核、休闲活跃、轻度回流、新用户四类，分别判断转化阻力和内容钩子。",
      "如果目标包含拉新或转化，新用户和轻度回流用户的门槛、福利敏感度、内容平台偏好要优先补齐。",
      "传播触点建议先围绕抖音/B站/小红书/TapTap/社群做证据归集，不能只按经验选择渠道。",
    ],
    游戏黑话与文化手册: [
      "本模块重点不是罗列黑话，而是判断哪些表达能显得懂玩家，哪些表达会触发反感。",
      "需要优先收集玩家自称、常用缩略词、角色梗、剧情梗和官方曾经引发讨论的表达。",
      "如果涉及品牌联动、破圈或年轻用户拓展，外部表达要先过一遍社群语境，避免外行感。",
    ],
    游戏产品自身调研: [
      "先提炼当前版本主题感，再给核心卖点排序，避免把玩法、美术、剧情、社交、IP 优势平均用力。",
      "品宣态度需要按节点拆：预热负责建立期待，爆发负责强化理由，延续负责承接讨论和转化。",
      "所有卖点都要对应到用户动机，否则容易变成产品功能清单。",
    ],
    竞品与行业动态分析: [
      "近 3 个月竞品动作要同时看头部和新入局者，避免只复刻大厂打法。",
      "竞品翻车案例比成功案例更重要，能直接反推本次文案、活动机制和达人合作的雷区。",
      "政策合规需要提前进入调研结论，尤其是未成年人保护、广告标注、抽奖和付费表达。",
    ],
  };
  const advice = moduleAdvice[module.title] ?? module.checklist.slice(0, 3);
  return `一、模块核心结论
${advice.map((item) => `- ${item}｜依据：基于 Brief 拆解和“${scenario.scene}”场景推断。`).join("\n")}

二、逐项深度分析
${module.checklist.map((item, index) => `- ${item}
  结论：需要围绕“${project}”和“${form.marketingGoal || scenario.scene}”补充本项证据，判断它如何影响用户、内容或渠道选择。
  依据：${briefContext ? "Brief 拆解已提供项目需求上下文" : "当前 Brief 拆解不足，先按项目基础信息推断"}。
  对营销动作的影响：用于决定素材方向、平台选择、风险规避或执行优先级。
  需补充数据：评论样本、社区讨论、竞品案例、投放表现或客户确认信息。`).join("\n\n")}

三、可直接进入方案的内容
- 洞察句：${project} 的前期调研需要先把“用户为什么会被打动”和“什么表达会被反感”讲清楚。
- 素材/活动方向：围绕“${form.marketingGoal || scenario.scene}”制作 2-3 个内容钩子，并用用户反馈验证。
- 规避项：不要在没有证据时强行套用泛游戏用户画像，也不要忽略预算、节点、合规和社群敏感点。

四、下一步补数清单
- 补充玩家评论、社群讨论和平台热门内容样本。
- 补充客户过往投放类型、效果和禁忌表达。
- 补充同赛道近 3 个月竞品动作和翻车案例。
- 补充可用素材、上线节点、预算区间和审核限制。`;
}

function inferBriefFieldFromText(text: string, field: "projectName" | "gameName" | "projectType" | "marketingGoal") {
  const labelMap: Record<typeof field, string[]> = {
    projectName: ["项目名称", "项目", "活动名称", "方案名称"],
    gameName: ["游戏名称", "游戏", "产品名称", "产品"],
    projectType: ["项目类型", "营销类型", "项目场景", "类型"],
    marketingGoal: ["营销目标", "核心目标", "项目目标", "目标", "需求"],
  };
  for (const label of labelMap[field]) {
    const matched = text.match(new RegExp(`${label}[:：]\\s*([^\\n。；;]+)`));
    if (matched?.[1]) return matched[1].trim().slice(0, 80);
  }
  if (field === "projectType") {
    if (/联动|异业|品牌合作/.test(text)) return "异业品牌联动";
    if (/版本|更新|角色|回流/.test(text)) return "版本大更新 / 新角色上线";
    if (/皮肤|道具|付费|定价/.test(text)) return "贵价皮肤 / 稀有道具";
    if (/线下|展会|快闪|破圈/.test(text)) return "破圈事件 / 线下活动";
    if (/UGC|二创|攻略|表情包|创作/.test(text)) return "IP 衍生与 UGC 内容活动";
    if (/赛事|周年庆|发布会|直播盛典/.test(text)) return "大型营销事件";
  }
  if (field === "marketingGoal") {
    const goals = [
      /转化|拉新|预约|注册|下载/.test(text) ? "提升游戏转化" : "",
      /品牌|声量|曝光|认知/.test(text) ? "强化品牌认知" : "",
      /回流|留存|老玩家/.test(text) ? "促进老玩家回流" : "",
      /口碑|舆情|社区/.test(text) ? "优化用户口碑" : "",
    ].filter(Boolean);
    if (goals.length) return goals.join(" / ");
  }
  return "";
}

function buildVariableModuleAnalysisPrompt(scenarios: VariableResearchScenario[], briefContext: string, fixedOutputs: Record<string, string>, form: { projectName: string; gameName: string; projectType: string; marketingGoal: string; forbidden: string; brief: string }) {
  return `你是资深游戏营销调研专家。请基于 Brief 拆解结果和固定模块分析，对客户选择的可变增补模块进行深度分析。

项目基础信息：
项目名称：${form.projectName || "未识别"}
游戏名称：${form.gameName || "未识别"}
项目类型：${form.projectType || "未识别"}
营销目标：${form.marketingGoal || "未识别"}
约束/禁忌：${form.forbidden || "暂无"}

Brief 拆解结果：
${briefContext || "暂无"}

固定模块已有分析：
${Object.entries(fixedOutputs).map(([name, output]) => `【${name}】\n${summarize(output)}`).join("\n\n") || "暂无固定模块分析。"}

客户选择的可变模块：
${scenarios.map((scenario) => `【${scenario.scene}】
增补模块：${scenario.modules.join(" / ")}
关键问题：
${scenario.questions.map((item) => `- ${item}`).join("\n")}
标准输出：${scenario.output}`).join("\n\n")}

输出要求：
1. 只分析客户选择的可变模块，不要把全部场景都堆进去。
2. 每个场景必须结合本次 Brief 需求和前面固定模块结论。
3. 输出“适配判断、关键证据、建议打法、风险雷点、待补资料、可进入方案的结论”。
4. 不要编造事实；没有证据就标注需补充数据。`;
}

function buildFinalMarketingResearchReportPrompt({
  briefContext,
  fixedOutputs,
  variableOutputs,
  form,
}: {
  briefContext: string;
  fixedOutputs: Record<string, string>;
  variableOutputs: Record<string, string>;
  form: { projectName: string; gameName: string; projectType: string; marketingGoal: string; forbidden: string; brief: string };
}) {
  return `你是资深游戏营销调研负责人。请把前面所有模块结果整理成一份完整、可交付的“游戏营销前期调研报告”。

项目基础信息：
项目名称：${form.projectName || "未识别"}
游戏名称：${form.gameName || "未识别"}
项目类型：${form.projectType || "未识别"}
营销目标：${form.marketingGoal || "未识别"}
约束/禁忌：${form.forbidden || "暂无"}

Brief 拆解：
${briefContext || "暂无"}

固定模块分析：
${Object.entries(fixedOutputs).map(([name, output]) => `【${name}】\n${output}`).join("\n\n") || "暂无"}

可变模块分析：
${Object.entries(variableOutputs).map(([name, output]) => `【${name}】\n${output}`).join("\n\n") || "暂无"}

请输出以下结构：
一、项目需求总览
二、核心调研结论
三、固定模块结论
四、可变模块结论
五、营销机会与风险
六、可直接进入策略方案的建议
七、待补充数据与客户确认 QA

要求：语言短、准、可落地；每段都服务后续策略方案，不要写成资料堆砌。`;
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

function splitTokens(value: string) {
  return value
    .split(/[、，,\/|｜\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePageRange(value: string) {
  const matched = value.match(/(\d+)\s*[-~—至]+\s*(\d+)/);
  if (matched) {
    const min = Number(matched[1]);
    const max = Number(matched[2]);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      const lower = Math.min(min, max);
      const upper = Math.max(min, max);
      return { min: lower, max: upper, target: Math.round((lower + upper) / 2) };
    }
  }
  const single = Number(value.match(/\d+/)?.[0] || 12);
  return { min: single, max: single, target: single };
}

function extractBriefField(briefOutput: string, label: string) {
  const matched = briefOutput.match(new RegExp(`${label}[:：]\\s*([^\\n]+)`));
  return matched?.[1]?.trim() || "";
}

function inferProjectType(text: string) {
  if (text.includes("新品上线")) return "新品上线";
  if (text.includes("活动推广")) return "活动推广";
  if (text.includes("整合营销")) return "整合营销";
  if (text.includes("品牌") && text.includes("campaign")) return "品牌传播";
  if (text.includes("投标")) return "投标提案";
  return "游戏营销方案";
}

function inferUsage(text: string) {
  if (text.includes("投标")) return "投标";
  if (text.includes("讲标")) return "讲标";
  if (text.includes("比稿")) return "比稿";
  if (text.includes("内部汇报")) return "内部汇报";
  return "方案提案";
}

function inferVisualDirection(text: string, tone: string, preference: string) {
  const combined = `${text} ${tone} ${preference}`;
  if (combined.includes("篮球") || combined.includes("街球") || combined.includes("体育")) {
    return {
      style: "热血赛场动势风",
      keywords: ["动作定格", "黑金撞电光蓝", "计分牌数据卡", "斜切分镜"],
    };
  }
  if (combined.includes("二次元") || combined.includes("角色") || combined.includes("番")) {
    return {
      style: "高饱和角色海报风",
      keywords: ["角色立绘", "霓虹描边", "高对比渐变", "卡面式信息层"],
    };
  }
  if (combined.includes("女性向") || combined.includes("恋爱") || combined.includes("剧情")) {
    return {
      style: "情绪氛围叙事风",
      keywords: ["柔光立绘", "留白排版", "长条信息卡", "情绪色分层"],
    };
  }
  if (combined.includes("科幻") || combined.includes("未来") || combined.includes("机甲")) {
    return {
      style: "未来界面 HUD 风",
      keywords: ["深色宇宙背景", "能量线框", "模块化悬浮面板", "发光数据图层"],
    };
  }
  return {
    style: "游戏 KV 沉浸提案风",
    keywords: ["游戏原画大底", "半透明内容卡", "重点结论标签", "图标辅助数据"],
  };
}

function normalizeModules(modules: string) {
  const mapped = splitTokens(modules).map((item) => {
    if (item.includes("背景") || item.includes("需求")) return "背景";
    if (item.includes("洞察") || item.includes("市场") || item.includes("用户") || item.includes("竞品")) return "洞察";
    if (item.includes("策略")) return "策略";
    if (item.includes("创意") || item.includes("传播")) return "创意";
    if (item.includes("执行") || item.includes("落地") || item.includes("资源")) return "执行";
    if (item.includes("预算")) return "预算";
    if (item.includes("排期") || item.includes("节奏") || item.includes("时间")) return "排期";
    if (item.includes("风险") || item.includes("预案")) return "风险";
    return item;
  });
  return Array.from(new Set(mapped));
}

function createTemplateSlide(config: TemplateSlide): TemplateSlide {
  return config;
}

function buildTemplatePlan(
  form: { tone: string; pageRange: string; modules: string; preference: string },
  briefOutput: string,
  resources: Resource[],
) {
  const projectType = extractBriefField(briefOutput, "项目类型") || inferProjectType(briefOutput);
  const usage = extractBriefField(briefOutput, "方案用途") || inferUsage(briefOutput);
  const gameName = extractBriefField(briefOutput, "游戏") || extractBriefField(briefOutput, "游戏名称") || "目标游戏";
  const { style, keywords } = inferVisualDirection(`${gameName} ${briefOutput}`, form.tone, form.preference);
  const modules = normalizeModules(form.modules);
  const targetRange = parsePageRange(form.pageRange);
  const referenceAssets = resources.slice(0, 4).map((resource) => resource.title);
  const keyNeed = briefOutput ? summarize(briefOutput) : `围绕 ${gameName} 输出清晰、好讲、能落地的方案模板。`;
  const slides: TemplateSlide[] = [
    createTemplateSlide({
      id: "cover",
      module: "封面",
      title: `${gameName} ${projectType}方案封面`,
      objective: "用一句提案主张 + 游戏视觉第一时间建立专业感和风格统一。",
      editableBlocks: ["主标题", "副标题/一句话主张", "提案时间与团队署名", "游戏 KV 主视觉位"],
      layoutTips: ["标题放左上或中上，确保 3 秒内读完。", "主视觉占页面 60%-70%，文字只保留最关键的信息。", "底部预留客户名称、提案阶段、版本号等编辑位。"],
      visualTips: [`使用${style}，首页直接上游戏主画面或角色群像。`, `关键词建议：${keywords.join("、")}。`, "标题区增加细线、角标或徽章强化提案质感。"],
      contentPrompts: [`一句话写清本次方案要解决的业务目标。`, `副标题补充项目类型、阶段或核心卖点，如“暑期版本整合营销提案”。`, "封面不要堆信息，只保留客户最在意的提案身份。"],
      highlightTips: ["封面重点不是介绍自己，而是让客户立刻感知项目调性和方案方向。"],
    }),
    createTemplateSlide({
      id: "contents",
      module: "目录",
      title: "目录与提案路径",
      objective: "让客户提前知道整份 PPT 的推进顺序，降低理解成本。",
      editableBlocks: ["章节列表", "章节编号", "每章一句目标说明"],
      layoutTips: ["左侧放章节编号，右侧放章节名和一句简短说明。", "目录尽量控制在 6-8 个一级章节，避免过细。", "当前讲解章节可用高亮色或图标标记。"],
      visualTips: ["目录页背景适度弱化，可使用模糊化游戏场景图。", "用章节图标辅助识别：洞察、策略、创意、执行、预算分别用不同小图形。"],
      contentPrompts: ["目录要与后续真实页序一致，便于讲标时来回跳转。", "每章描述尽量以客户价值表达，如“先看机会，再看打法，再看落地”。"],
      highlightTips: ["目录页重点是清晰，不要在这里堆砌创意文案。"],
    }),
  ];

  const moduleSlideMap: Record<string, TemplateSlide[]> = {
    背景: [
      createTemplateSlide({
        id: "context",
        module: "背景",
        title: "项目背景与需求定义",
        objective: "用一页讲清项目现状、目标和本次提案边界。",
        editableBlocks: ["项目现状 3 点", "核心目标 2-3 点", "本次提案范围", "已知限制条件"],
        layoutTips: ["建议 4:6 左右分栏，左边写背景，右边写目标/挑战。", "顶部放一句核心结论，正文区用 3-4 张信息卡展开。", "复杂背景不要长段落，改成时间节点或要点列表。"],
        visualTips: ["背景图可用游戏世界观场景、版本 KV 或运营节点海报。", "挑战项用警示色标签点出，目标项用高亮数字或勾选图标强化。"],
        contentPrompts: ["项目背景页：简要说明游戏现状、市场环境、项目初衷。", `把“${keyNeed}”拆成客户明确说过的需求与我们推断出的重点。`, "补充客户已有资源、排竞限制、节点时间等关键信息。"],
        highlightTips: ["这一页要让后面的策略“有来由”，不要只写事实，不写问题。"],
      }),
    ],
    洞察: [
      createTemplateSlide({
        id: "insight-market",
        module: "洞察",
        title: "市场与用户洞察",
        objective: "证明为什么现在值得做、为什么要这样做。",
        editableBlocks: ["市场趋势 2-3 条", "目标用户画像", "用户痛点/兴趣点", "可引用的数据或访谈观点"],
        layoutTips: ["建议顶部一句结论，下面做三栏：市场、用户、机会。", "数据尽量图表化，避免整页文字。", "如果数据较少，可用“观察 + 推论 + 对应策略含义”的格式。"],
        visualTips: ["数据展示优先卡片、条形图、关键词云，不要使用密集表格。", "可以加入角色头像、圈层标签、场景截图强化用户具象感。"],
        contentPrompts: ["市场洞察页：说明赛道热度、玩家关注点、竞品动作带来的机会窗口。", "用户洞察页：写清目标玩家是谁、被什么打动、在什么场景容易传播。", "若无现成数据，至少给出基于资料库或经验的结构化判断。"],
        highlightTips: ["洞察页重点是产出结论，不是把调研素材原样搬上来。"],
      }),
      createTemplateSlide({
        id: "insight-competition",
        module: "洞察",
        title: "竞品格局与机会切口",
        objective: "帮助客户理解我们要避开什么、抢什么、差异化放在哪里。",
        editableBlocks: ["竞品列表", "对比维度", "机会切口", "我方差异化结论"],
        layoutTips: ["推荐用 2x2 机会矩阵或 3 列竞品对比表。", "最右侧单独留出“我们的机会”总结区。", "对比维度控制在 4-5 个，避免过满。"],
        visualTips: ["竞品信息用统一卡片格式呈现，避免截图大小不一。", "机会结论区可加箭头、放大镜或雷达图样式强化决策感。"],
        contentPrompts: ["竞品页：说明主要对标对象、它们的传播打法、可借鉴点与避坑点。", "机会分析页：指出本项目最值得放大的卖点、人群或事件抓手。"],
        highlightTips: ["一定要得出“我们该怎么做”的结论，而不是停留在竞品事实罗列。"],
      }),
    ],
    策略: [
      createTemplateSlide({
        id: "strategy-core",
        module: "策略",
        title: "核心策略总览",
        objective: "把复杂方案压缩成一句总策略和 3 个支撑抓手。",
        editableBlocks: ["一句总策略", "策略支柱 3 项", "策略如何回应需求", "成效判断方式"],
        layoutTips: ["中间放一句大标题式策略结论，四周或下方拆三大抓手。", "每个抓手用“抓什么 + 为什么 + 怎么做”三行结构。", "尽量一页只讲一个核心逻辑。"],
        visualTips: ["可用中心辐射图、金字塔图或三段式结构图。", "策略支柱建议搭配游戏元素图标，如角色、赛事、社群、福利。"],
        contentPrompts: ["核心策略页：回答“我们为什么这样打”。", "每个策略抓手都要明确与客户目标、用户洞察之间的连接。", "若是投标场景，补一句这套策略为什么更适合该客户当前阶段。"],
        highlightTips: ["策略页要像“提案中心句”，讲完这一页客户就该知道整份方案的主脑。"],
      }),
      createTemplateSlide({
        id: "strategy-pillars",
        module: "策略",
        title: "策略抓手拆解",
        objective: "把核心策略进一步拆成可执行的传播/内容/资源打法。",
        editableBlocks: ["抓手名称", "执行动作", "承接节点", "预期作用"],
        layoutTips: ["一页 3-4 张抓手卡片，每张卡片对应一个动作模块。", "卡片之间要有清晰层级，可标注“主攻/辅助/兜底”。"],
        visualTips: ["使用流程箭头、步骤条或模块图来表现承接关系。", "不同抓手可用不同辅助色，但整体仍需维持统一模板风格。"],
        contentPrompts: ["把策略拆成客户能立刻理解的动作语言，如“先造势、再放大、再转化”。", "每个抓手都补一句落地方式，避免停留在概念层。"],
        highlightTips: ["优先突出主抓手，不要让所有动作看起来同等重要。"],
      }),
    ],
    创意: [
      createTemplateSlide({
        id: "creative-theme",
        module: "创意",
        title: "创意主题与视觉概念",
        objective: "把策略翻译成客户能感知的创意主题、主视觉和内容母题。",
        editableBlocks: ["创意主题名", "主题阐释", "主视觉灵感", "可延展口号/标签"],
        layoutTips: ["页面中心放主题口号，左右补充视觉概念和延展说明。", "主视觉图建议占比过半，文字保持短促。"],
        visualTips: ["大面积使用游戏画面、角色立绘、技能特效或场景图作为氛围底。", "把主题字做成接近 campaign key visual 的呈现，增强提案完成度。"],
        contentPrompts: ["创意主题页：说明为什么这个主题适合游戏、适合当下版本、适合目标玩家。", "列出 2-3 个可延展的传播关键词，便于后续内容统一。"],
        highlightTips: ["创意页要有记忆点，但不要牺牲可读性。主题解释一定要能落回业务目标。"],
      }),
      createTemplateSlide({
        id: "creative-play",
        module: "创意",
        title: "传播玩法与内容机制",
        objective: "把创意概念落到玩家会看到什么、会参与什么、会传播什么。",
        editableBlocks: ["玩法名称", "触发节点", "内容载体", "扩散机制", "预期效果"],
        layoutTips: ["推荐 3 列玩法卡片或一条传播节奏链路。", "如果玩法多，按“主事件 / 配套内容 / 长尾延展”分层。"],
        visualTips: ["玩法示意可以用 mockup、社媒信息流示意、活动页面框架图。", "核心数据或传播目标可搭配图标/数字块强化。"],
        contentPrompts: ["玩法页：说明每个传播动作服务于什么传播目的。", "补充适合的渠道阵地、达人/KOL 类型、UGC 触发方式。", "若涉及版本节点，可把玩法与节点并排展示。"],
        highlightTips: ["重点不是玩法数量，而是主玩法是否足够出圈且可执行。"],
      }),
    ],
    执行: [
      createTemplateSlide({
        id: "execution-plan",
        module: "执行",
        title: "执行规划与内容矩阵",
        objective: "说明团队将如何把策略和创意拆成实际执行动作。",
        editableBlocks: ["工作流模块", "阵地分工", "内容类型", "负责人/协同说明"],
        layoutTips: ["建议按渠道、内容、资源、协同四块排版。", "上半区讲内容矩阵，下半区讲执行协同会更清晰。"],
        visualTips: ["可加入平台图标、内容封面 mockup、流程箭头。", "用不同底色区分“主阵地 / 配合阵地 / 支撑资源”。"],
        contentPrompts: ["执行页：说明不同平台各自承担什么角色。", "内容矩阵页：按预热、爆发、延续三个阶段对应内容形式。", "若客户偏好务实风，这一页建议多给执行动作而少讲概念。"],
        highlightTips: ["执行规划要体现“有人做、做什么、什么时候做、如何协同”。"],
      }),
      createTemplateSlide({
        id: "execution-resource",
        module: "执行",
        title: "资源配置与协同机制",
        objective: "增强客户对落地能力和资源整合能力的信任。",
        editableBlocks: ["核心资源位", "内外部协同链路", "审批/回合节奏", "备选方案"],
        layoutTips: ["左边讲资源分层，右边讲协同流程。", "如果是投标，可单独留一块写供应商/团队优势。"],
        visualTips: ["用泳道图或流程条表示多团队协同。", "关键资源位可用徽章、标签和优先级色标识。"],
        contentPrompts: ["资源页：说明哪些资源必须拿到、哪些资源可作为加分项。", "协同页：写清客户、代理、设计、媒介、执行之间的交付节奏。"],
        highlightTips: ["这页重点是降低客户对执行失控的担心。"],
      }),
    ],
    预算: [
      createTemplateSlide({
        id: "budget",
        module: "预算",
        title: "预算拆分与效果预估",
        objective: "把钱花在哪里、为什么这么花、预期能带来什么说清楚。",
        editableBlocks: ["预算大类", "核心成本拆分", "投放/制作占比", "KPI 或 ROI 预估"],
        layoutTips: ["左侧用环图或堆叠柱图展示预算占比，右侧用表格补明细。", "预算页必须留足数字区域，减少大段说明文字。"],
        visualTips: ["预算类页面适合搭配简洁图标和高对比数字块，背景不宜过花。", "关键预算项可加色条或标签突出。"],
        contentPrompts: ["预算页需突出核心成本拆分，说明主要投入放在哪些环节。", "效果预估页：补充曝光、互动、转化或 CPM 等客户最关心指标。", "若无法给准数，可先给区间和测算逻辑。"],
        highlightTips: ["重点不是列全所有费用，而是解释投入逻辑和优先级。"],
      }),
    ],
    排期: [
      createTemplateSlide({
        id: "timeline",
        module: "排期",
        title: "项目排期与关键里程碑",
        objective: "让客户确认每一步在什么时候发生、哪些节点不能错过。",
        editableBlocks: ["时间轴", "里程碑", "版本/活动节点", "交付物说明"],
        layoutTips: ["建议使用横向时间轴或甘特图，节点不超过 7 个大段。", "重要节点单独加放大提示框，例如首曝、上线、周年庆、提案回合。"],
        visualTips: ["时间轴可结合游戏版本图标、节日符号、内容封面。", "关键节点用高亮色或发光边框，与普通节点区分。"],
        contentPrompts: ["排期页：简要说明每个阶段的目标、主要动作和交付结果。", "如果是版本传播，务必把版本节点和传播节点对齐展示。"],
        highlightTips: ["排期页重点是节奏感和可执行性，不要只给日期不给动作。"],
      }),
    ],
    风险: [
      createTemplateSlide({
        id: "risk",
        module: "风险",
        title: "风险预案与兜底机制",
        objective: "提前回答客户可能担心的舆情、执行、排期、资源和预算风险。",
        editableBlocks: ["风险类别", "触发场景", "应对动作", "负责人/备选方案"],
        layoutTips: ["推荐用两栏风险矩阵：左边风险，右边应对。", "也可以按高/中/低风险分层，避免所有风险同级。"],
        visualTips: ["风险页适合使用警示色角标，但整体不要过于压抑。", "每个风险项可配小图标帮助快速扫描。"],
        contentPrompts: ["风险页：列出最有可能被客户问到的 3-5 个风险点。", "应对措施尽量写成动作，而不是空泛态度。", "若存在资源未确认、节点紧张、竞品干扰等情况，要明确写出备选方案。"],
        highlightTips: ["重点不是展示风险多专业，而是让客户放心方案有兜底。"],
      }),
    ],
  };

  modules.forEach((module) => {
    slides.push(...(moduleSlideMap[module] || []));
  });

  const optionalSlides: TemplateSlide[] = [
    createTemplateSlide({
      id: "need-summary",
      module: "背景",
      title: "客户需求拆解与成功标准",
      objective: "把客户显性需求、隐性诉求和成功标准拆清楚。",
      editableBlocks: ["显性需求", "隐性诉求", "成功标准", "客户确认项"],
      layoutTips: ["左边列需求，右边列成功标准与待确认事项。", "使用“已知 / 推断 / 待确认”三段结构最清晰。"],
      visualTips: ["视觉尽量克制，以信息清晰为主，可加入勾选、问号、风险提示图标。"],
      contentPrompts: ["说明客户明确提出了什么、默认期待什么、还需要追问什么。", "这一页适合放在目录后，帮助客户快速对齐。"],
      highlightTips: ["特别适合投标和讲标场景，可减少客户会后补充问题。"],
    }),
    createTemplateSlide({
      id: "data-proof",
      module: "洞察",
      title: "数据验证与案例背书",
      objective: "用行业数据、过往案例或资料库内容提升方案可信度。",
      editableBlocks: ["数据来源", "案例摘要", "关键结论", "可复用启发"],
      layoutTips: ["左侧数据结论，右侧案例卡片或图表。", "控制案例数量在 2-3 个，重点说为什么相关。"],
      visualTips: ["案例页适合加封面缩略图、项目标签、结果数字。", "数据页用高对比数字卡强化可信度。"],
      contentPrompts: ["说明过往案例如何支撑当前提案判断。", "补充和本项目最相关的成功经验或避坑提醒。"],
      highlightTips: ["客户更关心“为什么这个案例对我有用”，不是案例数量。"],
    }),
    createTemplateSlide({
      id: "team",
      module: "执行",
      title: "团队配置与提案保障",
      objective: "补足客户对项目推进稳定性和协作质量的信心。",
      editableBlocks: ["项目核心成员", "分工说明", "协作机制", "响应承诺"],
      layoutTips: ["推荐头像/岗位卡片 + 协作流程图。", "重点成员不要超过 5 位，保持聚焦。"],
      visualTips: ["可加入岗位图标、职责标签、服务流程节点。", "整体风格保持专业稳健，避免花哨。"],
      contentPrompts: ["说明谁负责策略、谁负责创意、谁负责执行、谁对接客户。", "如果是投标，补充过往相关经验和快速响应机制。"],
      highlightTips: ["这页的价值在于“让客户放心把项目交给你”。"],
    }),
    createTemplateSlide({
      id: "appendix",
      module: "附录",
      title: "附录与备份页建议",
      objective: "预留讲标时可能临时被追问的内容，提升整套模板的可编辑性。",
      editableBlocks: ["可选备份页清单", "数据明细", "参考资料", "额外案例"],
      layoutTips: ["附录页尽量模板化，便于后续复制和替换内容。", "可以先给常见备份页目录，不一定全部展开。"],
      visualTips: ["附录页可弱化视觉装饰，重点保证信息模块整洁统一。"],
      contentPrompts: ["列出建议常备的备份页，如达人名单、预算明细、排竞说明、素材草图。", "提醒提案人根据客户偏好增删。"],
      highlightTips: ["附录不是凑页数，而是为现场问答留余量。"],
    }),
  ];

  const preferredOptional = optionalSlides.filter((slide) => {
    if (slide.id === "team") return usage.includes("投标") || usage.includes("讲标");
    if (slide.id === "data-proof") return form.preference.includes("数据") || form.preference.includes("案例");
    return true;
  });

  preferredOptional.forEach((slide) => {
    if (slides.length < targetRange.target) slides.push(slide);
  });

  if (slides.length > targetRange.max) {
    slides.splice(targetRange.max);
  }

  const optimizationSuggestions = [
    usage.includes("投标") || usage.includes("讲标")
      ? "投标/讲标类模板建议在前 3 页尽快给出结论、方法论和客户价值，不要把亮点压到后面。"
      : "方案开头建议先给结论和机会窗口，再进入洞察与拆解，减少纯背景铺垫。",
    form.preference.includes("老板") || form.preference.includes("高层")
      ? "如果客户偏高层决策视角，建议每页只保留 1 条核心结论，数据与案例做成大数字和短标签。"
      : "若客户偏执行落地视角，建议提高执行、资源、排期三类页面占比，让交付链路更清楚。",
    form.preference.includes("创意") || form.tone.includes("创意")
      ? "如果客户偏好创意感，建议增加全屏视觉页和主题页比例，但关键数据页仍保持简洁克制。"
      : "当前调性更偏专业稳健，建议用统一母版和信息卡层级来提升完成度，而不是堆视觉特效。",
    projectType.includes("新品上线")
      ? "新品上线类模板要重点强化“版本节点 - 内容事件 - 转化目标”的联动关系，尤其是预约、首发和回流逻辑。"
      : projectType.includes("活动")
        ? "活动推广类模板建议强化节点节奏、社交扩散和资源组合，避免策略页过多抽象概念。"
        : "整合营销类模板建议加强跨渠道协同、预算逻辑和效果预估，让方案更像真正可执行的 campaign blueprint。",
  ];

  return {
    version: "ppt-template-v1" as const,
    title: `${gameName} ${projectType}PPT模板`,
    projectType,
    usage,
    visualStyle: style,
    visualKeywords: keywords,
    storytelling: `建议按“需求背景 → 洞察机会 → 核心策略 → 创意表达 → 执行落地 → 预算排期 → 风险兜底”推进，确保客户先被说服，再被打动，最后被稳住。`,
    editableGuide: "每页统一预留：标题位、副标题位、1 句核心结论、主图/图表位、补充说明位、页脚备注位，方便后续直接替换和二次编辑。",
    optimizationSuggestions,
    referenceAssets,
    slides,
  };
}

function parseTemplatePlan(raw: string) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OutlineTemplatePlan;
    return parsed?.version === "ppt-template-v1" && Array.isArray(parsed.slides) ? parsed : null;
  } catch {
    return null;
  }
}

function parseContentAuditReport(raw: string) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ContentAuditReport;
    return parsed?.version === "content-audit-v1" && Array.isArray(parsed.sections) ? parsed : null;
  } catch {
    return null;
  }
}

function uniqueStrings(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function normalizeForMatch(text: string) {
  return String(text || "").toLowerCase().replace(/\s+/g, "");
}

function containsAny(text: string, keywords: string[]) {
  const source = normalizeForMatch(text);
  return keywords.some((keyword) => source.includes(normalizeForMatch(keyword)));
}

function sanitizeSectionTitle(raw: string, fallback: string) {
  const trimmed = raw.trim();
  const withoutPage = trimmed
    .replace(/^第?\s*\d+\s*页[:：.\-\s]*/i, "")
    .replace(/^p\s*\d+[:：.\-\s]*/i, "")
    .replace(/^#+\s*/, "")
    .trim();
  const cleaned = withoutPage.replace(/^【/, "").replace(/】$/, "").trim();
  return cleaned || fallback;
}

function inferAuditModule(text: string) {
  const rules = [
    { module: "封面", keywords: ["封面", "提案封面", "首页"] },
    { module: "目录", keywords: ["目录", "提案路径", "章节"] },
    { module: "背景", keywords: ["背景", "需求", "目标", "现状", "挑战", "成功标准"] },
    { module: "洞察", keywords: ["洞察", "市场", "用户", "竞品", "机会", "趋势", "案例"] },
    { module: "策略", keywords: ["策略", "主张", "打法", "路径", "抓手"] },
    { module: "创意", keywords: ["创意", "主题", "玩法", "内容机制", "传播玩法"] },
    { module: "执行", keywords: ["执行", "内容矩阵", "渠道", "资源", "协同"] },
    { module: "预算", keywords: ["预算", "费用", "成本", "投放", "roi", "cpm"] },
    { module: "排期", keywords: ["排期", "时间轴", "节点", "里程碑", "节奏"] },
    { module: "风险", keywords: ["风险", "预案", "兜底", "应对", "备选"] },
    { module: "附录", keywords: ["附录", "备份页", "补充"] },
  ];
  const matched = rules.find((rule) => containsAny(text, rule.keywords));
  return matched?.module || "其他";
}

function parseContentSections(content: string, templatePlan: OutlineTemplatePlan | null) {
  const normalized = content.replace(/\r/g, "").trim();
  if (!normalized) return [] as ParsedAuditSection[];

  let blocks = normalized
    .split(/\n(?=(?:第?\s*\d+\s*页|P\s*\d+|#|【|[一二三四五六七八九十]+、))/i)
    .map((item) => item.trim())
    .filter(Boolean);

  if (blocks.length <= 1) {
    blocks = normalized
      .split(/\n\s*\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return blocks.map((block, index) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    let titleLine = lines[0] || `第 ${index + 1} 部分`;
    let bodyLines = lines.slice(1);

    if (/^第?\s*\d+\s*页$/i.test(titleLine) && bodyLines[0]) {
      titleLine = bodyLines[0];
      bodyLines = bodyLines.slice(1);
    }

    const fallbackTitle = templatePlan?.slides[index]?.title || `第 ${index + 1} 部分`;
    const title = sanitizeSectionTitle(titleLine, fallbackTitle);
    const body = bodyLines.join("\n").trim() || block;
    const matchedSlide = templatePlan?.slides.find((slide) => {
      const normalizedTitle = normalizeForMatch(title);
      const normalizedSlideTitle = normalizeForMatch(slide.title);
      return normalizedTitle.includes(normalizedSlideTitle) || normalizedSlideTitle.includes(normalizedTitle);
    });
    const module = matchedSlide?.module || inferAuditModule(`${title}\n${body}`);
    return {
      id: `section-${index + 1}`,
      title,
      module,
      body,
      searchable: normalizeForMatch(`${title}\n${body}`),
    };
  });
}

function requirementAliasKeywords(requirement: string) {
  const base = [requirement];
  if (containsAny(requirement, ["海外", "出海", "国际"])) base.push("海外", "出海", "国际", "global", "东南亚", "欧美");
  if (containsAny(requirement, ["预算", "成本", "roi", "cpm"])) base.push("预算", "成本", "费用", "roi", "cpm", "投放占比");
  if (containsAny(requirement, ["拉新", "新增", "新用户", "预约"])) base.push("拉新", "新增", "新用户", "预约", "预注册", "转化");
  if (containsAny(requirement, ["品牌", "破圈", "声量"])) base.push("品牌", "破圈", "声量", "曝光", "传播");
  if (containsAny(requirement, ["达人", "kol", "koc"])) base.push("达人", "kol", "koc", "主播", "内容合作");
  if (containsAny(requirement, ["节点", "排期", "节奏"])) base.push("排期", "节点", "节奏", "时间轴", "里程碑");
  return uniqueStrings(base);
}

function inferAuditRequirements(briefOutput: string, mustInclude: string, templatePlan: OutlineTemplatePlan | null) {
  const explicit = splitTokens(mustInclude);
  const combined = `${briefOutput} ${templatePlan?.title || ""}`;
  const presets = [
    { label: "拓展海外市场", keywords: ["海外", "出海", "国际"] },
    { label: "突出预算拆分", keywords: ["预算", "成本", "费用", "cpm", "roi"] },
    { label: "强化拉新转化", keywords: ["拉新", "新增", "预约", "转化", "回流"] },
    { label: "放大品牌破圈", keywords: ["品牌", "破圈", "声量", "曝光"] },
    { label: "补足达人/KOL 策略", keywords: ["达人", "kol", "koc", "主播"] },
    { label: "明确项目节奏", keywords: ["排期", "节点", "节奏", "里程碑"] },
  ];
  const inferred = presets
    .filter((item) => item.keywords.some((keyword) => combined.includes(keyword) || explicit.some((value) => value.includes(keyword))))
    .map((item) => item.label);
  return uniqueStrings([...explicit, ...inferred]).slice(0, 8);
}

function requirementRelevantModules(requirement: string) {
  if (containsAny(requirement, ["预算", "成本", "roi", "cpm"])) return ["预算", "执行"];
  if (containsAny(requirement, ["海外", "出海", "国际"])) return ["洞察", "策略", "执行"];
  if (containsAny(requirement, ["达人", "kol", "koc"])) return ["创意", "执行", "预算"];
  if (containsAny(requirement, ["排期", "节点", "节奏"])) return ["执行", "排期"];
  return ["策略", "执行"];
}

function makeAuditFinding(
  sectionId: string,
  severity: AuditSeverity,
  category: AuditCategory,
  issue: string,
  detail: string,
  suggestion: string,
) {
  return {
    id: `${sectionId}-${severity}-${category}-${issue}`,
    severity,
    category,
    issue,
    detail,
    suggestion,
  } satisfies AuditFinding;
}

function sectionStatus(findings: AuditFinding[]) {
  if (findings.some((item) => item.severity === "严重问题")) return "高风险";
  if (findings.some((item) => item.severity === "一般问题")) return "需调整";
  if (findings.some((item) => item.severity === "优化建议")) return "可优化";
  return "通过";
}

function auditStatusTone(status: AuditSectionReport["status"]) {
  if (status === "高风险") return "danger";
  if (status === "需调整") return "warning";
  if (status === "可优化") return "suggestion";
  return "success";
}

function auditSeverityTone(severity: AuditSeverity) {
  if (severity === "严重问题") return "danger";
  if (severity === "一般问题") return "warning";
  return "suggestion";
}

function sectionSummary(title: string, findings: AuditFinding[]) {
  if (!findings.length) return `${title} 当前结构完整，未发现明显缺项。`;
  const severe = findings.filter((item) => item.severity === "严重问题").length;
  const general = findings.filter((item) => item.severity === "一般问题").length;
  const suggestion = findings.filter((item) => item.severity === "优化建议").length;
  return `发现 ${severe} 个严重问题、${general} 个一般问题、${suggestion} 条优化建议。`;
}

function percentageSum(text: string) {
  const matches = Array.from(text.matchAll(/(\d+(?:\.\d+)?)\s*%/g)).map((item) => Number(item[1]));
  return matches.length >= 3 ? matches.reduce((total, value) => total + value, 0) : undefined;
}

function analyzeSection(section: ParsedAuditSection, requirements: string[]) {
  const findings: AuditFinding[] = [];
  const text = section.body;
  const keyRequirements = requirements.flatMap((item) => requirementAliasKeywords(item));

  if (text.trim().length < 60) {
    findings.push(
      makeAuditFinding(section.id, "优化建议", "表达完整性", "页面内容偏少", "当前页面文案较薄，可能无法支撑讲标或内部评审。", "建议至少补足核心结论、关键论据和执行说明三层信息。"),
    );
  }

  switch (section.module) {
    case "背景":
      if (!containsAny(text, ["背景", "现状", "目标", "挑战", "需求", "机会"])) {
        findings.push(
          makeAuditFinding(section.id, "一般问题", "结构完整性", "背景页信息不完整", "未明显说明项目现状、目标或挑战，后续策略缺少起点。", "建议补上“现状 - 问题 - 本次目标”三段式结构。"),
        );
      }
      break;
    case "洞察":
      if (!containsAny(text, ["用户", "市场", "竞品", "趋势", "数据", "洞察"])) {
        findings.push(
          makeAuditFinding(section.id, "一般问题", "需求匹配度", "洞察支撑不足", "页面没有清晰呈现用户、市场或竞品依据，洞察结论说服力偏弱。", "建议补充至少一组用户观察、一组市场/竞品判断，并写出对应结论。"),
        );
      }
      if (/\d/.test(text) && !containsAny(text, ["来源", "口径", "统计", "截至"])) {
        findings.push(
          makeAuditFinding(section.id, "优化建议", "数据准确性", "数据缺少来源或口径", "页面包含数字判断，但没有标注来源、统计时间或口径。", "建议在页脚或数据块旁补充来源、统计周期和单位。"),
        );
      }
      break;
    case "策略":
      if (!containsAny(text, ["策略", "主张", "方向", "打法", "抓手"])) {
        findings.push(
          makeAuditFinding(section.id, "一般问题", "结构完整性", "策略页缺少清晰主张", "页面未形成一句总策略或明确的策略抓手。", "建议先给一句总策略，再拆 2-3 个支柱动作。"),
        );
      }
      if (keyRequirements.length && !containsAny(text, keyRequirements)) {
        findings.push(
          makeAuditFinding(section.id, "严重问题", "需求匹配度", "策略未回应核心需求", "当前策略表述没有明显承接客户重点诉求，容易出现“说了很多但没答题”。", "建议在策略标题或抓手描述中直接回应客户最关心的需求点。"),
        );
      }
      break;
    case "创意":
      if (!containsAny(text, ["创意", "主题", "玩法", "内容", "传播"])) {
        findings.push(
          makeAuditFinding(section.id, "一般问题", "结构完整性", "创意页缺少玩法描述", "页面没有说明核心创意主题或传播玩法，创意层显得空泛。", "建议补足主题命名、内容母题和玩法落地方式。"),
        );
      }
      break;
    case "执行":
      if (!containsAny(text, ["执行", "渠道", "投放", "资源", "动作", "内容矩阵"])) {
        findings.push(
          makeAuditFinding(section.id, "严重问题", "逻辑连贯性", "执行计划与目标脱节", "页面没有落到渠道、资源、动作或协同方式，难以证明策略可以落地。", "建议按“阶段 - 渠道 - 动作 - 负责人”补齐执行链路。"),
        );
      }
      if (keyRequirements.length && !containsAny(text, keyRequirements)) {
        findings.push(
          makeAuditFinding(section.id, "一般问题", "逻辑连贯性", "执行内容没有承接重点需求", "执行动作与客户重点诉求之间的连接不明显。", "建议把关键需求词直接映射到执行阶段、渠道和资源配置中。"),
        );
      }
      if (!containsAny(text, ["阶段", "时间", "节点", "预热", "爆发", "延续", "上线"])) {
        findings.push(
          makeAuditFinding(section.id, "优化建议", "结构完整性", "执行节奏描述偏弱", "页面提到了执行动作，但缺少阶段感和节奏安排。", "建议增加预热、爆发、延续或版本节点的拆分。"),
        );
      }
      break;
    case "预算":
      if (!/\d/.test(text)) {
        findings.push(
          makeAuditFinding(section.id, "严重问题", "数据准确性", "预算页缺少关键数字", "预算页面没有数字或费用区间，无法支撑投入判断。", "建议至少补充总预算、核心成本拆分和重点费用占比。"),
        );
      }
      if (/\d/.test(text) && !containsAny(text, ["元", "万", "%", "预算", "费用", "成本"])) {
        findings.push(
          makeAuditFinding(section.id, "一般问题", "数据准确性", "数字缺少单位或业务含义", "页面出现数字，但没有说明单位、预算项或指标含义。", "建议统一补充金额单位、比例单位和对应预算项名称。"),
        );
      }
      {
        const total = percentageSum(text);
        if (typeof total === "number" && (total < 90 || total > 110)) {
          findings.push(
            makeAuditFinding(section.id, "一般问题", "数据准确性", "预算比例加总异常", `当前页面多项百分比相加约为 ${Math.round(total)}%，可能存在拆分口径不一致。`, "建议核对占比口径，确保同一组预算比例总和接近 100%。"),
          );
        }
      }
      break;
    case "排期":
      if (!containsAny(text, ["排期", "节点", "里程碑", "时间", "阶段"])) {
        findings.push(
          makeAuditFinding(section.id, "一般问题", "结构完整性", "排期页缺少时间节点", "页面没有清晰给出关键时间点或里程碑。", "建议用时间轴或阶段表明确关键节点和交付物。"),
        );
      }
      if (!/(\d{1,2}[月\-\/]\d{1,2}|q[1-4]|上旬|中旬|下旬|周)/i.test(text)) {
        findings.push(
          makeAuditFinding(section.id, "优化建议", "数据准确性", "时间表达不够具体", "排期页描述偏抽象，缺少明确日期或周期。", "建议补充月份、版本日期或周次，让客户更容易判断可执行性。"),
        );
      }
      break;
    case "风险":
      if (!containsAny(text, ["风险", "预案", "应对", "备选", "兜底"])) {
        findings.push(
          makeAuditFinding(section.id, "一般问题", "结构完整性", "风险页缺少应对动作", "页面没有把风险和应对措施成对写清楚。", "建议按“风险场景 - 触发条件 - 应对动作 - 负责人”展开。"),
        );
      }
      break;
    default:
      break;
  }

  return {
    id: section.id,
    title: section.title,
    module: section.module,
    status: sectionStatus(findings),
    summary: sectionSummary(section.title, findings),
    findings,
  } satisfies AuditSectionReport;
}

function analyzeGlobalFindings(sections: ParsedAuditSection[], requirements: string[], templatePlan: OutlineTemplatePlan | null) {
  const findings: AuditFinding[] = [];
  const modules = new Set(sections.map((section) => section.module));
  const expectedModules = uniqueStrings((templatePlan?.slides || []).map((slide) => slide.module)).filter((module) => !["封面", "目录", "附录"].includes(module));

  expectedModules.forEach((module) => {
    if (!modules.has(module)) {
      findings.push(
        makeAuditFinding(
          "global",
          module === "策略" || module === "执行" || module === "预算" ? "严重问题" : "一般问题",
          "结构完整性",
          `缺少“${module}”模块`,
          `当前待检查内容里没有明确出现“${module}”相关页面或模块。`,
          `建议补上“${module}”模块，避免提案链路断层。`,
        ),
      );
    }
  });

  requirements.forEach((requirement) => {
    const aliases = requirementAliasKeywords(requirement);
    const matchedSections = sections.filter((section) => aliases.some((keyword) => section.searchable.includes(normalizeForMatch(keyword))));
    if (!matchedSections.length) {
      findings.push(
        makeAuditFinding(
          "global",
          "严重问题",
          "需求匹配度",
          `未体现客户提出的“${requirement}”需求`,
          `逐页检查后，没有发现页面明确承接“${requirement}”相关内容。`,
          `建议在背景、策略或执行相关页面直接加入“${requirement}”的目标、动作和衡量方式。`,
        ),
      );
      return;
    }

    const relevantModules = requirementRelevantModules(requirement);
    const coveredRelevantModule = matchedSections.some((section) => relevantModules.includes(section.module));
    if (!coveredRelevantModule) {
      findings.push(
        makeAuditFinding(
          "global",
          "一般问题",
          "逻辑连贯性",
          `“${requirement}”未落实到关键模块`,
          `当前仅在部分页面提到“${requirement}”，但没有落实到 ${relevantModules.join("、")} 等关键模块。`,
          `建议在 ${relevantModules.join("、")} 页面补充针对“${requirement}”的具体策略或动作。`,
        ),
      );
    }
  });

  return findings;
}

function buildOverallSuggestions(reportSections: AuditSectionReport[]) {
  const allFindings = reportSections.flatMap((section) => section.findings);
  const suggestions: string[] = [];
  if (allFindings.some((item) => item.severity === "严重问题")) {
    suggestions.push("先修正严重问题，再处理一般问题和表达优化，避免返工顺序颠倒。");
  }
  if (allFindings.some((item) => item.category === "需求匹配度")) {
    suggestions.push("把客户重点需求直接写进策略标题、执行动作和预算说明里，减少“知道但没写出来”的情况。");
  }
  if (allFindings.some((item) => item.category === "逻辑连贯性")) {
    suggestions.push("建议按“目标 - 洞察 - 策略 - 执行 - 预算 - 风险”重新串一次页面，确保前后因果关系成立。");
  }
  if (allFindings.some((item) => item.category === "数据准确性")) {
    suggestions.push("所有关键数据统一补来源、统计口径、时间范围和单位，避免讲标时被追问。");
  }
  if (!suggestions.length) {
    suggestions.push("当前内容结构较完整，可以继续打磨表达密度、视觉层级和结论呈现方式。");
  }
  return uniqueStrings(suggestions);
}

function buildContentAuditReport(
  form: { mustInclude: string; content: string },
  briefOutput: string,
  templatePlan: OutlineTemplatePlan | null,
) {
  const requirements = inferAuditRequirements(briefOutput, form.mustInclude, templatePlan);
  if (!form.content.trim()) {
    const findings = [
      makeAuditFinding("global", "严重问题", "结构完整性", "尚未提供待检查内容", "当前没有可供逐页审阅的 PPT 文案或模块内容。", "请粘贴逐页内容后再生成检查报告。"),
    ];
    const section: AuditSectionReport = {
      id: "global",
      title: "整体检查",
      module: "整体",
      status: "高风险",
      summary: sectionSummary("整体检查", findings),
      findings,
    };
    return {
      version: "content-audit-v1" as const,
      title: "内容检查报告",
      requirements,
      briefSummary: summarize(briefOutput || "暂无 Brief 需求解构。"),
      overallSummary: "当前尚未提供可检查的逐页内容。",
      totals: { severe: 1, general: 0, suggestion: 0 },
      overallSuggestions: ["先粘贴逐页文案或模块内容，再生成逐页问题报告。"],
      sections: [section],
    };
  }

  const parsedSections = parseContentSections(form.content, templatePlan);
  const globalFindings = analyzeGlobalFindings(parsedSections, requirements, templatePlan);
  const reports: AuditSectionReport[] = [];

  if (globalFindings.length) {
    reports.push({
      id: "global",
      title: "整体检查",
      module: "整体",
      status: sectionStatus(globalFindings),
      summary: sectionSummary("整体检查", globalFindings),
      findings: globalFindings,
    });
  }

  parsedSections.forEach((section) => {
    reports.push(analyzeSection(section, requirements));
  });

  const totals = reports.flatMap((section) => section.findings).reduce(
    (accumulator, finding) => {
      if (finding.severity === "严重问题") accumulator.severe += 1;
      else if (finding.severity === "一般问题") accumulator.general += 1;
      else accumulator.suggestion += 1;
      return accumulator;
    },
    { severe: 0, general: 0, suggestion: 0 },
  );

  const overallSummary = totals.severe
    ? `本次检查发现 ${totals.severe} 个严重问题，建议优先补齐需求承接、关键模块和数字信息。`
    : totals.general
      ? `本次检查未发现严重问题，但有 ${totals.general} 个一般问题需要修正。`
      : totals.suggestion
        ? `本次检查整体通过，另有 ${totals.suggestion} 条优化建议可继续打磨。`
        : "本次检查未发现明显问题，整体结构和承接关系较完整。";

  return {
    version: "content-audit-v1" as const,
    title: "内容检查报告",
    requirements,
    briefSummary: summarize(briefOutput || "暂无 Brief 需求解构。"),
    overallSummary,
    totals,
    overallSuggestions: buildOverallSuggestions(reports),
    sections: reports,
  };
}

function buildUserInsightSummary(profile: UserInsightProfile, projectFocus: string) {
  const focusHint = projectFocus.trim() ? `结合当前项目“${projectFocus.trim()}”` : "结合当前项目";
  return `${focusHint}，建议优先围绕${profile.segmentType === "核心用户" ? "核心留存与付费" : "低门槛种草与转化"}设计传播：重点突出${profile.needs.slice(0, 2).join("、")}，避免放大${profile.painPoints.slice(0, 2).join("、")}等负面感知。`;
}

function buildCompetitorGap(report: CompetitorMarketingReport, projectFocus: string) {
  const focusHint = projectFocus.trim() ? `围绕“${projectFocus.trim()}”` : "围绕当前项目";
  return `${focusHint}，不要和 ${report.name} 正面对撞其最强项“${report.strengths[0]}”。更适合从${report.counterAdvice[0]}切入，拉开策略差异。`;
}

function buildHotspotSummary(item: HotspotItem, projectFocus: string) {
  const focusHint = projectFocus.trim() ? `如果本次要解决“${projectFocus.trim()}”` : "如果本次想提升传播效率";
  return `${focusHint}，优先用“${item.ideas[0].title}”切入，这个角度最容易同时兼顾热点参与感和游戏卖点承接。`;
}

function buildArchiveSummary(item: MarketingArchiveItem, projectFocus: string) {
  const focusHint = projectFocus.trim() ? `对于“${projectFocus.trim()}”` : "对于当前项目";
  return `${focusHint}，这份往期内容最值得复用的是${item.reusable.slice(0, 2).join("、")}；最该避开的则是${item.avoid[0]}。`;
}

function buildMarketingResearchReport({
  briefOutput,
  projectFocus,
  resources,
  selectedUser,
  selectedCompetitor,
  selectedHotspot,
  selectedArchive,
}: {
  briefOutput: string;
  projectFocus: string;
  resources: Resource[];
  selectedUser: UserInsightProfile;
  selectedCompetitor: CompetitorMarketingReport;
  selectedHotspot: HotspotItem;
  selectedArchive: MarketingArchiveItem;
}): MarketingResearchReport {
  const projectName = extractBriefField(briefOutput, "项目名称") || extractBriefField(briefOutput, "项目") || "当前项目";
  const gameName = extractBriefField(briefOutput, "游戏") || extractBriefField(briefOutput, "游戏名称") || projectName;
  const projectType = extractBriefField(briefOutput, "项目类型") || inferProjectType(briefOutput || projectFocus);
  const usage = extractBriefField(briefOutput, "方案用途") || inferUsage(briefOutput || projectFocus);
  const focus = projectFocus.trim() || "拉新转化 + 留存提升";
  const briefSummary = briefOutput
    ? summarize(briefOutput)
    : `当前未读取到 Brief，以下报告先围绕“${focus}”和已选调研模块生成，可在补充 Brief 后一键刷新。`;
  const generatedNote = briefOutput
    ? `已结合本次 Brief、${resources.length} 份资料库内容和当前调研模块选择生成。`
    : `当前按手动填写的项目重点生成，已参考 ${resources.length} 份资料库内容。`;

  return {
    version: "marketing-research-v1",
    title: `${gameName}营销调研报告`,
    projectName,
    gameName,
    projectType,
    usage,
    projectFocus: focus,
    briefSummary,
    generatedNote,
    sections: [
      {
        id: "project-brief",
        title: "项目与 Brief 摘要",
        summary: `本次输出围绕“${focus}”展开，适用于${usage}场景，优先解决${projectType}项目在卖点聚焦、用户触达和内容承接上的表达问题。`,
        bullets: [
          `项目背景提炼：${briefSummary}`,
          `建议对外统一使用“${selectedUser.needs[0]} + ${selectedUser.needs[1] || selectedUser.needs[0]}”作为核心传播利益点。`,
          "如果要进入方案正文，优先把“目标用户、竞品差异、热点玩法、风险预案、可复用案例”串成一条完整叙事线。",
        ],
      },
      {
        id: "user-insight",
        title: "目标用户洞察",
        summary: buildUserInsightSummary(selectedUser, focus),
        bullets: [
          `当前优先人群：${selectedUser.label}，活跃高峰在 ${selectedUser.activeHours}，更容易在 ${selectedUser.paymentScenes.slice(0, 2).join("、")} 场景产生转化。`,
          `核心需求集中在 ${selectedUser.needs.slice(0, 3).join("、")}，传播时要避免放大 ${selectedUser.painPoints.slice(0, 2).join("、")} 等负面感知。`,
          `潜在增长机会来自 ${selectedUser.unmetNeeds.slice(0, 2).join("、")}，建议把这些点写进创意内容或活动机制。`,
        ],
      },
      {
        id: "competitor",
        title: "竞品营销结论",
        summary: buildCompetitorGap(selectedCompetitor, focus),
        bullets: [
          `重点观察竞品：${selectedCompetitor.name}，其强项在 ${selectedCompetitor.strengths.slice(0, 2).join("、")}。`,
          `竞品暴露的机会点是 ${selectedCompetitor.weaknesses.slice(0, 2).join("、")}，我们可以借此做差异化切入。`,
          `用户口碑层面，正向反馈集中在 ${selectedCompetitor.userPraise.slice(0, 2).join("、")}，负向反馈集中在 ${selectedCompetitor.userComplaints.slice(0, 2).join("、")}。`,
        ],
      },
      {
        id: "hotspot",
        title: "热点对齐建议",
        summary: buildHotspotSummary(selectedHotspot, focus),
        bullets: [
          `推荐优先热点：${selectedHotspot.title}，热度参考 ${selectedHotspot.heat}，适合用于 ${selectedHotspot.fitScene}。`,
          `可直接落地的创意方向包括 ${selectedHotspot.ideas.slice(0, 2).map((item) => item.title).join("、")}。`,
          `执行时要控制 ${selectedHotspot.risks.slice(0, 2).join("、")} 等风险，建议同步准备备选角度和降敏文案。`,
        ],
      },
      {
        id: "sentiment",
        title: "舆情风险与应对",
        summary: "当前舆情模块建议把“高优先级预警 + 标准回应模板 + 周期复盘”作为固定动作，避免项目推进时只做热点不做风控。",
        bullets: sentimentSeed.slice(0, 3).map(
          (item) => `${item.topic}：影响范围为${item.impact}，建议优先采用“${item.responseTemplate}”这一类快速回应框架。`,
        ),
      },
      {
        id: "archive",
        title: "往期内容复用建议",
        summary: buildArchiveSummary(selectedArchive, focus),
        bullets: [
          `优先复用 ${selectedArchive.reusable.slice(0, 2).join("、")} 这些已经验证过的内容骨架。`,
          `当前不建议延续 ${selectedArchive.avoid.slice(0, 2).join("、")} 这类会稀释传播效率的做法。`,
          `如果要快速改造为本次 Brief，可直接从 ${selectedArchive.adaptation.slice(0, 2).join("、")} 入手。`,
        ],
      },
    ],
    finalDirection: [
      `传播主线建议聚焦“${selectedUser.needs[0]}”与“${selectedUser.needs[1] || selectedUser.needs[0]}”，让内容先打中目标用户，再承接转化。`,
      `执行层面优先采用“${selectedHotspot.ideas[0]?.title || "热点联动"} + ${selectedCompetitor.counterAdvice[0] || "差异化投放"}”的组合打法。`,
      "方案落地时，把风险回应、内容复用和阶段复盘一起写入计划，确保这份 Brief 不只好看，也能持续执行。",
    ],
  };
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

const jobsSeed = importedJobsSeed as AiJob[];
const membersSeed = importedMembersSeed as Member[];

const userInsightSeed: UserInsightProfile[] = [
  {
    id: 1,
    label: "18-25 岁竞技核心玩家",
    segmentType: "核心用户",
    age: "18-25 岁",
    gender: "男性为主，女性竞技玩家增长中",
    region: "新一线 / 二线城市集中，华东华南活跃更高",
    interests: ["篮球/电竞赛事", "高光操作短视频", "球队梗文化", "社交开黑"],
    habits: ["晚间集中开黑", "版本更新后 48 小时高活跃", "偏好先看实机再下载"],
    spendingMindset: "愿意为手感、战令、角色收藏付费，但对数值不公平极其敏感。",
    activeHours: "20:00-24:00",
    paymentScenes: ["新球星上线", "赛季战令", "限定外观", "周年庆折扣包"],
    retentionCycle: "7 日决定留存，30 日决定是否转为稳定付费用户",
    needs: ["公平竞技", "操作反馈爽感", "社交荣誉感", "赛事参与感"],
    painPoints: ["匹配体验波动", "氪金影响平衡", "版本爆点不够集中"],
    unmetNeeds: ["更强的队伍社交场景", "对高端玩家更有辨识度的荣誉体系"],
    trend: "近两年竞技用户也越来越看重剧情包装和角色人格标签，不再只吃硬核玩法卖点。",
    marketingAdvice: ["传播里同时讲手感与热血情绪，不只讲竞技强度。", "重点放大版本高光操作和开黑社交场景。", "在素材里避免过度强调付费优势，优先突出公平性。"],
  },
  {
    id: 2,
    label: "轻度泛二次元潜在用户",
    segmentType: "潜在用户",
    age: "20-29 岁",
    gender: "男女占比更均衡",
    region: "一二线城市 + 校园场景渗透更强",
    interests: ["角色人设", "轻内容追更", "社媒热点参与", "休闲社交"],
    habits: ["白天碎片浏览内容，晚间转化下载", "先被情绪内容种草后再补玩法信息"],
    spendingMindset: "冲动消费少，但会为喜欢的角色主题、联动内容和情绪价值买单。",
    activeHours: "12:00-14:00 / 21:00-23:30",
    paymentScenes: ["角色主题皮肤", "联动礼包", "节日活动周边"],
    retentionCycle: "首周看内容陪伴感，次月看活动节奏是否持续",
    needs: ["轻量入坑门槛", "内容陪伴感", "角色代入感", "可分享的话题点"],
    painPoints: ["玩法理解门槛高", "进入游戏后缺少引导", "内容素材太硬核导致望而却步"],
    unmetNeeds: ["更明确的新手友好叙事", "可转发的轻社交互动内容"],
    trend: "手游潜在用户越来越容易被剧情沉浸感、角色关系和热点话题种草，纯功能卖点转化效率下降。",
    marketingAdvice: ["素材第一屏先给情绪和角色，第二屏再补玩法。", "针对潜在用户单独做低门槛入坑内容。", "把活动机制翻译成更容易理解的生活化语言。"],
  },
];

const competitorSeed: CompetitorMarketingReport[] = [
  {
    id: 1,
    name: "竞品 A：王牌街篮计划",
    stage: "暑期版本冲量",
    keyActions: [
      { node: "版本前 10 天", action: "球星悬念海报 + 倒计时", effect: "社媒讨论量单日破 220 万" },
      { node: "版本上线周", action: "头部体育 KOL 联动短视频", effect: "总播放破 1000 万，评论区以情怀梗发酵为主" },
      { node: "版本后第 2 周", action: "校园挑战赛 + 短视频征集", effect: "UGC 投稿增长明显，但转化回流一般" },
    ],
    strengths: ["热点包装速度快", "KOL 内容风格统一", "短视频标题和封面很懂圈层语言"],
    weaknesses: ["活动复用感强", "后半程留量动作弱", "舆情应对偏慢"],
    userPraise: ["球星内容很有情怀", "短视频创意够上头", "版本宣传节奏热闹"],
    userComplaints: ["活动看起来像换皮", "游戏内承接感弱", "更新后 bug 较多"],
    likelyNextMove: "高概率继续绑定节日节点做球星联动，放大情怀内容与校园话题。",
    counterAdvice: ["不要和它拼同质化球星情怀文案，改打更强的玩家互动场景。", "提前准备版本内承接内容，避免只热闹不转化。", "把稳定性和公平体验作为差异化沟通点。"],
  },
  {
    id: 2,
    name: "竞品 B：次元旅团物语",
    stage: "周年庆拉新",
    keyActions: [
      { node: "周年预热", action: "角色关系线预告 + 剧情 PV", effect: "女性向社区收藏和二创转发明显增加" },
      { node: "周年当天", action: "直播发布会 + 联动福利抽奖", effect: "直播峰值在线高，但抽奖引流用户留存一般" },
      { node: "周年后 1 周", action: "话题挑战 + coser 联动", effect: "站外热度保持，但核心用户吐槽活动创新不足" },
    ],
    strengths: ["剧情沉浸感强", "角色人设输出稳定", "社区运营氛围细腻"],
    weaknesses: ["活动机制创新不足", "转化话术偏弱", "投放回收效率一般"],
    userPraise: ["角色关系很戳人", "剧情 PV 质量高", "周年直播仪式感足"],
    userComplaints: ["玩法推进太慢", "福利诚意一般", "联动内容有点重复"],
    likelyNextMove: "后续会继续加码角色剧情、直播活动和高情绪浓度的内容营销。",
    counterAdvice: ["如果自身项目不是剧情强项，就不要正面对撞剧情长片。", "可以用更高密度的互动玩法和社交反馈抢用户注意力。", "把玩法和情绪包装一起做，避免被定义为只有功能卖点。"],
  },
];

const hotspotSeed: HotspotItem[] = [
  {
    id: 1,
    title: "五一假期社交组局热潮",
    category: "节日 / 社交",
    heat: "热搜周边话题高频，讨论量预计持续 5-7 天",
    duration: "短爆发 + 周末延续",
    fitScene: "多人开黑、节日版本、回流召回",
    fitGames: ["竞技", "派对", "社交休闲"],
    ideas: [
      { title: "组局战队招募挑战", execution: "围绕假期组队开黑做短视频挑战和队伍海报生成", expected: "提升社交裂变与回流召回" },
      { title: "假期高光名场面合集", execution: "用玩家投稿 + 官方二创做热点短视频", expected: "提升用户参与感和话题感" },
      { title: "线下组局地图联动", execution: "联动线下球场 / 门店做城市组局打卡", expected: "强化真实社交场景认知" },
    ],
    copyAssets: ["五一组局别只约饭，约一把能上分的。", "假期开黑主场已就位，喊上你的固定队。"] ,
    scriptIdeas: ["3 镜头对比：普通聚会 vs 假期开黑局", "玩家聊天记录切入，再转进游戏组队场景"],
    risks: ["节日热点窗口短", "组局类内容容易同质化", "线下玩法需要准备替代方案"],
  },
  {
    id: 2,
    title: "国风赛事混剪话题升温",
    category: "游戏圈 / 国风审美",
    heat: "圈层讨论量高，适合二创内容接入",
    duration: "中等持续，适合 1-2 周内容发酵",
    fitScene: "版本更新、角色包装、视觉资产焕新",
    fitGames: ["国风", "二次元", "动作竞技"],
    ideas: [
      { title: "角色国风出场混剪", execution: "结合版本角色或皮肤做国风镜头语言混剪", expected: "提升视觉记忆点与分享率" },
      { title: "热点梗改写为游戏台词", execution: "把热门评论语境翻译成角色口播文案", expected: "增强社媒传播性" },
      { title: "线下快闪视觉墙", execution: "将国风热点视觉元素迁移到活动打卡区", expected: "提升线下传播素材质量" },
    ],
    copyAssets: ["这次不是蹭国风，是把角色气质真正做进画面。", "让版本更新不只像更新，更像一次出场。"] ,
    scriptIdeas: ["先给热点视觉，再切角色出场反转", "旁白讲情绪，字幕补玩法利益点"],
    risks: ["热点审美容易翻车", "如果游戏本体调性不够匹配，会被用户认为硬蹭"],
  },
];

const sentimentSeed: SentimentInsight[] = [
  {
    id: 1,
    topic: "版本更新后匹配异常投诉",
    severity: "高",
    impact: "TapTap 与微博讨论量 3 小时内激增，核心玩家负面情绪集中。",
    trigger: "更新后匹配等待时长变长，部分玩家反馈公平性下降。",
    responseTemplate: "我们已确认版本更新后匹配异常问题，技术正在紧急排查并会在 XX 时间前同步处理进展。感谢大家第一时间反馈，我们会优先保障匹配公平与正常体验。",
    weeklySummary: "本周舆情以匹配体验和新版本稳定性为核心，负面集中但问题边界清晰。",
    monthlyAdvice: ["建立版本更新后 6 小时重点监控机制。", "预设公平性相关回应模板，缩短首次发声时间。", "营销内容上线前同步 QA 风险点，减少宣传与体验反差。"],
  },
  {
    id: 2,
    topic: "节日福利被质疑诚意不足",
    severity: "中",
    impact: "社群和评论区吐槽扩散，但尚未破圈。",
    trigger: "活动奖励与预期不符，用户对比竞品后情绪放大。",
    responseTemplate: "我们收到大家对节日福利设置的反馈，运营与项目组会结合本次意见尽快优化后续发放节奏，并在 XX 时间前同步具体调整方案。",
    weeklySummary: "福利预期管理不到位，舆情主要由对比情绪驱动。",
    monthlyAdvice: ["活动前提前校准用户预期，不要让文案承诺高于实际奖励。", "福利说明页写清发放逻辑，减少误解空间。", "针对核心用户和回流用户拆分不同激励。"],
  },
];

const archiveSeed: MarketingArchiveItem[] = [
  {
    id: 1,
    title: "春节回流红包局活动",
    type: "节日活动",
    scene: "回流召回",
    node: "春节",
    highlight: ["红包机制直接驱动回流", "老带新链路顺畅", "文案口吻有烟火气"],
    weaknesses: ["后半段内容疲软", "投放渠道过散", "复盘里缺少留存拆解"],
    reusable: ["红包裂变机制", "老玩家召回文案结构", "节日社交场景包装"],
    avoid: ["同一素材反复投放", "活动阶段跨度过长导致疲劳"],
    adaptation: ["把春节的团圆表达改写成新品预约组队语境。", "弱化红包利益点，增强版本新内容诱因。", "把回流话术改成“老队友归队”型社交召回。"],
    metrics: [
      { label: "回流率", value: "18%" },
      { label: "裂变分享率", value: "26%" },
      { label: "7 日留存", value: "11%" },
    ],
  },
  {
    id: 2,
    title: "周年庆角色 PV 共创",
    type: "内容营销",
    scene: "品牌拉升",
    node: "周年庆",
    highlight: ["角色高光切片传播强", "UGC 二创跟进快", "评论区共鸣度高"],
    weaknesses: ["剧情过长导致完播掉得快", "投放版本过多导致主信息发散"],
    reusable: ["角色高光 15 秒结构", "弹幕式情绪文案", "PV 上线前预热节奏"],
    avoid: ["先发长片再发切片", "同一天上太多版本导致分流"],
    adaptation: ["压缩长 PV 为三段短切片，先抛情绪，再给利益点。", "把周年语境替换成新品首发“第一次见面”的出场感。", "把角色卖点和玩法亮点放进同一条片子里，而不是完全拆开。"],
    metrics: [
      { label: "PV 播放", value: "1280 万" },
      { label: "互动率", value: "8.6%" },
      { label: "评论正向比", value: "74%" },
    ],
  },
];

function App() {
  const [currentUser, setCurrentUser] = usePersistentState<AuthUser | null>("strategy-center-current-user", null);
  const [page, setPage] = useState<Page>("home");
  const [projects, setProjects] = usePersistentState<Project[]>("strategy-center-projects", projectsSeed);
  const [resources, setResources] = usePersistentState<Resource[]>("strategy-center-resources", resourcesSeed);
  const [jobs, setJobs] = usePersistentState<AiJob[]>("strategy-center-ai-jobs", jobsSeed);
  const [members, setMembers] = usePersistentState<Member[]>("strategy-center-members", membersSeed);
  const [selectedProjectId, setSelectedProjectId] = useState(101);
  const [selectedProjectTab, setSelectedProjectTab] = useState("概览");
  const [selectedResourceId, setSelectedResourceId] = useState(1);
  const [briefOutput, setBriefOutput] = usePersistentState("strategy-center-brief-output", "");
  const [schemeOutlineOutput, setSchemeOutlineOutput] = usePersistentState("strategy-center-scheme-outline-output", "");
  const [outlineOutput, setOutlineOutput] = usePersistentState("strategy-center-outline-output", "");
  const [contentAuditOutput, setContentAuditOutput] = usePersistentState("strategy-center-content-audit-output", "");
  const [outlineTab, setOutlineTab] = useState<OutlineTab>("template");
  const [assistantTab, setAssistantTab] = useState<AssistantTab>("brief");
  const [peopleInitialDetail, setPeopleInitialDetail] = useState<PeopleDetailView | null>(null);
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? projects[0];
  const selectedResource = resources.find((resource) => resource.id === selectedResourceId) ?? resources[0];
  const isAdmin = currentUser?.role === "admin";

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

  const openPeopleDetail = (detail: PeopleDetailView) => {
    if (!isAdmin) return;
    setPeopleInitialDetail(detail);
    setPage("people");
  };

  const navigateResource = (id: number) => {
    setSelectedResourceId(id);
    setPage("resourceDetail");
  };

  const openOutline = (tab: OutlineTab = "template") => {
    setOutlineTab(tab);
    setAssistantTab("template");
    setPage("brief");
  };

  const openAssistant = (tab: AssistantTab = "brief") => {
    setAssistantTab(tab);
    if (tab === "template") setOutlineTab("template");
    setPage("brief");
  };

  const deleteResource = (resourceId: number) => {
    if (!isAdmin) return;
    const resource = resources.find((item) => item.id === resourceId);
    setResources((current) => current.filter((item) => item.id !== resourceId));
    setProjects((current) =>
      current.map((project) => ({ ...project, resourceIds: (project.resourceIds ?? []).filter((id) => id !== resourceId) })),
    );
    addJob("资料删除", resource?.title ?? `资料 ${resourceId}`, "资料库");
    setPage("resources");
  };

  const logout = () => {
    setCurrentUser(null);
    setPage("home");
  };

  if (!currentUser) {
    return <LoginPage onLogin={setCurrentUser} />;
  }

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} user={currentUser} />
      <main className="workspace">
        <Topbar page={page} projects={projects} resources={resources} jobs={jobs} user={currentUser} onLogout={logout} setPage={setPage} openProject={navigateProject} openResource={navigateResource} />
        {page === "home" && <Home projects={projects} members={members} jobs={jobs} canOpenPeople={isAdmin} setPage={setPage} openProject={navigateProject} openPeopleDetail={openPeopleDetail} openAssistant={openAssistant} openOutline={openOutline} />}
        {page === "projects" && <Projects projects={projects} members={members} openProject={navigateProject} setProjects={setProjects} addJob={addJob} />}
        {page === "projectDetail" && <ProjectDetail project={selectedProject} initialTab={selectedProjectTab} members={members} projects={projects} resources={resources} openResource={navigateResource} setPage={setPage} setProjects={setProjects} addJob={addJob} />}
        {page === "people" && (isAdmin ? <PeopleManagement members={members} setMembers={setMembers} projects={projects} isAdmin={isAdmin} initialDetailView={peopleInitialDetail} clearInitialDetailView={() => setPeopleInitialDetail(null)} openProject={navigateProject} addJob={addJob} /> : <AccessDenied setPage={setPage} />)}
        {page === "marketingResearch" && <MarketingResearchBoard resources={resources} briefOutput={briefOutput} addJob={addJob} />}
        {page === "research" && <MarketingResearchBoard resources={resources} briefOutput={briefOutput} addJob={addJob} />}
        {page === "resources" && <Resources resources={resources} openResource={navigateResource} deleteResource={deleteResource} setPage={setPage} />}
        {page === "resourceUpload" && (isAdmin ? <ResourceUpload setResources={setResources} setPage={setPage} addJob={addJob} /> : <AccessDenied setPage={setPage} />)}
        {page === "resourceDetail" && <ResourceDetail resource={selectedResource} deleteResource={deleteResource} setPage={setPage} addJob={addJob} />}
        {page === "script" && <ScriptAssistant resources={resources} addJob={addJob} />}
        {page === "brief" && (
          <SchemeAssistant
            activeTab={assistantTab}
            setActiveTab={setAssistantTab}
            briefOutput={briefOutput}
            setBriefOutput={setBriefOutput}
            projects={projects}
            resources={resources}
            setPage={setPage}
            openOutline={openOutline}
            outlineOutput={outlineOutput}
            setOutlineOutput={setOutlineOutput}
            schemeOutlineOutput={schemeOutlineOutput}
            setSchemeOutlineOutput={setSchemeOutlineOutput}
            contentAuditOutput={contentAuditOutput}
            setContentAuditOutput={setContentAuditOutput}
            outlineTab={outlineTab}
            addJob={addJob}
          />
        )}
        {page === "outline" && (
          <SchemeAssistant
            activeTab="template"
            setActiveTab={(tab) => {
              setAssistantTab(tab);
              setPage("brief");
            }}
            briefOutput={briefOutput}
            setBriefOutput={setBriefOutput}
            projects={projects}
            resources={resources}
            setPage={setPage}
            openOutline={openOutline}
            outlineOutput={outlineOutput}
            setOutlineOutput={setOutlineOutput}
            schemeOutlineOutput={schemeOutlineOutput}
            setSchemeOutlineOutput={setSchemeOutlineOutput}
            contentAuditOutput={contentAuditOutput}
            setContentAuditOutput={setContentAuditOutput}
            outlineTab={outlineTab}
            addJob={addJob}
          />
        )}
        {page === "aiJobs" && <AiJobs jobs={jobs} />}
        {page === "settings" && (isAdmin ? <Settings /> : <AccessDenied setPage={setPage} />)}
      </main>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [account, setAccount] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [message, setMessage] = useState("");

  const submitLogin = () => {
    const matched = demoUsers.find((user) => user.account === account.trim() && user.password === password);
    if (!matched) {
      setMessage("账号或密码不正确。可用 admin/admin123 或 user/user123 体验。");
      return;
    }
    onLogin({ name: matched.name, role: matched.role });
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-brand">
          <div className="brand-mark">策</div>
          <div>
            <strong>策略中心</strong>
            <span>AI Workbench</span>
          </div>
        </div>
        <h1>登录工作台</h1>
        <p>根据登录人员角色进入不同权限视图。</p>
        <label>
          <span>账号</span>
          <input value={account} onChange={(event) => setAccount(event.target.value)} placeholder="admin 或 user" />
        </label>
        <label>
          <span>密码</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="admin123 或 user123" onKeyDown={(event) => { if (event.key === "Enter") submitLogin(); }} />
        </label>
        {message && <div className="login-message">{message}</div>}
        <button className="primary-button wide" onClick={submitLogin}>登录</button>
        <div className="login-demo-row">
          {demoUsers.map((user) => (
            <button key={user.account} className="ghost-button" onClick={() => { setAccount(user.account); setPassword(user.password); }}>
              {user.title}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function AccessDenied({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <section className="page">
      <Card title="暂无权限">
        <p className="muted">当前账号为普通用户，无法访问该管理页面。</p>
        <button className="primary-button" onClick={() => setPage("home")}>返回首页</button>
      </Card>
    </section>
  );
}

function Sidebar({ page, setPage, user }: { page: Page; setPage: (page: Page) => void; user: AuthUser }) {
  const allItems: Array<{ key: Page; label: string; icon: string; adminOnly?: boolean }> = [
    { key: "home", label: "首页", icon: "⌂" },
    { key: "projects", label: "项目跟进", icon: "▦" },
    { key: "people", label: "人员管理", icon: "◉", adminOnly: true },
    { key: "research", label: "营销调研", icon: "◈" },
    { key: "brief", label: "方案助手", icon: "✦" },
    { key: "script", label: "讲稿输出", icon: "◐" },
    { key: "resources", label: "资料库", icon: "◫" },
    { key: "aiJobs", label: "AI 任务记录", icon: "◎" },
    { key: "settings", label: "系统设置", icon: "⚙", adminOnly: true },
  ];
  const items = allItems.filter((item) => !item.adminOnly || user.role === "admin");

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
        <span>{user.role === "admin" ? "管理员模式" : "普通用户模式"}</span>
        <strong>{user.name}</strong>
        <p>{user.role === "admin" ? "可维护人员、系统设置和资料管理。" : "可使用项目、调研、方案和讲稿工作台。"}</p>
      </div>
    </aside>
  );
}

type SearchResult =
  | { id: string; kind: "项目"; title: string; meta: string; detail: string; action: () => void }
  | { id: string; kind: "任务"; title: string; meta: string; detail: string; action: () => void }
  | { id: string; kind: "资料"; title: string; meta: string; detail: string; action: () => void }
  | { id: string; kind: "AI"; title: string; meta: string; detail: string; action: () => void }
  | { id: string; kind: "页面"; title: string; meta: string; detail: string; action: () => void };

function Topbar({
  page,
  projects,
  resources,
  jobs,
  user,
  onLogout,
  setPage,
  openProject,
  openResource,
}: {
  page: Page;
  projects: Project[];
  resources: Resource[];
  jobs: AiJob[];
  user: AuthUser;
  onLogout: () => void;
  setPage: (page: Page) => void;
  openProject: (id: number, initialTab?: string) => void;
  openResource: (id: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo<SearchResult[]>(() => {
    if (!normalizedQuery) return [];
    const searchText = (values: Array<string | number | undefined | null | string[]>) =>
      values
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .map((value) => String(value ?? ""))
        .join(" ")
        .toLowerCase();
    const includesQuery = (values: Array<string | number | undefined | null | string[]>) => searchText(values).includes(normalizedQuery);
    const allPageSearchItems: SearchResult[] = [
      { id: "page-projects", kind: "页面", title: "项目跟进", meta: "项目列表 / 甘特图", detail: "查看项目状态、负责人、风险和排期。", action: () => setPage("projects") },
      { id: "page-people", kind: "页面", title: "人员管理", meta: "成员 / 负载 / 分工", detail: "查看项目人员分工总表、成员负载和延期任务。", action: () => setPage("people") },
      { id: "page-marketing", kind: "页面", title: "营销调研", meta: "Brief / 固定模块 / 可变模块", detail: "进入游戏营销前期调研工作台。", action: () => setPage("marketingResearch") },
      { id: "page-brief", kind: "页面", title: "方案助手", meta: "Brief 解析 / PPT 模板", detail: "进入方案助手，生成 Brief 解析、方案大纲和内容检查。", action: () => setPage("brief") },
      { id: "page-script", kind: "页面", title: "讲稿输出", meta: "逐字稿 / 答辩物料", detail: "根据方案 PPT 和资料库生成宣讲稿。", action: () => setPage("script") },
      { id: "page-resources", kind: "页面", title: "资料库", meta: "历史方案 / 竞品资料 / 复盘", detail: "检索、上传和复用策略资产。", action: () => setPage("resources") },
      { id: "page-ai", kind: "页面", title: "AI 任务记录", meta: "生成记录", detail: "查看 AI 解析、生成、排期任务。", action: () => setPage("aiJobs") },
      { id: "page-settings", kind: "页面", title: "系统设置", meta: "全局 AI / 检索方式", detail: "配置全局 AI 接口、模型和知识库检索方式。", action: () => setPage("settings") },
    ];
    const pageSearchItems = allPageSearchItems.filter((item) => user.role === "admin" || !["page-settings", "page-people"].includes(item.id));
    const pageResults = pageSearchItems.filter((item) => includesQuery([item.title, item.meta, item.detail]));
    const projectResults: SearchResult[] = projects
      .filter((project) =>
        includesQuery([
          project.name,
          project.game,
          project.client,
          project.type,
          project.stage,
          project.status,
          project.risk,
          project.clientCoreNeeds,
          project.bidResult,
        ]),
      )
      .map((project) => ({
        id: `project-${project.id}`,
        kind: "项目",
        title: project.name,
        meta: `${project.game} · ${project.stage}`,
        detail: `${project.client} / ${project.type}`,
        action: () => openProject(project.id),
      }));
    const taskResults: SearchResult[] = projects.flatMap((project) =>
      project.tasks
        .filter((task) => includesQuery([task.name, task.phase, task.owner, task.department, task.status, task.risk, task.delayReason, project.name, project.game]))
        .map((task) => ({
          id: `task-${project.id}-${task.id}`,
          kind: "任务" as const,
          title: task.name,
          meta: `${project.name} · ${task.status}`,
          detail: `${task.phase} / ${task.owner} / 截止 ${task.end}`,
          action: () => openProject(project.id, "排期表"),
        })),
    );
    const resourceResults: SearchResult[] = resources
      .filter((resource) =>
        includesQuery([
          resource.title,
          resource.type,
          resource.summary,
          resource.content,
          resource.uploader,
          resource.visibility,
          resource.sensitive,
          resource.fileName,
          resource.tags,
        ]),
      )
      .map((resource) => ({
        id: `resource-${resource.id}`,
        kind: "资料",
        title: resource.title,
        meta: `${resource.type} · ${resource.uploader}`,
        detail: resource.summary,
        action: () => openResource(resource.id),
      }));
    const jobResults: SearchResult[] = jobs
      .filter((job) => includesQuery([job.type, job.name, job.owner, job.createdAt, job.status, job.source]))
      .map((job) => ({
        id: `job-${job.id}`,
        kind: "AI",
        title: job.name,
        meta: `${job.type} · ${job.status}`,
        detail: `${job.source} / ${job.createdAt}`,
        action: () => setPage("aiJobs"),
      }));
    return [...pageResults, ...projectResults, ...taskResults, ...resourceResults, ...jobResults].slice(0, 8);
  }, [jobs, normalizedQuery, openProject, openResource, projects, resources, setPage]);

  const openResult = (result: SearchResult) => {
    result.action();
    setQuery("");
    setFocused(false);
  };
  const showPanel = focused && Boolean(query.trim());

  return (
    <header className={`topbar ${page !== "home" ? "compact-topbar" : ""}`}>
      {page === "home" && (
        <div
        className="search-shell"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
        }}
      >
        <form
          className="search-box"
          onSubmit={(event) => {
            event.preventDefault();
            if (results[0]) openResult(results[0]);
          }}
        >
          <button className="search-submit" type="submit" aria-label="打开第一条搜索结果" disabled={!results.length}>
            ⌕
          </button>
          <input
            aria-label="搜索项目、资料、任务和 AI 记录"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setQuery("");
                setFocused(false);
              }
            }}
            placeholder="搜索项目、资料、任务，例如“二次元新品上线方案”"
          />
          {query && (
            <button className="search-clear" type="button" aria-label="清空搜索" onClick={() => setQuery("")}>
              ×
            </button>
          )}
        </form>
        {showPanel && (
          <div className="search-results" onMouseDown={(event) => event.preventDefault()}>
            {results.length ? (
              results.map((result) => (
                <button key={result.id} className="search-result" onClick={() => openResult(result)}>
                  <span>{result.kind}</span>
                  <strong>{result.title}</strong>
                  <em>{result.meta}</em>
                  <small>{result.detail}</small>
                </button>
              ))
            ) : (
              <div className="search-empty">没有找到匹配内容</div>
            )}
          </div>
        )}
      </div>
      )}
      <div className="topbar-actions">
        <div className="user-chip">
          <div className="avatar">{user.role === "admin" ? "AD" : "U"}</div>
          <div>
            <strong>{user.name}</strong>
            <span>{user.role === "admin" ? "管理员" : "普通用户"}</span>
          </div>
        </div>
        <button className="ghost-button" onClick={onLogout}>退出</button>
      </div>
    </header>
  );
}

function Home({
  projects,
  members,
  jobs,
  canOpenPeople,
  setPage,
  openProject,
  openPeopleDetail,
  openAssistant,
  openOutline,
}: {
  projects: Project[];
  members: Member[];
  jobs: AiJob[];
  canOpenPeople: boolean;
  setPage: (page: Page) => void;
  openProject: (id: number, initialTab?: string) => void;
  openPeopleDetail: (detail: PeopleDetailView) => void;
  openAssistant: (tab?: AssistantTab) => void;
  openOutline: (tab?: OutlineTab) => void;
}) {
  const allTasks = projects.flatMap((project) => project.tasks);
  const overdueTasks = allTasks.filter((task) => task.status === "延期");
  const dueTasks = allTasks.filter((task) => task.status !== "已完成");
  const activeProjects = projects.filter((project) => project.status !== "已完成");
  const averageProgress = projects.length ? Math.round(projects.reduce((total, project) => total + projectProgress(project), 0) / projects.length) : 0;
  const totalBidAmount = projects.reduce((total, project) => total + (project.bidAmount ?? 0), 0);
  const riskItems = riskOptions.map((risk) => ({
    label: risk,
    value: projects.filter((project) => inferProjectRisk(project) === risk).length,
    tone: risk,
  }));
  const statusItems = taskStatusOptions.map((status) => ({
    label: status,
    value: allTasks.filter((task) => task.status === status).length,
  }));
  const stageItems = Array.from(
    projects.reduce((stageMap, project) => stageMap.set(project.stage, (stageMap.get(project.stage) ?? 0) + 1), new Map<string, number>()),
    ([label, value]) => ({ label, value }),
  );
  const memberLoadItems = buildMemberLoadStats(members, projects)
    .map((item) => ({ label: item.member.name, value: item.loadRate, meta: item.loadStatus }))
    .sort((first, second) => second.value - first.value);
  const criticalProjects = [...projects]
    .sort((first, second) => {
      const rank: Record<Risk, number> = { 严重: 4, 紧急: 3, 一般: 2, 正常: 1 };
      return rank[inferProjectRisk(second)] - rank[inferProjectRisk(first)] || daysUntil(first.submit) - daysUntil(second.submit);
    })
    .slice(0, 4);

  return (
    <section className="page">
      <PageTitle title="策略中心可视化看板" subtitle="项目进度、竞标结果、人员负载和风险预警的实时总览。" />
      <div className="dashboard-hero">
        <div>
          <span>Workbench Overview</span>
          <h2>{activeProjects.length} 个项目正在推进</h2>
          <p>平均完成度 {averageProgress}%，累计投标预算 {totalBidAmount} 万。优先关注临近提交节点、延期任务和人员负载高位项目。</p>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <strong>{averageProgress}%</strong>
          <span>整体进度</span>
        </div>
      </div>
      <div className="metric-grid">
        <Metric label="进行中项目" value={activeProjects.length} tone="blue" onClick={() => setPage("projects")} />
        <Metric label="我的待办" value={dueTasks.length} tone="green" onClick={() => canOpenPeople ? openPeopleDetail("active") : setPage("projects")} />
        <Metric label="平均进度" value={`${averageProgress}%`} tone="orange" onClick={() => setPage("projects")} />
        <Metric label="已延期" value={overdueTasks.length} tone="red" onClick={() => canOpenPeople ? openPeopleDetail("delayed") : setPage("projects")} />
      </div>
      <div className="dashboard-grid">
        <Card title="项目风险分布">
          <DonutChart items={riskItems} />
        </Card>
        <Card title="任务状态分布">
          <MiniBarChart items={statusItems} maxLabel="任务数" />
        </Card>
        <Card title="阶段漏斗">
          <MiniBarChart items={stageItems} maxLabel="项目数" />
        </Card>
        <Card title="人员负载">
          <LoadChart items={memberLoadItems} />
        </Card>
      </div>
      <div className="two-column">
        <Card title="我的待办">
          <TaskTable tasks={dueTasks.slice(0, 5)} members={members} />
        </Card>
        <Card title="风险预警">
          <div className="warning-list">
            {criticalProjects.map((project) => (
              <button key={project.id} className="warning-card" onClick={() => openProject(project.id)}>
                <RiskBadge risk={inferProjectRisk(project)} />
                <strong>{project.name}</strong>
                <span>{projectRiskReasons(project).slice(0, 2).join("；")}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
      <div className="quick-panel">
        <button onClick={() => setPage("resourceUpload")}>上传资料</button>
        <button onClick={() => openAssistant("brief")}>解析 Brief</button>
        <button onClick={() => openAssistant("template")}>生成 PPT 模板</button>
        <button className="quick-panel-audit" onClick={() => openOutline("audit")}>内容检查报告</button>
        <button onClick={() => setPage("projects")}>新建项目</button>
      </div>
      <Card title="最近 AI 任务">
        <AiJobs jobs={jobs.slice(0, 3)} embedded />
      </Card>
    </section>
  );
}

function MiniBarChart({ items, maxLabel }: { items: Array<{ label: string; value: number }>; maxLabel: string }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="mini-bar-chart">
      {items.map((item) => (
        <div className="mini-bar-row" key={item.label}>
          <span>{item.label}</span>
          <div className="mini-bar-track">
            <i style={{ width: `${Math.max((item.value / maxValue) * 100, item.value ? 8 : 0)}%` }} />
          </div>
          <strong>{item.value}</strong>
        </div>
      ))}
      <em>{maxLabel}</em>
    </div>
  );
}

function DonutChart({ items }: { items: Array<{ label: string; value: number; tone: Risk }> }) {
  const colors: Record<Risk, string> = {
    正常: "#2f7d5b",
    一般: "#d6a748",
    紧急: "#b66a2a",
    严重: "#b3443e",
  };
  const total = Math.max(items.reduce((sum, item) => sum + item.value, 0), 1);
  let cursor = 0;
  const segments = items.map((item) => {
    const start = cursor;
    const size = (item.value / total) * 360;
    cursor += size;
    return `${colors[item.tone]} ${start}deg ${cursor}deg`;
  });

  return (
    <div className="donut-panel">
      <div className="donut" style={{ background: `conic-gradient(${segments.join(", ")})` }}>
        <strong>{total}</strong>
        <span>项目</span>
      </div>
      <div className="donut-legend">
        {items.map((item) => (
          <span key={item.label}>
            <i style={{ background: colors[item.tone] }} />
            {item.label} {item.value}
          </span>
        ))}
      </div>
    </div>
  );
}

function LoadChart({ items }: { items: Array<{ label: string; value: number; meta: string }> }) {
  return (
    <div className="load-chart">
      {items.map((item) => (
        <div className="load-item" key={item.label}>
          <div>
            <strong>{item.label}</strong>
            <span>{item.meta}</span>
          </div>
          <div className="load-meter">
            <i style={{ width: `${Math.min(item.value, 100)}%` }} />
          </div>
          <em>{item.value}%</em>
        </div>
      ))}
    </div>
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
  const [bidQuickFilter, setBidQuickFilter] = useState<BidQuickFilter>(null);
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
  const activeProjects = projects.filter((project) => project.status !== "已完成");
  const averageProgress = projects.length ? Math.round(projects.reduce((total, project) => total + projectProgress(project), 0) / projects.length) : 0;
  const highRiskProjects = projects.filter((project) => ["紧急", "严重"].includes(inferProjectRisk(project))).length;
  const filteredProjects = projects.filter((project) => {
    const bidResult = projectBidResult(project);
    const matchesBidQuickFilter =
      !bidQuickFilter ||
      (bidQuickFilter === "finished" && bidResult !== "跟进中") ||
      (bidQuickFilter === "won" && bidResult === "中标") ||
      (bidQuickFilter === "lost" && bidResult === "未中标");
    const corpus = `${project.name}${project.game}${project.client}${project.type}${project.stage}${memberName(members, project.ownerId, project.owner)}`;
    return (
      matchesBidQuickFilter &&
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
        subtitle="项目总览、投标汇总和项目入口。点击项目进入详情页查看排期、资料、风险和复盘。"
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
      <div className="metric-grid">
        <Metric label="项目总数" value={projects.length} tone="blue" />
        <Metric label="进行中项目" value={activeProjects.length} tone="green" />
        <Metric label="中标率" value={`${winRate(bidAnalysis.won.length, bidAnalysis.finished.length)}%`} tone="orange" />
        <Metric label="高风险项目" value={highRiskProjects} tone="red" />
      </div>
      <Card title="项目汇总">
        <div className="project-summary-grid">
          <div className="summary-block">
            <span>整体进度</span>
            <strong>{averageProgress}%</strong>
            <p>已完结投标 {bidAnalysis.finished.length} 个，中标 {bidAnalysis.won.length} 个，未中标 {bidAnalysis.lost.length} 个。</p>
          </div>
          <div className="summary-block">
            <span>风险重点</span>
            <strong>{highRiskProjects ? `${highRiskProjects} 个需关注` : "暂无高风险"}</strong>
            <p>{bidAnalysis.lostReasons[0] ? `未中标高频原因：${bidAnalysis.lostReasons[0].key}，涉及 ${bidAnalysis.lostReasons[0].total} 个项目。` : "暂未形成明确未中标原因样本。"}</p>
          </div>
          <div className="summary-block">
            <span>筛选结果</span>
            <strong>{filteredProjects.length} 个项目</strong>
            <p>当前列表按搜索、状态、类型、风险和负责人筛选。点击项目名称进入详情页。</p>
          </div>
        </div>
      </Card>
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
      <div className="project-quick-stats">
        <button className={bidQuickFilter === "finished" ? "active" : ""} onClick={() => setBidQuickFilter(bidQuickFilter === "finished" ? null : "finished")}>已完结投标 {bidAnalysis.finished.length}</button>
        <button className={bidQuickFilter === "won" ? "active" : ""} onClick={() => setBidQuickFilter(bidQuickFilter === "won" ? null : "won")}>中标项目 {bidAnalysis.won.length}</button>
        <button className={bidQuickFilter === "lost" ? "active" : ""} onClick={() => setBidQuickFilter(bidQuickFilter === "lost" ? null : "lost")}>未中标项目 {bidAnalysis.lost.length}</button>
        <button onClick={() => setBidQuickFilter(null)}>全部项目 {projects.length}</button>
      </div>
      {bidQuickFilter && (
        <div className="filter-chip-row">
          <span>{bidQuickFilter === "finished" ? "已筛选：已完结投标" : bidQuickFilter === "won" ? "已筛选：中标项目" : "已筛选：未中标项目"}</span>
          <button className="link-button" onClick={() => setBidQuickFilter(null)}>清除筛选</button>
        </div>
      )}
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
              <th>投标结果</th>
              <th>风险</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project) => (
              <tr key={project.id} className="clickable-table-row" onClick={() => openProject(project.id)}>
                <td><button className="project-name-button" onClick={(event) => { event.stopPropagation(); openProject(project.id); }}>{project.name}</button></td>
                <td>{project.game}</td>
                <td>{project.client}</td>
                <td>{project.type}</td>
                <td>{memberName(members, project.ownerId, project.owner)}</td>
                <td>{project.stage}</td>
                <td>{project.submit}</td>
                <td>{projectBidResult(project)}</td>
                <td><RiskBadge risk={project.risk} /></td>
              </tr>
            ))}
            {!filteredProjects.length && (
              <tr>
                <td colSpan={9}><div className="empty-inline">暂无符合筛选条件的项目</div></td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </section>
  );
}

function BidAnalyticsPanel({
  projects,
  analysis,
  period,
  setPeriod,
  onQuickFilter,
}: {
  projects: Project[];
  analysis: ReturnType<typeof buildBidAnalysis>;
  period: "月" | "季度" | "年";
  setPeriod: (period: "月" | "季度" | "年") => void;
  onQuickFilter: (filter: BidQuickFilter) => void;
}) {
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
        <Metric label="已完结投标" value={total} tone="blue" onClick={() => onQuickFilter("finished")} />
        <Metric label="中标项目" value={analysis.won.length} tone="green" onClick={() => onQuickFilter("won")} />
        <Metric label="未中标项目" value={analysis.lost.length} tone="red" onClick={() => onQuickFilter("lost")} />
        <Metric label="中标率" value={`${rate}%`} tone="orange" onClick={() => onQuickFilter("finished")} />
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

type ResourceSearchMode = "natural" | "recommend" | "similar";
type ResourceSearchResult = {
  resource: Resource;
  score: number;
  keywordScore?: number;
  semanticScore?: number;
  snippets: string[];
  matchType?: string;
  recommendation?: string;
};

function Resources({ resources, openResource, deleteResource, setPage }: { resources: Resource[]; openResource: (id: number) => void; deleteResource: (id: number) => void; setPage: (page: Page) => void }) {
  const [mode, setMode] = useState<ResourceSearchMode>("natural");
  const [query, setQuery] = useState("");
  const [context, setContext] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    sensitive: "",
    parseStatus: "",
  });
  const [searchResults, setSearchResults] = useState<ResourceSearchResult[]>([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [erpMessage, setErpMessage] = useState("ERP 资料库接口已预留，等待配置真实 ERP API。");
  const effectiveQuery = mode === "natural" ? query : context || query;

  const localResults = useMemo(() => {
    const words = effectiveQuery.trim().split(/\s+/).filter(Boolean);
    return resources
      .filter((resource) =>
        (!filters.type || resource.type === filters.type) &&
        (!filters.sensitive || resource.sensitive === filters.sensitive) &&
        (!filters.parseStatus || (resource.parseStatus || "成功") === filters.parseStatus)
      )
      .map((resource) => {
        const tags = Array.isArray(resource.tags) ? resource.tags.join("") : "";
        const corpus = `${resource.title}${resource.summary}${resource.content}${tags}`;
        const score = effectiveQuery.trim() ? words.reduce((total, word) => total + (corpus.includes(word) ? 1 : 0), 0) : 0;
        const firstWord = words[0] ?? "";
        const snippet = firstWord && resource.content?.includes(firstWord) ? resource.content.slice(Math.max(0, resource.content.indexOf(firstWord) - 40), resource.content.indexOf(firstWord) + 100) : resource.summary;
        return { resource, score, keywordScore: score, semanticScore: 0, snippets: snippet ? [snippet] : [], matchType: inferResourceMatchType(resource), recommendation: buildResourceRecommendation(resource, mode) };
      })
      .filter((item) => !effectiveQuery.trim() || item.score > 0)
      .sort((a, b) => b.score - a.score)
  }, [effectiveQuery, filters, mode, resources]);

  useEffect(() => {
    let cancelled = false;
    setSearchMessage("");
    fetch("/api/resources/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, context, filters, mode, resources }),
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
  }, [context, filters, localResults, mode, query, resources]);

  const results = searchResults.length || effectiveQuery.trim() || Object.values(filters).some(Boolean) ? searchResults : localResults;
  const resourceTypes = Array.from(new Set(resources.map((resource) => resource.type).filter(Boolean)));
  const sensitiveLevels = Array.from(new Set(resources.map((resource) => resource.sensitive).filter(Boolean)));
  const modeMeta = {
    natural: {
      title: "AI 自然语言检索",
      placeholder: "口语化描述你想找什么，例如：找一个适合二次元新品上线、能证明预约转化效果的投标案例",
      helper: "全域检索标题、摘要、正文、标签和解析片段，匹配资产、案例、话术、数据、素材和模板。",
    },
    recommend: {
      title: "需求关联智能推荐",
      placeholder: "粘贴当前项目需求、Brief 或方案段落，例如：女性向周年活动，需要社群玩法、KOL 扩散和舆情预案",
      helper: "基于当前项目需求、方案内容和创作场景，推荐相关资产、案例、素材与模板。",
    },
    similar: {
      title: "相似内容智能匹配",
      placeholder: "粘贴当前创作内容、标题、玩法或传播创意，系统会匹配相似优秀案例和素材方向",
      helper: "对照当前创作内容，寻找相似案例、爆款素材、话术结构和参考方向。",
    },
  } satisfies Record<ResourceSearchMode, { title: string; placeholder: string; helper: string }>;

  const checkErp = async () => {
    try {
      const response = await fetch("/api/erp/resources");
      const data = await response.json();
      setErpMessage(data.message || "ERP 接口已预留。");
    } catch {
      setErpMessage("ERP 接口暂不可用，请确认本地后端服务。");
    }
  };

  return (
    <section className="page">
      <PageTitle title="资料库" subtitle="上传、解析、检索和复用策略资产。" action={<button className="primary-button" onClick={() => setPage("resourceUpload")}>上传资料</button>} />
      <div className="smart-search-panel">
        <div className="tabs">
          <button className={`tab ${mode === "natural" ? "active" : ""}`} onClick={() => setMode("natural")}>自然语言检索</button>
          <button className={`tab ${mode === "recommend" ? "active" : ""}`} onClick={() => setMode("recommend")}>需求推荐</button>
          <button className={`tab ${mode === "similar" ? "active" : ""}`} onClick={() => setMode("similar")}>相似匹配</button>
        </div>
        <div className="smart-search-copy">
          <strong>{modeMeta[mode].title}</strong>
          <span>{modeMeta[mode].helper}</span>
        </div>
        {mode === "natural" ? (
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={modeMeta[mode].placeholder} />
        ) : (
          <textarea className="smart-search-textarea" value={context} onChange={(event) => setContext(event.target.value)} placeholder={modeMeta[mode].placeholder} />
        )}
        <div className="erp-connector">
          <div>
            <strong>ERP 资料库接口</strong>
            <span>{erpMessage}</span>
          </div>
          <button className="ghost-button" onClick={checkErp}>检查接口</button>
        </div>
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
        <span>智能结果：{results.length}</span>
      </div>
      {searchMessage && <div className="note-box"><p>{searchMessage}</p></div>}
      <div className="resource-grid">
        {results.map(({ resource, score, keywordScore = score, semanticScore = 0, snippets, matchType, recommendation }) => (
          <div className="resource-card static-card" key={resource.id}>
            <div className="resource-type">{resource.type}</div>
            <h3>{resource.title}</h3>
            <p>{resource.summary}</p>
            {effectiveQuery.trim() && <p className="match-reason">{matchType || "资产"} / 相关度：{score}，关键词：{keywordScore}，语义：{Math.round(semanticScore * 100)}</p>}
            {recommendation && <p className="recommendation">{recommendation}</p>}
            {snippets.map((snippet, index) => <p className="snippet" key={`${resource.id}-${index}`}>{snippet}</p>)}
            <div className="tag-row">{(resource.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</div>
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

function inferResourceMatchType(resource: Resource) {
  const text = `${resource.type} ${resource.title} ${(resource.tags || []).join(" ")} ${resource.summary} ${resource.content}`;
  if (/案例|复盘|中标|爆款|优秀|标杆/.test(text)) return "案例";
  if (/话术|文案|口播|脚本|标题|slogan/i.test(text)) return "话术";
  if (/数据|报表|指标|预算|roi|cpm|转化|投放/i.test(text)) return "数据";
  if (/模板|框架|结构|母版|ppt/i.test(text)) return "模板";
  if (/素材|图片|视频|pv|kv|海报/i.test(text)) return "素材";
  return "资产";
}

function buildResourceRecommendation(resource: Resource, mode: ResourceSearchMode) {
  const matchType = inferResourceMatchType(resource);
  if (mode === "recommend") return `可作为当前需求的${matchType}参考，优先复用其中的结构、表达或执行经验。`;
  if (mode === "similar") return `与当前创作内容存在相似语义，可用于对标表达方式、素材方向和内容组织。`;
  return `命中${matchType}线索，可继续查看正文片段确认适配度。`;
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

function SchemeAssistant({
  activeTab,
  setActiveTab,
  briefOutput,
  setBriefOutput,
  projects,
  resources,
  setPage,
  openOutline,
  outlineOutput,
  setOutlineOutput,
  schemeOutlineOutput,
  setSchemeOutlineOutput,
  contentAuditOutput,
  setContentAuditOutput,
  outlineTab,
  addJob,
}: {
  activeTab: AssistantTab;
  setActiveTab: (tab: AssistantTab) => void;
  briefOutput: string;
  setBriefOutput: (value: string) => void;
  projects: Project[];
  resources: Resource[];
  setPage: (page: Page) => void;
  openOutline: (tab?: OutlineTab) => void;
  outlineOutput: string;
  setOutlineOutput: (value: string) => void;
  schemeOutlineOutput: string;
  setSchemeOutlineOutput: (value: string) => void;
  contentAuditOutput: string;
  setContentAuditOutput: (value: string) => void;
  outlineTab: OutlineTab;
  addJob: (type: string, name: string, source: string) => void;
}) {
  return (
    <section className="page">
      <PageTitle title="方案助手" subtitle="把客户 Brief 解析、PPT 模板生成和内容检查收拢到同一个方案工作流。" />
      <div className="tabs assistant-tabs">
        <button className={`tab ${activeTab === "brief" ? "active" : ""}`} onClick={() => setActiveTab("brief")}>Brief 解析</button>
        <button className={`tab ${activeTab === "outline" ? "active" : ""}`} onClick={() => setActiveTab("outline")}>大纲生成</button>
        <button className={`tab ${activeTab === "template" ? "active" : ""}`} onClick={() => setActiveTab("template")}>生成 PPT 模板</button>
      </div>
      {activeTab === "brief" ? (
        <BriefAssistant
          briefOutput={briefOutput}
          setBriefOutput={setBriefOutput}
          projects={projects}
          resources={resources}
          setPage={setPage}
          openOutline={openOutline}
          addJob={addJob}
          embedded
        />
      ) : activeTab === "outline" ? (
        <SchemeOutlineAssistant
          briefOutput={briefOutput}
          output={schemeOutlineOutput}
          setOutput={setSchemeOutlineOutput}
          addJob={addJob}
          embedded
        />
      ) : (
        <OutlineAssistant
          briefOutput={briefOutput}
          resources={resources}
          outlineOutput={outlineOutput}
          setOutlineOutput={setOutlineOutput}
          contentAuditOutput={contentAuditOutput}
          setContentAuditOutput={setContentAuditOutput}
          entryTab={outlineTab}
          addJob={addJob}
          embedded
        />
      )}
    </section>
  );
}

function BriefAssistant({
  briefOutput,
  setBriefOutput,
  projects,
  resources,
  setPage,
  openOutline,
  addJob,
  embedded = false,
}: {
  briefOutput: string;
  setBriefOutput: (value: string) => void;
  projects: Project[];
  resources: Resource[];
  setPage: (page: Page) => void;
  openOutline: (tab?: OutlineTab) => void;
  addJob: (type: string, name: string, source: string) => void;
  embedded?: boolean;
}) {
  const [apiConfig] = useGlobalAiConfig();
  const [isRunning, setIsRunning] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parsedFiles, setParsedFiles] = useState<BriefInputFile[]>([]);
  const [isParsingFiles, setIsParsingFiles] = useState(false);
  const [fileMessage, setFileMessage] = useState("");
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
${inputFiles.length ? inputFiles.map((file) => `- ${classifyBriefFile(file.name, file.content)}：${file.name}；${file.summary}`).join("\n") : "- 暂无上传文件，请先上传客户 Brief、QA 或补充资料。"}

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
    <section className={embedded ? "assistant-subpage" : "page"}>
      {!embedded && <PageTitle title="Brief 解析" subtitle="上传或粘贴客户 Brief，生成需求解构和 QA 清单。" />}
      {embedded && <div className="subpage-heading"><strong>Brief 解析</strong><span>上传或粘贴客户 Brief，生成需求解构和 QA 清单。</span></div>}
      <div className="split-panel">
        <Card title="输入信息">
          <div className="brief-file-panel">
            <label className="upload-zone compact-upload">
              <strong>上传本次项目输入文件</strong>
              <span>支持客户 Brief、QA、补充资料、Excel、Word、PDF、TXT；AI 会自动解析项目名称、游戏名称、项目类型、用途、禁忌和需求约束</span>
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
          <GlobalAiConfigNotice apiConfig={apiConfig} />
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
          <Card
            title="AI 需求解构报告"
            action={
              <div className="card-actions">
                <button className="ghost-button" onClick={() => openOutline("template")}>生成模板</button>
                <button className="ghost-button audit-entry-button" onClick={() => openOutline("audit")}>内容检查入口</button>
              </div>
            }
          >
            <pre className="ai-output">{briefOutput || "上传并解析 Brief / QA / 补充资料后，AI 将自动识别项目基础信息、核心需求、约束条件、风险点和客户确认 QA，并结合历史需求、QA 答疑和中标案例输出需求解构报告。"}</pre>
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

function SchemeOutlineAssistant({
  briefOutput,
  output,
  setOutput,
  addJob,
  embedded = false,
}: {
  briefOutput: string;
  output: string;
  setOutput: (value: string) => void;
  addJob: (type: string, name: string, source: string) => void;
  embedded?: boolean;
}) {
  const [form, setForm] = usePersistentState("strategy-center-scheme-outline-form", {
    direction: "品牌认知提升 / 新品上线转化 / 老玩家回流",
    theme: "",
    audience: "",
    notes: "",
  });

  const runOutline = () => {
    const result = `一、方案方向判断
- 本次方案方向：${form.direction || "需补充方向"}。
- 核心主题 / 主张：${form.theme || "建议根据 Brief 解析报告提炼一个清晰主张。"}
- 目标对象：${form.audience || "优先从 Brief 解析报告中的客户目标和玩家分层推断。"}

二、核心策略大纲
1. 项目背景与客户真实需求
   - 提炼 Brief 中的显性目标、隐性期待和约束条件。
   - 说明为什么当前节点需要做这套方案。
2. 用户与市场洞察
   - 目标用户是谁、他们当前的兴趣点和阻力是什么。
   - 结合竞品/历史案例说明机会窗口。
3. 方案核心主张
   - 围绕“${form.theme || "核心主题"}”建立一句话策略。
   - 拆出 2-3 个可落地的传播抓手。
4. 创意与内容机制
   - 内容主线、互动玩法、渠道打法和素材类型。
   - 明确哪些内容适合破圈，哪些适合转化。
5. 执行计划
   - 预热期、爆发期、延续期、复盘期。
   - 对应负责人、交付物和关键节点。
6. 风险与兜底
   - 预算、时间、素材授权、舆情、竞品干扰。
   - 给出可执行的调整预案。
7. 成效预估与复盘方式
   - 明确曝光、互动、转化、口碑等指标。
   - 说明如何沉淀为后续可复用资产。

三、建议 PPT 章节
- 封面：${form.theme || "方案主题"}。
- 目录：背景洞察 / 核心策略 / 创意机制 / 执行计划 / 风险预算 / 复盘指标。
- 背景页：Brief 需求和项目挑战。
- 洞察页：用户、产品、竞品、行业机会。
- 策略页：核心主张和打法总览。
- 创意页：内容机制和传播素材。
- 执行页：排期、分工、资源需求。
- 收束页：优势亮点、风险预案、效果预估。

四、Brief 解析依据
${briefOutput ? summarize(briefOutput, 1200) : "暂未生成 Brief 解析报告，建议先完成 Brief 解析后再生成大纲。"}

五、补充要求吸收
${form.notes || "暂无额外补充。"}`;
    setOutput(result);
    addJob("方案大纲", form.theme || "方案大纲生成", "方案助手");
  };

  return (
    <section className={embedded ? "assistant-subpage" : "page"}>
      {!embedded && <PageTitle title="大纲生成" subtitle="基于 Brief 解析报告和用户输入的方向、主题，构思方案大纲。" />}
      {embedded && <div className="subpage-heading"><strong>大纲生成</strong><span>基于 Brief 解析报告和用户输入的方向、主题，构思方案大纲。</span></div>}
      <div className="split-panel">
        <Card title="大纲方向">
          <div className="form-grid">
            <Field label="方案方向" value={form.direction} onChange={(value) => setForm({ ...form, direction: value })} />
            <Field label="主题 / 核心主张" value={form.theme} onChange={(value) => setForm({ ...form, theme: value })} />
            <Field label="目标对象" value={form.audience} onChange={(value) => setForm({ ...form, audience: value })} />
          </div>
          <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="补充要求：客户希望突出什么、避免什么、偏好的表达方式、必须出现的章节等。" />
          <div className="note-box">
            <strong>已读取 Brief 解析报告</strong>
            <p>{briefOutput ? summarize(briefOutput) : "还没有 Brief 解析报告。可以先在 Brief 解析页上传文件并生成结构报告。"}</p>
          </div>
          <button className="primary-button wide" onClick={runOutline}>生成方案大纲</button>
        </Card>
        <Card title="方案大纲输出">
          <pre className="ai-output">{output || "填写方向和主题后，点击“生成方案大纲”。这里会输出策略主线、章节结构、PPT 建议页和待补充信息。"}</pre>
        </Card>
      </div>
    </section>
  );
}

function OutlineAssistant({
  briefOutput,
  resources,
  outlineOutput,
  setOutlineOutput,
  contentAuditOutput,
  setContentAuditOutput,
  entryTab,
  addJob,
  embedded = false,
}: {
  briefOutput: string;
  resources: Resource[];
  outlineOutput: string;
  setOutlineOutput: (value: string) => void;
  contentAuditOutput: string;
  setContentAuditOutput: (value: string) => void;
  entryTab: OutlineTab;
  addJob: (type: string, name: string, source: string) => void;
  embedded?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"template" | "audit">("template");
  const [form, setForm] = useState({
    tone: "专业严谨",
    pageRange: "18-22",
    modules: "背景、洞察、策略、创意、执行、预算、排期、风险",
    preference: "",
  });
  const [auditForm, setAuditForm] = useState({
    mustInclude: "",
    content: "",
  });
  const templatePlan = useMemo(() => parseTemplatePlan(outlineOutput), [outlineOutput]);
  const auditReport = useMemo(() => parseContentAuditReport(contentAuditOutput), [contentAuditOutput]);
  const suggestedRequirements = useMemo(() => inferAuditRequirements(briefOutput, auditForm.mustInclude, templatePlan), [briefOutput, auditForm.mustInclude, templatePlan]);

  useEffect(() => {
    setActiveTab(entryTab);
  }, [entryTab]);

  const runTemplate = () => {
    const plan = buildTemplatePlan(form, briefOutput, resources);
    setOutlineOutput(JSON.stringify(plan));
    addJob("PPT 模板", plan.title, "方案助手");
  };

  const runAudit = () => {
    const report = buildContentAuditReport(auditForm, briefOutput, templatePlan);
    setContentAuditOutput(JSON.stringify(report));
    addJob("内容检查", `PPT 内容检查报告 ${report.totals.severe ? "待修正" : "已生成"}`, "方案助手");
  };

  return (
    <section className={embedded ? "assistant-subpage" : "page"}>
      {!embedded && <PageTitle title="PPT 模板与内容检查" subtitle={activeTab === "template" ? "生成可编辑的 PPT 页面模板，并补齐布局、视觉和填充提示。" : "逐页/逐模块检查当前 PPT 内容，输出分类问题报告。"} />}
      {embedded && (
        <div className="subpage-heading">
          <strong>{activeTab === "template" ? "生成 PPT 模板" : "内容检查报告"}</strong>
          <span>{activeTab === "template" ? "生成可编辑的 PPT 页面模板，并补齐布局、视觉和填充提示。" : "逐页/逐模块检查当前 PPT 内容，输出分类问题报告。"}</span>
        </div>
      )}
      <div className="tabs">
        <button className={`tab ${activeTab === "template" ? "active" : ""}`} onClick={() => setActiveTab("template")}>PPT 模板生成</button>
        <button className={`tab ${activeTab === "audit" ? "active" : ""}`} onClick={() => setActiveTab("audit")}>内容检查报告</button>
      </div>
      {activeTab === "template" ? (
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
            <div className="note-box">
              <strong>本次生成会包含</strong>
              <p>封面与目录模板、各必含模块页面框架、页面布局建议、视觉元素搭配、内容填充提示，以及结合方案类型和客户偏好的模板优化建议。</p>
            </div>
            <button className="primary-button wide" onClick={runTemplate}>生成 PPT 模板</button>
          </Card>
          <Card title="PPT 模板预览" action={<button className="ghost-button" onClick={() => setActiveTab("audit")}>去做内容检查</button>}>
            {templatePlan ? (
              <>
                <div className="template-hero">
                  <div>
                    <span className="template-kicker">{templatePlan.projectType} · {templatePlan.usage}</span>
                    <h3>{templatePlan.title}</h3>
                    <p className="muted">{templatePlan.storytelling}</p>
                  </div>
                  <div className="template-count">
                    <strong>{templatePlan.slides.length}</strong>
                    <span>建议页数</span>
                  </div>
                </div>
                <div className="template-meta-grid">
                  <div className="note-box">
                    <strong>视觉母版建议</strong>
                    <p>{templatePlan.visualStyle}</p>
                    <div className="tag-row">{templatePlan.visualKeywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
                  </div>
                  <div className="note-box">
                    <strong>可编辑模板规则</strong>
                    <p>{templatePlan.editableGuide}</p>
                  </div>
                </div>
                <div className="note-box">
                  <strong>模板优化建议</strong>
                  <ul className="template-list">
                    {templatePlan.optimizationSuggestions.map((tip) => <li key={tip}>{tip}</li>)}
                  </ul>
                </div>
                {!!templatePlan.referenceAssets.length && (
                  <div className="note-box">
                    <strong>参考资料</strong>
                    <div className="tag-row">{templatePlan.referenceAssets.map((asset) => <span key={asset}>{asset}</span>)}</div>
                  </div>
                )}
                <div className="outline-list template-slide-list">
                  {templatePlan.slides.map((slide, index) => (
                    <div className="template-slide" key={slide.id}>
                      <div className="template-slide-header">
                        <span>{index + 1}</span>
                        <div>
                          <strong>{slide.title}</strong>
                          <p>{slide.objective}</p>
                        </div>
                      </div>
                      <div className="tag-row">
                        <span>{slide.module}</span>
                        {slide.editableBlocks.slice(0, 2).map((item) => <span key={`${slide.id}-${item}`}>{item}</span>)}
                      </div>
                      <div className="template-slide-grid">
                        <div className="template-slide-section">
                          <h4>页面布局建议</h4>
                          <ul className="template-list">
                            {slide.layoutTips.map((item) => <li key={item}>{item}</li>)}
                          </ul>
                        </div>
                        <div className="template-slide-section">
                          <h4>视觉元素搭配</h4>
                          <ul className="template-list">
                            {slide.visualTips.map((item) => <li key={item}>{item}</li>)}
                          </ul>
                        </div>
                        <div className="template-slide-section">
                          <h4>内容填充提示</h4>
                          <ul className="template-list">
                            {slide.contentPrompts.map((item) => <li key={item}>{item}</li>)}
                          </ul>
                        </div>
                        <div className="template-slide-section">
                          <h4>重点内容</h4>
                          <ul className="template-list">
                            {slide.highlightTips.map((item) => <li key={item}>{item}</li>)}
                          </ul>
                        </div>
                      </div>
                      <div className="note-box compact-note">
                        <strong>可直接编辑的模块位</strong>
                        <div className="tag-row">{slide.editableBlocks.map((item) => <span key={`${slide.id}-block-${item}`}>{item}</span>)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="muted">{outlineOutput || "配置左侧参数后生成 PPT 模板。"}</p>
            )}
          </Card>
        </div>
      ) : (
        <div className="split-panel">
          <Card title="检查配置">
            <div className="note-box">
              <strong>检查依据</strong>
              <p>{briefOutput ? summarize(briefOutput) : "当前没有 Brief 解构，系统会优先根据你手动填写的重点需求检查。"}</p>
            </div>
            <textarea value={auditForm.mustInclude} onChange={(event) => setAuditForm({ ...auditForm, mustInclude: event.target.value })} placeholder="客户重点需求/必提要求，例如：拓展海外市场、突出预算合理性、加强达人传播..." />
            <textarea value={auditForm.content} onChange={(event) => setAuditForm({ ...auditForm, content: event.target.value })} placeholder={"粘贴当前 PPT 的逐页内容，建议按下面格式：\n第1页 封面\n一句话主张...\n\n第2页 项目背景\n项目现状...\n\n第3页 核心策略\n策略主张..."} />
            <div className="note-box">
              <strong>系统会重点检查</strong>
              <p>需求匹配度、逻辑连贯性、数据准确性，并按严重问题 / 一般问题 / 优化建议分类输出。</p>
              {!!suggestedRequirements.length && <div className="tag-row">{suggestedRequirements.map((item) => <span key={item}>{item}</span>)}</div>}
            </div>
            <button className="primary-button wide" onClick={runAudit}>生成检查报告</button>
          </Card>
          <Card title="内容检查报告">
            {auditReport ? (
              <>
                <div className="audit-summary-grid">
                  <div className="audit-stat severe">
                    <span>严重问题</span>
                    <strong>{auditReport.totals.severe}</strong>
                  </div>
                  <div className="audit-stat general">
                    <span>一般问题</span>
                    <strong>{auditReport.totals.general}</strong>
                  </div>
                  <div className="audit-stat suggestion">
                    <span>优化建议</span>
                    <strong>{auditReport.totals.suggestion}</strong>
                  </div>
                </div>
                <div className="note-box">
                  <strong>总体结论</strong>
                  <p>{auditReport.overallSummary}</p>
                </div>
                {!!auditReport.requirements.length && (
                  <div className="note-box">
                    <strong>重点需求对齐</strong>
                    <div className="tag-row">{auditReport.requirements.map((item) => <span key={item}>{item}</span>)}</div>
                  </div>
                )}
                <div className="note-box">
                  <strong>修订优先级建议</strong>
                  <ul className="template-list">
                    {auditReport.overallSuggestions.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div className="outline-list audit-section-list">
                  {auditReport.sections.map((section) => (
                    <div className="audit-section" key={section.id}>
                      <div className="audit-section-header">
                        <div>
                          <div className="tag-row">
                            <span className={`audit-status ${auditStatusTone(section.status)}`}>{section.status}</span>
                            <span>{section.module}</span>
                          </div>
                          <strong>{section.title}</strong>
                          <p>{section.summary}</p>
                        </div>
                      </div>
                      {section.findings.length ? (
                        <div className="finding-list">
                          {section.findings.map((finding) => (
                            <div className={`finding-card ${auditSeverityTone(finding.severity)}`} key={finding.id}>
                              <div className="finding-head">
                                <span className={`finding-badge ${auditSeverityTone(finding.severity)}`}>{finding.severity}</span>
                                <span className="finding-category">{finding.category}</span>
                              </div>
                              <strong>{finding.issue}</strong>
                              <p>{finding.detail}</p>
                              <div className="finding-suggestion">建议：{finding.suggestion}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-state compact">当前页面暂未发现明显问题。</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="muted">{contentAuditOutput || "粘贴逐页内容后，这里会输出逐页/逐模块检查报告。"}</p>
            )}
          </Card>
        </div>
      )}
    </section>
  );
}

function MarketingResearchBoard({
  resources,
  briefOutput,
  addJob,
}: {
  resources: Resource[];
  briefOutput: string;
  addJob: (type: string, name: string, source: string) => void;
}) {
  const [tab, setTab] = useState<ResearchTab>("brief");
  const [apiConfig] = useGlobalAiConfig();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parsedFiles, setParsedFiles] = useState<BriefInputFile[]>([]);
  const [linkedResourceIds, setLinkedResourceIds] = usePersistentState<number[]>("strategy-center-marketing-linked-resources", []);
  const [briefForm, setBriefForm] = useState({
    projectName: "",
    gameName: "",
    projectType: "新品上线 / 版本更新 / 品牌联动 / 线下活动",
    marketingGoal: "",
    forbidden: "",
    brief: "",
  });
  const [briefBreakdown, setBriefBreakdown] = usePersistentState("strategy-center-marketing-brief-breakdown", "");
  const [activeFixedModule, setActiveFixedModule] = useState(fixedResearchModules[0].title);
  const [fixedModuleOutputs, setFixedModuleOutputs] = usePersistentState<Record<string, string>>("strategy-center-fixed-module-outputs", {});
  const [selectedVariableScenes, setSelectedVariableScenes] = usePersistentState<string[]>("strategy-center-selected-variable-scenes", []);
  const [variableModuleOutputs, setVariableModuleOutputs] = usePersistentState<Record<string, string>>("strategy-center-variable-module-outputs", {});
  const [finalReport, setFinalReport] = usePersistentState("strategy-center-final-marketing-research-report", "");
  const [isParsingFiles, setIsParsingFiles] = useState(false);
  const [isRunningBrief, setIsRunningBrief] = useState(false);
  const [isRunningFixedModule, setIsRunningFixedModule] = useState(false);
  const [isRunningVariableModule, setIsRunningVariableModule] = useState(false);
  const [isRunningFinalReport, setIsRunningFinalReport] = useState(false);
  const [fileMessage, setFileMessage] = useState("");

  const selectedFixedModule = fixedResearchModules.find((module) => module.title === activeFixedModule) ?? fixedResearchModules[0];
  const selectedFixedOutput = fixedModuleOutputs[selectedFixedModule.title] || "";
  const selectedVariableModules = variableResearchScenarios.filter((scenario) => selectedVariableScenes.includes(scenario.scene));
  const linkedResources = resources.filter((resource) => linkedResourceIds.includes(resource.id));
  const linkedResourceFiles = linkedResources.map(resourceToInputFile);
  const allBriefInputFiles = [...parsedFiles, ...linkedResourceFiles];
  const linkedResourceContext = buildResourceContext(linkedResources);
  const extractedBriefText = `${briefBreakdown} ${briefForm.brief} ${allBriefInputFiles.map((file) => `${file.name} ${file.summary} ${file.content}`).join("\n")}`;
  const recommendationContext = `${briefForm.projectName} ${briefForm.gameName} ${briefForm.projectType} ${briefForm.marketingGoal} ${briefForm.brief} ${briefBreakdown}`;
  const recommendedResources = resources
    .filter((resource) => !linkedResourceIds.includes(resource.id))
    .map((resource) => ({ resource, score: scoreResource(resource, recommendationContext) }))
    .filter((item) => item.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.resource);
  const extractedBriefInfo = {
    projectName: briefForm.projectName || inferBriefFieldFromText(extractedBriefText, "projectName"),
    gameName: briefForm.gameName || inferBriefFieldFromText(extractedBriefText, "gameName"),
    projectType: briefForm.projectType || inferBriefFieldFromText(extractedBriefText, "projectType"),
    marketingGoal: briefForm.marketingGoal || inferBriefFieldFromText(extractedBriefText, "marketingGoal"),
  };
  const fixedDoneCount = Object.keys(fixedModuleOutputs).filter((key) => key !== "_message" && fixedModuleOutputs[key]?.trim()).length;
  const variableDoneCount = Object.keys(variableModuleOutputs).filter((key) => key !== "_message" && variableModuleOutputs[key]?.trim()).length;
  const hasBriefInput = Boolean(briefForm.brief.trim() || parsedFiles.length || selectedFiles.length || linkedResources.length);
  const hasBriefBreakdown = Boolean(briefBreakdown.trim());
  const hasVariableSelection = selectedVariableModules.length > 0;
  const missingInputs = missingMarketingInputs(briefForm, hasBriefBreakdown, fixedDoneCount, selectedVariableModules.length, linkedResources.length);
  const generationStatus = [
    isRunningBrief && "正在拆解 Brief",
    isRunningFixedModule && `正在分析${selectedFixedModule.title}`,
    isRunningVariableModule && "正在分析可变模块",
    isRunningFinalReport && "正在整理完整报告",
  ].find(Boolean) || (finalReport ? "报告已生成，可导出或复用" : hasBriefBreakdown ? "可继续生成下一步" : "等待输入 Brief");
  const flowSteps: FlowStep[] = [
    {
      key: "brief",
      title: "Brief拆解",
      status: hasBriefBreakdown ? "已完成" : hasBriefInput ? "可继续生成" : "缺资料",
      detail: hasBriefBreakdown ? "核心需求、隐性需求、优先级和约束已生成。" : hasBriefInput ? "Brief 已进入工作台，可点击 AI 拆解。" : "请上传 Brief 或粘贴客户沟通记录。",
      transfer: hasBriefBreakdown ? "结果已自动进入固定模块、可变模块和最终报告。" : "生成后会自动带入后续步骤。",
    },
    {
      key: "fixed",
      title: "固定分析模块",
      status: fixedDoneCount === fixedResearchModules.length ? "已完成" : hasBriefBreakdown ? "可继续生成" : "缺资料",
      detail: fixedDoneCount ? `已完成 ${fixedDoneCount}/${fixedResearchModules.length} 个固定模块。` : hasBriefBreakdown ? "已接收 Brief 拆解，可开始逐模块深度分析。" : "等待上一步 Brief 拆解结果。",
      transfer: fixedDoneCount ? "固定模块结论已自动进入可变模块和报告。" : "生成后会作为可变模块与报告依据。",
    },
    {
      key: "variable",
      title: "可选分析模块",
      status: variableDoneCount > 0 ? "已完成" : hasBriefBreakdown && hasVariableSelection ? "可继续生成" : "缺资料",
      detail: variableDoneCount ? `已生成 ${variableDoneCount} 组增补分析。` : hasBriefBreakdown && hasVariableSelection ? `已选择 ${selectedVariableModules.length} 个额外场景，可生成分析。` : hasBriefBreakdown ? "请根据客户目标选择额外深挖场景。" : "等待 Brief 拆解后再选择额外模块。",
      transfer: variableDoneCount ? "可变模块结论已自动进入最终报告。" : "生成后会补充到最终报告。",
    },
    {
      key: "report",
      title: "完整调研报告",
      status: finalReport.trim() ? "已完成" : hasBriefBreakdown && fixedDoneCount > 0 ? "可继续生成" : "缺资料",
      detail: finalReport.trim() ? "完整营销调研报告已生成。" : hasBriefBreakdown && fixedDoneCount > 0 ? "已接收前序结果，可整理成报告。" : "至少需要 Brief 拆解和固定模块结论。",
      transfer: finalReport.trim() ? "可作为后续方案、PPT 和讲稿输入。" : "生成后输出统一调研报告。",
    },
  ];

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

  const toggleLinkedResource = (resourceId: number) => {
    setLinkedResourceIds((current) => current.includes(resourceId) ? current.filter((id) => id !== resourceId) : [...current, resourceId]);
  };

  const linkRecommendedResources = () => {
    setLinkedResourceIds((current) => Array.from(new Set([...current, ...recommendedResources.map((resource) => resource.id)])));
  };

  const exportFinalReport = () => {
    downloadMarkdown(`营销调研报告-${briefForm.projectName || briefForm.gameName || today()}.md`, "营销调研报告", finalReport);
  };

  const reuseReportForScript = () => {
    if (!finalReport.trim()) return;
    downloadMarkdown(`讲稿输入素材-${briefForm.projectName || briefForm.gameName || today()}.md`, "讲稿输入素材", `以下内容可在“讲稿输出”中作为方案核心素材引用：\n\n${finalReport}`);
  };

  const parseMarketingBriefFiles = async () => {
    if (!selectedFiles.length) {
      setFileMessage("请先选择客户 Brief、QA 或补充资料文件。");
      return parsedFiles;
    }
    setIsParsingFiles(true);
    setFileMessage("");
    try {
      const body = new FormData();
      selectedFiles.forEach((file) => body.append("files", file));
      const response = await fetch("/api/brief-files", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Brief 文件解析失败。");
      const files = (result.files ?? []).map((item: Partial<BriefInputFile & Resource>) => ({
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
      const parsedText = files.map((file) => `${file.name}\n${file.summary}\n${file.content}`).join("\n");
      setBriefForm((current) => ({
        ...current,
        projectName: current.projectName || inferBriefFieldFromText(parsedText, "projectName"),
        gameName: current.gameName || inferBriefFieldFromText(parsedText, "gameName"),
        projectType: current.projectType || inferBriefFieldFromText(parsedText, "projectType") || current.projectType,
        marketingGoal: current.marketingGoal || inferBriefFieldFromText(parsedText, "marketingGoal"),
      }));
      setFileMessage(`已解析 ${files.length} 个输入文件。`);
      addJob("Brief 文件解析", `解析 ${files.length} 个营销调研 Brief 文件`, "营销调研");
      return files;
    } catch (error) {
      setFileMessage(error instanceof Error ? error.message : "Brief 文件解析失败。");
      return parsedFiles;
    } finally {
      setIsParsingFiles(false);
    }
  };

  const runBriefBreakdown = async () => {
    setIsRunningBrief(true);
    try {
      const inputFiles = selectedFiles.length && !parsedFiles.length ? await parseMarketingBriefFiles() : parsedFiles;
      const combinedFiles = [...inputFiles, ...linkedResourceFiles];
      const inputPackage = buildMarketingBriefInputPackage(briefForm, combinedFiles);
      const prompt = buildMarketingBriefPrompt(inputPackage);
      if (apiConfig.endpoint.trim()) {
        setBriefBreakdown("正在调用 AI 拆解 Brief...");
        const response = await fetch("/api/brief-run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            endpoint: apiConfig.endpoint.trim(),
            apiKey: apiConfig.apiKey.trim(),
            model: apiConfig.model.trim() || undefined,
            input: { ...briefForm, files: combinedFiles.map((file) => ({ name: file.name, summary: file.summary, content: file.content })), linkedResources },
            prompt,
            messages: [
              { role: "system", content: "你是资深游戏营销前期调研负责人，擅长从客户 Brief 中拆解显性需求、隐性需求、优先级、约束条件和后续调研路径。" },
              { role: "user", content: prompt },
            ],
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || result.error || "Brief 拆解 API 调用失败。");
        const output = extractAiText(result);
        setBriefBreakdown(output || JSON.stringify(result, null, 2));
        const outputText = output || JSON.stringify(result, null, 2);
        setBriefForm((current) => ({
          ...current,
          projectName: current.projectName || inferBriefFieldFromText(outputText, "projectName"),
          gameName: current.gameName || inferBriefFieldFromText(outputText, "gameName"),
          projectType: current.projectType || inferBriefFieldFromText(outputText, "projectType") || current.projectType,
          marketingGoal: current.marketingGoal || inferBriefFieldFromText(outputText, "marketingGoal"),
        }));
        addJob("Brief 拆解", `${briefForm.projectName || "未命名项目"} 营销调研 Brief 拆解`, "营销调研");
        return;
      }
      const localOutput = buildLocalMarketingBriefBreakdown(briefForm, combinedFiles);
      setBriefBreakdown(localOutput);
      setBriefForm((current) => ({
        ...current,
        projectName: current.projectName || inferBriefFieldFromText(localOutput, "projectName"),
        gameName: current.gameName || inferBriefFieldFromText(localOutput, "gameName"),
        projectType: current.projectType || inferBriefFieldFromText(localOutput, "projectType") || current.projectType,
        marketingGoal: current.marketingGoal || inferBriefFieldFromText(localOutput, "marketingGoal"),
      }));
      addJob("Brief 拆解", `${briefForm.projectName || "未命名项目"} 本地营销 Brief 拆解`, "营销调研");
    } catch (error) {
      setBriefBreakdown(error instanceof Error ? error.message : "Brief 拆解失败。");
    } finally {
      setIsRunningBrief(false);
    }
  };

  const runFixedModuleAnalysis = async () => {
    setIsRunningFixedModule(true);
    try {
      const prompt = `${buildFixedModuleAnalysisPrompt(selectedFixedModule, briefBreakdown, briefForm)}

资料库引用：
${linkedResourceContext}`;
      if (apiConfig.endpoint.trim()) {
        setFixedModuleOutputs((current) => ({ ...current, [selectedFixedModule.title]: `正在生成${selectedFixedModule.title}分析...` }));
        const response = await fetch("/api/marketing-research-run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            endpoint: apiConfig.endpoint.trim(),
            apiKey: apiConfig.apiKey.trim(),
            model: apiConfig.model.trim() || undefined,
            input: { module: selectedFixedModule.title, briefBreakdown, briefForm, linkedResources },
            prompt,
            messages: [
              { role: "system", content: "你是资深游戏营销前期调研专家，正在基于 Brief 拆解结果生成固定调研模块的深度分析。" },
              { role: "user", content: prompt },
            ],
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || result.error || `${selectedFixedModule.title}分析失败。`);
        const output = extractAiText(result);
        setFixedModuleOutputs((current) => ({ ...current, [selectedFixedModule.title]: output || JSON.stringify(result, null, 2) }));
      } else {
        const localAnalysis = `${buildLocalFixedModuleAnalysis(selectedFixedModule, briefBreakdown, briefForm)}

资料库参考：
${linkedResources.length ? linkedResources.map((resource) => `- ${resource.title}：${resource.summary}`).join("\n") : "- 暂未关联资料库文件。"}`;
        setFixedModuleOutputs((current) => ({ ...current, [selectedFixedModule.title]: localAnalysis }));
      }
      addJob("固定模块分析", `${briefForm.projectName || "未命名项目"} ${selectedFixedModule.title}`, "营销调研");
    } catch (error) {
      setFixedModuleOutputs((current) => ({ ...current, [selectedFixedModule.title]: error instanceof Error ? error.message : `${selectedFixedModule.title}分析失败。` }));
    } finally {
      setIsRunningFixedModule(false);
    }
  };

  const toggleVariableScene = (scene: string) => {
    setSelectedVariableScenes((current) => current.includes(scene) ? current.filter((item) => item !== scene) : [...current, scene]);
  };

  const runVariableModuleAnalysis = async () => {
    if (!selectedVariableModules.length) {
      setVariableModuleOutputs((current) => ({ ...current, _message: "请先选择至少一个需要增补拆解的可变模块。" }));
      return;
    }
    setIsRunningVariableModule(true);
    try {
      const prompt = `${buildVariableModuleAnalysisPrompt(selectedVariableModules, briefBreakdown, fixedModuleOutputs, briefForm)}

资料库引用：
${linkedResourceContext}`;
      if (apiConfig.endpoint.trim()) {
        setVariableModuleOutputs((current) => ({ ...current, _message: "正在生成可变模块分析..." }));
        const response = await fetch("/api/marketing-research-run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            endpoint: apiConfig.endpoint.trim(),
            apiKey: apiConfig.apiKey.trim(),
            model: apiConfig.model.trim() || undefined,
            input: { modules: selectedVariableModules, briefBreakdown, fixedModuleOutputs, briefForm, linkedResources },
            prompt,
            messages: [
              { role: "system", content: "你是资深游戏营销调研专家，正在基于 Brief 和固定模块结果生成可变增补模块分析。" },
              { role: "user", content: prompt },
            ],
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || result.error || "可变模块分析失败。");
        const output = extractAiText(result);
        setVariableModuleOutputs((current) => ({
          ...current,
          _message: "",
          [selectedVariableModules.map((item) => item.scene).join(" + ")]: output || JSON.stringify(result, null, 2),
        }));
      } else {
        const localOutput = selectedVariableModules.map((scenario) => `【${scenario.scene}】
适配判断：基于当前 Brief 拆解，建议围绕该场景补充验证，避免只用固定模块结论直接进入策略。
增补模块：${scenario.modules.join(" / ")}
关键问题：
${scenario.questions.map((item) => `- ${item}`).join("\n")}
建议打法：先补用户接受度、风险雷点和历史案例，再决定是否进入方案主线。
标准输出：${scenario.output}
需补充数据：用户评论、竞品案例、客户资源限制、预算和时间节点。`).join("\n\n");
        setVariableModuleOutputs((current) => ({
          ...current,
          _message: "",
          [selectedVariableModules.map((item) => item.scene).join(" + ")]: localOutput,
        }));
      }
      addJob("可变模块分析", selectedVariableModules.map((item) => item.scene).join(" + "), "营销调研");
    } catch (error) {
      setVariableModuleOutputs((current) => ({ ...current, _message: error instanceof Error ? error.message : "可变模块分析失败。" }));
    } finally {
      setIsRunningVariableModule(false);
    }
  };

  const runFinalReport = async () => {
    setIsRunningFinalReport(true);
    try {
      const prompt = `${buildFinalMarketingResearchReportPrompt({ briefContext: briefBreakdown, fixedOutputs: fixedModuleOutputs, variableOutputs: variableModuleOutputs, form: briefForm })}

资料库引用：
${linkedResourceContext}`;
      if (apiConfig.endpoint.trim()) {
        setFinalReport("正在整合完整营销调研报告...");
        const response = await fetch("/api/marketing-research-run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            endpoint: apiConfig.endpoint.trim(),
            apiKey: apiConfig.apiKey.trim(),
            model: apiConfig.model.trim() || undefined,
            input: { briefBreakdown, fixedModuleOutputs, variableModuleOutputs, briefForm, linkedResources },
            prompt,
            messages: [
              { role: "system", content: "你是资深游戏营销调研负责人，正在整合完整前期调研报告。" },
              { role: "user", content: prompt },
            ],
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || result.error || "完整调研报告生成失败。");
        const output = extractAiText(result);
        setFinalReport(output || JSON.stringify(result, null, 2));
      } else {
        setFinalReport(`一、项目需求总览
${briefBreakdown ? summarize(briefBreakdown) : "尚未生成 Brief 拆解，建议先完成第一步。"}

二、固定模块结论
${Object.entries(fixedModuleOutputs).filter(([key]) => key !== "_message").map(([name, output]) => `【${name}】\n${summarize(output)}`).join("\n\n") || "尚未生成固定模块分析。"}

三、可变模块结论
${Object.entries(variableModuleOutputs).filter(([key]) => key !== "_message").map(([name, output]) => `【${name}】\n${summarize(output)}`).join("\n\n") || "尚未生成可变模块分析。"}

四、营销机会与风险
- 机会：围绕 Brief 中的核心需求，把用户动机、产品卖点、社群文化和竞品差异串成主线。
- 风险：缺少预算、节点、素材授权或社群敏感点证据时，不建议直接进入执行方案。

五、待补充数据与客户确认 QA
- 请确认 KPI、预算区间、时间节点、素材授权、竞品范围、合规限制和最终交付格式。

六、资料库引用
${linkedResources.length ? linkedResources.map((resource) => `- ${resource.title}（${resource.type}）：${resource.summary}`).join("\n") : "- 暂未关联资料库文件。"}`);
      }
      addJob("营销调研报告", `${briefForm.projectName || "未命名项目"} 完整营销调研报告`, "营销调研");
    } catch (error) {
      setFinalReport(error instanceof Error ? error.message : "完整调研报告生成失败。");
    } finally {
      setIsRunningFinalReport(false);
    }
  };

  return (
    <section className="page">
      <PageTitle title="营销调研" subtitle="游戏营销前期调研标准化框架：固定模块统一基础认知，可变模块按 Brief 场景增补。" />

      <WorkbenchAssistStrip status={generationStatus} missingItems={missingInputs} />

      <ResearchFlowStatus steps={flowSteps} activeTab={tab} setTab={setTab} />

      {tab === "brief" && (
        <div className="brief-workbench">
          <Card title="上传 / 输入 Brief">
            <div className="brief-file-panel">
              <label className="upload-zone compact-upload">
                <strong>上传客户 Brief</strong>
                <span>支持 Brief、QA、补充资料、Word、PDF、TXT、Excel</span>
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
                <button className="ghost-button" onClick={parseMarketingBriefFiles} disabled={isParsingFiles}>{isParsingFiles ? "解析中..." : "解析文件"}</button>
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
            <ResourceLinkPicker
              title="关联资料库"
              resources={resources}
              selectedIds={linkedResourceIds}
              onToggle={toggleLinkedResource}
              hint="可选择历史方案、竞品资料、复盘报告、QA 或已沉淀 Brief；AI 会自动带入后续拆解、固定模块、可变模块和最终报告。"
            />
            <RecommendedResources resources={recommendedResources} onAddAll={linkRecommendedResources} />
            <textarea value={briefForm.forbidden} onChange={(event) => setBriefForm({ ...briefForm, forbidden: event.target.value })} placeholder="约束 / 禁忌：预算限制、时间限制、品牌红线、不可触碰话题、素材限制等。" />
            <textarea value={briefForm.brief} onChange={(event) => setBriefForm({ ...briefForm, brief: event.target.value })} placeholder="粘贴 Brief 正文、客户沟通记录、会议纪要或补充说明。" />
            <GlobalAiConfigNotice apiConfig={apiConfig} />
            <button className="primary-button wide" onClick={runBriefBreakdown} disabled={isRunningBrief}>{isRunningBrief ? "拆解中..." : "AI 拆解 Brief"}</button>
          </Card>
          <Card title="Brief 拆解结果">
            <div className="auto-brief-fields">
              <Info label="项目名称" value={extractedBriefInfo.projectName || "待 AI 提取"} />
              <Info label="游戏名称" value={extractedBriefInfo.gameName || "待 AI 提取"} />
              <Info label="项目类型" value={extractedBriefInfo.projectType || "待 AI 提取"} />
              <Info label="营销目标 / 场景" value={extractedBriefInfo.marketingGoal || "待 AI 提取"} />
            </div>
            <div className="brief-output-guide">
              <span>核心需求</span>
              <span>次要需求</span>
              <span>隐性需求</span>
              <span>优先级</span>
              <span>约束条件</span>
            </div>
            <pre className="ai-output">{briefBreakdown || "上传或粘贴 Brief 后，点击“AI 拆解 Brief”。这里会输出核心需求、次要需求、隐性需求、需求优先级、预算/时间/资源/合规约束，以及下一步调研执行清单。"}</pre>
          </Card>
        </div>
      )}

      {tab === "fixed" && (
        <div className="fixed-module-workbench">
          <Card title="Brief 提取上下文">
            <FlowTransferNotice
              status={hasBriefBreakdown ? "已完成" : "缺资料"}
              title={hasBriefBreakdown ? "已自动接收拆 Brief 结果" : "还没有可接收的 Brief 拆解"}
              detail={hasBriefBreakdown ? "本页生成固定模块时，会直接使用第一步输出的核心需求、隐性需求、优先级、约束条件和项目基础信息。" : "先回到“拆 Brief”上传或粘贴客户材料，并生成需求拆解。"}
            />
            <div className="brief-context-box">
              <strong>{briefForm.projectName || "未命名项目"} / {briefForm.gameName || "未填写游戏"}</strong>
              <span>{briefForm.projectType}</span>
              <p>{briefForm.marketingGoal || "尚未填写营销目标/场景。"}</p>
            </div>
            <div className="note-box">
              <strong>上一步拆解结果</strong>
              <p>{briefBreakdown ? summarize(briefBreakdown) : "还没有 Brief 拆解结果。建议先在“拆 Brief”页生成，再进入固定模块深度分析。"}</p>
            </div>
            <LinkedResourceSummary resources={linkedResources} />
            <div className="research-list">
              {fixedResearchModules.map((module, index) => (
                <button
                  key={module.title}
                  className={activeFixedModule === module.title ? "research-item active" : "research-item"}
                  onClick={() => setActiveFixedModule(module.title)}
                >
                  <strong>{index + 1}. {module.title}</strong>
                  <span>{module.output}</span>
                </button>
              ))}
            </div>
          </Card>
          <Card
            title={`${selectedFixedModule.title}深度分析`}
            action={<button className="primary-button" onClick={runFixedModuleAnalysis} disabled={isRunningFixedModule}>{isRunningFixedModule ? "分析中..." : "AI 深度分析"}</button>}
          >
            <p className="muted">{selectedFixedModule.goal}</p>
            <div className="research-grid practical-grid">
              {selectedFixedModule.checklist.map((item) => (
                <div className="research-block practical-block" key={item}>
                  <h3>{item.split("（")[0]}</h3>
                  <p>{item}</p>
                </div>
              ))}
            </div>
            <div className="note-box">
              <strong>本模块会自动使用</strong>
              <p>第一步拆 Brief 的核心需求、次要需求、隐性需求、优先级、预算/时间/资源/合规约束，并结合当前项目基础信息生成分析。</p>
            </div>
            <pre className="ai-output compact">{selectedFixedOutput || `点击“AI 深度分析”后，这里会生成${selectedFixedModule.title}的本次项目分析结论、逐项判断、方案可用内容和补数清单。`}</pre>
          </Card>
        </div>
      )}

      {tab === "variable" && (
        <div className="variable-layout">
          <Card title="客户选择额外模块">
            <FlowTransferNotice
              status={hasBriefBreakdown ? (hasVariableSelection ? "可继续生成" : "缺资料") : "缺资料"}
              title={hasBriefBreakdown ? "Brief 拆解已带入本页" : "等待 Brief 拆解"}
              detail={hasBriefBreakdown ? "客户在这里选择需要额外深挖的场景，AI 会结合 Brief 与固定模块结论生成可变模块分析。" : "先完成拆 Brief，本页才有明确的选择依据。"}
            />
            <div className="note-box">
              <strong>系统会参考 Brief 拆解</strong>
              <p>{briefBreakdown ? summarize(briefBreakdown) : "请先完成拆 Brief。下方可由客户选择本次需要额外深挖的营销场景。"}</p>
            </div>
            <LinkedResourceSummary resources={linkedResources} />
            <div className="research-list">
              {variableResearchScenarios.map((scenario) => (
                <button
                  key={scenario.scene}
                  className={selectedVariableScenes.includes(scenario.scene) ? "research-item active" : "research-item"}
                  onClick={() => toggleVariableScene(scenario.scene)}
                >
                  <strong>{scenario.scene}</strong>
                  <span>{scenario.output}</span>
                </button>
              ))}
            </div>
          </Card>
          <Card
            title="可变模块深度分析"
            action={<button className="primary-button" onClick={runVariableModuleAnalysis} disabled={isRunningVariableModule}>{isRunningVariableModule ? "分析中..." : "AI 分析所选模块"}</button>}
          >
            <div className="tag-row">
              {selectedVariableModules.length ? selectedVariableModules.map((scenario) => <span key={scenario.scene}>{scenario.scene}</span>) : <span>尚未选择额外模块</span>}
            </div>
            <div className="research-grid practical-grid">
              {selectedVariableModules.map((scenario) => (
                <div className="research-block practical-block" key={scenario.scene}>
                  <h3>{scenario.scene}</h3>
                  <div className="tag-row">{scenario.modules.map((item) => <span key={item}>{item}</span>)}</div>
                  <ul className="template-list">
                    {scenario.questions.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <pre className="ai-output compact">
              {variableModuleOutputs._message || Object.entries(variableModuleOutputs).filter(([key]) => key !== "_message").map(([name, output]) => `【${name}】\n${output}`).join("\n\n") || "选择客户需要的额外模块后，点击“AI 分析所选模块”。这里会基于 Brief 拆解和固定模块结果生成场景增补分析。"}
            </pre>
          </Card>
        </div>
      )}

      {tab === "report" && (
        <Card
          title="完整营销调研报告"
          action={(
            <div className="inline-actions">
              <button className="ghost-button" onClick={exportFinalReport} disabled={!finalReport}>导出报告</button>
              <button className="ghost-button" onClick={reuseReportForScript} disabled={!finalReport}>复用到讲稿</button>
              <button className="primary-button" onClick={runFinalReport} disabled={isRunningFinalReport}>{isRunningFinalReport ? "整理中..." : "生成完整报告"}</button>
            </div>
          )}
        >
          <FlowTransferNotice
            status={finalReport ? "已完成" : hasBriefBreakdown && fixedDoneCount > 0 ? "可继续生成" : "缺资料"}
            title={finalReport ? "报告已生成" : "前序结果自动汇总到这里"}
            detail={finalReport ? "这份报告可继续给方案大纲、PPT 或讲稿模块使用。" : "系统会合并 Brief 拆解、固定模块分析和客户选择的可变模块结论，整理成一份完整营销调研报告。"}
          />
          <div className="report-source-grid">
            <Info label="Brief 拆解" value={briefBreakdown ? "已生成" : "未生成"} />
            <Info label="固定模块" value={`${fixedDoneCount} / ${fixedResearchModules.length}`} />
            <Info label="可变模块" value={`${variableDoneCount} 组`} />
            <Info label="资料库引用" value={`${linkedResources.length} 份`} />
          </div>
          <pre className="ai-output">{finalReport || "点击“生成完整报告”后，系统会把 Brief 拆解、固定模块分析、客户选择的可变模块分析统一整理成一份完整的营销调研报告。"}</pre>
        </Card>
      )}
    </section>
  );
}

function ResearchFlowStatus({
  steps,
  activeTab,
  setTab,
}: {
  steps: FlowStep[];
  activeTab: ResearchTab;
  setTab: (tab: ResearchTab) => void;
}) {
  return (
    <div className="research-flow-status" aria-label="营销调研状态流">
      {steps.map((step, index) => (
        <button
          key={step.key}
          className={`flow-status-card ${activeTab === step.key ? "active" : ""} ${flowStatusClass(step.status)}`}
          onClick={() => setTab(step.key)}
        >
          <span className="flow-index">{index + 1}</span>
          <div>
            <div className="flow-card-head">
              <strong>{step.title}</strong>
              <em>{step.status}</em>
            </div>
            <p>{step.detail}</p>
            <small>{step.transfer}</small>
          </div>
        </button>
      ))}
    </div>
  );
}

function FlowTransferNotice({ status, title, detail }: { status: FlowStepStatus; title: string; detail: string }) {
  return (
    <div className={`flow-transfer-notice ${flowStatusClass(status)}`}>
      <span>{status}</span>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}

function flowStatusClass(status: FlowStepStatus) {
  if (status === "已完成") return "done";
  if (status === "可继续生成") return "ready";
  return "missing";
}

function GlobalAiConfigNotice({ apiConfig }: { apiConfig: BriefApiConfig }) {
  const isConfigured = Boolean(apiConfig.endpoint.trim());
  return (
    <div className={`global-ai-config-notice ${isConfigured ? "configured" : "fallback"}`}>
      <span>{isConfigured ? "已使用全局 AI" : "本地兜底"}</span>
      <div>
        <strong>{isConfigured ? "接口配置来自系统设置" : "系统设置未配置 AI 接口"}</strong>
        <p>{isConfigured ? `当前模型：${apiConfig.model || "未指定，由接口默认处理"}。如需修改接口、Key 或模型，请到系统设置统一调整。` : "当前页面会先使用本地规则生成；如需调用外部模型，请到系统设置填写全局 AI 配置。"}</p>
      </div>
    </div>
  );
}

function WorkbenchAssistStrip({ status, missingItems }: { status: string; missingItems: string[] }) {
  return (
    <div className="workbench-assist-strip">
      <div>
        <strong>当前状态</strong>
        <p>{status}</p>
      </div>
      <div>
        <strong>{missingItems.length ? "建议补充" : "资料状态"}</strong>
        {missingItems.length ? (
          <div className="tag-row">{missingItems.map((item) => <span key={item}>{item}</span>)}</div>
        ) : (
          <p>关键资料已比较完整，可以继续生成或导出。</p>
        )}
      </div>
    </div>
  );
}

function RecommendedResources({ resources, onAddAll }: { resources: Resource[]; onAddAll: () => void }) {
  if (!resources.length) return null;
  return (
    <div className="recommended-resources">
      <div className="resource-link-head">
        <div>
          <strong>智能推荐资料</strong>
          <p>根据当前 Brief、营销目标和已生成内容自动匹配，建议一键带入。</p>
        </div>
        <button className="ghost-button" onClick={onAddAll}>全部关联</button>
      </div>
      <div className="tag-row">
        {resources.map((resource) => <span key={resource.id}>{resource.title}</span>)}
      </div>
    </div>
  );
}

function ResourceLinkPicker({
  title,
  resources,
  selectedIds,
  onToggle,
  hint,
}: {
  title: string;
  resources: Resource[];
  selectedIds: number[];
  onToggle: (resourceId: number) => void;
  hint: string;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const resourceTypes = Array.from(new Set(resources.map((resource) => resource.type).filter(Boolean)));
  const filteredResources = resources
    .filter((resource) => !typeFilter || resource.type === typeFilter)
    .filter((resource) => includesQuery([resource.title, resource.type, resource.summary, resource.content, ...(resource.tags || [])], query))
    .slice(0, 12);

  return (
    <div className="resource-link-picker">
      <div className="resource-link-head">
        <div>
          <strong>{title}</strong>
          <p>{hint}</p>
        </div>
        <span>{selectedIds.length} 份已关联</span>
      </div>
      <div className="resource-link-tools">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索资料、标签、摘要" />
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="">全部类型</option>
          {resourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>
      <div className="resource-link-list">
        {filteredResources.length ? filteredResources.map((resource) => {
          const checked = selectedIds.includes(resource.id);
          return (
            <button key={resource.id} className={checked ? "resource-link-item active" : "resource-link-item"} onClick={() => onToggle(resource.id)}>
              <span>{checked ? "已选" : "选择"}</span>
              <div>
                <strong>{resource.title}</strong>
                <p>{resource.type} / {(resource.tags || []).slice(0, 3).join(" / ") || "无标签"}</p>
                <small>{resource.summary || summarize(resource.content || "")}</small>
              </div>
            </button>
          );
        }) : <div className="empty-state compact">没有匹配的资料。</div>}
      </div>
    </div>
  );
}

function LinkedResourceSummary({ resources }: { resources: Resource[] }) {
  return (
    <div className="linked-resource-summary">
      <strong>资料库引用</strong>
      {resources.length ? (
        <div className="tag-row">
          {resources.map((resource) => <span key={resource.id}>{resource.title}</span>)}
        </div>
      ) : (
        <p>暂未关联资料库文件。可在“拆 Brief”页选择历史方案、竞品资料或复盘报告。</p>
      )}
    </div>
  );
}

function PeopleManagement({
  members,
  setMembers,
  projects,
  isAdmin,
  initialDetailView,
  clearInitialDetailView,
  openProject,
  addJob,
}: {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  projects: Project[];
  isAdmin: boolean;
  initialDetailView: PeopleDetailView | null;
  clearInitialDetailView: () => void;
  openProject: (id: number, initialTab?: string) => void;
  addJob: (type: string, name: string, source: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [advice, setAdvice] = useState("");
  const [detailView, setDetailView] = useState<PeopleDetailView | null>(initialDetailView);
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

  useEffect(() => {
    if (!initialDetailView) return;
    setDetailView(initialDetailView);
    clearInitialDetailView();
  }, [clearInitialDetailView, initialDetailView]);
  const activeTaskRows = projects.flatMap((project) => project.tasks
    .filter((task) => task.status !== "已完成")
    .map((task) => ({ project, task, owner: memberName(members, task.ownerId, task.owner), risk: inferTaskRisk(task, project) })));
  const delayedTaskRows = activeTaskRows.filter(({ task }) => task.status === "延期");
  const overloadedRows = taskStats.filter((item) => item.loadStatus === "偏高" || item.loadStatus === "过载");
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
        action={isAdmin ? <button className="primary-button" onClick={() => setShowForm((current) => !current)}>新增成员</button> : <span className="soft-pill">只读模式</span>}
      />
      <div className="metric-grid">
        <Metric label="团队成员" value={members.length} tone="blue" onClick={() => setDetailView("members")} />
        <Metric label="进行中任务" value={activeTaskRows.length} tone="green" onClick={() => setDetailView("active")} />
        <Metric label="偏高负载" value={overloadedRows.length} tone="orange" onClick={() => setDetailView("overload")} />
        <Metric label="延期任务" value={delayedTaskRows.length} tone="red" onClick={() => setDetailView("delayed")} />
      </div>
      {detailView && (
        <Card
          title={{
            members: "团队成员详情",
            active: "进行中任务详情",
            overload: "偏高负载详情",
            delayed: "延期任务详情",
          }[detailView]}
          action={<button className="ghost-button" onClick={() => setDetailView(null)}>返回总览</button>}
        >
          {detailView === "members" && (
            <div className="table-scroll">
              <table className="joined-table">
                <thead>
                  <tr>
                    <th>成员</th>
                    <th>角色</th>
                    <th>状态</th>
                    <th>未完成任务</th>
                    <th>延期任务</th>
                    <th>容量</th>
                    <th>负载</th>
                    <th>能力标签</th>
                  </tr>
                </thead>
                <tbody>
                  {taskStats.map(({ member, activeTasks, delayedTasks, loadRate, loadStatus }) => (
                    <tr key={member.id}>
                      <td><strong>{member.name}</strong></td>
                      <td>{member.role}</td>
                      <td>{member.status}</td>
                      <td>{activeTasks.length}</td>
                      <td>{delayedTasks.length}</td>
                      <td>{member.monthlyCapacity}</td>
                      <td>{loadStatus} / {loadRate}%</td>
                      <td>{member.skills.join("、")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {detailView === "active" && (
            <PeopleTaskDetailTable rows={activeTaskRows} openProject={openProject} />
          )}
          {detailView === "delayed" && (
            <PeopleTaskDetailTable rows={delayedTaskRows} openProject={openProject} />
          )}
          {detailView === "overload" && (
            <div className="table-scroll">
              <table className="joined-table">
                <thead>
                  <tr>
                    <th>成员</th>
                    <th>角色</th>
                    <th>负载</th>
                    <th>未完成任务</th>
                    <th>延期任务</th>
                    <th>状态</th>
                    <th>建议</th>
                  </tr>
                </thead>
                <tbody>
                  {overloadedRows.map(({ member, activeTasks, delayedTasks, loadRate, loadStatus }) => (
                    <tr key={member.id}>
                      <td><strong>{member.name}</strong></td>
                      <td>{member.role}</td>
                      <td>{loadStatus} / {loadRate}%</td>
                      <td>{activeTasks.length}</td>
                      <td>{delayedTasks.length}</td>
                      <td>{member.status}</td>
                      <td>{delayedTasks.length ? "优先拆分延期任务并设置备份负责人" : "控制新增任务，保留讲标和临时修改缓冲"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
      <div className="assignment-master">
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
      </div>
      {showForm && isAdmin && (
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
      <div className="people-compact-section">
        <div className="section-mini-title">
          <strong>人员名单</strong>
          <span>轻量维护成员状态、容量和能力标签</span>
        </div>
      <div className="people-grid compact-people-grid">
        {taskStats.map(({ member, activeTasks, delayedTasks, loadRate, loadStatus }) => (
          <Card title={member.name} key={member.id}>
            <div className="person-card">
              {isAdmin ? (
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
              ) : (
                <div className="readonly-member-head">
                  <strong>{member.role}</strong>
                  <span>{member.status}</span>
                </div>
              )}
              <Progress value={Math.min(loadRate, 100)} />
              <div className="person-stats">
                <Info label="未完成任务" value={`${activeTasks.length} 个`} />
                <Info label="延期任务" value={`${delayedTasks.length} 个`} />
                <Info label="负载状态" value={loadStatus} />
              </div>
              {isAdmin && (
                <div className="editable-stack">
                  <Field label="月度容量" type="number" value={`${member.monthlyCapacity}`} onChange={(value) => updateMember(member.id, "monthlyCapacity", Number(value) || 0)} />
                  <Field label="平均交付天数" type="number" value={`${member.avgDeliveryDays}`} onChange={(value) => updateMember(member.id, "avgDeliveryDays", Number(value) || 0)} />
                  <Field label="能力标签" value={member.skills.join(", ")} onChange={(value) => updateMember(member.id, "skills", value.split(/[,，]/).map((skill) => skill.trim()).filter(Boolean))} />
                </div>
              )}
              <div className="tag-row">{member.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
              {isAdmin && <button className="link-button danger" onClick={() => removeMember(member.id)}>删除成员</button>}
            </div>
          </Card>
        ))}
      </div>
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
                  <td>{isAdmin ? <input className="table-input" value={member.name} onChange={(event) => updateMember(member.id, "name", event.target.value)} /> : member.name}</td>
                  <td>{isAdmin ? <input className="table-input" value={member.role} onChange={(event) => updateMember(member.id, "role", event.target.value)} /> : member.role}</td>
                  <td>
                    {isAdmin ? (
                      <select className="table-input" value={member.status} onChange={(event) => updateMember(member.id, "status", event.target.value as Member["status"])}>
                        {memberStatusOptions.map((status) => <option key={status}>{status}</option>)}
                      </select>
                    ) : member.status}
                  </td>
                  <td>{activeTasks.length}</td>
                  <td>{delayedTasks.length}</td>
                  <td>{isAdmin ? <input className="table-input tiny" type="number" value={member.monthlyCapacity} onChange={(event) => updateMember(member.id, "monthlyCapacity", Number(event.target.value) || 0)} /> : member.monthlyCapacity}</td>
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

function PeopleTaskDetailTable({
  rows,
  openProject,
}: {
  rows: Array<{ project: Project; task: ProjectTask; owner: string; risk: Risk }>;
  openProject: (id: number, initialTab?: string) => void;
}) {
  return (
    <div className="table-scroll">
      <table className="joined-table">
        <thead>
          <tr>
            <th>任务</th>
            <th>项目</th>
            <th>负责人</th>
            <th>阶段</th>
            <th>进度</th>
            <th>状态</th>
            <th>风险</th>
            <th>截止</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map(({ project, task, owner, risk }) => (
            <tr key={`${project.id}-${task.id}`}>
              <td><strong>{task.name}</strong></td>
              <td>{project.name}</td>
              <td>{owner}</td>
              <td>{task.phase}</td>
              <td>
                <div className="table-progress">
                  <Progress value={task.progress} />
                  <span>{task.progress}%</span>
                </div>
              </td>
              <td>{task.status}</td>
              <td><RiskBadge risk={risk} /></td>
              <td>{task.end}</td>
              <td><button className="link-button" onClick={() => openProject(project.id, "排期表")}>查看排期</button></td>
            </tr>
          )) : (
            <tr>
              <td colSpan={9}>暂无对应任务。</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AiJobs({ jobs, embedded = false }: { jobs: AiJob[]; embedded?: boolean }) {
  return (
    <section className={embedded ? "" : "page"}>
      {!embedded && <PageTitle title="AI 任务记录" subtitle="追踪文档解析、Brief 解析、PPT 模板、内容检查和排期生成任务。" />}
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

type ScriptForm = {
  usage: string;
  duration: string;
  tone: string;
  speakerStyle: string;
};

function buildScriptPrompt(form: ScriptForm, files: BriefInputFile[]) {
  const parsedPpt = files.length
    ? files.map((file, index) => `【文件 ${index + 1}】${file.name}
解析状态：${file.parseStatus}${file.parseError ? `（${file.parseError}）` : ""}
摘要：${file.summary}
正文：
${file.content || "暂无可解析正文"}`).join("\n\n")
    : "暂无上传文件";
  return `你是资深游戏营销提案讲稿教练。请基于用户输入生成适合宣讲使用的讲稿输出。

讲稿场景：
讲稿用途：${form.usage || "未填写"}
演讲时长：${form.duration || "未填写"}
演讲调性：${form.tone || "未填写"}

核心素材：
上传 PPT / 方案文件解析内容：
${parsedPpt}

演讲者风格：
${form.speakerStyle || "未填写"}

补充要求：
请从上传文件中自动识别必讲模块、客户关注重点、禁忌内容和互动环节机会；识别不到请标注“需补充确认”。

请输出：
一、多场景讲稿定位
- 判断该讲稿属于客户提案、内部汇报、投标答辩、项目复盘、发布会或内部培训中的哪类。
- 给出适配的开场策略、内容重点和收尾策略。

二、逐页 / 逐模块宣讲逐字稿
- 按 PPT 或方案模块拆分。
- 每页包含：讲稿正文、这一页要强调的重点、上一页到下一页的逻辑衔接。
- 标注语气和节奏提示，例如“此处语气坚定”“此处放慢语速”“停顿 2 秒”。

三、多版本时长适配
- 输出 ${form.duration || "当前时长"} 主版本。
- 同时给出 15 分钟 / 30 分钟 / 60 分钟版本的删减或扩展建议。

四、风格化表达
- 按“${form.tone || "专业严谨"}”调性提供表达方式。
- 提炼 3-5 句宣讲金句或记忆点。

五、宣讲辅助物料
- 讲前准备清单。
- 客户可能追问的问题与答法。
- 可插入的互动问题。
- 需要提前确认的素材、数据或资源。

规则：
1. 不要编造 PPT 中没有的事实；没有数据就标注“需补充数据”。
2. 禁忌内容必须避开。
3. 讲稿要像人能直接照着讲，不要只写大纲。
4. 控制节奏，避免每页都冗长。`;
}

function buildLocalScriptOutput(form: ScriptForm, files: BriefInputFile[]) {
  const usage = form.usage || "客户提案";
  const duration = form.duration || "20分钟";
  const tone = form.tone || "专业严谨";
  const parsedText = files.map((file) => `${file.summary}\n${file.content}`).join("\n");
  const modules = Array.from(parsedText.matchAll(/第\s*\d+\s*页\s*\n([^\n]+)/g)).map((match) => match[1].trim()).filter(Boolean).slice(0, 8);
  const fallbackModules = ["方案核心策略", "执行计划", "优势亮点"];
  const moduleList = modules.length ? modules : fallbackModules;
  return `一、多场景讲稿定位
- 场景判断：${usage}。
- 时长目标：${duration}，建议采用“背景破题 - 核心策略 - 执行落地 - 优势收束”的结构。
- 演讲调性：${tone}，表达要兼顾专业判断和可落地说明。

二、逐页 / 逐模块宣讲逐字稿
${moduleList.map((module, index) => `【${index + 1}. ${module}】
讲稿正文：这一部分我们重点说明${module}。结合本次方案的核心亮点，建议先讲为什么这个模块重要，再讲我们怎么做，最后讲它对客户关注的预算、执行难度或效果预期有什么帮助。
宣讲重点：${files.length ? "基于上传 PPT 解析内容提炼。" : "需上传 PPT 或方案文件。"}
逻辑衔接：讲完本页后，顺势过渡到下一部分的落地动作或效果判断。
语气节奏：此处语气保持${tone}；关键结论前停顿 1 秒，避免语速过快。`).join("\n\n")}

三、多版本时长适配
- 15 分钟版：保留背景、核心策略、执行计划、优势亮点，每个模块控制 2-3 分钟。
- 30 分钟版：补充客户关注重点、案例依据和风险预案。
- 60 分钟版：加入详细执行拆解、预算解释、互动问答和备选方案说明。

四、风格化表达
- 宣讲金句 1：这套方案不只解决“怎么做”，更回答“为什么现在做、为什么这样做”。
- 宣讲金句 2：我们把创意、执行和风险放在同一条链路里，确保方案既好讲，也能落地。
- 宣讲金句 3：所有动作都会围绕客户最关心的“效果预期与落地确定性”来收束。

五、宣讲辅助物料
- 讲前准备：确认 PPT 页码、预算口径、执行节点、案例素材、禁忌内容。
- 可能追问：预算是否可控？执行难度在哪里？效果如何预估？资源是否确定？
- 建议答法：先回应客户关注点，再给依据和备选方案。
- 互动设计：可在核心策略讲完后加入一句提问：这个方向是否符合贵方对本次项目的优先级判断？
- 禁忌提醒：请讲前确认未确定资源、成本细节和效果数据是否可提。`;
}

function ScriptAssistant({ resources, addJob }: { resources: Resource[]; addJob: (type: string, name: string, source: string) => void }) {
  const [apiConfig] = useGlobalAiConfig();
  const [form, setForm] = usePersistentState<ScriptForm>("strategy-center-script-form", {
    usage: "客户提案",
    duration: "20分钟",
    tone: "专业严谨",
    speakerStyle: "语速适中，表达直接",
  });
  const [output, setOutput] = usePersistentState("strategy-center-script-output", "");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parsedFiles, setParsedFiles] = useState<BriefInputFile[]>([]);
  const [linkedResourceIds, setLinkedResourceIds] = usePersistentState<number[]>("strategy-center-script-linked-resources", []);
  const [fileMessage, setFileMessage] = useState("");
  const [isParsingFiles, setIsParsingFiles] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const updateForm = (key: keyof ScriptForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };
  const linkedResources = resources.filter((resource) => linkedResourceIds.includes(resource.id));
  const linkedResourceFiles = linkedResources.map(resourceToInputFile);
  const scriptRecommendationContext = `${form.usage} ${form.duration} ${form.tone} ${form.speakerStyle} ${parsedFiles.map((file) => `${file.name} ${file.summary}`).join(" ")}`;
  const recommendedResources = resources
    .filter((resource) => !linkedResourceIds.includes(resource.id))
    .map((resource) => ({ resource, score: scoreResource(resource, scriptRecommendationContext) }))
    .filter((item) => item.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.resource);
  const missingScriptInputs = [
    !form.usage.trim() && "讲稿用途",
    !form.duration.trim() && "演讲时长",
    !form.tone.trim() && "演讲调性",
    !form.speakerStyle.trim() && "演讲者风格",
    !selectedFiles.length && !parsedFiles.length && !linkedResources.length && "PPT / 方案素材",
    linkedResources.length === 0 && "历史方案 / 复盘报告 / 客户关注资料",
  ].filter(Boolean) as string[];
  const scriptStatus = isRunning ? "正在生成讲稿" : output ? "讲稿已生成，可导出" : parsedFiles.length || linkedResources.length ? "素材已进入讲稿工作台" : "等待上传或关联素材";

  const toggleLinkedResource = (resourceId: number) => {
    setLinkedResourceIds((current) => current.includes(resourceId) ? current.filter((id) => id !== resourceId) : [...current, resourceId]);
  };

  const linkRecommendedResources = () => {
    setLinkedResourceIds((current) => Array.from(new Set([...current, ...recommendedResources.map((resource) => resource.id)])));
  };

  const exportScript = () => {
    downloadMarkdown(`讲稿输出-${form.usage || today()}.md`, "讲稿输出", output);
  };

  const addScriptFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setSelectedFiles((current) => {
      const next = [...current];
      Array.from(fileList).forEach((file) => {
        const exists = next.some((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified);
        if (!exists) next.push(file);
      });
      return next;
    });
    setFileMessage("已加入文件，点击解析文件后会读取 PPT/方案内容。");
  };

  const removeScriptFile = (index: number) => {
    setSelectedFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const parseScriptFiles = async () => {
    if (!selectedFiles.length) {
      setFileMessage("请先上传 PPT 或方案文件。");
      return parsedFiles;
    }
    setIsParsingFiles(true);
    setFileMessage("");
    try {
      const body = new FormData();
      selectedFiles.forEach((file) => body.append("files", file));
      body.append("type", "讲稿素材");
      body.append("title", "讲稿输入文件");
      const response = await fetch("/api/resources/upload", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "讲稿文件解析失败。");
      const files = (result.resources ?? []).map((item: Partial<BriefInputFile & Resource>) => ({
        id: item.id ?? Date.now(),
        name: item.name ?? item.fileName ?? item.title ?? "讲稿输入文件",
        fileSize: item.fileSize,
        mimeType: item.mimeType,
        parseStatus: item.parseStatus === "失败" ? "失败" : "成功",
        parseError: item.parseError,
        summary: item.summary ?? summarize(item.content ?? ""),
        content: item.content ?? "",
        structuredContent: item.structuredContent,
      })) as BriefInputFile[];
      setParsedFiles(files);
      setFileMessage(`已解析 ${files.length} 个文件。`);
      addJob("讲稿素材解析", `解析 ${files.length} 个讲稿输入文件`, "讲稿输出");
      return files;
    } catch (error) {
      setFileMessage(error instanceof Error ? error.message : "讲稿文件解析失败。");
      return parsedFiles;
    } finally {
      setIsParsingFiles(false);
    }
  };

  const runScript = async () => {
    setIsRunning(true);
    try {
      const inputFiles = selectedFiles.length && !parsedFiles.length ? await parseScriptFiles() : parsedFiles;
      const combinedFiles = [...inputFiles, ...linkedResourceFiles];
      const prompt = buildScriptPrompt(form, combinedFiles);
      if (apiConfig.endpoint.trim()) {
        setOutput("正在生成讲稿...");
        const response = await fetch("/api/marketing-research-run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            endpoint: apiConfig.endpoint.trim(),
            apiKey: apiConfig.apiKey.trim(),
            model: apiConfig.model.trim() || undefined,
            input: { ...form, files: combinedFiles.map((file) => ({ name: file.name, summary: file.summary, content: file.content })), linkedResources },
            prompt,
            messages: [
              { role: "system", content: "你是资深游戏营销提案讲稿教练，擅长把 PPT 和方案内容转成可直接宣讲的逐字稿、节奏提示和答辩辅助物料。" },
              { role: "user", content: prompt },
            ],
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || result.error || "讲稿生成失败。");
        const text = extractAiText(result);
        setOutput(text || JSON.stringify(result, null, 2));
      } else {
        setOutput(buildLocalScriptOutput(form, combinedFiles));
      }
      addJob("讲稿生成", `${form.usage || "未命名"} ${form.duration || ""}讲稿`, "讲稿输出");
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "讲稿生成失败。");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="page">
      <PageTitle title="讲稿输出" subtitle="把方案 PPT、核心亮点和客户关注点转成可直接宣讲的逐字稿、节奏提示和答辩辅助物料。" />
      <WorkbenchAssistStrip status={scriptStatus} missingItems={missingScriptInputs} />
      <div className="script-workbench">
        <Card title="讲稿输入">
          <div className="form-grid">
            <Field label="讲稿用途" value={form.usage} onChange={(value) => updateForm("usage", value)} />
            <Field label="演讲时长" value={form.duration} onChange={(value) => updateForm("duration", value)} />
            <Field label="演讲调性" value={form.tone} onChange={(value) => updateForm("tone", value)} />
            <Field label="演讲者风格" value={form.speakerStyle} onChange={(value) => updateForm("speakerStyle", value)} />
          </div>
          <div className="brief-file-panel">
            <label className="upload-zone compact-upload">
              <strong>上传 PPT / 方案文件</strong>
              <span>支持 PPTX、Word、PDF、TXT、Excel；AI 会读取文件内容自动识别核心亮点、客户关注点、必讲模块、禁忌与互动机会</span>
              <input type="file" multiple accept=".pptx,.docx,.pdf,.txt,.md,.xlsx,.xls,.csv" onChange={(event) => addScriptFiles(event.target.files)} />
              <em>{selectedFiles.length ? `已选择 ${selectedFiles.length} 个文件` : "点击选择文件"}</em>
            </label>
            {selectedFiles.length > 0 && (
              <div className="file-list">
                {selectedFiles.map((file, index) => (
                  <div className="file-item" key={`${file.name}-${file.size}-${file.lastModified}`}>
                    <span>{file.name}</span>
                    <button className="link-button danger" onClick={() => removeScriptFile(index)}>移除</button>
                  </div>
                ))}
              </div>
            )}
            <div className="inline-actions">
              <button className="ghost-button" onClick={parseScriptFiles} disabled={isParsingFiles}>{isParsingFiles ? "解析中..." : "解析文件"}</button>
              {fileMessage && <span>{fileMessage}</span>}
            </div>
            {parsedFiles.length > 0 && (
              <div className="brief-input-list">
                {parsedFiles.map((file) => (
                  <div className="brief-input-card" key={file.id}>
                    <strong>{file.name}</strong>
                    <span>{formatFileSize(file.fileSize)} / {file.parseStatus}</span>
                    <p>{file.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <ResourceLinkPicker
            title="关联资料库"
            resources={resources}
            selectedIds={linkedResourceIds}
            onToggle={toggleLinkedResource}
            hint="可选择完整方案 PPT、历史方案、客户关注资料、复盘报告或竞品资料；AI 会和上传文件一起读取并生成讲稿。"
          />
          <RecommendedResources resources={recommendedResources} onAddAll={linkRecommendedResources} />
          <GlobalAiConfigNotice apiConfig={apiConfig} />
          <button className="primary-button wide" onClick={runScript} disabled={isRunning}>{isRunning ? "生成中..." : "生成讲稿"}</button>
        </Card>
        <Card title="讲稿与辅助物料" action={<button className="ghost-button" onClick={exportScript} disabled={!output}>导出讲稿</button>}>
          <div className="brief-output-guide">
            <span>逐字稿</span>
            <span>时长版本</span>
            <span>语气节奏</span>
            <span>宣讲金句</span>
            <span>答辩物料</span>
          </div>
          <pre className="ai-output">{output || "填写左侧信息后，点击“生成讲稿”。这里会输出多场景讲稿、逐页宣讲稿、多版本时长适配、语气节奏提示和宣讲辅助物料。"}</pre>
        </Card>
      </div>
    </section>
  );
}

const marketingResearchModules = [
  {
    name: "固定模块整合",
    summary: "一次性生成用户深度调查、黑话文化、产品自身、竞品行业四个必做模块。",
  },
  ...variableResearchScenarios.map((scenario) => ({
    name: scenario.scene,
    summary: `${scenario.modules.join(" / ")}；输出 ${scenario.output}。`,
  })),
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
  固定模块整合: {
    projectName: "",
    gameName: "",
    gameType: "",
    marketingGoal: "",
    currentVersion: "",
    targetMarket: "",
    existingMaterials: "",
    userSignals: "",
    competitorSignals: "",
    extraNotes: "",
  },
  ...Object.fromEntries(variableResearchScenarios.map((scenario) => [scenario.scene, {
    projectName: "",
    gameName: "",
    marketingGoal: scenario.scene,
    productInfo: "",
    userEvidence: "",
    historicalCases: "",
    riskNotes: "",
    extraNotes: "",
  }])),
};

const marketingResearchFormConfigs: Record<string, { title: string; apiTitle: string; fields: Array<{ key: string; label: string; placeholder?: string }>; textareas: Array<{ key: string; placeholder: string }> }> = {
  固定模块整合: {
    title: "固定模块整合生成",
    apiTitle: "标准框架 API",
    fields: [
      { key: "projectName", label: "项目 / 游戏名称", placeholder: "例如：周年庆前期调研" },
      { key: "gameName", label: "游戏名称", placeholder: "例如：蛋仔派对" },
      { key: "gameType", label: "游戏类型", placeholder: "例如：二次元 RPG / SLG / 竞技手游" },
      { key: "marketingGoal", label: "营销目标", placeholder: "例如：版本拉新、老玩家回流、品牌联动" },
      { key: "currentVersion", label: "当前版本 / 节点", placeholder: "例如：暑期大版本 / 新角色上线" },
      { key: "targetMarket", label: "核心市场", placeholder: "例如：国内安卓渠道 / 港澳台 / 东南亚" },
    ],
    textareas: [
      { key: "existingMaterials", placeholder: "粘贴已有资料：Brief、过往调研、项目资料、版本信息、品宣口径等。" },
      { key: "userSignals", placeholder: "粘贴用户信号：评论、社区讨论、玩家梗、内容偏好、渠道表现、投放反馈等。" },
      { key: "competitorSignals", placeholder: "粘贴竞品 / 行业信息：近3个月竞品动作、翻车案例、行业热门营销形式、政策合规要求等。" },
      { key: "extraNotes", placeholder: "补充限制：禁忌表达、客户要求、必须覆盖或可跳过的资料模块等。" },
    ],
  },
  ...Object.fromEntries(variableResearchScenarios.map((scenario) => [scenario.scene, {
    title: `${scenario.scene}增补调研生成`,
    apiTitle: `${scenario.scene} API`,
    fields: [
      { key: "projectName", label: "项目 / 游戏名称", placeholder: "例如：暑期版本营销" },
      { key: "gameName", label: "游戏名称", placeholder: "例如：蛋仔派对" },
      { key: "marketingGoal", label: "营销目标", placeholder: scenario.scene },
    ],
    textareas: [
      { key: "productInfo", placeholder: "粘贴产品 / 版本 / 活动信息：核心卖点、限制条件、可用资源、品宣口径等。" },
      { key: "userEvidence", placeholder: `围绕关键问题投喂用户证据：${scenario.questions.slice(0, 3).join("；")}` },
      { key: "historicalCases", placeholder: "粘贴历史案例：同 IP、同赛道、竞品或过往项目表现，含好评点、翻车点、可复用素材。" },
      { key: "riskNotes", placeholder: "粘贴风险信息：舆情、合规、品牌雷点、玩家反感点、执行限制。" },
      { key: "extraNotes", placeholder: "补充信息：客户特别关注点、必须回答的问题、输出偏好等。" },
    ],
  }])),
};

function buildMarketingResearchPrompt(moduleName: string, form: MarketingResearchForm) {
  const formLines = Object.entries(form).map(([key, value]) => `${key}：${value || "未填写"}`).join("\n");
  const variableScenario = variableResearchScenarios.find((scenario) => scenario.scene === moduleName);
  const fixedStructure = fixedResearchModules
    .map((module, index) => `${index + 1}. ${module.title}
- 输出物：${module.output}
- 必答项：
${module.checklist.map((item) => `  - ${item}`).join("\n")}`)
    .join("\n\n");
  const variableStructure = variableScenario
    ? `增补场景：${variableScenario.scene}
增补模块：${variableScenario.modules.join(" / ")}
关键问题：
${variableScenario.questions.map((item) => `- ${item}`).join("\n")}
标准输出：${variableScenario.output}`
    : "";

  return `你是资深游戏营销前期调研专家，请基于用户投喂的信息生成“${moduleName}”。

输出要求：
1. 必须用中文输出，结构清晰，可直接放入营销策略方案。
2. 不要编造精确数据；未提供的数据请标注“需补充数据”或“基于输入推断”。
3. 明确区分事实、推断、风险和行动建议。
4. 每个结论都要能转化为方案动作、素材方向、风险规避或后续补数需求。
5. 已有资料充分的部分可标注“已有资料覆盖”，但固定模块不能漏项。

请按以下结构输出：
${moduleName === "固定模块整合" ? `一、固定模块调研结论
${fixedStructure}

二、跨模块关键判断
- 用户最核心的内容钩子
- 当前产品最适合放大的卖点
- 传播触点优先级
- 必须规避的黑话/文化/舆情雷点

三、下一步执行清单
- 可直接进入方案的结论
- 需要补充的数据
- 推荐优先制作的素材方向` : `一、可变场景调研结论
${variableStructure}

二、对本次项目的适配判断
- 是否建议采用该场景打法
- 用户接受度判断
- 内容/活动形式建议
- 风险雷点和规避方式

三、下一步执行清单
- 需要补充的数据
- 可直接进入方案的结论
- 推荐优先制作的素材或动作`}

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

function MarketingResearchGenerator({ addJob }: { addJob: (type: string, name: string, source: string) => void }) {
  const [activeModule, setActiveModule] = useState(marketingResearchModules[0].name);
  const [apiConfig] = useGlobalAiConfig();
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

  const runTargetUserInsight = async () => {
    if (!apiConfig.endpoint.trim()) {
      setInsightOutput("系统设置暂未配置全局 AI 接口。请先到系统设置填写，或改用新版营销调研工作台的本地兜底生成。");
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
      setResearchOutputs((currentOutputs) => ({ ...currentOutputs, [current.name]: "系统设置暂未配置全局 AI 接口。请先到系统设置填写，或改用新版营销调研工作台的本地兜底生成。" }));
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
    <div className="research-ai-panel">
      <div className="research-ai-intro">
        <div>
          <p className="research-report-kicker">AI Research Generator</p>
          <h3>营销调研生成器</h3>
          <p>把已有数据、评论、竞品线索和项目要求投喂给模型，生成可直接并入看板的结构化调研结论。</p>
        </div>
        <div className="tag-row">
          <span>事实 / 推断分离</span>
          <span>支持多模块</span>
          <span>可复用到方案</span>
        </div>
      </div>
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
            <GlobalAiConfigNotice apiConfig={apiConfig} />
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
            <GlobalAiConfigNotice apiConfig={apiConfig} />
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
    </div>
  );
}

function Settings() {
  const [aiConfig, setAiConfig] = useMigratedGlobalAiConfig();
  const [searchSettings, setSearchSettings] = useState<SearchSettings>({
    mode: "local-semantic",
    embeddingEndpoint: "",
    embeddingApiKey: "",
    embeddingModel: "",
  });
  const [settingsMessage, setSettingsMessage] = useState("");
  const [aiSettingsMessage, setAiSettingsMessage] = useState("");
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const capabilities = [
    { name: "后端语言", status: "目标栈", detail: "正式交付按 PHP 7 规划后端服务与接口实现。" },
    { name: "服务器环境", status: "目标栈", detail: "部署环境按 Linux CentOS + Nginx 规划，数据库使用 MySQL 5.7，缓存、会话和队列使用 Redis。" },
    { name: "前端语言", status: "目标栈", detail: "正式页面按 HTML5、CSS3、JavaScript、jQuery、Bootstrap 规划前端实现与组件样式。" },
    { name: "数据存储", status: "MVP", detail: "当前使用浏览器 localStorage 保存项目、资料、成员和 AI 任务；后续可替换为后端数据库。" },
    { name: "权限体系", status: "待接入", detail: "用户管理和角色权限仍为占位，试点阶段暂不做登录鉴权。" },
    { name: "文件解析", status: "待接入", detail: "上传资料当前读取表单文本和文件名，暂未解析 PPT、Word、PDF、Excel 正文。" },
    { name: "资料引用", status: "已接入", detail: "项目详情已支持关联资料、查看资料和移除引用。" },
    { name: "全局 AI 配置", status: "已接入", detail: "Brief、营销调研、讲稿输出统一使用系统设置中的接口、API Key 和模型。" },
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

  const loadGlobalAiModels = async () => {
    setIsLoadingModels(true);
    setAiSettingsMessage("");
    try {
      if (!inferModelsEndpoint(aiConfig.endpoint)) throw new Error("请先填写接口地址。");
      const response = await fetch("/api/brief-models", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          endpoint: aiConfig.endpoint,
          apiKey: aiConfig.apiKey,
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
      setAiConfig((current) => ({ ...current, model: current.model || models[0] }));
      setAiSettingsMessage(`已拉取 ${models.length} 个模型，配置已自动保存。`);
    } catch (error) {
      setModelOptions([]);
      setAiSettingsMessage(error instanceof Error ? error.message : "模型列表拉取失败。");
    } finally {
      setIsLoadingModels(false);
    }
  };

  const saveAiSettings = () => {
    setAiConfig(aiConfig);
    setAiSettingsMessage("全局 AI 配置已保存，Brief、营销调研和讲稿输出会自动使用。");
  };

  return (
    <section className="page">
      <PageTitle title="系统设置" subtitle="MVP 阶段包含用户、角色、标签和资料分类维护。" />
      <Card title="全局 AI 配置">
        <div className="form-grid">
          <Field label="接口地址" value={aiConfig.endpoint} onChange={(value) => setAiConfig({ ...aiConfig, endpoint: value })} />
          <label>
            <span>API Key</span>
            <input type="password" value={aiConfig.apiKey} onChange={(event) => setAiConfig({ ...aiConfig, apiKey: event.target.value })} placeholder="可选，自动放入 Authorization Bearer" />
          </label>
          <label>
            <span>模型</span>
            <select value={aiConfig.model} onChange={(event) => setAiConfig({ ...aiConfig, model: event.target.value })}>
              <option value="">手动填写接口后拉取模型，或直接留空</option>
              {aiConfig.model && !modelOptions.includes(aiConfig.model) && <option value={aiConfig.model}>{aiConfig.model}</option>}
              {modelOptions.map((model) => <option key={model} value={model}>{model}</option>)}
            </select>
          </label>
        </div>
        <div className="inline-actions">
          <button className="ghost-button" onClick={loadGlobalAiModels} disabled={isLoadingModels}>{isLoadingModels ? "拉取中..." : "拉取模型列表"}</button>
          <button className="primary-button" onClick={saveAiSettings}>保存全局 AI 配置</button>
          {aiSettingsMessage && <span>{aiSettingsMessage}</span>}
        </div>
        <div className="note-box">
          <p>配置后，方案 Brief 解析、营销调研、讲稿输出都会直接使用这里的接口。未配置接口时，各页面会自动使用本地规则兜底生成。</p>
        </div>
      </Card>
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

function Metric({ label, value, tone, onClick }: { label: string; value: React.ReactNode; tone: string; onClick?: () => void }) {
  const content = (
    <>
      <span>{label}</span>
      <strong>{value}</strong>
    </>
  );
  if (onClick) {
    return (
      <button className={`metric metric-${tone} clickable-metric`} onClick={onClick}>
        {content}
      </button>
    );
  }
  return (
    <div className={`metric metric-${tone}`}>
      {content}
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
