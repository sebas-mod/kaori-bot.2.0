const { createCanvas, loadImage } = require('canvas')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'pacarsertifikat',
    alias: ['certpareja', 'parejacert', 'cerpareja'],
    category: 'canvas',
    description: 'Crear certificado de pareja',
    usage: '.pacarsertifikat <nombre1> <nombre2>',
    example: '.pacarsertifikat Juan María',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const args = m.args || []
    
    if (args.length < 2) {
        return m.reply(
            `💑 *CERTIFICADO DE PAREJA*\n\n` +
            `╭┈┈⬡「 📋 *CÓMO USAR* 」\n` +
            `┃ ◦ \`${m.prefix}pacarsertifikat <nombre1> <nombre2>\`\n` +
            `╰┈┈⬡\n\n` +
            `> Ejemplo: \`${m.prefix}pacarsertifikat Juan María\``
        )
    }
    
    const name1 = args[0]
    const name2 = args.slice(1).join(' ')
    
    m.react('💑')
    
    try {
        // 🎨 Crear canvas
        const canvas = createCanvas(1024, 600)
        const ctx = canvas.getContext('2d')

        // 🔥 Fondo desde tu URL
        const background = await loadImage('https://imagenes-one.vercel.app/certificadofondo.png')
        ctx.drawImage(background, 0, 0, 1024, 600)

        // ✍️ Configuración de texto
        ctx.textAlign = 'center'

        // Título
        ctx.fillStyle = '#8b5c5c'
        ctx.font = 'bold 50px sans-serif'
        ctx.fillText('CERTIFICADO DE AMOR', 512, 100)

        // Texto
        ctx.fillStyle = '#444'
        ctx.font = '24px sans-serif'
        ctx.fillText('Este certificado confirma que', 512, 170)

        // 💑 Nombres
        ctx.fillStyle = '#d16b86'
        ctx.font = 'bold 40px sans-serif'
        ctx.fillText(name1, 512, 260)

        ctx.font = '30px sans-serif'
        ctx.fillText('&', 512, 300)

        ctx.font = 'bold 40px sans-serif'
        ctx.fillText(name2, 512, 340)

        // Mensaje final
        ctx.fillStyle = '#444'
        ctx.font = '24px sans-serif'
        ctx.fillText('Están oficialmente en una relación 💖', 512, 420)

        // 📅 Fecha
        const fecha = new Date().toLocaleDateString('es-AR')
        ctx.font = '20px sans-serif'
        ctx.fillText(`Fecha: ${fecha}`, 512, 470)

        const buffer = canvas.toBuffer('image/png')

        // 📤 Enviar imagen
        await sock.sendMessage(m.chat, {
            image: buffer,
            caption: `💑 *Certificado generado*\n❤️ ${name1} & ${name2}`
        }, { quoted: m })

        m.react('✅')
        
    } catch (error) {
        console.error('CANVAS ERROR:', error)
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
