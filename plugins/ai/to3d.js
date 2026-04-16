const nanoBanana = require('../../src/scraper/nanobanana')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'to3d',
    alias: ['3d', '3dfy', 'to3dmodel'],
    category: 'ai',
    description: 'Convertir una imagen a estilo render 3D',
    usage: '.to3d (responde/envía una imagen)',
    example: '.to3d',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 3,
    isEnabled: true
}

const PROMPT = `Transform this image into a high-quality 3D rendered style like Pixar or DreamWorks CGI. 
Apply realistic lighting, smooth textures, and that polished 3D animated movie look. 
Keep the original composition but make it look like a frame from a modern 3D animated film 
with subsurface scattering on skin, detailed hair, and cinematic lighting.`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'))
    
    if (!isImage) {
        return m.reply(
            `🎮 *ᴛᴏ 3ᴅ*\n\n` +
            `> Envía o responde a una imagen para convertirla a estilo 3D\n\n` +
            `\`${m.prefix}to3d\``
        )
    }
    
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
        
        await m.react('🕕')
        
        const result = await nanoBanana(buffer, PROMPT)
        
        m.react('✅')
        
        await sock.sendMedia(m.chat, result, null, m, {
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
