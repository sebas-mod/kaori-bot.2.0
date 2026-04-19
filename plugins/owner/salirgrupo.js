const config = require('../../config')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'leave',
    alias: ['leavegrup', 'leavegroup', 'salir', 'bye'],
    category: 'owner',
    description: 'El bot sale del grupo',
    usage: '.leave [link]',
    example: '.leave',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

function extractInviteCode(text) {
    const patterns = [
        /chat\.whatsapp\.com\/([a-zA-Z0-9]{20,})/i,
        /wa\.me\/([a-zA-Z0-9]{20,})/i
    ]
    
    for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) return match[1]
    }
    
    return null
}

async function handler(m, { sock }) {
    const input = m.args.join(' ').trim()
    
    let targetGroupJid = null
    let groupName = ''
    
    if (!input && m.isGroup) {
        targetGroupJid = m.chat
        try {
            const meta = m.groupMetadata
            groupName = meta.subject || 'Este grupo'
        } catch {
            groupName = 'Este grupo'
        }
    } else if (input) {
        const inviteCode = extractInviteCode(input)
        
        if (!inviteCode) {
            return m.reply(`❌ *ERROR*\n\n> Link de invitación no válido`)
        }
        
        try {
            const groupInfo = await sock.groupGetInviteInfo(inviteCode)
            targetGroupJid = groupInfo.id
            groupName = groupInfo.subject || 'Desconocido'
        } catch (error) {
            return m.reply(`❌ *ERROR*\n\n> No se pudo obtener info del grupo desde el link`)
        }
    } else {
        return m.reply(
            `🚪 *SALIR DEL GRUPO*\n\n` +
            `╭┈┈⬡「 📋 *USO* 」\n` +
            `┃ ◦ En grupo: \`.leave\`\n` +
            `┃ ◦ Con link: \`.leave <link>\`\n` +
            `╰┈┈⬡\n\n` +
            `\`Ejemplo: ${m.prefix}leave https://chat.whatsapp.com/xxx\``
        )
    }
    
    if (!targetGroupJid) {
        return m.reply(`❌ *ERROR*\n\n> Grupo no encontrado`)
    }
    
    m.react('🕕')
    
    try {
        global.sewaLeaving = true
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        if (m.isGroup && targetGroupJid === m.chat) {
            await sock.sendMessage(m.chat, {
                text: `👋 *ADIOS*\n\n` +
                    `> El bot saldrá de este grupo.\n` +
                    `> ¡Gracias por usar el bot!`,
                contextInfo: {
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranId,
                        newsletterName: saluranName,
                        serverMessageId: 127
                    }
                }
            })
        }
        
        await sock.groupLeave(targetGroupJid)
        
        global.sewaLeaving = false
        
        if (!m.isGroup || targetGroupJid !== m.chat) {
            m.react('✅')
            await m.reply(
                `✅ *SALIDA EXITOSA*\n\n` +
                `> El bot salió de: *${groupName}*`
            )
        }
        
    } catch (error) {
        global.sewaLeaving = false
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
