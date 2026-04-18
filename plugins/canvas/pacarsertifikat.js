const { createCanvas, loadImage } = require('canvas')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'certificadonovios',
    alias: ['certamor', 'novioscert'],
    category: 'canvas',
    description: 'Crear certificado de novios personalizado',
    usage: '.certificadonovios <nombre1> <nombre2>',
    example: '.certificadonovios Juan Maria',
    cooldown: 10,
    isEnabled: true
}

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

        // Dibujar fondo
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)

        // Estilo texto
        ctx.fillStyle = '#5a3e36'
        ctx.textAlign = 'center'

        // Texto principal (nombres)
        ctx.font = '50px serif'
        ctx.fillText(`${name1} ❤️ ${name2}`, canvas.width / 2, canvas.height / 2)

        // Texto secundario
        ctx.font = '30px serif'
        ctx.fillText('Están oficialmente unidos por el amor', canvas.width / 2, canvas.height / 2 + 60)

        // Fecha
        const fecha = new Date().toLocaleDateString()
        ctx.font = '25px serif'
        ctx.fillText(`Fecha: ${fecha}`, canvas.width / 2, canvas.height - 100)

        // Guardar temporal
        const buffer = canvas.toBuffer('image/png')

        await sock.sendMessage(m.chat, {
            image: buffer,
            caption: `💑 Certificado de amor generado`
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
