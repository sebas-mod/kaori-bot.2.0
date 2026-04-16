const axios = require('axios')
const FormData = require('form-data')
const config = require('../../config')
const { downloadMediaMessage } = require('ourin')
const path = require('path')
const fs = require('fs')
const { f } = require('../../src/lib/ourin-http')
const te = require('../../src/lib/ourin-error')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'

const pluginConfig = {
    name: 'faceswap',
    alias: ['fs', 'swapface'],
    category: 'ai',
    description: 'Intercambiar rostros entre 2 imágenes',
    usage: '.faceswap (envía/responde 2 imágenes)',
    example: '.faceswap',
    cooldown: 30,
    energi: 2,
    isEnabled: true
}

const faceswapSessions = new Map()

let thumbAI = null
try {
    const p = path.join(process.cwd(), 'assets/images/ourin-ai.jpg')
    if (fs.existsSync(p)) thumbAI = fs.readFileSync(p)
} catch {}

function getContextInfo(title, body) {
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'

    const ctx = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }

    if (thumbAI) {
        ctx.externalAdReply = {
            title,
            body,
            thumbnail: thumbAI,
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: config.saluran?.link || ''
        }
    }

    return ctx
}

async function uploadToTmpFiles(buffer, filename) {
    const form = new FormData()
    form.append('file', buffer, { filename, contentType: 'application/octet-stream' })
    
    const res = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
        headers: form.getHeaders(),
        timeout: 30000
    })
    
    if (!res.data?.data?.url) throw new Error('Error al subir archivo')
    return res.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
}

async function handler(m, { sock }) {
    const session = faceswapSessions.get(m.sender)
    
    let imageBuffer = null
    
    if (m.quoted?.message) {
        const quotedType = Object.keys(m.quoted.message)[0]
        if (quotedType === 'imageMessage' || m.quoted.message?.imageMessage) {
            try {
                imageBuffer = await downloadMediaMessage(
                    { key: m.quoted.key, message: m.quoted.message },
                    'buffer',
                    {}
                )
            } catch {}
        }
    }
    
    if (!imageBuffer && m.message) {
        const msgType = Object.keys(m.message)[0]
        if (msgType === 'imageMessage' || m.message?.imageMessage) {
            try {
                imageBuffer = await m.download()
            } catch {}
        }
    }
    
    if (!session) {
        if (!imageBuffer) {
            return m.reply(
                `🔄 *ꜰᴀᴄᴇsᴡᴀᴘ*\n\n` +
                `> Intercambiar rostros entre 2 imágenes\n\n` +
                `╭┈┈⬡「 📋 *ᴄᴏᴍᴏ ᴜsᴀʀ* 」\n` +
                `┃ 1. Envía la primera imagen (rostro fuente)\n` +
                `┃ 2. Envía la segunda imagen (objetivo)\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `> Envía la primera imagen con el comando \`${m.prefix}faceswap\``
            )
        }
        
        await m.react('1️⃣')
        
        const sourceUrl = await uploadToTmpFiles(imageBuffer, 'source.jpg')
        
        faceswapSessions.set(m.sender, {
            sourceUrl,
            timestamp: Date.now()
        })
        
        setTimeout(() => {
            faceswapSessions.delete(m.sender)
        }, 300000)
        
        return m.reply(
            `✅ *ɪᴍᴀɢᴇɴ 1 ɢᴜᴀʀᴅᴀᴅᴀ*\n\n` +
            `> Ahora envía la segunda imagen (objetivo)\n` +
            `> con el comando \`${m.prefix}faceswap\`\n\n` +
            `> ⏱️ La sesión dura 5 minutos`
        )
    }
    
    if (!imageBuffer) {
        return m.reply(
            `⚠️ *ɪᴍᴀɢᴇɴ ʀᴇǫᴜᴇʀɪᴅᴀ*\n\n` +
            `> Envía la segunda imagen (objetivo) + comando \`${m.prefix}faceswap\``
        )
    }
    
    await m.react('2️⃣')
    
    try {
        const targetUrl = await uploadToTmpFiles(imageBuffer, 'target.jpg')
        
        await m.reply('🔄 *ᴘʀᴏᴄᴇsᴀɴᴅᴏ...*\n\n> Intercambiando rostros, espera un momento...')
        
        const apiUrl = `https://api.neoxr.eu/api/faceswap?source=${encodeURIComponent(session.sourceUrl)}&target=${encodeURIComponent(targetUrl)}&apikey=${NEOXR_APIKEY}`
        
        const data = await f(apiUrl)
        
        faceswapSessions.delete(m.sender)
        
        if (!data?.status || !data?.data?.url) {
            m.react('❌')
            return m.reply('❌ *ERROR*\n\n> La API no respondió o falló')
        }
        
        await sock.sendMedia(m.chat, data.data.url, null, m, {
            type: 'image'
        })
        
        m.react('✅')
        
    } catch (error) {
        faceswapSessions.delete(m.sender)
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
