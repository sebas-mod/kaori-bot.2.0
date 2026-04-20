const fs = require('fs')
const path = require('path')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'ganti-ourin-allmenu.jpg',
    alias: ['gantiallemenu', 'setourinallmenu'],
    category: 'owner',
    description: 'Cambiar la imagen ourin-allmenu.jpg (thumbnail del allmenu)',
    usage: '.ganti-ourin-allmenu.jpg (responder/enviar imagen)',
    example: '.ganti-ourin-allmenu.jpg',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(
            `🖼️ *CAMBIAR OURIN-ALLMENU.JPG*\n\n` +
            `> Envía o responde con una imagen para reemplazarla\n` +
            `> Archivo: assets/images/ourin-allmenu.jpg`
        )
    }
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            return m.reply(`❌ Error al descargar la imagen`)
        }
        
        const targetPath = path.join(process.cwd(), 'assets', 'images', 'ourin-allmenu.jpg')
        
        const dir = path.dirname(targetPath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        
        fs.writeFileSync(targetPath, buffer)
        
        m.reply(
            `✅ *ÉXITO*\n\n` +
            `> La imagen ourin-allmenu.jpg fue reemplazada correctamente`
        )
        
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
