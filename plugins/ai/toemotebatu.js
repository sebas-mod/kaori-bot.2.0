const { uploadImage } = require('../../src/lib/ourin-uploader')
const { f } = require('../../src/lib/ourin-http')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'toemotebatu',
    alias: ['emotebatu', 'moai', 'tomoai'],
    category: 'ai',
    description: 'Convertir una imagen en emote de piedra 🗿',
    usage: '.toemotebatu (responde a una imagen)',
    example: '.toemotebatu',
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
            `🗿 *ᴇᴍᴏᴛᴇ ᴅᴇ ᴘɪᴇᴅʀᴀ*\n\n` +
            `> Envía o responde a una imagen\n\n` +
            `\`${m.prefix}toemotebatu\``
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
        
        const url = `https://api-faa.my.id/faa/tomoai?url=${encodeURIComponent(imageUrl)}`
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
