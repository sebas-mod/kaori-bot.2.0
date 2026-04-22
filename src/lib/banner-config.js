const fs = require('fs')
const path = require('path')

const FILE = path.join(process.cwd(), 'banner-config.json')

function readBannerConfig() {
    try {
        return JSON.parse(fs.readFileSync(FILE, 'utf8'))
    } catch {
        return {
            menu: { banner: '', creator: '', creatorName: '', audio: '' },
            welcome: { banner: '', creator: '', creatorName: '', audio: '' },
            bye: { banner: '', creator: '', creatorName: '', audio: '' }
        }
    }
}

function getBanner(section) {
    const config = readBannerConfig()
    return config[section] || {}
}

module.exports = {
    readBannerConfig,
    getBanner
}
