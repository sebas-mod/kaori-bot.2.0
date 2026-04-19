const config = require('../../config')
const { getDatabase } = require('../../src/lib/ourin-database')

const pluginConfig = {
    name: 'ban',
    alias: ['addban', 'block'],
    category: 'owner',
    description: 'Bloquear a un usuario para que no use el bot',
    usage: '.ban <número/@tag>',
    example: '.ban 6281234567890',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    let targetNumber = ''
    
    if (m.quoted) {
        targetNumber = m.quoted.sender?.replace(/[^0-9]/g, '') || ''
    } else if (m.mentionedJid?.length) {
        targetNumber = m.mentionedJid[0]?.replace(/[^0-9]/g, '') || ''
    } else if (m.args[0]) {
        targetNumber = m.args[0].replace(/[^0-9]/g, '')
    }
    
    if (!targetNumber) {
        return m.reply(`🚫 *BAN DE USUARIO*\n\n> Ingresa un número o etiqueta al usuario\n\n\`Ejemplo: ${m.prefix}ban 6281234567890\``)
    }
    
    if (targetNumber.startsWith('0')) {
        targetNumber = '62' + targetNumber.slice(1)
    }
    
    if (config.isOwner(targetNumber)) {
        return m.reply(`❌ *ERROR*\n\n> No se puede banear al owner`)
    }
    
    if (config.isBanned(targetNumber)) {
        return m.reply(`❌ *ERROR*\n\n> El número \`${targetNumber}\` ya está baneado`)
    }
    
    config.bannedUsers.push(targetNumber)
    
    const db = getDatabase()
    db.setting('bannedUsers', config.bannedUsers)
    
    m.react('🚫')
    
    await m.reply(
        `🚫 *USUARIO BANEADO*\n\n` +
        `╭┈┈⬡「 📋 *DETALLES* 」\n` +
        `┃ 📱 Número: \`${targetNumber}\`\n` +
        `┃ 🚫 Estado: \`Baneado\`\n` +
        `┃ 📊 Total: \`${config.bannedUsers.length}\` usuarios\n` +
        `╰┈┈⬡`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
