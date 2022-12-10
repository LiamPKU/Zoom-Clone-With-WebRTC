const socket = io('/') // socket运行在 localhost:3000/:roomId
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3001'  // peer broker运行在 localhost:3001/
})
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream)
  
  // new users answer old peer's call
  myPeer.on('call', call => {
    // new peer answers the call and sends old peer their stream, so old peer can get stream and display
    call.answer(stream)
    // new users also display old peer's stream after answering the call
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })
  
  // old peer calls new peer when new peer joins
  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
  })
})

// socket 监听到用户离开，将全局的peers call 关掉
socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})

// 与peer 3001 server 建立连接之后，得到userID
myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id) // 向 3000 server socket 发送join-room的通知
})

// former users make calls to later users
function connectToNewUser(userId, stream) {
  // 向对方发送自己的stream
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  // 接到对方answer的stream
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

// 建立音视频组件
function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}
