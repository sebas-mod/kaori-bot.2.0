const config = require('../../config')
const { getDatabase } = require('../../src/lib/ourin-database')

const pluginConfig = {
    name: 'botmode',
    alias: ['setmode', 'mode'],
    category: 'owner',
    description: 'Configurar el modo del bot (md/cpanel/store/pushkontak/all)',
    usage: '.botmode <modo> [--autoorder]',
    example: '.botmode store --autoorder',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

const VALID_MODES = ['md', 'cpanel', 'store', 'pushkontak', 'all']

const MODE_DESCRIPTIONS = {
    md: 'Modo por defecto, todas las funciones excepto panel/store/pushkontak',
    cpanel: 'Modo panel, main + group + sticker + owner + tools + panel',
    store: 'Modo tienda, main + group + sticker + owner + store',
    pushkontak: 'Modo push contactos, main + group + sticker + owner + pushkontak',
    all: 'Modo completo, TODAS las funciones de todos los modos accesibles'
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const mode = (args[0] || '').toLowerCase()
    const flags = args.slice(1).map(f => f.toLowerCase())
    const isAutoorder = false
    
    const globalMode = db.setting('botMode') || 'md'
    const groupData = m.isGroup ? (db.getGroup(m.chat) || {}) : {}
    const groupMode = groupData.botMode || null
    
    if (!mode) {
        const autoorderStatus = groupData.storeConfig?.autoorder ? '✅ ON' : '❌ OFF'
        let txt = `╭┈┈⬡「 🤖 *ᴍᴏᴅᴏ ᴅᴇʟ ʙᴏᴛ* 」
┃ ㊗ ɢʟᴏʙᴀʟ: *${globalMode.toUpperCase()}*
${m.isGroup ? `┃ ㊗ ɢʀᴜᴘᴏ: *${(groupMode || 'HEREDADO').toUpperCase()}*\n` : ''}${m.isGroup && (groupMode === 'store' || (!groupMode && globalMode === 'store')) ? `┃ ㊗ ᴀᴜᴛᴏᴏʀᴅᴇʀ: *${autoorderStatus}*\n` : ''}╰┈┈⬡

╭┈┈⬡「 📋 *ᴍᴏᴅᴏs ᴅɪsᴘᴏɴɪʙʟᴇs* 」
`
        const currentMode = m.isGroup ? (groupMode || globalMode) : globalMode
        for (const [key, desc] of Object.entries(MODE_DESCRIPTIONS)) {
            const isActive = key === currentMode ? ' ✅' : ''
            txt += `┃ ㊗ *${key.toUpperCase()}*${isActive}\n`
            txt += `┃   ${desc}\n`
        }
        txt += `╰┈┈⬡

*ꜰʟᴀɢs sᴛᴏʀᴇ:*
> \`${m.prefix}botmode store\` - Pedido manual
> \`${m.prefix}botmode store --autoorder\` - Pago automático

> \`${m.prefix}botmode md\` → Modo por defecto
> \`${m.prefix}botmode all\` → Todas las funciones`
        
        await m.reply(txt)
        return
    }
    
    if (!VALID_MODES.includes(mode)) {
        return m.reply(
            `❌ *ᴍᴏᴅᴏ ɪɴᴠáʟɪᴅᴏ*\n\n` +
            `> Modos disponibles: \`${VALID_MODES.join(', ')}\``
        )
    }
    
    console.log('[Botmode] Debug:', { args: m.args, mode, flags, isAutoorder })
    
    if (m.isGroup) {
        const newGroupData = {
            ...groupData,
            botMode: mode
        }
        
        if (mode === 'store') {
            newGroupData.storeConfig = {
                ...(groupData.storeConfig || {}),
                autoorder: isAutoorder,
                products: groupData.storeConfig?.products || []
            }
        }
        
        db.setGroup(m.chat, newGroupData)
    } else {
        db.setting('botMode', mode)
    }
    
    db.save()
    m.react('✅')
    
    let extraInfo = ''
    if (mode === 'store' && m.isGroup) {
        if (isAutoorder) {
            try {
                const pakasir = require('../../src/lib/ourin-pakasir')
                if (!pakasir.isEnabled()) {
                    extraInfo = `\n\n⚠️ *¡Pakasir no está configurado!*\n> Configura en config.js: pakasir.slug & pakasir.apiKey`
                } else {
                    extraInfo = `\n\n✅ *¡Autoorder activo!*\n> Pago automático vía Pakasir`
                }
            } catch {
                extraInfo = `\n\n⚠️ *Módulo Pakasir no encontrado*`
            }
        } else {
            extraInfo = `\n\n📋 *Modo manual*\n> El admin debe confirmar el pedido manualmente`
        }
    }
    
    await m.reply(
        `✅ *ᴍᴏᴅᴏ ᴄᴀᴍʙɪᴀᴅᴏ*\n\n` +
        `> Modo: *${mode.toUpperCase()}*\n` +
        `> ${MODE_DESCRIPTIONS[mode]}\n` +
        (mode === 'store' && m.isGroup ? `> Autoorder: *${isAutoorder ? 'ON' : 'OFF'}*` : '') +
        extraInfo +
        `\n\n` +
        (m.isGroup ? `> _El modo de este grupo también fue cambiado._` : `> _Modo global cambiado._`)
    )
    
    console.log(`[BotMode] Changed to ${mode.toUpperCase()} by ${m.pushName} (${m.sender})`)
}

module.exports = {
    config: pluginConfig,
    handler,
    VALID_MODES,
    MODE_DESCRIPTIONS
}
