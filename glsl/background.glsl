varying vec2 _uv;

void main()
{ 
	_uv = uv;
	gl_Position = vec4(position, 1.0);
}

========

varying vec2 _uv;

uniform vec3 colourA;
uniform vec3 colourB;

float vignette(vec2 p, float r)
{
	return 1.0 - (length(p) * r);
}

void main() 
{
	float g = 1.0 - _uv.y;
	float v = vignette(_uv - 0.3, 1.0);
	vec3 rgb = mix(colourB, colourA, v);

	gl_FragColor = vec4(rgb, 1.0);
}