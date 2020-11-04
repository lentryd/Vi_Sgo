const DataBase = require('../index');
module.exports = new class extends DataBase {
  /**
   * Токены с общим пользователем
   * @param {String} id Идентификатор пользователя
   * @param {Number} [i] Номер файла
   * @param {Object[]} [f] Совпавшие токены
   * @return {Promise<Object[]>} Токены
   */
  commonUser(id, i = 0, f = []) {
    return i < this.files.length ?
      this.read(this.files[i].replace('.vi', ''))
          .then((data) => data.uid == id ? f.push(data) : void 0)
          .then(() => this.commonUser(id, ++i, f)) :
      new Promise((res) => res(f));
  }
}(__dirname);
