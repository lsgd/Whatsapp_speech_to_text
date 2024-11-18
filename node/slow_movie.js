const {MessageMedia} = require('whatsapp-web.js');
const { spawn } = require('node:child_process');

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
  
  //timeoutId = setTimeout(async () => await draw(state, client), timeout);
  timeoutId = setTimeout(async () => await draw_single(state, client), timeout);
}

async function draw_single(state, client){
  timeoutId = null;
  id = state.pictureId;
  const file_name = `/media/single.png`;
  const movie_name = `/media/fly.mp4`;
  const frame_mult = 8;
  console.log(`Drawing now (${id}) ${file_name}`);
  media = null;
  try{
    if (!extract_frame(movie_name, id * frame_mult, file_name)){
      console.log("Loading media");
      media = MessageMedia.fromFilePath(file_name);
    }else{
      console.log("Extraction failed");
    }
  } catch(error) {
    console.error(error);
  }
  if (media!=null){
    console.log("Setting profile picture");
    await client.setProfilePicture(media);
    state.pictureId = id+1;
    state.save();
  }
}



function extract_frame(movie, frame_no, file_out){
  console.log(`Extracting frame ${frame_no} from ${movie} to ${file_out}`);
  const res = spawn("ffmpeg",["-i", movie, "-vf", `select=eq(n\\,${frame_no})`, "-frames:v", "1", "-update", "true", "-y", file_out]); 
  //const res = spawn("ffmpeg",["-filters"]);
  err = false;
  //res.stdout.on('data', (data) => { console.log(`stdout: ${data}`); });
  //res.stderr.on('data', (data) => { console.error(`stderr: ${data}`); /*err=true;*/ });
  res.on('close', (code) => { console.log(`done (${code})`);});
  return err;
}

exports.next_frame = _next_frame;
