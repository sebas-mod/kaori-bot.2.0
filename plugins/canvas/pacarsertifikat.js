const path = require('path')
const fs = require('fs')
const { createCanvas, loadImage, registerFont } = require('canvas')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'certificadoamor',
    alias: ['certamor', 'amorcertificado', 'certificadopareja'],
    category: 'canvas',
    description: 'Crea un certificado de amor en espanol con estilo anime',
    usage: '.certificadoamor <nombre1> <nombre2>',
    example: '.certificadoamor Luis Maria',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const FONT_DIR = path.join(__dirname, '../../assets/fonts')
const BG_PATH = path.join(__dirname, '../../assets/images/certificadofondo.png')
const TEMP_DIR = path.join(__dirname, '../../temp')

registerOptionalFont(path.join(FONT_DIR, 'Cinzel-Bold.ttf'), 'CertTitle')
registerOptionalFont(path.join(FONT_DIR, 'GreatVibes-Regular.ttf'), 'CertScript')
registerOptionalFont(path.join(FONT_DIR, 'CormorantGaramond-Regular.ttf'), 'CertBody')
registerOptionalFont(path.join(FONT_DIR, 'CormorantGaramond-Bold.ttf'), 'CertBodyBold')

function registerOptionalFont(fontPath, family) {
    if (fs.existsSync(fontPath)) {
        registerFont(fontPath, { family })
    }
}

function getFont(size, primary, fallback, weight = '') {
    const fontWeight = weight ? `${weight} ` : ''
    return `${fontWeight}${size}px "${primary}", ${fallback}`
}

function fitText(ctx, text, families, startSize, minSize, maxWidth, weight = '') {
    let size = startSize

    while (size >= minSize) {
        ctx.font = getFont(size, families.primary, families.fallback, weight)
        if (ctx.measureText(text).width <= maxWidth) return size
        size -= 2
    }

    return minSize
}

function drawCenteredText(ctx, text, x, y, options = {}) {
    const {
        maxWidth = 420,
        lineHeight = 40,
        color = '#7d6767',
        families = { primary: 'CertBody', fallback: 'serif' },
        startSize = 30,
        minSize = 20,
        weight = ''
    } = options

    const lines = wrapText(ctx, text, maxWidth, families, startSize, minSize, weight)
    const blockHeight = (lines.length - 1) * lineHeight
    let currentY = y - blockHeight / 2

    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (const line of lines) {
        ctx.fillText(line, x, currentY)
        currentY += lineHeight
    }
}

function wrapText(ctx, text, maxWidth, families, startSize, minSize, weight = '') {
    let size = startSize
    let lines = []

    while (size >= minSize) {
        ctx.font = getFont(size, families.primary, families.fallback, weight)
        lines = []
        const words = text.split(/\s+/)
        let line = ''

        for (const word of words) {
            const testLine = line ? `${line} ${word}` : word
            if (ctx.measureText(testLine).width <= maxWidth) {
                line = testLine
            } else {
                if (line) lines.push(line)
                line = word
            }
        }

        if (line) lines.push(line)
        if (lines.every((entry) => ctx.measureText(entry).width <= maxWidth)) break
