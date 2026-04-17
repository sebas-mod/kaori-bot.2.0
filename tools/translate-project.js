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
  copyOnlyDirectories: ['.git', 'node_modules'],
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
    throw new Error('Instala la dependencia: npm install @vitalets/google-translate-api');
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
    cache: new Map()
  };

  if (!inPlace) {
    await fsp.rm(outputRoot, { recursive: true, force: true });
  }

  await walkDirectory(inputRoot, state);
  console.log('Traduccion terminada.');
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
    if (arg === '--in-place') {
      args.inPlace = true;
    }
  }
  return args;
}

function resolveInputRoot(cli) {
  if (cli.scope === 'plugins') return path.join(projectRoot, 'plugins');
  if (cli.scope === 'plugin') return path.join(projectRoot, 'plugins', cli.plugin);
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
        if (!state.inPlace) await copyTree(sourcePath, destPath);
        continue;
      }
      await walkDirectory(sourcePath, state);
      continue;
    }

    const ext = path.extname(sourcePath).toLowerCase();
    if (!state.config.textExtensions.includes(ext)) {
      if (!state.inPlace) {
        await ensureParent(destPath);
        await fsp.copyFile(sourcePath, destPath);
      }
      continue;
    }

    const raw = await fsp.readFile(sourcePath, 'utf8');
    const translated = ext === '.js'
      ? await translateJsVisibleStrings(raw, state)
      : await translateGenericText(raw, state);

    await ensureParent(destPath);
    await fsp.writeFile(destPath, translated, 'utf8');
  }
}

async function translateJsVisibleStrings(code, state) {
  return code.replace(/(['"`])((?:\\.|(?!\1).)*)\1/g, (match, quote, text) => {
    return `__TRANS_${Buffer.from(JSON.stringify({ quote, text })).toString('base64')}__`;
  }).replace(/__TRANS_([A-Za-z0-9+/=]+)__/g, (_, encoded) => {
    return `__PENDING__${encoded}__`;
  }).replace(/__PENDING__([A-Za-z0-9+/=]+)__/g, (_, encoded) => {
    return `__ASYNC__${encoded}__`;
  });
}

async function translateGenericText(content, state) {
  const lines = content.split(/\r?\n/);
  const out = [];

  for (const line of lines) {
    out.push(await translateLine(line, state));
  }

  return out.join('\n');
}

async function translateLine(line, state) {
  const pieces = line.split(/(`[^`]*`|https?:\/\/\S+|www\.\S+|\s+)/g).filter(Boolean);
  const out = [];

  for (const piece of pieces) {
    if (shouldSkipPiece(piece, state.config)) {
      out.push(piece);
      continue;
    }
    out.push(await translateText(piece, state));
  }

  return out.join('');
}

function shouldSkipPiece(text, config) {
  const value = String(text || '');
  if (!/\p{L}/u.test(value)) return true;
  if (config.skipPatterns.some((pattern) => new RegExp(pattern, 'u').test(value.trim()))) return true;

  const trimmed = value.trim();

  if (config.commandPrefixes.some((prefix) => trimmed.startsWith(prefix))) return true;
  if (/^[a-zA-Z0-9_]+\s*=/.test(trimmed)) return true;
  if (/^(const|let|var|function|return|if|else|for|while|switch|case|module\.exports|exports\.)\b/.test(trimmed)) return true;

  return false;
}

async function translateText(text, state) {
  const trimmed = text.trim();

  if (!looksLikeHumanMessage(trimmed, state.config)) {
    return text;
  }

  if (state.cache.has(trimmed)) {
    return text.replace(trimmed, state.cache.get(trimmed));
  }

  const prepared = protectTerms(trimmed, state.config.protectedTerms);
  const result = await translate(prepared.value, {
    from: state.config.sourceLanguage,
    to: state.config.targetLanguage
  });

  const restored = restoreTerms(result.text, prepared.tokens);
  state.cache.set(trimmed, restored);
  return text.replace(trimmed, restored);
}

function looksLikeHumanMessage(text, config) {
  if (text.length < 4) return false;
  if (config.commandPrefixes.some((prefix) => text.startsWith(prefix))) return false;
  if (/^[a-z0-9_.-]+$/i.test(text)) return false;
  if (/^[A-Z0-9_ -]+$/.test(text)) return false;
  if (/^\w+\([^)]*\)$/.test(text)) return false;
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

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
