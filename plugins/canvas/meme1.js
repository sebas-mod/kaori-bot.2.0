const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'meme1',
    alias: ['drakememe'],
    category: 'canvas',
    description: 'Crear meme formato Drake',
    usage: '.meme1 <texto1>|<texto2>',
    example: '.meme1 Dormir|Usar el celular',
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
    
    if (parts.length < 2 || !parts[0] || !parts[1]) {
        return m.reply(
            `🎭 *MEME DRAKE*\n\n` +
            `> Ingresa 2 textos separados con |\n\n` +
            `> Ejemplo: \`${m.prefix}meme1 Dormir|Usar el celular\``
        )
    }
    
    const text1 = parts[0]
    const text2 = parts[1]
    
    const apikey = config.APIkey?.lolhuman
    if (!apikey) {
        return m.reply(`❌ ¡API key de lolhuman no configurada!`)
    }
    
    m.react('🕕')
    
    try {
        await sock.sendMedia(m.chat, `https://api.lolhuman.xyz/api/meme8?apikey=${apikey}&text1=${encodeURIComponent(text1)}&text2=${encodeURIComponent(text2)}`, null, m, {
            type: 'image',
        })
        
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
