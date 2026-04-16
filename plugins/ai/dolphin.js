const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'dolphin',
    alias: ['dolphinai', 'dphn'],
    category: 'ai',
    description: 'Chatear con Dolphin AI (modelo 24B)',
    usage: '.dolphin <pregunta> o .dolphin --<template> <pregunta>',
    example: '.dolphin explica qué es la IA',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const TEMPLATES = ['logical', 'creative', 'summarize', 'code-beginner', 'code-advanced']

async function dolphinAI(question, template = 'logical') {
    const { data } = await axios.post('https://chat.dphn.ai/api/chat', {
        messages: [{
            role: 'user',
            content: question
        }],
        model: 'dolphinserver:24B',
        template: template
    }, {
        headers: {
            origin: 'https://chat.dphn.ai',
            referer: 'https://chat.dphn.ai/',
            'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
        }
    })
    
    const result = data.split('\n\n')
        .filter(line => line && line.startsWith('data: {'))
        .map(line => JSON.parse(line.substring(6)))
        .map(line => line.choices[0].delta.content)
        .join('')
    
    if (!result) throw new Error('No hubo respuesta de la IA')
    
    return result
}

async function handler(m, { sock }) {
    let text = m.text?.trim()
    
    if (!text) {
        return m.reply(
            `🐬 *ᴅᴏʟᴘʜɪɴ ᴀɪ*\n\n` +
            `> Chatea con Dolphin AI (modelo 24B)\n\n` +
            `╭┈┈⬡「 📋 *ᴛᴇᴍᴘʟᴀᴛᴇs* 」\n` +
            `┃ • \`logical\` - Respuesta lógica\n` +
            `┃ • \`creative\` - Respuesta creativa\n` +
            `┃ • \`summarize\` - Resumen\n` +
            `┃ • \`code-beginner\` - Código para principiantes\n` +
            `┃ • \`code-advanced\` - Código avanzado\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> *Ejemplos:*\n` +
            `> ${m.prefix}dolphin ¿qué es la IA?\n` +
            `> ${m.prefix}dolphin --creative escribe un poema`
        )
    }
    
    let template = 'logical'
    
    const templateMatch = text.match(/^--(\S+)\s+/)
    if (templateMatch) {
        const requestedTemplate = templateMatch[1].toLowerCase()
        if (TEMPLATES.includes(requestedTemplate)) {
            template = requestedTemplate
            text = text.replace(templateMatch[0], '').trim()
        }
    }
    
    if (!text) {
        return m.reply(`❌ ¡Debes escribir una pregunta!`)
    }
    
    await m.react('🕕')
    
    try {
        const result = await dolphinAI(text, template)
        
        let reply = `🐬 *ᴅᴏʟᴘʜɪɴ ᴀɪ*\n\n`
        reply += `> Plantilla: *${template}*\n\n`
        reply += `${result}`
        
        await m.reply(reply)
        
        await m.react('✅')
        
    } catch (error) {
        await m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
