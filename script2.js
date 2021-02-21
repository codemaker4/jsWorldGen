var xScreenSize = innerWidth - 5; // canvas size
var yScreenSize = innerHeight - 5;
var pixelWorld = []; // stores the world heights and shadows as a list
var chunks = []; // stores chunks, containing an image, an position and oter info
var chunksDone = []; // stores what chunks have been generated and their index in the cunks list. called as: (chunks[chunksDone[x][y]]), X and Y refer to the RealWorld position of the Top left of the chunk/chunkSize
var points = []; // stores wayPoints
var maxHeight = 100; // maximum height
var diagSize;
var resToCalc = 5;
var chunkSize = 100;
var viewX = 0;
var viewY = 0;
var renderUpdateToDo = false;
var lowresChunksExist = true;
var pixSizeSteps = [20,10,5,1];
var millisAtStart = 0;
var maxCalcTime = 25;

document.addEventListener('contextmenu', event => event.preventDefault()); // prevent rightclick menu to make rihtclick control less annoying to use.

function setup() { // p5 setup
  createCanvas(xScreenSize, yScreenSize);
  colorMode(HSL,maxHeight, 100, maxHeight); // sets colorMode to HSL https://www.w3schools.com/colors/colors_hsl.asp fill(height/1.5, 100, (hightDifference*maxHeight/5)+(maxHeight/2))
  for (var i = 0; i < Math.ceil(xScreenSize*5*yScreenSize*5/10000); i++) {
    points[i] = [random(-xScreenSize*2, xScreenSize*3),random(-yScreenSize*2, yScreenSize*3),random(0, maxHeight)];
  }
  diagSize = dist(0,0,xScreenSize,yScreenSize);
  noSmooth();
  millisAtStart = millis();
}

function calcPixel(x,y) {
  var total = 0; // begin average calculation.
  var totWeight = 0;
  for (var i = 0; i < points.length; i++) {
    // var distance = dist(x,y,points[i][0],points[i][1]);
    var distance = FastDist(x,y,points[i][0],points[i][1]);
    if (distance < 1000) {
      var weight = Math.pow(1.2,((distance*-1)+diagSize)/10);
      total += points[i][2]*weight;
      totWeight += weight;
    }
  }
  return(total/totWeight);
}

// function calcPixel(x,y) {
//   var closestDist = Infinity; // begin average calculation.
//   var closestID = 0;
//   for (var i = 0; i < points.length; i++) {
//     var nowDist = dist(x,y,points[i][0],points[i][1]);
//     if (closestDist > nowDist) {
//       closestDist = nowDist;
//       closestID = i;
//     }
//   }
//   return(points[closestID][2]);
// }

function FastDist(x1,y1,x2,y2) {
  var xD = x2-x1;
  var yD = y2-y1;
  return((xD*xD+yD*yD)/100);
}

function calcTimeLeft() {
  return(millisAtStart+maxCalcTime > millis());
}

function prepWorldPixel(x,y) { // prepares worldPixel at spicific location to stop undefined errors. returns true if new pixels where prepared, else returns false.
  if (pixelWorld[x] === undefined) {
    pixelWorld[x] = [];
  }
  if (pixelWorld[x][y] === undefined) {
    pixelWorld[x][y] = [undefined, undefined];
    return(true);
  }
  return(false);
}

function getWorldPixel(x,y) { // returns the data from the selected worldPixel and makes a new pixel if needed
  prepWorldPixel(x,y);
  return(pixelWorld[x][y])
}

function setWorldPixel(x, y, data) { // sets the selected world pixel. returns true if a new pixel was made
  var madeNew = prepWorldPixel(x,y);
  pixelWorld[x][y] = data;
  return(madeNew);
}

function getWorldHeight(x,y) { // returns the world height and generates the pixel if nessesary
  if (getWorldPixel(x,y)[0] === undefined) {
    pixelWorld[x][y][0] = calcPixel(x,y);
  }
  return(pixelWorld[x][y][0]);
}

function getWorldshadow(x,y) { // returns the world shadow and generates the pixel if nessesary
  if (getWorldPixel(x,y)[1] === undefined) {
    pixelWorld[x][y][1] = calcShadow(x,y,1);
  }
  return(pixelWorld[x][y][1]);
}

function setWorldPixels(xPos,yPos, width,height, data) { // sets a rectangle of worldpixels to the same given value
  for (var x = xPos; x < xPos+width; x++) {
    for (var y = yPos; y < yPos+height; y++) {
      setWorldPixel(x,y,data);
    }
  }
}

function calcShadow(x,y,nowRes) {
  var gemTop = (getWorldHeight(x,y-1) + getWorldHeight(x-1,y-1) + getWorldHeight(x-1,y) - getWorldHeight(x,y)) / 3;
  var gemBot = (getWorldHeight(x,y+1) + getWorldHeight(x+1,y+1) + getWorldHeight(x+1,y) - getWorldHeight(x,y)) / 3;
  var shadow = (0-gemTop + gemBot)*2 + round(maxHeight/2);
  // pixelWorld[round(x/nowRes)][round(y/nowRes)][1] = shadow;
  return(shadow);
}

function onScreen(x,y) {
  return(x>=-chunkSize && x<xScreenSize+chunkSize && y>=-chunkSize && y<yScreenSize+chunkSize);
}

function getIndex(x,y,width) {
  return(x+y*width);
}

function getXY(index, width) {
  return([index%width,Math.floor(index/width)]);
}

function chunk(initX, initY, xSize, ySize) {
  this.xPos = initX;
  this.yPos = initY;
  this.xSize = xSize;
  this.ySize = ySize;
  this.nexChunkImgPixSizeStep = 0
  this.nextChunkImgPixSize = pixSizeSteps[this.nexChunkImgPixSizeStep];
  this.nextChunkImgGenIteration = 0;
  this.chunkImg = createImage(1,1);
  this.nextChunkImg = createImage(Math.ceil(this.xSize/this.nextChunkImgPixSize), Math.ceil(this.ySize/this.nextChunkImgPixSize));
  this.isDone = false;

  this.genPartChunk = function (startIteration, iterations){
    if (this.isDone) {
      return([false, false]);
    }
    this.nextChunkImg.loadPixels();

    var i = startIteration;
    while (true) {
    // for (var i = 0; i < 10000; i+=4) {
      if (i >= this.nextChunkImg.pixels.length || i >= startIteration + iterations) {
        this.nextChunkImgGenIteration = i;
        break;
      }
      var currentPos = getXY(i/4, Math.ceil(this.xSize/this.nextChunkImgPixSize));
      var data = color(getWorldHeight(currentPos[0]*this.nextChunkImgPixSize+this.xPos,currentPos[1]*this.nextChunkImgPixSize+this.yPos)/1.5 - 5 , 75 , map(calcShadow(currentPos[0]*this.nextChunkImgPixSize+this.xPos,currentPos[1]*this.nextChunkImgPixSize+this.yPos,1),60,40,0,100));
      this.nextChunkImg.pixels[i] = red(data);
      this.nextChunkImg.pixels[i+1] = green(data);
      this.nextChunkImg.pixels[i+2] = blue(data);
      this.nextChunkImg.pixels[i+3] = 255;
      i+=4;
    }

    this.nextChunkImg.updatePixels();

    if (this.nextChunkImgGenIteration == this.nextChunkImg.pixels.length) {
      this.chunkImg = this.nextChunkImg;
      this.nexChunkImgPixSizeStep += 1;
      if (this.nexChunkImgPixSizeStep > pixSizeSteps.length) {
        this.nexChunkImgPixSizeStep = pixSizeSteps.length-1;
        this.isDone = true;
      }
      this.nextChunkImgPixSize = pixSizeSteps[this.nexChunkImgPixSizeStep];
      this.nextChunkImgGenIteration = 0;
      this.nextChunkImg = createImage(Math.ceil(this.xSize/this.nextChunkImgPixSize), Math.ceil(this.ySize/this.nextChunkImgPixSize));
      return([true, true]);
    }
    return([true, false]);
    // return(chunkImg);
  }
}

function getChunk(x,y) {
  if (chunksDone[Math.floor(x/chunkSize)] === undefined) {
    chunksDone[Math.floor(x/chunkSize)] = [];
  } if (chunksDone[Math.floor(x/chunkSize)][Math.floor(y/chunkSize)] === undefined) {
    // chunksDone[Math.floor(x/chunkSize)][Math.floor(y/chunkSize)] = ;
    newChunk(x,y);
  }
  return(chunksDone[Math.floor(x/chunkSize)][Math.floor(y/chunkSize)]);
}

function prepChunk(x,y) {
  if (chunksDone[Math.floor(x/chunkSize)] === undefined) {
    chunksDone[Math.floor(x/chunkSize)] = [];
  } if (chunksDone[Math.floor(x/chunkSize)][Math.floor(y/chunkSize)] === undefined) {
    // chunksDone[Math.floor(x/chunkSize)][Math.floor(y/chunkSize)] = ;
    newChunk(x,y);
    return(true)
  }
  return(false);
}

function newChunk(x,y) {
  chunksDone[Math.floor(x/chunkSize)][Math.floor(y/chunkSize)] = chunks.length;
  chunks[chunks.length] = new chunk(Math.floor(x/chunkSize)*chunkSize, Math.floor(y/chunkSize)*chunkSize, chunkSize, chunkSize);
  lowresChunksExist = true;
}

function prepChunkArea(x,y,x2,y2) {
  for (var i = x; i < x2; i+= chunkSize) {
    for (var j = y; j < y2; j+= chunkSize) {
      if (prepChunk(i,j)) {
        renderUpdateToDo = true;
      }
    }
  }
}

function renderChunks() {
  background(255);
  for (var i = 0; i < chunks.length; i++) {
    image(chunks[i].chunkImg,chunks[i].xPos+viewX,chunks[i].yPos+viewY,chunks[i].xSize,chunks[i].ySize);
  }
}

function genChunks() {
  var chunksUpdated = 0;
  for (var r = 0; r < pixSizeSteps.length; r++) {
    // pixSizeSteps[i]
    var i = 0;
    while (calcTimeLeft()) { // (chunksUpdated < 2
      if (onScreen(chunks[i].xPos+viewX, chunks[i].yPos+viewY) || onScreen(chunks[i].xPos+viewX+chunkSize, chunks[i].yPos+viewY+chunkSize)) {
        if (chunks[i].nextChunkImgPixSize >= pixSizeSteps[r]) { // proirity
          var generated = chunks[i].genPartChunk(chunks[i].nextChunkImgGenIteration, 30);
          if (generated[0]) {
            chunksUpdated += 1;
            if (generated[1]) {
              renderUpdateToDo = true;
            }
          }
        }
      }
      i ++;
      if (i >= chunks.length) {
        lowresChunksExist = false;
        break;
      }
    }
  }
}

function move() {
  if (keyIsDown(87)) { // w
    viewY += 5;
    renderUpdateToDo = true;
  } else if (keyIsDown(83)) { // s
    viewY -= 5;
    renderUpdateToDo = true;
  } if (keyIsDown(65)) { // a
    viewX += 5;
    renderUpdateToDo = true;
  } else if (keyIsDown(68)) { // d
    viewX -= 5;
    renderUpdateToDo = true;
  }
}

function mousePressed() {
  mouseDownX = mouseX;
  mouseDownY = mouseY;
  mouseDownViewX = viewX;
  mouseDownViewY = viewY;
}

function mouseDragged() {
  viewX = mouseDownViewX + (mouseDownX-mouseX)*-1;
  viewY = mouseDownViewY + (mouseDownY-mouseY)*-1;
}

function draw(){ // p5 loop
  millisAtStart = millis();
  move();
  prepChunkArea(-viewX, -viewY, -viewX+xScreenSize, -viewY+yScreenSize);
  genChunks();
  if (renderUpdateToDo) {
    renderChunks();
    renderUpdateToDo = false;
  }
}
