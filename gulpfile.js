var gulp = require('gulp'),
	less = require('gulp-less'),
	server = require('gulp-server-livereload'),
	browser = require('browser-sync'),
	autoPrefixer = require('gulp-autoprefixer'),
	browserSync = browser.create();
var PORT = 8080;
var loadMap = [
		'../v_live/**.*',
		'js/**.*'
	];
gulp.task('server', [], function () {
  // content
  browserSync.init(loadMap,{
    server: './',
    port: PORT
  });
  gulp.watch(loadMap, function (file) {
    browserSync.reload();
  });
});


gulp.task('less', function () {
    gulp.src(['style/less/*.less','!style/less/extend/{reset,test}.less'])
        .pipe(less())
        .pipe(autoPrefixer({
	      browsers: ['last 2 versions', 'Android >= 4.0'],
	      cascade: true, //是否美化属性值 默认：true 像这样：
	      //-webkit-transform: rotate(45deg);
	      //        transform: rotate(45deg);
	      remove: true //是否去掉不必要的前缀 默认：true
	    }))
        .pipe(gulp.dest('style/css'));
});
 
gulp.task('lessWatch', function () {
    gulp.watch('style/less/*.less', ['less']); //当所有less文件发生改变时，调用testLess任务
});

gulp.task('webserver',['lessWatch'],function () {
	gulp.src('../v_live/')
		.pipe(server({
	      host : 'lms.yinyuetai.com',
	      livereload: true,
	      directoryListen: true,
	      open: true,
	      // port : 8080,
	      defaultFile : 'index.html',
	    }))
	    .pipe(connect.reload());
});

var connect = require('gulp-connect');
 
gulp.task('connect', function() {
  connect.server({
    root: '../v_live/',
    livereload: true ,
    host : 'lms.yinyuetai.com'
  });
});
 
gulp.task('html', function () {
  gulp.src('/*.html')
    .pipe(connect.reload());
});
 
gulp.task('watch', function () {
  gulp.watch(['/*.html'], ['html']);
});
 
gulp.task('default', ['connect', 'watch','lessWatch','server']);