const { f } = require('../../src/lib/ourin-http')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'gpt4o',
    alias: ['gpt4'],
    category: 'ai',
    description: 'Chatear con GPT-4o',
    usage: '.gpt4o <pregunta>',
    example: '.gpt4o Hola ¿cómo estás?',
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
            `🧠 *ɢᴘᴛ-4ᴏ*\n\n` +
            `> Escribe una pregunta\n\n` +
            `\`Ejemplo: ${m.prefix}gpt4o Hola ¿cómo estás?\``
        )
    }
    
    m.react('🕕')
    
    try {
        const url = await f(`https://api.nexray.web.id/ai/chatgpt?text=${encodeURIComponent(text)}&model=gpt-4o`)
        
        m.react('✅')
        await m.reply(`${url.result}`)
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
