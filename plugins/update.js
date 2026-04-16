const { exec } = require("child_process");

module.exports = {
  config: {
    name: "update",
    alias: ["gitpull", "actualizar"],
    category: "owner",
    description: "Actualizar bot desde GitHub",
    owner: true,
    isEnabled: true,
    cooldown: 5,
    energi: 0,
  },

  handler: async (m, { sock }) => {
    await m.reply("🔄 Actualizando bot desde Git...");

    exec("git pull", async (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return m.reply(`❌ Error:\n${err.message}`);
      }

      if (stderr) {
        return m.reply(`⚠️ Warning:\n${stderr}`);
      }

      await m.reply(`✅ Update completo:\n\n${stdout}\n\n♻️ Reiniciando...`);

      process.exit(0);
    });
  },
};
```
