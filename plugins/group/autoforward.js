const { getDatabase } = require('../../src/lib/ourin-database')

const pluginConfig = {
    name: 'autoforward',
    alias: ['autofw', 'autofwd'],
    category: 'group',
    description: 'Reenviar automáticamente los mensajes al grupo',
    usage: '.autoforward <on/off>',
    example: '.autoforward on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const option = m.text?.toLowerCase()?.trim()
    const groupId = m.chat
    const group = db.getGroup(groupId) || {}
    
    if (!option) {
        const status = group.autoforward ? '✅ ACTIVADO' : '❌ DESACTIVADO'
        return m.reply(
            `🔄 *ᴇɴᴠɪᴏ ᴀᴜᴛᴏᴍáᴛɪᴄᴏ*\n\n` +
            `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
            `┃ ◦ Estado: *${status}*\n` +
            `╰┈┈⬡\n\n` +
            `> Usa: \`${m.prefix}autoforward on/off\`\n\n` +
            `_Esta función reenviará todos los mensajes al grupo_`
        )
    }
    
    if (option === 'on') {
        db.setGroup(groupId, { ...group, autoforward: true })
        m.react('✅')
        return m.reply(
            `🔄 *ᴇɴᴠɪᴏ ᴀᴜᴛᴏᴍáᴛɪᴄᴏ*\n\n` +
            `╭┈┈⬡「 ✅ *ᴀᴄᴛɪᴠᴀᴅᴏ* 」\n` +
            `┃ ◦ Estado: *ON*\n` +
            `╰┈┈⬡\n\n` +
            `> _Todos los mensajes serán reenviados_`
        )
    }
    
    if (option === 'off') {
        db.setGroup(groupId, { ...group, autoforward: false })
        m.react('❌')
        return m.reply(
            `🔄 *ᴇɴᴠɪᴏ ᴀᴜᴛᴏᴍáᴛɪᴄᴏ*\n\n` +
            `╭┈┈⬡「 ❌ *ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ* 」\n` +
            `┃ ◦ Estado: *OFF*\n` +
            `╰┈┈⬡`
        )
    }
    
    return m.reply(`❌ Usa: on o off`)
}

module.exports = {
    config: pluginConfig,
    handler
}
