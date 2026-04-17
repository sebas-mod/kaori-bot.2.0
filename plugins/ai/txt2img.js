const config = require('../../config')
const { f } = require('./../../src/lib/ourin-http')
const te = require('../../src/lib/ourin-error')
const pluginConfig = {
    name: 'txt2img',
    alias: ['texttoimage', 't2i', 'imagine'],
    category: 'ai',
    description: 'Generar imágenes a partir de texto con IA',
    usage: '.txt2img <prompt> | <estilo>',
    example: '.txt2img hermoso atardecer | anime',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 1,
    isEnabled: true
}

const STYLES = ['photorealistic', 'digital-art', 'impressionist', 'anime', 'fantasy', 'sci-fi', 'vintage']

async function handler(m, { sock }) {
    const input = m.args.join(' ')
    if (!input) {
        return m.reply(
            `🎨 *ᴛᴇxᴛ ᴛᴏ ɪᴍᴀɢᴇ*\n\n` +
            `> Genera imágenes a partir de texto con IA\n\n` +
            `\`Ejemplo: ${m.prefix}txt2img hermoso atardecer | anime\`\n\n` +
            `🎭 *sᴛʏʟᴇs*\n` +
            `> \`${STYLES.join(', ')}\``
        )
    }
    
    const [prompt, styleInput] = input.split('|').map(s => s.trim())
    const style = STYLES.includes(styleInput) ? styleInput : 'anime'

    m.react('🕕')
    
    try {
        const {data}  = await f(`https://api.neoxr.eu/api/stablediff?prompt=${encodeURIComponent(prompt)}&model=default&orientation=potrait&apikey=${config.APIkey.neoxr}`)
        
        await sock.sendMedia(m.chat, data.url, null, m, {
            type: 'image'
        })
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
