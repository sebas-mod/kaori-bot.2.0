const { exec } = require('child_process')

const pluginConfig = {
    name: 'update',
    alias: ['upd'],
    category: 'owner',
    description: 'Actualizar bot desde GitHub',
    isOwner: true
}

async function handler(m) {
    m.reply('🔄 Ejecutando actualización...')

    exec('git fetch origin && git reset --hard origin/main', (err, stdout, stderr) => {
        console.log('STDOUT:\n', stdout)
        console.log('STDERR:\n', stderr)

        if (err) {
            console.log('ERROR:\n', err)
            return m.reply('❌ Error:\n' + err.message)
        }

        m.reply(`📦 Resultado:\n${stdout || 'Sin cambios'}\n\n♻️ Reiniciando...`)

        setTimeout(() => process.exit(0), 2000)
    })
}

module.exports = { pluginConfig, handler }
