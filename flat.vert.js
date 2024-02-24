export default `#version 300 es

uniform mat4 uModel;
uniform mat4 uProjection;
uniform mat4 uView;
uniform vec4 uColor;

in vec3 position;

out vec4 vColor;

void main() {
    // Transform position
    vec4 transformedPosition = uProjection * uView * uModel * vec4(position, 1.0);

    // Pass color to the fragment shader
    vColor = uColor;

    // Output transformed position
    gl_Position = transformedPosition;
}
`;
