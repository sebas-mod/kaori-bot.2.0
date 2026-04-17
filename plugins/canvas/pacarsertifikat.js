const { createCanvas, loadImage, registerFont } = require('canvas')
const path = require('path')
const te = require('../../src/lib/ourin-error')

// 💖 Fuente manuscrita romántica (descargala y ponela en /assets/fonts/GreatVibes-Regular.ttf)
try {
  registerFont(path.join(__dirname, '../../assets/fonts/GreatVibes-Regular.ttf'), { family: 'Romantic' })
} catch {}

const pluginConfig = {
    name: 'cerpareja',
    alias: ['certpareja', 'parejacert'],
    category: 'canvas',
    description: 'Crear certificado de pareja',
    usage: '.cerpareja <nombre1> <nombre2>',
    example: '.cerpareja Juan María',
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const args = m.args || []

    if (args.length < 2) {
        return m.reply(
            `💑 *CERTIFICADO DE PAREJA*\n\n` +
            `📌 Uso:\n` +
            `➤ ${m.prefix}cerpareja <nombre1> <nombre2>\n\n` +
            `📌 Ejemplo:\n` +
            `➤ ${m.prefix}cerpareja Juan María`
        )
    }

    const name1 = args[0]
    const name2 = args.slice(1).join(' ')

    m.react('💑')

    try {
        const width = 1024
        const height = 600

        const canvas = createCanvas(width, height)
        const ctx = canvas.getContext('2d')

        // 🔥 Fondo
        const background = await loadImage('https://imagenes-one.vercel.app/certificadofondo.png')
        ctx.drawImage(background, 0, 0, width, height)

        ctx.textAlign = 'center'

        // Título
        ctx.fillStyle = '#8b5c5c'
        ctx.font = 'bold 50px Romantic'
        ctx.fillText('Certificado de Amor', width / 2, 90)

        // Texto
        ctx.fillStyle = '#444'
        ctx.font = '24px sans-serif'
        ctx.fillText('Este certificado confirma que', width / 2, 160)

        // 💖 Nombres (MANUSCRITA)
        ctx.fillStyle = '#d16b86'
        ctx.font = '60px Romantic'
        ctx.fillText(name1, width / 2, 240)

        ctx.font = '35px Romantic'
        ctx.fillText('&', width / 2, 290)

        ctx.font = '60px Romantic'
        ctx.fillText(name2, width / 2, 350)

        // Final
        ctx.fillStyle = '#444'
        ctx.font = '24px sans-serif'
        ctx.fillText('Están oficialmente unidos por el amor 💖', width / 2, 420)

        // Fecha
        const fecha = new Date().toLocaleDateString('es-AR')
        ctx.font = '20px sans-serif'
        ctx.fillText(`Fecha: ${fecha}`, width / 2, 480)

        const buffer = canvas.toBuffer('image/png')

        await sock.sendMessage(m.chat, {
            image: buffer,
            caption: `💑 *Certificado generado*\n❤️ ${name1} & ${name2}`
        }, { quoted: m })

        m.react('✅')

    } catch (error) {
        console.error(error)
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
