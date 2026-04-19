const config = require('../../config')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'script',
    alias: ['sc', 'sourcecode', 'source'],
    category: 'main',
    description: 'Obtén el código fuente del bot',
    usage: '.script',
    example: '.script',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const botName = config.bot?.name || 'Ourin-AI'
        const footer = config.settings?.footer || `© ${botName} 2026`
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || botName
        const saluranUrl = config.saluran?.url || 'https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t'
        const scriptUrl ="https://github.com/LuckyArch/OurinMD"
        const scriptPrice = 0
        
        const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin.jpg')
        let thumbBuffer = null
        if (fs.existsSync(thumbPath)) {
            thumbBuffer = fs.readFileSync(thumbPath)
        }

        await sock.sendMessage(m.chat, {
            productMessage: {
                title: `${botName}`,
                description: `Código fuente del bot de WhatsApp ${botName}\n\nCaracterísticas:\n• Soporte multi-dispositivo\n• 500+ comandos\n• Anti-spam y anti-link\n• Sistema de juegos y RPG\n• Gestión de panel\n• Auto-actualización`,
                thumbnail: thumbBuffer ? { url: thumbPath } : undefined,
                productId: 'SCRIPT001',
                retailerId: botName,
                url: scriptUrl,
                body: `¡Obtén el script de ${botName} ahora!`,
                footer: footer,
                priceAmount1000: scriptPrice * 1000,
                currencyCode: 'IDR',
                buttons: [
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📦 Descargar en GitHub',
                            url: scriptUrl
                        })
                    }
                ]
            },
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 99,
                isForwarded: true,
            }
        }, { quoted: m })

    } catch (error) {
        console.error('[Script] Error:', error.message)
        
        const botName = config.bot?.name || 'Ourin-AI'
        const scriptUrl = config.script?.url || 'https://github.com/ourin-team/ourin-md'
        const saluranUrl = config.saluran?.url || 'https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t'
        
        await m.reply(
            `📦 *${botName} sᴄʀɪᴘᴛ*\n\n` +
            `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
            `┃ 📝 Nombre: ${botName}\n` +
            `┃ 💰 Precio: ${config.script?.price ? `Rp ${config.script.price.toLocaleString('id-ID')}` : 'GRATIS'}\n` +
            `┃ 🔗 GitHub: ${scriptUrl}\n` +
            `┃ 📢 Canal: ${saluranUrl}\n` +
            `╰┈┈⬡\n\n` +
            `> Contacta al owner para más información`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
