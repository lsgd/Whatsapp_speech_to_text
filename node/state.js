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

  constructor(){}

  async init(){
    if (!this.#initDone){
      console.log('Init state: Started');
      await storage.init({
        dir: env.saveStateDir,
        logging: true
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
    console.log('Save state: Finished');
  }

  async load() {
    console.log('Load state: Started');
    this.#transcribedMessages = await storage.getItem('transcribedMessages');
    this.#transcribedMessagesIds = await storage.getItem('transcribedMessagesIds') || this.#transcribedMessagesIds;
    this.#chatTranscriptionsDisabled = await storage.getItem('chatTranscriptionsDisabled') || this.#chatTranscriptionsDisabled;
    this.#globalTranscriptionDisabled = await storage.getItem('globalTranscriptionDisabled') || this.#globalTranscriptionDisabled;
    console.log('Load state: Finished');
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
