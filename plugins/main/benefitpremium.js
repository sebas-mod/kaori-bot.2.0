const { getAllPlugins } = require('../../src/lib/ourin-plugins')
const config = require('../../config')

const pluginConfig = {
    name: 'benefitpremium',
    alias: ['premiumbenefits', 'premiumfitur', 'benefitprem'],
    category: 'main',
    description: 'Ver explicación y lista de funciones especiales Premium',
    usage: '.benefitpremium',
    isOwner: false,
    isGroup: false,
    isEnabled: true
}

async function handler(m, { sock }) {
    const plugins = getAllPlugins()
    const premiumCommands = plugins.filter(p => p.config.isPremium && p.config.isEnabled)
    
    const seen = new Set()
    const commandList = []
    for (const p of premiumCommands) {
        const names = Array.isArray(p.config.name) ? p.config.name : [p.config.name]
        for (const name of names) {
            if (!name || seen.has(name)) continue
            seen.add(name)
            commandList.push(`• *${config.command?.prefix || '.'}${name}*`)
        }
    }
    commandList.sort()
    
    const totalCommands = commandList.length
    const defaultLimit = config.limits?.default || 25
    const premiumLimit = config.limits?.premium || 100
    
    const message = 
        `⭐ *¿QUÉ ES PREMIUM?*\n\n` +
        `Premium es un *usuario de pago* que obtiene acceso a funciones exclusivas y mayores beneficios.\n\n` +
        `╭┈┈⬡「 💎 *VENTAJAS PREMIUM* 」\n` +
        `┃ ✦ \`\`\`Límite diario: ${premiumLimit}x (vs ${defaultLimit}x usuario normal)\`\`\`\n` +
        `┃ ✦ \`\`\`Menor cooldown\`\`\`\n` +
        `┃ ✦ \`\`\`Acceso a funciones exclusivas\`\`\`\n` +
        `┃ ✦ \`\`\`Prioridad en respuestas\`\`\`\n` +
        `┃ ✦ \`\`\`Sin marca de agua en algunas funciones\`\`\`\n` +
        `┃ ✦ \`\`\`Soporte prioritario\`\`\`\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `╭┈┈⬡「 ⚙️ *CÓMO OBTENERLO* 」\n` +
        `┃ \`El premium se obtiene mediante:\`\n` +
        `┃ • Contactar al owner del bot\n` +
        `┃ • \`\`\`${config.command?.prefix || '.'}addprem <número> <duración>\`\`\`\n` +
        `┃ • Ejemplo: .addprem 628xxx 30d\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `╭┈┈⬡「 📋 *LISTA DE COMANDOS PREMIUM* 」\n` +
        `┃ \`Total: ${totalCommands} comandos\`\n` +
        `┃\n` +
        (totalCommands > 0 
            ? commandList.map(cmd => `┃ ${cmd}`).join('\n')
            : `┃ Todos los comandos pueden ser usados por usuarios normales`) +
        `\n╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `¿Quieres mejorar? contacta al owner del bot\n${config.owner.number.map(num => `- wa.me/${num}`).join('\n') }`
    
    await m.reply(message)
}

module.exports = {
    config: pluginConfig,
    handler
}
