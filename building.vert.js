export default `#version 300 es

uniform mat4 uModel;
uniform mat4 uProjection;
uniform mat4 uView;
uniform vec4 uColor;

in vec3 position;
in vec3 normal;

out vec4 vColor;

void main() {
    // Transform position
    vec4 transformedPosition = uProjection * uView * uModel * vec4(position, 1.0);

    // Set color as the dot product between a light direction and the vertex normal
    vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0)); // Example light direction (adjust as needed)
    float lightIntensity = max(dot(normalize(normal), lightDirection), 0.0);
    vColor = uColor * lightIntensity;

    gl_Position = transformedPosition;
}
`;