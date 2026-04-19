const {
  enableAutoBackup,
  disableAutoBackup,
  getBackupStatus,
  triggerManualBackup,
} = require("../../src/lib/ourin-auto-backup");
const timeHelper = require("../../src/lib/ourin-time");
const config = require("../../config");
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
  name: "backup",
  alias: ["autobackup", "bk"],
  category: "owner",
  description: "Sistema de backup automático",
  usage: ".backup <on/off/status/now> [intervalo]",
  example: ".backup on 5h",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const args = m.text?.trim().split(/\s+/) || [];
  const action = args[0]?.toLowerCase();

  if (!action) {
    const status = getBackupStatus();
    const ownerNum = config.owner?.number?.[0] || "No definido";

    let txt = `🗂️ *AUTO BACKUP*\n\n`;
    txt += `Estado: ${status.enabled ? "✅ ON" : "❌ OFF"}\n`;
    txt += `Intervalo: ${status.interval}\n`;
    txt += `Último: ${status.lastBackup ? timeHelper.fromTimestamp(status.lastBackup, "DD/MM/YYYY HH:mm:ss") : "-"}\n`;
    txt += `Total: ${status.backupCount}\n`;
    txt += `Enviado a: ${ownerNum}\n\n`;

    txt += `Uso:\n`;
    txt += `> ${m.prefix}backup on <tiempo>\n`;
    txt += `> ${m.prefix}backup off\n`;
    txt += `> ${m.prefix}backup status\n`;
    txt += `> ${m.prefix}backup now\n\n`;

    txt += `Ejemplo:\n`;
    txt += `> ${m.prefix}backup on 6h`;

    return m.reply(txt);
  }

  switch (action) {
    case "on": {
      const interval = args[1];

      if (!interval) {
        return m.reply(
          `⚠️ Falta intervalo\n\n` +
          `Ejemplo:\n` +
          `> ${m.prefix}backup on 30m\n` +
          `> ${m.prefix}backup on 6h\n` +
          `> ${m.prefix}backup on 1d`
        );
      }

      const result = enableAutoBackup(interval, sock);

      if (!result.success) {
        return m.reply(`❌ Error: ${result.error}`);
      }

      const ownerNum = config.owner?.number?.[0] || "Owner";

      m.react("✅");
      return m.reply(
        `✅ Backup automático activado\n\n` +
        `Intervalo: ${result.interval}\n` +
        `Destino: ${ownerNum}\n\n` +
        `Se enviará cada ${result.interval}`
      );
    }

    case "off": {
      disableAutoBackup();

      m.react("✅");
      return m.reply(`❌ Backup automático desactivado`);
    }

    case "status": {
      const status = getBackupStatus();
      const ownerNum = config.owner?.number?.[0] || "No definido";

      let txt = `📊 *ESTADO BACKUP*\n\n`;
      txt += `Activo: ${status.enabled ? "Sí" : "No"}\n`;
      txt += `Intervalo: ${status.interval}\n`;
      txt += `En ejecución: ${status.isRunning ? "Sí" : "No"}\n`;
      txt += `Último: ${status.lastBackup ? timeHelper.fromTimestamp(status.lastBackup, "DD/MM/YYYY HH:mm:ss") : "-"}\n`;
      txt += `Total: ${status.backupCount}\n`;
      txt += `Destino: ${ownerNum}`;

      return m.reply(txt);
    }

    case "now": {
      m.react("🕕");
      await m.reply(`⏳ Creando backup...`);

      try {
        await triggerManualBackup(sock);
        m.react("✅");
        return m.reply(`✅ Backup enviado al owner`);
      } catch (error) {
        m.react('☢');
        m.reply(te(m.prefix, m.command, m.pushName));
      }
    }

    default:
      return m.reply(
        `⚠️ Opción inválida\n\n` +
        `Usa: on / off / status / now\n` +
        `Ejemplo: ${m.prefix}backup on 6h`
      );
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};
