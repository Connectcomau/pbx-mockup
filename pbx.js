var pbx = {
	main: '',
	users: TAFFY(),
	lines: TAFFY(),
	groups: TAFFY(),
	ivr: TAFFY()
};

function user_name(id) {
	var user = pbx.users({id: id}).get();
	var name = 'DELETED';
	if ( ! id) name = '';
	if (user.length) name = user[0].name;
	return name;
}

Handlebars.registerHelper('names', function(options) {
	return JSON.stringify(pbx.users().get().map(function(u) { return {value: u.id, text: u.name || ''}; }));
});

Handlebars.registerHelper('lines_select', function(options) {
	var lines = [{value: null, text: ''}];
	pbx.lines().each(function(l) {
		lines.push({value: l.id, text: l.ext + ' ' + user_name(l.user_id) || ''});
	});
	return JSON.stringify(lines);
});

Handlebars.registerHelper('user_name', function(id, options) {
	var user = pbx.users({id: id}).get();
	if (user.length) return user[0].name;
});

Handlebars.registerHelper('line_info', function(id, options) {
	var line = pbx.lines({id: id}).get();
	if (line.length) {
		return line[0].ext + ' ' + user_name(line[0].user_id);
	}
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
		groups: pbx.groups().get(),
		ivr: pbx.ivr().get()
	};

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
			var i = JSON.parse(localStorage.ivr || '[]');
			pbx.users.insert(u);
			pbx.lines.insert(l);
			pbx.groups.insert(g);
			pbx.ivr.insert(i);
		}
		catch (e) {
			console.error(e);
			console.log('failed to restore db, resetting it.');
			localStorage.users = '[]';
			localStorage.groups = '[]';
			localStorage.lines = '[]';
			localStorage.ivr = '[]';
		}
	}

	if (pbx.ivr().get().length !== 10) {
		pbx.ivr().remove();
		for (var x=0; x<10; x++) {
			pbx.ivr.insert([{ id: x }]);
		}
		save_db();
	}
}

function reset() {
	pbx.users().remove();
	pbx.lines().remove();
	pbx.groups().remove();
	pbx.ivr().remove();
	save_db();
	render_menu();
	render_main();
}

function save_db() {
	localStorage.users = pbx.users().stringify();
	localStorage.lines = pbx.lines().stringify();
	localStorage.groups = pbx.groups().stringify();
	localStorage.ivr = pbx.ivr().stringify();
}

function editable_handler(response, new_value) {
	var id = $(this).data('id');
	var col = $(this).data('col');
	console.log('saving', id, col, new_value);
	var update = {};
	update[col] = new_value;

	var db = pbx_main;
	if (db === 'settings') db = 'ivr';
	pbx[db]().filter({id: id}).update(update);
	save_db();
}

function toggle_value(db, id, col) {
	console.log('toggling', db, id, col);
	pbx[db]().filter({id: id}).update(function() { this[col] = !this[col]; return this;});
	render_main();
}

function add_line_to_group(group_id) {
	// grab the selected line
	var line_id = $('select.hunt_' + group_id).val();
	if ( ! line_id) return false;
	pbx.groups({id: group_id}).update(function() { this.lines.push({ line_id: line_id }); return this; });
	render_main();
}

function delete_line_in_group(index, group_id) {
	var group = pbx.groups({id: group_id});
	if (group.get().length) {
		group.update(function() {
			this.lines.splice(index, 1);
			return this;
		});
	}
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

function auto_lines() {
	var start = 100;
	pbx.users().get().forEach(function(u) {
		pbx.lines.insert([{id: gen_id(), ext: start.toString(), user_id: u.id}]);
		start++;
	});
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

