import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import formidable from "formidable";
import mammoth from "mammoth";
import xlsx from "xlsx";
import { PDFParse } from "pdf-parse";

const port = Number(process.env.PORT || 8787);
const dataDir = join(process.cwd(), "data");
const dbPath = join(dataDir, "workbench-db.json");
const distDir = join(process.cwd(), "dist");
const uploadDir = join(dataDir, "uploads");
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
  await writeFile(dbPath, JSON.stringify(db, null, 2));
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

async function extractText(file) {
  const originalName = file.originalFilename || "未命名文件";
  const extension = extname(originalName).toLowerCase();
  const filePath = file.filepath;

  if ([".txt", ".md", ".csv"].includes(extension)) {
    return await readFile(filePath, "utf8");
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  if ([".xlsx", ".xls"].includes(extension)) {
    const workbook = xlsx.readFile(filePath);
    return workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      return `# ${sheetName}\n${xlsx.utils.sheet_to_csv(sheet)}`;
    }).join("\n\n");
  }

  if (extension === ".pdf") {
    const buffer = await readFile(filePath);
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
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
    let parseStatus = "成功";
    let parseError = "";

    try {
      parsedText = await extractText(file);
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
    };
    return { ...resource, chunks: buildResourceChunks(resource) };
  }));

  sendJson(res, 200, { resources });
}

async function handleResourceSearch(req, res) {
  const { query, filters = {} } = await readJson(req);
  const db = await readDb();
  const settings = { ...defaultSearchSettings, ...(db["strategy-center-search-settings"] || {}) };
  const resources = Array.isArray(db["strategy-center-resources"]) ? db["strategy-center-resources"] : [];
  const keywords = keywordList(query);

  if (!keywords.length && !Object.values(filters).some(Boolean)) {
    sendJson(res, 200, { results: resources.map((resource) => ({ resource, score: 0, snippets: [] })) });
    return;
  }

  const queryEmbedding = await embedWithSettings(query, settings);
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
      const score = keywordScore + Math.round(semanticScore * 100);
      const keywordSnippets = keywords
        .map((keyword) => makeSnippet(content || summary || title, keyword))
        .filter(Boolean)
        .slice(0, 3);
      const semanticSnippets = semanticMatches.filter((item) => item.similarity > 0).slice(0, 2).map((item) => item.chunk.text.slice(0, 180));
      const snippets = Array.from(new Set([...keywordSnippets, ...semanticSnippets])).slice(0, 3);
      return { resource, score, keywordScore, semanticScore, searchMode: settings.mode, snippets };
    })
    .filter((item) => !keywords.length || item.score > 0)
    .sort((a, b) => b.score - a.score || String(b.resource.uploadedAt || "").localeCompare(String(a.resource.uploadedAt || "")));

  sendJson(res, 200, { results });
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
  if (!endpoint) {
    sendJson(res, 400, { error: "请先填写接口地址。" });
    return;
  }

  const response = await fetch(endpoint, {
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

    if (req.method === "POST" && url.pathname === "/api/resources/upload") {
      await handleResourceUpload(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/resources/search") {
      await handleResourceSearch(req, res);
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
    sendJson(res, 500, { error: error instanceof Error ? error.message : "server error" });
  }
}).listen(port, () => {
  console.log(`Workbench API ready: http://localhost:${port}`);
});
