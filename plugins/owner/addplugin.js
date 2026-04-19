const fs = require('fs')
const path = require('path')
const { hotReloadPlugin } = require('../../src/lib/ourin-plugins')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'addplugin',
    alias: ['addpl', 'tambahplugin'],
    category: 'owner',
    description: 'Agregar un nuevo plugin desde código respondido',
    usage: '.addplugin [nombrearchivo] [carpeta]',
    example: '.addplugin bliblidl downloader',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function extractPluginInfo(code) {
    const info = { name: null, category: null }
    
    const nameMatch = code.match(/name:\s*['"`]([^'"`]+)['"`]/i)
    if (nameMatch) info.name = nameMatch[1]
    
    const categoryMatch = code.match(/category:\s*['"`]([^'"`]+)['"`]/i)
    if (categoryMatch) info.category = categoryMatch[1]
    
    return info
}

async function handler(m, { sock }) {
    const quoted = m.quoted
    
    if (!quoted) {
        return m.reply(
            `📦 *ADD PLUGIN*\n\n` +
            `> Responde al código del plugin con:\n` +
            `> \`${m.prefix}addplugin\` - Detección automática\n` +
            `> \`${m.prefix}addplugin nombrearchivo\` - Nombre personalizado\n` +
            `> \`${m.prefix}addplugin nombrearchivo carpeta\` - Nombre + carpeta`
        )
    }
    
    let code = quoted.text || quoted.body || ''
    
    if (quoted.mimetype === 'application/javascript' || quoted.filename?.endsWith('.js')) {
        try {
            code = (await quoted.download()).toString()
        } catch (e) {
            return m.reply(`❌ *ERROR*\n\n> No se pudo descargar el archivo`)
        }
    }
    
    if (!code || code.length < 50) {
        return m.reply(`❌ *ERROR*\n\n> El código es demasiado corto o no es válido`)
    }
    
    if (!code.includes('module.exports') && !code.includes('pluginConfig')) {
        return m.reply(`❌ *ERROR*\n\n> El código no tiene formato válido de plugin\n> Debe contener \`module.exports\` y \`pluginConfig\``)
    }
    
    const extracted = extractPluginInfo(code)
    const args = m.args
    
    let fileName = args[0] || extracted.name
    let folderName = args[1] || extracted.category
    
    if (!fileName) {
        return m.reply(`❌ *ERROR*\n\n> No se pudo detectar el nombre del plugin\n> Usa \`${m.prefix}addplugin <nombrearchivo>\``)
    }
    
    if (!folderName) {
        folderName = 'other'
    }
    
    fileName = fileName.toLowerCase().replace(/[^a-z0-9]/g, '')
    folderName = folderName.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    if (!fileName) {
        return m.reply(`❌ *ERROR*\n\n> Nombre de archivo inválido`)
    }
    
    m.react('🕕')
    
    try {
        const pluginsDir = path.join(process.cwd(), 'plugins')
        const folderPath = path.join(pluginsDir, folderName)
        const filePath = path.join(folderPath, `${fileName}.js`)
        
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true })
        }
        
        if (fs.existsSync(filePath)) {
            m.react('❌')
            return m.reply(
                `❌ *ERROR*\n\n` +
                `> El archivo \`${fileName}.js\` ya existe en la carpeta \`${folderName}\`\n\n` +
                `💡 *TIP:* Usa \`${m.prefix}ganticode ${fileName} ${folderName}\` para reemplazar el código existente`
            )
        }
        
        fs.writeFileSync(filePath, code)
        
        const reloadResult = hotReloadPlugin(filePath)
        
        m.react('✅')
        return m.reply(
            `✅ *PLUGIN AGREGADO*\n\n` +
            `╭┈┈⬡「 📋 *DETALLE* 」\n` +
            `┃ 📝 Nombre: \`${fileName}.js\`\n` +
            `┃ 📁 Carpeta: \`${folderName}\`\n` +
            `┃ 📊 Tamaño: \`${code.length} bytes\`\n` +
            `┃ 🔄 Recarga: ${reloadResult.success ? '✅ Éxito' : '⚠️ Pendiente'}\n` +
            `╰┈┈⬡\n\n` +
            `> ¡El plugin ya está activo y listo para usarse!`
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
