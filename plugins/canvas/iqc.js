const axios = require('axios')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'iqc',
    alias: ['iqchat', 'iphonechat'],
    category: 'canvas',
    description: 'Crear imagen de chat estilo iPhone',
    usage: '.iqc <texto>',
    example: '.iqc Hola linda',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    if (!text) {
        return m.reply(`📱 *IQC CHAT*\n\n> Ingresa texto para el chat\n\n\`Ejemplo: ${m.prefix}iqc Hola linda\``)
    }
    
    m.react('🕕')
    
    try {
        const now = new Date()
        const time = require("moment-timezone").tz("Asia/Jakarta").format("HH:mm")

        await sock.sendMedia(m.chat, `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(time)}&messageText=${encodeURIComponent(text)}`, null, m, {
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
