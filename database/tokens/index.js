const DataBase = require('../index');
module.exports = new class extends DataBase {
  /**
   * Токены с общим пользователем
   * @param {String} id Идентификатор пользователя
   * @param {Number} [i] Номер файла
   * @param {Object[]} [f] Совпавшие токены
   * @return {Promise<Object[]>} Токены
   */
  commonUsers(id, i = 0, f = []) {
    return i < this.files.length ?
      this.read(this.files[i].replace('.vi', ''))
          .then((data) => data.uid == id ? f.push(data) : void 0)
          .then(() => this.commonUsers(id, ++i, f)) :
      new Promise((res) => res(f));
  }

  /**
   * Токены с общим пользователем
   * @param {String} id Идентификатор пользователя
   * @param {Number} [i] Номер пользователя\
   * @return {Promise<void>}
   */
  removeCommonUsers(id, i = 0) {
    return i < this.files.length ?
      this.read(this.files[i].replace('.vi', ''))
          .then((data) => {
            if (data.uid == id) return this.del(data.id);
            else i++;
          })
          .then(() => this.removeCommonUsers(id, i)) :
      new Promise((res) => res());
  }
}(__dirname);
