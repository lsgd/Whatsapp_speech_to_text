const {MessageMedia} = require('whatsapp-web.js');

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

var timeoutId = null;
async function draw(state, client){
  timeoutId = null;
  id = state.pictureId;
  ids = ("0000000000" + id).slice(-10);
  file_name = `/media/frames/BadApple${ids}.png`;
  console.log("Drawing now " + file_name);
  media = null;
  try{
    media = MessageMedia.fromFilePath(file_name);
  } catch(error) {
    console.error(error);
  }
  if (media!=null){
    await client.setProfilePicture(media);
    state.pictureId = id+1;
    state.save();
  }
}

_next_frame = (state, client) => {
  timeout = 5000 + getRandomInt(10)*1000;
  console.log("Drawing next frame in " + timeout/1000);
  if (timeoutId){
      clearTimeout(timeoutId);
  }
  
  timeoutId = setTimeout(async () => await draw(state, client), timeout);
}

exports.next_frame = _next_frame;
