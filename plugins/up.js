import { exec } from 'child_process'
import util from 'util'

let handler = async (m, { conn }) => {
  try {
    // 👑 Detectar owner real
    const owners = global.config.owner.map(([n]) =>
      n.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    )

    const isRealOwner = owners.includes(m.sender)

    console.log('📱 Remitente:', m.sender)
    console.log('👑 Owners:', owners)
    console.log('✅ Es owner?:', isRealOwner)

    if (!isRealOwner) {
      return m.reply('🚫 *Solo el Owner puede usar este comando.*')
    }

    await m.reply('🔄 *Actualizando desde GitHub...*\nEspera unos segundos ⏳')

    // 🔥 UPDATE FORZADO (el que sí funciona siempre)
    const cmd = `
      git fetch origin &&
      git reset --hard origin/main &&
      git clean -fd
    `

    exec(cmd, (error, stdout, stderr) => {
      console.log('📦 STDOUT:\n', stdout)
      console.log('⚠️ STDERR:\n', stderr)

      if (error) {
        console.error('❌ ERROR:', error)
        return m.reply('❌ *Error al actualizar:*\n' + util.format(error))
      }

      let resultado = (stdout || '').trim()

      if (!resultado) {
        resultado = '✔️ Sin cambios, el bot ya está actualizado.'
      }

      m.reply(
        `📦 *Resultado del update:*\n\`\`\`\n${resultado}\n\`\`\`\n\n♻️ *Reiniciando bot...*`
      )

      // 🔁 Reinicio automático
      setTimeout(() => {
        process.exit(0)
      }, 2000)
    })

  } catch (e) {
    console.error('❌ Error inesperado:', e)
    m.reply('🚨 *Error inesperado:*\n' + util.format(e))
  }
}

handler.help = ['update']
handler.tags = ['owner']
handler.command = /^up(date)?$/i

export default handler
