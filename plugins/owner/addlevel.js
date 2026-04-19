const { getDatabase } = require('../../src/lib/ourin-database')
const { calculateLevel, getRole } = require('./../../src/lib/ourin-level')

const pluginConfig = {
    name: 'addlevel',
    alias: ['sumarnivel', 'darnivel', 'addlvl'],
    category: 'owner',
    description: 'Agregar nivel a un usuario (mediante exp)',
    usage: '.addlevel <cantidad> @usuario',
    example: '.addlevel 5 @usuario',
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
            `📊 *ADD LEVEL*\n\n` +
            `╭┈┈⬡「 📋 *USO* 」\n` +
            `┃ > \`.addlevel <cantidad>\` - para uno mismo\n` +
            `┃ > \`.addlevel <cantidad> @usuario\` - para otra persona\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> Ejemplo: \`${m.prefix}addlevel 5\``
        )
    }
    
    if (levels <= 0) {
        return m.reply(`❌ *ERROR*\n\n> La cantidad de niveles debe ser mayor a 0`)
    }
    
    const user = db.getUser(targetJid) || db.setUser(targetJid)
    
    const oldLevel = calculateLevel(user.exp || 0)
    const expToAdd = levels * 20000
    
    const levelHelper = require('../../src/lib/ourin-level')
    const addResult = await levelHelper.addExpWithLevelCheck(sock, m, db, user, expToAdd)
    
    m.react('✅')
    
    await m.reply(
        `✅ Se agregaron niveles a *@${targetJid.split('@')[0]}* por *${levels} niveles*\n\nAhora tiene *${addResult.newLevel || calculateLevel(user.exp)}* de nivel y el rol *${getRole(addResult.newLevel || calculateLevel(user.exp))}*`,
        { mentions: [targetJid] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
