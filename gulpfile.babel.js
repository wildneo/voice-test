import { src, dest, watch, task, series, parallel } from 'gulp';
import config from './config';

import fs             from 'fs';
import del            from 'del';
import pug            from 'gulp-pug';
import sass           from 'gulp-sass';
import mkdirp         from 'mkdirp';
import postcss        from 'gulp-postcss';
import ghpages        from 'gh-pages';
import imagemin       from 'gulp-imagemin';
import babelify       from 'babelify';
import browserify     from 'browserify';
import browserSync    from 'browser-sync';
import autoprefixer   from 'autoprefixer';

const postCssPlugins = [
  autoprefixer({grid: true})
];
const images = '**/*.{jpg,jpeg,png,gif,svg}';
const doNotEditMsg = 'Внимание! Файл создан автоматически. Любые изменения этого файла будут потеряны при следующей компиляции.\n';

const makePugMixinsFile = (cb) => {
  const blocksWithPug = getDirectories(config.blocks, 'pug');
  const dataAcc = (list, acc) => {
    list.forEach((item) => {
      acc += `include ${config.blocks.replace(config.src, '../') + item}/${item}.pug\n`
    });
    return acc;
  };
  fs.writeFileSync(
    `${config.pug}mixins.pug`,
    dataAcc(blocksWithPug, `//- ${doNotEditMsg}`)
  );
  cb();
};

const makeScssBlocksFile = (cb) => {
  const blocksWithScss = getDirectories(config.blocks, 'scss');
  const dataAcc = (list, acc) => {
    list.forEach((item) => {
      acc += `@import '${config.blocks + item}/${item}.scss';\n`
    });
    return acc;
  };
  fs.writeFileSync(
    `${config.scss}blocks.scss`,
    dataAcc(blocksWithScss, `// ${doNotEditMsg}`)
  );
  cb();
};

const makeJsEntryFile = (cb) => {
  const blocksWithJs = getDirectories(config.blocks, 'js');
  const dataAcc = (list, acc) => {
    list.forEach((item) => {
      acc += `import '${config.blocks.replace(config.src, '../') + item}/${item}.js';\n`
    });
    return acc;
  };
  fs.writeFileSync(
    `${config.js}entry.js`,
    dataAcc(blocksWithJs, `// ${doNotEditMsg}`)
  );
  cb();
};

const compilePug = (cb) => {
  src(`${config.pages}**/*.pug`)
  .pipe(pug({pretty: true}))
  .pipe(dest(config.build))
  cb();
};

const compileScss = (cb) => {
  src(`${config.scss}style.scss`)
  .pipe(sass().on('error', sass.logError))
  .pipe(postcss(postCssPlugins))
  .pipe(dest(`${config.build}css/`))
  cb();
};

const compileJs = (cb) => {
  if (!fileExist(`${config.build}js`)) {
    mkdirp(`${config.build}js`)
  }
  browserify(`${config.js}entry.js`)
  .transform(babelify, {presets: ['@babel/env']})
  .bundle()
  .pipe(fs.createWriteStream(`${config.build}js/bundle.js`))
  cb();
};

const minifyImg = (cb) => {
  src(config.img + images)
  .pipe(imagemin({
    interlaced: true,
    progressive: true
  }))
  .pipe(dest(`${config.build}img/`))
  cb();
};

const clearBuildDir = (cb) => {
  del.sync([`${config.build}**/*`])
  cb();
}

const deploy = (cb) => {
  ghpages.publish(config.build, cb);
}

const reload = (cb) => {
  browserSync.reload();
  cb();
};

const serve = () => {
  browserSync.init({
    server: config.build,
    port: 8080,
    startPath: 'index.html',
    open: false,
    notify: false
  });

  watch([`${config.pages}**/*.pug`], { events: ['change', 'add'], delay: 100 }, series(
    compilePug,
    reload
  ));

  watch([`${config.pug}**/*.pug`], { events: ['change', 'add'], delay: 100 }, series(
    compilePug,
    reload
  ));

  watch([`${config.scss}**/*.scss`], { events: ['change', 'add'], delay: 100 }, series(
    compileScss,
    reload
  ));

  watch([`${config.js}**/*.js`], { events: ['change', 'add'], delay: 100 }, series(
    compileJs,
    reload
  ));

  watch([config.img + images], { events: ['all'], delay: 100 }, series(
    minifyImg,
    reload
  ));

  watch([`${config.blocks}**/*.pug`], { events: ['add', 'unlink'], delay: 100 }, makePugMixinsFile);

  watch([`${config.blocks}**/*.pug`], { events: ['change'], delay: 100 }, series(
    compilePug,
    reload
  ));

  watch([`${config.blocks}**/*.scss`], { events: ['add', 'unlink'], delay: 100 }, makeScssBlocksFile);
  
  watch([`${config.blocks}**/*.scss`], { events: ['change'], delay: 100 }, series(
    compileScss,
    reload
  ));

  watch([`${config.blocks}**/*.js`], { events: ['add', 'unlink'], delay: 100 }, makeJsEntryFile);

  watch([`${config.blocks}**/*.js`], { events: ['change'], delay: 100 }, series(
    compileJs,
    reload
  ));
};

// Create mixins.pug:
task(makePugMixinsFile);

// Create blocks.scss:
task(makeScssBlocksFile);

// Create entry.js
task(makeJsEntryFile);

// Compile JS bundle:
task(compileJs);

// Compile Pug to HTML:
task(compilePug);

// Compile SCSS to CSS:
task(compileScss);

// Minify images
task(minifyImg);

// Clear build dir:
task(clearBuildDir);

// Deploy project:
task(deploy);

// Reload browsers:
task(reload);

// Start server:
task(serve);

// Default task:
task('default', series('clearBuildDir',
  parallel('makePugMixinsFile', 'makeScssBlocksFile', 'makeJsEntryFile'),
  parallel('compilePug', 'compileScss', 'compileJs'),
  'minifyImg',
  'serve'
));


// --------------------------------------------------------- //

/**
 * Получение всех названий поддиректорий, содержащих файл 
 * указанного расширения, совпадающий по имени с поддиректорией
 * @param  {string} src   директория, которая проверяется
 * @param  {string} ext   расширение файлов, которое проверяется
 * @return {array}        массив из имён файлов
 */
function getDirectories(src, ext) {
  return fs.readdirSync(src)
    .filter(item => fs.lstatSync(src + item).isDirectory())
    .filter(item => fileExist(`${src + item}/${item}.${ext}`));
};

/**
 * Проверяет сушествует файл/директория
 * @param  {string}  path  путь к файлу или директории
 * @return {boolean}
 */
function fileExist(path) {
  // const fs = require('fs');
  const flag = () => {
    try {
      fs.accessSync(path, fs.F_OK);
    } catch(err) {
      return false;
    }
    return true;
  }
  return flag();
};
