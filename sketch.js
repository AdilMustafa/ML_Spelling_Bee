/*
  Data and machine learning for creative practice
  Week 5
  
  Pose classification (run model 3/3)
  Inspired by Daniel Shiffman
  
  
  
  Description:
  This sketch uses a model ive created that associates the arm 
  positions with 15 letters of the alphabet (A,C,D,E,F,H,I,L,M,N,O,P,R,T,U)
  it is up to the user to either figure out how to create those letters 
  them selves or use hints.
  
  The objective is to have the users spell a random word ive provided. 
  Ive used text to speech to say the word the user needs to spell out.
  Ive also allowed them to hear the definition of the word if they need it.
  The user will have to create the letters using poseNet and MOUSE CLICK 
  to submit their letters. Once they are satisfied with their answer they 
  can press ENTER to see the answer. 
  
  
  
  Instructions:
  - Press S to hear the word you need to spell
  - Press D to hear its definition 
  - Press 1 to enable hints and press 2 to disable hints
  - When using hints press the letter (e.g A) to view what body pose you need to do
  - MOUSE CLICK to submit a letter 
  - press ENTER to submit your answer and see what the spelling of the word is

*/

let randomNum, //provides a random number for the arrays
    submitted = false, //provides the endscreen
    speech, //used for text to speech
    instructions, //used to provide instructions 
    hint = false; //turns on / off hints

//poseNet variables
let video, 
    poseNet, 
    pose, 
    skeleton, 
    brain, 
    poseLabel;



let generated_text = [], //stores the letters the user has inputted
    
  /*
    website used to find words / definitions 
    https://wordfinderx.com/words-for/acdefhilmnoprtu/?dictionary=wwf    
  */
    
    //stores the words
    words = [  
      "EUCHROMATIN",
      "ANDROECIUM",
      "FULMINATED",
      "LUNCHTIME",
      "MERCIFUL",
      "MULCHED",
      "PENTACHORD",
      "RHEUMATOID",
      "RUDIMENTAL",
      "CLAP"
    ],
    
    //stores the definitions
    definitions = [
    "chromosome material which does not stain strongly except during cell division. It represents the major genes and is involved in transcription",
    "the stamens of a flower collectively",
    "explode violently or flash like lightning",
    "the time in the middle of the day when lunch is eaten",
    "showing or exercising mercy",
    "treat or cover with mulch",
    "a musical instrument with five strings",
    "relating to, affected by, or resembling rheumatism",
    "involving or limited to basic principles",
    "strike the palms of (one's hands) together repeatedly, typically in order to applaud someone or something"
    ];



function preload() {
  
  //preloads the font
  font = loadFont("PressStart2P-Regular.ttf");
  
  //preloads the images used for the hints 
  a_ = loadImage("images/a.jpg");
  c_ = loadImage("images/c.jpg");
  d_ = loadImage("images/d.jpg");
  e_ = loadImage("images/e.jpg");
  f_ = loadImage("images/f.jpg");
  
  h_ = loadImage("images/h.jpg");
  i_ = loadImage("images/i.jpg");
  l_ = loadImage("images/l.jpg");
  m_ = loadImage("images/m.jpg");
  n_ = loadImage("images/n.jpg");
  
  o_ = loadImage("images/o.jpg");
  p_ = loadImage("images/p.jpg");
  r_ = loadImage("images/r.jpg");
  t_ = loadImage("images/t.jpg");
  u_ = loadImage("images/u.jpg");
}



function setup() {
  createCanvas(640, 480);
  
  //changes the font used for the text
  textFont(font); 
  
  //when instructions >= 1 user can input their letters and hear the definition
  instructions = 0;
  
  //enables text to speech
  speech = new p5.Speech();
  speech.started();

  video = createCapture(VIDEO, cameraLoaded);
  video.size(640, 480);
  video.hide(); // hide DOM element
  
  //makes sure the number is less than 10 and more than or equal to 0 
  randomNum = int(random(0,10));
}





function draw() {
  background(255);

  push();
  translate(video.width, 0);
  scale(-1, 1); // flip video to make it easier for us
  image(video, 480, 0, video.width / 4, video.height / 4);

  if (pose) {
    for (let bone of skeleton) {
      let a = bone[0];
      let b = bone[1];
      strokeWeight(2);
      stroke(0);

      line(a.position.x, a.position.y, b.position.x, b.position.y);
    }

    for (let keypoint of pose.keypoints) {
      let x = keypoint.position.x;
      let y = keypoint.position.y;
      fill(0);
      stroke(255);
      ellipse(x, y, 16, 16);
    }
  }
  
  pop();

  //draws the UI 
  UI(); 
}






function mousePressed() {
  
  //when instuctions is more than 0 the user can input their letters
  if(instructions > 0){
    generated_text.push(poseLabel);
  }
}





function keyPressed() {
  //press S to provide the word the user needs to spell
  if (key == "s") {
    speech.setVoice("SpeechSynthesisVoice");
    
    //speech to text will first say "try spell the word" followed by the word they need to spell
    if (instructions < 1) 
      speech.speak("Try spell the word " + words[randomNum]);
    
    //speech to text will just say the word the user needs to spell
    else {
      speech.speak(words[randomNum]);
    }

    instructions += 1;
  }
  
  //text to speech will read out the word's definition
  if(key == "d")
  {
    if(!hint && instructions >= 1)
    {
        speech.setVoice("SpeechSynthesisVoice");
        speech.speak(" " + words[randomNum] + 
                     " means " + definitions[randomNum]);
    }
  }
 
  //enables hints
  if(key == 1)
  {
    hint = true;
  }
  
  //disables hints
  if(key == 2)
  {
    hint = false;
  }
  
  //submits what the user has inputted
  if(keyCode == 13)
  {
    submitted = true;
  }
}





function cameraLoaded(stream) {
  poseNet = ml5.poseNet(video, modelLoaded);
  poseNet.on("pose", gotPoses); // our callback for poses

  let options = {
    inputs: 34,
    outputs: 4,
    task: "classification",
    debug: true,
  };

  // load our training into the neural network
  brain = ml5.neuralNetwork(options);

  const modelInfo = {
    //uses the model, metadata & weights I created
    model: "myModel2/model.json",
    metadata: "myModel2/model_meta.json",
    weights: "myModel2/model.weights.bin",
  };

  // load it into our neural net
  brain.load(modelInfo, brainLoaded);
}




function brainLoaded() {
  console.log("pose classification ready!");
  classifyPose();
}






function classifyPose() {
  if (pose) {
    let inputs = [];

    for (let keypoint of pose.keypoints) {
      let x = keypoint.position.x;
      let y = keypoint.position.y;

      inputs.push(x);
      inputs.push(y);
    }

    // classify the skeleton from the image
    brain.classify(inputs, gotResult);
  } else {
    setTimeout(classifyPose, 100); // we call this function recursively every 100 milliseconds
  }
}






function gotResult(error, results) {
  // this is the result from the classification
  if (results[0].confidence > 0.75) {
    poseLabel = results[0].label.toUpperCase();
  }

  // we call classify pose as we are now done and should keep classifying
  classifyPose();
}






function gotPoses(poses) {
  if (poses.length > 0) {
    pose = poses[0].pose;
    skeleton = poses[0].skeleton;
  }
}






function modelLoaded() {
  console.log("poseNet ready");
}



//displays the end screen when the user presses ENTER
function endScreen() {
  push();
  fill(255);
  rect(0, 0, width, height);
  fill(0);
  rect(0, height / 2 - 100, width, 200);
  stroke(0);
  textSize(14);

  fill(255, 0, 0);
  text("Your Answer: " + generated_text, width / 2, height / 2 - 30);
  text("The Answer: " + words[randomNum], width / 2, height / 2 + 30);
  
  pop();
}



//draws the image onto the screen when the user presses the key when hints are enabled
function requesting()
{
  if(key === "a" || key === "A")
  {
    image(a_, width/2,0)
  }
  
  else if(key === "c" || key === "C")
  {
    image(c_, width/2,0)
  }
  
  else if(key === "d" || key === "D")
  {
    image(d_, width/2,0)
  }
  
  else if(key === "e" || key === "E")
  {
    image(e_, width/2,0)
  }
  else if(key === "f" || key === "F")
  {
    image(f_, width/2,0)
  }
  
  
  
  else if(key === "h" || key === "H")
  {
    image(h_, width/2,0)
  }
  else if(key === "i" || key === "I")
  {
    image(i_, width/2,0)
  }
  else if(key === "l" || key === "L")
  {
    image(l_, width/2,0)
  }
  else if(key === "m" || key === "M")
  {
    image(m_, width/3,0)
  }
  else if(key === "n" || key === "N")
  {
    image(n_, width/2,0)
  }
  
  
  
  
  else if(key === "o" || key === "O")
  {
    image(o_, width/2,0)
  }
  else if(key === "p" || key === "P")
  {
    image(p_, width/2,0)
  }
  else if(key === "r" || key === "R")
  {
    image(r_, width/2,0)
  }
  else if(key === "t" || key === "T")
  {
    image(t_, width/3,0)
  }
  else if(key === "u" || key === "U")
  {
    image(u_, width/2,0)
  }
}



//draws the UI onto the screen
function UI()
{
  fill(255, 0, 255);
  noStroke();
  textSize(12);
  textAlign(CENTER, CENTER);
  text(poseLabel, 10, 130);


  
  fill(0)
  text(poseLabel, 10, 130);
  text("Press S to hear the word you need to spell", 258, height / 3);
  text("Press D to hear the word's definition", 222, height / 3 + 30);
  text("Press 1 to enable hints and press 2 to disable hints", 318, height / 3 + 60);
  text("Press A,C,D,E,F,H,I,L,M,N,O,P,R,T,U when in hint mode", 324, height / 3 + 90);
  text("MOUSE CLICK to input a letter", 180, height / 3 + 120);
  text("Press Enter to submit your answer", 204, height / 3 + 150);
  
  text(generated_text, 200, height / 3 + 180);
  
  push();
  textSize(200);
  text(poseLabel, width / 1.3, 130);
  pop();
  
  if(hint){
    requesting();
    text(key,10,height - 20)
  }
  
  if(submitted){
    endScreen()
  }
}