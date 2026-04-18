const { createCanvas, loadImage, registerFont } = require('canvas')
const path = require('path')

const pluginConfig = {
    name: 'certificadonovios',
    alias: ['certamor', 'novioscert'],
    category: 'canvas',
    description: 'Crear certificado de novios',
    usage: '.certificadonovios <nombre1> <nombre2>',
    example: '.certificadonovios Juan Maria',
    cooldown: 10,
    isEnabled: true
}

// (Opcional) fuente bonita
try {
    registerFont(path.join(__dirname, '../../assets/GreatVibes-Regular.ttf'), {
        family: 'GreatVibes'
    })
} catch {}

async function handler(m, { sock }) {
    const args = m.args || []

    if (args.length < 2) {
        return m.reply(`💑 Uso: ${m.prefix}certificadonovios <nombre1> <nombre2>`)
    }

    const name1 = args[0]
    const name2 = args.slice(1).join(' ')

    try {
        m.react('💖')

        const bg = await loadImage(path.join(__dirname, '../../assets/certificado.jpg'))

        const canvas = createCanvas(bg.width, bg.height)
        const ctx = canvas.getContext('2d')

        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)

        ctx.fillStyle = '#8b5e5e'
        ctx.textAlign = 'center'

        // nombres
        ctx.font = '60px "GreatVibes", serif'
        ctx.fillText(`${name1} ❤️ ${name2}`, canvas.width / 2, canvas.height / 2 - 20)

        // frase
        ctx.font = '28px serif'
        ctx.fillText('Están oficialmente unidos por el amor', canvas.width / 2, canvas.height / 2 + 40)

        // fecha
        const fecha = new Date().toLocaleDateString('es-AR')
        ctx.font = '24px serif'
        ctx.fillText(`Fecha: ${fecha}`, canvas.width / 2, canvas.height - 90)

        const buffer = canvas.toBuffer()

        await sock.sendMessage(m.chat, {
            image: buffer,
            caption: '💑 Certificado de amor'
        }, { quoted: m })

        m.react('✅')

    } catch (e) {
        console.error(e)
        m.react('❌')
        m.reply('Error al generar el certificado')
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
