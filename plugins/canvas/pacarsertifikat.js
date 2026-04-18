const { createCanvas, loadImage, registerFont } = require('canvas')
const path = require('path')

// (Opcional) fuente bonita
registerFont(path.join(__dirname, '../../assets/GreatVibes-Regular.ttf'), {
    family: 'GreatVibes'
})

async function handler(m, { sock }) {
    const args = m.args || []
    if (args.length < 2) {
        return m.reply(`💑 Uso: ${m.prefix}certificadonovios <nombre1> <nombre2>`)
    }

    const name1 = args[0]
    const name2 = args.slice(1).join(' ')

    const bg = await loadImage(path.join(__dirname, '../../assets/certificado.jpg'))

    const canvas = createCanvas(bg.width, bg.height)
    const ctx = canvas.getContext('2d')

    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)

    // 💕 NOMBRES (bonito centrado)
    ctx.fillStyle = '#8b5e5e'
    ctx.textAlign = 'center'
    ctx.font = '60px "GreatVibes"'
    ctx.fillText(`${name1} ❤️ ${name2}`, canvas.width / 2, canvas.height / 2 - 20)

    // 💬 FRASE
    ctx.font = '28px serif'
    ctx.fillText('Están oficialmente unidos por el amor', canvas.width / 2, canvas.height / 2 + 40)

    // 📅 FECHA
    const fecha = new Date().toLocaleDateString('es-AR')
    ctx.font = '24px serif'
    ctx.fillText(`Fecha: ${fecha}`, canvas.width / 2, canvas.height - 90)

    const buffer = canvas.toBuffer()

    await sock.sendMessage(m.chat, {
        image: buffer,
        caption: '💑 Certificado creado'
    }, { quoted: m })
}
