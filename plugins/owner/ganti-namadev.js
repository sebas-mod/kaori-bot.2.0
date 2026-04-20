const fs = require('fs')
const path = require('path')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'ganti-namadev',
    alias: ['setnamadev', 'setnamedev', 'gantideveloper'],
    category: 'owner',
    description: 'Cambiar el nombre del desarrollador en config.js',
    usage: '.ganti-namadev <nombre nuevo>',
    example: '.ganti-namadev Lucky Archz',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, config }) {
    const newName = m.args.join(' ')
    
    if (!newName) {
        return m.reply(
            `👨‍💻 *CAMBIAR NOMBRE DEL DESARROLLADOR*\n\n` +
            `> Nombre actual: *${config.bot?.developer || '-'}*\n\n` +
            `*Uso:*\n` +
            `\`${m.prefix}ganti-namadev <nombre nuevo>\``
        )
    }
    
    try {
        const configPath = path.join(process.cwd(), 'config.js')
        let configContent = fs.readFileSync(configPath, 'utf8')
        
        configContent = configContent.replace(
            /developer:\s*['"]([^'"]*)['"]/,
            `developer: '${newName}'`
        )
        
        fs.writeFileSync(configPath, configContent)
        
        config.bot.developer = newName
        
        m.reply(
            `✅ *ÉXITO*\n\n` +
            `> Nombre del desarrollador cambiado a: *${newName}*`
        )
        
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
