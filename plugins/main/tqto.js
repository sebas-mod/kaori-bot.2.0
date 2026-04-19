const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'tqto',
    alias: ['thanksto', 'credits', 'kredit'],
    category: 'main',
    description: 'Mostrar la lista de contribuyentes del bot',
    usage: '.tqto',
    example: '.tqto',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const botName = config.bot?.name || 'Ourin-AI'
    const version = config.bot?.version || '1.0.0'
    const developer = config.bot?.developer || 'Lucky Archz'
    
    const credits = [
        { name: 'hyuuSATAN', role: 'Líder del Staff', icon: '👨‍💻' },
        { name: 'Zann', role: 'Desarrollador', icon: '👨‍💻' },
        { name: 'Senz Offc', role: 'Desarrollador Asistente', icon: '👨‍💻' },
        { name: 'Ell', role: 'Desarrollador Asistente', icon: '👨‍💻' },
        { name: 'Mobbc', role: 'Staff', icon: '👨‍💻' },
        { name: 'Sanxz', role: 'Mano derecha', icon: '👨‍💻' },
        { name: 'Dinz', role: 'Mano derecha', icon: '👨‍💻' },
        { name: 'Forone Store', role: 'Mano derecha', icon: '🛒' },
        { name: 'Rakaa', role: 'Mano derecha', icon: '🛒' },
        { name: 'Sabila', role: 'Mano derecha', icon: '👩‍💻' },
        { name: 'Syura Store', role: 'Mano derecha', icon: '👩‍💻' },
        { name: 'Lyoraaa', role: 'Propietario', icon: '👩‍💻' },
        { name: 'Danzzz', role: 'Propietario', icon: '👨‍💻' },
        { name: 'Muzan', role: 'Propietario', icon: '👨‍💻' },
        { name: 'Gray', role: 'Propietario', icon: '👨‍💻' },
        { name: 'Baim', role: 'Moderador', icon: '👨‍💻' },
        { name: 'Vadel', role: 'Moderador', icon: '👨‍💻' },
        { name: 'Fahmi', role: 'Moderador', icon: '👨‍💻' },
        { name: 'panceo', role: 'Socio', icon: '🛒' },
        { name: 'Dashxz', role: 'Socio', icon: '🛒' },
        { name: 'This JanzZ', role: 'Socio', icon: '🛒' },
        { name: 'Ahmad', role: 'Socio', icon: '🛒' },
        { name: 'nopal', role: 'Socio', icon: '🛒' },
        { name: 'tuadit', role: 'Socio', icon: '🛒' },
        { name: 'andry', role: 'Socio', icon: '🛒' },
        { name: 'kingdanz', role: 'Socio', icon: '🛒' },
        { name: 'patih', role: 'Socio', icon: '🛒' },
        { name: 'Ryuu', role: 'Socio', icon: '🛒' },
        { name: 'Pororo', role: 'Socio', icon: '🛒' },
        { name: 'Janzz', role: 'Socio', icon: '🛒' },
        { name: 'Morvic', role: 'Socio', icon: '🛒' },
        { name: 'zylnzee', role: 'Socio', icon: '🛒' },
        { name: 'Farhan', role: 'Socio', icon: '🛒' },
        { name: 'Alizz', role: 'Socio', icon: '🛒' },
        { name: 'Kiram', role: 'Socio', icon: '🛒' },
        { name: 'Minerva', role: 'Socio', icon: '🛒' },
        { name: 'Riam', role: 'Socio', icon: '🛒' },
        { name: 'Febri', role: 'Socio', icon: '🛒' },
        { name: 'Kuze', role: 'Socio', icon: '🛒' },
        { name: 'Oscar Dani', role: 'Socio', icon: '🛒' },
        { name: 'Udun', role: 'Socio', icon: '🛒' },
        { name: 'Zanspiw', role: 'YouTuber', icon: '🌐' },
        { name: 'Danzz Nano', role: 'YouTuber', icon: '🌐' },
        { name: 'Otros YouTubers que ya hicieron review', role: 'YouTuber', icon: '🌐' },
        { name: 'Todos ustedes', role: 'Mejores', icon: '🌐' },
        { name: 'Comunidad Open Source', role: 'Librerías y Herramientas', icon: '🌐' },

    ]
    
    const specialThanks = [
        'Todos los testers y reportadores de bugs',
        'Usuarios que dan feedback',
        'Comunidad de WhatsApp Bot Indonesia'
    ]
    
    let txt = `✨ *ᴛʜᴀɴᴋs ᴛᴏ*\n\n`
    txt += `> ¡Gracias a todos los que contribuyeron!\n\n`
    
    txt += `╭─「 👥 *ᴄᴏɴᴛʀɪʙᴜᴛᴏʀs* 」\n`
    credits.forEach((c, i) => {
        txt += `┃ ${c.icon} \`${c.name}\`\n`
        txt += `┃    └ *${c.role}*\n`
        if (i < credits.length - 1) txt += `┃\n`
    })
    txt += `╰───────────────\n\n`
    
    txt += `╭─「 💖 *sᴘᴇᴄɪᴀʟ ᴛʜᴀɴᴋs* 」\n`
    specialThanks.forEach((t, i) => {
        txt += `┃ ⭐ ${t}\n`
    })
    txt += `╰───────────────\n\n`
    
    txt += `╭─「 📋 *ɪɴꜰᴏ ʙᴏᴛ* 」\n`
    txt += `┃ 🤖 \`ɴᴀᴍᴀ\`: *${botName}*\n`
    txt += `┃ 📦 \`ᴠᴇʀsɪóɴ\`: *${version}*\n`
    txt += `┃ 👨‍💻 \`ᴅᴇsᴀʀʀᴏʟʟᴀᴅᴏʀ\`: *${developer}*\n`
    txt += `╰───────────────\n\n`
    
    txt += `> Hecho con ❤️ por el equipo`
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || botName
    const saluranLink = config.saluran?.link || ''
    
    let thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin.jpg')
    let thumbBuffer = null
    if (fs.existsSync(thumbPath)) {
        thumbBuffer = fs.readFileSync(thumbPath)
    }
    
    const contextInfo = {
        mentionedJid: [],
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        },
        externalAdReply: {
            title: `✨ Thanks To - ${botName}`,
            body: `v${version} • Créditos y Contribuidores`,
            sourceUrl: saluranLink,
            mediaType: 1,
            showAdAttribution: false,
            renderLargerThumbnail: true
        }
    }
    
    if (thumbBuffer) {
        contextInfo.externalAdReply.thumbnail = thumbBuffer
    }
    
    const fakeQuoted = {
        key: {
            fromMe: false,
            participant: '0@s.whatsapp.net',
            remoteJid: 'status@broadcast'
        },
        message: {
            extendedTextMessage: {
                text: `✨ ${botName} Créditos`,
                contextInfo: {
                    isForwarded: true,
                    forwardingScore: 9999,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranId,
                        newsletterName: saluranName,
                        serverMessageId: 127
                    }
                }
            }
        }
    }
    
    await sock.sendMessage(m.chat, {
        text: txt,
        contextInfo: contextInfo
    }, { quoted: fakeQuoted })
}

module.exports = {
    config: pluginConfig,
    handler
}
