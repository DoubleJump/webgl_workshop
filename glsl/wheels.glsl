void main() 
{
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

========

uniform vec4 colour;

void main() 
{
	gl_FragColor = colour;
}