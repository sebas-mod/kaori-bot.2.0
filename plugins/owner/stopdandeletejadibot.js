const { stopJadibot, getAllJadibotSessions } = require('../../src/lib/ourin-jadibot-manager')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'stopydeliminarjadibot',
    alias: ['eliminarjadibot', 'removerjadibot', 'stopjadibot'],
    category: 'owner',
    description: 'Detener y eliminar permanentemente la sesión de jadibot de un usuario',
    usage: '.stopydeliminarjadibot @usuario',
    example: '.stopydeliminarjadibot @628xxx',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    let target = null

    if (m.quoted) {
        target = m.quoted.sender
    } else if (m.mentionedJid?.[0]) {
        target = m.mentionedJid[0]
    } else if (m.text?.trim()) {
        const num = m.text.trim().replace(/[^0-9]/g, '')
        if (num) target = num + '@s.whatsapp.net'
    }

    if (!target) {
        const sessions = getAllJadibotSessions()

        if (sessions.length === 0) {
            return m.reply(`❌ No hay sesiones de jadibot guardadas`)
        }

        let txt = `🗑️ *sᴛᴏᴘ & ᴇʟɪᴍɪɴᴀʀ ᴊᴀᴅɪʙᴏᴛ*\n\n`
        txt += `Selecciona un objetivo mencionando o respondiendo:\n\n`

        sessions.forEach((s, i) => {
            const status = s.isActive ? '🟢' : '⚫'
            txt += `${status} *${i + 1}.* @${s.id}\n`
        })

        txt += `\n> Ejemplo: \`${m.prefix}stopydeliminarjadibot @628xxx\``

        return sock.sendMessage(m.chat, {
            text: txt,
            mentions: sessions.map(s => s.jid)
        }, { quoted: m })
    }

    const id = target.replace(/@.+/g, '')
    const sessions = getAllJadibotSessions()
    const session = sessions.find(s => s.id === id)

    if (!session) {
        return m.reply(`❌ No se encontró la sesión de jadibot para *@${id}*`, { mentions: [target] })
    }

    m.react('🕕')

    try {
        await stopJadibot(target, true)

        m.react('✅')

        await sock.sendMessage(m.chat, {
            text:
                `🗑️ *ᴊᴀᴅɪʙᴏᴛ ᴇʟɪᴍɪɴᴀᴅᴏ*\n\n` +
                `> 📱 Número: *@${id}*\n` +
                `> 🗑️ Estado: *Eliminado*\n\n` +
                `La sesión ha sido eliminada permanentemente.\n` +
                `El usuario debe usar \`.jadibot\` nuevamente para crear una nueva sesión.`,
            mentions: [target]
        }, { quoted: m })

    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
