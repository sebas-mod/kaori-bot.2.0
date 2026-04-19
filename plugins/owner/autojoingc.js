const config = require('../../config')
const { getDatabase } = require('../../src/lib/ourin-database')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'autojoin',
    alias: ['autogc', 'autojoingrupo'],
    category: 'owner',
    description: 'Auto unirse a grupos desde links detectados',
    usage: '.autojoin on/off',
    example: '.autojoin on',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

const GROUP_LINK_REGEX = /chat\.whatsapp\.com\/([a-zA-Z0-9]{18,24})/gi

async function handler(m) {
    const db = getDatabase()
    const arg = (m.args?.[0] || '').toLowerCase()

    if (!arg || !['on', 'off'].includes(arg)) {
        const current = db.setting('autoJoinGc') || false
        return m.reply(
            `🔗 *AUTO JOIN GRUPOS*\n\n` +
            `Estado: *${current ? 'ON ✅' : 'OFF ❌'}*\n\n` +
            `\`${m.prefix}autojoin on\` → activar\n` +
            `\`${m.prefix}autojoin off\` → desactivar`
        )
    }

    const enabled = arg === 'on'
    db.setting('autoJoinGc', enabled)
    await db.save()

    m.reply(`${enabled ? '✅ Activado' : '❌ Desactivado'} auto join`)
}

async function autoJoinDetector(m, sock) {
    const db = getDatabase()

    if (!db?.ready) return false
    if (!db.setting('autoJoinGc')) return false
    if (!m.body) return false

    const matches = [...m.body.matchAll(GROUP_LINK_REGEX)]
    if (!matches.length) return false

    let joined = 0

    for (const match of matches) {
        const code = match[1]

        try {
            const result = await sock.groupAcceptInvite(code)

            if (result) {
                joined++
                await m.reply(`✅ Unido al grupo: ${match[0]}`)
            }
        } catch (e) {
            const msg = e.message || String(e)

            if (msg.includes('already') || msg.includes('participant')) {
                await m.reply(`⚠️ Ya estás en ese grupo`)
            } else if (msg.includes('expired') || msg.includes('revoked')) {
                await m.reply(`❌ Link expirado`)
            } else {
                m.reply(te(m.prefix, m.command, m.pushName))
            }
        }
    }

    return joined > 0
}

module.exports = {
    config: pluginConfig,
    handler,
    autoJoinDetector
}
