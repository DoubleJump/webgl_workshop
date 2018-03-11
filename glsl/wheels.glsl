// attribute vec3 position; -- supplied by THREE
attribute vec2 uv2;

varying vec3 _normal;
varying vec2 _uv;
varying vec2 _uv2;
varying vec3 _eye;

//uniform mat3 normalMatrix; -- supplied by THREE
//uniform mat4 modelViewMatrix; -- supplied by THREE
//uniform mat4 projectionMatrix; -- supplied by THREE

void main() 
{
	// Normals get transformed with their own special matrix
	_normal = normalMatrix * normal;

	// Eye is the direction of vertex to the camera
	_eye = vec3(modelViewMatrix * vec4(position, 1.0));
	_eye = normalize(_eye);

	// Our meshes two uv maps
	_uv = uv;
	_uv2 = uv2;

	// Transform the vertex into is final place on the screen
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

========

varying vec3 _normal;
varying vec2 _uv;
varying vec2 _uv2;
varying vec3 _eye;

uniform vec4 colour;
uniform float highlight;
uniform sampler2D envmap;
uniform sampler2D envmap_blurred;
uniform sampler2D lightmap;
uniform sampler2D diffuse;
uniform float shinyness;

float fresnel(vec3 E, vec3 N, float bias, float scale, float power)
{
	float r = bias + scale * pow(1.0 + dot(E, N), power);
	return r;
}

void main() 
{
	// Get reflection coordinates
	vec3 r = reflect(_eye, _normal);
	float m = 2.0 * sqrt(pow(r.x, 2.0) + pow(r.y, 2.0) + pow(r.z + 1.0, 2.0));
	vec2 ruv = r.xy / m + 0.5;

	// Fresnel is that angle between the surface and the camera
	float fr = fresnel(_eye, _normal, 0.1,1.0,2.0);

	// Environment maps
	float env_sharp = texture2D(envmap, ruv).r;
	float env_blurred = texture2D(envmap_blurred, ruv).r;

	// Lightmap
	float lm = texture2D(lightmap, _uv2).r * 1.8;
	//lm = smoothstep(0.6,1.0,lm);

	// Diffuse map
	vec3 diff = texture2D(diffuse, _uv).rgb;

	// Blend between sharp and blurred reflections
	// Reflections get sharper at higher angles
	float env = mix(env_blurred, env_sharp, fr);

	// Desaturate colours at high angles
	vec3 rgb = mix(diff * colour.rgb, vec3(1.0,1.0,0.75), fr);

	vec3 final = rgb * lm * env;

	// Add highlight glow
	vec3 highlight_colour = vec3(0.2,0.4,1.0) * highlight * fr;
	final += highlight_colour;

	gl_FragColor = vec4(final, 1.0);
}