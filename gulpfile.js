import gulp from 'gulp';
import plumber from 'gulp-plumber';
import sass from 'gulp-dart-sass';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import csso from 'postcss-csso';
import rename from 'gulp-rename';
import htmlmin from 'gulp-htmlmin';
import terser from 'gulp-terser';
import squoosh from 'gulp-libsquoosh';
import svgo from 'gulp-svgmin';
import del from 'del';
import browser from 'browser-sync';
import replace from 'gulp-replace';
import { stacksvg } from 'gulp-stacksvg';

// Styles
export const styles = () => {
  return gulp.src('source/sass/style.scss', {sourcemaps: true})
    .pipe(plumber())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([
      autoprefixer(),
      csso()
    ]))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('build/css', {sourcemaps: '.'}))
    .pipe(browser.stream());
}

// Scripts
const scripts = () => {
  return gulp.src('source/js/*.js')
    .pipe(terser())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('build/js'))
    .pipe(browser.stream());
}

// HTML
const html = () => {
  return gulp.src('source/*.html')
    .pipe(replace('.css', '.min.css'))
    .pipe(replace('.js', '.min.js'))
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('build'));
}

// Images
const optimizeImages = () => {
  return gulp.src('source/img/**/*.{png,jpg}')
    .pipe(squoosh())
    .pipe(gulp.dest('build/img'))
}

const copyImages = () => {
  return gulp.src('source/img/**/*.{png,jpg}')
    .pipe(gulp.dest('build/img'))
}

// WebP
const createWebp = () => {
  return gulp.src('source/img/**/*.{png,jpg}')
    .pipe(squoosh({
      webp: {}
    }))
    .pipe(gulp.dest('build/img'))
}

// SVG
const svg = () =>
  gulp.src(['source/img/**/*.svg', '!source/img/sprites/*.svg'])
    .pipe(svgo())
    .pipe(gulp.dest('build/img'));

const stack = () => {
  return gulp.src('source/img/sprites/*.svg')
    .pipe(svgo())
    .pipe(stacksvg({output: 'stack.svg'}))
    .pipe(gulp.dest('build/img'));
}

// Copy
const copy = (done) => {
  gulp.src([
    'source/fonts/**/*.{woff2,woff}',
    'source/*.ico',
    'source/*.webmanifest',
  ], {
    base: 'source'
  })
    .pipe(gulp.dest('build'))
  done();
}

// Clean
const clean = () => {
  return del('build');
};

// Server
const server = (done) => {
  browser.init({
    server: {
      baseDir: 'build'
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

// Reload
const reload = (done) => {
  browser.reload();
  done();
}

// Watcher
const watcher = () => {
  gulp.watch('source/sass/**/*.scss', gulp.series(styles));
  gulp.watch('source/js/*.js', gulp.series(scripts));
  gulp.watch('source/*.html', gulp.series(html, reload));
}

// Build
export const build = gulp.series(
  clean,
  copy,
  optimizeImages,
  gulp.parallel(
    styles,
    html,
    scripts,
    svg,
    stack,
    createWebp
  )
);

// Default
export default gulp.series(
  clean,
  copy,
  copyImages,
  gulp.parallel(
    styles,
    html,
    scripts,
    svg,
    stack,
    createWebp
  ),
  gulp.series(
    server,
    watcher
  )
);
