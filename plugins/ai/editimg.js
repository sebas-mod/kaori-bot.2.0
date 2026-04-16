const { uploadToTmpFiles } = require('../../src/lib/ourin-tmpfiles')

const pluginConfig = {
    name: 'editimage',
    alias: ['editimg', 'imgedit'],
    category: 'ai',
    description: 'Editar imágenes con IA usando prompts',
    usage: '.editimage <prompt>',
    example: '.editimage convertir a estilo anime',
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
            `*ᴇᴅɪᴛᴀʀ ɪᴍᴀɢᴇɴ*\n\n` +
            `> Edita imágenes con IA\n\n` +
            `\`Ejemplo: ${m.prefix}editimage convertir a estilo anime\`\n\n` +
            `> Responde o envía una imagen con el comando`
        )
    }
    
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    
    if (!isImage) {
        return m.reply(
            `*ᴇᴅɪᴛᴀʀ ɪᴍᴀɢᴇɴ*\n\n` +
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
            return m.reply(`❌ *ERROR*\n\n> No se pudo descargar la imagen`)
        }

        const image = await uploadToTmpFiles(mediaBuffer, { filename: 'image.jpg' })
        
        await sock.sendMessage(m.chat, {
            image: { url: `https://api-faa.my.id/faa/editfoto?url=${encodeURIComponent(image.directUrl)}&prompt=${encodeURIComponent(prompt)}` },
            caption: `LISTO`
        }, { quoted: m })
        
        m.react('✅')

    } catch (error) {
        m.react('❌')
        m.reply(
            `🍀 *Ups, parece que hubo un problema*\n` +
            `> Intenta la versión ${m.prefix}ourinbanana`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
