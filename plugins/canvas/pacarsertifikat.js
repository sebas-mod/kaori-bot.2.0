const { createCanvas, loadImage } = require('@napi-rs/canvas')
const path = require('path')
const fs = require('fs')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'pacarsertifikat',
    alias: ['sertifikatpacar', 'certpacar', 'pacarcert', 'certificadoamor'],
    category: 'canvas',
    description: 'Crea un certificado de amor en español',
    usage: '.pacarsertifikat <nombre1> <nombre2>',
    example: '.pacarsertifikat Luis Maria',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ')
    const lines = []
    let line = ''

    for (const word of words) {
        const testLine = line ? `${line} ${word}` : word
        const width = ctx.measureText(testLine).width

        if (width > maxWidth && line) {
            lines.push(line)
            line = word
        } else {
            line = testLine
        }
    }

    if (line) lines.push(line)
    return lines
}

function drawCenteredLines(ctx, text, x, y, maxWidth, lineHeight) {
    const lines = wrapText(ctx, text, maxWidth)
    const totalHeight = (lines.length - 1) * lineHeight
    let currentY = y - totalHeight / 2

    for (const line of lines) {
        ctx.fillText(line, x, currentY)
        currentY += lineHeight
    }
}

function drawOrnamentLine(ctx, x, y, width, color = '#e7b9c7') {
    const left = x - width / 2
    const right = x + width / 2

    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.moveTo(left, y)
    ctx.lineTo(x - 24, y)
    ctx.moveTo(x + 24, y)
    ctx.lineTo(right, y)
    ctx.stroke()

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
}

async function handler(m, { sock }) {
    const args = m.args || []

    if (args.length < 2) {
        return m.reply(
            `💖 *CERTIFICADO DE AMOR*\n\n` +
            `╭┈┈⬡「 📋 *CÓMO USAR* 」\n` +
            `┃ ◦ \`${m.prefix}pacarsertifikat <nombre1> <nombre2>\`\n` +
            `╰┈┈⬡\n\n` +
            `> Ejemplo: \`${m.prefix}pacarsertifikat Luis Maria\``
        )
    }

    const nombre1 = args[0].trim()
    const nombre2 = args.slice(1).join(' ').trim()
    const nombres = `${nombre1} y ${nombre2}`

    m.react('💖')

    try {
        const bgPath = path.join(process.cwd(), 'assets', 'images', 'certificado.jpg')
        const bg = await loadImage(bgPath)

        const canvas = createCanvas(bg.width, bg.height)
        const ctx = canvas.getContext('2d')

        ctx.drawImage(bg, 0, 0, bg.width, bg.height)

        const centerX = 760

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        ctx.shadowColor = 'rgba(255,255,255,0.45)'
        ctx.shadowBlur = 12
        ctx.fillStyle = '#936865'
        ctx.font = 'bold 56px serif'
        ctx.fillText('CERTIFICADO', centerX, 108)

        ctx.shadowBlur = 6
        ctx.font = 'bold 28px serif'
        ctx.fillText('DE', centerX, 150)

        ctx.shadowBlur = 14
        ctx.fillStyle = '#df8ea8'
        ctx.font = 'italic 72px serif'
        ctx.fillText('Amor', centerX, 218)

        ctx.shadowBlur = 0
        drawOrnamentLine(ctx, centerX, 265, 260)

        ctx.fillStyle = '#7f6b6a'
        ctx.font = '28px serif'
        ctx.fillText('Este certificado confirma que', centerX, 322)

        ctx.fillStyle = '#cb6f8f'
        ctx.font = 'bold 40px serif'
        drawCenteredLines(ctx, nombres, centerX, 396, 430, 46)

        drawOrnamentLine(ctx, centerX, 456, 220)

        ctx.fillStyle = '#7f6b6a'
        ctx.font = '28px serif'
        drawCenteredLines(ctx, 'Están oficialmente unidos por el amor', centerX, 522, 430, 38)

        ctx.fillStyle = '#b98998'
        ctx.font = '24px serif'
        drawCenteredLines(ctx, 'Con la bendición de los cerezos y mucho cariño', centerX, 606, 450, 32)

        drawOrnamentLine(ctx, centerX, 664, 240, '#edd0d8')

        const fecha = new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })

        ctx.fillStyle = '#8a6664'
        ctx.font = '27px serif'
        ctx.fillText(`Fecha: ${fecha}`, centerX, 730)

        ctx.fillStyle = '#d9a3b2'
        ctx.font = 'italic 21px serif'
        ctx.fillText('Hecho con mucho amor', centerX, 778)

        const buffer = canvas.toBuffer('image/png')

        await sock.sendMessage(
            m.chat,
            {
                image: buffer,
                caption: `💞 Certificado de amor para ${nombre1} y ${nombre2}`
            },
            { quoted: m }
        )

        m.react('✅')
    } catch (error) {
        console.error('[pacarsertifikat] Error:', error)
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
