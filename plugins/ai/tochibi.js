const { uploadImage } = require('../../src/lib/ourin-uploader')
const { f } = require('../../src/lib/ourin-http')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'tochibi',
    alias: ['chibi', 'chibistyle'],
    category: 'ai',
    description: 'Convertir una imagen a estilo Chibi',
    usage: '.tochibi (responde a una imagen)',
    example: '.tochibi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(
            `🎀 *ᴇsᴛɪʟᴏ ᴄʜɪʙɪ*\n\n` +
            `> Envía o responde a una imagen para convertirla a estilo Chibi\n\n` +
            `\`${m.prefix}tochibi\``
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
            return m.reply(`❌ No se pudo descargar la imagen`)
        }
        
        const imageUrl = await uploadImage(buffer, 'image.jpg')
        
        const url = `https://api-faa.my.id/faa/tochibi?url=${encodeURIComponent(imageUrl)}`
        const res = await f(url, 'arrayBuffer')
        
        m.react('✅')
        
        await sock.sendMedia(m.chat, Buffer.from(res), null, m, {
            type: 'image'
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
