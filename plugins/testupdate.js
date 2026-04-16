import { spawn } from 'child_process'

let handler = async (m) => {
  const owners = global.config.owner.map(([n]) =>
    n.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
  )

  if (!owners.includes(m.sender)) {
    return m.reply('🚫 Solo el Owner')
  }

  await m.reply('🔍 Verificando entorno del bot...')

  let output = ''

  const run = (cmd, args) => {
    return new Promise((resolve, reject) => {
      const p = spawn(cmd, args)

      p.stdout.on('data', d => {
        output += d.toString()
        console.log(d.toString())
      })

      p.stderr.on('data', d => {
        output += d.toString()
        console.log(d.toString())
      })

      p.on('close', code => {
        if (code !== 0) reject(code)
        else resolve()
      })
    })
  }

  try {
    // 🔥 DEBUG CLAVE
    await run('pwd', [])
    await run('ls', ['-a'])
    await run('git', ['remote', '-v'])
    await run('git', ['branch'])

    await m.reply('🔄 Ejecutando update real...')

    // 🔥 UPDATE REAL
    await run('git', ['fetch', '--all'])
    await run('git', ['reset', '--hard', 'origin/main'])

    await m.reply(`📦 Resultado:\n\`\`\`\n${output}\n\`\`\``)

    setTimeout(() => process.exit(0), 2000)

  } catch (e) {
    m.reply('❌ Error real (ver consola)')
    console.log(e)
  }
}

handler.command = /^testupdate$/i
export default handler
