const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const figlet = require('figlet');
const chalk = require('chalk');

const NODE_CONFIG = require('./local.config.js');

gulp.task('nodemon', function() {

	figlet('yuenode', function(err, data) {
		if (err) {
			console.log('Something went wrong...');
			console.dir(err);
			return;
		}
		console.log(chalk.bold.green(data));
	});
    nodemon({
        script: 'app.js',
        nodeArgs: ['--harmony'],
        env: NODE_CONFIG.apps[0].env
    }).on('restart');

});

gulp.task('default', ['nodemon']);
