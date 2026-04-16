const { f } = require('../../src/lib/ourin-http')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'matematika',
    alias: ['mathgpt', 'math', 'mathsolver'],
    category: 'ai',
    description: 'IA para resolver problemas matemáticos',
    usage: '.matematika <problema> o responder a una imagen',
    example: '.matematika ¿cuánto es 2+2?',
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
        return m.reply(
            `📐 *ᴍᴀᴛʜ ɢᴘᴛ*\n\n` +
            `> Escribe un problema matemático\n\n` +
            `\`Ejemplo: ${m.prefix}matematika ¿cuánto es 2+2?\``
        )
    }
    
    m.react('🕕')
    
    try {
        let url = `https://api.nexray.web.id/ai/mathgpt?text=${encodeURIComponent(text || 'solve this')}`
        const data = await f(url)

        const answer = data.result
        
        m.react('✅')
        await m.reply(`${answer}`)
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
