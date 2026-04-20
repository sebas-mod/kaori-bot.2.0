const fs = require('fs')
const path = require('path')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'ganti-ourin-demote.jpg',
    alias: ['gantiourindemote', 'setourindemote'],
    category: 'owner',
    description: 'Cambiar la imagen ourin-demote.jpg',
    usage: '.ganti-ourin-demote.jpg (responder/enviar imagen)',
    example: '.ganti-ourin-demote.jpg',
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
            `🖼️ *CAMBIAR OURIN-DEMOTE.JPG*\n\n` +
            `> Envía o responde con una imagen para reemplazarla\n` +
            `> Archivo: assets/images/ourin-demote.jpg`
        )
    }

    try {
        let buffer = m.quoted && m.quoted.isMedia
            ? await m.quoted.download()
            : await m.download()

        if (!buffer) {
            return m.reply('❌ Error al descargar la imagen')
        }

        const targetPath = path.join(process.cwd(), 'assets', 'images', 'ourin-demote.jpg')

        fs.writeFileSync(targetPath, buffer)

        m.reply(
            `✅ *ÉXITO*\n\n` +
            `> La imagen ourin-demote.jpg fue reemplazada correctamente`
        )
        
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
