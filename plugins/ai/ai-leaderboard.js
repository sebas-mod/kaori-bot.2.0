const axios = require('axios')
const cheerio = require('cheerio')
const config = require('../../config')
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
    name: 'ai-leaderboard',
    alias: ['aileaderboard', 'aiboard', 'ailb', 'lmarena'],
    category: 'ai',
    description: 'Ver el ranking de los mejores modelos de IA de LMArena',
    usage: '.ai-leaderboard [category]',
    example: '.ai-leaderboard text',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function getAILeaderboard() {
    const { data: html } = await axios.get('https://lmarena.ai/id/leaderboard', {
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' 
        }
    })
    
    const $ = cheerio.load(html)
    
    const leaderboards = {}

    $('div.my-7 > div.w-full').each((_, element) => {
        const categoryTitle = $(element).find('h2.font-heading').text().trim()
        if (!categoryTitle) return

        const models = []
        $(element).find('table tbody tr').each((_, row) => {
            const rank = $(row).find('td:nth-of-type(1)').text().trim()
            const modelName = $(row).find('td:nth-of-type(2) a > span').text().trim()
            const scoreText = $(row).find('td:nth-of-type(3) > span').first().text().trim()
            const votesText = $(row).find('td:nth-of-type(4)').text().trim()

            if (rank && modelName && scoreText && votesText) {
                models.push({
                    rank: parseInt(rank, 10),
                    model: modelName,
                    score: parseInt(scoreText.replace(/,/g, ''), 10),
                    votes: parseInt(votesText.replace(/,/g, ''), 10)
                })
            }
        })
        
        if (models.length > 0) {
            leaderboards[categoryTitle] = models
        }
    })

    return leaderboards
}

async function handler(m, { sock }) {
    const category = m.text?.trim()?.toLowerCase()
    
    await m.react('🕕')
    
    try {
        const leaderboards = await getAILeaderboard()
        const categories = Object.keys(leaderboards)
        
        if (categories.length === 0) {
            await m.react('❌')
            return m.reply('❌ Error al obtener los datos del ranking')
        }
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        if (!category) {
            let text = `🤖 *ʀᴀɴᴋɪɴɢ ᴅᴇ ɪᴀ*\n\n`
            text += `> Datos de LMArena.ai\n\n`
            
            for (const cat of categories) {
                const topModels = leaderboards[cat].slice(0, 3)
                const emoji = cat.includes('Text') ? '📝' : 
                              cat.includes('Vision') ? '👁️' : 
                              cat.includes('Image') ? '🖼️' :
                              cat.includes('Video') ? '🎬' :
                              cat.includes('Search') ? '🔍' :
                              cat.includes('Web') ? '🌐' : '🤖'
                
                text += `╭┈┈⬡「 ${emoji} *${cat.toUpperCase()}* 」\n`
                for (const m of topModels) {
                    const medal = m.rank === 1 ? '🥇' : m.rank === 2 ? '🥈' : '🥉'
                    text += `┃ ${medal} ${m.model}\n`
                    text += `┃    Puntuación: ${m.score.toLocaleString()} | Votos: ${m.votes.toLocaleString()}\n`
                }
                text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
            }
            
            text += `> Ver categoría específica:\n`
            text += `> ${m.prefix}ai-leaderboard <category>\n\n`
            text += `> Categorías: ${categories.join(', ')}`
            
            await sock.sendMessage(m.chat, {
                text,
                contextInfo: {
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranId,
                        newsletterName: saluranName,
                        serverMessageId: 127
                    }
                }
            }, { quoted: m })
            
        } else {
            const matchedCat = categories.find(c => c.toLowerCase().includes(category))
            
            if (!matchedCat) {
                await m.react('❌')
                return m.reply(`❌ ¡Categoría no encontrada!\n\n> Categorías disponibles:\n> ${categories.join(', ')}`)
            }
            
            const models = leaderboards[matchedCat].slice(0, 10)
            
            let text = `🤖 *ʀᴀɴᴋɪɴɢ ᴅᴇ ɪᴀ - ${matchedCat.toUpperCase()}*\n\n`
            text += `> Top 10 modelos de IA\n\n`
            
            text += `╭┈┈⬡「 📊 *ʀᴀɴᴋɪɴɢ* 」\n`
            for (const m of models) {
                const medal = m.rank === 1 ? '🥇' : m.rank === 2 ? '🥈' : m.rank === 3 ? '🥉' : `#${m.rank}`
                text += `┃\n`
                text += `┃ ${medal} \`${m.model}\`\n`
                text += `┃ ├ Puntuación: *${m.score.toLocaleString()}*\n`
                text += `┃ └ Votos: *${m.votes.toLocaleString()}*\n`
            }
            text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
            
            await m.reply(text)
        }
        
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
