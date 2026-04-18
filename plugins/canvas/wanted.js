const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'wanted',
    alias: ['wantedposter'],
    category: 'canvas',
    description: 'Crea un póster de “se busca” a partir de una imagen',
    usage: '.wanted (responder imagen)',
    example: '.wanted',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function uploadToTmpfiles(buffer) {
    const FormData = require('form-data')
    const formData = new FormData()
    formData.append('file', buffer, { filename: 'image.jpg' })
    
    const res = await axios.post('https://tmpfiles.org/api/v1/upload', formData, {
        headers: formData.getHeaders(),
        timeout: 60000
    })
    
    if (res.data?.data?.url) {
        return res.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
    }
    throw new Error('Error al subir el archivo')
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(
            `🤠 *ᴡᴀɴᴛᴇᴅ ᴘósᴛᴇʀ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄóᴍᴏ ᴜsᴀʀ* 」\n` +
            `┃ ◦ Responde a una imagen con \`${m.prefix}wanted\`\n` +
            `┃ ◦ Envía una imagen con el texto \`${m.prefix}wanted\`\n` +
            `╰┈┈⬡`
        )
    }
    
    m.react('🕕')
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer || buffer.length === 0) {
            throw new Error('Error al descargar la imagen')
        }
        
        const imageUrl = await uploadToTmpfiles(buffer)
        const apiKey = config.APIkey?.lolhuman
        
        if (!apiKey) {
            throw new Error('API Key no encontrada en el config')
        }
        
        const apiUrl = `https://api.lolhuman.xyz/api/creator1/wanted?apikey=${apiKey}&img=${encodeURIComponent(imageUrl)}`
        
        await sock.sendMedia(m.chat, apiUrl, null, m, {
            type: 'image',
        })
        
        m.react('✅')
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
