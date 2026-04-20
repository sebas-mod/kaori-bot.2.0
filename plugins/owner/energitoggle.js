const { getDatabase } = require('../../src/lib/ourin-database')
const config = require('../../config')

const pluginConfig = {
    name: ['disableenergi', 'enableenergi'],
    alias: ['offenergi', 'onenergi'],
    category: 'owner',
    description: 'Activar/desactivar el sistema de energía',
    usage: '.disableenergi o .enableenergi',
    example: '.disableenergi',
    isOwner: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const db = getDatabase()
    const cmd = m.command.toLowerCase()
    const isEnable = ['enableenergi', 'onenergi'].includes(cmd)

    db.setting('energi', isEnable)
    db.save()

    m.react(isEnable ? '⚡' : '🔌')
    return m.reply(
        isEnable
            ? '⚡ *SISTEMA DE ENERGÍA ACTIVADO*\n\n> Ahora cada comando requiere energía.'
            : '🔌 *SISTEMA DE ENERGÍA DESACTIVADO*\n\n> Los comandos ya no requieren energía.'
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
