const WebSocket = require('ws');
const crypto = require('crypto');
const fetch = require('node-fetch');
const htmlParser = require('node-html-parser');

/**
 * Обработка ошибки во время запросов
 */
class FetchError {
  /**
   * Инициализация ошибки
   * @param {Response} res Ответ сервера
   * @param {*} sameData Данные, которые нужно передать вместе с ошибкой
   */
  constructor(res, sameData) {
    this.fr = true;
    this.res = res;
    this.status = res.status;
    this.statusText = res.statusText;
    this.sameData = sameData;
  }

  /**
   * Проверяет работу сервера (статус 500)
   * @return {Boolean} `true` если сервер лег
   */
  work() {
    return this.status >= 500;
  }

  /**
   * Проверяет авторизацию (статуст 401, 403, 409)
   * @return {Boolean} `true` если есть проблемы с авторизацие
   */
  auth() {
    return this.status == 409 || this.status == 401 || this.status == 403;
  }

  /**
   * Текст ответа
   * @return {Promise<String>}
   */
  text() {
    return this.res.text();
  }

  /**
   * Текст ответа в виде JSON
   * @return {Promise<JSON>}
   */
  json() {
    return this.res.json();
  }

  /**
   * Данные, которые были переданы в ошибку (по умолчанию {})
   * @return {*}
   */
  get data() {
    return this.sameData || {};
  }

  /**
   * Сообщение об ошибке
   * @return {string}
   */
  get message() {
    return `code: ${this.status}\ntext: ${this.statusText}`;
  }
}

/**
 * Обработка ошибки во время проверок и т.д.
 */
class WorkError {
  /**
   * Инициализация ошибки
   * @param {String} msg Сообщение
   * @param {Number} [code] Код ошибки, по умолчанию `0`
   */
  constructor(msg, code = 0) {
    this.wr = true;
    this._msg = msg;
    this._code = code;
  }

  /**
   * Сообщение ошибки
   * @return {String}
   */
  get message() {
    return this._msg;
  }

  /**
   * Код ошибки
   * @return {Number}
   */
  get code() {
    return this._code;
  }

  /**
   * Ответ в виде строки
   * @return {String}
   */
  toString() {
    return `code: ${this.code}\nmessage: ${this.message}`;
  }
}

/**
 * MD5 хэш
 * @param {String} str Исходная строка
 * @return {String}
 */
function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

module.exports = class {
  /**
   * Проверка сервера
   * @param {String} host Ссылка на проверяемый сервер (example.com)
   * @param {Object} [cb] Callback функции
   * @param {Function} [cb.done] Вызовется, если сервер прошел проверку
   * @param {Function} [cb.fail] Вызовется, если сервер не прошел проверку
   * @return {Promise<Response>}
   */
  static checkHost(host, cb) {
    return fetch(`http://${host}/webapi/prepareloginform`)
        .then((res) => {
          if (
            !res.ok ||
            !res.headers.get('content-type').startsWith('application/json')
          ) throw new FetchError(res);

          cb?.done?.call(this, res);
          return res;
        })
        .catch((err) => {
          cb?.fail?.call(this, err);
          throw err;
        });
  }

  /**
   * Получение формы авторизации
   * @param {String} host  Ссылка на сервер (example.com)
   * @param {Object} [cb] Callback функции
   * @param {Function} [cb.done] Вызовется, если сервер прошел проверку
   * @param {Function} [cb.fail] Вызовется, если сервер не прошел проверку
   * @return {Promise<JSON>}
   */
  static authData(host, cb) {
    const selectors = [];
    return fetch(`http://${host}/webapi/logindata`)
        // Проверяем ответ и по возможности парсим в JSON
        .then((res) => {
          if (
            !res.ok ||
            !res.headers.get('content-type').startsWith('application/json')
          ) throw new FetchError(res);

          return res.json();
        })
        // Получаем форму авториизации (селекторы которые она содержит)
        .then(({version}) => fetch(
            `http://${host}/vendor/pages/about/templates/loginform.html?ver=${version}`,
        ))
        // Проверяем ответ и получаем текст ответа
        .then((res) => {
          if (
            !res.ok ||
            !res.headers.get('content-type').startsWith('text/html')
          ) throw new FetchError(res);

          return res.text();
        })
        // Превращаем текст в html
        .then(htmlParser.parse)
        // Ищем все селекторы
        .then((root) => {
          for (const s of root.querySelectorAll('#message select')) {
            selectors.push({
              id: s.id,
              value: null,
              name: s.getAttribute('name'),
              options: [],
            });
          }
          return fetch(`http://${host}/webapi/prepareloginform`);
        })
        // Проверяем ответ и по возможности парсим в JSON
        .then((res) => {
          if (
            !res.ok ||
            !res.headers.get('content-type').startsWith('application/json')
          ) throw new FetchError(res);

          return res.json();
        })
        // Возвращаем полученные данные
        .then((data) => {
          for (const name in data) {
            if (!name) continue;
            const value = data[name];
            const index = selectors.findIndex(
                (s) =>
                  s.id.toLowerCase() == name.toLowerCase() ||
                    s.name.toLowerCase() == name.toLowerCase(),
            );
            if (index < 0) continue;

            selectors[index][
                typeof value == 'number' ?
                'value' :
                'options'
            ] = value;
          }
          cb?.done?.call(this, selectors);
          return selectors;
        })
        // Обрабатываем ошибки
        .catch((err) => {
          cb?.fail?.call(this, err);
          throw err;
        });
  }

  /**
   * Получение данных селектора
   * @param {String} host Ссылка на сервер (example.com)
   * @param {Object} data Данные для запроса
   * @param {String} data.lastElem Последний выбор
   * @param {Object} data.alreadySelected Уже выбранные данные
   * @param {Object} [cb] Callback функции
   * @param {Function} [cb.done] Вызовется, если сервер прошел проверку
   * @param {Function} [cb.fail] Вызовется, если сервер не прошел проверку
   * @return {Promise<JSON>}
   */
  static selectedData(host, data, cb) {
    let selectedData = '';
    for (const name in data?.alreadySelected) {
      if (!name) continue;

      if (selectedData) selectedData += '&';
      selectedData += `${name}=${data.alreadySelected[name]}`;
    }
    return fetch(`http://${host}/webapi/loginform?${selectedData}&LASTNAME=${data.lastElem}`)
        // Проверяем ответ и по возможности парсим в JSON
        .then((res) => {
          if (
            !res.ok ||
            !res.headers.get('content-type').startsWith('application/json')
          ) throw new FetchError(res);

          return res.json();
        })
        // Отправляем данные
        .then(({items}) => (
          cb?.done?.call(this, items),
          items
        ))
        // Обрабатываем ошибку
        .catch((err) => {
          cb?.fail?.call(this, err);
          throw err;
        });
  }

  /**
   * Обвязка для удобного взаимодействия
   * @param {String} host Ссылка на сервер
   * @param {String} login Логин ученика
   * @param {String} password Пароль ученика
   * @param {String} ttsLogin Данные авторизации (регион, школа и т.д.)
   */
  constructor(host, login, password, ttsLogin) {
    this.at = null;
    this.ver = null;
    this.range = {
      start: null,
      end: null,
    };
    this._host = host;
    this._cookie = {};
    this.subjects = [];
    this.login = login;
    this.userId = null;
    this.yearId = null;
    this.classId = null;
    this.secure = false;
    this.schoolId = null;
    this.currYear = null;
    this.dateFormat = null;
    this.password = password;
    this.tokenTimeOut = null;
    this.fullSchoolName = null;
    this.serverTimeZone = null;
    this.ttsLogin = ttsLogin.toLowerCase();
  }

  /**
   * Ссылка на сайт
   * @return {String}
   */
  get host() {
    return `http${this.secure?'s':''}://${this._host}`;
  }

  /**
   * Ссылка на сайт для ws
   * @return {String}
   */
  get hostWS() {
    return `ws${this.secure?'s':''}://${this._host}`;
  }

  /**
   * Часто используемые заголовки
   * @return {Object}
   */
  get headers() {
    return {
      'cookie': this.cookie,
      'referer': `${this.host}`,
      'x-requested-with': 'xmlhttprequest',
      'content-type': 'application/x-www-form-urlencoded',
    };
  }

  /**
   * Возврящает куки
   * @return {String}
   */
  get cookie() {
    let str = '';
    for (const key in this._cookie) {
      if (!this._cookie[key]) continue;
      if (str != '') str += '; ';
      str += key + '=' + this._cookie[key];
    }
    return str;
  }

  /**
   * Проверяет нужна ли авторизация
   * @return {Boolean}
   */
  get needAuth() {
    return !this.at || !this.ver || this.tokenTimeOut - Date.now() <= 0;
  }

  /**
   * Устанавливает куки для парсера
   * @param {Response} res Ответ сервера
   * @return {Response}
   */
  setCookie(res) {
    for (const c of res.headers.raw()['set-cookie'] || []) {
      if (typeof c != 'string') continue;
      const [, name, value] = c.match(/^(.+?)=(.+?)(?=;|$)/) || [];
      if (!name || !value) continue;
      this._cookie[name] = value;
    }
    return res;
  }

  /**
   * Проверка ответа сервера (res == JSON)
   * @param {Response} res Ответ сервера
   * @throws {FetchError} Ошибка будет вызвана, если ответ не является JSON или
   * `res.ok == false`
   * @return {Promise} JSON
   */
  checkJSON(res) {
    if (
      !res.ok ||
      !res.headers.get('content-type').startsWith('application/json')
    ) throw new FetchError(res);
    else return res.json();
  }

  /**
   * Проверка временного периода
   * @param {Date[]} dates Проверяемые даты
   * @return {Boolean} `true` если период верный
   */
  checkRange(...dates) {
    for (const date of dates) {
      if (
        date > this.range.end ||
        this.range.start > date ||
        date == 'Invalid Date'
      ) return false;
    }
    return true;
  }

  /**
   * Авторизация в сетевом
   * @param {Object} [cb] Callback функции
   * @param {Function} [cb.done] Вызовется, если все пройдет успешно
   * @param {Function} [cb.fail] Вызовется, если произойдет ошибка
   * @return {Promise<undefined>}
   */
  logIn(cb) {
    return fetch(this.host)
        // Проверяем хост (доступен и есть ли SSL)
        .then((res) => {
          if (res.ok) this.secure = res.url.startsWith('https');
          else throw new FetchError(res);
        })
        // Делаем запрос к `/webapi/auth/getdata` (нужно для авторизации)
        .then(() => fetch(
            `${this.host}/webapi/auth/getdata`,
            {
              method: 'post',
              headers: this.headers,
            },
        ))
        // Сохраняем куки, которые отправил сервер
        .then((res) => this.setCookie(res))
        // Проверяем ответ и по возможности парсим в JSON
        .then(this.checkJSON)
        // Сохраняем `ver` и проходим авторизацию
        .then((data) => (
          this.ver = data.ver,
          fetch(
              `${this.host}/webapi/login`,
              {
                method: 'post',
                headers: this.headers,
                body: (
                  'LoginType=1' +
                  `&lt=${data.lt}` +
                  `&ver=${data.ver}` +
                  `&${this.ttsLogin}` +
                  `&UN=${encodeURI(this.login)}` +
                  `&PW=${
                    md5(
                        data.salt +
                        md5(this.password),
                    ).substring(0, this.password.length)}` +
                  `&pw2=${md5(data.salt + md5(this.password))}`
                ),
              },
          )
        ))
        // Сохраняем куки, которые отправил сервер
        .then((res) => this.setCookie(res))
        // Проверяем ответ и по возможности парсим в JSON
        .then(this.checkJSON)
        // Сохраняем `at` и `tokenTimeOut`, после чего получаем остальные данные
        .then((data) => (
          this.at = data.at,
          this.tokenTimeOut = Date.now() + data.timeOut,
          fetch(
              `${this.host}/angular/school/main/`,
              {
                method: 'post',
                headers: this.headers,
                body: (
                  'LoginType=0' +
                  `&AT=${this.at}` +
                  `&VER=${this.ver}`
                ),
              },
          )
        ))
        // Получаем текст ответа
        .then((res) => res.text())
        // Парсим данные `appContext`
        .then((text) => (
          new Function(
              text
                  // eslint-disable-next-line max-len
                  .match(/\w+ appContext = {.+?};|appContext\.(?!ya)\w+ = (?!function).+?;/sg)
                  .reduce((a, c) => a += c) +
                  'return appContext',
          )()
        ))
        // Сохраняем нужные данные и получаем данные отчетов
        .then((data) => (
          this.userId = data.userId,
          this.yearId = data.yearId,
          this.schoolId = data.schoolId,
          this.currYear = data.currYear,
          this.dateFormat = data.dateFormat,
          this.fullSchoolName = data.fullSchoolName,
          this.serverTimeZone = data.serverTimeZone,
          fetch(
              `${this.host}/webapi/reports/studentgrades`,
              {
                headers: {
                  ...this.headers,
                  'at': this.at,
                },
              },
          )
        ))
        // Проверяем ответ и по возможности парсим в JSON
        .then(this.checkJSON)
        // Получаем нужные данные
        .then((data) => data.filterSources)
        // Сохраняем данные и отправляем успешный callback
        .then((data) => (
          this.classId = parseInt(data[1].defaultValue),
          this.range.start = new Date(
              data[3].minValue.replace(/\..+/, '.000Z'),
          ),
          this.range.end = new Date(
              data[3].maxValue.replace(/\..+/, '.000Z'),
          ),
          this.subjects = data[2].items,
          cb?.done?.call(this),
          void 0
        ))
        // Пойманные ошибки отправляем в неудачный callback
        .catch((err) => {
          cb?.fail?.call(this, err);
          throw err;
        });
  }

  /**
   * Выход из сетевого
   * @param {Object} [cb] Callback функции
   * @param {Function} [cb.done] Вызовется, если все пройдет успешно
   * @param {Function} [cb.fail] Вызовется, если произойдет ошибка
   * @return {Promise<undefined>}
   */
  logOut(cb) {
    return fetch(
        `${this.host}/asp/logout.asp`,
        {
          method: 'post',
          headers: this.headers,
          body: (
            `at=${this.at}` +
            `&VER=${this.ver}`
          ),
        },
    )
        // Отправляем успешный callback
        .then((res) => {
          if (!res.ok) throw new FetchError(res);
          this.at = null;
          this.ver = null;
          cb?.done?.call(this);
          return undefined;
        })
        // Отправляем провальный callback
        .catch((err) => {
          cb?.fail?.call(this, err);
          throw err;
        });
  }

  /**
   * Получение дневника
   * @param {Object} data Период получаемых данных
   * @param {Date} data.start Начало периода
   * @param {Date} data.end Конец периода
   * @param {Object} [cb] Callback функции
   * @param {Function} [cb.done] Вызовется, если все пройдет успешно
   * @param {Function} [cb.fail] Вызовется, если произойдет ошибка
   * @return {Promise<JSON>}
   */
  getDiary(data, cb) {
    return fetch(
        (
          `${this.host}/webapi/student/diary` +
          `?vers=${this.ver}` +
          `&yearId=${this.yearId}` +
          `&studentId=${this.userId}` +
          `&weekEnd=${data.end.toJSON().replace(/T.+/, '')}` +
          `&weekStart=${data.start.toJSON().replace(/T.+/, '')}`
        ),
        {
          headers: {
            ...this.headers,
            'at': this.at,
          },
        },
    )
        // Проверяем ответ и по возможности парсим в JSON
        .then(this.checkJSON)
        // Отправляем успешный callback
        .then((data) => (
          cb?.done?.call(this, data),
          data
        ))
        // Отправляем провальный callback
        .catch((err) => {
          cb?.fail?.call(this, err);
          throw err;
        });
  }

  /**
   * Получение итоговых оценок
   * @param {Object} [cb] Callback функции
   * @param {Function} [cb.done] Вызовется, если все пройдет успешно
   * @param {Function} [cb.fail] Вызовется, если произойдет ошибка
   * @return {Promise<JSON>}
   */
  getTotalMarks(cb) {
    return fetch(
        `${this.host}/asp/Reports/ReportStudentTotalMarks.asp`,
        {
          method: 'post',
          headers: this.headers,
          body: (
            `at=${this.at}` +
            `&ver=${this.ver}` +
            `&RPTID=StudentTotalMarks` +
            `&RPNAME=${encodeURI('Итоговые отметки')}`
          ),
        },
    )
        // Сохраняем куки
        .then((res) => this.setCookie(res))
        // Получаем итоговые оценки
        .then(() => fetch(
            `${this.host}/asp/Reports/StudentTotalMarks.asp`,
            {
              method: 'post',
              headers: {
                ...this.headers,
                'at': this.at,
              },
              body: (
                `LoginType=0` +
                `&AT=${this.at}` +
                `&VER=${this.ver}` +
                `&SID=${this.userId}` +
                `&PCLID=${this.classId}`
              ),
            },
        ))
        // Получаем текст ответа
        .then((res) => res.text())
        // Отправляем успешный callback
        .then((text) => (
          cb?.done?.call(this, text),
          text
        ))
        // Отправляем провальный callback
        .catch((err) => {
          cb?.fail?.call(this, err);
          throw err;
        });
  }

  /**
   * Загрузка отчета
   * @param {String} queueURL Ссылка на страницу запроса
   * @param {*} selectedData Выбранные данные, которые нужно отправить
   * @return {Promise<JSON>}
   */
  getReportFile(queueURL, selectedData) {
    return fetch(
        (
          `${this.host}/WebApi/signalr/negotiate` +
          `?_=${this.ver}` +
          `&at=${this.at}` +
          `&clientProtocol=1.5` +
          `&transport=webSockets` +
          `&connectionData=%5B%7B%22name%22%3A%22queuehub%22%7D%5D`
        ),
        {
          headers: this.headers,
        },
    )
        // Проверяем ответ и по возможности парсим в JSON
        .then(this.checkJSON)
        // Устанавливаем ws соединение
        .then(({ConnectionToken}) => new Promise((resolve, reject) => {
          const ws = new WebSocket(
              (
                `${this.hostWS}/WebApi/signalr/connect` +
                `?at=${this.at}` +
                `&clientProtocol=1.5` +
                `&transport=webSockets` +
                `&connectionData=%5B%7B%22name%22%3A%22queuehub%22%7D%5D` +
                `&connectionToken=${encodeURIComponent(ConnectionToken)}`
              ),
              {
                headers: this.headers,
              },
          );

          ws.on('open', () => fetch(
              (
                `${this.host}/WebApi/signalr/start` +
                `?at=${this.at}` +
                `&clientProtocol=1.5` +
                `&transport=webSockets` +
                `&connectionData=%5B%7B%22name%22%3A%22queuehub%22%7D%5D` +
                `&connectionToken=${encodeURIComponent(ConnectionToken)}`
              ),
              {
                headers: this.headers,
              },
          )
              // Проверяем ответ и по возможности парсим в JSON
              .then(this.checkJSON)
              // Делаем запрос на получение данных
              .then(() => fetch(
                  `${this.host}/${queueURL}`,
                  {
                    method: 'post',
                    headers: {
                      ...this.headers,
                      'at': this.at,
                      'content-type': 'application/json; charset=UTF-8',
                    },
                    body: JSON.stringify({
                      selectedData,
                      'params': [
                        {
                          'name': 'SCHOOLYEARID',
                          'value': this.yearId,
                        },
                        {
                          'name': 'SERVERTIMEZONE',
                          'value': this.serverTimeZone,
                        },
                        {
                          'name': 'DATEFORMAT',
                          'value': this.dateFormat,
                        },
                        {
                          'name': 'FULLSCHOOLNAME',
                          'value': this.fullSchoolName,
                        },
                      ],
                    }),
                  },
              ))
              // Проверяем ответ и по возможности парсим в JSON
              .then(this.checkJSON)
              // Отправляем ID данных
              .then(({taskId}) => ws.send(
                  JSON.stringify({
                    'I': 0,
                    'H': 'queuehub',
                    'M': 'StartTask',
                    'A': [taskId],
                  }),
              ))
              // Если ошибка, то закрываем соединение
              .catch(() => ws.close(4001, 'Couldn\'t open the connection.')),
          );

          ws.on('message', (msg) => {
            try {
              msg = JSON.parse(msg);
            } catch (e) {
              return;
            }

            switch (msg?.M?.[0]?.M) {
              case 'complete':
                resolve(msg.M[0].A[0].Data);
                ws.close(4000);
                break;
              case 'error':
                close.call(this, 4003, msg.M[0].A[0].Details, true);
                break;
            }
          });

          ws.on('error', (err) => close.call(this, 4002, err.message, true));

          ws.on('close', close.bind(this));

          /**
           * Закрываем соединени
           * @this this
           * @param {Number} code Код закрытия
           * @param {String} msg Сообщение закрытия
           * @param {Boolean} close Нужно ли закрыть соединение
           */
          function close(code, msg, close = false) {
            if (close) ws.close(4009);
            // Проверяем причину ошибки и если надо, то отправляем ошибку
            switch (code) {
              case 4000:
                // Если соединение закрыто без ошибок
                break;
              case 4001:
                reject(new WorkError('Error during initialization.', 12));
                break;
              case 4002:
                reject(new WorkError('Error in socket.\nError: ' + msg, 13));
                break;
              case 4003:
                reject(new WorkError('Error in task.\nError: ' + msg, 14));
                break;
              case 4009:
                return;
              default:
                reject(new WorkError('Unknown error.\nError: ' + msg, -10));
            }
            // Завершаем соединение
            fetch(
                (
                  `${this.host}/WebApi/signalr/abort` +
                  `?at=${this.at}` +
                  `&clientProtocol=1.5` +
                  `&transport=webSockets` +
                  `&connectionData=%5B%7B%22name%22%3A%22queuehub%22%7D%5D` +
                  `&connectionToken=${encodeURIComponent(ConnectionToken)}`
                ),
                {
                  headers: this.headers,
                },
            );
          }
        }))
        // Получаем файл
        .then((id) => fetch(
            `${this.host}/webapi/files/${id}`,
            {
              headers: {
                ...this.headers,
                'at': this.at,
              },
            },
        ))
        // Отправляем данные
        .then((res) => {
          if (!res.ok) throw new FetchError(res);
          else return res.text();
        });
  }

  /**
   * Получение оценок предмета
   * @param {Object} data Данные для парсинга
   * @param {String} data.id ID предмета
   * @param {Date} data.start Начало периода
   * @param {Date} data.end Конец периода
   * @param {Object} [cb] Callback функции
   * @param {Function} [cb.done] Вызовется, если все пройдет успешно
   * @param {Function} [cb.fail] Вызовется, если произойдет ошибка
   * @return {Promise<JSON>}
   */
  getSubject(data, cb) {
    return new Promise((resolve) => resolve())
        // Проверяем наличие предмета
        .then(() => {
          if (!this.subjects.find((s) => s.value == data.id)) {
            throw new WorkError('Invalid id', 10);
          }
          return void 0;
        })
        // Проверяем правильность периода
        .then(() => {
          if (!this.checkRange(data?.start, data?.end)) {
            throw new WorkError('Invalid period', 11);
          }
          return void 0;
        })
        // Получаем отчет
        .then(() => this.getReportFile(
            'webapi/reports/studentgrades/queue',
            [
              {
                'filterId': 'SID',
                'filterValue': this.userId,
              },
              {
                'filterId': 'PCLID_IUP',
                'filterValue': this.classId + '_0',
              },
              {
                'filterId': 'SGID',
                'filterValue': data.id,
              },
              {
                'filterId': 'period',
                'filterValue': (
                  data.start.toJSON() + ' - ' +
                  data.end.toJSON()
                ),
              },
            ],
        ))
        // Отправляем успешный callback
        .then((data) => (
          cb?.done?.call(this, data),
          data
        ))
        // Отправляем провальный callback
        .catch((err) => {
          cb?.fail?.call(this, err);
          throw err;
        });
  }

  /**
   * Получение всех предметов
   * @param {Object} data Данные для парсинга
   * @param {Date} data.start Начало периода
   * @param {Date} data.end Конец периода
   * @param {Object} [cb] Callback функции
   * @param {Function} [cb.done] Вызовется, если все пройдет успешно
   * @param {Function} [cb.fail] Вызовется, если произойдет ошибка
   * @return {Promise<JSON>}
   */
  getJournal(data, cb) {
    return new Promise((resolve) => resolve())
        // Проверяем правильность периода
        .then(() => {
          if (!this.checkRange(data?.start, data?.end)) {
            throw new WorkError('Invalid period', 11);
          }
          return void 0;
        })
        // Получаем отчет
        .then(() => this.getReportFile(
            'webapi/reports/studenttotal/queue',
            [
              {
                'filterId': 'SID',
                'filterValue': this.userId,
              },
              {
                'filterId': 'PCLID',
                'filterValue': this.classId,
              },
              {
                'filterId': 'period',
                'filterValue': (
                  data.start.toJSON() + ' - ' +
                  data.end.toJSON()
                ),
              },
            ],
        ))
        // Отправляем успешный callback
        .then((data) => (
          cb?.done?.call(this, data),
          data
        ))
        // Отправляем провальный callback
        .catch((err) => {
          cb?.fail?.call(this, err);
          throw err;
        });
  }
};
