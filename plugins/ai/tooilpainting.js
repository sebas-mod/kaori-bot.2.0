const nanoBanana = require('../../src/scraper/nanobanana')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'tooilpainting',
    alias: ['oilpainting', 'tooil', 'oil'],
    category: 'ai',
    description: 'Convierte una foto en estilo pintura al óleo',
    usage: '.tooilpainting (responder/enviar imagen)',
    example: '.tooilpainting',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 3,
    isEnabled: true
}

const PROMPT = `Transform this image into a classical oil painting style. 
Apply thick brushstrokes, rich colors, and the texture of traditional oil paint on canvas. 
Keep the original composition but make it look like a masterpiece painting 
with visible brushwork, artistic color blending, and that timeless gallery-quality aesthetic.`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'))
    
    if (!isImage) {
        return m.reply(
            `🖼️ *ᴛᴏ ᴏɪʟ ᴘᴀɪɴᴛɪɴɢ*\n\n` +
            `> Envía/responde a una imagen para convertirla en estilo pintura al óleo\n\n` +
            `\`${m.prefix}tooilpainting\``
        )
    }
    
    m.react('🕕')
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            m.react('❌')
            return m.reply(`❌ Error al descargar la imagen`)
        }
        
        const result = await nanoBanana(buffer, PROMPT)
        
        m.react('✅')
        
        await sock.sendMedia(m.chat, result, null, m, {
            type: 'image',
        })
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
