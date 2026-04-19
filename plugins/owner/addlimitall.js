const config = require('../../config')
const { getDatabase } = require('../../src/lib/ourin-database')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'addlimitcoins',
    alias: ['addenergiaall', 'addlimitcoins'],
    category: 'owner',
    description: 'Agregar límite/energía a todos los miembros del grupo',
    usage: '.addenergiall <cantidad>',
    example: '.addenergiall 50',
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
        const amount = parseInt(m.args[0])
        
        if (isNaN(amount) || amount <= 0) {
            return m.reply(`⚠️ *USO*\n\n> Ingresa la cantidad de límite que deseas agregar.\n\n\`Ejemplo: ${m.prefix}addlimitall 50\``)
        }
        
        const groupMeta = m.groupMetadata
        const participants = groupMeta.participants || []
        
        if (participants.length === 0) {
            return m.reply(`❌ *ERROR*\n\n> No hay miembros en este grupo`)
        }
        
        m.react('🕕')
        const db = getDatabase()
        let successCount = 0
        
        for (const participant of participants) {
            const number = participant.jid?.replace(/[^0-9]/g, '') || ''
            if (!number) continue
            const jid = number + '@s.whatsapp.net'
            db.updateEnergi(jid, amount)
            successCount++
        }

        const gb = m?.groupMetadata
        
        await db.save()
        m.react('⚡')
        await m.reply(
           `✅ Se agregó correctamente el límite a todos los miembros ( Total *${successCount}* miembros ) en el grupo *${gb?.subject}*`,
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
