'use strict';

// Генератор файлов блока

// Использование: node createBlock.js [имя блока] [доп. расширения через пробел]

const mkdirp = require('mkdirp');
const fs = require('fs');
const config = require('./config');

const blockName = process.argv[2];
const blockSrc = `${config.blocks + blockName}/`;
const defaultExtensions = ['scss', 'pug'];
const extensions = unique(defaultExtensions.concat(process.argv.slice(3)));

/**
 * Создает блок
 * @param {string}  src   Директория в которой распологаются блоки
 * @param {string}  name  Имя блока
 * @param {any}     exts  Массив с расширениями файлов блока
 */
const createBlock = (src, name, exts) => {
  mkdirp(src, (err) => {
    if (err) {
      console.error(`Отмена операции: ${err}`);
    } else {
      exts.forEach((ext) => {
        if (ext === 'img') {
          const filePath = `${src}/${ext}`;
          createDir(filePath);
        } else {
          const filePath = `${src + name}.${ext}`;
          createFile(filePath, fileContent(ext));
        }
      });
    };
  });
};

/**
 * Создает новый файл
 * @param {string} path     путь к файлу
 * @param {string} content  содержание файла
 */
const createFile = (path, content) => {
  // const fs = require('fs');
  if (fileExist(path)) {
    console.error(`Файл уже существует: ${path}`);
  } else {
    fs.writeFile(path, content, (err) => {
      if (err) {
        console.error(`Не удалось создать файл: ${path}`);
      } else {
        console.log(`Файл успешно создан: ${path}`);
      }
    });
  }
};

/**
 * Создает новую директорию
 * @param {string}  path  путь к директории
 */
const createDir = (path) => {
  if (fileExist(path)) {
    console.error(`Директория уже существует: ${path}`);
  } else {
    mkdirp(path, (err => {
      if (err) {
        console.error(`Не удалось создать директорию: ${path}`);
      } else {
        console.log(`Директория успешно создана: ${path}`);
      }
    }));
  }
};

const fileContent = (ext) => {
  switch (ext) {
    case 'pug':
      return '';
    case 'scss':
      return '';
    case 'js':
      return `import { default as ready } from '../../js/utils/ready';`;
  }
};

// Если есть имя блока - поехали
if (blockName) {
  createBlock(blockSrc, blockName, extensions);
} else {
  console.error('Отмена операции: не указано имя блока');
};

/**
 * Проверяет сушествует файл/директория
 * @param   {string}  path  путь к файлу или директории
 * @return  {boolean}
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

/**
 * Возвращает массив, содержащий только уникальные элементы
 * @param   {array} arr   любой массив
 * @return  {array}       массив, содержащий уникальные элементы
 */
function unique(arr) {
  const obj = {};
  arr.forEach((str) => {
    obj[str] = true;
  });
  return Object.keys(obj);
};
