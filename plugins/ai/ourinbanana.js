const { live3d } = require('../../src/scraper/seaart')

const pluginConfig = {
    name: 'ourinbanana',
    alias: [],
    category: 'ai',
    description: 'Editar imágenes con IA usando un prompt',
    usage: '.ourinbanana <prompt>',
    example: '.ourinbanana hazlo estilo anime',
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
            `🍌 *OURIN BANANA SUPER*\n\n` +
            `> Edita imágenes con IA\n\n` +
            `\`Ejemplo: ${m.prefix}ourinbanana hazlo estilo anime\`\n\n` +
            `> Responde o envía una imagen con el comando`
        )
    }
    
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    
    if (!isImage) {
        return m.reply(
            `🍌 *OURIN BANANA SUPER*\n\n` +
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
        
        const resultBuffer = await live3d(mediaBuffer, prompt).then(res => res.image)

        m.react('✅')
        
        await sock.sendMedia(m.chat, resultBuffer, null, m, {
            type: 'image'
        })
        
    } catch (error) {
        m.react('❌')
        m.reply(
            `🍀 *Ups, ocurrió un problema*\n` +
            `Intenta nuevamente más tarde y evita hacer spam`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
