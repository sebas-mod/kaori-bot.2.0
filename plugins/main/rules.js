const config = require('../../config')
const { getDatabase } = require('../../src/lib/ourin-database')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'rules',
    alias: ['aturanbot', 'botrules'],
    category: 'main',
    description: 'Muestra las reglas del bot',
    usage: '.rules',
    example: '.rules',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const DEFAULT_BOT_RULES = `📜 *ʀᴇɢʟᴀs ᴅᴇʟ ʙᴏᴛ*

┃ 1️⃣ No hagas spam de comandos
┃ 2️⃣ Usa las funciones con responsabilidad
┃ 3️⃣ Prohibido abusar del bot
┃ 4️⃣ Respeta a otros usuarios
┃ 5️⃣ Reporta errores al owner
┃ 6️⃣ No pidas funciones absurdas
┃ 7️⃣ El bot no es 24/7, puede haber mantenimiento

_Las infracciones pueden resultar en un baneo!_`

async function handler(m, { sock, config: botConfig }) {
    const db = getDatabase()
    const customRules = db.setting('botRules')
    const rulesText = customRules || DEFAULT_BOT_RULES

    const imagePath = path.join(process.cwd(), 'assets', 'images', 'ourin-rules.jpg')
    let imageBuffer = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null

    const saluranId = botConfig.saluran?.id || '120363208449943317@newsletter'
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI'

    if (imageBuffer) {
        await sock.sendMessage(m.chat, {
            image: imageBuffer,
            caption: rulesText,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }, { quoted: m })
    } else {
        await m.reply(rulesText)
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    DEFAULT_BOT_RULES
}
