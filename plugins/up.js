const { exec } = require('child_process')

const pluginConfig = {
    name: 'update',
    alias: ['upd', 'gitpull'],
    category: 'owner',
    description: 'Actualizar bot desde GitHub',
    usage: '.update',
    example: '.update',
    isOwner: true,
    cooldown: 10,
    isEnabled: true
}

async function handler(m, { sock }) {
    await m.reply('🔄 Buscando actualizaciones en GitHub...')

    exec('git pull', (err, stdout, stderr) => {
        if (err) {
            console.log('❌ ERROR UPDATE:', err)
            return m.reply('❌ Error al actualizar:\n' + err.message)
        }

        if (stdout.includes('Already up to date')) {
            console.log('✔️ Sin cambios')
            return m.reply('✔️ El bot ya está actualizado')
        }

        console.log('📦 CAMBIOS:\n', stdout)

        let cambios = stdout
            .split('\n')
            .filter(v => v.includes('|'))
            .join('\n')

        m.reply(`📦 *Archivos actualizados:*\n\n${cambios || stdout}\n\n♻️ Reiniciando...`)

        setTimeout(() => {
            process.exit(0)
        }, 2000)
    })
}

module.exports = { pluginConfig, handler }
