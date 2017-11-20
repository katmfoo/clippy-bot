const Discord = require('discord.js');
const client = new Discord.Client();
const axios = require('axios');

// discord user token
const discordToken = "";

// the URL of the API to get new videos from streamable user
const streamableGalleryApiUrl = 'http://ec2-34-203-215-132.compute-1.amazonaws.com';

// the interval of seconds to check for new clips
const checkNewInterval = 60;

// represents the time of the last new clip upload
let clipLastUploadedTime;

/*
 * Returns an array of all clips that have been fully uploaded and processed
 * with most recent towards the front of the array
 */
var fetchLatestClips = function() {
  return new Promise((resolve, reject) => {
    // make http request to streamable-gallery-api
    axios.get(streamableGalleryApiUrl).then((response) => {
      // resolve on all clips that are done uploading and processing
      resolve(response.data.videos.filter((clip) => {
        // if a clip mp4 and mp4-mobile files statuses are both 2, they can
        // be returned
        if (clip.files['mp4'] && clip.files['mp4-mobile']) {
          return clip.files['mp4'].status == 2 && clip.files['mp4-mobile'].status == 2;
        } else {
          return false;
        }
      }));
    }).catch((error) => {
      reject(error);
    });
  });
};

/*
 * Checks for any new clips by filtering the latest clips by date_added
 * greater than the last new clip's date_added
 */
var checkForNewClip = function() {
  // grab all latest clips
  fetchLatestClips().then((clips) => {
    // filter them by date_added greater than last new clip's date_added,
    // reverse so groups of multiple clips will get displayed in the order
    // they were added
    let newClips = clips.filter((clip) => {
      return clip.date_added > clipLastUploadedTime;
    }).reverse();

    // for each new clip
    newClips.forEach((clip) => {
      sendNewClip(clip);
    });

    // the last clip in the newClips array is the one that was uploaded
    // most recent, so check if it exists and set the clipLastUploadedTime
    // to its date_added
    if (newClips[newClips.length - 1]) {
      clipLastUploadedTime = newClips[newClips.length - 1].date_added;
    }
  }).catch((error) => {
    console.log(error);
  });
};

/*
 * Gets called when a new clip is found
 */
var sendNewClip = function(clip) {
  let message = "__**New clip uploaded**__: \"" + clip.title + "\"\n\n*View more clips at* http://patricheal.com/clips/\n\n" + clip.url;
  client.guilds.forEach((guild) => {
    guild.defaultChannel.send(message);
  });
};

// when discord API is ready
client.on('ready', () => {
  console.log('Discord API is ready');

  // grab the latest clip on startup so we can set an initial value
  // for clipLastUploadedTime
  fetchLatestClips().then((clips) => {
    clipLastUploadedTime = clips[0].date_added;

    // set recurring check for new clips to on
    setInterval(checkForNewClip, checkNewInterval * 1000);
  }).catch((error) => {
    console.log(error);
  });
});

// log into discord API
client.login(discordToken);