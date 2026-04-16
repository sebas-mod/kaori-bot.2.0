const nanoBanana = require('../../src/scraper/nanobanana')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'tomanga',
    alias: ['manga', 'mangafy', 'mangastyle'],
    category: 'ai',
    description: 'Convertir foto a estilo manga japonés',
    usage: '.tomanga (responde/envía una imagen)',
    example: '.tomanga',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 3,
    isEnabled: true
}

const PROMPT = `Transform this image into Japanese manga style illustration. 
Apply black and white manga aesthetics with dramatic shading, speed lines, 
expressive eyes, and detailed screentones. Keep the original composition 
but convert it to look like a page from a Japanese manga with bold ink lines, 
dynamic poses, and that distinctive manga art style.`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'))
    
    if (!isImage) {
        return m.reply(
            `📖 *ᴛᴏ ᴍᴀɴɢᴀ*\n\n` +
            `> Envía/responde a una imagen para convertirla a estilo manga\n\n` +
            `\`${m.prefix}tomanga\``
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
