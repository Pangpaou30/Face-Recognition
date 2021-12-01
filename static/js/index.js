const video = document.getElementById('video'); //get video element

console.log("test")
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
Promise.all([ //load the models
  faceapi.nets.faceLandmark68Net.loadFromUri('./static/models'), //recognition faces
  faceapi.nets.faceRecognitionNet.loadFromUri('./static/models'), //detect teh faces 
  faceapi.nets.ssdMobilenetv1.load('./static/models') //determine phases
])
  .then(startVideo) //when the loading was finish, calling startVideo method
  .catch(err => {
    console.error(err)
    throw "Error happened"
  });

function startVideo() { //startVideo function, will be running until all of the model have loaded
  console.log("Load model finished");
  navigator.getUserMedia(
    {
      video: {}
    },
    stream => video.srcObject = stream, //stream the result on video doc
    err => console.error(err)
  )
}

video.addEventListener('play', async() => {
  const labeledFaceDescriptors = await loadLabeledImages() //called the labeledFaceDescriptors variable
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6) //called the faceMatcher variable
  const canvas = faceapi.createCanvasFromMedia(video); //creating canvas
  console.log("Ready to recognize...");
  document.body.append(canvas); 
  const displaySize = { width: video.width, height: video.height }; //got the display size of different faces
  faceapi.matchDimensions(canvas, displaySize); //resize the canvas with the faces size
  setInterval(async () => {
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors(); //variable to detection and recognize the video
    const resizedDetections = faceapi.resizeResults(detections, displaySize); //resize the boxes detection based the correct size
    const results = resizedDetections.map((d) => faceMatcher.findBestMatch(d.descriptor)); //display the faces name (if there's none above 60%, it's going to return nothing, vice versa, it's going to choose the closest value)
    results.forEach(async (result, i) => { //create simple for lopp
        let box = resizedDetections[i].detection.box; //box of the face for determine individual faces
        if (result["_label"] === "unknown") {
            let drawBox = new faceapi.draw.DrawBox(box, { label: result.toString(), boxColor: "red"}); //draw actual box and labeled on it
            drawBox.draw(canvas); //draw the box
            
        } else {
            let drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
            drawBox.draw(canvas);
        }
    });
  }, 100)
})

let loadLabeledImages = async () => { //funtion to put the different names for different faces 
    try {
      const descriptions = []; //get the descriptions to array
      console.log(`Train images`);
      const img = await faceapi.fetchImage("./static/sample/foto_hadi.jpg"); //load the image
      const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor(); //detect the faces on video
      descriptions.push(detections.descriptor); //push the detections
      console.log(`Training finish, next`);
      return new faceapi.LabeledFaceDescriptors("Hadi", descriptions); //return the function try
    } catch (error) {
        console.error(error);
    }
};