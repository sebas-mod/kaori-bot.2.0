const fs = require('fs')
const path = require('path')
const { unloadPlugin } = require('../../src/lib/ourin-plugins')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'delplugin',
    alias: ['delpl', 'hapusplugin', 'removeplugin'],
    category: 'owner',
    description: 'Eliminar plugin por nombre',
    usage: '.delplugin <nombre>',
    example: '.delplugin bliblidl',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function findPluginFile(pluginsDir, name) {
    const folders = fs.readdirSync(pluginsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)
    
    for (const folder of folders) {
        const folderPath = path.join(pluginsDir, folder)
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))
        
        for (const file of files) {
            const baseName = file.replace('.js', '')
            if (baseName.toLowerCase() === name.toLowerCase()) {
                return {
                    folder,
                    file,
                    path: path.join(folderPath, file)
                }
            }
        }
    }
    
    return null
}

async function handler(m, { sock }) {
    const name = m.text?.trim()
    
    if (!name) {
        return m.reply(
            `🗑️ *ELIMINAR PLUGIN*\n\n` +
            `> Elimina un plugin por nombre\n\n` +
            `*EJEMPLO:*\n` +
            `> \`${m.prefix}delplugin bliblidl\``
        )
    }
    
    m.react('🕕')
    
    try {
        const pluginsDir = path.join(process.cwd(), 'plugins')
        const found = findPluginFile(pluginsDir, name)
        
        if (!found) {
            m.react('❌')
            return m.reply(`❌ *ERROR*\n\n> Plugin \`${name}\` no encontrado`)
        }
        
        const unloadResult = unloadPlugin(name)
        
        fs.unlinkSync(found.path)
        
        m.react('✅')
        return m.reply(
            `✅ *PLUGIN ELIMINADO*\n\n` +
            `╭┈┈⬡「 📋 *DETALLE* 」\n` +
            `┃ 📝 Archivo: \`${found.file}\`\n` +
            `┃ 📁 Carpeta: \`${found.folder}\`\n` +
            `┃ 🗑️ Unload: ${unloadResult.success ? '✅ Éxito' : '⚠️ Pendiente'}\n` +
            `╰┈┈⬡\n\n` +
            `> ¡El plugin fue eliminado y desactivado!`
        )
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
