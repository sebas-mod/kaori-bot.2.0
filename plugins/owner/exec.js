const { getDatabase } = require('../../src/lib/ourin-database')
const config = require('../../config')
const util = require('util')

const pluginConfig = {
    name: 'exec',
    alias: ['>', 'run', 'execute'],
    category: 'owner',
    description: 'Ejecutar código JS desde un mensaje respondido (Solo Owner)',
    usage: '.> (responder mensaje con código)',
    example: '.> (reply)',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, store }) {
    if (!config.isOwner(m.sender)) {
        return m.reply('❌ *¡Solo para el Owner!*')
    }
    
    let code = null
    
    if (m.quoted) {
        code = m.quoted.text || m.quoted.body || m.quoted.caption
    }
    
    if (!code) {
        code = m.fullArgs?.trim() || m.text?.trim()
    }
    
    if (!code) {
        return m.reply(
            `⚙️ *EXEC*\n\n` +
            `> ¡Responde a un mensaje que contenga código JavaScript!\n\n` +
            `*O también:*\n` +
            `> .> <código>\n\n` +
            `*Ejemplo:*\n` +
            `> Responde al mensaje: \`return m.chat\`\n` +
            `> Luego escribe: .>`
        )
    }
    
    code = code.trim()
    
    if (code.startsWith('```') && code.endsWith('```')) {
        code = code.slice(3, -3)
        if (code.startsWith('javascript') || code.startsWith('js')) {
            code = code.replace(/^(javascript|js)\n?/, '')
        }
    }
    
    const db = getDatabase()
    
    let result
    let isError = false
    
    try {
        result = await eval(`(async () => { ${code} })()`)
    } catch (e) {
        isError = true
        result = e
    }
    
    let output
    if (typeof result === 'undefined') {
        output = 'undefined'
    } else if (result === null) {
        output = 'null'
    } else if (typeof result === 'object') {
        try {
            output = util.inspect(result, { depth: 2, maxArrayLength: 50 })
        } catch {
            output = String(result)
        }
    } else {
        output = String(result)
    }
    
    if (output.length > 3000) {
        output = output.slice(0, 3000) + '\n\n... (recortado)'
    }
    
    const status = isError ? '❌ Error' : '✅ Éxito'
    const type = isError ? result?.name || 'Error' : typeof result
    
    const codePreview = code.length > 100 ? code.slice(0, 100) + '...' : code
    
    await m.reply(
        `⚙️ *RESULTADO EXEC*\n\n` +
        `╭┈┈⬡「 📋 *CÓDIGO* 」\n` +
        `┃ \`${codePreview}\`\n` +
        `├┈┈⬡「 📊 *RESULTADO* 」\n` +
        `┃ ${status}\n` +
        `┃ Tipo: ${type}\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `\`\`\`${output}\`\`\``
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
