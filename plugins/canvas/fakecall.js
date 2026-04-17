const axios = require('axios')
const FormData = require('form-data')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: ['fakecall', 'fakecallwa'],
    alias: [],
    category: 'canvas',
    description: 'Crear imagen de llamada falsa de WhatsApp',
    usage: '.fakecall <nombre> | <duración>',
    example: '.fakecall Zann | 19.00',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function uploadToTmpFiles(buffer) {
    try {
        const form = new FormData()
        form.append('file', buffer, { filename: 'avatar.jpg', contentType: 'image/jpeg' })
        
        const response = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
            headers: form.getHeaders(),
            timeout: 30000
        })
        
        if (response.data?.status === 'success' && response.data?.data?.url) {
            return response.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
        }
        return null
    } catch (e) {
        console.log('Upload error:', e.message)
        return null
    }
}

async function handler(m, { sock }) {
    const text = m.text
    
    if (!text || !text.includes('|')) {
        return m.reply(
            `⚠️ *ᴄᴏᴍᴏ ᴜsᴀʀ*\n\n` +
            `> \`${m.prefix}fakecall <nombre> | <duración>\`\n\n` +
            `> Ejemplo: \`${m.prefix}fakecall Marin | 19.00\`\n\n` +
            `💡 *Tip:* Responde a una imagen para usar un avatar personalizado`
        )
    }
    
    const [nama, durasi] = text.split('|').map(s => s.trim())
    
    if (!nama) {
        return m.reply(`❌ ¡El nombre no puede estar vacío!`)
    }
    
    await m.react('🕕')
    
    try {
        let avatar = 'https://files.catbox.moe/nwvkbt.png'
        
        if (m.isImage) {
            try {
                const buffer = await m.download()
                const uploadedUrl = await uploadToTmpFiles(buffer)
                if (uploadedUrl) {
                    avatar = uploadedUrl
                }
            } catch {}
        } else if (m.quoted?.isImage) {
            try {
                const buffer = await m.quoted.download()
                const uploadedUrl = await uploadToTmpFiles(buffer)
                if (uploadedUrl) {
                    avatar = uploadedUrl
                }
            } catch {}
        } else {
            try {
                avatar = await sock.profilePictureUrl(m.sender, 'image')
            } catch {}
        }
        
        const apiUrl = `https://api.zenzxz.my.id/maker/fakecall?nama=${encodeURIComponent(nama)}&durasi=${encodeURIComponent(durasi)}&avatar=${encodeURIComponent(avatar)}`
        
        await sock.sendMedia(m.chat, apiUrl, null, m, {
            type: 'image'
        })
        
        m.react('📞')
        
    } catch (err) {
        m.react('☢')
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
