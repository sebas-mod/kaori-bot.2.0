const { createCanvas, loadImage } = require('canvas')
const path = require('path')

const pluginConfig = {
    name: 'cert', // ⚠️ IMPORTANTE
    alias: [],
    category: 'canvas',
    description: 'Certificado de novios',
    usage: 'cert Juan Maria',
    example: 'cert Juan Maria',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    console.log('🔥 FUNCIONA CERT')

    const args = m.args || []

    if (args.length < 2) {
        return m.reply(`💑 Uso: ${m.prefix}cert Juan Maria`)
    }

    const name1 = args[0]
    const name2 = args.slice(1).join(' ')

    try {
        const bg = await loadImage(path.join(process.cwd(), 'assets/certificado.jpg'))

        const canvas = createCanvas(bg.width, bg.height)
        const ctx = canvas.getContext('2d')

        ctx.drawImage(bg, 0, 0)

        ctx.fillStyle = '#8b5e5e'
        ctx.textAlign = 'center'

        ctx.font = '50px serif'
        ctx.fillText(`${name1} ❤️ ${name2}`, canvas.width / 2, canvas.height / 2)

        const buffer = canvas.toBuffer()

        await sock.sendMessage(m.chat, {
            image: buffer,
            caption: '💑 Certificado creado'
        }, { quoted: m })

    } catch (e) {
        console.error('❌ ERROR:', e)
        m.reply('Error al generar certificado')
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
