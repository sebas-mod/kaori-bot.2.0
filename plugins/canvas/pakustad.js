const { f } = require("../../src/lib/ourin-http")
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: ['pakustad', 'pak-ustad', 'tanyaustad'],
    alias: [],
    category: 'fun',
    description: 'Pregúntale al ustad (imagen)',
    usage: '.pakustad <pregunta>',
    example: '.pakustad por que soy guapo',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text || m.quoted?.text
    
    if (!text) {
        return m.reply(
            `⚠️ *ᴄóᴍᴏ ᴜsᴀʀ*\n\n` +
            `> \`${m.prefix}pakustad <pregunta>\`\n\n` +
            `> Ejemplo: \`${m.prefix}pakustad por que soy guapo\``
        )
    }
    
    await m.react('🕕')
    
    try {
        const apiUrl = `https://api.cuki.biz.id/api/canvas/ustadz?apikey=cuki-x&text=${encodeURIComponent(text)}`
        const { results } = await f(apiUrl)
        await sock.sendMedia(m.chat, results.url, text, m, {
            type: 'image'
        })
        
        m.react('✅')
        
    } catch (err) {
        m.react('☢')
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
