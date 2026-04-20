const config = require('../../config')
const { getDatabase } = require('../../src/lib/ourin-database')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'delpremall',
    alias: ['delpremiumall', 'removepremall'],
    category: 'owner',
    description: 'Eliminar todos los miembros del grupo del premium',
    usage: '.delprem all',
    example: '.delprem all',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const groupMeta = m.groupMetadata
        const participants = groupMeta.participants || []
        
        if (participants.length === 0) {
            return m.reply(`❌ *ERROR*\n\n> No hay miembros en este grupo`)
        }
        
        m.react('🕕')
        
        const db = getDatabase()
        if (!db.data.premium) db.data.premium = []
        
        let removedCount = 0
        let notPremCount = 0
        
        for (const participant of participants) {
            const number = participant.jid?.replace(/[^0-9]/g, '') || ''
            if (!number) continue
            
            const index = db.data?.premium.indexOf(number)
            
            if (index === -1) {
                notPremCount++
                continue
            }
            
            db.data.premium?.splice(index, 1)
            const jid = number + '@s.whatsapp.net'
            const user = db.getUser(jid)
            if (user) {
                user.isPremium = false
                db.setUser(jid, user)
            }
            
            removedCount++
        }
        
        db.save()
        
        m.react('🗑️')
        
        await m.reply(
            `🗑️ *ELIMINAR PREMIUM (TODOS)*\n\n` +
            `╭┈┈⬡「 📋 *RESULTADO* 」\n` +
            `┃ 👥 Total miembros: \`${participants.length}\`\n` +
            `┃ ✅ Eliminados: \`${removedCount}\`\n` +
            `┃ ⏭️ No eran premium: \`${notPremCount}\`\n` +
            `┃ 💎 Premium restantes: \`${db.data.premium.length}\`\n` +
            `╰┈┈⬡\n\n` +
            `> Grupo: ${groupMeta.subject}`
        )
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
