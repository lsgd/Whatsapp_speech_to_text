// Required for terminal QRCode to authorize against WhatsApp.
const qrcode = require('qrcode-terminal');

// Required for Whatsapp Web connection.
const {Client, LocalAuth} = require('whatsapp-web.js');

const env = require('./environment');
const languages = require('./languages');
const speechWhisper = require('./speech_whisper');
const speechGoogle = require('./speech_google');
const speechOpenAI = require('./speech_openai');
const speechOpenAI4oTranscribe = require('./speech_openai_4o_transcribe');
const { state } = require('./state');

let puppeteerOptions = {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
};

let webVersionCacheOptions = undefined;
if (env.whatsappVersion) {
    webVersionCacheOptions = {
        type: 'remote',
        remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${whatsappWebVersion}.html`,
    };
}

if (env.chromiumPath) {
    puppeteerOptions['executablePath'] = env.chromiumPath;
}

if (env.userAgent) {
    puppeteerOptions.args.push(`--user-agent="${env.userAgent}"`);
}

// Setup options for the client and data path for the google chrome session
const client = new Client({
    authStrategy: new LocalAuth({dataPath: env.chromeDataPath.replace(/\/*$/, '') + '/.wwebjs_auth'}),
    puppeteer: puppeteerOptions,
    webVersionCache: webVersionCacheOptions,
});

async function init() {

    await state.init();

    if (!env.freshStateOnStart){
      console.log("Loading state on start.");
      await state.load();
    }

    // Generates a QR code in the console for authentication.
    client.on('qr', qr => {
        console.log('Generate QR code for authentication.');
        qrcode.generate(qr, {small: true});
    });

    // Log successful client connection
    client.on('ready', () => {
        console.log('WhatsApp client is ready!');
    });

    // Reply to me and contacts
    client.on('message_create', async message => {
        let [contactName, trustedContact] = await getContactInfo(message);
        if (message.fromMe) {
            // Always trust messages sent by me. I am quite trustworthy :-D
            trustedContact = true;
        }
        // Do not process the message if sender is not a trusted contact (in address book or myself).
        if (!trustedContact) {
            return;
        }

        // Generate a date and hour based on the timestamp (just for debugging)
        const [formattedTime, formattedDate] = GetDate(message.timestamp);
        console.log('\x1b[32m%s:\x1b[0m %s - %s %s', contactName, message.type, formattedDate, formattedTime);

        if (await ProcessCommandMessage(message)) {
            // Do not continue to process the message.
            return;
        }

        // Process message for voice transcription.
        await ProcessVoiceMessage(message);
    });

    client.on('message_revoke_everyone', async (message, revoked_msg) => {
        await deleteRevokedVoiceMessageTranscription(message);
        if(!revoked_msg) {
            return;
        }
        if(revoked_msg.id._serialized === message.id._serialized) {
            return;
        }
        await deleteRevokedVoiceMessageTranscription(revoked_msg);
    });

    // Initialize client
    console.log(`Initialize Whatsapp client... if it hangs try to remove the ${env.chromeDataPath}session directory`);
    await client.initialize();
}

// Return the name of the sender and if the sender is in my address book (= trusted contact).
async function getContactInfo(message) {
    // .author is only set in group chats.
    // In user-to-user chats the .from property contains the contact ID.
    let contactID = (message.author) ? message.author : message.from;
    let contact = await client.getContactById(contactID);


    return [contact.name, contact.isMyContact];
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

function getTimestampId(message) {
    return message.id.fromMe.toString() + '_' + message.id.remote + '_' + message.timestamp.toString();
}

// Checks the past 30 messages you or the bot send in a chat and deletes the related transcription to
// the deleted voice message.
async function deleteRevokedVoiceMessageTranscription(message) {
    if (!message) {
        return null;
    }
    const messageId = getTimestampId(message);

    if (!state.hasMessage(messageId)) {
        // Unrelated message got deleted.
        return null;
    }

    const responseMessage = state.getMessage(messageId);
    const chat = await client.getChatById(responseMessage.chatId);
    const messagesArray = await chat.fetchMessages({limit: 30, fromMe: true});
    for (let i = 0; i < messagesArray.length; i++) {
        if (messagesArray[i].id._serialized === responseMessage.messageId) {
            await messagesArray[i].delete(true);
            return;
        }
    }
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

    // Only return a WhatsApp message if automatic transcription is enabled and media was found.
    if (env.automaticTranscription && message.hasMedia) {
        // Do not transcribe any messages if transcription got globally disabled.
        if (state.globalTranscriptionDisabled) {
            return null;
        }
        // Do not transcribe individual chat messages where transcription got disabled.
        const chat = await message.getChat();
        let id = chat.id._serialized;
        if (state.isChatTranscriptionDisabled(id)){
            console.log(`Transcription for ${id} is disabled.`);
            return null;
        }

        return message;
    }

    if (env.transcriptionCommands.includes(message.body.trim().toLowerCase()) && message.hasQuotedMsg) {
        const quotedMsg = await message.getQuotedMessage();
        if (quotedMsg.hasMedia) {
            return quotedMsg;
        }
    }

    return null;
}

async function ProcessCommandMessage(message) {
    const command = message.body.trim().toLowerCase();
    if (!command.startsWith('!') || command.length <= 1) {
        // Not a command.
        return;
    }

    if (!message.fromMe) {
        if (command === '!help') {
            await message.reply(languages.text.commands.helpUnauthorized);
            return true;
        }

        // Only we are allowed to send commands to the bot!
        let [contactName, trustedContact] = await getContactInfo(message);
        console.log(`User "${contactName}" tried to use the bot commands.`);
        return;
    }

    const chat = await message.getChat();
    if (command === '!help') {
        await message.reply(languages.text.commands.help);
        return true;
    }
    if (command === '!status') {
        const globalStatus = state.globalTranscriptionDisabled ? languages.text.commands.disabled : languages.text.commands.enabled;
        const chatStatus = state.isChatTranscriptionDisabled(chat.id._serialized) ? languages.text.commands.disabled : languages.text.commands.enabled;
        await message.reply(languages.text.commands.status.replace('{globalStatus}', globalStatus).replace('{chatStatus}', chatStatus));
        return true;
    }
    if (command === '!transcription-global=on' || command === '!transcription-global=off') {
        state.globalTranscriptionDisabled = command.endsWith('off');
        const status = state.globalTranscriptionDisabled ? languages.text.commands.disabled : languages.text.commands.enabled;
        await message.reply(languages.text.commands.globalTranscription.replace('{status}', status));
        return true;
    }
    if (command === '!transcription=on' || command === '!transcription=off') {
        let id = chat.id._serialized;
        if (command.endsWith('off')){
          await state.disableChatTranscription(id);
        }else{
          await state.enableChatTranscription(id);
        };
        const status = command.endsWith('off') ? languages.text.commands.disabled : languages.text.commands.enabled;
        await message.reply(languages.text.commands.chatTranscription.replace('{status}', status));
        return true;
    }

    if (!env.transcriptionCommands.includes(command)) {
        console.log(`You sent an unknown command "${command}".`);
    }

    return false;
}

async function ProcessVoiceMessage(message) {
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
        message.reply(languages.text.couldNotDownloadAudio);
        return;
    }

    // Decode the base64 data (The data is a base64 string because thats the way WhatsApp.js handles media)
    const binaryVoiceBuffer = Buffer.from(attachmentData.data, 'base64');
    let callback = null;
    if (env.speechRecognitionSystem === 'google') {
        callback = speechGoogle.transcribe;
    } else if (env.speechRecognitionSystem === 'openai') {
        callback = speechOpenAI.transcribe;
    }  else if (env.speechRecognitionSystem === 'openai4o') {
        callback = speechOpenAI4oTranscribe.transcribe;
    } else {
        callback = speechWhisper.transcribe;
    }
    callback(binaryVoiceBuffer, messageId, message)
        .then(async (body) => {
            const data = JSON.parse(body);
            for (const result of data.results) {
                const transcript = result.transcript;
                let responseMessage = await voiceMessage.reply(languages.text.successHeader + transcript);
                // Mark chat as unread to not send miss voice messages
                await chat.markUnread();
                try{
                  let id = getTimestampId(voiceMessage);
                  await state.trackMessage(id, {
                      messageId: responseMessage.id._serialized,
                      chatId: chat.id._serialized,
                  });
                } catch (err) {
                  console.log(`Error while caching message id: ${err}`);
                  console.log(err.stack);
                }
            }
        })
        .catch((err) => {
            console.error(err);
            voiceMessage.reply(languages.text.errorHeader);
        });
}

// Start the script.
init();
