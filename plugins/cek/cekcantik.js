const pluginConfig = {
    name: 'cekcantik',
    alias: ['cantik', 'hermosa'],
    category: 'chequeo',
    description: 'Verifica qué tan hermosa eres',
    usage: '.cekcantik <nombre>',
    example: '.cekcantik Ana',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energia: 0,
    isEnabled: true
}

async function handler(m) {
    const percent = Math.floor(Math.random() * 101)
    const mentioned = m.mentionedJid[0] || m.sender
                    
    let desc = ''
    if (percent >= 90) {
        desc = '¡Hermosísima, como un ángel! 👸✨'
    } else if (percent >= 70) {
        desc = '¡Muy hermosa! 💕'
    } else if (percent >= 50) {
        desc = 'Dulce y hermosa 🌸'
    } else if (percent >= 30) {
        desc = 'Bastante linda 😊'
    } else {
        desc = '¡Igual eres hermosa! 💖'
    }
    
    let txt = mentioned === m.sender 
    ? `Hola @${mentioned.split('@')[0]}
    
Tu nivel de belleza es *${percent}%*
\`\`\`${desc}\`\`\`` 
    : `¿Quieres comprobar el nivel de belleza de @${mentioned.split('@')[0]}?
    
Su nivel es *${percent}%*
\`\`\`${desc}\`\`\``

    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
