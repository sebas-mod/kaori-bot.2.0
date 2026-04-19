const { getDatabase } = require('../../src/lib/ourin-database')

const pluginConfig = {
    name: 'botafk',
    alias: ['afkbot', 'afkmode'],
    category: 'owner',
    description: 'Modo AFK para el bot - el bot no responde comandos, solo envía mensaje AFK',
    usage: '.botafk <razón>',
    example: '.botafk Estoy descansando',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const currentAfk = db.setting('botAfk')
    
    if (currentAfk && currentAfk.active) {
        db.setting('botAfk', { active: false })
        m.react('✅')
        
        const afkDuration = Date.now() - currentAfk.since
        const duration = formatDuration(afkDuration)
        
        return m.reply(
            `✅ *ʙᴏᴛ ᴠᴜᴇʟᴠᴇ ᴏɴʟɪɴᴇ*\n\n` +
            `╭┈┈⬡「 📊 *ᴇsᴛᴀᴅíꜱᴛɪᴄᴀs ᴀꜰᴋ* 」\n` +
            `┃ ⏱️ ᴅᴜʀᴀᴄɪóɴ: \`${duration}\`\n` +
            `┃ 📝 ʀᴀᴢóɴ: \`${currentAfk.reason || '-'}\`\n` +
            `╰┈┈⬡\n\n` +
            `> ¡El bot está listo para recibir comandos!`
        )
    } else {
        const reason = m.args.join(' ') || 'AFK'
        
        db.setting('botAfk', {
            active: true,
            reason: reason,
            since: Date.now()
        })
        
        m.react('💤')
        return m.reply(
            `💤 *ʙᴏᴛ ᴀꜰᴋ ᴀᴄᴛɪᴠᴏ*\n\n` +
            `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
            `┃ 📝 ʀᴀᴢóɴ: \`${reason}\`\n` +
            `┃ ⏰ ᴅᴇsᴅᴇ: \`${require('moment-timezone')().tz('Asia/Jakarta').format('HH:mm:ss')}\`\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 🔒 *ᴀᴄᴄᴇsᴏ* 」\n` +
            `┃ ✅ Owner del bot\n` +
            `┃ ✅ El propio bot (fromMe)\n` +
            `┃ ❌ Todos los demás usuarios\n` +
            `╰┈┈⬡\n\n` +
            `> Otros usuarios recibirán mensaje AFK\n` +
            `> Escribe \`${m.prefix}botafk\` para volver online`
        )
    }
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} días ${hours % 24} horas`
    if (hours > 0) return `${hours} horas ${minutes % 60} minutos`
    if (minutes > 0) return `${minutes} minutos ${seconds % 60} segundos`
    return `${seconds} segundos`
}

module.exports = {
    config: pluginConfig,
    handler
}
