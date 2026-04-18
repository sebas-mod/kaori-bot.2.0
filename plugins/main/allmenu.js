const config = require('../../config') 
const { formatUptime, getTimeGreeting } = require('../../src/lib/ourin-formatter')
const { getCommandsByCategory, getCategories, getPluginCount, getPlugin, getPluginsByCategory } = require('../../src/lib/ourin-plugins')
const { getDatabase } = require('../../src/lib/ourin-database')
const { getCasesByCategory, getCaseCount } = require('../../case/ourin')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const pluginConfig = {
    name: 'allmenu',
    alias: ['fullmenu', 'am', 'allcommand', 'semua'],
    category: 'main',
    description: 'Muestra todos los comandos completos por categoría',
    usage: '.allmenu',
    example: '.allmenu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const CATEGORY_EMOJIS = {
    owner: '👑', main: '🏠', utility: '🔧', fun: '🎮', group: '👥',
    download: '📥', search: '🔍', tools: '🛠️', sticker: '🖼️',
    ai: '🤖', game: '🎯', media: '🎬', info: 'ℹ️', religi: '☪️',
    panel: '🖥️', user: '📊', linode: '☁️', random: '🎲', canvas: '🎨', 
    vps: '🌊', store: '🏪', premium: '💎', convert: '🔄', economy: '💰',
    cek: '📋', ephoto: '🎨', jpm: '📢', pushkontak: '📱'
}

function toSmallCaps(text) {
    const smallCaps = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ',
        'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ',
        'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ',
        'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
    }
    return text.toLowerCase().split('').map(c => smallCaps[c] || c).join('')
}

function getCommandSymbols(cmdName) {
    const plugin = getPlugin(cmdName)
    if (!plugin || !plugin.config) return ''
    
    const symbols = []
    if (plugin.config.isOwner) symbols.push('Ⓞ')
    if (plugin.config.isPremium) symbols.push('ⓟ')
    if (plugin.config.limit && plugin.config.limit > 0) symbols.push('Ⓛ')
    if (plugin.config.isAdmin) symbols.push('Ⓐ')
    
    return symbols.length > 0 ? ' ' + symbols.join(' ') : ''
}

function getContextInfo(botConfig, m, thumbBuffer) {
    const saluranId = botConfig.saluran?.id || '120363208449943317@newsletter'
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI'
    const saluranLink = botConfig.saluran?.link || ''
    
    return {
        mentionedJid: [m.sender],
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        },
    }
}

async function handler(m, { sock, config: botConfig, db, uptime }) {
    const prefix = botConfig.command?.prefix || '.'
    const user = db.getUser(m.sender)
    const groupData = m.isGroup ? (db.getGroup(m.chat) || {}) : {}
    const botMode = groupData.botMode || 'md'
    
    const categories = getCategories()
    const commandsByCategory = getCommandsByCategory()
    const casesByCategory = getCasesByCategory()
    
    let totalCommands = 0
    for (const category of categories) {
        totalCommands += (commandsByCategory[category] || []).length
    }
    const totalCases = getCaseCount()
    const totalFeatures = totalCommands + totalCases
    
    let userRole = 'Usuario', roleEmoji = '👤'
    if (m.isOwner) { userRole = 'Propietario'; roleEmoji = '👑' }
    else if (m.isPremium) { userRole = 'Premium'; roleEmoji = '💎' }
    
    const greeting = getTimeGreeting()

    let txt = `Hola *@${m.pushName || "Usuario"}* 🪸
Soy ${botConfig.bot?.name || 'Ourin-AI'}, un bot de WhatsApp listo para ayudarte.  

Puedes usarme para buscar información, obtener datos o ayudarte con tareas simples directamente desde WhatsApp — práctico y sin complicaciones.

`

    const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'cek', 'economy', 'user', 'canvas', 'random', 'premium']
    const sortedCategories = [...categories].sort((a, b) => {
        const indexA = categoryOrder.indexOf(a)
        const indexB = categoryOrder.indexOf(b)
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
    })
    
    let modeAllowedMap = {
        md: null,
        store: ['main', 'group', 'sticker', 'owner', 'store'],
        pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
    }
    let modeExcludeMap = {
        md: ['panel', 'pushkontak', 'store'],
        store: null,
        pushkontak: null
    }
    
    try {
        const botmodePlugin = require('../group/botmode')
        if (botmodePlugin && botmodePlugin.MODES) {
            const modes = botmodePlugin.MODES
            modeAllowedMap = {}
            modeExcludeMap = {}
            for (const [key, val] of Object.entries(modes)) {
                modeAllowedMap[key] = val.allowedCategories
                modeExcludeMap[key] = val.excludeCategories
            }
        }
    } catch (e) {}
    
    const allowedCategories = modeAllowedMap[botMode]
    const excludeCategories = modeExcludeMap[botMode] || []
    
    for (const category of sortedCategories) {
        if (category === 'owner' && !m.isOwner) continue
        
        if (allowedCategories && !allowedCategories.includes(category.toLowerCase())) continue
        if (excludeCategories && excludeCategories.includes(category.toLowerCase())) continue
        
        const pluginCmds = commandsByCategory[category] || []
        const caseCmds = casesByCategory[category] || []
        const allCmds = [...pluginCmds, ...caseCmds]
        if (allCmds.length === 0) continue
        
        const emoji = CATEGORY_EMOJIS[category] || '📋'
        const categoryName = toSmallCaps(category)
        
        txt += `╭┈┈⬡「 ${emoji} *${categoryName}* 」\n`
        for (const cmd of allCmds) {
            const symbols = getCommandSymbols(cmd)
            txt += `┃ ◦ *${prefix}${toSmallCaps(cmd)}*${symbols}\n`
        }
        txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    }
    
    txt += `_© ${botConfig.bot?.name || 'Ourin-AI'} | ${require('moment-timezone')().tz('Asia/Jakarta').year()}_\n`
    txt += `_ᴅᴇsᴀʀʀᴏʟʟᴀᴅᴏʀ: ${botConfig.bot?.developer || 'Lucky Archz'}_`

    const imagePath = path.join(process.cwd(), 'assets', 'images', 'ourin.jpg')
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin2.jpg')
    
    let imageBuffer = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null
    let thumbBuffer = fs.existsSync(thumbPath) ? fs.readFileSync(thumbPath) : null
    
    try {
        await sock.sendMessage(m.chat, {    
            interactiveMessage: {      
                title: txt,      
                footer: botConfig.bot?.name || 'Ourin-AI',      
                image: thumbBuffer,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 777,
                    isForwarded: true
                },
                externalAdReply: {
                    title: botConfig.bot?.name || 'Ourin-AI',
                    body: `Propietario: ${botConfig.owner?.name || 'Lucky Archz'}`,
                    mediaType: 1,
                    thumbnail: imageBuffer,
                    mediaUrl: " X ",
                    sourceUrl: botConfig.info?.website,
                    renderLargerThumbnail: true       
                },  
                nativeFlowMessage: {        
                    messageParamsJson: JSON.stringify({          
                        limited_time_offer: {            
                            text: "Hola " + m.pushName + "",            
                            url: "https://ourin.site",            
                            copy_code: botConfig.owner?.name || 'Ourin-AI',            
                            expiration_time: Date.now()         
                        },    
                        bottom_sheet: {            
                            in_thread_buttons_limit: 2,            
                            divider_indices: [1, 2, 3, 4, 5, 999],            
                            list_title: "zanxnpc",            
                            button_title: "zanxnpc"          
                        },             
                    }),        
                    buttons: [ 
                        {
                            name: "single_select",            
                            buttonParamsJson: JSON.stringify({              
                                has_multiple_buttons: true            
                            })          
                        },               
                        {
                            name: 'quick_reply',      
                            buttonParamsJson: JSON.stringify({              
                                display_text: 'Volver al menú principal',
                                id: prefix + 'menu'
                            })
                        }    
                    ]      
                }    
            }  
        }, { quoted: m });
    } catch (error) {
        console.error('[AllMenu] Error:', error.message)
        if (imageBuffer) {
            await sock.sendMessage(m.chat, {
                image: imageBuffer,
                caption: txt,
                contextInfo: getContextInfo(botConfig, m)
            }, { quoted: m })
        } else {
            await m.reply(txt)
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
