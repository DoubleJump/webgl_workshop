//VERTEXSHADER

void main()
{ 
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

//FRAGMENTSHADER

void main() 
{
	gl_FragColor = vec4(1.0);
}