const config = require('../../config')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: ['block', 'blokir'],
    alias: [],
    category: 'owner',
    description: 'Bloquear un número de WhatsApp',
    usage: '.block <número/reply/mention>',
    example: '.block 628xxx',
    isOwner: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    let targetJid = null

    if (m.mentionedJid?.length > 0) {
        targetJid = m.mentionedJid[0]
    } else if (m.quoted) {
        targetJid = m.quoted.sender || m.quoted.participant
    } else if (m.args[0]) {
        let num = m.args[0].replace(/[^0-9]/g, '')
        if (!num) return m.reply('❌ Número no válido.')
        targetJid = num + '@s.whatsapp.net'
    } else if (!m.isGroup) {
        targetJid = m.chat
    }

    if (!targetJid) {
        return m.reply(
            '⚠️ *CÓMO USAR*\n\n' +
            '> `.block 628xxx` — Bloquear por número\n' +
            '> `.block` (respondiendo mensaje) — Bloquear remitente\n' +
            '> `.block @mention` — Bloquear usuario mencionado\n' +
            '> `.block` (en chat privado) — Bloquear este usuario'
        )
    }

    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    if (targetJid === botJid) {
        return m.reply('❌ No puedes bloquear al propio bot.')
    }

    try {
        await sock.updateBlockStatus(targetJid, 'block')
        m.react('🚫')
        return m.reply(
            `🚫 *NÚMERO BLOQUEADO*\n\n` +
            `> Objetivo: @${targetJid.split('@')[0]}\n` +
            `> Usa \`.unblock\` para quitar el bloqueo`,
            { mentions: [targetJid] }
        )
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
