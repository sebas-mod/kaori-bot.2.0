import { exec } from 'child_process'
import util from 'util'

let handler = async (m, { conn }) => {
  // 👑 OWNER CHECK (tu sistema)
  const owners = global.config.owner.map(([n]) =>
    n.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
  )

  if (!owners.includes(m.sender)) {
    return m.reply('🚫 *Solo el Owner puede usar este comando.*')
  }

  await m.reply('🔍 *Analizando entorno del bot...*')

  // 🔎 PASO 1: DEBUG REAL DEL ENTORNO
  exec('pwd && ls -a && git remote -v && git branch', (err, debug) => {
    console.log('📂 DEBUG ENTORNO:\n', debug)
  })

  await m.reply('🔄 *Forzando actualización desde GitHub...*')

  try {
    // 🔥 MÉTODO ULTRA SEGURO
    const cmd = `
      git fetch --all &&
      git reset --hard origin/main &&
      git clean -fd &&
      git pull origin main
    `

    exec(cmd, (error, stdout, stderr) => {
      console.log('📦 STDOUT:\n', stdout)
      console.log('⚠️ STDERR:\n', stderr)

      if (error) {
        console.error('❌ ERROR:', error)

        return m.reply(
          '❌ *Error real detectado:*\n\n' +
          util.format(error) +
          '\n\n📌 Ejecutá en consola:\n```git pull```'
        )
      }

      let resultado = stdout?.trim() || '✔️ Sin cambios detectados.'

      m.reply(
        `📦 *UPDATE COMPLETADO*\n\n\`\`\`\n${resultado}\n\`\`\`\n\n♻️ Reiniciando...`
      )

      setTimeout(() => process.exit(0), 2000)
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
