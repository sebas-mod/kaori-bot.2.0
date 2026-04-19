const pluginConfig = {
    name: 'cekgacha',
    alias: ['gacha', 'suerte'],
    category: 'chequeo',
    description: 'Verifica tu suerte en gacha',
    usage: '.cekgacha <nombre>',
    example: '.cekgacha Budi',
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
    if (percent >= 90) desc = '¡SUERTE EXTREMA! ¡SSR GARANTIZADO! ✨💎'
    else if (percent >= 70) desc = '¡Suerte! Seguro consigues SR o más 🍀'
    else if (percent >= 50) desc = 'Algo de suerte 😊'
    else if (percent >= 30) desc = 'Hmm... reza más 🙏'
    else desc = '¡MALA SUERTE! Mejor intenta después 💔'
    
    let txt = mentioned === m.sender ? `Hola @${mentioned.split('@')[0]}
    
Tu nivel de suerte en gacha es *${percent}%*
\`\`\`${desc}\`\`\`` : `¿Quieres comprobar el nivel de suerte en gacha de @${mentioned.split('@')[0]}?
    
Su nivel es *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = { config: pluginConfig, handler }
