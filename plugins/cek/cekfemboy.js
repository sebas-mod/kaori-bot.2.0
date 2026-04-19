const cekfemboy = require('../../src/scraper/lufemboy')
const { fetchBuffer } = require('../../src/lib/ourin-utils')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'cekfemboy',
    alias: ['femboy'],
    category: 'chequeo',
    description: 'Verifica qué tan femboy eres',
    usage: '.cekfemboy <nombre>',
    example: '.cekfemboy Budi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energia: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const percent = Math.floor(Math.random() * 101)
    const mentioned = m.mentionedJid[0] || m.sender
            try {
        const result = cekfemboy(nama)
        
        let buffer = null
        try {
            buffer = await fetchBuffer(result.gif)
        } catch (e) {}
        
        let txt = mentioned === m.sender ? `Hola @${mentioned.split('@')[0]}
    
Nivel de femboy tuyo *${percent}%*
\`\`\`${desc}\`\`\`` : `¿Quieres comprobar el nivel de femboy de @${mentioned.split('@')[0]}?
    
Su nivel de femboy es *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
        
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
