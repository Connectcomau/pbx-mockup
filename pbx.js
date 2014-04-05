var pbx = {
	main: '',
	users: TAFFY(),
	lines: TAFFY(),
	groups: TAFFY()
};

Handlebars.registerHelper('names', function(options) {
	return JSON.stringify(pbx.users().get().map(function(u) { return {value: u.id, text: u.name}; }));
});

function gen_id() {
	var id = '', i;
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (i = 0; i < 9; i++) id += possible.charAt(Math.floor(Math.random() * possible.length));
	return id;
}

function inject(source, dest, data) {
	// grab the template source by id
	// compile it and return html with context
	// insert into html of the dest id
	var src = $('#'+source).html();
	var template = Handlebars.compile(src || '');
	var html = template(data || {});
	$('#'+dest).html(html);
	console.log('injected', source, dest);
}

function render_menu() {
	// grab the datas for active state and badge counts
	var data = {};
	data.active = pbx_main;
	data.users = pbx.users().count() || '';
	data.lines = pbx.lines().count() || '';
	data.groups = pbx.groups().count() || '';

	inject('t_menu', 'menu', data);	
}

function render_main() {
	// probably have to get data and shit
	var data = {
		users: pbx.users().get(),
		lines: pbx.lines().get(),
		groups: pbx.groups().get()
	};

	// attach extra data on lines for showing names
	data.lines.forEach(function(l) {
		if (l.user_id) {
			var u = pbx.users({id: l.user_id}).get();
			if (u.length) l.user_name = u[0].name;
		}
	});

	inject('t_'+pbx_main, 'main', data);

	// setup editable hooks
	$('#main [data-e="y"]').editable();

	// may as well here
	save_db();
}

function set_main(main) {
	pbx_main = main;

	render_menu();
	render_main();
}

function supports_storage() {
  try {
    return 'localStorage' in window && window.localStorage !== null;
  }
	catch (e) {
    return false;
  }
}

function init_db() {
	if (supports_storage()) {
		try {
			var u = JSON.parse(localStorage.users || '[]');
			var l = JSON.parse(localStorage.lines || '[]');
			var g = JSON.parse(localStorage.groups || '[]');
			pbx.users.insert(u);
			pbx.lines.insert(l);
			pbx.groups.insert(g);
		}
		catch (e) {
			console.error(e);
			console.log('failed to restore db, resetting it.');
			localStorage.users = '[]';
			localStorage.groups = '[]';
			localStorage.lines = '[]';
		}
	}
}

function reset() {
	pbx.users().remove();
	pbx.lines().remove();
	pbx.groups().remove();
	save_db();
	render_menu();
	render_main();
}

function save_db() {
	localStorage.users = pbx.users().stringify();
	localStorage.lines = pbx.lines().stringify();
	localStorage.groups = pbx.groups().stringify();
}

function editable_handler(response, new_value) {
	var id = $(this).data('id');
	var col = $(this).data('col');
	console.log('saving', id, col, new_value);
	var update = {};
	update[col] = new_value;
	pbx[pbx_main]().filter({id: id}).update(update);
	save_db();
}

function toggle_value(db, id, col) {
	console.log('toggling', db, id, col);
	pbx[db]().filter({id: id}).update(function() { this[col] = !this[col]; return this;});
	render_main();
}

function add_line_to_group(group_id) {
	pbx.groups({id: group_id}).update(function() { this.lines.push({}); return this; });
	render_main();
}

function add_user() {
	// just a blank user is fine
	pbx.users.insert([{id: gen_id()}]);
	render_menu();
	render_main();
}

function delete_user(id) {
	pbx.users().filter({id: id}).remove();
	render_menu();
	render_main();
}

function add_line() {
	// just a blank user is fine
	pbx.lines.insert([{id: gen_id()}]);
	render_menu();
	render_main();
}

function delete_line(id) {
	pbx.lines().filter({id: id}).remove();
	render_menu();
	render_main();
}

function add_group() {
	// just a blank user is fine
	pbx.groups.insert([{id: gen_id(), lines: []}]);
	render_menu();
	render_main();
}

function delete_group(id) {
	pbx.groups().filter({id: id}).remove();
	render_menu();
	render_main();
}

$(document).ready(function() {
	// editable settings
	$.fn.editable.defaults.mode = 'inline';
	$.fn.editable.defaults.success = editable_handler;

	init_db();
	set_main('users');
});

