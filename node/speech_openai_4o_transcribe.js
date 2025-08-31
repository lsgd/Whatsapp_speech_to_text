const {OpenAI, toFile} = require('openai');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const env = require("./environment");

let openai = undefined;
if (env.speechRecognitionSystem === 'openai4o') {
    // Gets API key from environment variable process.env.OPENAI_API_KEY
    openai = new OpenAI();
}

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

async function transcribe(binaryVoiceBuffer, voiceMessageId, message) {
    return new Promise(async (resolve, reject) => {
        const srcFile = `/tmp/${message.timestamp}_${voiceMessageId}.ogg`;
        const destFile = `/tmp/${message.timestamp}_${voiceMessageId}.mp3`;
        fs.writeFileSync(srcFile, binaryVoiceBuffer);

        ffmpeg(srcFile)
            .setFfmpegPath(ffmpegPath)
            .audioBitrate('16k')
            .format('mp3')
            .output(destFile)
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
                if (fs.existsSync(srcFile)) {
                    fs.unlinkSync(srcFile);
                }
                const transcription = await openai.audio.transcriptions.create({
                    file: fs.createReadStream(destFile),
                    model: 'gpt-4o-transcribe',
                    response_format: 'json',
                });
                console.log(`Transcription successful! Detected language: ${transcription.language}.\nText: ${transcription.text}`);
                let text = transcription.text;

                if (transcription.language && env.openAITranslateToEnglish && !env.openAIExcludedTranslationLanguages.includes(transcription.language.toLowerCase())) {
                    const translation = await openai.audio.translations.create({
                        file: fs.createReadStream(destFile),
                        model: 'gpt-4o-transcribe',
                        response_format: 'json',
                    });
                    text = translation.text;
                    console.log(`Translation successful!\nText: ${text}`);
                }

                if (fs.existsSync(destFile)) {
                    fs.unlinkSync(destFile);
                }
                return resolve(JSON.stringify({'results': [{'filename': destFile, 'transcript': text}]}));
            })
            .run();
    });
}

exports.transcribe = transcribe;