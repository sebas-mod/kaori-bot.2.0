const axios = require('axios')
const { createCanvas, loadImage } = require('@napi-rs/canvas')
const config = require('../../config')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'colongpp',
    alias: ['stealpp', 'malingpp', 'ambilpp'],
    category: 'owner',
    description: 'Tomar y usar la foto de perfil del objetivo como PP del bot',
    usage: '.colongpp (responder mensaje del objetivo)',
    example: '.colongpp',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const FALLBACK_PP = 'https://telegra.ph/file/1ecdb5a0aee62ef17d7fc.jpg'
const PP_SIZE = 640

async function resizeForPP(buffer) {
    const img = await loadImage(buffer)
    const canvas = createCanvas(PP_SIZE, PP_SIZE)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, PP_SIZE, PP_SIZE)
    return canvas.toBuffer('image/jpeg')
}

async function handler(m, { sock }) {
    const targetJid = m.quoted?.sender || m.mentions?.[0]
    console.log(targetJid)

    if (!targetJid) {
        return m.reply(
            `🕵️ *ROBAR FOTO DE PERFIL*\n\n` +
            `> Responde al mensaje de alguien para tomar su foto de perfil\n\n` +
            `*CÓMO USAR:*\n` +
            `> Responde al mensaje del objetivo → \`${m.prefix}colongpp\``
        )
    }

    await m.react('🕵️')

    try {
        let ppBuffer
        let source = 'perfil'

        try {
            const ppUrl = await sock.profilePictureUrl(targetJid, 'image')
            const res = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 15000 })
            ppBuffer = Buffer.from(res.data)
        } catch {
            const res = await axios.get(FALLBACK_PP, { responseType: 'arraybuffer', timeout: 15000 })
            ppBuffer = Buffer.from(res.data)
            source = 'default (el usuario no tiene foto)'
        }

        const processed = await resizeForPP(ppBuffer)
        const botJid = sock.user?.id
        await sock.updateProfilePicture(botJid, processed)

        const targetNumber = targetJid.split('@')[0]
        await m.react('✅')
        return m.reply(
            `✅ *¡FOTO DE PERFIL OBTENIDA!*\n\n` +
            `> 🎯 Objetivo: @${targetNumber}\n` +
            `> 📸 Fuente: ${source}`,
            { mentions: [targetJid] }
        )
    } catch (err) {
        console.error('[ColongPP] Error:', err.message)
        await m.react('☢')
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
