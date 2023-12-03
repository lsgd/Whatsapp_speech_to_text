const {OpenAI, toFile} = require('openai');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

// Gets API key from environment variable process.env.OPENAI_API_KEY
const openai = new OpenAI();

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

async function transcribe(binaryVoiceBuffer, voiceMessageId, message) {
    return new Promise(async (resolve, reject) => {
        const destFile = `/tmp/${message.timestamp}_${voiceMessageId}.mp3`;

        let destStream = fs.createWriteStream(destFile);
        ffmpeg(binaryVoiceBuffer)
            .setFfmpegPath(ffmpegPath)
            .audioBitrate('16k')
            .format('mp3')
            .output(destStream)
            .on('error', reject)
            .on('exit', (code, signal) => {
                console.log(`ffmpeg [exit] code:${code} signal:${signal}`);
            })
            .on('close', () => {
                console.log("ffmpeg [close]");
            })
            .on('end', async function () {
                console.log("ffmpeg [end]");
                console.log('Finished converting voice message from OGG to MP3.');
                const transcription = await openai.audio.transcriptions.create({
                    file: await toFile(binaryVoiceBuffer, destFile),
                    model: 'whisper-1',
                    response_format: 'text',
                });
                console.log(`Transcription successful! OpenAI Whisper API responded with: ${transcription.text}`);
                if (fs.existsSync(destFile)) {
                    fs.unlinkSync(destFile);
                }
                return resolve(JSON.stringify({'results': [{'filename': destFile, 'transcript': transcription.text}]}));
            })
            .run();
    });
}

exports.transcribe = transcribe;