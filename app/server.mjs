import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { basename, extname, join, normalize } from "node:path";
import { promisify } from "node:util";
import formidable from "formidable";
import mammoth from "mammoth";
import xlsx from "xlsx";
import { PDFParse } from "pdf-parse";

const port = Number(process.env.PORT || 8787);
const dataDir = join(process.cwd(), "data");
const dbPath = process.env.WORKBENCH_DB_PATH || join(dataDir, "workbench-db.json");
const distDir = join(process.cwd(), "dist");
const uploadDir = join(dataDir, "uploads");
const execFileAsync = promisify(execFile);
const defaultSearchSettings = {
  mode: "local-semantic",
  embeddingEndpoint: "",
  embeddingApiKey: "",
  embeddingModel: "",
};

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".csv": "text/csv; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

async function readDb() {
  try {
    return JSON.parse(await readFile(dbPath, "utf8"));
  } catch {
    return {};
  }
}

async function writeDb(db) {
  await mkdir(dataDir, { recursive: true });
  const tempPath = dbPath + ".tmp." + process.pid + "." + Date.now();
  await writeFile(tempPath, JSON.stringify(db, null, 2));
  await rename(tempPath, dbPath);
}

async function readSearchSettings() {
  const db = await readDb();
  return { ...defaultSearchSettings, ...(db["strategy-center-search-settings"] || {}) };
}

async function writeSearchSettings(settings) {
  const db = await readDb();
  db["strategy-center-search-settings"] = { ...defaultSearchSettings, ...settings };
  await writeDb(db);
  return db["strategy-center-search-settings"];
}

function apiHeaders(apiKey) {
  return {
    "content-type": "application/json",
    ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
  };
}

function inferModelsEndpoint(endpoint) {
  const trimmed = String(endpoint || "").trim();
  if (!trimmed) return "";
  if (trimmed.endsWith("/models")) return trimmed;
  return trimmed.replace(/\/chat\/completions\/?$/, "").replace(/\/responses\/?$/, "").replace(/\/$/, "") + "/models";
}

function inferChatCompletionsEndpoint(endpoint) {
  const trimmed = String(endpoint || "").trim();
  if (!trimmed) return "";
  if (/\/(chat\/completions|responses)\/?$/.test(trimmed)) return trimmed;
  return trimmed.replace(/\/models\/?$/, "").replace(/\/$/, "") + "/chat/completions";
}

function inferTags(text) {
  const rules = [
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

function summarize(text) {
  const compact = String(text || "").replace(/\s+/g, " ").trim();
  if (!compact) return "暂无内容摘要，请补充资料正文或备注。";
  return compact.length > 120 ? `${compact.slice(0, 120)}...` : compact;
}

function cleanAttachmentText(value) {
  const rawLines = String(value || "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "\n")
    .replace(/[\u200b\ufeff]/g, "")
    .replace(/[“”„‟]/g, '"')
    .replace(/[‘’‚‛]/g, "'")
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const filtered = rawLines.filter((line) => {
    const compact = line.replace(/\s+/g, "");
    if (!compact) return false;
    if (/^第\d+页$/.test(compact)) return false;
    if (/^(contents|目录)$/i.test(compact)) return false;
    if (/^\d{1,3}$/.test(compact)) return false;
    if (/^0\d$/.test(compact)) return false;
    if (/^["'“”‘’]+$/.test(compact)) return false;
    if (/^[\-—_]{3,}$/.test(compact)) return false;
    return true;
  });

  const merged = [];
  let buffer = [];
  const flush = () => {
    if (!buffer.length) return;
    merged.push(buffer.join(" ").replace(/\s+/g, " ").trim());
    buffer = [];
  };
  for (const line of filtered) {
    const compact = line.replace(/\s+/g, "");
    const isHeading = /^([一二三四五六七八九十]+[、.．]|\d+(\.\d+)*[、.．]?|#{1,3}\s+)/.test(line);
    const isBullet = /^[•●▪◦\-*]/.test(line);
    const isShort = compact.length <= 8 && !/[。！？；：:]$/.test(line);
    if (isHeading || isBullet) {
      flush();
      merged.push(line);
      continue;
    }
    if (isShort) {
      buffer.push(line);
      if (/[。！？；：:]$/.test(line)) flush();
      continue;
    }
    if (buffer.length) flush();
    merged.push(line);
  }
  flush();

  return merged
    .map((line) => line.replace(/^[•●▪◦\-*\d.、\s]+/, "").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function summarizeAttachmentContent(text) {
  const lines = cleanAttachmentText(text).split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const useful = lines.filter((line) => {
    const compact = line.replace(/\s+/g, "");
    if (compact.length < 8) return false;
    if (/^(项目目标|创意方案|团队支持|效果预估|前序合作案例|方案附件|报价单)$/i.test(compact)) return false;
    return true;
  });
  const keywordLines = useful.filter((line) => /目标|需求|核心|策略|创意|传播|内容|亮点|问题|风险|预算|报价|效果|执行|玩法|用户|渠道|达人|KOL|CPM|转化|预约|反馈/.test(line));
  const picked = [];
  [...keywordLines, ...useful].forEach((line) => {
    const cleaned = line.replace(/\s+/g, " ").trim();
    if (!cleaned || picked.some((item) => item === cleaned)) return;
    picked.push(cleaned.length > 120 ? cleaned.slice(0, 120) + "..." : cleaned);
  });
  return picked.slice(0, 6).map((line) => "- " + line).join("\n") || summarize(text, 320);
}

function keywordList(query) {
  return String(query || "").trim().split(/\s+/).filter(Boolean);
}

function countMatches(text, keyword) {
  if (!keyword) return 0;
  return String(text || "").split(keyword).length - 1;
}

function makeSnippet(text, keyword) {
  const source = String(text || "").replace(/\s+/g, " ").trim();
  if (!source) return "";
  const index = keyword ? source.indexOf(keyword) : -1;
  if (index < 0) return source.slice(0, 120);
  const start = Math.max(0, index - 48);
  const end = Math.min(source.length, index + keyword.length + 72);
  return `${start > 0 ? "..." : ""}${source.slice(start, end)}${end < source.length ? "..." : ""}`;
}

function createChunks(text, size = 700, overlap = 120) {
  const compact = String(text || "").replace(/\s+/g, " ").trim();
  if (!compact) return [];
  const chunks = [];
  for (let start = 0; start < compact.length; start += size - overlap) {
    const chunk = compact.slice(start, start + size);
    if (chunk.trim()) chunks.push(chunk);
    if (start + size >= compact.length) break;
  }
  return chunks;
}

function expandTerms(text) {
  const source = String(text || "").toLowerCase();
  const expansions = [
    ["二次元", ["acg", "动漫", "角色", "世界观", "核心玩家"]],
    ["新品上线", ["首发", "预约", "预热", "上线", "发行"]],
    ["投标", ["讲标", "竞标", "客户提案", "方案"]],
    ["女性向", ["乙游", "恋爱", "角色好感", "剧情"]],
    ["活动推广", ["节日", "周年", "运营活动", "传播"]],
    ["舆情", ["风险", "负面", "争议", "公关"]],
    ["竞品", ["竞对", "对标", "市场分析"]],
    ["文案", ["口播", "标题", "脚本", "卖点"]],
  ];
  const terms = [source];
  expansions.forEach(([term, related]) => {
    if (source.includes(term) || related.some((item) => source.includes(item))) {
      terms.push(term, ...related);
    }
  });
  return terms.join(" ");
}

function tokenize(text) {
  const expanded = expandTerms(text);
  const words = expanded.match(/[a-z0-9]+|[\u4e00-\u9fa5]{1,4}/gi) || [];
  const chinese = expanded.replace(/[^\u4e00-\u9fa5]/g, "");
  const bigrams = [];
  for (let index = 0; index < chinese.length - 1; index += 1) {
    bigrams.push(chinese.slice(index, index + 2));
  }
  return [...words, ...bigrams].filter((token) => token.trim().length > 1);
}

function embedText(text) {
  const vector = {};
  tokenize(text).forEach((token) => {
    vector[token] = (vector[token] || 0) + 1;
  });
  return vector;
}

async function embedWithSettings(text, settings) {
  if (settings.mode === "keyword") return {};
  if (settings.mode === "external-embedding" && settings.embeddingEndpoint && settings.embeddingApiKey) {
    const response = await fetch(settings.embeddingEndpoint, {
      method: "POST",
      headers: apiHeaders(settings.embeddingApiKey),
      body: JSON.stringify({
        model: settings.embeddingModel || undefined,
        input: text,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      const embedding = data.data?.[0]?.embedding || data.embedding;
      if (Array.isArray(embedding)) {
        return Object.fromEntries(embedding.map((value, index) => [`dim_${index}`, Number(value) || 0]));
      }
    }
  }
  return embedText(text);
}

function cosineSimilarity(left, right) {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  Object.entries(left || {}).forEach(([token, value]) => {
    leftNorm += value * value;
    dot += value * (right?.[token] || 0);
  });
  Object.values(right || {}).forEach((value) => {
    rightNorm += value * value;
  });
  if (!leftNorm || !rightNorm) return 0;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function buildResourceChunks(resource) {
  const baseText = [resource.title, resource.summary, resource.tags?.join(" "), resource.content].join("\n");
  return createChunks(baseText).map((text, index) => ({
    id: `${resource.id || "resource"}-${index}`,
    text,
    embedding: embedText(text),
  }));
}

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      multiples: true,
      maxFileSize: 100 * 1024 * 1024,
    });
    form.parse(req, (error, fields, files) => {
      if (error) reject(error);
      else resolve({ fields, files });
    });
  });
}

function firstField(fields, key, fallback = "") {
  const value = fields[key];
  return Array.isArray(value) ? String(value[0] ?? fallback) : String(value ?? fallback);
}

function cleanSpreadsheetRows(rows) {
  return rows
    .map((row) => row.map((cell) => String(cell ?? "").trim()))
    .filter((row) => row.some(Boolean));
}

function rowToReadableLine(row) {
  const cells = row.filter(Boolean);
  if (!cells.length) return "";
  if (cells.length >= 2) return `- ${cells[0]}：${cells.slice(1).join(" / ")}`;
  return `- ${cells[0]}`;
}

function extractSpreadsheet(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheets = workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = cleanSpreadsheetRows(xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false }));
    const previewRows = rows.slice(0, 300);
    const readable = previewRows.map(rowToReadableLine).filter(Boolean).join("\n");
    return {
      name: sheetName,
      rows: previewRows,
      rowCount: rows.length,
      text: readable,
    };
  });
  const text = sheets.map((sheet) => `# ${sheet.name}\n${sheet.text}`).join("\n\n");
  return { text, structured: { kind: "spreadsheet", sheets } };
}

async function extractFileContent(file) {
  const originalName = file.originalFilename || "未命名文件";
  const extension = extname(originalName).toLowerCase();
  const filePath = file.filepath;

  if ([".txt", ".md", ".csv"].includes(extension)) {
    return { text: cleanAttachmentText(await readFile(filePath, "utf8")) };
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return { text: cleanAttachmentText(result.value) };
  }

  if (extension === ".pptx") {
    const { stdout: fileList } = await execFileAsync("unzip", ["-Z1", filePath], { maxBuffer: 1024 * 1024 * 8 });
    const slideFiles = fileList
      .split(/\r?\n/)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((left, right) => Number(left.match(/slide(\d+)/)?.[1] || 0) - Number(right.match(/slide(\d+)/)?.[1] || 0));
    const decodeXmlText = (value) => String(value || "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&apos;/g, "'")
      .trim();
    const slides = await Promise.all(slideFiles.map(async (slidePath, index) => {
      const { stdout } = await execFileAsync("unzip", ["-p", filePath, slidePath], { maxBuffer: 1024 * 1024 * 8 });
      const paragraphs = Array.from(stdout.matchAll(/<a:p[\s\S]*?<\/a:p>/g))
        .map((match) => Array.from(match[0].matchAll(/<a:t>([\s\S]*?)<\/a:t>/g))
          .map((textMatch) => decodeXmlText(textMatch[1]))
          .filter(Boolean)
          .join(""))
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter(Boolean);
      const uniqueParagraphs = paragraphs.filter((line, lineIndex) => paragraphs.indexOf(line) === lineIndex);
      return uniqueParagraphs.length ? "第 " + (index + 1) + " 页\n" + uniqueParagraphs.join("\n") : "";
    }));
    return { text: cleanAttachmentText(slides.filter(Boolean).join("\n\n")) };
  }

  if ([".xlsx", ".xls"].includes(extension)) {
    const sheet = extractSpreadsheet(filePath);
    return { ...sheet, text: cleanAttachmentText(sheet.text) };
  }

  if (extension === ".pdf") {
    const buffer = await readFile(filePath);
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return { text: cleanAttachmentText(result.text) };
    } finally {
      await parser.destroy();
    }
  }

  throw new Error(`暂不支持解析 ${extension || "该类型"} 文件，已保留文件记录。`);
}

async function handleResourceUpload(req, res) {
  await mkdir(uploadDir, { recursive: true });
  const { fields, files } = await parseForm(req);
  const uploaded = files.files ? (Array.isArray(files.files) ? files.files : [files.files]) : [];
  if (!uploaded.length) {
    sendJson(res, 400, { error: "没有收到文件。" });
    return;
  }

  const base = {
    title: firstField(fields, "title"),
    type: firstField(fields, "type", "方案"),
    project: firstField(fields, "project"),
    gameType: firstField(fields, "gameType"),
    projectType: firstField(fields, "projectType", "新品上线"),
    node: firstField(fields, "node"),
    visibility: firstField(fields, "visibility", "策略部门"),
    sensitive: firstField(fields, "sensitive", "内部"),
    content: firstField(fields, "content"),
  };

  const resources = await Promise.all(uploaded.map(async (file, index) => {
    const originalName = file.originalFilename || `上传文件-${index + 1}`;
    let parsedText = "";
    let structuredContent;
    let parseStatus = "成功";
    let parseError = "";

    try {
      const extracted = await extractFileContent(file);
      parsedText = extracted.text;
      structuredContent = extracted.structured;
    } catch (error) {
      parseStatus = "失败";
      parseError = error instanceof Error ? error.message : "文件解析失败。";
    }

    const sourceText = [
      base.title,
      originalName,
      base.type,
      base.project,
      base.gameType,
      base.projectType,
      base.node,
      base.content,
      parsedText,
    ].join(" ");
    const title = uploaded.length > 1 ? originalName : base.title || originalName;

    const resource = {
      id: Date.now() + index,
      title,
      type: base.type,
      summary: summarize(parsedText || base.content || sourceText),
      content: parsedText || base.content || sourceText,
      tags: inferTags(sourceText),
      uploader: "当前用户",
      uploadedAt: new Date().toISOString().slice(0, 10),
      visibility: base.visibility,
      sensitive: base.sensitive,
      fileName: originalName,
      filePath: normalize(file.filepath),
      fileSize: file.size,
      mimeType: file.mimetype || "",
      parseStatus,
      parseError,
      structuredContent,
    };
    return { ...resource, chunks: buildResourceChunks(resource) };
  }));

  sendJson(res, 200, { resources });
}

async function handleBriefFiles(req, res) {
  await mkdir(uploadDir, { recursive: true });
  const { files } = await parseForm(req);
  const uploaded = files.files ? (Array.isArray(files.files) ? files.files : [files.files]) : [];
  if (!uploaded.length) {
    sendJson(res, 400, { error: "没有收到 Brief 解析文件。" });
    return;
  }

  const parsedFiles = await Promise.all(uploaded.map(async (file, index) => {
    const originalName = file.originalFilename || `Brief输入文件-${index + 1}`;
    let content = "";
    let structuredContent;
    let parseStatus = "成功";
    let parseError = "";
    try {
      const extracted = await extractFileContent(file);
      content = extracted.text;
      structuredContent = extracted.structured;
    } catch (error) {
      parseStatus = "失败";
      parseError = error instanceof Error ? error.message : "文件解析失败。";
    }
    return {
      id: Date.now() + index,
      name: originalName,
      filePath: normalize(file.filepath),
      fileSize: file.size,
      mimeType: file.mimetype || "",
      parseStatus,
      parseError,
      summary: summarize(content),
      content,
      structuredContent,
    };
  }));

  sendJson(res, 200, { files: parsedFiles });
}

async function handleResourceSearch(req, res) {
  const { query, filters = {}, resources: clientResources = [], mode = "natural", context = "" } = await readJson(req);
  const db = await readDb();
  const settings = { ...defaultSearchSettings, ...(db["strategy-center-search-settings"] || {}) };
  const dbResources = Array.isArray(db["strategy-center-resources"]) ? db["strategy-center-resources"] : [];
  const resources = dbResources.length ? dbResources : Array.isArray(clientResources) ? clientResources : [];
  const searchQuery = [query, context].filter(Boolean).join(" ");
  const keywords = keywordList(searchQuery);

  if (!keywords.length && !Object.values(filters).some(Boolean)) {
    sendJson(res, 200, { results: resources.map((resource) => ({ resource, score: 0, snippets: [], matchType: resourceMatchType(resource), recommendation: resourceRecommendation(resource, mode, searchQuery) })) });
    return;
  }

  const queryEmbedding = await embedWithSettings(searchQuery, settings);
  const useSemantic = settings.mode !== "keyword";
  const results = resources
    .filter((resource) =>
      (!filters.type || resource.type === filters.type) &&
      (!filters.sensitive || resource.sensitive === filters.sensitive) &&
      (!filters.visibility || resource.visibility === filters.visibility) &&
      (!filters.parseStatus || (resource.parseStatus || "成功") === filters.parseStatus)
    )
    .map((resource) => {
      const title = resource.title || "";
      const tags = Array.isArray(resource.tags) ? resource.tags.join(" ") : "";
      const summary = resource.summary || "";
      const content = resource.content || "";
      const typeBoost = matchIntentBoost(resource, searchQuery, mode);
      const keywordScore = keywords.reduce((total, keyword) => {
        return total +
          countMatches(title, keyword) * 12 +
          countMatches(tags, keyword) * 8 +
          countMatches(summary, keyword) * 5 +
          countMatches(content, keyword);
      }, 0);
      const chunks = useSemantic ? (Array.isArray(resource.chunks) && resource.chunks.length ? resource.chunks : buildResourceChunks(resource)) : [];
      const semanticMatches = useSemantic
        ? chunks.map((chunk) => ({ chunk, similarity: cosineSimilarity(queryEmbedding, chunk.embedding || embedText(chunk.text)) })).sort((a, b) => b.similarity - a.similarity)
        : [];
      const semanticScore = useSemantic ? semanticMatches[0]?.similarity || 0 : 0;
      const score = keywordScore + Math.round(semanticScore * 100) + typeBoost;
      const keywordSnippets = keywords
        .map((keyword) => makeSnippet(content || summary || title, keyword))
        .filter(Boolean)
        .slice(0, 3);
      const semanticSnippets = semanticMatches.filter((item) => item.similarity > 0).slice(0, 2).map((item) => item.chunk.text.slice(0, 180));
      const snippets = Array.from(new Set([...keywordSnippets, ...semanticSnippets])).slice(0, 3);
      return {
        resource,
        score,
        keywordScore,
        semanticScore,
        searchMode: settings.mode,
        snippets,
        matchType: resourceMatchType(resource),
        recommendation: resourceRecommendation(resource, mode, searchQuery),
      };
    })
    .filter((item) => !keywords.length || item.score > 0)
    .sort((a, b) => b.score - a.score || String(b.resource.uploadedAt || "").localeCompare(String(a.resource.uploadedAt || "")));

  sendJson(res, 200, { results });
}

function resourceMatchType(resource) {
  const text = `${resource.type || ""} ${resource.title || ""} ${(resource.tags || []).join(" ")} ${resource.summary || ""} ${resource.content || ""}`;
  if (/案例|复盘|中标|爆款|优秀|标杆/.test(text)) return "案例";
  if (/话术|文案|口播|脚本|标题|slogan/i.test(text)) return "话术";
  if (/数据|报表|指标|预算|roi|cpm|转化|投放/i.test(text)) return "数据";
  if (/模板|框架|结构|母版|ppt/i.test(text)) return "模板";
  if (/素材|图片|视频|pv|kv|海报/i.test(text)) return "素材";
  return "资产";
}

function matchIntentBoost(resource, query, mode) {
  const matchType = resourceMatchType(resource);
  const source = `${query || ""}`.toLowerCase();
  let boost = 0;
  if (/案例|参考|相似|优秀|爆款|复盘/.test(source) && matchType === "案例") boost += 24;
  if (/话术|文案|口播|脚本|标题/.test(source) && matchType === "话术") boost += 24;
  if (/数据|预算|指标|转化|roi|cpm|投放/.test(source) && matchType === "数据") boost += 24;
  if (/模板|ppt|框架|结构/.test(source) && matchType === "模板") boost += 24;
  if (/素材|图片|视频|pv|kv|海报/.test(source) && matchType === "素材") boost += 24;
  if (mode === "recommend" && /方案|投标|项目|需求|brief/i.test(source)) boost += 10;
  if (mode === "similar" && /创意|内容|传播|玩法|主题/.test(source)) boost += 10;
  return boost;
}

function resourceRecommendation(resource, mode, query) {
  const matchType = resourceMatchType(resource);
  const title = resource.title || "该资料";
  if (mode === "recommend") return `${title} 可作为当前需求的${matchType}参考，优先复用其中的结构、表达或执行经验。`;
  if (mode === "similar") return `${title} 与当前创作内容存在相似语义，可用于对标表达方式、素材方向和内容组织。`;
  return `${title} 命中${matchType}线索，可继续查看正文片段确认适配度。`;
}

const planCollectionOrigin = "https://erp.changwankeji.com:8188";

function erpAuthHeaders(req) {
  const headers = req.headers || {};
  const authid = headers.authid || headers["x-authid"] || req.erpAuth?.authid || process.env.ERP_AUTHID || "";
  const authtoken = headers.authtoken || headers["x-authtoken"] || req.erpAuth?.authtoken || process.env.ERP_AUTHTOKEN || "";
  return { authid: String(authid), authtoken: String(authtoken) };
}

function planCollectionUrl(action) {
  const url = new URL("/api.php", planCollectionOrigin);
  url.searchParams.set("m", "plan_collection|api|v3");
  url.searchParams.set("a", action);
  return url;
}

async function requestPlanCollection(req, action, { method = "GET", params = {} } = {}) {
  const auth = erpAuthHeaders(req);
  if (!auth.authid || !auth.authtoken) {
    const error = new Error("缺少 ERP 登录态，请先在浏览器登录 ERP，或在本地后端配置 ERP_AUTHID / ERP_AUTHTOKEN。");
    error.status = 401;
    throw error;
  }

  const url = planCollectionUrl(action);
  const headers = { authid: auth.authid, authtoken: auth.authtoken };
  const options = { method, headers };

  if (method === "GET") {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    });
  } else {
    headers["content-type"] = "application/x-www-form-urlencoded;charset=utf-8";
    options.body = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "").map(([key, value]) => [key, String(value)]));
  }

  const response = await fetch(url, options);
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { code: response.status, msg: text || "ERP 接口返回非 JSON 内容。" };
  }
  if (!response.ok || Number(data.code) !== 200) {
    const error = new Error(data.msg || data.error || "ERP 接口调用失败（" + response.status + "）。");
    error.status = response.status || 502;
    error.payload = data;
    throw error;
  }
  return data;
}

function normalizePlanFileInfo(row) {
  const files = Array.isArray(row.file_info) ? row.file_info : [];
  return files.map((file) => ({
    id: file.id,
    filename: file.filename || file.name || "附件-" + file.id,
    fileext: file.fileext || "",
    filesize: file.filesize,
    filesizecn: file.filesizecn || "",
    filepath: file.filepath || "",
  }));
}

function planCollectionRows(payload) {
  if (Array.isArray(payload.data?.list)) return payload.data.list;
  if (Array.isArray(payload.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload.data?.tabledata)) return payload.data.tabledata;
  return [];
}

function planCollectionPageInfo(payload, page, pageSize, count) {
  return payload.data?.page_info || {
    page,
    page_size: pageSize,
    total: Number(payload.data?.totalCount || payload.data?.total || count),
  };
}

function mapPlanCollectionRowToResource(row) {
  const files = normalizePlanFileInfo(row);
  const titleParts = [row.product, row.custname, row.plan_time].filter(Boolean);
  const title = titleParts.length ? titleParts.join(" / ") : "方案收集 " + row.id;
  const fileNames = files.map((file) => file.filename).filter(Boolean);
  const contentLines = [
    "中标情况：" + (row.bid_status || "未填写"),
    "CRM单号：" + (row.osericnum || "无"),
    "客户名称：" + (row.custname || "未填写"),
    "营销标的：" + (row.product || "未填写"),
    "产品：" + (row.ordertype || "未填写"),
    "方案创建人：" + (row.cuname || row.optname || "未填写"),
    "方案提交时间：" + (row.plan_time || "未填写"),
    "合同金额：" + (row.contractprice || "0"),
    "客户反馈：" + (row.custfeed || "无"),
    "附件：" + (fileNames.join(" / ") || row.file || "无"),
  ];
  const sourceText = contentLines.join("\n");
  const resource = {
    id: 900000000 + Number(row.id || Date.now()),
    title,
    type: row.bid_status === "已中标" || row.bid_status === "中标" ? "中标方案" : "方案收集",
    summary: summarize([row.custfeed, row.product, row.ordertype, fileNames.join(" / ")].filter(Boolean).join("；") || sourceText),
    content: sourceText,
    tags: inferTags(title + " " + sourceText + " " + (row.bid_status || "")),
    uploader: row.cuname || row.optname || row.base_name || "ERP",
    uploadedAt: String(row.optdt || row.plan_time || new Date().toISOString()).slice(0, 10),
    visibility: "ERP 方案收集库",
    sensitive: "内部",
    fileName: fileNames.join(" / ") || row.file || "",
    filePath: files[0]?.filepath || "",
    fileSize: files.reduce((total, file) => total + (Number(file.filesize) || 0), 0) || undefined,
    mimeType: "",
    parseStatus: "成功",
    erpSource: {
      module: "plan_collection",
      id: row.id,
      fileIds: row.file,
      files,
      auth: row.auth,
      raw: row,
    },
  };
  return { ...resource, chunks: buildResourceChunks(resource) };
}

async function handleErpResources(req, res) {
  const db = await readDb();
  const savedAuth = db["strategy-center-erp-auth"] || {};
  const authedReq = { ...req, erpAuth: savedAuth };
  const url = new URL(req.url || "/", "http://" + req.headers.host);
  const page = Number(url.searchParams.get("page") || 1);
  const pageSize = Number(url.searchParams.get("pageSize") || 20);
  const keyword = url.searchParams.get("keyword") || "";
  const ordertype = url.searchParams.get("ordertype") || "";
  const bidStatus = url.searchParams.get("bid_status") || "";
  const payload = await requestPlanCollection(authedReq, "list", {
    method: "POST",
    params: {
      num: "plan_collection",
      page,
      pageSize,
      key: keyword,
      soufields_ordertype: ordertype,
      soufields_bid_status: bidStatus,
    },
  });
  const list = planCollectionRows(payload);
  const resources = list.map(mapPlanCollectionRowToResource);
  sendJson(res, 200, {
    connected: true,
    source: "plan_collection",
    resources,
    pageInfo: planCollectionPageInfo(payload, page, pageSize, resources.length),
    message: "已从方案收集库读取 " + resources.length + " 条记录。",
  });
}

async function fetchPlanCollectionPage(req, page, pageSize) {
  const payload = await requestPlanCollection(req, "list", {
    method: "POST",
    params: { num: "plan_collection", page, pageSize },
  });
  return { payload, rows: planCollectionRows(payload), pageInfo: planCollectionPageInfo(payload, page, pageSize, 0) };
}

async function findPlanCollectionRowById(req, planId) {
  const db = await readDb();
  const savedAuth = db["strategy-center-erp-auth"] || {};
  const authedReq = { ...req, headers: { ...(req.headers || {}) }, erpAuth: savedAuth };
  const cached = Array.isArray(db["strategy-center-resources"])
    ? db["strategy-center-resources"].find((resource) => String(resource.erpSource?.id) === String(planId) || String(resource.id) === String(planId))
    : null;
  const raw = cached?.erpSource?.raw;
  const keyword = raw?.product || raw?.custname || "";
  const pagesToTry = keyword ? [{ page: 1, pageSize: 20, key: keyword }, { page: 1, pageSize: 50 }] : [{ page: 1, pageSize: 50 }];
  for (const params of pagesToTry) {
    const payload = await requestPlanCollection(authedReq, "list", {
      method: "POST",
      params: { num: "plan_collection", ...params },
    });
    const row = planCollectionRows(payload).find((item) => String(item.id) === String(planId));
    if (row) return row;
  }
  if (raw && String(raw.id) === String(planId)) return raw;
  const error = new Error("没有找到该方案的附件记录，请先重新同步方案收集库。");
  error.status = 404;
  throw error;
}

async function getFreshPlanFile(req, planId, fileId) {
  const row = await findPlanCollectionRowById(req, planId);
  const files = normalizePlanFileInfo(row);
  const file = files.find((item) => String(item.id) === String(fileId)) || files[0];
  if (!file?.filepath) {
    const error = new Error("该方案附件缺少可下载链接，请重新同步方案收集库后再试。");
    error.status = 404;
    throw error;
  }
  return { row, file };
}

function safeDownloadName(name, fallback = "erp-attachment") {
  return basename(String(name || fallback)).replace(/[\r\n"]/g, "_");
}

async function downloadErpFileBuffer(req, planId, fileId) {
  const { file } = await getFreshPlanFile(req, planId, fileId);
  const response = await fetch(file.filepath);
  if (!response.ok) {
    const error = new Error("附件下载失败（" + response.status + "），可能是 ERP 签名已过期，请稍后重试。");
    error.status = response.status || 502;
    throw error;
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return { file, buffer, contentType: response.headers.get("content-type") || contentTypes[extname(file.filename).toLowerCase()] || "application/octet-stream" };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function handleErpAttachmentPreview(req, res, url) {
  const planId = url.searchParams.get("planId") || url.searchParams.get("resourceId") || "";
  const fileId = url.searchParams.get("fileId") || "";
  if (!planId || !fileId) {
    sendJson(res, 400, { error: "缺少 planId 或 fileId。" });
    return;
  }
  const { file } = await getFreshPlanFile(req, planId, fileId);
  const filename = safeDownloadName(file.filename, "erp-attachment" + extname(file.filename || ""));
  const fileUrl = "/api/erp/attachment?planId=" + encodeURIComponent(planId) + "&fileId=" + encodeURIComponent(fileId);
  const readUrl = "/api/erp/attachment/read?planId=" + encodeURIComponent(planId) + "&fileId=" + encodeURIComponent(fileId);
  const html = [
    "<!doctype html>",
    "<html lang=\"zh-CN\">",
    "<head>",
    "<meta charset=\"UTF-8\" />",
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />",
    "<title>" + escapeHtml(filename) + "</title>",
    "<style>",
    "*{box-sizing:border-box}body{margin:0;min-height:100vh;color:#17212b;font-family:\"Avenir Next\",\"PingFang SC\",\"Microsoft YaHei\",sans-serif;background:#edf1ea}.bar{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 18px;border-bottom:1px solid #dce3de;background:rgba(255,255,250,.96)}.title{min-width:0}.title strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px}.title span{color:#66727f;font-size:12px}.actions{display:flex;gap:10px;flex:0 0 auto}a,button{border:1px solid #dce3de;border-radius:10px;padding:8px 12px;color:#24453a;background:#fffdf7;font-weight:700;text-decoration:none;cursor:pointer}.wrap{max-width:980px;margin:0 auto;padding:28px}.panel{border:1px solid #dce3de;border-radius:16px;background:#fffdf7;box-shadow:0 18px 60px rgba(31,45,40,.1);overflow:hidden}.panel-head{padding:18px 20px;border-bottom:1px solid #dce3de}.panel-head h1{margin:0 0 6px;font-size:22px;line-height:1.25}.panel-head p{margin:0;color:#66727f}.content{display:grid;gap:12px;padding:20px;line-height:1.8}.content p{margin:0;padding-left:14px;position:relative}.content p:before{content:'';position:absolute;left:0;top:.85em;width:5px;height:5px;border-radius:50%;background:#2f7d5b}.loading,.error{padding:22px;color:#66727f}.raw-actions{display:flex;gap:10px;flex-wrap:wrap;padding:0 20px 20px}.hint{margin-top:14px;color:#66727f;font-size:13px}",
    "</style>",
    "</head>",
    "<body>",
    "<div class=\"bar\"><div class=\"title\"><strong>" + escapeHtml(filename) + "</strong><span>ERP 方案附件预览</span></div><div class=\"actions\"><button onclick=\"history.length>1?history.back():location.href=\'/\'\">返回上一页</button><a href=\"" + fileUrl + "\" download>下载原文件</a></div></div>",
    "<main class=\"wrap\"><section class=\"panel\"><div class=\"panel-head\"><h1>附件关键内容预览</h1><p>已避免直接嵌入 PDF，防止内置浏览器黑屏。原文件可下载后查看。</p></div><div id=\"content\" class=\"loading\">正在读取附件内容...</div><div class=\"raw-actions\"><a href=\"" + fileUrl + "\" target=\"_blank\" rel=\"noreferrer\">尝试打开原文件</a><a href=\"" + fileUrl + "\" download>下载原文件</a></div></section></main>",
    "<script>",
    "const content=document.getElementById(\"content\");fetch(\"" + readUrl + "\",{method:\"POST\"}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error||\"读取失败\");const lines=String(data.summary||data.content||\"\").split(/\\n+/).map(s=>s.replace(/^[-•●▪◦\\s]+/,\"\").trim()).filter(Boolean);content.className=\"content\";content.innerHTML=lines.length?lines.map(line=>`<p>${line.replace(/[&<>]/g,m=>({\"&\":\"&amp;\",\"<\":\"&lt;\",\">\":\"&gt;\"}[m]))}</p>`).join(\"\"):`<p>附件已读取，但没有生成可展示的文字内容。</p>`;}).catch(error=>{content.className=\"error\";content.textContent=error.message||\"附件读取失败\";});",
    "</script>",
    "</body></html>"
  ].join("\n");
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}

async function handleErpAttachmentDownload(req, res, url) {
  const planId = url.searchParams.get("planId") || url.searchParams.get("resourceId") || "";
  const fileId = url.searchParams.get("fileId") || "";
  if (!planId || !fileId) {
    sendJson(res, 400, { error: "缺少 planId 或 fileId。" });
    return;
  }
  const { file, buffer, contentType } = await downloadErpFileBuffer(req, planId, fileId);
  const filename = safeDownloadName(file.filename, "erp-attachment" + extname(file.filename || ""));
  res.writeHead(200, {
    "content-type": contentType,
    "content-length": buffer.length,
    "content-disposition": "inline; filename*=UTF-8''" + encodeURIComponent(filename),
  });
  res.end(buffer);
}

async function handleErpAttachmentRead(req, res, url) {
  const planId = url.searchParams.get("planId") || url.searchParams.get("resourceId") || "";
  const fileId = url.searchParams.get("fileId") || "";
  if (!planId || !fileId) {
    sendJson(res, 400, { error: "缺少 planId 或 fileId。" });
    return;
  }
  const { file, buffer } = await downloadErpFileBuffer(req, planId, fileId);
  await mkdir(uploadDir, { recursive: true });
  const extension = extname(file.filename || "") || (file.fileext ? "." + String(file.fileext).replace(/^\./, "") : "");
  const tempPath = join(uploadDir, "erp-" + planId + "-" + fileId + "-" + Date.now() + extension);
  await writeFile(tempPath, buffer);
  try {
    const extracted = await extractFileContent({ originalFilename: file.filename || "附件" + extension, filepath: tempPath });
    const text = String(extracted.text || "").trim();
    sendJson(res, 200, {
      ok: true,
      file: { id: file.id, filename: file.filename, filesizecn: file.filesizecn, fileext: file.fileext },
      summary: summarizeAttachmentContent(text),
      content: text,
      structuredContent: extracted.structured,
      message: text ? "已读取附件内容。" : "附件已下载，但未解析出文字内容。",
    });
  } finally {
    unlink(tempPath).catch(() => undefined);
  }
}

async function fetchAllPlanCollectionRows(req, pageSize) {
  const first = await fetchPlanCollectionPage(req, 1, pageSize);
  const total = Number(first.pageInfo.total || first.rows.length);
  const effectivePageSize = first.rows.length || pageSize;
  const totalPages = Math.max(1, Math.ceil(total / effectivePageSize));
  const allRows = [...first.rows];
  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchPlanCollectionPage(req, page, pageSize);
    allRows.push(...next.rows);
    if (!next.rows.length) break;
  }
  const deduped = Array.from(new Map(allRows.map((row) => [String(row.id), row])).values());
  return { rows: deduped, total, totalPages };
}

async function handleErpSync(req, res) {
  const body = await readJson(req);
  const db = await readDb();
  const savedAuth = db["strategy-center-erp-auth"] || {};
  const fakeReq = { ...req, headers: { ...req.headers }, erpAuth: savedAuth };
  const pageSize = Number(body.pageSize || 50);
  const syncAll = body.all !== false;
  const fetched = syncAll ? await fetchAllPlanCollectionRows(fakeReq, pageSize) : await fetchPlanCollectionPage(fakeReq, Number(body.page || 1), pageSize);
  const list = syncAll ? fetched.rows : fetched.rows;
  const resources = list.map(mapPlanCollectionRowToResource);
  const existing = Array.isArray(db["strategy-center-resources"]) ? db["strategy-center-resources"] : [];
  const nextById = new Map(existing.map((resource) => [resource.id, resource]));
  resources.forEach((resource) => nextById.set(resource.id, resource));
  db["strategy-center-resources"] = Array.from(nextById.values()).sort((left, right) => String(right.uploadedAt || "").localeCompare(String(left.uploadedAt || "")));
  db["strategy-center-erp-config"] = { ...(db["strategy-center-erp-config"] || {}), lastSyncRequestedAt: new Date().toISOString() };
  await writeDb(db);
  sendJson(res, 200, {
    ok: true,
    synced: resources.length,
    resources,
    total: fetched.total || resources.length,
    totalPages: fetched.totalPages || 1,
    message: "已同步方案收集库 " + resources.length + " 条记录。",
  });
}

async function handleErpLogin(req, res) {
  const body = await readJson(req);
  const authid = String(body.authid || "").trim();
  const authtoken = String(body.authtoken || "").trim();
  if (!authid || !authtoken) {
    sendJson(res, 400, { error: "请填写 ERP authid 和 authtoken。" });
    return;
  }
  const fakeReq = { ...req, headers: { ...req.headers, authid, authtoken } };
  await requestPlanCollection(fakeReq, "initSearch", { method: "GET" });
  const db = await readDb();
  db["strategy-center-erp-auth"] = { authid, authtoken, savedAt: new Date().toISOString() };
  await writeDb(db);
  sendJson(res, 200, { ok: true, message: "ERP 登录态已验证并保存到后端，可以同步方案收集库。", authid });
}

async function handleErpStatus(req, res) {
  const db = await readDb();
  const savedAuth = db["strategy-center-erp-auth"] || {};
  const hasEnvAuth = Boolean(process.env.ERP_AUTHID && process.env.ERP_AUTHTOKEN);
  const hasSavedAuth = Boolean(savedAuth.authid && savedAuth.authtoken);
  sendJson(res, 200, {
    connected: hasSavedAuth || hasEnvAuth,
    authSource: hasSavedAuth ? "backend-saved" : hasEnvAuth ? "env" : "missing",
    authid: hasSavedAuth ? savedAuth.authid : hasEnvAuth ? process.env.ERP_AUTHID : "",
    savedAt: savedAuth.savedAt || "",
    message: hasSavedAuth || hasEnvAuth ? "后端 ERP 登录态已配置，可以直接同步方案收集库。" : "后端缺少 ERP 登录态，请在后端配置 ERP_AUTHID / ERP_AUTHTOKEN，或先调用 /api/erp/login 保存登录态。",
  });
}

async function handleSearchSettings(req, res) {
  if (req.method === "GET") {
    sendJson(res, 200, { settings: await readSearchSettings() });
    return;
  }
  if (req.method === "PUT") {
    const body = await readJson(req);
    sendJson(res, 200, { settings: await writeSearchSettings(body.settings || {}) });
    return;
  }
  sendJson(res, 405, { error: "method not allowed" });
}

async function handleState(req, res, key) {
  const db = await readDb();

  if (req.method === "GET") {
    if (!(key in db)) {
      sendJson(res, 404, { error: "state key not found" });
      return;
    }
    sendJson(res, 200, { value: db[key] });
    return;
  }

  if (req.method === "PUT") {
    const body = await readJson(req);
    db[key] = body.value;
    await writeDb(db);
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 405, { error: "method not allowed" });
}

async function handleBriefModels(req, res) {
  const { endpoint, apiKey } = await readJson(req);
  const modelsEndpoint = inferModelsEndpoint(endpoint);
  if (!modelsEndpoint) {
    sendJson(res, 400, { error: "请先填写接口地址。" });
    return;
  }

  const response = await fetch(modelsEndpoint, {
    method: "GET",
    headers: apiHeaders(apiKey),
  });
  const text = await response.text();
  if (!response.ok) {
    sendJson(res, response.status, { error: text || "模型列表拉取失败。" });
    return;
  }

  sendJson(res, 200, JSON.parse(text));
}

async function handleBriefRun(req, res) {
  const { endpoint, apiKey, model, input, prompt, messages } = await readJson(req);
  const runEndpoint = inferChatCompletionsEndpoint(endpoint);
  if (!runEndpoint) {
    sendJson(res, 400, { error: "请先填写接口地址。" });
    return;
  }

  const response = await fetch(runEndpoint, {
    method: "POST",
    headers: apiHeaders(apiKey),
    body: JSON.stringify({ model: model || undefined, input, prompt, messages }),
  });
  const text = await response.text();
  if (!response.ok) {
    sendJson(res, response.status, { error: text || "Brief 解析 API 调用失败。" });
    return;
  }

  sendJson(res, 200, JSON.parse(text));
}

async function handleMarketingResearchRun(req, res) {
  const { endpoint, apiKey, model, input, prompt, messages } = await readJson(req);
  const runEndpoint = inferChatCompletionsEndpoint(endpoint);
  if (!runEndpoint) {
    sendJson(res, 400, { error: "请先填写接口地址。" });
    return;
  }

  const response = await fetch(runEndpoint, {
    method: "POST",
    headers: apiHeaders(apiKey),
    body: JSON.stringify({ model: model || undefined, input, prompt, messages }),
  });
  const text = await response.text();
  if (!response.ok) {
    sendJson(res, response.status, { error: text || "营销调研 API 调用失败。" });
    return;
  }

  sendJson(res, 200, JSON.parse(text));
}

async function serveStatic(req, res) {
  const rawPath = new URL(req.url || "/", `http://${req.headers.host}`).pathname;
  const safePath = normalize(rawPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(distDir, safePath === "/" ? "index.html" : safePath);

  try {
    const file = await readFile(filePath);
    res.writeHead(200, { "content-type": contentTypes[extname(filePath)] || "application/octet-stream" });
    res.end(file);
  } catch {
    try {
      const index = await readFile(join(distDir, "index.html"));
      res.writeHead(200, { "content-type": contentTypes[".html"] });
      res.end(index);
    } catch {
      sendJson(res, 404, { error: "dist not found. Run npm run build first." });
    }
  }
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    if (url.pathname.startsWith("/api/state/")) {
      await handleState(req, res, decodeURIComponent(url.pathname.replace("/api/state/", "")));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/brief-models") {
      await handleBriefModels(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/brief-run") {
      await handleBriefRun(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/marketing-research-models") {
      await handleBriefModels(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/marketing-research-run") {
      await handleMarketingResearchRun(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/brief-files") {
      await handleBriefFiles(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/resources/upload") {
      await handleResourceUpload(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/resources/search") {
      await handleResourceSearch(req, res);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/erp/resources") {
      await handleErpResources(req, res);
      return;
    }

    if (req.method === "GET" && url.pathname === "/erp-attachment-preview") {
      await handleErpAttachmentPreview(req, res, url);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/erp/attachment") {
      await handleErpAttachmentDownload(req, res, url);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/erp/attachment/read") {
      await handleErpAttachmentRead(req, res, url);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/erp/login") {
      await handleErpLogin(req, res);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/erp/status") {
      await handleErpStatus(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/erp/sync") {
      await handleErpSync(req, res);
      return;
    }

    if (url.pathname === "/api/search-settings") {
      await handleSearchSettings(req, res);
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      sendJson(res, 404, { error: "api not found" });
      return;
    }

    await serveStatic(req, res);
  } catch (error) {
    sendJson(res, error?.status || 500, { error: error instanceof Error ? error.message : "server error", payload: error?.payload });
  }
}).listen(port, () => {
  console.log(`Workbench API ready: http://localhost:${port}`);
});
