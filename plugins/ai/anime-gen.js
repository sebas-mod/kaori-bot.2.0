const { f } = require('../../src/lib/ourin-http')
const config = require('../../config')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'anime-gen',
    alias: ['animegen', 'aianimegen', 'genai-anime'],
    category: 'ai',
    description: 'Generar arte anime con IA desde un prompt',
    usage: '.anime-gen <prompt>',
    example: '.anime-gen chica, colores vibrantes, sonriendo',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const prompt = m.text
    
    if (!prompt) {
        return m.reply(
            `🎨 *ᴀɴɪᴍᴇ ᴀʀᴛ ɢᴇɴᴇʀᴀᴅᴏʀ*\n\n` +
            `> Genera imágenes anime con IA desde un prompt\n\n` +
            `*ᴄómo ᴜsᴀʀ:*\n` +
            `> \`${m.prefix}anime-gen <descripción>\`\n\n` +
            `*ᴇᴊᴇᴍᴘʟᴏs:*\n` +
            `> \`${m.prefix}anime-gen chica, colores vibrantes, sonriendo, cabello degradado rosa y amarillo\`\n` +
            `> \`${m.prefix}anime-gen chico, estética oscura, cabello plateado, ojos rojos\`\n\n` +
            `*ᴛɪᴘs:*\n` +
            `> • Usa inglés para mejores resultados\n` +
            `> • Mientras más detallado el prompt, mejor la imagen\n` +
            `> • Agrega estilos: vibrante, oscuro, pastel, etc`
        )
    }
    
    m.react('🎨')

    try {
        const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'
        const apiUrl = `https://api.neoxr.eu/api/ai-anime?q=${encodeURIComponent(prompt)}&apikey=${NEOXR_APIKEY}`
        
        const data = await f(apiUrl)
        
        if (!data?.status || !data?.data?.url) {
            m.react('❌')
            return m.reply('❌ *ERROR*\n\n> No se pudo generar la imagen. ¡Inténtalo más tarde!')
        }
        
        const result = data.data  
        await sock.sendMedia(m.chat, result.url, null, m, {
            type: 'image'
        })
        
        m.react('✅')

    } catch (error) {
        m.react('☢')

        if (error.code === 'ECONNABORTED') {
            m.reply('⏱️ *TIEMPO AGOTADO*\n\n> La solicitud tardó demasiado. ¡Inténtalo de nuevo!')
        } else {
            m.reply(te(m.prefix, m.command, m.pushName))
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
