const { getDatabase } = require('../../src/lib/ourin-database')

const pluginConfig = {
    name: 'delexp',
    alias: ['kurangexp', 'removeexp', 'delxp'],
    category: 'owner',
    description: 'Reducir la experiencia (exp) de un usuario',
    usage: '.delexp <cantidad> @usuario',
    example: '.delexp 5000 @usuario',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B'
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
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
            `⭐ *ELIMINAR EXP*\n\n` +
            `> \`.delexp <cantidad>\` - de ti mismo\n` +
            `> \`.delexp <cantidad> @usuario\` - de otro usuario\n\n` +
            `\`Ejemplo: ${m.prefix}delexp 5000\``
        )
    }
    
    if (amount <= 0) {
        return m.reply(`❌ *ERROR*\n\n> La cantidad debe ser mayor a 0`)
    }
    
    const user = db.getUser(targetJid)
    
    if (!user) {
        return m.reply(`❌ *ERROR*\n\n> Usuario no encontrado en la base de datos`)
    }
    
    const newExp = db.updateExp(targetJid, -amount)
    
    m.react('✅')
    
    await m.reply(
        `✅ *EXP REDUCIDA*\n\n` +
        `╭┈┈⬡「 📋 *DETALLES* 」\n` +
        `┃ 👤 Usuario: @${targetJid.split('@')[0]}\n` +
        `┃ ➖ Reducido: *-${formatNumber(amount)}*\n` +
        `┃ ⭐ Restante: *${formatNumber(newExp)}*\n` +
        `╰┈┈⬡`,
        { mentions: [targetJid] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
