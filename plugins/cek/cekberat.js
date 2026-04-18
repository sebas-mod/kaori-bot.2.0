const pluginConfig = {
    name: 'cekberat',
    alias: ['berat', 'weight'],
    category: 'cek',
    description: 'Mide el peso corporal aleatorio',
    usage: '.cekberat <nombre>',
    example: '.cekberat Juan',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const berat = Math.floor(Math.random() * 60) + 40
    const mentioned = m.mentionedJid[0] || m.sender
    
    let desc = ''
    if (berat >= 90) {
        desc = '¡Grande! 💪'
    } else if (berat >= 70) {
        desc = 'Con buen cuerpo y saludable 😊'
    } else if (berat >= 55) {
        desc = '¡Peso ideal! 👍'
    } else if (berat >= 45) {
        desc = 'Delgado/a 🌸'
    } else {
        desc = 'Muy delgado/a, ¡come más! 🍔'
    }
    
    let txt = mentioned === m.sender ? `Hola @${mentioned.split('@')[0]}
    
Tu peso es *${berat} kg*
\`\`\`${desc}\`\`\`` : `¿Quieres ver el peso de @${mentioned.split('@')[0]}?
    
Su peso es *${berat} kg*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
