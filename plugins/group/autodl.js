const { getDatabase } = require('../../src/lib/ourin-database')

const pluginConfig = {
    name: ['autodl', 'autodownload'],
    alias: [],
    category: 'group',
    description: 'Activar/desactivar descarga automática de links de redes sociales',
    usage: '.autodl on/off',
    example: '.autodl on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    isBotAdmin: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args[0]?.toLowerCase()
    
    const groupData = db.getGroup(m.chat)
    const current = groupData?.autodl || false
    
    if (!args || args === 'status') {
        return m.reply(
            `🔗 *ᴀᴜᴛᴏ ᴅᴇsᴄᴀʀɢᴀ*\n\n` +
            `> Estado: ${current ? '✅ Activo' : '❌ Inactivo'}\n\n` +
            `*Plataformas soportadas:*\n` +
            `> TikTok, Instagram, Facebook\n` +
            `> YouTube, Twitter/X\n` +
            `> Telegram, Discord\n\n` +
            `*Uso:*\n` +
            `> \`${m.prefix}autodl on\` - Activar\n` +
            `> \`${m.prefix}autodl off\` - Desactivar`
        )
    }
    
    if (args === 'on') {
        db.setGroup(m.chat, { ...groupData, autodl: true })
        m.react('✅')
        return m.reply(
            `✅ *ᴀᴜᴛᴏ ᴅᴇsᴄᴀʀɢᴀ ᴀᴄᴛɪᴠᴀᴅᴀ*\n\n` +
            `> Envía enlaces de redes sociales y el bot los descargará automáticamente\n` +
            `> Soporte: TikTok, IG, FB, YouTube, Twitter/X`
        )
    }
    
    if (args === 'off') {
        db.setGroup(m.chat, { ...groupData, autodl: false })
        m.react('❌')
        return m.reply(`❌ *ᴀᴜᴛᴏ ᴅᴇsᴄᴀʀɢᴀ ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴀ*`)
    }
    
    return m.reply(
        `❌ *ᴀʀɢᴜᴍᴇɴᴛᴏ ɪɴᴠáʟɪᴅᴏ*\n\n` +
        `> Usa: \`on\` o \`off\``
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
