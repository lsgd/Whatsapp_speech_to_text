import OpenAI, {toFile} from 'openai';

// Gets API key from environment variable process.env.OPENAI_API_KEY
const openai = new OpenAI();
let ffmpeg = require('fluent-ffmpeg')
let fs = require('fs')

async function transcribe(binaryVoiceBuffer: Buffer, voiceMessageId, message) {
    return new Promise(async (resolve, reject) => {
        const destFile = `/tmp/${message.timestamp}_${voiceMessageId}.mp3`;
        ffmpeg(binaryVoiceBuffer)
            .audioBitrate('16k')
            .format('mp3')
            .output(destFile)
            .on('end', async function () {
                console.log('Finished converting voice message from OGG to MP3.');
                const transcription = await openai.audio.transcriptions.create({
                    file: await toFile(binaryVoiceBuffer, destFile),
                    model: 'whisper-1',
                    response_format: 'text',
                });
                console.log(`Transcription successful! OpenAI Whisper API responded with: ${transcription.text}`);
                if(fs.existsSync(destFile)) {
                    fs.unlinkSync(destFile);
                }
                resolve(JSON.stringify({'results': [{'filename': destFile, 'transcript': transcription.text}]}));
            })
            .run();
    });
}

exports.transcribe = transcribe;