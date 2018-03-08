attribute vec2 uv2;

varying vec3 _normal;
varying vec2 _uv;
varying vec2 _uv2;
varying vec3 _eye;


void main() 
{
	_normal = normalMatrix * normal;
	_eye = vec3(modelViewMatrix * vec4(position, 1.0));
	_uv = uv;
	_uv2 = uv2;

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

float lambert(vec3 N, vec3 L)
{
    return max(0.0, dot(N, normalize(L)));
}

void main() 
{
	// Get reflection coordinates
	vec3 r = reflect(_eye, _normal);
	float m = 2.0 * sqrt(pow(r.x, 2.0) + pow(r.y, 2.0) + pow(r.z + 1.0, 2.0));
	vec2 ruv = r.xy / m + 0.5;

	// Mix between sharp and blurred reflections
	float env_sharp = texture2D(envmap, ruv).r;
	float env_blurred = texture2D(envmap_blurred, ruv).r;
	float env = mix(env_blurred, env_sharp, shinyness) + 0.1;
	
	// Directional light
	float ambient = 0.2;
	float direction_light = lambert(_normal, vec3(0.0,1.0,1.0)) + ambient;

	// Lightmap
	float lm = texture2D(lightmap, _uv2).r;
	lm += env;
	lm = clamp(lm, 0.0,1.0);

	// Diffuse map
	vec3 diff = texture2D(diffuse, _uv).rgb;

	vec3 final = diff * colour.rgb * vec3(env * direction_light);

	// Add highlight glow
	vec3 highlight_colour = vec3(0.5);
	final += (highlight_colour * highlight);

	gl_FragColor = vec4(final, 1.0);
}