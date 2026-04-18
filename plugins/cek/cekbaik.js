const pluginConfig = {
    name: 'cekbaik',
    alias: ['baik', 'kind'],
    category: 'cek',
    description: 'Mide qué tan buena persona eres',
    usage: '.cekbaik <nombre>',
    example: '.cekbaik Juan',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const percent = Math.floor(Math.random() * 101)
    const mentioned = m.mentionedJid[0] || m.sender
    
    let desc = ''
    if (percent >= 90) {
        desc = '¡Impresionante! eres una de las personas más buenas del mundo 😇✨'
    } else if (percent >= 70) {
        desc = 'De buen corazón y humilde 💝'
    } else if (percent >= 50) {
        desc = 'Bastante buena persona 😊'
    } else if (percent >= 30) {
        desc = 'Un poco buena 🙂'
    } else {
        desc = 'Hmm, necesitas reflexionar 🤔'
    }
    
    let txt = mentioned === m.sender ? `Hola @${mentioned.split('@')[0]}
    
Tu nivel de bondad es *${percent}%*
\`\`\`${desc}\`\`\`` : `¿Quieres comprobar qué tan buena es @${mentioned.split('@')[0]}?
    
Su nivel de bondad es *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
