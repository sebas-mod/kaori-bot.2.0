const { f } = require('../../src/lib/ourin-http')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'muslimai',
    alias: ['islamai', 'quranai'],
    category: 'ai',
    description: 'IA para hacer preguntas sobre el Islam y el Corán',
    usage: '.muslimai <pregunta>',
    example: '.muslimai ¿Qué es el rezo?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    if (!text) {
        return m.reply(`☪️ *ᴍᴜsʟɪᴍ ᴀɪ*\n\n> Ingresa una pregunta sobre el Islam\n\n\`Ejemplo: ${m.prefix}muslimai ¿Qué es el rezo?\``)
    }
    
    m.react('🕕')
    
    try {
        const url = `https://api.nexray.web.id/ai/muslim?text=${encodeURIComponent(text)}`
        const data = await f(url)
        
        const answer = data.result
        let response = `${answer}`
        
        m.react('✅')
        await m.reply(response)
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
