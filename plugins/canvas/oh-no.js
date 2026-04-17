const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'oh-no',
    alias: ['ohno', 'ohnomeme'],
    category: 'canvas',
    description: 'Crear meme "oh no"',
    usage: '.oh-no <texto>',
    example: '.oh-no Me olvidé de hacer la tarea',
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
    
    // Si no hay texto, usar el mensaje citado
    if (!text && m.quoted?.text) {
        text = m.quoted.text.trim()
    }
    
    // Validación
    if (!text) {
        return m.reply(
            `😱 *ᴏʜ ɴᴏ ᴍᴇᴍᴇ*\n\n` +
            `> Ingresa un texto para el meme\n\n` +
            `> Ejemplo: \`${m.prefix}oh-no Me olvidé de hacer la tarea\``
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
            `https://api.lolhuman.xyz/api/creator/ohno?apikey=${apikey}&text=${encodeURIComponent(text)}`,
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
