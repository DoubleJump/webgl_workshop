varying vec3 _eye;
varying vec3 _normal;

void main() 
{
	_eye = vec3(modelViewMatrix * vec4(position, 1.0));
	_normal = normalMatrix * normal;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

========

uniform sampler2D matcap;

varying vec3 _eye;
varying vec3 _normal;

void main() 
{
	vec3 r = reflect(_eye, _normal);
	float m = 2.0 * sqrt(pow(r.x, 2.0) + pow(r.y, 2.0) + pow(r.z + 1.0, 2.0));
	vec2 ruv = r.xy / m + 0.5;
	vec3 base = texture2D(matcap, 1.0-ruv).rgb;
	gl_FragColor = vec4(base, 1.0);
}