const {MessageMedia} = require('whatsapp-web.js');
const { spawn } = require('node:child_process');
const env = require('./environment');
const path = require('node:path');

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

var processingFrame = false;
var timeoutId = null;
async function draw(state, client){
  timeoutId = null;
  id = state.pictureId;
  ids = ("0000000000" + id).slice(-10);
  file_name = `/app/media/frames/BadApple${ids}.png`;
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
  timeout = 15000 + getRandomInt(30)*1000;
  console.log("Drawing next frame IN " + timeout/1000);
  if (timeoutId){
      clearTimeout(timeoutId);
  }
  
  //timeoutId = setTimeout(async () => await draw(state, client), timeout);
  timeoutId = setTimeout(async () => await draw_single(state, client), timeout);
}

async function draw_single(state, client){
  media = null;
  timeoutId = null;
  if (env.slowMovieFrames != null){
    padded_id = state.pictureId.toString().padStart(6, "0");
    media_file = path.join(env.slowMovieFrames, `frame_${padded_id}.jpg`);
    console.log(`Loading image from ${media_file}`);
    try{
      media = MessageMedia.fromFilePath(media_file);
    } catch(error) {
      console.error(error);
    }
  }
  else{
    id = state.pictureId;
    const file_name = `/app/media/single.png`;
    const movie_name = env.slowMovieFile;
    const frame_mult = env.slowMovieSkipFrames;
    console.log(`Drawing now (${id}) ${file_name}`);
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
  }
  if (media!=null){
    console.log("Setting profile picture");
    await client.setProfilePicture(media);
    state.pictureId += 1;
    state.save();
  }
}



function extract_frame(movie, frame_no, file_out){
  if (processingFrame){
    console.log("Already processing: skipping");
    return 1;
  }
  processingFrame = true;
  console.log(`Extracting frame ${frame_no} from ${movie} to ${file_out}`);
  //const res = spawn("ffmpeg",["-i", movie, "-vf", `select=eq(n\\,${frame_no})`, "-frames:v", "1", "-update", "true", "-y", file_out]); 
  const font='/usr/share/fonts/inconsolata/Inconsolata-Regular.otf';
  console.log(["ffmpeg", "-i", movie, "-vf", `select=eq(n\\,${frame_no}),drawtext=fontsize=10:fontfile=${font}:text='%{eif\\:${frame_no}\\:d}':x=(w-tw)/2:y=h-(2*lh):fontcolor=white:box=1:boxcolor=0x00000099`, "-frames:v", "1", "-update", "true", "-y", file_out].join(" ")); 
  const res = spawn("ffmpeg",["-i", movie, "-vf", `select=eq(n\\,${frame_no}),drawtext=fontsize=10:fontfile=${font}:text='%{eif\\:${frame_no}\\:d}':x=(w-tw)/2:y=h-(2*lh):fontcolor=white:box=1:boxcolor=0x00000099`, "-frames:v", "1", "-update", "true", "-y", file_out]); 
  err = false;
  //res.stdout.on('data', (data) => { console.log(`stdout: ${data}`); });
  //res.stderr.on('data', (data) => { console.error(`stderr: ${data}`); /*err=true;*/ });
  res.on('close', (code) => { processingFrame = false; console.log(`done (${code})`);});
  return err;
}

exports.next_frame = _next_frame;
