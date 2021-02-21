var xScreenSize = innerWidth - 5; // canvas size
var yScreenSize = innerHeight - 5;
var world = [];
var worldImg;
var points = [];
var maxHeight = 100;
var diagSize;
var resToCalc = 5;

document.addEventListener('contextmenu', event => event.preventDefault()); // prevent rightclick menu to make rihtclick control less annoying to use.

function setup() { // p5 setup
  createCanvas(xScreenSize, yScreenSize);
  colorMode(HSL,maxHeight, 100, maxHeight); // sets colorMode to HSL https://www.w3schools.com/colors/colors_hsl.asp fill(height/1.5, 100, (hightDifference*maxHeight/5)+(maxHeight/2))
  for (var i = 0; i < Math.ceil(xScreenSize*yScreenSize/7500); i++) {
    points[i] = [random(0, xScreenSize),random(0, yScreenSize),random(0, maxHeight)];
  }
  diagSize = dist(0,0,xScreenSize,yScreenSize);
  for (var x = 0; x <= Math.ceil(xScreenSize)+2; x++) {
    world[x-1] = [];
    for (var y = 0; y <= Math.ceil(yScreenSize)+2; y++) {
      world[x-1][y-1] = [50,50];
    }
  }
}

function calcPixel(x,y,nowRes) {
  var total = 0; // begin average calculation.
  var totWeight = 0;
  for (var i = 0; i < points.length; i++) {
    var weight = ((dist(x,y,points[i][0],points[i][1])*-1)+diagSize)/10;
    total += points[i][2]*Math.pow(1.5,weight);
    totWeight += Math.pow(1.5,weight);
  }
  // console.log(total);
  // console.log(total, totWeight);
  world[round(x/nowRes)][round(y/nowRes)][0] = round(total/totWeight);
  return(total/totWeight);
}

// function calcPixel(x,y,resToCalc) {
//   var closestDist = Infinity; // begin average calculation.
//   var closestID = 0;
//   for (var i = 0; i < points.length; i++) {
//     var nowDist = dist(x,y,points[i][0],points[i][1]);
//     if (closestDist > nowDist) {
//       closestDist = nowDist;
//       closestID = i;
//     }
//   }
//   world[round(x/resToCalc)][round(y/resToCalc)][0] = points[closestID][2];
//   return(points[closestID][2]);
// }

function calcShadow(x,y,nowRes) {
  var gemTop = (world[x][y-1][0] + world[x-1][y-1][0] + world[x-1][y][0] - world[x][y][0]) / 3;
  var gemBot = (world[x][y+1][0] + world[x+1][y+1][0] + world[x+1][y][0] - world[x][y][0]) / 3;
  // console.log(world[x][y-1] , world[x-1][y-1] , world[x-1][y] , world[x][y]);
  var shadow = round((0-gemTop + gemBot)*2 + round(maxHeight/2));
  world[round(x/nowRes)][round(y/nowRes)][1] = round((0-gemTop + gemBot)*2 + round(maxHeight/2));
  return(round((0-gemTop + gemBot)*2 + round(maxHeight/2)));
}

var shadowIntensity;

function calcAndRenderShadow(x,y,dotSize) {
  noStroke();
  fill(world[x][y][0]/1.5 - 5, 75, calcShadow(x,y,dotSize)/-shadowIntensity+(750/dotSize/(dotSize*-0.1+2)));
  rect(x*dotSize,y*dotSize,dotSize,dotSize);
}

function renderRowShadow(y, pixSize) {
  for (var x = 0; x < xScreenSize/pixSize; x += 1) {
    calcAndRenderShadow(x,y,pixSize);
  }
}

function calcAndRender(x,y,dotSize) {
  noStroke();
  fill(calcPixel(x,y,dotSize)/1.5 - 5, 75, 50);
  rect(x,y,dotSize,dotSize);
}

function renderRow(y, pixSize) {
  for (var x = -pixSize; x < xScreenSize+pixSize; x += pixSize) {
    calcAndRender(x,y,pixSize);
  }
}

// function draw() { // p5 loop
//   for (var i = 0; i < 500; i++) {
//     calcAndRender(random(xScreenSize), random(yScreenSize), pixSize);
//   }
// }

var pixSize = 10;
var calcingShadow = false;
var yToDraw = -pixSize;

function draw(){ // p5 loop
  if (calcingShadow) {
    renderRowShadow(yToDraw/pixSize,pixSize);
  } else {
    renderRow(yToDraw, pixSize);
  }
  yToDraw += pixSize;
  if (yToDraw > yScreenSize+pixSize) {
    if (calcingShadow) {
      noLoop();
    }
    if (Math.floor(pixSize/2) < resToCalc) {
      // noLoop();
      calcingShadow = true;
      shadowIntensity = 0.19*pixSize;
      yToDraw = 0;
    } else {
      pixSize = Math.floor(pixSize/2);
      yToDraw = -pixSize;
    }
  }
}
