const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const { uploadToTmpFiles } = require("../../src/lib/ourin-tmpfiles");
const te = require('../../src/lib/ourin-error')

const pluginConfig = {
  name: "fakeml",
  alias: ["mlbbfake", "mlcard", "mlfake"],
  category: "canvas",
  description: "Crear tarjeta de perfil fake de ML",
  usage: ".fakeml <nombre> (responder/enviar foto)",
  example: ".fakeml Misaki",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

let fontRegistered = false;

console.log('INI COMMAND')

async function handler(m, { sock }) {
  const name = m.text?.trim();

  if (!name) {
    return m.reply(
      `🎮 *ꜰᴀᴋᴇ ᴍʟ ᴘʀᴏꜰɪʟᴇ*\n\n` +
        `> Ingresa un nombre para el perfil\n\n` +
        `*ᴄᴏᴍᴏ ᴜsᴀʀ:*\n` +
        `> 1. Envía una foto + caption \`${m.prefix}fakeml <nombre>\`\n` +
        `> 2. Responde a una foto con \`${m.prefix}fakeml <nombre>\``,
    );
  }

  let buffer = null;

  if (
    m.quoted &&
    (m.quoted.type === "imageMessage" || m.quoted.mtype === "imageMessage")
  ) {
    try {
      buffer = await m.quoted.download();
    } catch (e) {
      m.reply(te(m.prefix, m.command, m.pushName));
    }
  } else if (m.isMedia && m.type === "imageMessage") {
    try {
      buffer = await m.download();
    } catch (e) {
      m.reply(te(m.prefix, m.command, m.pushName));
    }
  } else {
    try {
      let te = await sock.profilePictureUrl(m.sender, "image")
      buffer = Buffer.from((await axios.get(te, { responseType: "arraybuffer" })).data)
    } catch (error) {
      buffer = fs.readFileSync('./assets/images/pp-kosong.jpg')
    }
  }

  if (!buffer) {
    return m.reply(`❌ Envía/responde a una imagen para usar como avatar!`);
  }

  m.react("🕕");

  try {
    const gmbr = await uploadToTmpFiles(buffer, {
      filename: "image.jpg",
      contentType: "image/jpeg",
    });

    await sock.sendMedia(m.chat, `https://api.nexray.web.id/maker/fakelobyml?avatar=${encodeURIComponent(gmbr.directUrl)}&nickname=${encodeURIComponent(name)}`, null, m, {
      type: 'image',
    });

    m.react("✅");
  } catch (error) {
    m.react("❌");
    m.reply(`Inténtalo de nuevo`);
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};
