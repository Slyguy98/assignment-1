import buildingShaderSrc from './building.vert.js';
import flatShaderSrc from './flat.vert.js';
import fragmentShaderSrc from './fragment.glsl.js';

var gl;

var layers = null;

var modelMatrix;
var projectionMatrix;
var viewMatrix;

var currRotate = 0;
var currZoom = 0;
var currProj = 'perspective';

// New global variables for mouse movement
var horizontalMouseMovement = 0;
var verticalMouseMovement = 0;

/*
    Vertex shader with normals
*/
class BuildingProgram {
    constructor() {
        this.vertexShader = createShader(gl, gl.VERTEX_SHADER, buildingShaderSrc);
        this.fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
        this.program = createProgram(gl, this.vertexShader, this.fragmentShader);

        // Set attrib and uniform locations
        this.attribLocations = {
            position: gl.getAttribLocation(this.program, 'position'),
            normal: gl.getAttribLocation(this.program, 'normal'),
        };

        this.uniformLocations = {
            modelMatrix: gl.getUniformLocation(this.program, 'modelMatrix'),
            viewMatrix: gl.getUniformLocation(this.program, 'viewMatrix'),
            projectionMatrix: gl.getUniformLocation(this.program, 'projectionMatrix'),
            color: gl.getUniformLocation(this.program, 'color'),
        };
    }

    use() {
        gl.useProgram(this.program);
    }
}

/*
    Vertex shader with uniform colors
*/
class FlatProgram {
    constructor() {
        this.vertexShader = createShader(gl, gl.VERTEX_SHADER, flatShaderSrc);
        this.fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
        this.program = createProgram(gl, this.vertexShader, this.fragmentShader);

        // Set attrib and uniform locations
        this.attribLocations = {
            position: gl.getAttribLocation(this.program, 'position'),
        };

        this.uniformLocations = {
            modelMatrix: gl.getUniformLocation(this.program, 'modelMatrix'),
            viewMatrix: gl.getUniformLocation(this.program, 'viewMatrix'),
            projectionMatrix: gl.getUniformLocation(this.program, 'projectionMatrix'),
            color: gl.getUniformLocation(this.program, 'color'),
        };
    }

    use() {
        gl.useProgram(this.program);
    }
}

/*
    Collection of layers
*/
class Layers {
    constructor() {
        this.layers = {};
        this.centroid = [0, 0, 0];
    }

    addBuildingLayer(name, vertices, indices, normals, color) {
        var layer = new BuildingLayer(vertices, indices, normals, color);
        layer.init();
        this.layers[name] = layer;
        this.centroid = this.getCentroid();
    }

    addLayer(name, vertices, indices, color) {
        var layer = new Layer(vertices, indices, color);
        layer.init();
        this.layers[name] = layer;
        this.centroid = this.getCentroid();
    }

    removeLayer(name) {
        delete this.layers[name];
    }

    draw() {
        for (var layer in this.layers) {
            this.layers[layer].draw(this.centroid);
        }
    }

    getCentroid() {
        var sum = [0, 0, 0];
        var numpts = 1;  // Initialize to 1 to avoid division by zero
        for (var layer in this.layers) {
            numpts += this.layers[layer].vertices.length / 3;
            for (var i = 0; i < this.layers[layer].vertices.length; i += 3) {
                var x = this.layers[layer].vertices[i];
                var y = this.layers[layer].vertices[i + 1];
                var z = this.layers[layer].vertices[i + 2];

                sum[0] += x;
                sum[1] += y;
                sum[2] += z;
            }
        }
        return [sum[0] / numpts, sum[1] / numpts, sum[2] / numpts];
    }
}

/*
    Layers without normals (water, parks, surface)
*/
class Layer {
    constructor(vertices, indices, color) {
        this.vertices = vertices || [];
        this.indices = indices;
        this.color = color;
    }

    init() {
        // Create program, set vertex and index buffers, vao
        this.program = new FlatProgram();
        this.vao = createVAO(gl, this.program.attribLocations.position, createBuffer(gl, gl.FLOAT, new Float32Array(this.vertices)), this.indices);
    }

    draw(centroid) {
        // Use program, update model matrix, view matrix, projection matrix
        this.program.use();

        // Update model matrix
        updateModelMatrix(centroid);

        // Update view matrix
        updateViewMatrix(centroid);

        // Update projection matrix
        updateProjectionMatrix();

        // Set uniforms
        gl.uniformMatrix4fv(this.program.uniformLocations.modelMatrix, false, modelMatrix);
        gl.uniformMatrix4fv(this.program.uniformLocations.viewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(this.program.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniform4fv(this.program.uniformLocations.color, this.color);

        // Bind vao, bind index buffer, draw elements
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }
}

/*
    Layer with normals (building)
*/
class BuildingLayer extends Layer {
    constructor(vertices, indices, normals, color) {
        super(vertices, indices, color);
        this.normals = normals || [];
    }

    init() {
        // Create program, set vertex, normal and index buffers, vao
        this.program = new BuildingProgram();
        this.vao = createVAO(gl, this.program.attribLocations.position, createBuffer(gl, gl.FLOAT, new Float32Array(this.vertices)),
            this.program.attribLocations.normal, createBuffer(gl, gl.FLOAT, new Float32Array(this.normals)), this.indices);
    }

    draw(centroid) {
        // Use program, update model matrix, view matrix, projection matrix
        this.program.use();

        // Update model matrix
        updateModelMatrix(centroid);

        // Update view matrix
        updateViewMatrix(centroid);

        // Update projection matrix
        updateProjectionMatrix();

        // Set uniforms
        gl.uniformMatrix4fv(this.program.uniformLocations.modelMatrix, false, modelMatrix);
        gl.uniformMatrix4fv(this.program.uniformLocations.viewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(this.program.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniform4fv(this.program.uniformLocations.color, this.color);

        // Bind vao, bind index buffer, draw elements
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }
}

/*
    Event handlers
*/
window.updateRotate = function () {
    currRotate = parseInt(document.querySelector("#rotateSlider").value);
}

window.updateZoom = function () {
    currZoom = parseFloat(document.querySelector("#zoomSlider").value);
}

window.updateProjection = function () {
    currProj = document.querySelector("#projection").value;
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

function translationMatrix(x, y, z) {
    return [
        1, 0, 0, x,
        0, 1, 0, y,
        0, 0, 1, z,
        0, 0, 0, 1
    ];
}

function rotationMatrixY(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return [
        cos, 0, -sin, 0,
        0, 1, 0, 0,
        sin, 0, cos, 0,
        0, 0, 0, 1
    ];
}

// New mouse event handlers
function handleMouseMove(event) {
    const { movementX, movementY } = event;
    horizontalMouseMovement += movementX;
    verticalMouseMovement += movementY;

    // Constrain the values to the specified ranges
    horizontalMouseMovement = Math.min(Math.max(horizontalMouseMovement, 0), 360);
    verticalMouseMovement = Math.min(Math.max(verticalMouseMovement, 1), 100);

    updateViewMatrix(layers.centroid);

}

/*
    File handler
*/
window.handleFile = function (e) {
    var reader = new FileReader();

    // Check if files are present
    if (e.files && e.files[0]) {
        reader.onload = function (evt) {
            const parsed = JSON.parse(evt.target.result);
            for (var layer in parsed) {
                switch (layer) {
                    case 'buildings':
                        layers.addBuildingLayer(layer, parsed[layer].vertices, parsed[layer].indices, parsed[layer].normals, parsed[layer].color);
                        break;
                    case 'water':
                        layers.addLayer(layer, parsed[layer].vertices, parsed[layer].indices, parsed[layer].color);
                        break;
                    case 'parks':
                        layers.addLayer(layer, parsed[layer].vertices, parsed[layer].indices, parsed[layer].color);
                        break;
                    case 'surface':
                        layers.addLayer(layer, parsed[layer].vertices, parsed[layer].indices, parsed[layer].color);
                        break;
                    default:
                        break;
                }
            }
        };

        reader.readAsText(e.files[0]);
    } else {
        console.error('No files selected');
    }
}


/*
    Update transformation matrices
*/
function updateModelMatrix(centroid) {
    // Update model matrix based on user input (rotation)
    modelMatrix = identityMatrix();
    modelMatrix = multiplyMatrices(modelMatrix, translationMatrix(-centroid[0], -centroid[1], -centroid[2]));
    modelMatrix = multiplyMatrices(modelMatrix, rotationMatrixY(degreesToRadians(currRotate)));
    modelMatrix = multiplyMatrices(modelMatrix, translationMatrix(centroid[0], centroid[1], centroid[2]));
}

function updateProjectionMatrix() {
    // Update projection matrix based on user input (zoom and projection type)
    const aspectRatio = gl.canvas.width / gl.canvas.height;
    if (currProj === 'perspective') {
        projectionMatrix = perspectiveMatrix(degreesToRadians(45), aspectRatio, 0.1, 1000.0);
    } else if (currProj === 'orthographic') {
        const left = -1.0;
        const right = 1.0;
        const bottom = -1.0;
        const top = 1.0;
        const near = 0.1;
        const far = 1000.0;
        projectionMatrix = orthographicMatrix(left, right, bottom, top, near, far);
    }
}

function updateViewMatrix(centroid) {
    // Update view matrix based on user input (zoom and view)

    // Calculate rotation angles based on mouse movement
    const rotationX = degreesToRadians(verticalMouseMovement);
    const rotationY = degreesToRadians(horizontalMouseMovement);

    // Calculate the position of the camera
    const distance = currZoom;
    const eye = [
        centroid[0] + distance * Math.sin(rotationY) * Math.cos(rotationX),
        centroid[1] + distance * Math.sin(rotationX),
        centroid[2] + distance * Math.cos(rotationY) * Math.cos(rotationX),
    ];

    viewMatrix = lookAt(eye, centroid, [0, 1, 0]);
}

/*
    Main draw function (should call layers.draw)
*/
function draw() {

    gl.clearColor(190 / 255, 210 / 255, 215 / 255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    layers.draw();

    requestAnimationFrame(draw);

}

/*
    Initialize everything
*/
function initialize() {

    var canvas = document.querySelector("#glcanvas");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    gl = canvas.getContext("webgl2");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    layers = new Layers();

    // Add mouse event listener
    document.addEventListener('mousemove', handleMouseMove);

    // Connect file input element to the window.handleFile function
    var fileInput = document.querySelector("#fileInput");
    fileInput.addEventListener('change', function (e) {
        window.handleFile(e);
    });

    window.requestAnimationFrame(draw);

}

window.onload = initialize;
