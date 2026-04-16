const axios = require('axios')
const { f } = require('../../src/lib/ourin-http')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'glm4',
    alias: ['glm', 'glm46v'],
    category: 'ai',
    description: 'Chatear con GLM 4.6V',
    usage: '.glm4 <pregunta>',
    example: '.glm4 Hola ¿cómo estás?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text
    
    if (!text) {
        return m.reply(
            `🌐 *ɢʟᴍ 4.6ᴠ*\n\n` +
            `> Escribe una pregunta\n\n` +
            `\`Ejemplo: ${m.prefix}glm4 Hola ¿cómo estás?\``
        )
    }
    
    m.react('🕕')
    
    try {
        const url = `https://api.nexray.web.id/ai/glm?text=${encodeURIComponent(text)}&model=glm-4.6`
        const data = await f(url)
            
        const content = data.result
        
        m.react('✅')
        await m.reply(`${content}`)
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
