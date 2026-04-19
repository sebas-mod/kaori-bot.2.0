const { getDatabase } = require('../../src/lib/ourin-database')

const pluginConfig = {
    name: 'cmdvn',
    alias: ['voicecommand', 'vncmd'],
    category: 'owner',
    description: 'Activar comandos mediante notas de voz',
    usage: '.cmdvn <on/off>',
    example: '.cmdvn on',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const db = getDatabase()
    const args = m.args || []
    const subCmd = args[0]?.toLowerCase()

    const current = db.setting('cmdVn') || false

    if (!subCmd || subCmd === 'status') {
        const status = current ? '✅ ON' : '❌ OFF'
        return m.reply(
            `🎤 *ᴄᴏᴍᴀɴᴅᴏ ᴘᴏʀ ɴᴏᴛᴀ ᴅᴇ ᴠᴏᴢ*\n\n` +
            `> Estado: *${status}*\n\n` +
            `> \`${m.prefix}cmdvn on\` — Comandos vía VN\n` +
            `> \`${m.prefix}cmdvn off\` — Comandos por texto (default)\n\n` +
            `> Cuando está ON, envía un VN con el nombre del comando\n` +
            `> Ejemplo: VN "menu" → ejecuta .menu`
        )
    }

    if (subCmd === 'on') {
        db.setting('cmdVn', true)
        return m.reply(
            `✅ *ᴄᴍᴅ ᴠɴ ᴀᴄᴛɪᴠᴀᴅᴏ*\n\n` +
            `> Envía una nota de voz con el nombre del comando\n` +
            `> El bot transcribirá y ejecutará automáticamente\n` +
            `> Ejemplo: VN "menu" → ejecuta .menu`
        )
    }

    if (subCmd === 'off') {
        db.setting('cmdVn', false)
        return m.reply(`❌ CMD VN *desactivado*. Usa comandos por texto normalmente.`)
    }

    return m.reply(`❌ Usa \`${m.prefix}cmdvn on\` o \`${m.prefix}cmdvn off\``)
}

module.exports = {
    config: pluginConfig,
    handler
}
