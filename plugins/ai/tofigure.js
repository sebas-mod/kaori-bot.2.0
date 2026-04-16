const axios = require('axios')
const { uploadImage } = require('../../src/lib/ourin-uploader')
const { f } = require('../../src/lib/ourin-http')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'tofigure',
    alias: ['figure', 'figurestyle'],
    category: 'ai',
    description: 'Convertir una imagen a estilo figura / acción',
    usage: '.tofigure (responde a una imagen)',
    example: '.tofigure',
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
            `🎭 *ᴇsᴛɪʟᴏ ꜰɪɢᴜʀᴀ*\n\n` +
            `> Envía o responde a una imagen para convertirla en figura tipo acción\n\n` +
            `\`${m.prefix}tofigure\``
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
        
        const res = await f(`https://api-faa.my.id/faa/tofigura?url=${encodeURIComponent(imageUrl)}`, 'arrayBuffer')
        
        m.react('✅')
        
        await sock.sendMedia(m.chat, Buffer.from(res), null, m, {
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
