const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'jail',
    alias: ['penjara', 'prison'],
    category: 'canvas',
    description: 'Aplicar efecto de cárcel a una imagen',
    usage: '.jail (responder imagen)',
    example: '.jail',
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
    throw new Error('Error al subir la imagen')
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(
            `🔒 *JAIL EFFECT*\n\n` +
            `╭┈┈⬡「 📋 *CÓMO USAR* 」\n` +
            `┃ ◦ Responde a una imagen con \`${m.prefix}jail\`\n` +
            `┃ ◦ Envía una imagen con caption \`${m.prefix}jail\`\n` +
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
            throw new Error('API Key no encontrada en config')
        }
        
        await sock.sendMedia(m.chat, `https://api.lolhuman.xyz/api/creator1/jail?apikey=${apiKey}&img=${encodeURIComponent(imageUrl)}`, null, m, {
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
