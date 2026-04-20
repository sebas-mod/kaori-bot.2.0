const fs = require('fs')
const path = require('path')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'ganti-namaowner',
    alias: ['setnamaowner', 'setnameowner'],
    category: 'owner',
    description: 'Cambiar el nombre del owner en config.js',
    usage: '.ganti-namaowner <nombre nuevo>',
    example: '.ganti-namaowner Zann',
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
            `👤 *CAMBIAR NOMBRE DEL OWNER*\n\n` +
            `> Nombre actual: *${config.owner?.name || '-'}*\n\n` +
            `*Uso:*\n` +
            `\`${m.prefix}ganti-namaowner <nombre nuevo>\``
        )
    }
    
    try {
        const configPath = path.join(process.cwd(), 'config.js')
        let configContent = fs.readFileSync(configPath, 'utf8')
        
        configContent = configContent.replace(
            /owner:\s*\{[\s\S]*?name:\s*['"]([^'"]*)['"]/,
            (match, oldName) => match
                .replace(`'${oldName}'`, `'${newName}'`)
                .replace(`"${oldName}"`, `'${newName}'`)
        )
        
        fs.writeFileSync(configPath, configContent)
        
        config.owner.name = newName
        
        m.reply(
            `✅ *ÉXITO*\n\n` +
            `> Nombre del owner cambiado a: *${newName}*`
        )
        
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
