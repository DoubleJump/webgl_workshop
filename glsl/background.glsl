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
	//return smoothstep(0.0,1.0, length(p) * r);
}

void main() 
{
	//float v = smoothstep(0.468,-0.276, _uv.y);
	//vec3 a = vec3(0.1,0.1,0.12);
	//vec3 b = vec3(0.1,0.1,0.12);
	//vec3 rgb = mix(a,b,v);

	float g = 1.0 - _uv.y;
	float v = vignette(_uv - 0.3, 1.0);

	vec3 rgb = mix(colourB, colourA, v);// * 1.2;


	gl_FragColor = vec4(rgb, 1.0);
}