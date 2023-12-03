const fs = require('fs');

// Required for terminal QRCode to authorize against WhatsApp.
const qrcode = require('qrcode-terminal');

// Required for Whatsapp Web connection.
const {Client, LocalAuth} = require('whatsapp-web.js');

const env = require('./environment');
const speechWhisper = require('./speech_whisper');
const speechGoogle = require('./speech_google');

// Setup options for the client and data path for the google chrome session
const client = new Client({
    authStrategy: new LocalAuth({dataPath: env.chromeDataPath}),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Header that the reply message will have, following by the transcription
const responseMsgHeader = "*Transkript:*\n";
const responseMsgHeaderError = "*Fehler:* Die Sprachnachricht konnte nicht transkribiert werden."

async function init() {
    // Initialize client
    await client.initialize();

    // Generates a QR code in the console for authentication.
    client.on('qr', qr => {
        qrcode.generate(qr, {small: true});
    });

    // Log successful client connection
    client.on('ready', () => {
        console.log('Client is ready!');
    });

    // Reply to me and contacts
    client.on('message_create', async message => {
        let [contact, listed] = await ContactsWhiteList(message.from);
        if (message.fromMe) {
            listed = 1;
        }
        // Listed variable returns 1 if contact is in contact list or me
        if (listed === 1) {
            // Generate a date and hour based on the timestamp (just for debug)
            const [formattedTime, formattedDate] = GetDate(message.timestamp);
            console.log('\x1b[32m%s:\x1b[0m %s \x1b[5m%s\x1b[0m', contact, message.type, formattedTime);
            //Process message for voice transcription.
            await ProcessMessage(message);
        }
    });
}

// Contact white list. If the sender is your contact, the audio file will be transcript
async function ContactsWhiteList(Contact) {
    let ContactInfo = await client.getContactById(Contact);
    Contact = ContactInfo.name

    if (ContactInfo.isMyContact) {
        return [Contact, 1];
    } else {
        return [Contact, 0];
    }
}

// Date and hour based on the timestamp of the mesage (unix time)
function GetDate(timestamp) {
    const date = new Date(timestamp * 1000);

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;
    const formattedTime = `${hours}:${minutes}:${seconds}`;

    return [formattedTime, formattedDate];
}

// This function handles the missing media in the chat by retrieving messages from the chat until the media is available
async function downloadQuotedMedia(quotedMsg, messageId, chat, maxRetries = 5) {
    let attachmentData = null;
    let counter = 10;

    while (!attachmentData && counter <= maxRetries) {
        try {
            const quotedMsgArr = await chat.fetchMessages({limit: counter});
            for (let i = 0; i < quotedMsgArr.length; i++) {
                if (quotedMsgArr[i].id._serialized === messageId) {
                    attachmentData = await quotedMsg.downloadMedia();
                    break;
                }
            }
        } catch (err) {
            console.warn(`Error fetching messages. Retrying in 5 seconds... (attempt ${counter}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        counter++;
    }

    if (!attachmentData) {
        console.log(`Could not download media after ${maxRetries} attempts.`);
    }

    return attachmentData;
}

async function getMessageToTranscribe(message) {
    if (!message) {
        return null;
    }

    // Only return a WhatsApp message if media was found.
    if (env.automaticTranscription && message.hasMedia) {
        return message;
    }

    if (message.body == '!tran' && message.hasQuotedMsg) {
        const quotedMsg = await message.getQuotedMessage();
        if (quotedMsg.hasMedia) {
            return quotedMsg;
        }
    }

    return null;
}

async function ProcessMessage(message) {
    const voiceMessage = await getMessageToTranscribe(message);

    // The provided message and a possible quoted message weren't of type voice message.
    if (!voiceMessage) {
        return;
    }

    // Bail out early if the message does not contain audio.
    if (!voiceMessage.type.includes("ptt") && !voiceMessage.type.includes("audio")) {
        return;
    }

    const chat = await message.getChat();
    const messageId = voiceMessage.id._serialized;

    // If it is a voice message, we download it and send it to the api
    const attachmentData = await downloadQuotedMedia(voiceMessage, messageId, chat, maxRetries = 1000);
    if (!attachmentData) {
        message.reply("Die Sprachnachricht konnte nicht geladen werden");
        return;
    }

    // Decode the base64 data (The data is a base64 string because thats the way WhatsApp.js handles media)
    const binaryVoiceBuffer = Buffer.from(attachmentData.data, 'base64');
    let callback = env.speechRecognitionSystem === 'google' ? speechGoogle.transcribe : speechWhisper.transcribe;
    callback(binaryVoiceBuffer, message)
        .then((body) => {
            const data = JSON.parse(body);
            for (const result of data.results) {
                const transcript = result.transcript;
                chat.sendMessage(responseMsgHeader + transcript, {
                    quotedMessageId: messageId
                });
            }
        })
        .catch((err) => {
            console.error(err);
            chat.sendMessage(responseMsgHeaderError, {
                quotedMessageId: messageId
            });
        });
}

// Start the script.
init();