const config = require('../../config');
const { formatUptime, getTimeGreeting } = require('../../src/lib/ourin-formatter');
const { getCommandsByCategory, getCategories } = require('../../src/lib/ourin-plugins');
const { getDatabase } = require('../../src/lib/ourin-database');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { generateWAMessageFromContent, proto } = require('ourin');
const { default: axios } = require('axios');

const pluginConfig = {
    name: 'menu',
    alias: ['help', 'bantuan', 'commands', 'm'],
    category: 'main',
    description: 'Menampilkan menu utama bot',
    usage: '.menu',
    example: '.menu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

const CATEGORY_EMOJIS = {
    owner: '👑', main: '🏠', utility: '🔧', fun: '🎮', group: '👥',
    download: '📥', search: '🔍', tools: '🛠️', sticker: '🖼️',
    ai: '🤖', game: '🎯', media: '🎬', info: 'ℹ️', religi: '☪️',
    panel: '🖥️', user: '📊', linode: '☁️', random: '🎲', canvas: '🎨', vps: '🌊'
};

function toSmallCaps(text) {
    const smallCaps = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ',
        'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ',
        'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ',
        'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
    };
    return text.toLowerCase().split('').map(c => smallCaps[c] || c).join('');
}

function formatTime(date) {
    const timeHelper = require('../../src/lib/ourin-time');
    return timeHelper.formatTime('HH:mm');
}

function formatDateShort(date) {
    const timeHelper = require('../../src/lib/ourin-time');
    return timeHelper.formatFull('dddd, DD MMMM YYYY');
}

function buildMenuText(m, botConfig, db, uptime, botMode = 'md') {
    const prefix = botConfig.command?.prefix || '.';
    const user = db.getUser(m.sender);
    const timeHelper = require('../../src/lib/ourin-time');
    const timeStr = timeHelper.formatTime('HH:mm');
    const dateStr = timeHelper.formatFull('dddd, DD MMMM YYYY');
    
    const categories = getCategories();
    const commandsByCategory = getCommandsByCategory();
    
    let totalCommands = 0;
    for (const category of categories) {
        totalCommands += (commandsByCategory[category] || []).length;
    }
    
    const { getCaseCount, getCasesByCategory } = require('../../case/ourin');
    const totalCases = getCaseCount();
    const casesByCategory = getCasesByCategory();
    
    const totalFeatures = totalCommands + totalCases;
    
    let userRole = 'User', roleEmoji = '👤';
    if (m.isOwner) { userRole = 'Owner'; roleEmoji = '👑'; }
    else if (m.isPremium) { userRole = 'Premium'; roleEmoji = '💎'; }
    
    const greeting = getTimeGreeting();
    const uptimeFormatted = formatUptime(uptime);
    const totalUsers = db.getUserCount();
    const greetEmoji = greeting.includes('pagi') ? '🌅' : greeting.includes('siang') ? '☀️' : greeting.includes('sore') ? '🌇' : '🌙';
    
    let txt = `Hai *@${m.pushName || "User"}* 🪸

Aku ${botConfig.bot?.name || 'Ourin-AI'}, bot WhatsApp yang siap bantu kamu.  

Kamu bisa pakai aku buat cari info, ambil data, atau bantu hal-hal sederhana langsung lewat WhatsApp — praktis tanpa ribet.`

   txt += `\n\n╭─〔 🤖 *ʙᴏᴛ ɪɴꜰᴏ* 〕\n`;
txt += `*│* 🖐 ɴᴀᴍᴀ     : *${botConfig.bot?.name || 'Ourin-AI'}*\n`;
txt += `*│* 🔑 ᴠᴇʀsɪ    : *v${botConfig.bot?.version || '1.2.0'}*\n`;
txt += `*│* ⚙️ ᴍᴏᴅᴇ     : *${(botConfig.mode || 'public').toUpperCase()}*\n`;
txt += `*│* 🧶 ᴘʀᴇꜰɪx    : *[ ${prefix} ]*\n`;
txt += `*│* ⏱ ᴜᴘᴛɪᴍᴇ   : *${uptimeFormatted}*\n`;
txt += `*│* 👥 ᴛᴏᴛᴀʟ    : *${totalUsers} Users*\n`;
txt += `*│* 🏷 ɢʀᴏᴜᴘ     : *${botMode.toUpperCase()}*\n`;
txt += `*│* 👑 ᴏᴡɴᴇʀ    : *${botConfig.owner?.name || 'Ourin-AI'}*\n`;
txt += `╰────────────────⬣\n\n`;

txt += `╭─〔 👤 *ᴜsᴇʀ ɪɴꜰᴏ* 〕\n`;
txt += `*│* 🙋 ɴᴀᴍᴀ     : *${m.pushName}*\n`;
txt += `*│* 🎭 ʀᴏʟᴇ     : *${roleEmoji} ${userRole}*\n`;
txt += `*│* 🎟 ʟɪᴍɪᴛ    : *${m.isOwner || m.isPremium ? '∞ Unlimited' : (user?.limit ?? 25)}*\n`;
txt += `*│* 🕒 ᴡᴀᴋᴛᴜ    : *${timeStr} WIB*\n`;
txt += `*│* 📅 ᴛᴀɴɢɢᴀʟ  : *${dateStr}*\n`;
txt += `╰────────────────⬣\n\n`;
    
    const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'cek', 'economy', 'user', 'canvas', 'random', 'premium', 'ephoto', 'jpm', 'pushkontak', 'panel', 'store'];
    const sortedCategories = [...categories].sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
    
    let modeAllowedMap = {
        md: null,
        store: ['main', 'group', 'sticker', 'owner', 'store'],
        pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
    };
    let modeExcludeMap = {
        md: ['panel', 'pushkontak', 'store'],
        store: null,
        pushkontak: null
    };
    
    try {
        const botmodePlugin = require('../group/botmode');
        if (botmodePlugin && botmodePlugin.MODES) {
            const modes = botmodePlugin.MODES;
            modeAllowedMap = {};
            modeExcludeMap = {};
            for (const [key, val] of Object.entries(modes)) {
                modeAllowedMap[key] = val.allowedCategories;
                modeExcludeMap[key] = val.excludeCategories;
            }
        }
    } catch (e) {}
    
    const allowedCategories = modeAllowedMap[botMode];
    const excludeCategories = modeExcludeMap[botMode] || [];
    
    txt += `📂 *ᴅᴀꜰᴛᴀʀ ᴍᴇɴᴜ*\n`
    
    for (const category of sortedCategories) {
        if (category === 'owner' && !m.isOwner) continue;
        
        if (allowedCategories && !allowedCategories.includes(category.toLowerCase())) continue;
        if (excludeCategories && excludeCategories.includes(category.toLowerCase())) continue;
        
        const pluginCmds = commandsByCategory[category] || [];
        const caseCmds = casesByCategory[category] || [];
        const totalCmds = pluginCmds.length + caseCmds.length;
        if (totalCmds === 0) continue;
        
        const emoji = CATEGORY_EMOJIS[category] || '📁';
        const categoryName = toSmallCaps(category);
        
        txt += `- \`◦\` ${prefix}${toSmallCaps(`menucat ${category}`)} ${emoji}\n`;
    }
    return txt;
}

function getContextInfo(botConfig, m, thumbBuffer, renderLargerThumbnail = false) {
    const saluranId = botConfig.saluran?.id || '';
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI';
    const saluranLink = botConfig.saluran?.link || '';
    
    const ctx = {
        mentionedJid: [m.sender],
        forwardingScore: 9,
        isForwarded: true,
        externalAdReply: {
            title: botConfig.bot?.name || 'Ourin-AI',
            body: `BOT WHATSAPP MULTI DEVICE`,
            sourceUrl: saluranLink,
            mediaType: 1,
            showAdAttribution: false,
            renderLargerThumbnail
        }
    };
    
    if (thumbBuffer) ctx.externalAdReply.thumbnail = thumbBuffer;
    return ctx;
}

function getVerifiedQuoted(botConfig) {  
    return {
                key: {
                    participant: `0@s.whatsapp.net`,
                    remoteJid: `status@broadcast`
                    },
                message: {
                    'contactMessage': {
                    'displayName': `🪸 ${botConfig.bot?.name}`,
                    'vcard': `BEGIN:VCARD\nVERSION:3.0\nN:XL;ttname,;;;\nFN:ttname\nitem1.TEL;waid=13135550002:+1 (313) 555-0002\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
                sendEphemeral: true
            }}}  
}

async function handler(m, { sock, config: botConfig, db, uptime }) {
    const savedVariant = db.setting('menuVariant');
    const menuVariant = savedVariant || botConfig.ui?.menuVariant || 2;
    const groupData = m.isGroup ? (db.getGroup(m.chat) || {}) : {};
    const botMode = groupData.botMode || 'md';
    const text = buildMenuText(m, botConfig, db, uptime, botMode);
    
    const imagePath = path.join(process.cwd(), 'assets', 'images', 'ourin.jpg');
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin2.jpg');
    const videoPath = path.join(process.cwd(), 'assets', 'video', 'ourin.mp4');
    
    let imageBuffer = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null;
    let thumbBuffer = fs.existsSync(thumbPath) ? fs.readFileSync(thumbPath) : null;
    let videoBuffer = fs.existsSync(videoPath) ? fs.readFileSync(videoPath) : null;
    
    try {
        switch (menuVariant) {
            case 1:
                if (imageBuffer) {
                    await sock.sendMessage(m.chat, { image: imageBuffer, caption: text });
                } else {
                    await m.reply(text);
                }
                break;
                
            case 2:
                const msgV2 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                if (imageBuffer) {
                    msgV2.image = imageBuffer;
                    msgV2.caption = text;
                } else {
                    msgV2.text = text;
                }
                await sock.sendMessage(m.chat, msgV2, { quoted: getVerifiedQuoted(botConfig) });
                break;
                
            case 3:
                let resizedThumb = thumbBuffer;
                if (thumbBuffer) {
                    try {
                        resizedThumb = await sharp(thumbBuffer)
                            .resize(300, 300, { fit: 'cover' })
                            .jpeg({ quality: 80 })
                            .toBuffer();
                    } catch (e) {
                        resizedThumb = thumbBuffer;
                    }
                }
                
                let contextThumb = thumbBuffer;
                try {
                    const ourinPath = path.join(process.cwd(), 'assets', 'images', 'ourin.jpg');
                    if (fs.existsSync(ourinPath)) {
                        contextThumb = fs.readFileSync(ourinPath);
                    }
                } catch (e) {}
                
                await sock.sendMessage(m.chat, {
                    document: imageBuffer || Buffer.from(''),
                    mimetype: 'image/png',
                    fileLength: 999999999999,
                    fileSize: 999999999999,
                    fileName: `ɴᴏ ᴘᴀɪɴ ɴᴏ ɢᴀɪɴ`,
                    caption: text,
                    jpegThumbnail: resizedThumb,
                    contextInfo: getContextInfo(botConfig, m, contextThumb, true)
                }, { quoted: getVerifiedQuoted(botConfig) });
                break;
                
            case 4:
                if (videoBuffer) {
                    await sock.sendMessage(m.chat, {
                        video: videoBuffer,
                        caption: text,
                        gifPlayback: true,
                        contextInfo: getContextInfo(botConfig, m, thumbBuffer)
                    }, { quoted: getVerifiedQuoted(botConfig) });
                } else {
                    const fallback = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallback.image = imageBuffer; fallback.caption = text; }
                    else { fallback.text = text; }
                    await sock.sendMessage(m.chat, fallback, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 5:
                const prefix = botConfig.command?.prefix || '.';
                const saluranId = botConfig.saluran?.id || '';
                const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI';
                
                const categories = getCategories();
                const commandsByCategory = getCommandsByCategory();
                const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'jpm', 'pushkontak', 'panel', 'user'];
                
                const sortedCats = [...categories].sort((a, b) => {
                    const indexA = categoryOrder.indexOf(a);
                    const indexB = categoryOrder.indexOf(b);
                    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                });
                
                const toMonoUpperBold = (text) => {
                    const chars = {
                        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚',
                        'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡',
                        'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨',
                        'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭'
                    };
                    return text.toUpperCase().split('').map(c => chars[c] || c).join('');
                };
                
                const categoryRows = [];
                
                const modeAllowedMap = {
                    md: null,
                    cpanel: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
                    store: ['main', 'group', 'sticker', 'owner', 'store'],
                    pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
                };
                const modeExcludeMap = {
                    md: ['panel', 'pushkontak', 'store'],
                    cpanel: null,
                    store: null,
                    pushkontak: null
                };
                
                const allowedCats = modeAllowedMap[botMode];
                const excludeCats = modeExcludeMap[botMode] || [];
                
                for (const cat of sortedCats) {
                    if (cat === 'owner' && !m.isOwner) continue;
                    if (allowedCats && !allowedCats.includes(cat.toLowerCase())) continue;
                    if (excludeCats && excludeCats.includes(cat.toLowerCase())) continue;
                    
                    const cmds = commandsByCategory[cat] || [];
                    if (cmds.length === 0) continue;
                    
                    const emoji = CATEGORY_EMOJIS[cat] || '📁';
                    const title = `${emoji} ${toMonoUpperBold(cat)}`;
                    
                    categoryRows.push({
                        title: title,
                        id: `${prefix}menucat ${cat}`,
                        description: `${cmds.length} commands`
                    });
                }
                
                let totalCmds = 0;
                for (const cat of categories) {
                    totalCmds += (commandsByCategory[cat] || []).length;
                }
                
                const now = new Date();
                const greeting = getTimeGreeting();
                const greetEmoji = greeting.includes('pagi') ? '🌅' : greeting.includes('siang') ? '☀️' : greeting.includes('sore') ? '🌇' : '🌙';
                const uptimeFormatted = formatUptime(uptime);
                
                let headerText = `*@${m.pushName || "User"}* 🪸

Aku ${botConfig.bot?.name || 'Ourin-AI'}, bot WhatsApp yang siap bantu kamu.  

Kamu bisa pakai aku buat cari info, ambil data, atau bantu hal-hal sederhana langsung lewat WhatsApp — praktis tanpa ribet.\n\n`;
                headerText += `╭┈┈⬡「 🤖 *ʙᴏᴛ ɪɴꜰᴏ* 」\n`;
                headerText += `┃ \`◦\` ɴᴀᴍᴀ: *${botConfig.bot?.name || 'Ourin-AI'}*\n`;
                headerText += `┃ \`◦\` ᴠᴇʀsɪ: *v${botConfig.bot?.version || '1.2.0'}*\n`;
                headerText += `┃ \`◦\` ᴍᴏᴅᴇ: *${(botConfig.mode || 'public').toUpperCase()}*\n`;
                headerText += `┃ \`◦\` ᴜᴘᴛɪᴍᴇ: *${uptimeFormatted}*\n`;
                headerText += `┃ \`◦\` ᴛᴏᴛᴀʟ ᴄᴍᴅ: *${totalCmds}*\n`;
                headerText += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
                headerText += `📋 *Pilih kategori di bawah untuk melihat daftar command*`;
                
                try {
                    const { generateWAMessageFromContent, proto } = require('ourin');
                    
                    const buttons = [
                        {
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({
                                title: '📁 ᴘɪʟɪʜ ᴍᴇɴᴜ',
                                sections: [{
                                    title: '📋 PILIH CATEGORY',
                                    rows: categoryRows
                                }]
                            })
                        },
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📊 TOTAL SEMUA FITUR',
                                id: `${prefix}totalfitur`
                            })
                        },
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📊 SEMUA MENU',
                                id: `${prefix}allmenu`
                            })
                        }
                    ];
                    
                    let headerMedia = null;
                    if (imageBuffer) {
                        try {
                            const { prepareWAMessageMedia } = require('ourin');
                            headerMedia = await prepareWAMessageMedia({
                                image: imageBuffer
                            }, {
                                upload: sock.waUploadToServer
                            });
                        } catch (e) {}
                    }
                    
                    const msg = generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                    body: proto.Message.InteractiveMessage.Body.fromObject({
                                        text: headerText
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                        text: `© ${botConfig.bot?.name || 'Ourin-AI'} | ${sortedCats.length} Categories`
                                    }),
                                    header: proto.Message.InteractiveMessage.Header.fromObject({
                                        title: `${botConfig.bot?.name || 'Ourin-AI'}`,
                                        hasMediaAttachment: !!headerMedia,
                                        ...(headerMedia || {})
                                    }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                        buttons: buttons
                                    }),
                                    contextInfo: {
                                        mentionedJid: [m.sender],
                                        forwardingScore: 9999,
                                        isForwarded: true,
                                        forwardedNewsletterMessageInfo: {
                                            newsletterJid: saluranId,
                                            newsletterName: saluranName,
                                            serverMessageId: 127
                                        }
                                    }
                                })
                            }
                        }
                    }, { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) });
                    
                    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
                    
                } catch (btnError) {
                    console.error('[Menu V5] Button error:', btnError.message);
                    
                    let catListText = `📋 *ᴋᴀᴛᴇɢᴏʀɪ ᴍᴇɴᴜ*\n\n`;
                    for (const cat of sortedCats) {
                        if (cat === 'owner' && !m.isOwner) continue;
                        const cmds = commandsByCategory[cat] || [];
                        if (cmds.length === 0) continue;
                        const emoji = CATEGORY_EMOJIS[cat] || '📁';
                        catListText += `> ${emoji} \`${prefix}menucat ${cat}\` - ${toMonoUpperBold(cat)} (${cmds.length})\n`;
                    }
                    catListText += `\n_Ketik perintah kategori untuk melihat command_`;
                    
                    const fallbackMsg = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackMsg.image = imageBuffer; fallbackMsg.caption = headerText + '\n\n' + catListText; }
                    else { fallbackMsg.text = headerText + '\n\n' + catListText; }
                    await sock.sendMessage(m.chat, fallbackMsg, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 6:
                const thumbPathV6 = path.join(process.cwd(), 'assets', 'images', 'ourin3.jpg');
                const saluranIdV6 = botConfig.saluran?.id || '';
                const saluranNameV6 = botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI';
                const saluranLinkV6 = botConfig.saluran?.link || 'https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t';
                
                let bannerThumbV6 = null;
                
                try {
                    const sourceBuffer = fs.existsSync(thumbPathV6) 
                        ? fs.readFileSync(thumbPathV6) 
                        : (thumbBuffer || imageBuffer);
                    
                    if (sourceBuffer) {
                        bannerThumbV6 = await sharp(sourceBuffer)
                            .resize(200, 200, { fit: 'inside' })
                            .jpeg({ quality: 90 })
                            .toBuffer();
                    }
                } catch (resizeErr) {
                    console.error('[Menu V6] Resize error:', resizeErr.message);
                    bannerThumbV6 = thumbBuffer;
                }
                
                const contextInfoV6 = {
                    mentionedJid: [m.sender],
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranIdV6,
                        newsletterName: saluranNameV6,
                        serverMessageId: 127
                    },
                    externalAdReply: {
                        title: botConfig.bot?.name || 'Ourin-AI',
                        body: `v${botConfig.bot?.version || '1.0.1'} • Fast Response Bot`,
                        sourceUrl: saluranLinkV6,
                        mediaType: 1,
                        showAdAttribution: false,
                        renderLargerThumbnail: true,
                        thumbnail: thumbBuffer || imageBuffer
                    }
                };
                
                try {
                    await sock.sendMessage(m.chat, {
                        document: imageBuffer || Buffer.from('Ourin-AI Menu'),
                        mimetype: 'application/pdf',
                        fileName: `ɴᴏ ᴘᴀɪɴ ɴᴏ ɢᴀɪɴ`,
                        fileLength: 9999999999,
                        caption: text,
                        jpegThumbnail: bannerThumbV6,
                        contextInfo: contextInfoV6
                    }, { quoted: getVerifiedQuoted(botConfig) });
                    
                } catch (v6Error) {
                    console.error('[Menu V6] Error:', v6Error.message);
                    const fallbackV6 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV6.image = imageBuffer; fallbackV6.caption = text; }
                    else { fallbackV6.text = text; }
                    await sock.sendMessage(m.chat, fallbackV6, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 7:
                try {
                    const { prepareWAMessageMedia } = require('ourin');
                    const prefixV7 = botConfig.command?.prefix || '.';
                    const categoriesV7 = getCategories();
                    const commandsByCategoryV7 = getCommandsByCategory();
                    const categoryOrderV7 = ['main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info'];
                    
                    const modeAllowedMapV7 = {
                        md: null,
                        cpanel: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
                        store: ['main', 'group', 'sticker', 'owner', 'store'],
                        pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
                    };
                    const modeExcludeMapV7 = {
                        md: ['panel', 'pushkontak', 'store'],
                        cpanel: null, store: null, pushkontak: null
                    };
                    
                    const allowedCatsV7 = modeAllowedMapV7[botMode];
                    const excludeCatsV7 = modeExcludeMapV7[botMode] || [];
                    
                    const sortedCatsV7 = categoriesV7.sort((a, b) => {
                        const indexA = categoryOrderV7.indexOf(a);
                        const indexB = categoryOrderV7.indexOf(b);
                        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                    });
                    
                    const carouselCards = [];
                    
                    for (const cat of sortedCatsV7) {
                        if (cat === 'owner' && !m.isOwner) continue;
                        if (allowedCatsV7 && !allowedCatsV7.includes(cat.toLowerCase())) continue;
                        if (excludeCatsV7 && excludeCatsV7.includes(cat.toLowerCase())) continue;
                        
                        const cmds = commandsByCategoryV7[cat] || [];
                        if (cmds.length === 0) continue;
                        
                        const emoji = CATEGORY_EMOJIS[cat] || '📁';
                        const categoryName = toSmallCaps(cat);
                        
                        let cardBody = `━━━━━━━━━━━━━━━\n`;
                        
                        for (const cmd of cmds.slice(0, 15)) {
                            cardBody += `◦ \`${prefixV7}${toSmallCaps(cmd)}\`\n`;
                        }
                        if (cmds.length > 15) {
                            cardBody += `\n_...dan ${cmds.length - 15} command lainnya_`;
                        }
                        
                        cardBody += `\n\n> Total: ${cmds.length} commands`;
                        
                        let cardMedia = null;
                        try {
                            const catThumbPath = path.join(process.cwd(), 'assets', 'images', `cat-${cat}.jpg`);
                            const defaultV7Path = path.join(process.cwd(), 'assets', 'images', 'ourin-v7.jpg');
                            let sourceImage = fs.existsSync(defaultV7Path) ? fs.readFileSync(defaultV7Path) : thumbBuffer;
                            
                            if (fs.existsSync(catThumbPath)) {
                                sourceImage = fs.readFileSync(catThumbPath);
                            }
                            
                            if (sourceImage) {
                                const resizedImage = await sharp(sourceImage)
                                    .resize(300, 300, { fit: 'cover' })
                                    .jpeg({ quality: 80 })
                                    .toBuffer();
                                
                                cardMedia = await prepareWAMessageMedia({
                                    image: resizedImage
                                }, {
                                    upload: sock.waUploadToServer
                                });
                            }
                        } catch (e) {
                            console.error('[Menu V7] Card media error:', e.message);
                        }
                        
                        const cardMessage = {
                            header: proto.Message.InteractiveMessage.Header.fromObject({
                                title: `${emoji} ${categoryName.toUpperCase()}`,
                                hasMediaAttachment: !!cardMedia,
                                ...(cardMedia || {})
                            }),
                            body: proto.Message.InteractiveMessage.Body.fromObject({
                                text: cardBody
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.create({
                                text: `${botConfig.bot?.name || 'Ourin'} • ${cat}`
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                buttons: [{
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: `📋 Lihat ${categoryName}`,
                                        id: `${prefixV7}menucat ${cat}`
                                    })
                                }]
                            })
                        };
                        
                        carouselCards.push(cardMessage);
                    }
                    
                    if (carouselCards.length === 0) {
                        await m.reply(text);
                        break;
                    }
                    
                    const msg = await generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                    body: proto.Message.InteractiveMessage.Body.fromObject({
                                        text: `${getTimeGreeting()} *${m.pushName}!*\n\n> Geser untuk melihat kategori menu\n> Ketuk tombol untuk melihat detail`
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                        text: `${botConfig.bot?.name || 'Ourin'} v${botConfig.bot?.version || '1.0'}`
                                    }),
                                    carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                                        cards: carouselCards
                                    })
                                })
                            }
                        }
                    }, {
                        userJid: m.sender,
                        quoted: getVerifiedQuoted(botConfig)
                    });
                    
                    await sock.relayMessage(m.chat, msg.message, {
                        messageId: msg.key.id
                    });
                    
                } catch (carouselError) {
                    console.error('[Menu V7] Carousel error:', carouselError.message);
                    const fallbackV7 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV7.image = imageBuffer; fallbackV7.caption = text; }
                    else { fallbackV7.text = text; }
                    await sock.sendMessage(m.chat, fallbackV7, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 8:
                const timeHelperV8 = require('../../src/lib/ourin-time');
                const timeV8 = timeHelperV8.formatTime('HH:mm');
                const dateV8 = timeHelperV8.formatFull('DD/MM/YYYY');
                const userV8 = db.getUser(m.sender);
                const greetingV8 = getTimeGreeting();
                const uptimeV8 = formatUptime(uptime);
                
                const categoriesV8 = getCategories();
                const cmdsByCatV8 = getCommandsByCategory();
                let totalCmdV8 = 0;
                for (const cat of categoriesV8) {
                    totalCmdV8 += (cmdsByCatV8[cat] || []).length;
                }
                
                let roleV8 = '𝙐𝙨𝙚𝙧', emojiV8 = '◈';
                if (m.isOwner) { roleV8 = '𝙊𝙬𝙣𝙚𝙧'; emojiV8 = '♚'; }
                else if (m.isPremium) { roleV8 = '𝙋𝙧𝙚𝙢𝙞𝙪𝙢'; emojiV8 = '✦'; }
                
                const prefixV8 = botConfig.command?.prefix || '.';
                const catOrderV8 = ['main', 'ai', 'download', 'search', 'tools', 'fun', 'game', 'sticker', 'canvas', 'group', 'media', 'user', 'rpg', 'owner'];
                const sortedCatsV8 = [...categoriesV8].sort((a, b) => {
                    const iA = catOrderV8.indexOf(a.toLowerCase());
                    const iB = catOrderV8.indexOf(b.toLowerCase());
                    return (iA === -1 ? 999 : iA) - (iB === -1 ? 999 : iB);
                });
                
                const modeAllowV8 = {
                    md: null,
                    cpanel: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
                    store: ['main', 'group', 'sticker', 'owner', 'store'],
                    pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
                };
                const modeExcludeV8 = {
                    md: ['panel', 'pushkontak', 'store'],
                    cpanel: null, store: null, pushkontak: null
                };
                const allowV8 = modeAllowV8[botMode];
                const excludeV8 = modeExcludeV8[botMode] || [];
                
                let menuV8 = ``;
                
                const sparkles = ['✦', '✧', '⋆', '˚', '✵', '⊹'];
                const randomSparkle = () => sparkles[Math.floor(Math.random() * sparkles.length)];
                
                menuV8 += `${randomSparkle()}━━━━━━━━━━━━━━━━━━━━━${randomSparkle()}\n`;
                menuV8 += `*${botConfig.bot?.name || '𝗢𝗨𝗥𝗜𝗡-𝗔𝗜'}*\n`;
                menuV8 += `${randomSparkle()}━━━━━━━━━━━━━━━━━━━━━${randomSparkle()}\n\n`;
                
                menuV8 += `┏━━━〔 ${emojiV8} *𝗣𝗥𝗢𝗙𝗜𝗟𝗘* 〕━━━┓\n`;
                menuV8 += `┃ 👤 *${m.pushName}*\n`;
                menuV8 += `┃ 🏷️ ${roleV8}\n`;
                menuV8 += `┃ ⏰ ${timeV8} WIB\n`;
                menuV8 += `┃ 📅 ${dateV8}\n`;
                menuV8 += `┗━━━━━━━━━━━━━━━┛\n\n`;
                
                menuV8 += `┏━━〔 ⚡ *𝗦𝗬𝗦𝗧𝗘𝗠 𝗦𝗧𝗔𝗧𝗦* 〕━━┓\n`;
                menuV8 += `┃ 🎫 Limit   ➤ ${m.isOwner || m.isPremium ? '∞ Unlimited' : `${userV8?.limit ?? 25}/25`}\n`;
                menuV8 += `┃ ⏱️ Uptime  ➤ ${uptimeV8}\n`;
                menuV8 += `┃ 🔧 Mode    ➤ ${botMode.toUpperCase()}\n`;
                menuV8 += `┃ 📊 Total   ➤ ${totalCmdV8} Commands\n`;
                menuV8 += `┃ 👥 Users   ➤ ${db.getUserCount()} Aktif\n`;
                menuV8 += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                
                menuV8 += `╭══════════════════════╮\n`;
                menuV8 += `║  📋 *𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗟𝗜𝗦𝗧*    ║\n`;
                menuV8 += `╰══════════════════════╯\n\n`;
                
                for (const cat of sortedCatsV8) {
                    if (cat === 'owner' && !m.isOwner) continue;
                    if (allowV8 && !allowV8.includes(cat.toLowerCase())) continue;
                    if (excludeV8.includes(cat.toLowerCase())) continue;
                    
                    const cmdsV8 = cmdsByCatV8[cat] || [];
                    if (cmdsV8.length === 0) continue;
                    
                    const emojiCat = CATEGORY_EMOJIS[cat] || '▣';
                    menuV8 += `┌─────「 ${emojiCat} *${cat.toUpperCase()}* 」\n`;
                    menuV8 += `│ ✦ Total: ${cmdsV8.length} commands\n`;
                    menuV8 += `│\n`;
                    
                    for (const cmd of cmdsV8) {
                        menuV8 += `│ ├➤ ${prefixV8}${cmd}\n`;
                    }
                    menuV8 += `│\n`;
                    menuV8 += `└───────────────────\n\n`;
                }
                
                menuV8 += `╭━━〔 💡 *𝗧𝗜𝗣𝗦* 〕━━╮\n`;
                menuV8 += `│ ❸ Follow channel ${config.saluran?.link || 'Ourin-AI'}\n`;
                menuV8 += `╰━━━━━━━━━━━━━━━━━━╯\n\n`;
                
                menuV8 += `> ${randomSparkle()} *${botConfig.bot?.name}* v${botConfig.bot?.version || '1.7.1'} ${randomSparkle()}`;
                
                
                let thumbV8 = thumbBuffer;
                if (thumbBuffer) {
                    try {
                        thumbV8 = await sharp(thumbBuffer)
                            .resize(300, 300, { fit: 'cover' })
                            .jpeg({ quality: 80 })
                            .toBuffer();
                    } catch (e) {
                        thumbV8 = thumbBuffer;
                    }
                }
                
                const ftroliQuoted = {
                    key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
                    message: {
                        orderMessage: {
                            orderId: '1337',
                            thumbnail: thumbV8 || null,
                            itemCount: totalCmdV8,
                            status: 'INQUIRY',
                            surface: 'CATALOG',
                            message: `${botConfig.bot?.name || 'Ourin-AI'} Menu`,
                            orderTitle: `📋 ${totalCmdV8} Commands`,
                            sellerJid: botConfig.botNumber ? `${botConfig.botNumber}@s.whatsapp.net` : m.sender,
                            token: 'ourin-menu-v8',
                            totalAmount1000: 0,
                            totalCurrencyCode: 'IDR',
                            contextInfo: {
                                isForwarded: true,
                                forwardingScore: 9999,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: botConfig.saluran?.id || '',
                                    newsletterName: botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI',
                                    serverMessageId: 127
                                }
                            }
                        }
                    }
                };
                
                await sock.sendMessage(m.chat, {
                    image: fs.readFileSync('assets/images/ourin-v8.jpg'),
                    caption: menuV8,
                    contextInfo: getContextInfo(botConfig, m, imageBuffer, true)
                }, { quoted: ftroliQuoted });
                break;
                
            case 9:
                try {
                    const { prepareWAMessageMedia } = require('ourin');
                    const prefixV9 = botConfig.command?.prefix || '.';
                    const categoriesV9 = getCategories();
                    const cmdsByCatV9 = getCommandsByCategory();
                    const saluranIdV9 = botConfig.saluran?.id || '';
                    const saluranNameV9 = botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI';
                    const saluranLinkV9 = botConfig.saluran?.link || 'https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t';
                    
                    const { getCasesByCategory: getCasesCatV9 } = require('../../case/ourin');
                    const casesCatV9 = getCasesCatV9();
                    
                    const categoryOrderV9 = ['main', 'owner', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'cek', 'economy', 'user', 'canvas', 'random', 'premium', 'ephoto', 'jpm'];
                    const allowV9 = botMode === 'md' ? null : ['main', 'group', 'sticker', 'owner', 'tools'];
                    const excludeV9 = ['panel', 'pushkontak', 'store'];
                    
                    const sortedCatsV9 = [...categoriesV9].sort((a, b) => {
                        const indexA = categoryOrderV9.indexOf(a);
                        const indexB = categoryOrderV9.indexOf(b);
                        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                    });
                    
                    const menuRowsV9 = [];
                    for (const cat of sortedCatsV9) {
                        if (cat === 'owner' && !m.isOwner) continue;
                        if (allowV9 && !allowV9.includes(cat.toLowerCase())) continue;
                        if (excludeV9.includes(cat.toLowerCase())) continue;
                        
                        const pluginCmdsV9 = cmdsByCatV9[cat] || [];
                        const caseCmdsV9 = casesCatV9[cat] || [];
                        const totalCmdsV9 = pluginCmdsV9.length + caseCmdsV9.length;
                        if (totalCmdsV9 === 0) continue;
                        
                        const emojiCat = CATEGORY_EMOJIS[cat] || '📁';
                        menuRowsV9.push({
                            title: `${emojiCat} ${cat.toUpperCase()}`,
                            description: `${totalCmdsV9} commands`,
                            id: `${prefixV9}menucat ${cat}`
                        });
                    }
                    
                    let headerMediaV9 = null;
                    if (imageBuffer) {
                        try {
                            const resizedV9 = await sharp(fs.readFileSync('./assets/images/ourin-v9.jpg'))
                                .resize(300, 300, { fit: 'cover' })
                                .jpeg({ quality: 80 })
                                .toBuffer();
                            headerMediaV9 = await prepareWAMessageMedia({
                                image: resizedV9
                            }, { upload: sock.waUploadToServer });
                        } catch (e) {
                            console.error('[Menu V9] Media prep error:', e.message);
                        }
                    }

                    const zannerz = "https://wa.me/" + config.owner?.number?.[0]
                    
                    const buttonsV9 = [
                        {
                            name: "single_select",
                            buttonParamsJson: JSON.stringify({ 
                                has_multiple_buttons: true,
                            })
                        },
                        {
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "Nomor Owner ku",
                                url: zannerz,
                                merchant_url: zannerz
                            })
                        },
                        {
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({
                                display_text: "🧾 Tampilkan Semua Menu",
                                id: `${m.prefix}allmenu`,
                            })
                        },
                        
                    ];
                    
                    const msgV9 = generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                    body: proto.Message.InteractiveMessage.Body.fromObject({
                                        text: text
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                        text: `© ${botConfig.bot?.name || 'Ourin-AI'} v${botConfig.bot?.version || '1.9.0'}`
                                    }),
                                    header: proto.Message.InteractiveMessage.Header.fromObject({
                                        hasMediaAttachment: !!headerMediaV9,
                                        ...(headerMediaV9 || {})
                                    }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                        messageParamsJson: JSON.stringify({
                                            limited_time_offer: {
                                                text: botConfig.bot?.name || 'Ourin-AI',
                                                url: saluranLinkV9,
                                                copy_code: botConfig.owner?.name || 'Ourin-AI',
                                                expiration_time: Date.now() * 999
                                            },
                                            bottom_sheet: {
                                                in_thread_buttons_energi: 2,
                                                divider_indices: [1, 2, 3, 4, 5, 999],
                                                list_title: botConfig.bot?.name || 'Ourin-AI',
                                                button_title: '🍀 ριℓιн кαтєgσяι'
                                            },
                                        }),
                                        buttons: buttonsV9
                                    }),
                                    contextInfo: {
                                        mentionedJid: [m.sender],
                                        forwardingScore: 9999,
                                        isForwarded: true,
                                        forwardedNewsletterMessageInfo: {
                                            newsletterJid: saluranIdV9,
                                            newsletterName: saluranNameV9,
                                            serverMessageId: 127
                                        }
                                    }
                                })
                            }
                        }
                    }, { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) });
                    
                    await sock.relayMessage(m.chat, msgV9.message, { messageId: msgV9.key.id });
                    
                } catch (v9Error) {
                    console.error('[Menu V9] Error:', v9Error.message);
                    const fallbackV9 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV9.image = imageBuffer; fallbackV9.caption = text; }
                    else { fallbackV9.text = text; }
                    await sock.sendMessage(m.chat, fallbackV9, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 10:
                try {
                    const { prepareWAMessageMedia } = require('ourin');
                    const prefixV10 = botConfig.command?.prefix || '.';
                    const categoriesV10 = getCategories();
                    const cmdsByCatV10 = getCommandsByCategory();
                    const saluranIdV10 = botConfig.saluran?.id || '';
                    const saluranNameV10 = botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI';
                    const timeHelper = require('../../src/lib/ourin-time');
                    const timeStrV10 = timeHelper.formatTime('HH:mm:ss');
                    const uptimeFmtV10 = formatUptime(uptime);
                    
                    let totalCmdV10 = 0;
                    for (const cat of categoriesV10) {
                        totalCmdV10 += (cmdsByCatV10[cat] || []).length;
                    }
                    
                    const { getCasesByCategory, getCaseCount } = require('../../case/ourin');
                    const caseCats = getCasesByCategory();
                    const caseCountV10 = getCaseCount();
                    totalCmdV10 += caseCountV10;
                    
                    const categoryOrderV10 = ['main', 'owner', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'cek', 'economy', 'user', 'canvas', 'random', 'premium'];
                    const allowV10 = botMode === 'md' ? null : ['main', 'group', 'sticker', 'owner', 'tools'];
                    const excludeV10 = ['panel', 'pushkontak', 'store'];
                    
                    const sortedCatsV10 = [...categoriesV10].sort((a, b) => {
                        const indexA = categoryOrderV10.indexOf(a);
                        const indexB = categoryOrderV10.indexOf(b);
                        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                    });
                    
                    const menuRowsV10 = [];
                    for (const cat of sortedCatsV10) {
                        if (cat === 'owner' && !m.isOwner) continue;
                        if (allowV10 && !allowV10.includes(cat.toLowerCase())) continue;
                        if (excludeV10.includes(cat.toLowerCase())) continue;
                        
                        const pluginCmds = cmdsByCatV10[cat] || [];
                        const caseCmds = caseCats[cat] || [];
                        const totalCmds = pluginCmds.length + caseCmds.length;
                        if (totalCmds === 0) continue;
                        
                        const emojiCat = CATEGORY_EMOJIS[cat] || '📁';
                        menuRowsV10.push({
                            title: `${emojiCat} ${cat.toUpperCase()}`,
                            description: `${totalCmds} commands`,
                            id: `${m.prefix}menucat ${cat}`
                        });
                    }
                    
                    let productImageV10 = null;
                    try {
                        const imgPathV10 = path.join(process.cwd(), 'assets', 'images', 'ourin-v9.jpg');
                        const imgBufferV10 = fs.existsSync(imgPathV10) 
                            ? fs.readFileSync(imgPathV10) 
                            : (imageBuffer || thumbBuffer);
                        
                        if (imgBufferV10) {
                            const resizedV10 = await sharp(imgBufferV10)
                                .resize(736, 890, { fit: 'cover' })
                                .jpeg({ quality: 85 })
                                .toBuffer();
                            productImageV10 = await prepareWAMessageMedia({
                                image: resizedV10
                            }, { upload: sock.waUploadToServer });
                        }
                    } catch (e) {
                        console.error('[Menu V10] Media prep error:', e.message);
                    }
                    
                    const footerTextV10 = `
Hai *@${m.pushName || "User"}* 🪸

Aku ${botConfig.bot?.name || 'Ourin-AI'}, bot WhatsApp yang siap bantu kamu.  

Kamu bisa pakai aku buat cari info, ambil data, atau bantu hal-hal sederhana langsung lewat WhatsApp — praktis tanpa ribet.

─────────────────────────
Nama    : ${botConfig.bot?.name || 'Ourin-AI'}
Versi : v${botConfig.bot?.version || '1.9.0'}
Runtime : Node.js ${process.version}
Bot Up  : ${uptimeFmtV10}

Owner ku kak   : ${botConfig.owner?.name || 'Lucky Archz'}
─────────────────────────
Klik tombol di bawah untuk menampilkan menu
`;
                    
                    const buttonsV10 = [{
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: botConfig.bot?.name || 'Ourin-AI',
                            id: `${m.prefix}allmenu`,
                            
                        })
                    }];
                    
                    const productId = `Zann Zann Zann Zann Zann :)`;
                    const businessJid = botConfig.botNumber 
                        ? `${botConfig.botNumber}@s.whatsapp.net` 
                        : (m.botJid || sock.user?.id);
                    
                    const msgV10 = generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                    header: proto.Message.InteractiveMessage.Header.fromObject({
                                        title: `${botConfig.bot?.name || 'Ourin-AI'} Menu`,
                                        hasMediaAttachment: !!productImageV10,
                                        productMessage: {
                                            product: {
                                                productImage: productImageV10?.imageMessage || null,
                                                productId: productId,
                                                title: `${botConfig.bot?.name || 'Ourin-AI'} Menu`,
                                                description: 'Menu',
                                                currencyCode: 'USD',
                                                priceAmount1000: '1000000000000000',
                                                retailerId: botConfig.bot?.name || 'Ourin',
                                                productImageCount: 1
                                            },
                                            businessOwnerJid: businessJid
                                        }
                                    }),
                                    body: proto.Message.InteractiveMessage.Body.fromObject({
                                        text: `*© ${botConfig.bot?.name || 'Ourin-AI'} 2026*`
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                        text: footerTextV10
                                    }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                        buttons: buttonsV10
                                    }),
                                    contextInfo: {
                                        mentionedJid: [m.sender],
                                        forwardingScore: 9999,
                                        isForwarded: true,
                                        forwardedNewsletterMessageInfo: {
                                            newsletterJid: saluranIdV10,
                                            newsletterName: saluranNameV10,
                                            serverMessageId: 127
                                        }
                                    }
                                })
                            }
                        }
                    }, { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) });
                    
                    await sock.relayMessage(m.chat, msgV10.message, { messageId: msgV10.key.id });
                    
                } catch (v10Error) {
                    console.error('[Menu V10] Error:', v10Error.message);
                    const fallbackV10 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV10.image = imageBuffer; fallbackV10.caption = text; }
                    else { fallbackV10.text = text; }
                    await sock.sendMessage(m.chat, fallbackV10, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 11:
                try {
                    const saluranIdV11 = botConfig.saluran?.id || '';
                    const saluranNameV11 = botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI';
                    const docuThumbV11 = thumbBuffer || imageBuffer || fs.readFileSync(path.join(process.cwd(), 'assets', 'images', 'ourin-allmenu.jpg'));
                    const prefix = botConfig.command?.prefix || '.';
                const saluranId = botConfig.saluran?.id || '120363208449943317@newsletter';
                const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI';
                
                const categories = getCategories();
                const commandsByCategory = getCommandsByCategory();
                const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'jpm', 'pushkontak', 'panel', 'user'];
                
                const sortedCats = [...categories].sort((a, b) => {
                    const indexA = categoryOrder.indexOf(a);
                    const indexB = categoryOrder.indexOf(b);
                    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                });
                
                const toMonoUpperBold = (text) => {
                    const chars = {
                        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚',
                        'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡',
                        'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨',
                        'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭'
                    };
                    return text.toUpperCase().split('').map(c => chars[c] || c).join('');
                };
                
                const categoryRows = [];
                
                const modeAllowedMap = {
                    md: null,
                    cpanel: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
                    store: ['main', 'group', 'sticker', 'owner', 'store'],
                    pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
                };
                const modeExcludeMap = {
                    md: ['panel', 'pushkontak', 'store'],
                    cpanel: null,
                    store: null,
                    pushkontak: null
                };
                
                const allowedCats = modeAllowedMap[botMode];
                const excludeCats = modeExcludeMap[botMode] || [];
                
                for (const cat of sortedCats) {
                    if (cat === 'owner' && !m.isOwner) continue;
                    if (allowedCats && !allowedCats.includes(cat.toLowerCase())) continue;
                    if (excludeCats && excludeCats.includes(cat.toLowerCase())) continue;
                    
                    const cmds = commandsByCategory[cat] || [];
                    if (cmds.length === 0) continue;
                    
                    const emoji = CATEGORY_EMOJIS[cat] || '📁';
                    const title = `${emoji} ${toMonoUpperBold(cat)}`;
                    
                    categoryRows.push({
                        header: `${toMonoUpperBold('MENU ' + title)}`,
                        id: `${prefix}menucat ${cat}`,
                        title: `Berisi ${cmds.length} Perintah`,
                        description: 'Tap untuk membuka menu category ini'
                    });
                }
                
                let totalCmds = 0;
                for (const cat of categories) {
                    totalCmds += (commandsByCategory[cat] || []).length;
                }
                    await sock.sendMessage(m.chat, {
                        interactiveMessage: {
                            title: `Hallo Kak *@${m.pushName}*
                            
Sebelumnya, terima kasih yak sudah menggunakan bot kami

╭─ \`INFORMASI BOT\` 𝜗ৎ
┆ ᵎᵎ Nama Bot : *${botConfig.bot?.name || 'Ourin-AI'}*
┆ ᵎᵎ Owner Bot : *${botConfig.owner?.name || 'Ourin-AI'}*
┆ ᵎᵎ Prefix : *${botConfig.command?.prefix || '.'}*
┆ ᵎᵎ Total Perintah : *${totalCmds}*
┆ ᵎᵎ Role Kamu : ${m.isOwner ? 'Owner' : m.isPremium ? "Premium" : "User Biasa"}
╰─────

silahkan tekan tombol dibawah untuk memilih menu`,
                            footer: botConfig.settings?.footer || `© ${botConfig.bot?.name || 'Ourin-AI'} 2026`,
                            document: fs.readFileSync('./package.json'),
                            mimetype: 'image/png',
                            fileName: `${getTimeGreeting()}`,
                            jpegThumbnail: await sharp(docuThumbV11).resize({ width: 300, height: 300 }).toBuffer(),
                            contextInfo: {
                                mentionedJid: [m.sender],
                                forwardingScore: 777,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: saluranIdV11,
                                    newsletterName: saluranNameV11,
                                    serverMessageId: 127
                                }
                            },
                            externalAdReply: {
                                title: botConfig.bot?.name || 'Ourin-AI',
                                body: "Runtime: " + process.uptime() + "s",
                                mediaType: 1,
                                thumbnail: fs.readFileSync('./assets/images/ourin-v11.jpg') || '',
                                mediaUrl: botConfig.saluran?.url || 'https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t',
                                sourceUrl: botConfig.saluran?.url || 'https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t',
                                renderLargerThumbnail: true
                            },
                            nativeFlowMessage: {
                                messageParamsJson: JSON.stringify({
                                    limited_time_offer: {
                                        text: `Gunakan bot ini dengan bijak yak`,
                                        url: botConfig.saluran?.url || 'https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t',
                                        copy_code: botConfig.bot?.name || 'Ourin-AI',
                                        expiration_time: Date.now() * 999
                                    },
                                    bottom_sheet: {            
                                        in_thread_buttons_limit: 2,            
                                        divider_indices: [1, 2, 3, 4, 5, 999],            
                                        list_title: "Pilih Menu",            
                                        button_title: "🍀 Pilih Menu Disini"          
                                    },    
                                    tap_target_configuration: {            
                                        title: " X ",            
                                        description: "bomboclard",            
                                        canonical_url: "https://ourin.site",            
                                        domain: "shop.example.com",            
                                        button_index: 0          
                                    }  
                                }),
                                buttons: [
                                    {            
                                        name: "single_select",            
                                        buttonParamsJson: JSON.stringify({              
                                            has_multiple_buttons: true            
                                        })          
                                    },
                                    {            
                                        name: "call_permission_request",            
                                        buttonParamsJson: JSON.stringify({              
                                            has_multiple_buttons: true            
                                        })          
                                    }, 
                                    {            
                                        name: "single_select",            
                                        buttonParamsJson: JSON.stringify({              
                                            title: "Pilihan Menu",              
                                            sections: [                
                                                {                  
                                                    title: "🍀 Silahkan pilih menu yang kamu inginkan",                  
                                                    highlight_label: botConfig.bot?.name || 'Ourin-AI',                  
                                                    rows: categoryRows                  
                                                }              
                                            ], 
                                            has_multiple_buttons: true                     
                                        })          
                                    },          
                                    {
                                        name: 'cta_url',
                                        buttonParamsJson: JSON.stringify({
                                            display_text: '🌏 Kunjungi Saluran Kami',
                                            url: botConfig.saluran?.url || '',
                                            merchant_url: botConfig.saluran?.url || ''
                                        })
                                    },
                                    {
                                        name: 'quick_reply',
                                        buttonParamsJson: JSON.stringify({
                                            display_text: '🖐 Owner Kami',
                                            id: `${m.prefix}owner`
                                        })
                                    },
                                    {
                                        name: 'quick_reply',
                                        buttonParamsJson: JSON.stringify({
                                            display_text: '🌺 Lihat Semua Menu',
                                            id: `${m.prefix}allmenu`
                                        })
                                    },  
                                ]
                            }
                        }
                    }, { quoted: getVerifiedQuoted(botConfig) });
                    
                } catch (v11Error) {
                    console.error('[Menu V11] Error:', v11Error.message);
                    const fallbackV11 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV11.image = imageBuffer; fallbackV11.caption = text; }
                    else { fallbackV11.text = text; }
                    await sock.sendMessage(m.chat, fallbackV11, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
            case 12:
                try {
                    const saluranIdV12 = botConfig.saluran?.id || '';
                    const saluranNameV12 = botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI';
                    const docuThumbV12 = thumbBuffer || imageBuffer || fs.readFileSync(path.join(process.cwd(), 'assets', 'images', 'ourin-allmenu.jpg'));
                    const prefix = botConfig.command?.prefix || '.';
                const saluranId = botConfig.saluran?.id || '120363208449943317@newsletter';
                const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI';
                
                const categories = getCategories();
                const commandsByCategory = getCommandsByCategory();
                const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'jpm', 'pushkontak', 'panel', 'user'];
                
                const sortedCats = [...categories].sort((a, b) => {
                    const indexA = categoryOrder.indexOf(a);
                    const indexB = categoryOrder.indexOf(b);
                    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                });
                
                const toMonoUpperBold = (text) => {
                    const chars = {
                        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚',
                        'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡',
                        'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨',
                        'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭'
                    };
                    return text.toUpperCase().split('').map(c => chars[c] || c).join('');
                };
                
                const categoryRows = [];
                
                const modeAllowedMap = {
                    md: null,
                    cpanel: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
                    store: ['main', 'group', 'sticker', 'owner', 'store'],
                    pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
                };
                const modeExcludeMap = {
                    md: ['panel', 'pushkontak', 'store'],
                    cpanel: null,
                    store: null,
                    pushkontak: null
                };
                
                const allowedCats = modeAllowedMap[botMode];
                const excludeCats = modeExcludeMap[botMode] || [];
                
                for (const cat of sortedCats) {
                    if (cat === 'owner' && !m.isOwner) continue;
                    if (allowedCats && !allowedCats.includes(cat.toLowerCase())) continue;
                    if (excludeCats && excludeCats.includes(cat.toLowerCase())) continue;
                    
                    const cmds = commandsByCategory[cat] || [];
                    if (cmds.length === 0) continue;
                    
                    const emoji = CATEGORY_EMOJIS[cat] || '📁';
                    const title = `${emoji} ${toMonoUpperBold(cat)}`;
                    
                    categoryRows.push({
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: `${toMonoUpperBold(cat)}`,
                            id: `${m.prefix}menucat ${cat}`
                        })
                    });
                }
                
                let totalCmds = 0;
                for (const cat of categories) {
                    totalCmds += (commandsByCategory[cat] || []).length;
                }
                    function formatBytes(bytes, decimals = 2) {
                        if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
                        if (bytes === 0) return "0 B";
                        const k = 1024;
                        const units = ["B", "KB", "MB", "GB", "TB"];
                        const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
                        const value = bytes / Math.pow(k, i);
                        const fixed = value.toFixed(decimals);
                        const pretty = fixed.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
                        return `${pretty} ${units[i]}`;
                    }
                    const obj = JSON.parse(fs.readFileSync('./database/main/users.json'));
                    const jsonStr = JSON.stringify(obj);
                    const bytes = Buffer.byteLength(jsonStr, "utf8");
                    let pp
                    try {
                        pp = Buffer.from((await axios.get(await sock.profilePictureUrl(m.sender, 'image'), { responseType: 'arraybuffer' })).data)
                    } catch (error) {
                        pp = fs.readFileSync('./assets/images/pp-kosong.jpg')
                    }
                    const zanton = [
                        {            
                            name: "single_select",            
                            buttonParamsJson: JSON.stringify({              
                                has_multiple_buttons: true            
                            })          
                        },
                        {            
                            name: "call_permission_request",            
                            buttonParamsJson: JSON.stringify({              
                                has_multiple_buttons: true            
                            })          
                        },       
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: 'Lihat Semua Menu',
                                id: `${m.prefix}allmenu`
                            })
                        },  
                    ]
                    zanton.push(...categoryRows)
                    await sock.sendMessage(m.chat, {
                        interactiveMessage: {
                            title: `🌾 *𝘏𝘪! ${m.pushName}*

𝘛𝘩𝘢𝘯𝘬𝘴 𝘧𝘰𝘳 𝘮𝘦𝘴𝘴𝘢𝘨𝘪𝘯𝘨 𝘶𝘴. 𝘠𝘰𝘶’𝘳𝘦 𝘯𝘰𝘸 𝘤𝘩𝘢𝘵𝘵𝘪𝘯𝘨 𝘸𝘪𝘵𝘩 𝘰𝘶𝘳 𝘈𝘶𝘵𝘰𝘮𝘢𝘵𝘪𝘤 𝘞𝘩𝘢𝘵𝘴𝘈𝘱𝘱 𝘉𝘰𝘵. 

╭─「 *${m.pushName}* 」
│ • Bot Version     : *${botConfig.bot?.version || '2.1.0'}*
│ • Database         : ${formatBytes(bytes)}
╰──`,
                            footer: botConfig.settings?.footer || `© ${botConfig.bot?.name || 'Ourin-AI'} 2026`,
                            document: fs.readFileSync('./package.json'),
                            mimetype: 'image/png',
                            fileName: `${getTimeGreeting()}`,
                            jpegThumbnail: await sharp(pp).resize({ width: 300, height: 300 }).toBuffer(),
                            contextInfo: {
                                mentionedJid: [m.sender],
                                forwardingScore: 777,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: saluranIdV12,
                                    newsletterName: saluranNameV12,
                                    serverMessageId: 127
                                }
                            },
                            externalAdReply: {
                                title: botConfig.bot?.name || 'Ourin-AI',
                                body: `🍃 OWNER BOT: ${botConfig.owner?.name || 'Ourin-AI'}`,
                                mediaType: 1,
                                thumbnail: fs.readFileSync('./assets/images/ourin-v11.jpg') || '',
                                mediaUrl: botConfig?.info?.website || '',
                                sourceUrl: botConfig?.info?.website || '',
                                renderLargerThumbnail: true
                            },
                            nativeFlowMessage: {
                                messageParamsJson: JSON.stringify({
                                    bottom_sheet: {            
                                        in_thread_buttons_limit: 2,            
                                        divider_indices: [1, 2, 3, 4, 5, 999],            
                                        list_title: "SIlahkan pilih category yang ingin dilihat",            
                                        button_title: "🧾 Tap Here!"          
                                    },    
                                    tap_target_configuration: {            
                                        title: " X ",            
                                        description: "bomboclard",            
                                        canonical_url: "https://ourin.site",            
                                        domain: "shop.example.com",            
                                        button_index: 0          
                                    }  
                                }),
                                buttons: zanton
                            }
                        }
                    }, { quoted: {
                        key: {remoteJid: '0@s.whatsapp.net', fromMe: false, id: `ownername`, participant: '0@s.whatsapp.net'}, message: {requestPaymentMessage: {currencyCodeIso4217: "USD", amount1000: 999999999, requestFrom: '0@s.whatsapp.net', noteMessage: { extendedTextMessage: { text: `${botConfig?.bot?.name}`}}, expiryTimestamp: 999999999, amount: {value: 91929291929, offset: 1000, currencyCode: "USD"}}}
                    } });
                } catch (v12Error) {
                    console.error('[Menu V12] Error:', v12Error.message);
                    const fallbackV12 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV12.image = imageBuffer; fallbackV12.caption = text; }
                    else { fallbackV12.text = text; }
                    await sock.sendMessage(m.chat, fallbackV12, { quoted: {
                        key: {participant: '0@s.whatsapp.net', ...(m.chat ? {remoteJid: `status@broadcast`} : {})}, message: {locationMessage: {name: `${namaOwner}`,jpegThumbnail: ""}}
                    } });
                }
                break;
                
            case 13: {
                const thumbPathV13 = path.join(process.cwd(), 'assets', 'images', 'ourin3.jpg');
                const saluranIdV13 = botConfig.saluran?.id || '';
                const saluranNameV13 = botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI';
                const saluranLinkV13 = botConfig.saluran?.link || '';
                const categories = getCategories();
                const commandsByCategory = getCommandsByCategory();
                const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'jpm', 'pushkontak', 'panel', 'user'];
                
                const toMonoUpperBold = (text) => {
                    const chars = {
                        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗖', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚',
                        'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡',
                        'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨',
                        'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭'
                    };
                    return text.toUpperCase().split('').map(c => chars[c] || c).join('');
                };
                let totalCmds = 0;
                for (const cat of categories) {
                    totalCmds += (commandsByCategory[cat] || []).length;
                }
                let bannerThumbV13 = null;
                
                const user = db.getUser(m.sender)
                try {
                    const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
                    
                    /**
                     * Fungsi untuk membuat gambar profil menggunakan @napi-rs/canvas
                     * @param {Object} data Data user
                     * @returns {Promise<Buffer>} Buffer gambar PNG
                     */
                    async function createProfileCard(data) {
                        // Ukuran kanvas
                        const canvas = createCanvas(800, 250);
                        const ctx = canvas.getContext('2d');
                    
                        // Tema Warna "Edgy Graphic Design"
                        const accentColor = '#CCFF00'; // Volt Green (Hijau stabilo/kuning)
                        const fgColor = '#FFFFFF';
                    
                        // 1. Background Image dengan Kontras Tinggi (Object-fit Cover)
                        ctx.fillStyle = '#09090B'; // Mencegah background putih transparan WA
                        ctx.fillRect(0, 0, 800, 250);
                        try {
                            const bgImage = await loadImage(data.backgroundUrl);
                            const canvasRatio = 800 / 250;
                            const imgRatio = bgImage.width / bgImage.height;
                            let drawW, drawH, drawX, drawY;
                            
                            if (imgRatio > canvasRatio) {
                                drawH = 250;
                                drawW = bgImage.width * (250 / bgImage.height);
                                drawX = (800 - drawW) / 2;
                                drawY = 0;
                            } else {
                                drawW = 800;
                                drawH = bgImage.height * (800 / bgImage.width);
                                drawX = 0;
                                drawY = (250 - drawH) / 2;
                            }
                            ctx.drawImage(bgImage, drawX, drawY, drawW, drawH);
                        } catch (error) {
                            ctx.fillStyle = '#09090B';
                            ctx.fillRect(0, 0, 800, 250);
                        }
                    
                        // Overlay gelap pekat agar terkesan misterius & solid
                        ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
                        ctx.fillRect(0, 0, 800, 250);
                    
                        // 2. Bentuk Asimetris (Sentuhan "Human Design")
                        // Alih-alih kotak rapi, kita buat bidang miring di latar belakang
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(400, 0);
                        ctx.lineTo(320, 250);
                        ctx.lineTo(0, 250);
                        ctx.fill();
                    
                        // Garis miring aksen
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(410, 0);
                        ctx.lineTo(330, 250);
                        ctx.stroke();
                    
                        // 3. Tipografi "Watermark" Super Besar di Background
                        ctx.fillStyle = 'rgba(204, 255, 0, 0.05)';
                        ctx.font = '900 150px sans-serif'; 
                        ctx.fillText(`LV${data.level}`, 300, 220);
                    
                        // 4. Elemen Dekoratif Mikro (Khas Desain Grafis)
                        // Teks sistem kecil di pojok kiri atas
                        ctx.fillStyle = '#666666';
                        ctx.font = '10px monospace';
                        ctx.fillText('// SYS_ONLINE : USER_PROFILE', 30, 25);
                        ctx.fillText('ID_HASH: ' + Math.random().toString(36).substring(2, 10).toUpperCase(), 30, 40);
                    
                        // Garis "Barcode" di pojok kanan atas
                        ctx.fillStyle = accentColor;
                        ctx.fillRect(770, 20, 6, 40);
                        ctx.fillRect(760, 20, 2, 40);
                        ctx.fillRect(752, 20, 3, 40);
                    
                        // 5. Konfigurasi Avatar (Bentuk Lingkaran Rapi)
                        const avatarSize = 130;
                        const avatarX = 50;
                        const avatarY = 60;
                        const centerX = avatarX + avatarSize / 2;
                        const centerY = avatarY + avatarSize / 2;
                        const radius = avatarSize / 2;
                    
                        // Memotong area avatar menjadi lingkaran
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
                        ctx.closePath();
                        ctx.clip(); 
                    
                        // Memuat gambar avatar
                        try {
                            const avatar = await loadImage(data.avatarUrl);
                            ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
                        } catch (error) {
                            ctx.fillStyle = '#333333';
                            ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
                        }
                        ctx.restore();
                    
                        // Bingkai Lingkaran yang Rapi
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
                        ctx.lineWidth = 4; // Ketebalan border
                        ctx.strokeStyle = accentColor;
                        ctx.stroke();
                    
                        // ==========================================
                        // AREA TEKS DAN BADGE
                        // ==========================================
                        
                        // 6. Nama Pengguna (Besar & Tegas, Jangan di toUpperCase() agar Emoji aman)
                        ctx.fillStyle = fgColor;
                        ctx.font = '900 42px sans-serif'; 
                        let displayName = data.name || 'User';
                        if (displayName.length > 15) displayName = displayName.substring(0, 15) + '...';
                        ctx.fillText(displayName, 230, 100);
                    
                        // 7. Badge Rank Miring (Slanted Badge)
                        ctx.save();
                        ctx.translate(230, 115);
                        ctx.fillStyle = accentColor;
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(120, 0); // Lebar atas
                        ctx.lineTo(110, 24); // Miring ke kiri bawah
                        ctx.lineTo(-10, 24); // Miring ke kiri bawah
                        ctx.fill();
                        
                        ctx.fillStyle = '#000000'; // Teks hitam di dalam badge Volt Green
                        ctx.font = 'bold 14px sans-serif';
                        ctx.fillText(data.rank.toUpperCase(), 10, 17);
                        ctx.restore();
                    
                        // ==========================================
                        // AREA PROGRESS BAR (Gaya Segmented/Terputus-putus)
                        // ==========================================
                        const barX = 230;
                        const barY = 172; // Posisi bar disesuaikan agar panel teks di bawah lega
                        const barWidth = 500;
                        const segments = 25; // Dibagi 25 kotak kecil
                        const gap = 3;
                        const segmentWidth = (barWidth - (gap * (segments - 1))) / segments;
                    
                        const xpRatio = Math.min(data.currentXp / data.requiredXp, 1);
                        const activeSegments = Math.floor(xpRatio * segments);
                    
                        // Background Bar (Kotak-kotak kosong)
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                        for (let i = 0; i < segments; i++) {
                            ctx.fillRect(barX + (i * (segmentWidth + gap)), barY, segmentWidth, 8);
                        }
                    
                        // Foreground Bar (Kotak-kotak terisi)
                        ctx.fillStyle = accentColor;
                        for (let i = 0; i < activeSegments; i++) {
                            ctx.fillRect(barX + (i * (segmentWidth + gap)), barY, segmentWidth, 8);
                        }
                    
                        // ==========================================
                        // AREA DETAIL EXP & LEVEL (HUD STYLE)
                        // ==========================================
                        const dataY = barY + 18; // Jarak turun dari progress bar
                    
                        // 1. PANEL EXP (Kiri)
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; // Background transparan putih
                        ctx.beginPath();
                        ctx.moveTo(barX, dataY);
                        ctx.lineTo(barX + 210, dataY); // Ujung atas kanan
                        ctx.lineTo(barX + 198, dataY + 26); // Ujung bawah kanan (miring ke dalam)
                        ctx.lineTo(barX, dataY + 26); // Ujung bawah kiri
                        ctx.fill();
                    
                        // Aksen Garis Volt Green di kiri Panel EXP
                        ctx.fillStyle = accentColor;
                        ctx.fillRect(barX, dataY, 4, 26);
                    
                        // Teks Label "EXP"
                        ctx.fillStyle = '#FFFFFF';
                        ctx.font = 'bold 13px sans-serif';
                        ctx.textAlign = 'left';
                        ctx.fillText('EXP', barX + 15, dataY + 18);
                    
                        // Teks Angka EXP Current (Warna Volt Green agar menyala)
                        ctx.fillStyle = accentColor;
                        ctx.font = 'bold 14px monospace';
                        ctx.fillText(data.currentXp.toString(), barX + 50, dataY + 18);
                    
                        // Pemisah & Angka EXP Max (Warna Abu-abu netral)
                        const currentXpWidth = ctx.measureText(data.currentXp.toString()).width;
                        ctx.fillStyle = '#888888';
                        ctx.font = '14px monospace';
                        ctx.fillText(` / ${data.requiredXp}`, barX + 50 + currentXpWidth, dataY + 18);
                    
                        // 2. BADGE LEVEL (Kanan)
                        const badgeW = 90;
                        ctx.save();
                        ctx.translate(barX + barWidth - badgeW, dataY);
                        
                        // Bentuk Badge: Kiri miring (konsisten), kanan lurus (sejajar ujung bar)
                        ctx.fillStyle = accentColor;
                        ctx.beginPath();
                        ctx.moveTo(12, 0); 
                        ctx.lineTo(badgeW, 0); 
                        ctx.lineTo(badgeW, 26);
                        ctx.lineTo(0, 26);
                        ctx.fill();
                    
                        // Teks "LVL X" warna hitam pekat di dalam badge
                        ctx.fillStyle = '#000000';
                        ctx.font = '900 16px sans-serif';
                        ctx.textAlign = 'center';
                        // Titik X diatur ke 48 agar teks berada tepat di tengah visual panel miring
                        ctx.fillText(`LVL ${data.level}`, 48, 19); 
                        ctx.restore();
                    
                        return canvas.toBuffer('image/jpeg');
                    }

                    const levelHelper = require('../../src/lib/ourin-level');
                    const profileUser = db.getUser(m.sender) || {};
                    const exp = profileUser.exp || 0;
                    const level = levelHelper.calculateLevel(exp);
                    const currentLevelExp = levelHelper.expForLevel(level);
                    const nextLevelExp = levelHelper.expForLevel(level + 1);
                    
                    let resolvedAvatarUrl = 'https://i.ibb.co/3Fh9Q6M/empty-profile.png';
                    try {
                        const ppUrl = await sock.profilePictureUrl(m.sender, 'image');
                        if (ppUrl) resolvedAvatarUrl = ppUrl;
                    } catch (e) {}

                    bannerThumbV13 = await createProfileCard({
                        name: m.pushName || profileUser.name || 'User',
                        level: level,
                        currentXp: exp - currentLevelExp,
                        requiredXp: nextLevelExp - currentLevelExp,
                        rank: levelHelper.getRole(level),
                        avatarUrl: resolvedAvatarUrl,
                        backgroundUrl: 'https://i.ibb.co/4YZnk48/default-bg.jpg'
                    });
                } catch (canvasErr) {
                    console.error('[Menu V13] Canvas error:', canvasErr.message);
                    bannerThumbV13 = thumbBuffer || imageBuffer;
                }
                
                const contextInfoV13 = {
                    mentionedJid: [m.sender],
                    forwardingScore: 99,
                    isForwarded: true,
                    externalAdReply: {
                        title: botConfig.bot?.name || 'Ourin-AI',
                        body: `WhatsApp Bot Multi Device`,
                        sourceUrl: botConfig.saluran?.link || '',
                        mediaType: 1,
                        showAdAttribution: false,
                        renderLargerThumbnail: true,
                        thumbnail: fs.readFileSync('./assets/images/ourin.jpg')
                    }
                };
                
                try {
                    const formatNumber = (number) => {
                        if (number >= 1e9) {
                            return (number / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'
                        }
                        if (number >= 1e6) {
                            return (number / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
                        }
                        if (number >= 1e3) {
                            return (number / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
                        }
                        return number.toString()
                    }
                    await sock.sendMessage(m.chat, {
                        image: bannerThumbV13,
                        caption: `🎄 ʜᴀʟʟᴏ *${m.pushName}*

╭─ *✦* \`${toMonoUpperBold('biodata bot')}\` *✦*
│ ʙᴏᴛ : *${botConfig.bot?.name || 'Ourin-AI'}*
│ ᴠᴇʀsɪᴏɴ : *${botConfig.bot?.version || '2.1.0'}*
╰───

╭─ *✦* \`${toMonoUpperBold(`list category`)}\` *✦*
${categories.map(cat => `│ *${m.prefix}menucat ${cat}*`).join('\n')}
╰─────────────`,
                        contextInfo: contextInfoV13,
                        
                        footer: `${botConfig.bot?.name || 'Ourin-AI'}`,
                    }, { quoted: getVerifiedQuoted(botConfig) });
                    
                } catch (v13Error) {
                    console.error('[Menu V13] Error:', v13Error.message);
                    const fallbackV13 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV13.image = imageBuffer; fallbackV13.caption = text; }
                    else { fallbackV13.text = text; }
                    await sock.sendMessage(m.chat, fallbackV13, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
            }
            
            case 14:
                try {
                    const saluranIdV14 = botConfig.saluran?.id || '';
                    const saluranNameV14 = botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI';
                    const docuThumbV14 = fs.readFileSync(path.join(process.cwd(), 'assets', 'images', 'ourin-v11.jpg'));

                const categories = getCategories();
                const commandsByCategory = getCommandsByCategory();
                const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'jpm', 'pushkontak', 'panel', 'user'];
                
                const sortedCats = [...categories].sort((a, b) => {
                    const indexA = categoryOrder.indexOf(a);
                    const indexB = categoryOrder.indexOf(b);
                    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                });
                
                const toMonoUpperBold = (text) => {
                    const chars = {
                        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚',
                        'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡',
                        'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨',
                        'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭'
                    };
                    return text.toUpperCase().split('').map(c => chars[c] || c).join('');
                };
                
                const categoryRows = [];
                
                const modeAllowedMap = {
                    md: null,
                    cpanel: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
                    store: ['main', 'group', 'sticker', 'owner', 'store'],
                    pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
                };
                const modeExcludeMap = {
                    md: ['panel', 'pushkontak', 'store'],
                    cpanel: null,
                    store: null,
                    pushkontak: null
                };
                
                const allowedCats = modeAllowedMap[botMode];
                const excludeCats = modeExcludeMap[botMode] || [];
                
                for (const cat of sortedCats) {
                    if (cat === 'owner' && !m.isOwner) continue;
                    if (allowedCats && !allowedCats.includes(cat.toLowerCase())) continue;
                    if (excludeCats && excludeCats.includes(cat.toLowerCase())) continue;
                    
                    const cmds = commandsByCategory[cat] || [];
                    if (cmds.length === 0) continue;
                    
                    const emoji = CATEGORY_EMOJIS[cat] || '📁';
                    const title = `${emoji} ${toMonoUpperBold(cat)}`;
                    
                    categoryRows.push({
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: `${toMonoUpperBold(cat)}`,
                            id: `${m.prefix}menucat ${cat}`
                        })
                    });
                }
                
                let totalCmds = 0;
                for (const cat of categories) {
                    totalCmds += (commandsByCategory[cat] || []).length;
                }
                    const obj = JSON.parse(fs.readFileSync('./database/main/users.json'));
                    const jsonStr = JSON.stringify(obj);
                    const bytes = Buffer.byteLength(jsonStr, "utf8");
                    let pp
                    try {
                        pp = Buffer.from((await axios.get(await sock.profilePictureUrl(m.sender, 'image'), { responseType: 'arraybuffer' })).data)
                    } catch (error) {
                        pp = fs.readFileSync('./assets/images/pp-kosong.jpg')
                    }
                    const zanton = [
                        {            
                            name: "single_select",            
                            buttonParamsJson: JSON.stringify({              
                                has_multiple_buttons: true            
                            })          
                        },
                        {            
                            name: "call_permission_request",            
                            buttonParamsJson: JSON.stringify({              
                                has_multiple_buttons: true            
                            })          
                        },       
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: 'Lihat Semua Menu',
                                id: `${m.prefix}allmenu`
                            })
                        },  
                    ]
                    zanton.push(...categoryRows)
                    
    const msg = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            contextInfo: {
              mentionedJid: [m.sender],
              forwardingScore: 19,
              isForwarded: true,
              forwardedNewsletterMessageInfo: { newsletterId: saluranIdV14, newsletterName: `- ${saluranNameV14}`, serverMessageId: -1 },
              externalAdReply: {
                title: botConfig?.bot?.bame,
                body: null,
                thumbnail: fs.readFileSync("./assets/images/ourin.jpg"),
                sourceUrl: null,
                mediaType: 1,
                renderLargerThumbnail: true,
              },
            },
            header: {
              title: null,
              locationMessage: {
                degreesLatitude: 0,
                degreesLongitude: 0,
                name: `꫶ᥫ᭡꫶ ${m.pushName || "User"}`,
                url: `https://ss.ss`,
                address: `Semoga harimu menyenangkan :3`,
                jpegThumbnail: await sharp(docuThumbV14).resize({ width: 300, height: 300 }).toBuffer(),
              },
              subtitle: "",
              hasMediaAttachment: false,
            },
            body: { text: null },
            footer: { text:  `Halo kak *${m.pushName}* ≽^• ˕ • ྀི≼\n` +
    `*⌞ INFO USER ⌝*\n` +
    `‧ Number    : +${m.sender.split("@")[0]}\n` +
    `‧ Name    : ${m.pushName}\n\n` +
    `*⌞ INFO BOT ⌝*\n` +
    `‧ Name    : ${botConfig.bot?.name || "Bot"}\n` +
    `‧ Version : ${botConfig.bot?.version || "v1.0.0"}\n` +
    `‧ Prefix  : ${m.prefix || "No Prefix"}\n\n` +
    `*⌞ CARA PAKAI ⌝*\n` +
    `‧ Klik tombol untuk melihat menu kategori\n` +
    `‧ Klik *LIHAT SEMUA MENU* untuk seluruh fitur`},
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons: zanton,
              messageParamsJson: JSON.stringify({
                bottom_sheet: {
                  in_thread_buttons_limit: 1,
                  divider_indices: [1],
                  list_title: getTimeGreeting(),
                  button_title: "𖤍",
                },
              }),
            }),
          }),
        },
      },
    }, { 
      quoted: m,
      userJid: sock.user?.id 
    });

    await sock.relayMessage(msg.key.remoteJid, msg.message, { 
      messageId: msg.key.id,
      quoted: m
    });
                } catch (v14Error) {
                    console.error('[Menu V14] Error:', v14Error.message);
                    const fallbackV14 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV14.image = imageBuffer; fallbackV14.caption = text; }
                    else { fallbackV14.text = text; }
                    await sock.sendMessage(m.chat, fallbackV14, { quoted: {
                        key: {participant: '0@s.whatsapp.net', ...(m.chat ? {remoteJid: `status@broadcast`} : {})}, message: {locationMessage: {name: `${namaOwner}`,jpegThumbnail: ""}}
                    } });
                }
                break;
            default:
                await m.reply(text);
        }
        
        const audioEnabled = db.setting('audioMenu') !== false
        if (audioEnabled) {
            const audioPath = path.join(process.cwd(), 'assets', 'audio', 'ourin.mp3');
            if (fs.existsSync(audioPath)) {
                try {
                    await sock.sendMessage(m.chat, {
                        audio: fs.readFileSync(audioPath),
                        mimetype: 'audio/mpeg',
                        contextInfo: getContextInfo(botConfig, m, thumbBuffer)
                    }, { quoted: getVerifiedQuoted(botConfig) });
                } catch (ffmpegErr) {
                    await sock.sendMessage(m.chat, {
                        audio: fs.readFileSync(audioPath),
                        mimetype: 'audio/mpeg',
                        contextInfo: getContextInfo(botConfig, m, thumbBuffer)
                    }, { quoted: getVerifiedQuoted(botConfig) });
                }
            }
        }
    } catch (error) {
        console.error('[Menu] Error on command execution:', error.message);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
