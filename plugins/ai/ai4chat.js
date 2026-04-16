const { f } = require('../../src/lib/ourin-http')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'ai4chat',
    alias: ['ai'],
    category: 'ai',
    description: 'Chatear con AI4Chat',
    usage: '.ai4chat <pregunta>',
    example: '.ai4chat ¿Qué es JavaScript?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m) {
    const text = m.text
    if (!text) {
        return m.reply(
            `🤖 *ᴀɪ ᴄʜᴀᴛ*\n\n` +
            `> Escribe una pregunta\n\n` +
            `\`Ejemplo: ${m.prefix}ai4chat ¿Qué es JavaScript?\``
        )
    }

    m.react('🕕')

    try {
        const data = await f(
            `https://api.zenzxz.my.id/ai/copilot?message=${encodeURIComponent(text)}&model=gpt-5`
        )

        m.react('✅')
        await m.reply(`${data.result.text}`)

    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
