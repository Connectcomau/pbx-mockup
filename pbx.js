function inject(source, dest, data) {
	// grab the template source by id
	// compile it 
	// insert into html of the dest id
	var tpl = $('#'+source).html();
	var compiled = Handlebars.compile(tpl);
	$('#'+dest).html(compiled);
	console.log('injected', source, dest);
}

$(document).ready(function() {
	inject('t_menu', 'menu');	
});

