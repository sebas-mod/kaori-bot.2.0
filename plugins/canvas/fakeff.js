const axios = require('axios')
const config = require('../../config')
const { uploadToTmpFiles } = require('../../src/lib/ourin-tmpfiles')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'fakeff',
    alias: ['fakefreefire'],
    category: 'canvas',
    description: 'Crear imagen fake de Free Fire',
    usage: '.fakeff <texto>',
    example: '.fakeff Hola hermosa',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const nama = m.text
    if(!nama) {
        return m.reply(`*FAKE FF*\n\n> Ejemplo: ${m.prefix}fakeff nombre1`)
    }
    m.react('🕕')
    
    try {
        await sock.sendMedia(m.chat, `https://api.nexray.web.id/maker/fakelobyff?nickname=${encodeURIComponent(nama)}`, null, m, {
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
