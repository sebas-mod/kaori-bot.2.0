const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'meme3',
    alias: ['3panel'],
    category: 'canvas',
    description: 'Crear meme de 3 paneles',
    usage: '.meme3 <texto1>|<texto2>|<texto3>',
    example: '.meme3 ¿Qué pasó ayer?|No sé, me fui a dormir|Pero no compraste nada',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const input = m.text?.trim() || ''
    const parts = input.split('|').map(s => s.trim())
    
    // Validación
    if (parts.length < 3 || !parts[0] || !parts[1] || !parts[2]) {
        return m.reply(
            `🎭 *ᴍᴇᴍᴇ 3 ᴘᴀɴᴇʟ*\n\n` +
            `> Ingresa 3 textos separados por |\n\n` +
            `> Ejemplo: \`${m.prefix}meme3 Texto1|Texto2|Texto3\``
        )
    }
    
    const text1 = parts[0]
    const text2 = parts[1]
    const text3 = parts[2]
    
    const apikey = config.APIkey?.lolhuman
    if (!apikey) {
        return m.reply(`❌ ¡La API key de lolhuman no está configurada!`)
    }
    
    m.react('🕕')
    
    try {
        await sock.sendMedia(
            m.chat,
            `https://api.lolhuman.xyz/api/meme6?apikey=${apikey}&text1=${encodeURIComponent(text1)}&text2=${encodeURIComponent(text2)}&text3=${encodeURIComponent(text3)}`,
            null,
            m,
            {
                type: 'image',
            }
        )
        
        m.react('✅')
        
    } catch (err) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
