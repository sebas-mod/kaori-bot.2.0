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
  textExtensions: ['.md', '.txt', '.js', '.json', '.yml', '.yaml', '.sh', '.env', '.example'],
  protectedTerms: [],
  skipPatterns: []
};

async function main() {
  if (!translate) {
    throw new Error(
      'No se encontro @vitalets/google-translate-api. Ejecuta npm install antes de usar este traductor.'
    );
  }

  const cli = parseArgs(process.argv.slice(2));
  const fileConfig = await loadJson(configPath);
  const config = {
    ...defaultConfig,
    ...fileConfig
  };

  const inputRoot = resolveInputRoot(cli);
  const targetLanguage = cli.to || config.targetLanguage;
  const outputRoot = resolveOutputRoot({ cli, inputRoot, targetLanguage });
  const inPlace = Boolean(cli.inPlace);

  if (!inPlace && samePath(inputRoot, outputRoot)) {
    throw new Error('La carpeta de salida no puede ser la misma que la carpeta de entrada.');
  }

  const state = {
    config: {
      ...config,
      targetLanguage
    },
    inputRoot,
    outputRoot,
    inPlace,
    cache: new Map(),
    stats: {
      copied: 0,
      translated: 0,
      skipped: 0,
      errors: 0
    }
  };

  console.log(`Entrada: ${inputRoot}`);
  console.log(`Salida: ${inPlace ? inputRoot : outputRoot}`);
  console.log(`Scope: ${cli.scope || 'base'}`);
  if (cli.plugin) {
    console.log(`Plugin: ${cli.plugin}`);
  }

  if (!inPlace) {
    await fsp.rm(outputRoot, { recursive: true, force: true });
  }

  await walkDirectory(inputRoot, state);

  if (!inPlace) {
    await writeReport(state);
  }

  console.log('');
  console.log('Proceso completado.');
  console.log(`Traducidos: ${state.stats.translated}`);
  console.log(`Copiados: ${state.stats.copied}`);
  console.log(`Saltados: ${state.stats.skipped}`);
  console.log(`Errores: ${state.stats.errors}`);
}

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--input' && argv[i + 1]) {
      args.input = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--output' && argv[i + 1]) {
      args.output = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--to' && argv[i + 1]) {
      args.to = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--scope' && argv[i + 1]) {
      args.scope = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--plugin' && argv[i + 1]) {
      args.plugin = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--in-place') {
      args.inPlace = true;
    }
  }

  return args;
}

function resolveInputRoot(cli) {
  if (cli.input) {
    return path.resolve(cli.input);
  }

  if (cli.scope === 'plugins') {
    return path.join(projectRoot, 'plugins');
  }

  if (cli.scope === 'plugin') {
    if (!cli.plugin) {
      throw new Error('Si usas --scope plugin debes indicar --plugin nombre-del-plugin');
    }
    return path.join(projectRoot, 'plugins', cli.plugin);
  }

  return projectRoot;
}

function resolveOutputRoot({ cli, inputRoot, targetLanguage }) {
  if (cli.inPlace) {
    return inputRoot;
  }

  if (cli.output) {
    return path.resolve(cli.output);
  }

  return path.join(path.dirname(inputRoot), `${path.basename(inputRoot)}-${targetLanguage}`);
}

async function loadJson(filePath) {
  try {
    return JSON.parse(await fsp.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

async function walkDirectory(currentDir, state) {
  const relativeDir = path.relative(state.inputRoot, currentDir);
  const relativePosix = toPosix(relativeDir);

  if (relativeDir && shouldCopyOnlyDirectory(relativePosix, state.config)) {
    if (!state.inPlace) {
      await copyTree(currentDir, path.join(state.outputRoot, relativeDir), state);
    }
    return;
  }

  const targetDir = state.inPlace ? currentDir : path.join(state.outputRoot, relativeDir);
  await fsp.mkdir(targetDir, { recursive: true });
  const entries = await fsp.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(currentDir, entry.name);
    const relativePath = path.relative(state.inputRoot, sourcePath);
    const relativePosixPath = toPosix(relativePath);
    const destPath = state.inPlace ? sourcePath : path.join(state.outputRoot, relativePath);

    if (entry.isDirectory()) {
      await walkDirectory(sourcePath, state);
      continue;
    }

    await ensureParent(destPath);

    if (shouldCopyOnlyFile(relativePosixPath, state.config)) {
      if (!state.inPlace) {
        await fsp.copyFile(sourcePath, destPath);
        state.stats.copied += 1;
      }
      continue;
    }

    try {
      const handled = await processFile(sourcePath, destPath, state);
      if (!handled && !state.inPlace) {
        await fsp.copyFile(sourcePath, destPath);
        state.stats.copied += 1;
      }
    } catch (error) {
      state.stats.errors += 1;
      console.error(`Error en ${relativePosixPath}: ${error.message}`);
      if (!state.inPlace) {
        await fsp.copyFile(sourcePath, destPath);
        state.stats.copied += 1;
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
  const translated = await translateWholeText(raw, state);
  await fsp.writeFile(destPath, translated, 'utf8');
  state.stats.translated += 1;
  return true;
}

async function translateWholeText(content, state) {
  if (!content.trim()) {
    return content;
  }

  const parts = splitPreservingLargeTokens(content);
  const translated = [];

  for (const part of parts) {
    if (!part.trim() || shouldSkipToken(part, state.config)) {
      translated.push(part);
      continue;
    }

    translated.push(await translateText(part, state));
  }

  return translated.join('');
}

function splitPreservingLargeTokens(content) {
  return content.split(/(\s+|`[^`]*`|https?:\/\/\S+|www\.\S+)/g).filter(Boolean);
}

async function translateText(text, state) {
  const normalized = normalizeBrokenEncoding(text);
  if (!normalized.trim() || shouldSkipToken(normalized, state.config)) {
    return text;
  }

  const cacheKey = `${state.config.sourceLanguage}|${state.config.targetLanguage}|${normalized}`;
  if (state.cache.has(cacheKey)) {
    return state.cache.get(cacheKey);
  }

  const prepared = protectTerms(normalized, state.config.protectedTerms);
  const translated = await translate(prepared.value, {
    from: state.config.sourceLanguage,
    to: state.config.targetLanguage
  });
  const restored = restoreProtectedTerms(translated.text, prepared.tokens);
  state.cache.set(cacheKey, restored);
  return restored;
}

function shouldSkipToken(text, config) {
  const value = String(text || '');
  if (!/\p{L}/u.test(value)) {
    return true;
  }

  return config.skipPatterns.some((pattern) => new RegExp(pattern, 'u').test(value.trim()));
}

function normalizeBrokenEncoding(text) {
  if (!/[Ãâ]/.test(text)) {
    return text;
  }

  try {
    const bytes = Buffer.from(text, 'latin1');
    const decoded = bytes.toString('utf8');
    return /\p{L}/u.test(decoded) ? decoded : text;
  } catch (error) {
    return text;
  }
}

function protectTerms(text, terms) {
  let output = text;
  const tokens = [];

  for (let i = 0; i < terms.length; i += 1) {
    const token = `__KEEP_${i}__`;
    const term = terms[i];
    output = output.replace(new RegExp(escapeRegex(term), 'g'), token);
    tokens.push([token, term]);
  }

  return { value: output, tokens };
}

function restoreProtectedTerms(text, tokens) {
  let output = text;
  for (const [token, original] of tokens) {
    output = output.replace(new RegExp(escapeRegex(token), 'g'), original);
  }
  return output;
}

async function copyTree(sourceDir, destDir, state) {
  await fsp.mkdir(destDir, { recursive: true });
  const entries = await fsp.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      await copyTree(sourcePath, destPath, state);
      continue;
    }

    await ensureParent(destPath);
    await fsp.copyFile(sourcePath, destPath);
    state.stats.copied += 1;
  }
}

async function ensureParent(filePath) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
}

async function writeReport(state) {
  const report = {
    generatedAt: new Date().toISOString(),
    inputRoot: state.inputRoot,
    outputRoot: state.outputRoot,
    targetLanguage: state.config.targetLanguage,
    stats: state.stats
  };

  await fsp.writeFile(
    path.join(state.outputRoot, 'translation-report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
}

function shouldCopyOnlyDirectory(relativePath, config) {
  return config.copyOnlyDirectories.some((dir) => relativePath === dir || relativePath.startsWith(`${dir}/`));
}

function shouldCopyOnlyFile(relativePath, config) {
  return config.copyOnlyFiles.some((file) => relativePath === file);
}

function samePath(left, right) {
  return path.resolve(left).toLowerCase() === path.resolve(right).toLowerCase();
}

function toPosix(value) {
  return String(value || '').replace(/\\/g, '/');
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main().catch((error) => {
  console.error('');
  console.error(`Fallo el traductor: ${error.message}`);
  process.exitCode = 1;
});
