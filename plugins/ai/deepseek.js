const { f } = require("../../src/lib/ourin-http")
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'deepseek',
    alias: ['deepseekr1', 'dsr1'],
    category: 'ai',
    description: 'Chatear con DeepSeek R1',
    usage: '.deepseek <pregunta>',
    example: '.deepseek Explica qué es la IA',
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
        return m.reply(
            `🧠 *ᴅᴇᴇᴘsᴇᴇᴋ ʀ1*\n\n` +
            `> Escribe una pregunta\n\n` +
            `\`Ejemplo: ${m.prefix}deepseek Explica qué es la IA\``
        )
    }
    
    m.react('🧠')
    
    try {
        const result = await f(
            `https://api.nexray.web.id/ai/deepseek?text=${encodeURIComponent(text)}`
        )
        
        m.react('✅')
        await m.reply(`${result.result}`)
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
