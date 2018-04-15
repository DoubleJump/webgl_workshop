function init()
{
	var menu = document.querySelector('.menu');
	var nav = document.querySelector('header');

	menu.addEventListener('click', function()
	{
		nav.classList.toggle('open');
	});
}

window.addEventListener('load', init);