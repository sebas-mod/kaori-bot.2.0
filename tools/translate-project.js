'use strict';

const fsp = require('fs/promises');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const configPath = path.join(__dirname, 'translation.config.json');

async function loadCopilot() {
  const mod = await import(pathToFileUrl(path.join(__dirname, 'copilot.js')));
  return mod.Copilot;
}

function pathToFileUrl(filePath) {
  const resolved = path.resolve(filePath).replace(/\\/g, '/');
  return new URL(`file://${resolved.startsWith('/') ? '' : '/'}${resolved}`).href;
}

const defaultConfig = {
  targetLanguage: 'es',
  copyOnlyDirectories: ['.git', 'node_modules', 'assets', 'database'],
  copyOnlyFiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'],
  textExtensions: ['.js', '.json', '.md', '.txt'],
  protectedTerms: ['WhatsApp', 'Baileys', 'Node.js', 'API', 'AI', '.menu', '.owner', '.play', '.help'],
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
  const Copilot = await loadCopilot();
  const copilot = new Copilot();

  const cli = parseArgs(process.argv.slice(2));
  const fileConfig = await loadJson(configPath);
  const config = { ...defaultConfig, ...fileConfig };

  const inputRoot = resolveInputRoot(cli);
  const inPlace = Boolean(cli.inPlace);
  const outputRoot = inPlace
    ? inputRoot
    : path.join(path.dirname(inputRoot), `${path.basename(inputRoot)}-${config.targetLanguage}`);

  const state = {
    copilot,
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
    },
    errorDetails: []
  };

  console.log('USANDO TRADUCTOR COPILOT');
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
    if (!cli.plugin) throw new Error('Si usas --scope plugin debes indicar --plugin');
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
        if (!state.inPlace) await copyTree(sourcePath, destPath);
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
      state.errorDetails.push({
        file: sourcePath,
        message: error.message,
        stack: error.stack || ''
      });
      console.log(`[ERROR] ${sourcePath} :: ${error.message}`);
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
  const translated = extension === '.js'
    ? await translateJsVisibleStrings(raw, state, sourcePath)
    : await translateGenericText(raw, state, sourcePath);

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
  const regex = /(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(code)) !== null) {
    const fullMatch = match[0];
    const quote = match[1];
    const content = match[2];
    const start = match.index;

    result += code.slice(lastIndex, start);

    const decoded = unescapeJsString(content);
    const trimmed = decoded.trim();

    if (!looksLikeHumanMessage(trimmed, state.config)) {
      result += fullMatch;
    } else {
      const translated = await translateText(decoded, state, filePath);
      result += `${quote}${escapeJsString(translated)}${quote}`;
    }

    lastIndex = start + fullMatch.length;
  }

  result += code.slice(lastIndex);
  return result;
}

async function translateGenericText(content, state, filePath) {
  const lines = content.split(/\r?\n/);
  const out = [];

  for (const line of lines) {
    const pieces = line.split(/(`[^`]*`|https?:\/\/\S+|www\.\S+|\s+)/g).filter(Boolean);
    const row = [];

    for (const piece of pieces) {
      if (shouldSkipPiece(piece, state.config)) row.push(piece);
      else row.push(await translateText(piece, state, filePath));
    }

    out.push(row.join(''));
  }

  return out.join('\n');
}

async function translateText(text, state, filePath = '') {
  const trimmed = text.trim();
  if (!looksLikeHumanMessage(trimmed, state.config)) return text;

  const cacheKey = `${state.config.targetLanguage}|${trimmed}`;
  if (state.cache.has(cacheKey)) {
    return text.replace(trimmed, state.cache.get(cacheKey));
  }

  const translated = await translateWithCopilot(trimmed, state);

  if (translated && translated !== trimmed) {
    console.log(`[TRADUCIDO] ${filePath} :: "${trimmed}" -> "${translated}"`);
    state.stats.textsTranslated += 1;
  }

  state.cache.set(cacheKey, translated);
  return text.replace(trimmed, translated);
}

async function translateWithCopilot(text, state) {
  const prompt = [
    `Traduce al ${state.config.targetLanguage} solo este texto visible para usuario.`,
    'No cambies comandos, variables, rutas, nombres técnicos ni sintaxis.',
    `No traduzcas estos términos: ${state.config.protectedTerms.join(', ')}.`,
    'Devuelve solo el texto traducido.',
    '',
    text
  ].join('\n');

  const res = await state.copilot.ask(prompt, {
    sessionId: 'translator',
    model: 'default'
  });

  return (res.text || text).trim();
}

function shouldSkipPiece(text, config) {
  const value = String(text || '');
  if (!/\p{L}/u.test(value)) return true;

  const trimmed = value.trim();
  if (!trimmed) return true;
  if (config.skipPatterns.some((pattern) => new RegExp(pattern, 'u').test(trimmed))) return true;
  if (config.commandPrefixes.some((prefix) => trimmed.startsWith(prefix))) return true;
  if (/^[a-zA-Z0-9_]+\s*=/.test(trimmed)) return true;
  return false;
}

function looksLikeHumanMessage(text, config) {
  if (!text || text.length < 4) return false;
  if (config.commandPrefixes.some((prefix) => text.startsWith(prefix))) return false;
  if (/^[a-z0-9_.-]+$/i.test(text)) return false;
  if (/^\w+\([^)]*\)$/.test(text)) return false;
  return /\s|[?!,:;]/.test(text);
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

    if (entry.isDirectory()) await copyTree(sourcePath, destPath);
    else {
      await ensureParent(destPath);
      await fsp.copyFile(sourcePath, destPath);
    }
  }
}

async function ensureParent(filePath) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
}

async function writeReport(state) {
  const reportPath = path.join(projectRoot, 'translation-report.json');
  const report = {
    generatedAt: new Date().toISOString(),
    inputRoot: state.inputRoot,
    outputRoot: state.outputRoot,
    inPlace: state.inPlace,
    stats: state.stats,
    errors: state.errorDetails
  };

  await fsp.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

main().catch((error) => {
  console.log('');
  console.log(`Fallo el traductor: ${error.message}`);
  process.exitCode = 1;
});
