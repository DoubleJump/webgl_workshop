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
uniform sampler2D envmap;
uniform sampler2D lightmap;
uniform sampler2D diffuse;
uniform float shinyness;

float lambert(vec3 N, vec3 L)
{
    return max(0.0, dot(N, normalize(L)));
}

void main() 
{
	vec3 r = reflect(_eye, _normal);
	float m = 2.0 * sqrt(pow(r.x, 2.0) + pow(r.y, 2.0) + pow(r.z + 1.0, 2.0));
	vec2 ruv = r.xy / m + 0.5;
	// /ruv.y = 1.0-ruv.y;
	float env = texture2D(envmap, 1.0-ruv).r * shinyness;
	
	float lambertA = lambert(_normal, vec3(0.0,1.0,0.0));
	//float lambertB = lambert(_normal, vec3(-0.8,0.0,0.0)) * 0.4;
	float ambient = 0.2;

	float lm = texture2D(lightmap, _uv2).r;
	lm = pow(lm, 3.0);
	//lm *= 1.8;

	//vec3 lightA = vec3(1.0,0.98,0.96) * lambertA;
	//vec3 lightB = vec3(0.94,0.98,1.0) * lambertB;

	vec3 diff = texture2D(diffuse, _uv).rgb * 1.2;
	//diff *= clamp((lm * lambertA) + env, 0.0,1.0);
	diff *= clamp(lm + env, 0.0,1.0);


	vec3 final = colour.rgb * diff;

	gl_FragColor = vec4(final, 1.0);
}