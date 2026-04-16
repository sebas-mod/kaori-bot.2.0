const nanoBanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'nanobanana',
    alias: ['nano', 'imgedit'],
    category: 'ai',
    description: 'Editar imágenes con IA usando un prompt',
    usage: '.nanobanana <prompt>',
    example: '.nanobanana hazlo estilo anime',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const prompt = m.args.join(' ')
    
    if (!prompt) {
        return m.reply(
            `🍌 *ɴᴀɴᴏ ʙᴀɴᴀɴᴀ*\n\n` +
            `> Edita imágenes con IA\n\n` +
            `\`Ejemplo: ${m.prefix}nanobanana hazlo estilo anime\`\n\n` +
            `> Responde o envía una imagen con el comando`
        )
    }
    
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    
    if (!isImage) {
        return m.reply(
            `🍌 *ɴᴀɴᴏ ʙᴀɴᴀɴᴀ*\n\n` +
            `> Responde o envía una imagen con el comando`
        )
    }
    
    m.react('🕕')
    
    try {
        let mediaBuffer
        
        if (m.isImage && m.download) {
            mediaBuffer = await m.download()
        } else if (m.quoted && m.quoted.isImage && m.quoted.download) {
            mediaBuffer = await m.quoted.download()
        }
        
        if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) {
            m.react('❌')
            return m.reply(
                `❌ *ERROR*\n\n` +
                `> No se pudo descargar la imagen`
            )
        }
        
        const resultBuffer = await nanoBanana(mediaBuffer, prompt)
        
        if (!resultBuffer || !Buffer.isBuffer(resultBuffer)) {
            m.react('❌')
            return m.reply(
                `❌ *ERROR*\n\n` +
                `> No se pudo editar la imagen`
            )
        }
        
        m.react('✅')
        
        await sock.sendMedia(m.chat, resultBuffer, null, m, {
            type: 'image'
        })
        
    } catch (error) {
        console.log(error)
        m.react('❌')
        m.reply(
            `🍀 *Ups, ocurrió un problema*\n` +
            `Intenta nuevamente más tarde, evita hacer spam o prueba otra opción:\n` +
            `${m.prefix}ourinbanana ${m.text} (respondiendo a una imagen)`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
