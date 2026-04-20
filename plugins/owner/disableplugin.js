const fs = require('fs')
const path = require('path')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'disableplugin',
    alias: ['dplugin', 'plugindisable', 'offplugin'],
    category: 'owner',
    description: 'Desactivar un plugin específico',
    usage: '.disableplugin <nombre_plugin>',
    example: '.disableplugin sticker',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function findPluginFile(pluginName) {
    const pluginsDir = path.join(process.cwd(), 'plugins')
    const categories = fs.readdirSync(pluginsDir).filter(f => {
        return fs.statSync(path.join(pluginsDir, f)).isDirectory()
    })
    
    for (const category of categories) {
        const categoryPath = path.join(pluginsDir, category)
        const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'))
        
        for (const file of files) {
            try {
                const filePath = path.join(categoryPath, file)
                const plugin = require(filePath)
                
                if (!plugin.config) continue
                
                const name = Array.isArray(plugin.config.name) 
                    ? plugin.config.name[0] 
                    : plugin.config.name
                    
                const aliases = plugin.config.alias || []
                
                if (name === pluginName || aliases.includes(pluginName)) {
                    return { filePath, plugin, category, file }
                }
            } catch {}
        }
    }
    
    return null
}

async function handler(m, { sock }) {
    const args = m.args || []
    const pluginName = args[0]?.toLowerCase()
    
    if (!pluginName) {
        return m.reply(
            `🔌 *DESACTIVAR PLUGIN*\n\n` +
            `> Ingresa el nombre del plugin que quieres desactivar\n\n` +
            `*Ejemplo:*\n` +
            `> \`${m.prefix}disableplugin sticker\`\n` +
            `> \`${m.prefix}disableplugin tiktok\``
        )
    }
    
    const found = findPluginFile(pluginName)
    
    if (!found) {
        return m.reply(`❌ Plugin *${pluginName}* no encontrado!`)
    }
    
    const { filePath, plugin, category, file } = found
    
    if (plugin.config.isEnabled === false) {
        return m.reply(`⚠️ El plugin *${pluginName}* ya está desactivado!`)
    }
    
    try {
        let content = fs.readFileSync(filePath, 'utf-8')
        
        content = content.replace(
            /isEnabled:\s*true/i,
            'isEnabled: false'
        )
        
        fs.writeFileSync(filePath, content)
        
        delete require.cache[require.resolve(filePath)]
        
        await m.reply(
            `✅ *PLUGIN DESACTIVADO*\n\n` +
            `╭┈┈⬡「 📋 *DETALLE* 」\n` +
            `┃ 📦 Plugin: *${plugin.config.name}*\n` +
            `┃ 📁 Categoría: *${category}*\n` +
            `┃ 📄 Archivo: *${file}*\n` +
            `┃ 🔴 Estado: *Desactivado*\n` +
            `╰┈┈⬡\n\n` +
            `> Reinicia el bot o usa hot reload para aplicar los cambios.`
        )
        
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
