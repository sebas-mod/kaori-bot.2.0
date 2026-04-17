const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'meme2',
    alias: ['changemymind'],
    category: 'canvas',
    description: 'Crear meme "change my mind"',
    usage: '.meme2 <texto>',
    example: '.meme2 El mate es mejor que el café',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    let text = m.text?.trim()
    
    // Si no hay texto, intenta usar el mensaje citado
    if (!text && m.quoted?.text) {
        text = m.quoted.text.trim()
    }
    
    // Validación
    if (!text) {
        return m.reply(
            `🎭 *ᴄʜᴀɴɢᴇ ᴍʏ ᴍɪɴᴅ*\n\n` +
            `> Ingresa un texto para el meme\n\n` +
            `> Ejemplo: \`${m.prefix}meme2 El mate es mejor\``
        )
    }
    
    const apikey = config.APIkey?.lolhuman
    if (!apikey) {
        return m.reply(`❌ ¡La API key de lolhuman no está configurada!`)
    }
    
    m.react('🕕')
    
    try {
        await sock.sendMedia(
            m.chat,
            `https://api.lolhuman.xyz/api/meme4?apikey=${apikey}&text=${encodeURIComponent(text)}`,
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
