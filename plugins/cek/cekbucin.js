const pluginConfig = {
    name: 'cekbucin',
    alias: ['bucin'],
    category: 'chequeo',
    description: 'Verifica qué tan enamorado obsesivo eres',
    usage: '.cekbucin <nombre>',
    example: '.cekbucin Budi',
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
        desc = '¡ENAMORADO OBSESIVO EXTREMO! Ya no tiene salvación 😭💔'
    } else if (percent >= 70) {
        desc = 'Muy enamorado obsesivo 🥺'
    } else if (percent >= 50) {
        desc = 'Bastante enamorado 💕'
    } else if (percent >= 30) {
        desc = 'Un poco enamorado 😊'
    } else {
        desc = 'Tranquilo, no estás obsesionado 😎'
    }
    
    let txt = mentioned === m.sender 
    ? `Hola @${mentioned.split('@')[0]}
    
Tu nivel de obsesión amorosa es *${percent}%*
\`\`\`${desc}\`\`\`` 
    : `¿Quieres comprobar el nivel de obsesión amorosa de @${mentioned.split('@')[0]}?
    
Su nivel es *${percent}%*
\`\`\`${desc}\`\`\``

    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
