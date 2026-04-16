import { spawn } from 'child_process'

let handler = async (m, { conn }) => {
  // 👑 Owner check (tu sistema)
  const owners = global.config.owner.map(([n]) =>
    n.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
  )

  if (!owners.includes(m.sender)) {
    return m.reply('🚫 *Solo el Owner puede usar este comando.*')
  }

  await m.reply('🔄 *Iniciando actualización real...*')

  const comandos = [
    ['git', ['fetch', '--all']],
    ['git', ['reset', '--hard', 'origin/main']],
    ['git', ['clean', '-fd']]
  ]

  let output = ''

  const runCommand = (cmd, args) => {
    return new Promise((resolve, reject) => {
      const process = spawn(cmd, args)

      process.stdout.on('data', (data) => {
        output += data.toString()
        console.log(data.toString())
      })

      process.stderr.on('data', (data) => {
        output += data.toString()
        console.log(data.toString())
      })

      process.on('close', (code) => {
        if (code !== 0) {
          reject(`Error en ${cmd} ${args.join(' ')}`)
        } else {
          resolve()
        }
      })
    })
  }

  try {
    for (let [cmd, args] of comandos) {
      await runCommand(cmd, args)
    }

    if (!output.trim()) {
      output = '✔️ Sin cambios, ya está actualizado.'
    }

    await m.reply(
      `📦 *Update aplicado correctamente:*\n\`\`\`\n${output}\n\`\`\`\n\n♻️ Reiniciando...`
    )

    setTimeout(() => process.exit(0), 2000)

  } catch (err) {
    console.error('❌ ERROR UPDATE:', err)

    m.reply(
      `❌ *Error real en actualización:*\n\`\`\`\n${err}\n\`\`\`\n\n📌 Revisá consola del servidor`
    )
  }
}

handler.help = ['update']
handler.tags = ['owner']
handler.command = /^up(date)?$/i

export default handler
