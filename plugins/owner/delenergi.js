const { getDatabase } = require('../../src/lib/ourin-database')

const pluginConfig = {
    name: 'delenergi',
    alias: ['kurangenergi', 'removeenergi', 'hapusenergi', 'delenergy'],
    category: 'owner',
    description: 'Reducir la energía de un usuario',
    usage: '.delenergi <cantidad> @usuario',
    example: '.delenergi 50 @usuario',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function formatNumber(num) {
    if (num === -1) return '∞ Ilimitado'
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function extractTarget(m) {
    if (m.quoted) return m.quoted.sender
    if (m.mentionedJid?.length) return m.mentionedJid[0]
    return null
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args
    
    const numArg = args.find(a => !isNaN(a) && !a.startsWith('@'))
    const amount = parseInt(numArg) || 0
    
    let targetJid = extractTarget(m)
    
    if (!targetJid && amount > 0) {
        targetJid = m.sender
    }
    
    if (!targetJid || amount <= 0) {
        return m.reply(
            `⚡ *ELIMINAR ENERGÍA*\n\n` +
            `> \`.delenergi <cantidad>\` - de ti mismo\n` +
            `> \`.delenergi <cantidad> @usuario\` - de otro usuario\n\n` +
            `\`Ejemplo: ${m.prefix}delenergi 50\``
        )
    }
    
    if (amount <= 0) {
        return m.reply(`❌ *ERROR*\n\n> La cantidad debe ser mayor a 0`)
    }
    
    const user = db.getUser(targetJid)
    
    if (!user) {
        return m.reply(`❌ *ERROR*\n\n> Usuario no encontrado en la base de datos`)
    }
    
    if (user.energi === -1) {
        db.setUser(targetJid, { energi: 25 })
    }
    
    const newEnergi = db.updateEnergi(targetJid, -amount)
    
    m.react('✅')
    
    await m.reply(
        `✅ *ENERGÍA REDUCIDA*\n\n` +
        `╭┈┈⬡「 📋 *DETALLES* 」\n` +
        `┃ 👤 Usuario: @${targetJid.split('@')[0]}\n` +
        `┃ ➖ Reducido: *-${formatNumber(amount)}*\n` +
        `┃ ⚡ Restante: *${formatNumber(newEnergi)}*\n` +
        `╰┈┈⬡`,
        { mentions: [targetJid] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
