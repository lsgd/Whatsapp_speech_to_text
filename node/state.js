const env = require('./environment');
const storage = require('node-persist');


class State {
  // Key = Voice Message ID, Value = Response from bot.
  #transcribedMessages = {};
  // Track message id by order of insertion.
  #transcribedMessagesIds = [];
  // Max number of messages to track.
  #transcribedMessagesCacheSize = 100;

  // Set of chat with transcription disabled
  #chatTranscriptionsDisabled = {};
  #globalTranscriptionDisabled = false;

  #initDone = false;
  pictureId = 1;

  constructor(){}

  async init(){
    if (!this.#initDone){
      console.log('Init state: Started');
      await storage.init({
        dir: env.saveStateDir,
	//logging: true
      });
      console.log('Init state: Finished');
    }
    this.#initDone = true;
  }


  async save() {
    console.log('Save state: Started');
    await storage.setItem('transcribedMessages', this.#transcribedMessages);
    await storage.setItem('transcribedMessagesIds', this.#transcribedMessagesIds);
    await storage.setItem('chatTranscriptionsDisabled', this.#chatTranscriptionsDisabled);
    await storage.setItem('globalTranscriptionDisabled', this.#globalTranscriptionDisabled);
    await storage.setItem('pictureId', this.pictureId);
  }

  async load() {
    try {
      this.#transcribedMessages = await storage.getItem('transcribedMessages');
    }
    catch (err) {
        console.log(`Failed to fetch state of transcribedMessage, fallback to empty list.`);
        this.#transcribedMessages = {};
    }
    try {
      this.#transcribedMessagesIds = await storage.getItem('transcribedMessagesIds') || this.#transcribedMessagesIds;
    }
    catch (err) {
        console.log(`Failed to fetch state Of transcribedMessagesIds, fallback to empty list.`);
        this.#transcribedMessagesIds = [];
    }
    try {
      this.#chatTranscriptionsDisabled = await storage.getItem('chatTranscriptionsDisabled') || this.#chatTranscriptionsDisabled;
    }
    catch (err) {
        console.log(`Failed to fetch state of chatTranscriptionsDisabled, fallback to empty list.`);
        this.#transcribedMessagesIds = {};
    }
    try {
      this.#globalTranscriptionDisabled = await storage.getItem('globalTranscriptionDisabled') || this.#globalTranscriptionDisabled;
    }
    catch (err) {
        console.log(`Failed to fetch state of globalTranscriptionDisabled, fallback to empty list.`);
        this.#globalTranscriptionDisabled = false;
    }
    try {
      this.pictureId = await storage.getItem('pictureId') || this.pictureId;
    }
    catch (err) {
        console.log(`Failed to fetch state of pictureId, fallback to 1.`);
        this.pictureId = 1;
    }
    
    console.log("State loaded");
  }

  getMessage(id){
    return this.#transcribedMessages[id];  
  }

  hasMessage(id){
    return id in this.#transcribedMessages; 
  }

  async trackMessage(id, data){
    this.#transcribedMessages[id] = data;
    this.#transcribedMessagesIds.push(id);
    if (this.#transcribedMessagesIds.length > this.#transcribedMessagesCacheSize){
      let toRemove = this.#transcribedMessagesIds.shift();
      delete this.#transcribedMessages[toRemove];
    }
    await this.save();
  }

  isChatTranscriptionDisabled(chatId){
    return chatId in this.#chatTranscriptionsDisabled;
  }

  async disableChatTranscription(chatId){
    this.#chatTranscriptionsDisabled[chatId] = true;
    await this.save();
  }

  async enableChatTranscription(chatId){
    if (chatId in this.#chatTranscriptionsDisabled) {
      delete this.#chatTranscriptionsDisabled[chatId];
    }
    await this.save();
  }

  get globalTranscriptionDisabled(){
    return this.#globalTranscriptionDisabled;
  }
  
  set globalTranscriptionDisabled(val){
    this.#globalTranscriptionDisabled = val;
    this.save();
  }
 }

const _state = new State();
exports.state = _state;
