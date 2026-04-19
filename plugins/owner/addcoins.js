const { getDatabase } = require('../../src/lib/ourin-database')

const pluginConfig = {
    name: 'addcoins',
    alias: ['sumarcoins', 'agregarcoins', 'addcoins'],
    category: 'owner',
    description: 'Agregar coins a un usuario',
    usage: '.coins <cantidad> @usuario',
    example: '.coins 100 @usuario',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function formatNumber(num) {
    if (num === -1) return '∞ Ilimitado'
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []

    let amount = 0
    let isUnlimited = false
    let targetJid = null

    if (m.text?.toLowerCase().includes('--unlimited') || m.text?.toLowerCase().includes('--unli')) {
        isUnlimited = true
    }

    const numArg = args.find(a => !isNaN(a) && !a.includes('@') && !a.startsWith('-'))
    if (numArg) amount = parseInt(numArg)

    if (m.quoted) {
        targetJid = m.quoted.sender
    } else if (m.mentionedJid?.length) {
        targetJid = m.mentionedJid[0]
    } else {
        const phoneArg = args.find(a => a !== numArg && a.length > 5 && /^\d+$/.test(a.replace(/[^0-9]/g, '')))
        if (phoneArg) {
            targetJid = phoneArg.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
        }
    }

    if (!targetJid && (amount > 0 || isUnlimited)) {
        targetJid = m.sender
    }

    if (!targetJid || (!isUnlimited && amount <= 0)) {
        return m.reply(
            `🪙 *ADD COINS*\n\n` +
            `> \`.coins <cantidad>\` - para uno mismo\n` +
            `> \`.coins <cantidad> @usuario\` - para otro usuario\n` +
            `> \`.coins --unlimited\` - ilimitado\n\n` +
            `\`Ejemplo: ${m.prefix}coins 100\``
        )
    }

    const user = db.getUser(targetJid) || db.setUser(targetJid)
    const config = require('../../config')
    const effectiveUnlimited = user.coins === -1 ||
        (config.isOwner(targetJid) && (config.coins?.owner ?? -1) === -1) ||
        (config.isPremium(targetJid) && (config.coins?.premium ?? -1) === -1)

    if (!isUnlimited && effectiveUnlimited) {
        return m.reply(
            `🪙 *INFORMACIÓN*\n` +
            `@${targetJid.split('@')[0]} ya tiene coins *∞ Ilimitados*\n` +
            `No es necesario agregar más`,
            { mentions: [targetJid] }
        )
    }

    if (isUnlimited) {
        db.setUser(targetJid, { coins: -1 })

        m.react('✅')
        await m.reply(
            `✅ *Los coins de @${targetJid.split('@')[0]} ahora son ilimitados*`,
            { mentions: [targetJid] }
        )
    } else {
        const newCoins = db.updateCoins
            ? db.updateCoins(targetJid, amount)
            : ((user.coins = (user.coins || 0) + amount), user.coins)

        m.react('✅')
        await m.reply(
            `✅ Coins de *@${targetJid.split('@')[0]}* agregados: *${formatNumber(amount)}*!\nAhora tiene *${formatNumber(newCoins)}* coins`,
            { mentions: [targetJid] }
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
