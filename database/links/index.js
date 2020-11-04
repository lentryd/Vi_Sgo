const DataBase = require('../index');
module.exports = new class extends DataBase {
  /**
   * Получение данныех
   * @param {String} id ID файла
   * @param {Boolean} [onlyData] Только данные
   * @return {Promise<*>}
   */
  read(id, onlyData = true) {
    return super.read(id, false)
        .then((link) => {
          if (
            Date.now() - new Date(link.timestamps.create) >= 18e5 ||
            link.data.work == false
          ) {
            return this.del(id)
                .then(() => {
                  throw new Error(`'${id}' not exist`);
                });
          }
          return onlyData ? link.data : link;
        });
  }
  /**
   * Все ссылки для токена
   * @param {String} id токен
    * @param {Number} [i] индекс файла
   * @param {Object[]} [fits] совпадения
   * @return {Promise<*>} ссылки
   */
  _linkWithToken(id, i = 0, fits = []) {
    return i < this.files.length ?
      this.read(this.files[i].replace('.vi', ''))
          .then((data) => data.tid == id ? fits.push(data.id) : void 0)
          .catch(() => void 0)
          .then(() => this._linkWithToken(id, ++i, fits)) :
      new Promise((res) => res(fits));
  }

  /**
   * ID ссылки для подключения
   * @param {String} id ID токена
   * @return {Promise<String>} ID ссылки
   */
  connectionLink(id) {
    return this._linkWithToken(id)
        .then((links) => !links.length ?
          this.add({tid: id, work: true}) :
          links[0],
        );
  }
}(__dirname);
