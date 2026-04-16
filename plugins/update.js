
const { exec } = require("child_process")

module.exports = {
  name: "update",
  alias: ["gitpull", "actualizar"],
  category: "owner",
  desc: "Actualiza el bot desde GitHub",
  owner: true, // importante para restringir

  async run({ sock, m }) {
    await sock.sendMessage(m.chat, { text: "🔄 Actualizando bot desde Git..." }, { quoted: m })

    exec("git pull", async (err, stdout, stderr) => {
      if (err) {
        console.error(err)
        return sock.sendMessage(m.chat, { 
          text: `❌ Error al actualizar:\n${err.message}` 
        }, { quoted: m })
      }

      if (stderr) {
        return sock.sendMessage(m.chat, { 
          text: `⚠️ Advertencia:\n${stderr}` 
        }, { quoted: m })
      }

      await sock.sendMessage(m.chat, { 
        text: `✅ Actualización completada:\n\n${stdout}\n\n♻️ Reiniciando...` 
      }, { quoted: m })

      // Reinicio del bot
      process.exit(0)
    })
  }
}
```
