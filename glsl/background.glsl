varying vec2 _uv;

void main()
{ 
	_uv = uv;
	gl_Position = vec4(position, 1.0);
}

========

varying vec2 _uv;

uniform vec4 colour;

void main() 
{
	gl_FragColor = colour;
}