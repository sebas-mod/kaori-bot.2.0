const config = require('../../config')
const { formatUptime, getTimeGreeting } = require('../../src/lib/ourin-formatter')
const { getCommandsByCategory, getCategories } = require('../../src/lib/ourin-plugins')
const { getCasesByCategory, getCaseCount } = require('../../case/ourin')
const { getBanner } = require('../../src/lib/banner-config')
const fs = require('fs')
const path = require('path')
const { generateWAMessageFromContent, proto } = require('ourin')

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

function getContextInfo(botConfig, m, thumbBuffer) {
    const saluranId = botConfig.saluran?.id || ''
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI'
    const saluranLink = botConfig.saluran?.link || ''

    const ctx = {
        mentionedJid: [m.sender],
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }

    if (thumbBuffer) {
        ctx.externalAdReply = {
            title: botConfig.bot?.name || 'Ourin-AI',
            body: `Propietario: ${botConfig.owner?.name || 'Lucky Archz'}`,
            mediaType: 1,
            thumbnail: thumbBuffer,
            mediaUrl: saluranLink,
            sourceUrl: saluranLink,
            renderLargerThumbnail: true
        }
    }

    return ctx
}

function getVerifiedQuoted(botConfig) {
    return {
        key: {
            participant: `0@s.whatsapp.net`,
            remoteJid: `status@broadcast`
        },
        message: {
            contactMessage: {
                displayName: `🪸 ${botConfig.bot?.name}`,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:XL;ttname,;;;\nFN:ttname\nitem1.TEL;waid=13135550002:+1 (313) 555-0002\nitem1.X-ABLabel:Móvil\nEND:VCARD`,
                sendEphemeral: true
            }
        }
    }
}

async function handler(m, { sock, config: botConfig, db, uptime }) {
    const prefix = botConfig.command?.prefix || '.'
    const user = db.getUser(m.sender)
    const groupData = m.isGroup ? (db.getGroup(m.chat) || {}) : {}
    const botMode = groupData.botMode || 'md'
    const bannerCfg = getBanner('allmenu')

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

    let txt = `Hola *@${m.pushName || "Usuario"}* 🪸
Soy ${botConfig.bot?.name || 'Ourin-AI'}, un bot de WhatsApp listo para ayudarte.  

Puedes usarme para buscar información, obtener datos o ayudarte con tareas simples directamente desde WhatsApp, práctico y sin complicaciones.

╭─〔 🤖 INFO DEL BOT 〕
│ Nombre: ${botConfig.bot?.name || 'Ourin-AI'}
│ Versión: v${botConfig.bot?.version || '1.0.0'}
│ Prefijo: ${prefix}
│ Tiempo activo: ${formatUptime(uptime)}
│ Total funciones: ${totalFeatures}
│ Tu rol: ${roleEmoji} ${userRole}
│ Creador: ${bannerCfg.creatorName || botConfig.owner?.name || 'Lucky Archz'}
╰──────────────

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
            txt += `┃ ◦ *${prefix}${toSmallCaps(cmd)}*\n`
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
        const { prepareWAMessageMedia } = require('ourin')

        let headerMedia = null

        if (bannerCfg.banner) {
            headerMedia = await prepareWAMessageMedia({
                image: { url: bannerCfg.banner }
            }, {
                upload: sock.waUploadToServer
            })
        } else if (imageBuffer) {
            headerMedia = await prepareWAMessageMedia({
                image: imageBuffer
            }, {
                upload: sock.waUploadToServer
            })
        }

        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: txt
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: botConfig.bot?.name || 'Ourin-AI'
                        }),
                        header: proto.Message.InteractiveMessage.Header.fromObject({
                            title: `${botConfig.bot?.name || 'Ourin-AI'} ALLMENU`,
                            subtitle: bannerCfg.creatorName || botConfig.owner?.name || 'Lucky Archz',
                            hasMediaAttachment: !!headerMedia,
                            ...(headerMedia || {})
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            buttons: [
                                {
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Volver al menú principal',
                                        id: prefix + 'menu'
                                    })
                                }
                            ]
                        }),
                        contextInfo: getContextInfo(botConfig, m, thumbBuffer || imageBuffer)
                    })
                }
            }
        }, { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) })

        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
    } catch (error) {
        console.error('[AllMenu] Error:', error.message)

        try {
            if (bannerCfg.banner && txt.length < 3500) {
                await sock.sendMessage(m.chat, {
                    image: { url: bannerCfg.banner },
                    caption: txt,
                    contextInfo: getContextInfo(botConfig, m, thumbBuffer || imageBuffer)
                }, { quoted: m })
            } else if (imageBuffer) {
                await sock.sendMessage(m.chat, {
                    image: imageBuffer,
                    caption: txt,
                    contextInfo: getContextInfo(botConfig, m, thumbBuffer || imageBuffer)
                }, { quoted: m })
            } else {
                await m.reply(txt)
            }
        } catch {
            await m.reply(txt)
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
