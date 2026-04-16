const { exec } = require("child_process");

module.exports = {
  config: {
    name: "update",
    alias: ["gitpull", "actualizar"],
    category: "owner",
    description: "Actualiza el bot desde GitHub",
    owner: true,
    isEnabled: true,
    cooldown: 5,
    energi: 0,
  },

  handler: async (m, { sock }) => {
    console.log("🔥 UPDATE EJECUTADO"); // DEBUG

    try {
      await m.reply("🔄 Actualizando bot desde Git...");

      exec("git pull && npm install", async (err, stdout, stderr) => {
        if (err) {
          console.error("❌ ERROR UPDATE:", err);
          return m.reply(`❌ Error:\n${err.message}`);
        }

        if (stderr) {
          console.log("⚠️ STDERR:", stderr);
        }

        await m.reply(
          `✅ *UPDATE COMPLETADO*\n\n${stdout.substring(0, 3000)}\n\n♻️ Reiniciando...`
        );

        // delay pequeño para enviar mensaje antes de apagar
        setTimeout(() => {
          process.exit(0);
        }, 2000);
      });
    } catch (e) {
      console.error("❌ ERROR GENERAL:", e);
      m.reply("❌ Error inesperado al actualizar");
    }
  },
};
```
