# Youtube-Party
A video synchronization platform where you can create rooms, watch YouTube videos, and chat with your friends in real time.

# How does it work?
- Create a room and share the automatically generated Room ID with your friends.
- Use the Room ID and join the room to start the party!
- Enter the URL of the YouTube video you want to watch (only the admin can do this).
- Start watching the video while the playback is synchronized automatically.
- Create a playlist to watch more videos.


# Getting started
- Clone the repository
```
git clone --depth=1 https://github.com/vishalsalgond/YouTube-Party.git <project_name>
```

- Install dependencies
```
cd <project_name>
npm install
```

- Build and run the project
```
npm run build
npm start
```
Or, if you're using VS Code, you can use `cmd + shift + b` to run the default build task (which is mapped to `npm run build`), and then you can use the command palette (`cmd + shift + p`) and select `Tasks: Run Task` > `npm: start` to run `npm start` for you.

### Build and run the project as a docker container
```
docker build -t yt-app .
docker run -p 3000:3000 yt-app
```

# YouTube Party Screenshots

<div align="center">
<h4 align="center">Home Page</h4>
<img src="./public/images/Home Page.png" width=900px/>
<br>
<h4 align="center">Room Page</h4>
<img src="./public/images/Room Page.png" width=900px/>
<br>
<h4 align="center">Video Sync</h4>
<img src="./public/images/Video Sync.png" width=900px/>
<br>
</div>
