const pluginConfig = {
    name: 'cekcupu',
    alias: ['cupu', 'noob'],
    category: 'chequeo',
    description: 'Verifica qué tan noob eres',
    usage: '.cekcupu <nombre>',
    example: '.cekcupu Budi',
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
    if (percent >= 90) desc = '¡SÚPER NOOB! ¡DETECTADO! 🤡'
    else if (percent >= 70) desc = 'Todavía eres principiante 😅'
    else if (percent >= 50) desc = 'Normal 🤔'
    else if (percent >= 30) desc = 'Bastante bueno 💪'
    else desc = '¡PRO PLAYER! ¡GG! 🏆'
    
    let txt = mentioned === m.sender 
    ? `Hola @${mentioned.split('@')[0]}
    
Tu nivel de noob es *${percent}%*
\`\`\`${desc}\`\`\`` 
    : `¿Quieres comprobar el nivel de noob de @${mentioned.split('@')[0]}?
    
Su nivel es *${percent}%*
\`\`\`${desc}\`\`\``

    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = { config: pluginConfig, handler }
