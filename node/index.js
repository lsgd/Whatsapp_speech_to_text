const fs = require('fs');

// Required for Terminal QRCode
const qrcode = require('qrcode-terminal');

// Required for POST request to api
const request = require('request');

// Required for Whatsapp Web connection
const { Client, LocalAuth } = require('whatsapp-web.js');

// Required for ENV Setup
const process = require('node:process');

// Setup ENV variables so it can run on docker and also as standalone
if (process.env.HOST_ADDRESS && process.env.CHROME_DATA_PATH) {
	apiHost = process.env.HOST_ADDRESS;
	dataPath = process.env.CHROME_DATA_PATH;
} else {
	apiHost = "127.0.0.1";
	dataPath = "./"
}

// Setup options for the client and data path for the google chrome session
const client = new Client({
	authStrategy: new LocalAuth({ dataPath: dataPath }),
	puppeteer: {
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	}
});

// Header that the reply message will have, following by the transcription
const responseMsgHeader = "This is an automatic transcription of the voice message:"
const responseMsgHeaderError = "An error ocurred with the automatic transcription of the voice message."

// Initialize client
client.initialize();

// Generates a qr in the console (for authentication)
client.on('qr', qr => {
	qrcode.generate(qr, {small: true});
});

//Log successful client connection
client.on('ready', () => {
	console.log('Client is ready!');
});

// Main
// Reply to me and contacts
client.on('message_create', async message => {
	let [Contact, Listed] = await ContactsWhiteList(message.from);
	if (message.fromMe) {
		Listed = 1;
	}
	// Listed variable returns 1 if contact it's in contact list or me
	if (Listed === 1) {
		//Mensajes automatizados
		AutomatedMessages(message);

		// Generate a date and hour based on the timestamp (just for debug)
		const [formattedTime, formattedDate] = GetDate(message.timestamp);

		console.log('\x1b[32m%s:\x1b[0m %s \x1b[5m%s\x1b[0m', Contact, message.type, formattedTime);
	}
});

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
		var date = new Date(timestamp * 1000);
		var year = date.getFullYear();
		var month = date.getMonth();
		var day = date.getDate();
		var hours = date.getHours();
		var minutes = "0" + date.getMinutes();
		var seconds = "0" + date.getSeconds();

		var formattedDate = day+"-"+month+"-"+year;
		var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

		return [formattedTime, formattedDate];
}

// TODO: when replied with !tran, the worker will transcribe only the audio quoted
async function AutomatedMessages(message) {

	if(message.body == '!tran' && message.hasQuotedMsg){		
		const quotedMsg = await message.getQuotedMessage();
		// Check if the quoted message has media
		if (quotedMsg.hasMedia) {
		  // Download the media to a buffer
		  const mediaData = await quotedMsg.downloadMedia();
		  // Do something with the media data, e.g. save it to a file
		  console.log(quotedMsg.chatId);
		  message.reply("mediaData.body", );
		}
	}

	let chat = message.getChat();
	//Descarga los archivos de media
	if (message.hasMedia) {
	 	const attachmentData = await message.downloadMedia();
	 	//Mensaje si el mensaje es un archivo de media
	 	if (message.type.includes("ptt") || message.type.includes("audio")) {
	 		// SpeechToTextTranscript(attachmentData.data, message);
			SpeechToTextTranscript(attachmentData.data, message)
				.then((body) => {
					console.log(body); // Handle the returned data here
					const data = JSON.parse(body);
					for (const result of data.results) {
						const transcript = result.transcript;
						console.log(transcript);
						message.reply(responseMsgHeader + "\n\n" + transcript);
					}
				})
				.catch((err) => {
					console.error(err); // Handle the error here
					message.reply(responseMsgHeaderError);
				});
	 		(await chat).markUnread();
	 	}
	}
}

// Text to speech function
async function SpeechToTextTranscript(base64data, message) {
	const decodedBuffer = Buffer.from(base64data, 'base64');

	// Send the decoded binary file to the Flask API
	return new Promise((resolve, reject) => {
		request.post({
			url: 'http://'+ apiHost +':5000',
			formData: {
			file: {
			  value: decodedBuffer,
			  options: {
				filename: message.from + message.timestamp
			  }
			}
		  }
		}, function(err, httpResponse, body) {
			if (err) {
				console.error(err);
			} else {
				console.log('Upload successful! Server responded with:', body);
			}
			resolve(body);
		});
	});
}
