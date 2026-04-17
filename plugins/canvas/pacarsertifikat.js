const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'pacarsertifikat',
    alias: ['sertifikatpareja', 'certpareja', 'parejacert'],
    category: 'canvas',
    description: 'Crear certificado de pareja',
    usage: '.pacarsertifikat <nombre1> <nombre2>',
    example: '.pacarsertifikat Juan María',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const args = m.args || []
    
    // Validación
    if (args.length < 2) {
        return m.reply(
            `💑 *sᴇʀᴛɪꜰɪᴄᴀᴅᴏ ᴅᴇ ᴘᴀʀᴇᴊᴀ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴏ́ᴍᴏ ᴜsᴀʀ* 」\n` +
            `┃ ◦ \`${m.prefix}pacarsertifikat <nombre1> <nombre2>\`\n` +
            `╰┈┈⬡\n\n` +
            `> Ejemplo: \`${m.prefix}pacarsertifikat Juan María\``
        )
    }
    
    const name1 = args[0]
    const name2 = args.slice(1).join(' ')
    
    m.react('💑')
    
    try {
        const apiKey = config.APIkey?.lolhuman
        
        if (!apiKey) {
            throw new Error('API Key no encontrada en config')
        }
        
        const apiUrl = `https://api.lolhuman.xyz/api/pacarserti?apikey=${apiKey}&name1=${encodeURIComponent(name1)}&name2=${encodeURIComponent(name2)}`
        
        await sock.sendMedia(m.chat, apiUrl, null, m, {
            type: 'image',
        })
        
        m.react('✅')
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
