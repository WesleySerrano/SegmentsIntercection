/**
 * Created by Wesley on 08/03/2016.
 */

var gl, program;
var vertices, indices, intersectionPointCircleVerticesIndices;
var hasIntercection;
var uniformColorLocation;

function updateDisplay(rangeElementName)
{
    document.getElementById(rangeElementName + "Display").innerHTML = document.getElementById(rangeElementName).value;
    setVertices();
}

function between(value, inf, sup)
{
    return (value >= inf && value <= sup);
}

function crossProduct(v, w)
{
    return v[0]*w[1] - v[1]*w[0];
}

function calculateIntercection(segmentA, segmentB)
{
  var slopeSegA = (segmentA[0][1] - segmentA[1][1])/(segmentA[0][0] - segmentA[1][0]);
  var slopeSegB = (segmentB[0][1] - segmentB[1][1])/(segmentB[0][0] - segmentB[1][0]);

  var intersectionPoint = ["a","b"];

  if(slopeSegA == slopeSegB)
  {
     hasIntercection = false;
  }
  else
  {
     var segADirection = vec2(segmentA[1][0] - segmentA[0][0], segmentA[1][1] - segmentA[0][1]); //r
     var segBDirection = vec2(segmentB[1][0] - segmentB[0][0], segmentB[1][1] - segmentB[0][1]); //s

     var directionsCrossProduct = crossProduct(segADirection, segBDirection);
     var endPointsSubtraction = subtract(segmentB[0], segmentA[0]);
     var segAParameter = crossProduct(endPointsSubtraction, segBDirection)/directionsCrossProduct;
     var segBParameter = crossProduct(endPointsSubtraction, segADirection)/directionsCrossProduct;

     var intersectionVector = scale(segAParameter, segADirection);

   hasIntercection = true;
   if(directionsCrossProduct != 0 && between(segAParameter,0,1) && between(segBParameter, 0, 1) )intersectionPoint = add(segmentA[0], intersectionVector);
   else hasIntercection = false;
  }

  return intersectionPoint;
}

function addCirclePoints(circleCenter, radius, step)
{
    radius = typeof radius !== 'undefined'? radius : 0.0125;
    step = typeof step !== 'undefined'? step : 0.1;

    var numberOfNewPoints = Math.ceil(2.0*Math.PI/step);
    var newArray = new Float32Array(vertices.length + (2 * numberOfNewPoints) + 2);

    for(var i = 0; i < vertices.length; i++)
    {
        newArray[i] = vertices[i];
    }

    newArray[vertices.length] = circleCenter[0];
    newArray[vertices.length + 1] = circleCenter[1];
    var angle = 0.0;

    for(var i = 1; i <= 2 * numberOfNewPoints; i += 2)
    {
       var x = circleCenter[0] + radius*Math.cos(angle);
       var y = circleCenter[1] + radius*Math.sin(angle);

      newArray[vertices.length + i + 1] = x;
      newArray[vertices.length + i + 2] = y;

       angle += step;
    }

    return newArray;
}

function calculateIntersectionCircleIndices()
{
  var numberOfSegmentsEndPointsCoordinates = 8;
  var numberOfPoints = (vertices.length - numberOfSegmentsEndPointsCoordinates)/2 - 1;
  var numberOfIndices = 3 * numberOfPoints;
  var circleCenterIndex = numberOfSegmentsEndPointsCoordinates/2;

  intersectionPointCircleVerticesIndices = new Uint16Array(numberOfIndices);

  for(var i = 1; i <= numberOfPoints; i++)
  {
     var index = 3*(i-1);
     var v1Index = (circleCenterIndex + i);
     var v2Index = (circleCenterIndex + i + 1);
     intersectionPointCircleVerticesIndices[index] = circleCenterIndex;
     intersectionPointCircleVerticesIndices[index + 1] = v1Index;
     intersectionPointCircleVerticesIndices[index + 2] = (v2Index > circleCenterIndex + numberOfPoints)? circleCenterIndex + 1 : v2Index;
  }
}

function setVertices()
{
    var x = Number(document.getElementById("V1X").value), y = Number(document.getElementById("V1Y").value);
    var v0 = vec2(x, y);

    x = Number(document.getElementById("V2X").value), y = Number(document.getElementById("V2Y").value);
    var v1 = vec2(x, y);

    x = Number(document.getElementById("V3X").value), y = Number(document.getElementById("V3Y").value);
    var v2 = vec2(x, y);

    x = Number(document.getElementById("V4X").value), y = Number(document.getElementById("V4Y").value);
    var v3 = vec2(x, y);

    vertices = new Float32Array(
        [
            v0[0], v0[1],
            v1[0], v1[1],
            v2[0], v2[1],
            v3[0], v3[1]
        ]);

    indices = new Uint16Array(
        [
            0, 1,
            2, 3
        ]);

    var intersection = calculateIntercection([v0, v1], [v2, v3]);

    if(hasIntercection == true)
    {
        vertices = addCirclePoints(intersection);

        calculateIntersectionCircleIndices();
    }

    render();
}

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    document.getElementById("V1XDisplay").innerHTML = document.getElementById("V1X").value;
    document.getElementById("V1YDisplay").innerHTML = document.getElementById("V1Y").value;
    document.getElementById("V2XDisplay").innerHTML = document.getElementById("V2X").value;
    document.getElementById("V2YDisplay").innerHTML = document.getElementById("V2Y").value;
    document.getElementById("V3XDisplay").innerHTML = document.getElementById("V3X").value;
    document.getElementById("V3YDisplay").innerHTML = document.getElementById("V3Y").value;
    document.getElementById("V4XDisplay").innerHTML = document.getElementById("V4X").value;
    document.getElementById("V4YDisplay").innerHTML = document.getElementById("V4Y").value;
    //  Configure WebGL

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );

    //  Load shaders and initialize attribute buffers

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    uniformColorLocation = gl.getUniformLocation(program, "color");

    hasIntercection = false;
    setVertices();
};

function render()
{
    window.requestAnimationFrame(render);

    gl.clear( gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);

    // Load the data into the GPU

    var verticesBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, verticesBufferId );
    gl.bufferData( gl.ARRAY_BUFFER,vertices, gl.STATIC_DRAW );
    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var elementsBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, elementsBufferId );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER,indices, gl.STATIC_DRAW );

    renderSegments();

    if(hasIntercection)
    {
        var intersectionElementsBufferId = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, intersectionElementsBufferId);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, intersectionPointCircleVerticesIndices, gl.STATIC_DRAW);

        renderIntersectionPoint();
    }
}

function renderSegments()
{
    gl.uniform4fv(uniformColorLocation, flatten([0.0,0.0,0.0,1.0]));

    gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_SHORT, 0);
}

function renderIntersectionPoint()
{
    gl.uniform4fv(uniformColorLocation, flatten([0.0,1.0,0.0,1.0]));

    var elementsBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, elementsBufferId );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER,intersectionPointCircleVerticesIndices, gl.STATIC_DRAW );

    gl.drawElements(gl.TRIANGLES, intersectionPointCircleVerticesIndices.length, gl.UNSIGNED_SHORT, 0);
}