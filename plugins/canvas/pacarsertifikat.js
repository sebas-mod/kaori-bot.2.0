const axios = require('axios')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'cerpareja',
    alias: ['certpareja', 'parejacert'],
    category: 'canvas',
    description: 'Crear certificado de pareja',
    usage: '.cerpareja <nombre1> <nombre2>',
    example: '.cerpareja Juan María',
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
    
    if (args.length < 2) {
        return m.reply(
            `💑 *CERTIFICADO DE PAREJA*\n\n` +
            `╭┈┈⬡「 📋 *CÓMO USAR* 」\n` +
            `┃ ◦ \`${m.prefix}cerpareja <nombre1> <nombre2>\`\n` +
            `╰┈┈⬡\n\n` +
            `> Ejemplo: \`${m.prefix}cerpareja Juan María\``
        )
    }
    
    const name1 = args[0]
    const name2 = args.slice(1).join(' ')
    
    m.react('💑')
    
    try {
        // 🔥 TU ENDPOINT
        const url = `https://imagenes-one.vercel.app/api/certificado?name1=${encodeURIComponent(name1)}&name2=${encodeURIComponent(name2)}`
        
        await sock.sendMedia(m.chat, url, null, m, {
            type: 'image'
        })
        
        m.react('✅')
        
    } catch (error) {
        console.error(error)
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
