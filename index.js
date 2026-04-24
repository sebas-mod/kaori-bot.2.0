

require('./src/lib/ourin-agent').initializeAgent()

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
const { initAutoJpmScheduler } = require("./src/lib/ourin-auto-jpm");
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
 * Waktu start untuk menghitung boot time
 */
const startTime = Date.now();

/**
 * Watcher untuk auto-reload plugins di dev mode
 */
let pluginWatcher = null;
const reloadDebounce = new Map();

/**
 * Cache untuk file stat (mtimeMs dan size) agar debounce watcher lebih akurat
 */
const fileStatCache = new Map();

/**
 * Memulai file watcher untuk dev mode
 */
function startDevWatcher(pluginsPath) {
  if (pluginWatcher) {
    pluginWatcher.close();
  }

  logger.system("dev", "hot reload plugin aktif");

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
            logger.warn("plugin", `removed ${filename}`);
          }
          return;
        }

        try {
          const stats = fs.statSync(fullPath);
          const cached = fileStatCache.get(fullPath);
          
          const changed = !cached || cached.mtimeMs !== stats.mtimeMs || cached.size !== stats.size;
          if (!changed) return; // Prevent double trigger from text editor saving
          
          fileStatCache.set(fullPath, {
            mtimeMs: stats.mtimeMs,
            size: stats.size
          });

          const { hotReloadPlugin } = require("./src/lib/ourin-plugins");
          const result = hotReloadPlugin(fullPath);
          
          if (result.success) {
            // logger.success("Reloaded", result.name);
          } else {
             logger.error("plugin", `reload failed: ${filename}: ${result.error}`);
          }
        } catch (error) {
          logger.error("plugin", `reload failed: ${filename}: ${error.message}`);
        }
      }, 500);

      reloadDebounce.set(filename, timeout);
    },
  );

  logger.debug("dev", `watching ${pluginsPath}`);
}

/**
 * Watcher untuk src/lib dengan hot reload
 */
let srcWatcher = null;

function startSrcWatcher(srcPath) {
  if (srcWatcher) {
    srcWatcher.close();
  }

  logger.system("dev", "hot reload src aktif");

  srcWatcher = fs.watch(srcPath, { recursive: true }, (eventType, filename) => {
    if (!filename || !filename.endsWith(".js")) return;

    const existingTimeout = reloadDebounce.get("src_" + filename);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      reloadDebounce.delete("src_" + filename);

      const fullPath = path.join(srcPath, filename);

      if (!fs.existsSync(fullPath)) {
        logger.warn("dev", `src file removed: ${filename}`);
        return;
      }

      try {
        // Clear cache untuk file tersebut
        delete require.cache[require.resolve(fullPath)];
        logger.success("dev", `src reloaded: ${filename}`);
      } catch (error) {
        logger.error("dev", `src reload failed: ${filename}: ${error.message}`);
      }
    }, 500);

    reloadDebounce.set("src_" + filename, timeout);
  });

  logger.debug("dev", `watching ${srcPath}`);
}

/**
 * Setup anti-crash handlers
 */
function setupAntiCrash() {
  process.on("uncaughtException", (error, origin) => {
    const ignoredErrors = [
      'write EOF',
      'ECONNRESET',
      'EPIPE',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'read ECONNRESET'
    ];
    
    const isIgnored = ignoredErrors.some(msg => 
      error.message?.includes(msg) || error.code === msg
    );
    
    if (isIgnored) {
      return;
    }
    
    logErrorBox("uncaught exception", error.message)
    if (config.dev?.debugLog) {
      console.error(c.gray(error.stack))
    }
    logger.system("sistem", "bot masih berjalan")
  });


  process.on("unhandledRejection", (reason, promise) => {
    logErrorBox("unhandled rejection", String(reason))
    if (config.dev?.debugLog) {
      console.error(c.gray("Promise:"), promise)
    }
    logger.system("sistem", "bot masih berjalan")
  });

  process.on("warning", (warning) => {
    logger.warn("system", `${warning.name}: ${warning.message}`);
  });

  process.on("SIGINT", () => {
    console.log("");
    logger.system("sistem", "sinyal berhenti diterima")
    logger.info("database", "menyimpan data...")

    try {
      const { getDatabase } = require("./src/lib/ourin-database");
      const db = getDatabase();
      db.save();
      logger.success("database", "data tersimpan");
    } catch (error) {
      logger.warn("database", `save failed: ${error.message}`);
    }

    logger.info("sistem", "bot berhenti");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("");
    logger.system("sistem", "sinyal hentikan diterima");
    process.exit(0);
  });

  logger.success("sistem", "anti-crash aktif");
}

/**
 * Fungsi utama untuk memulai bot
 */
async function main() {
  printBanner();
  printStartup({
    name: config.bot?.name || "Ourin-AI",
    version: config.bot?.version || "1.0.0",
    developer: config.bot?.developer || "Developer",
    mode: config.mode || "public",
  });
  setupAntiCrash();

  const dbPath = path.join(
    process.cwd(),
    config.database?.path || "./database/main",
  );
  await initDatabase(dbPath);
  const db = getDatabase();

  const savedMode = db.setting("botMode");
  if (savedMode && (savedMode === "self" || savedMode === "public")) {
    config.mode = savedMode;
  }
  const savedPremium = db.setting("premiumUsers");
  if (Array.isArray(savedPremium)) config.premiumUsers = savedPremium;
  const savedBanned = db.setting("bannedUsers");
  if (Array.isArray(savedBanned)) config.bannedUsers = savedBanned;
  if (config.backup?.enabled !== false) startAutoBackup(dbPath);

  const pCount = (Array.isArray(savedPremium) ? savedPremium.length : 0);
  const bCount = (Array.isArray(savedBanned) ? savedBanned.length : 0);
  logger.success("database", `siap · mode: ${config.mode}, premium: ${pCount}, banned: ${bCount}`);

  const pluginsPath = path.join(process.cwd(), "plugins");
  const pluginCount = loadPlugins(pluginsPath);
  logger.success("plugin", `${pluginCount} plugin dimuat`);

  if (config.dev?.enabled && config.dev?.watchPlugins) {
    startDevWatcher(pluginsPath);
  }
  if (config.dev?.enabled && config.dev?.watchSrc) {
    const srcPath = path.join(process.cwd(), "src");
    startSrcWatcher(srcPath);
  }

  initScheduler(config);

  const bootTime = Date.now() - startTime;
  logger.success("boot", `siap dalam ${bootTime}ms`);
  divider();
  logger.info("whatsapp", "menghubungkan...");
  console.log("");

  await startConnection({
    onRawMessage: async (msg, sock) => {
      try {
        const db = getDatabase();
        await handleAntiTagSW(msg, sock, db);
      } catch (error) {}
    },

    onMessage: async (msg, sock) => {
      try {
        const handlerPromise = messageHandler(msg, sock);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Handler timeout")), 60000),
        );
        await Promise.race([handlerPromise, timeoutPromise]);
      } catch (error) {
        if (error.message !== "Handler timeout") {
          logger.error("HANDLER", error.message);
          if (config.dev?.debugLog) {
            console.error(c.gray(error.stack));
          }
        }
      }
    },

    onGroupUpdate: async (update, sock) => {
      try {
        await groupHandler(update, sock);
      } catch (error) {
        logger.error("GROUP", error.message);
      }
    },

    onMessageUpdate: async (updates, sock) => {
      try {
        await messageUpdateHandler(updates, sock);
      } catch (error) {
        logger.error("MSG", error.message);
      }
    },

    onGroupSettingsUpdate: async (update, sock) => {
      try {
        await groupSettingsHandler(update, sock);
      } catch (error) {
        logger.error("GROUP", error.message);
      }
    },

    onConnectionUpdate: async (update, sock) => {
      if (update.connection === "open") {
        logConnection("connected", sock.user?.name || "Bot");
        loadScheduledMessages(sock);
        startGroupScheduleChecker(sock);
        startSewaChecker(sock);
        initScheduler(config, sock);
        initAutoJpmScheduler(sock);
        initSholatScheduler(sock);
        try {
          const { initSahurCron } = require('./plugins/religi/autosahur');
          initSahurCron(sock);
        } catch {}
        try { if (startOrderPoller) startOrderPoller(sock); } catch {}
        try {
          const { startOtpPoller: _startOtp } = require('./src/lib/ourin-otp-poller');
          _startOtp(sock);
        } catch {}

        try {
            const { getAllJadibotSessions, restartJadibotSession } = require('./src/lib/ourin-jadibot-manager');
            const sessions = getAllJadibotSessions();
            if (sessions.length > 0) {
                logger.info('JADIBOT', `Restoring ${sessions.length} session(s)`);
                for (const session of sessions) {
                    await restartJadibotSession(sock, session.id);
                }
            }
        } catch (e) {
            logger.error('JADIBOT', `Gagal memulihkan: ${e.message}`);
        }

        const devLabel = config.dev?.enabled ? ` ${c.yellow('• dev')}` : '';
        startMemoryMonitor()
        startTempCleaner()
        startDailyPruner()
        logger.success('siap', `semua sistem aktif${devLabel}`);
        divider();
      }
    },
  });
}

main().catch((error) => {
  logErrorBox("Fatal Error", error.message);
  console.error(c.gray(error.stack));
  process.exit(1);
});
