'use strict';

const fsp = require('fs/promises');
const path = require('path');

let translate;
try {
  ({ translate } = require('@vitalets/google-translate-api'));
} catch (error) {
  translate = null;
}

const projectRoot = path.resolve(__dirname, '..');
const configPath = path.join(__dirname, 'translation.config.json');

const defaultConfig = {
  sourceLanguage: 'auto',
  targetLanguage: 'es',
  copyOnlyDirectories: ['.git', 'node_modules', 'assets', 'database'],
  copyOnlyFiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'],
  textExtensions: ['.js', '.json', '.md', '.txt'],
  protectedTerms: ['WhatsApp', 'Baileys', 'Node.js', 'API', 'AI'],
  commandPrefixes: ['.', '#', '!', '/', '\\'],
  skipPatterns: [
    '^https?://',
    '^www\\.',
    '^[A-Za-z]:\\\\',
    '^[./~\\\\]',
    '^[A-Za-z0-9_.-]+$'
  ]
};

async function main() {
  if (!translate) {
    throw new Error('No se encontro @vitalets/google-translate-api. Ejecuta npm install @vitalets/google-translate-api');
  }

  const cli = parseArgs(process.argv.slice(2));
  const fileConfig = await loadJson(configPath);
  const config = { ...defaultConfig, ...fileConfig };

  const inputRoot = resolveInputRoot(cli);
  const inPlace = Boolean(cli.inPlace);
  const outputRoot = inPlace
    ? inputRoot
    : path.join(path.dirname(inputRoot), `${path.basename(inputRoot)}-${config.targetLanguage}`);

  const state = {
    config,
    inputRoot,
    outputRoot,
    inPlace,
    cache: new Map(),
    stats: {
      filesTranslated: 0,
      textsTranslated: 0,
      skipped: 0,
      errors: 0
    }
  };

  console.log(`Entrada: ${inputRoot}`);
  console.log(`Salida: ${outputRoot}`);
  console.log(`Modo: ${inPlace ? 'in-place' : 'copia'}`);

  if (!inPlace) {
    await fsp.rm(outputRoot, { recursive: true, force: true });
  }

  await walkDirectory(inputRoot, state);
  await writeReport(state);

  console.log('');
  console.log('Proceso completado.');
  console.log(`Archivos traducidos: ${state.stats.filesTranslated}`);
  console.log(`Textos traducidos: ${state.stats.textsTranslated}`);
  console.log(`Archivos saltados: ${state.stats.skipped}`);
  console.log(`Errores: ${state.stats.errors}`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--scope' && argv[i + 1]) {
      args.scope = argv[++i];
      continue;
    }
    if (arg === '--plugin' && argv[i + 1]) {
      args.plugin = argv[++i];
      continue;
    }
    if (arg === '--input' && argv[i + 1]) {
      args.input = argv[++i];
      continue;
    }
    if (arg === '--output' && argv[i + 1]) {
      args.output = argv[++i];
      continue;
    }
    if (arg === '--in-place') {
      args.inPlace = true;
    }
  }
  return args;
}

function resolveInputRoot(cli) {
  if (cli.input) return path.resolve(cli.input);
  if (cli.scope === 'plugins') return path.join(projectRoot, 'plugins');
  if (cli.scope === 'plugin') {
    if (!cli.plugin) {
      throw new Error('Si usas --scope plugin debes indicar --plugin nombre-del-plugin');
    }
    return path.join(projectRoot, 'plugins', cli.plugin);
  }
  return projectRoot;
}

async function loadJson(filePath) {
  try {
    return JSON.parse(await fsp.readFile(filePath, 'utf8'));
  } catch {
    return {};
  }
}

async function walkDirectory(currentDir, state) {
  const relativeDir = path.relative(state.inputRoot, currentDir);
  const targetDir = state.inPlace ? currentDir : path.join(state.outputRoot, relativeDir);

  await fsp.mkdir(targetDir, { recursive: true });
  const entries = await fsp.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(currentDir, entry.name);
    const relativePath = path.relative(state.inputRoot, sourcePath);
    const destPath = state.inPlace ? sourcePath : path.join(state.outputRoot, relativePath);

    if (entry.isDirectory()) {
      if (state.config.copyOnlyDirectories.includes(entry.name)) {
        if (!state.inPlace) {
          await copyTree(sourcePath, destPath);
        }
        continue;
      }
      await walkDirectory(sourcePath, state);
      continue;
    }

    if (state.config.copyOnlyFiles.includes(entry.name)) {
      if (!state.inPlace) {
        await ensureParent(destPath);
        await fsp.copyFile(sourcePath, destPath);
      }
      continue;
    }

    try {
      const handled = await processFile(sourcePath, destPath, state);
      if (!handled && !state.inPlace) {
        await ensureParent(destPath);
        await fsp.copyFile(sourcePath, destPath);
      }
    } catch (error) {
      state.stats.errors += 1;
      console.error(`[ERROR] ${sourcePath} :: ${error.message}`);
      if (!state.inPlace) {
        await ensureParent(destPath);
        await fsp.copyFile(sourcePath, destPath);
      }
    }
  }
}

async function processFile(sourcePath, destPath, state) {
  const extension = path.extname(sourcePath).toLowerCase();
  if (!state.config.textExtensions.includes(extension)) {
    state.stats.skipped += 1;
    return false;
  }

  const raw = await fsp.readFile(sourcePath, 'utf8');
  let translated = raw;

  if (extension === '.js') {
    translated = await translateJsVisibleStrings(raw, state, sourcePath);
  } else {
    translated = await translateGenericText(raw, state, sourcePath);
  }

  if (translated !== raw) {
    console.log(`[ARCHIVO] Traducido: ${sourcePath}`);
    state.stats.filesTranslated += 1;
  } else {
    console.log(`[ARCHIVO] Sin cambios: ${sourcePath}`);
  }

  await ensureParent(destPath);
  await fsp.writeFile(destPath, translated, 'utf8');
  return true;
}

async function translateJsVisibleStrings(code, state, filePath) {
  const stringRegex = /(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = stringRegex.exec(code)) !== null) {
    const fullMatch = match[0];
    const quote = match[1];
    const content = match[2];
    const start = match.index;

    result += code.slice(lastIndex, start);

    const translatedContent = await maybeTranslateJsString(content, state, filePath);
    result += `${quote}${translatedContent}${quote}`;

    lastIndex = start + fullMatch.length;
  }

  result += code.slice(lastIndex);
  return result;
}

async function maybeTranslateJsString(content, state, filePath) {
  const decoded = unescapeJsString(content);
  const trimmed = decoded.trim();

  if (!looksLikeHumanMessage(trimmed, state.config)) {
    return content;
  }

  const translated = await translateText(decoded, state, filePath);
  if (translated === decoded) {
    return content;
  }

  return escapeJsString(translated);
}

async function translateGenericText(content, state, filePath) {
  const lines = content.split(/\r?\n/);
  const out = [];

  for (const line of lines) {
    out.push(await translateLine(line, state, filePath));
  }

  return out.join('\n');
}

async function translateLine(line, state, filePath) {
  const pieces = line.split(/(`[^`]*`|https?:\/\/\S+|www\.\S+|\s+)/g).filter(Boolean);
  const out = [];

  for (const piece of pieces) {
    if (shouldSkipPiece(piece, state.config)) {
      out.push(piece);
      continue;
    }
    out.push(await translateText(piece, state, filePath));
  }

  return out.join('');
}

async function translateText(text, state, filePath = '') {
  const trimmed = text.trim();

  if (!looksLikeHumanMessage(trimmed, state.config)) {
    return text;
  }

  const cacheKey = `${state.config.sourceLanguage}|${state.config.targetLanguage}|${trimmed}`;
  if (state.cache.has(cacheKey)) {
    const cached = state.cache.get(cacheKey);
    return text.replace(trimmed, cached);
  }

  const prepared = protectTerms(trimmed, state.config.protectedTerms);
  const translatedText = await translateWithRetry(prepared.value, state);
  const restored = restoreTerms(translatedText, prepared.tokens);

  if (restored && restored !== trimmed) {
    console.log(`[TRADUCIDO] ${filePath} :: "${trimmed}" -> "${restored}"`);
    state.stats.textsTranslated += 1;
  }

  state.cache.set(cacheKey, restored);
  return text.replace(trimmed, restored);
}

async function translateWithRetry(text, state, attempts = 5) {
  let lastError;

  for (let i = 0; i < attempts; i += 1) {
    try {
      if (i > 0) {
        await sleep(2000 * i);
      }

      const result = await translate(text, {
        from: state.config.sourceLanguage,
        to: state.config.targetLanguage
      });

      await sleep(1200);
      return result.text;
    } catch (error) {
      lastError = error;
      const message = String(error.message || '');
      const isRateLimit = message.includes('Too Many Requests');

      if (!isRateLimit) {
        throw error;
      }

      console.log(`[REINTENTO ${i + 1}] Esperando por limite de Google...`);
      await sleep(5000 * (i + 1));
    }
  }

  throw lastError;
}

function shouldSkipPiece(text, config) {
  const value = String(text || '');
  if (!/\p{L}/u.test(value)) return true;

  const trimmed = value.trim();
  if (!trimmed) return true;
  if (config.skipPatterns.some((pattern) => new RegExp(pattern, 'u').test(trimmed))) return true;
  if (config.commandPrefixes.some((prefix) => trimmed.startsWith(prefix))) return true;
  if (/^[a-zA-Z0-9_]+\s*=/.test(trimmed)) return true;
  if (/^(const|let|var|function|return|if|else|for|while|switch|case|module\.exports|exports\.)\b/.test(trimmed)) {
    return true;
  }

  return false;
}

function looksLikeHumanMessage(text, config) {
  if (!text || text.length < 4) return false;
  if (config.commandPrefixes.some((prefix) => text.startsWith(prefix))) return false;
  if (/^[a-z0-9_.-]+$/i.test(text)) return false;
  if (/^[A-Z0-9_ -]+$/.test(text)) return false;
  if (/^\w+\([^)]*\)$/.test(text)) return false;
  if (/^[{}[\]();,:.=<>/+*\-_%|&!?#\\]+$/.test(text)) return false;
  return /\s|[?!,:;]/.test(text);
}

function protectTerms(text, terms) {
  let value = text;
  const tokens = [];

  for (let i = 0; i < terms.length; i += 1) {
    const token = `__KEEP_${i}__`;
    value = value.replace(new RegExp(escapeRegex(terms[i]), 'g'), token);
    tokens.push([token, terms[i]]);
  }

  return { value, tokens };
}

function restoreTerms(text, tokens) {
  let value = text;
  for (const [token, original] of tokens) {
    value = value.replace(new RegExp(escapeRegex(token), 'g'), original);
  }
  return value;
}

function unescapeJsString(value) {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, '\'')
    .replace(/\\\\/g, '\\');
}

function escapeJsString(value) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/"/g, '\\"')
    .replace(/'/g, '\\\'');
}

async function copyTree(sourceDir, destDir) {
  await fsp.mkdir(destDir, { recursive: true });
  const entries = await fsp.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      await copyTree(sourcePath, destPath);
    } else {
      await ensureParent(destPath);
      await fsp.copyFile(sourcePath, destPath);
    }
  }
}

async function ensureParent(filePath) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
}

async function writeReport(state) {
  const reportPath = state.inPlace
    ? path.join(state.inputRoot, 'translation-report.json')
    : path.join(state.outputRoot, 'translation-report.json');

  const report = {
    generatedAt: new Date().toISOString(),
    inputRoot: state.inputRoot,
    outputRoot: state.outputRoot,
    inPlace: state.inPlace,
    stats: state.stats
  };

  await fsp.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main().catch((error) => {
  console.error('');
  console.error(`Fallo el traductor: ${error.message}`);
  process.exitCode = 1;
});
