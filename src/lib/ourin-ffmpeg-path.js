const { execSync } = require('child_process')

let resolvedPath = null

function getFFmpegPath() {
    if (resolvedPath) return resolvedPath

    try {
        const installer = require('@ffmpeg-installer/ffmpeg')
        if (installer && installer.path) {
            resolvedPath = installer.path
            return resolvedPath
        }
    } catch {}

    try {
        const systemPath = execSync('which ffmpeg', { encoding: 'utf8' }).trim()
        if (systemPath) {
            resolvedPath = systemPath
            return resolvedPath
        }
    } catch {}

    try {
        const systemPath = execSync('where ffmpeg', { encoding: 'utf8' }).trim().split('\n')[0].trim()
        if (systemPath) {
            resolvedPath = systemPath
            return resolvedPath
        }
    } catch {}

    resolvedPath = 'ffmpeg'
    return resolvedPath
}

function getFFmpeg() {
    const ffmpeg = require('fluent-ffmpeg')
    ffmpeg.setFfmpegPath(getFFmpegPath())
    return ffmpeg
}

module.exports = { getFFmpegPath, getFFmpeg }
