const fs = require('fs')
const path = require('path')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'cambiar-nombrebot',
    alias: ['setnombrebot', 'setnamebot', 'cambiarbot'],
    category: 'owner',
    description: 'Cambiar el nombre del bot en config.js',
    usage: '.cambiar-nombrebot <nuevo nombre>',
    example: '.cambiar-nombrebot Ourin MD',
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
        return m.reply(`🤖 *CAMBIAR NOMBRE DEL BOT*\n\n> Nombre actual: *${config.bot?.name || '-'}*\n\n*Uso:*\n\`${m.prefix}cambiar-nombrebot <nuevo nombre>\``)
    }
    
    try {
        const configPath = path.join(process.cwd(), 'config.js')
        let configContent = fs.readFileSync(configPath, 'utf8')
        
        configContent = configContent.replace(
            /bot:\s*\{[\s\S]*?name:\s*['"]([^'"]*)['"]/,
            (match, oldName) => match.replace(`'${oldName}'`, `'${newName}'`).replace(`"${oldName}"`, `'${newName}'`)
        )
        
        fs.writeFileSync(configPath, configContent)
        
        config.bot.name = newName
        
        m.reply(`✅ *ÉXITO*\n\n> Nombre del bot cambiado a: *${newName}*`)
        
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
