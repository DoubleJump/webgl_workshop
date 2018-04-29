var basepath = 'guide/';
var guide_index = 0;

var guide_urls = 
{
	'Introduction': 'index',
	'Scene Structure': 'scene-structure',
	'Render Pipeline': 'render-pipeline',
	'Loading Assets': 'loading-assets',
	'Meshes': 'meshes',
	"Fake it 'til you make it": 'fake-it-till-you-make-it',
	'Input & Interaction': 'input-and-interaction',
	'Blender Exporter': 'blender-exporter',
	'Groups & Parenting': 'groups-and-parenting',
	'UV Mapping': 'uv-mapping',
	'Raycasting': 'raycasting',
	'Fresnel': 'fresnel',
	'Animation': 'animation',
};

function init()
{
	document.querySelector('title').innerText = 'Practical 3D for Websites';

	//var menu = document.querySelector('.menu');
	var header = document.querySelector('header');
	var nav = document.querySelector('nav');
	var h1 = document.querySelector('h1');

	var i = 0;
	for(var k in guide_urls)
	{
		var link = document.createElement('a')
		link.setAttribute('href', guide_urls[k] + '.html');
		link.innerText = k;
		nav.appendChild(link);

		if(k === h1.innerText)
		{
			guide_index = i;
			link.classList.add('active');
		}
		i++;
	}

	// menu.addEventListener('click', function()
	// {
	// 	header.classList.toggle('open');
	// });

	window.addEventListener('keydown', function(e)
	{
		var code = e.keyCode;
		var dst;
		if(code === 37)
		{
			if(guide_index === 0) return;
			dst = guide_index - 1;
		}
		if(code === 39)
		{
			if(guide_urls.length - 1 === 0) return;
			dst = guide_index + 1;
		}

		var keys = Object.keys(guide_urls);
		//window.url = guide_urls[keys[dst]] + '.html';
	});

	window.addEventListener('keydown', function()
	{
		document.querySelector('header').classList.toggle('hidden');
	})
}

window.addEventListener('load', init);