const { getDatabase } = require('../../src/lib/ourin-database')
const { calculateLevel, getRole } = require('../user/level')

const pluginConfig = {
    name: 'dellevel',
    alias: ['reducirnivel', 'removernivel', 'dellvl'],
    category: 'owner',
    description: 'Reducir el nivel del usuario (a través del exp)',
    usage: '.dellevel <cantidad> @usuario',
    example: '.dellevel 5 @usuario',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
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
    let levels = parseInt(numArg) || 0
    
    let targetJid = extractTarget(m)
    
    if (!targetJid && levels > 0) {
        targetJid = m.sender
    }
    
    if (!targetJid || levels <= 0) {
        return m.reply(
            `📊 *REDUCIR NIVEL*\n\n` +
            `╭┈┈⬡「 📋 *USO* 」\n` +
            `┃ > \`.dellevel <cantidad>\` - a ti mismo\n` +
            `┃ > \`.dellevel <cantidad> @usuario\` - a otro usuario\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> Ejemplo: \`${m.prefix}dellevel 5\``
        )
    }
    
    const user = db.getUser(targetJid) || db.setUser(targetJid)
    if (!user.rpg) user.rpg = {}
    
    const oldLevel = calculateLevel(user.rpg.exp || 0)
    const expToRemove = levels * 20000
    user.rpg.exp = Math.max(0, (user.rpg.exp || 0) - expToRemove)
    const newLevel = calculateLevel(user.rpg.exp)
    
    db.save()
    m.react('✅')
    
    await m.reply(
        `✅ *NIVEL REDUCIDO*\n\n` +
        `╭┈┈⬡「 📋 *DETALLE* 」\n` +
        `┃ 👤 Usuario: @${targetJid.split('@')[0]}\n` +
        `┃ ➖ Reducción: *-${levels} Nivel*\n` +
        `┃ 🚄 Exp eliminado: *-${expToRemove.toLocaleString('es-ES')}*\n` +
        `┃ 📊 Nivel: *${oldLevel} → ${newLevel}*\n` +
        `┃ ${getRole(newLevel)}\n` +
        `╰┈┈┈┈┈┈┈┈⬡`,
        { mentions: [targetJid] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
