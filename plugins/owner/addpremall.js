const config = require('../../config')
const { getDatabase } = require('../../src/lib/ourin-database')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'addpremall',
    alias: ['addpremiumall', 'setpremall'],
    category: 'owner',
    description: 'Agregar a todos los miembros del grupo al premium',
    usage: '.addpremall',
    example: '.addpremall',
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
        
        let addedCount = 0
        let alreadyPremCount = 0
        
        for (const participant of participants) {
            const number = participant.jid?.replace(/[^0-9]/g, '') || ''
            
            if (!number) continue
            
            if (db.data.premium.includes(number)) {
                alreadyPremCount++
                continue
            }  

            db.data.premium.push(number)
            
            const jid = number + '@s.whatsapp.net'
            const premLimit = config.limits?.premium || 100
            const user = db.getUser(jid) || db.setUser(jid)
            
            user.energi = premLimit
            user.isPremium = true
            
            db.setUser(jid, user)
            db.updateExp(jid, 200000)
            db.updateKoin(jid, 20000)

            addedCount++
        }
        
        db.save()
        
        m.react('💎')
        await m.reply(
            `💎 *AGREGAR PREMIUM A TODOS*\n\n` +
            `╭┈┈⬡「 📋 *RESULTADO* 」\n` +
            `┃ 👥 TOTAL MIEMBROS: \`${participants.length}\`\n` +
            `┃ ✅ AGREGADOS: \`${addedCount}\`\n` +
            `┃ ⏭️ YA ERAN PREMIUM: \`${alreadyPremCount}\`\n` +
            `┃ 💎 TOTAL PREMIUM: \`${db.data.premium.length}\`\n` +
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
