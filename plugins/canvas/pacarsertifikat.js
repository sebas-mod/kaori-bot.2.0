const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas')
const path = require('path')
const fs = require('fs')
const te = require('../../src/lib/ourin-error')

const fontScriptPath = path.join(process.cwd(), 'assets', 'fonts', 'AlexBrush-Regular.ttf')
const fontTitlePath = path.join(process.cwd(), 'assets', 'fonts', 'Cinzel-Bold.ttf')
const fontBodyPath = path.join(process.cwd(), 'assets', 'fonts', 'CormorantGaramond-Regular.ttf')
const fontBodyBoldPath = path.join(process.cwd(), 'assets', 'fonts', 'CormorantGaramond-Bold.ttf')

if (fs.existsSync(fontScriptPath)) GlobalFonts.registerFromPath(fontScriptPath, 'AlexBrush')
if (fs.existsSync(fontTitlePath)) GlobalFonts.registerFromPath(fontTitlePath, 'Cinzel')
if (fs.existsSync(fontBodyPath)) GlobalFonts.registerFromPath(fontBodyPath, 'Cormorant')
if (fs.existsSync(fontBodyBoldPath)) GlobalFonts.registerFromPath(fontBodyBoldPath, 'CormorantBold')

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

function drawLineWithHeart(ctx, x, y, width, color = '#c897a8') {
    const left = x - width / 2
    const right = x + width / 2

    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.moveTo(left, y)
    ctx.lineTo(x - 30, y)
    ctx.moveTo(x + 30, y)
    ctx.lineTo(right, y)
    ctx.stroke()

    ctx.fillStyle = color
    ctx.font = '20px serif'
    ctx.fillText('❤', x, y + 1)
    ctx.restore()
}

function fitFontSize(ctx, text, startSize, minSize, maxWidth, family, weight = '') {
    let size = startSize
    while (size >= minSize) {
        ctx.font = `${weight ? weight + ' ' : ''}${size}px ${family}`
        if (ctx.measureText(text).width <= maxWidth) return size
        size -= 2
    }
    return minSize
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
        const bgPath = path.join(process.cwd(), 'assets', 'images', 'certificadofondo.png')

        if (!fs.existsSync(bgPath)) {
            throw new Error(`No se encontró la imagen en: ${bgPath}`)
        }

        const bg = await loadImage(bgPath)
        const canvas = createCanvas(bg.width, bg.height)
        const ctx = canvas.getContext('2d')

        ctx.drawImage(bg, 0, 0, bg.width, bg.height)

        const centerX = 825

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        ctx.shadowColor = 'rgba(255,255,255,0.28)'
        ctx.shadowBlur = 6

        ctx.fillStyle = '#3a2c2c'
        ctx.font = 'bold 54px Cinzel'
        ctx.fillText('CERTIFICADO', centerX, 112)

        ctx.fillStyle = '#4a3838'
        ctx.font = 'bold 24px Cinzel'
        ctx.fillText('DE', centerX, 160)

        ctx.shadowBlur = 2
        ctx.fillStyle = '#9e4f6d'
        ctx.font = '76px AlexBrush'
        ctx.fillText('Amor', centerX, 228)

        ctx.shadowBlur = 0
        drawLineWithHeart(ctx, centerX, 274, 250)

        ctx.fillStyle = '#2e2525'
        ctx.font = '34px Cormorant'
        ctx.fillText('Este certificado confirma que', centerX, 334)

        const nombresSize = fitFontSize(ctx, nombres, 50, 28, 470, 'CormorantBold', 'bold')
        ctx.fillStyle = '#111111'
        ctx.font = `bold ${nombresSize}px CormorantBold`
        drawCenteredLines(ctx, nombres, centerX, 414, 470, nombresSize + 8)

        drawLineWithHeart(ctx, centerX, 480, 240, '#cfa3af')

        ctx.fillStyle = '#1e1a1a'
        ctx.font = '36px Cormorant'
        drawCenteredLines(ctx, 'Están oficialmente unidos por el amor', centerX, 548, 500, 42)

        ctx.fillStyle = '#514343'
        ctx.font = '28px Cormorant'
        drawCenteredLines(ctx, 'Con la bendición de los cerezos y mucho cariño', centerX, 638, 510, 34)

        drawLineWithHeart(ctx, centerX, 698, 220, '#d7b0bb')

        const fecha = new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })

        ctx.textAlign = 'right'
        ctx.fillStyle = '#111111'
        ctx.font = 'bold 30px CormorantBold'
        ctx.fillText(`Fecha: ${fecha}`, 1040, 765)

        ctx.textAlign = 'center'
        ctx.fillStyle = '#8c5d70'
        ctx.font = '38px AlexBrush'
        ctx.fillText('Hecho con mucho amor', centerX, 814)

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
        console.error('[pacarsertifikat] ERROR REAL:', error)
        m.react('☢')
        m.reply(`Error al generar el certificado:\n${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
