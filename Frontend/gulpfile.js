const gulp = require('gulp');
const babel = require('gulp-babel');
const runSequence = require('run-sequence');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const plumber = require('gulp-plumber');

const scripts = [
  'js/script.js',
];

gulp.task('wrapJs', () => {
  return gulp.src(scripts)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['@babel/preset-env'],
    }))
    .pipe(concat('scripts.min.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('js/'))
})

gulp.task('watch', () => {
  gulp.watch(scripts, gulp.series('wrapJs', done => {
    done();
  }));
})

gulp.task('build', gulp.series('wrapJs', done => {
  done();
}));

gulp.task('default', gulp.series('build', done => {
  done();
}));