var socket = io();

// Copy room code
var btn = document.getElementById('btn');
var clipboard = new ClipboardJS(btn);


// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormButton = document.querySelector("#submit-button");
const $leaveButton = document.querySelector("#leave-button");
const $messageFormInput = document.querySelector("#inputMessage");
const $urlForm = document.querySelector("#url-form");
const $messages = document.querySelector('#messages');
const $users = document.querySelector('#users');
const $videoTitle = document.querySelector("#video-title");
const $channelName = document.querySelector("#channel-name");
const $videos = document.querySelector('#videos');
const $nextVideo = document.querySelector("#next-video")
const $greet = document.querySelector("#greeting")

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const userTemplate = document.querySelector("#user-template").innerHTML;
const videoTemplate = document.querySelector("#video-template").innerHTML;


// Fetch user details
const params = new URLSearchParams(window.location.search);
var username = params.get('username');
var roomid;
var role;
var finished = false;
$greet.innerHTML = "Welcome, " + username
initialSetup();


async function initialSetup() {
    if (params.has('roomid')) {
        role = 'GUEST';
        roomid = params.get('roomid');

        socket.emit("joinRoom", { username, roomid, role });
        document.getElementById("roomid").value = roomid;
        $urlForm.style.visibility = "hidden"
        $nextVideo.style.visibility = "hidden"

    } else {
        role = 'ADMIN';
        socket.emit("createRoom", { username, role });
        socket.on("getRoomID", (id) => {
            roomid = id;
            document.getElementById("roomid").value = id;
        })
    }
}



// Socket communication
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    $messageFormButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.inputMessage.value;

    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if (error) {
            console.log(error);
        }
    })
})

// gets the videoID from URL (string) 
function getYouTubeVideoId(url) {
    const regex = /(?:\?v=|\/embed\/|youtu\.be\/|\/watch\?t=.*?&v=)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}


var playlistQueue = [];

function displayPlaylist() {
    $videos.innerHTML = ''
    for (var idx = 0; idx < playlistQueue.length; idx++) {
        const video = playlistQueue[idx]
        const html = Mustache.render(videoTemplate, {
            thumbnail_url: video.thumbnail_url,
            title: video.title
        })
        $videos.insertAdjacentHTML('beforeend', html)
    }
}

function playNextVideo() {
    if (playlistQueue.length > 0) {

        const nextVideo = playlistQueue.shift()
        player.cueVideoById(getYouTubeVideoId(nextVideo.video_url), 0)
        $videoTitle.innerHTML = nextVideo.title
        $channelName.innerHTML = nextVideo.channel

        displayPlaylist()
    }
}

function addVideo() {

    const url = $urlForm.elements['url'].value

    const Http = new XMLHttpRequest();
    const requestUrl = 'https://www.youtube.com/oembed?url=' + url + '&format=json';
    Http.open("GET", requestUrl);
    Http.send();

    Http.onreadystatechange = (e) => {
        if (Http.readyState == 4 && Http.status == 200) {
            const res = JSON.parse(Http.responseText)

            const video = {
                title: res.title,
                channel: res.author_name,
                thumbnail_url: res.thumbnail_url,
                video_url: url
            }

            playlistQueue.push(video);
            socket.emit("playlistUpdated", playlistQueue)
            displayPlaylist()
        }
    }

    $urlForm.elements['url'].value = ''

}

$nextVideo.onclick = function () {
    playNextVideo()
    socket.emit("playNextVideo")
}


$urlForm.addEventListener('submit', (event) => {
    event.preventDefault()
    addVideo()
})

$leaveButton.onclick = function () {
    socket.emit("leaveRoom", username, roomid);
    socket.disconnect();
    console.log('User has left the room');

    window.location.href = '/';
}




//YOUTUBE IFRAME API

// this code loads the IFrame Player API code asynchronously
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// this function creates an <iframe> (and YouTube player)
// after the API code downloads.
var player;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '450',
        width: '800',
        videoId: 'n_Cn8eFo7u8',
        playerVars: {
            'playsinline': 1,
            'start': 0,
            'disablekb': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });

    // disable pointer events for guest users
    if (role === 'GUEST') {
        const iframe = document.querySelector('.video-container iframe');
        iframe.classList.add('unclickable');
    }
}

// the API will call this function when the video player is ready
function onPlayerReady(event) {
    event.target.pauseVideo();
    socket.emit("getLatestTime")
}

function onPlayerStateChange(event) {

    if (event.data === YT.PlayerState.PAUSED) {
        if (role === 'ADMIN') {
            const currentStatus = {
                currentTime: player.getCurrentTime(),
                videoId: null
            }
            socket.emit("videoPaused", currentStatus)
        }
    }

    if (event.data === YT.PlayerState.PLAYING) {
        if (role === 'ADMIN') {
            const currentStatus = {
                currentTime: player.getCurrentTime(),
                videoId: null
            }
            socket.emit("videoPlaying", currentStatus)
        }
    }

    if (event.data === YT.PlayerState.ENDED) {
        playNextVideo()
    }

}


// SOCKET EVENTS

socket.on("videoPaused", (currentStatus) => {
    if (currentStatus.videoId) {
        player.loadVideoById(currentStatus.videoId, currentStatus.currentTime)
    } else {
        player.seekTo(currentStatus.currentTime, true)
    }
    player.pauseVideo();
})

socket.on("videoPlaying", (currentStatus) => {
    if (currentStatus.videoId) {
        player.loadVideoById(currentStatus.videoId, currentStatus.currentTime)
    } else {
        player.seekTo(currentStatus.currentTime, true)
        player.playVideo();
    }
})

socket.on("getLatestTime", () => {
    const currentStatus = {
        currentTime: player.getCurrentTime(),
        videoId: getYouTubeVideoId(player.getVideoUrl())
    }

    if (currentStatus.currentTime > 0) {
        if (player.getPlayerState() == 1) {
            socket.emit("videoPlaying", currentStatus)
        } else if (player.getPlayerState() == 2) {
            socket.emit("videoPaused", currentStatus)
        }
    }
})

socket.on("playNextVideo", () => {
    playNextVideo()
})

socket.on("playlistUpdated", (updatedPlaylist) => {
    playlistQueue = updatedPlaylist
    displayPlaylist()
})


socket.on("getUpdatedPlaylist", () => {
    socket.emit("playlistUpdated", playlistQueue)
})


socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('roomUsersList', (usersList) => {
    const list = usersList.usersList;
    $users.innerHTML = ''
    for (var index = 0; index < list.length; index++) {
        var username = list[index].username
        var role = list[index].role

        const html = Mustache.render(userTemplate, {
            username: username,
            role: role
        })
        $users.insertAdjacentHTML('beforeend', html)
    }
})