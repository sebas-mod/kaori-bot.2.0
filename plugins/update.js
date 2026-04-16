const { spawn } = require('child_process')

const pluginConfig = {
    name: 'update',
    alias: ['up'],
    category: 'owner',
    description: 'Actualizar bot desde GitHub',
    usage: '.update',
    isOwner: true
}

async function handler(m, { sock }) {
    try {
        await m.reply('🔄 Actualizando bot desde GitHub...')

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
                    if (code !== 0) reject()
                    else resolve()
                })
            })
        }

        // 🔥 comandos reales
        await run('git', ['fetch', '--all'])
        await run('git', ['reset', '--hard', 'origin/main'])
        await run('git', ['clean', '-fd'])

        if (!output.trim()) {
            output = '✔️ Sin cambios (ya actualizado)'
        }

        await m.reply(`📦 RESULTADO:\n\`\`\`\n${output}\n\`\`\`\n\n♻️ Reiniciando...`)

        setTimeout(() => process.exit(0), 2000)

    } catch (e) {
        console.log('ERROR UPDATE:', e)
        m.reply('❌ Error real al actualizar (ver consola)')
    }
}

module.exports = { pluginConfig, handler }
