const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'cerpareja',
    alias: ['certpareja'],
    category: 'canvas'
}

async function handler(m, { sock }) {
    const args = m.args || []

    if (args.length < 2) {
        return m.reply('Usa: .cerpareja nombre1 nombre2')
    }

    const name1 = args[0]
    const name2 = args.slice(1).join(' ')

    try {
        const endpoint = `https://imagenes-one.vercel.app/api/certificado?name1=${encodeURIComponent(name1)}&name2=${encodeURIComponent(name2)}`
        
        const resApi = await fetch(endpoint)
        const json = await resApi.json()

        await sock.sendMedia(m.chat, json.url, null, m, {
            type: 'image'
        })

    } catch (e) {
        m.reply('Error generando certificado')
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
