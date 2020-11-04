const fs = require('fs');

/**
 * Генерация GUID'а
 * @return {String}
 */
function guid() {
  return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = class {
  /**
   * Работа с файлами
   * @param {String} path Абсолютный путь на папку с данными
   */
  constructor(path) {
    this.path = path + '/';
    this.files = [];
  }

  /**
   * Инициализация хранилища
   * @return {Promise<this>}
   */
  init() {
    return new Promise((resolve, reject) => fs.stat(this.path, (err, stats) => {
      if (err) {
        reject(new Error(`'${this.path}' not exist`));
      } else if (!stats.isDirectory()) {
        reject(new Error(`'${this.path}' must be directory`));
      } else {
        resolve();
      }
    }))
        .then(() => new Promise(
            (res, rej) => fs.readdir(this.path, (err, files) => {
              if (err) {
                rej(new Error(`Can't read directory`));
                return;
              }

              this.files = files.filter((f) => f.endsWith('.vi'));
              res(this);
            })),
        );
  }

  /**
   * Проверить наличие файла
   * @param {String} id ID файла
   * @return {Boolean} `true` если файл есть
   */
  exist(id) {
    return this.files.includes(id + '.vi');
  }

  /**
   * Добавление данных
   * @param {*} data Данные которые нужно сохранить
   * @return {Promise<String>} ID созданного файла
   */
  add(data) {
    return new Promise((resolve, reject) => {
      let id = '';
      do {
        id = guid();
      } while (this.exist(id));

      const date = new Date().toJSON();
      fs.writeFile(
          this.path + id + '.vi',
          JSON.stringify({
            id,
            timestamps: {
              create: date,
              write: date,
            },
            data,
          }),
          (err) => {
            if (err) {
              reject(err);
              return;
            }

            this.files.push(id + '.vi');
            resolve(id);
          },
      );
    });
  }

  /**
   * Получение данныех
   * @param {String} id ID файла
   * @param {Boolean} [onlyData] `true` если нужно возвращать только данные
   * @return {Promise<*>}
   */
  read(id, onlyData = true) {
    return new Promise((resolve, reject) => {
      if (!this.exist(id)) {
        reject(new Error(`'${id}' not exist`));
        return;
      }
      fs.readFile(
          this.path + id + '.vi',
          (err, data) => {
            if (err) {
              reject(err);
              return;
            }
            try {
              const fileData = JSON.parse(data.toString());
              resolve(onlyData ?
                {
                  ...fileData.data,
                  id: fileData.id,
                } : fileData,
              );
            } catch (e) {
              reject(e);
            }
          },
      );
    });
  }

  /**
   * Запись данных
   * @param {String} id ID файла
   * @param {*} newData Данные, которые нужно сохранить
   * @return {Promise<Boolean>} `true` если все сохранилось
  */
  write(id, newData) {
    return this.read(id, false)
        .then(({timestamps, data}) => new Promise((resolve, reject) => {
          fs.writeFile(
              this.path + id + '.vi',
              JSON.stringify({
                id,
                timestamps: {
                  ...timestamps,
                  write: new Date().toJSON(),
                },
                data: {
                  ...data,
                  ...newData,
                },
              }),
              (err) => {
                if (err) {
                  reject(err);
                  return;
                }
                resolve({
                  ...data,
                  ...newData,
                });
              },
          );
        }));
  }

  /**
   * Удаление данных
   * @param {String} id ID файла
   * @return {Promise<Boolean>} `true` если данные удалены
   */
  del(id) {
    return new Promise((resolve, reject) => {
      if (!this.exist(id)) {
        reject(new Error(`'${id}' not exist`));
        return;
      }
      fs.unlink(
          this.path + id + '.vi',
          (err) => {
            if (err) {
              reject(err);
              return;
            }
            this.files.splice(
                this.files.findIndex((f) => f == id + '.vi'),
                1,
            );
            resolve(true);
          },
      );
    });
  }
};
