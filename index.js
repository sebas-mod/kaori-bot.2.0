require('./src/lib/ourin-agent').initializeAgent()

const Module = require('module');
const originalRequire = Module.prototype.require;
let isSharpFailed = false;

Module.prototype.require = function(request) {
  if (request === 'sharp') {
    try {
      return originalRequire.call(this, request);
    } catch (e) {
      if (!isSharpFailed) {
        console.warn("\n⚠️ [OURIN-WARN] El módulo 'sharp' no es compatible en este sistema (Termux/Android).");
        console.warn("⚠️ Las funciones que requieren 'sharp' usarán JIMP/FFmpeg como alternativa.\n");
        isSharpFailed = true;
      }
      const dummySharp = function(input) {
        let _w = null, _h = null, _fmt = null;
        const chain = {
          resize: (w, h) => { _w = w; _h = h; return chain; },
          webp: () => { throw new Error("WebP no es compatible con el fallback de JIMP. Usando FFmpeg."); },
          jpeg: () => { _fmt = 'jpeg'; return chain; },
          png: () => { _fmt = 'png'; return chain; },
          toBuffer: async () => {
            try {
              const jimp = originalRequire.call(this, 'jimp');
              if (Buffer.isBuffer(input) || typeof input === 'string') {
                const img = await jimp.read(input);
                if (_w || _h) img.resize(_w || jimp.AUTO, _h || jimp.AUTO);
                if (_fmt === 'png') return await img.getBufferAsync(jimp.MIME_PNG);
                if (_fmt === 'jpeg') return await img.getBufferAsync(jimp.MIME_JPEG);
                return await img.getBufferAsync(jimp.MIME_JPEG);
              }
            } catch (err) {}
            return Buffer.isBuffer(input) ? input : Buffer.from([]);
          }
        };
        return chain;
      };
      dummySharp.cache = () => {};
      dummySharp.concurrency = () => {};
      dummySharp.counters = () => {};
      dummySharp.disableCache = () => {};
      dummySharp.format = { webp: 'webp', jpeg: 'jpeg', png: 'png' };
      return dummySharp;
    }
  }
  return originalRequire.call(this, request);
};

const LOG_NOISE = new Set([
  'Closing', 'prekey', '_chains', 'registrationId',
  'chainKey', 'ephemeralKeyPair', 'rootKey', 'indexInfo',
  'pendingPreKey', 'currentRatchet', 'baseKey', 'privKey'
])
const _log = console.log
console.log = (...args) => {
  const first = typeof args[0] === 'string' ? args[0] : ''
  for (const noise of LOG_NOISE) {
    if (first.includes(noise)) return
  }
  _log.apply(console, args)
}

const path = require("path");
const fs = require("fs");
const config = require("./config");
const { startConnection } = require("./src/connection");
const {
  messageHandler,
  groupHandler,
  messageUpdateHandler,
  groupSettingsHandler,
} = require("./src/handler");
const { loadPlugins, pluginStore } = require("./src/lib/ourin-plugins");
const { initDatabase, getDatabase } = require("./src/lib/ourin-database");
const {
  initScheduler,
  loadScheduledMessages,
  startGroupScheduleChecker,
  startSewaChecker,
} = require("./src/lib/ourin-scheduler");
const { startAutoBackup } = require("./src/lib/ourin-backup");
const { handleAntiTagSW } = require("./src/lib/ourin-group-protection");
const { initSholatScheduler } = require("./src/lib/ourin-sholat-scheduler");
const { startMemoryMonitor } = require("./src/lib/ourin-memory-monitor");
const { startTempCleaner } = require("./src/lib/ourin-temp-cleaner");
const { startDailyPruner } = require("./src/lib/ourin-data-pruner");

try {
  const { startOrderPoller } = require("./src/lib/ourin-order-poller");
} catch {}
try {
  const { startOtpPoller } = require("./src/lib/ourin-otp-poller");
} catch {}

const {
  logger,
  c,
  printBanner,
  printStartup,
  logConnection,
  logErrorBox,
  logPlugin,
  divider,
} = require("./src/lib/ourin-logger");

/**
 * Tiempo de inicio para calcular el tiempo de arranque
 */
const startTime = Date.now();

/**
 * Watcher para recarga automática de plugins en modo desarrollo
 */
let pluginWatcher = null;
const reloadDebounce = new Map();

/**
 * Caché de archivos para mejorar precisión del watcher
 */
const fileStatCache = new Map();

/**
 * Iniciar watcher de plugins
 */
function startDevWatcher(pluginsPath) {
  if (pluginWatcher) {
    pluginWatcher.close();
  }

  logger.system("dev", "recarga en caliente de plugins activa");

  pluginWatcher = fs.watch(
    pluginsPath,
    { recursive: true },
    (eventType, filename) => {
      if (!filename || !filename.endsWith(".js")) return;

      const existingTimeout = reloadDebounce.get(filename);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        reloadDebounce.delete(filename);

        const fullPath = path.join(pluginsPath, filename);

        if (!fs.existsSync(fullPath)) {
          fileStatCache.delete(fullPath);
          const pluginName = path.basename(filename, ".js");
          const { unloadPlugin } = require("./src/lib/ourin-plugins");
          const result = unloadPlugin(pluginName);
          if (result.success) {
            logger.warn("plugin", `eliminado ${filename}`);
          }
          return;
        }

        try {
          const stats = fs.statSync(fullPath);
          const cached = fileStatCache.get(fullPath);
          
          const changed = !cached || cached.mtimeMs !== stats.mtimeMs || cached.size !== stats.size;
          if (!changed) return;
          
          fileStatCache.set(fullPath, {
            mtimeMs: stats.mtimeMs,
            size: stats.size
          });

          const { hotReloadPlugin } = require("./src/lib/ourin-plugins");
          const result = hotReloadPlugin(fullPath);
          
          if (!result.success) {
             logger.error("plugin", `falló recarga: ${filename}: ${result.error}`);
          }
        } catch (error) {
          logger.error("plugin", `falló recarga: ${filename}: ${error.message}`);
        }
      }, 500);

      reloadDebounce.set(filename, timeout);
    },
  );

  logger.debug("dev", `observando ${pluginsPath}`);
}

/**
 * Anti-crash
 */
function setupAntiCrash() {
  process.on("uncaughtException", (error) => {
    logErrorBox("excepción no capturada", error.message)
    logger.system("sistema", "el bot sigue en ejecución")
  });

  process.on("unhandledRejection", (reason) => {
    logErrorBox("promesa no manejada", String(reason))
    logger.system("sistema", "el bot sigue en ejecución")
  });

  process.on("SIGINT", () => {
    logger.system("sistema", "señal de detención recibida")
    logger.info("base de datos", "guardando datos...")
    process.exit(0);
  });

  logger.success("sistema", "anti-crash activado");
}

/**
 * Función principal
 */
async function main() {
  printBanner();

  setupAntiCrash();

  const dbPath = path.join(process.cwd(), config.database?.path || "./database/main");
  await initDatabase(dbPath);

  logger.success("base de datos", "lista");

  const pluginsPath = path.join(process.cwd(), "plugins");
  const pluginCount = loadPlugins(pluginsPath);
  logger.success("plugin", `${pluginCount} plugins cargados`);

  logger.info("whatsapp", "conectando...");

  await startConnection({});
}

main().catch((error) => {
  logErrorBox("Error fatal", error.message);
  process.exit(1);
});
