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
   * @param {String} host Домен проверяемого сервера
   * @return {Promise<Boolean>}
   */
  static checkHost(host) {
    return fetch(`http://${host}/webapi/prepareloginform`)
        .then((res) =>
          res.ok &&
          res.headers.get('content-type').startsWith('application/json'),
        );
  }

  /**
   * Получение формы авторизации
   * @param {String} host Домен сервера
   * @return {Promise<{
   *  id: String,
   *  name: String,
   *  value: Number,
   *  options: {id: Number, name: String}[],
   * }[]>}
   */
  static authForm(host) {
    const selectors = [];
    return this.checkHost(host)
        .then((fit) => {
          if (!fit) {
            throw new Error(`Этот сервер(${host}) не подходит для работы`);
          } else {
            return fetch(`http://${host}/webapi/logindata`);
          }
        })
        .then((res) => {
          if (
            !res.ok ||
            !res.headers.get('content-type').startsWith('application/json')
          ) throw new FetchError(res);

          return res.json();
        })
        .then(({version}) => fetch(
            `http://${host}/vendor/pages/about/templates/loginform.html?ver=${version}`,
        ))
        .then((res) => {
          if (
            !res.ok ||
            !res.headers.get('content-type').startsWith('text/html')
          ) throw new FetchError(res);

          return res.text();
        })
        .then(htmlParser.parse)
        .then((html) => {
          for (const s of html.querySelectorAll('#message select')) {
            selectors.push({
              id: s.id,
              name: s.getAttribute('name'),
              value: null,
              options: [],
            });
          }
          return fetch(`http://${host}/webapi/prepareloginform`);
        })
        .then((res) => {
          if (
            !res.ok ||
            !res.headers.get('content-type').startsWith('application/json')
          ) throw new FetchError(res);

          return res.json();
        })
        .then((data) => {
          for (const name in data) {
            if (!name) continue;
            const value = data[name];
            const index = selectors.findIndex((s) =>
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
          return selectors;
        });
  }

  /**
   * Подгрузка формы авторизации на основе выбранных данных
   * @param {String} host Домен сервера
   * @param {String} allSelected Все выбранные елемены
   * @param {String} lastSelected Последний выбранный елемент
   * @return {Promise<JSON>}
   */
  static uploadAuthForm(host, allSelected, lastSelected) {
    return this.checkHost(host)
        .then((fit) => {
          if (!fit) {
            throw new Error(`Этот сервер(${host}) не подходит для работы`);
          } else {
            return fetch(`http://${host}/webapi/loginform?${allSelected}&LASTNAME=${lastSelected}`);
          }
        })
        .then((res) => {
          if (
            !res.ok ||
            !res.headers.get('content-type').startsWith('application/json')
          ) throw new FetchError(res);

          return res.json();
        })
        .then(({items}) => items);
  }

  /**
   * Обвязка для удобного взаимодействия
   * @param {String} host Ссылка на сервер
   * @param {String} login Логин ученика
   * @param {String} password Пароль ученика
   * @param {String} ttsLogin Данные авторизации (регион, школа и т.д.)
   */
  constructor(host, login, password, ttsLogin) {
    /**
     * Обозначения данных
     *  Где используются:
     *    $0 - Система
     *    $1 - Авторизация
     *    $2 - Взаимодействие с сайтом
     *    $3 - Система/Публичный доступ
     *
     *  Как можно добыть:
     *    #0 - Передаются в конструктроре
     *    #1 - Можно получить только после или во время авторизации
     *    #2 - Появляются во время работы парсера (куки и прочее)
     *    #3 - Результаты функций, которые нужно сохранить
     */
    // Данные: #0 $1
    this._host = host;
    this._login = login;
    this._password = password;
    this._ttsLogin = ttsLogin.toLowerCase();

    // Данные: #1 $2
    this._at = undefined;
    this._ver = undefined;

    // Данные: #2 $2
    this._cookie = {};
    this._secure = false;
    this._timeParseInfo = null;

    // Данные: #3 $3
    this.photo = null;
    this.email = null;
    this.range = {
      start: null,
      end: null,
    };
    this.subjects = [];
    this.userId = null;
    this.yearId = null;
    this.classId = null;
    this.schoolId = null;
    this.currYear = null;
    this.lastName = null;
    this.firstName = null;
    this.dateFormat = null;
    this.tokenTimeOut = null;
    this.fullSchoolName = null;
    this.serverTimeZone = null;
    this.readUserUpdate = null;
  }

  /**
   * Информация о пользователе
   * @return {Object}
   */
  get info() {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      photo: this.photo,
    };
  }

  /**
   * Ссылка на сайт
   * @return {String}
   */
  get host() {
    return `http${this._secure?'s':''}://${this._host}`;
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
   * Устанавливает куки для парсера
   * @param {Response} res Ответ сервера
   * @return {Response}
   */
  set cookie(res) {
    for (const c of res.headers.raw()['set-cookie'] || []) {
      if (typeof c != 'string') continue;
      const [, name, value] = c.match(/^(.+?)=(.+?)(?=;|$)/) || [];
      if (!name || !value) continue;
      this._cookie[name] = value;
    }
    return res;
  }

  /**
   * Часто используемые заголовки
   * @return {Object}
   */
  get headers() {
    return {
      'cookie': this.cookie,
      'host': this._host,
      'referer': this.host,
      'x-requested-with': 'xmlhttprequest',
      'content-type': 'application/x-www-form-urlencoded',
    };
  }

  /**
   * Нужна ли авторизация в сетевом
   * @return {boolean} `true` если нужна
   */
  get needAuth() {
    return this.tokenTimeOut - Date.now() <= 1000;
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
      if (!date?.toJSON) continue;
      if (
        this.range.start - date > 864e5 ||
        date - this.range.end > 864e5 ||
        date == 'Invalid Date'
      ) return false;
    }
    return true;
  }

  /**
   * Авторизация в сетевом
   * @return {Promise<this>}
   */
  logIn() {
    return fetch(this.host)
        // Проверяем хост (доступен и есть ли SSL)
        .then((res) => {
          if (res.ok) this._secure = res.url.startsWith('https');
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
        .then((res) => this.cookie = res)
        // Проверяем ответ и по возможности парсим в JSON
        .then(this.checkJSON)
        // Сохраняем `ver` и проходим авторизацию
        .then(({ver, salt, lt}) => (
          this._ver = ver,
          fetch(
              `${this.host}/webapi/login`,
              {
                method: 'post',
                headers: this.headers,
                body: (
                  'LoginType=1' +
                  `&lt=${lt}` +
                  `&ver=${ver}` +
                  `&${this._ttsLogin}` +
                  `&UN=${encodeURI(this._login)}` +
                  `&PW=${
                    md5(
                        salt +
                        md5(this._password),
                    ).substring(0, this._password.length)}` +
                  `&pw2=${md5(salt + md5(this._password))}`
                ),
              },
          )
        ))
        // Сохраняем куки, которые отправил сервер
        .then((res) => this.cookie = res)
        // Проверяем ответ и по возможности парсим в JSON
        .then(this.checkJSON)
        // Сохраняем `at` и `tokenTimeOut`, после чего получаем остальные данные
        .then(({at, timeOut}) => {
          this._at = at;
          this.tokenTimeOut = Date.now() + timeOut;
          if (Date.now() - this._timeParseInfo >= 864e5) {
            return this.getUsetInfo();
          } else return this;
        });
  }

  /**
   * Выход из сетевого
   * @return {Promise<undefined>}
   */
  logOut() {
    return fetch(
        `${this.host}/asp/logout.asp`,
        {
          method: 'post',
          headers: this.headers,
          body: (
            `at=${this._at}` +
            `&VER=${this._ver}`
          ),
        },
    )
        // Отправляем успешный callback
        .then((res) => {
          if (!res.ok) throw new FetchError(res);
          this._at = null;
          this._ver = null;
          this.tokenTimeOut = null;
          return undefined;
        });
  }

  /**
   * Получение информации о пользователе
   * @return {Promise<undefined>}
   */
  getUsetInfo() {
    return fetch(
        `${this.host}/asp/MySettings/MySettings.asp?at=${this._at}`,
        {
          method: 'post',
          headers: this.headers,
          body: (
            `AT=${this._at}` +
            `&VER=${this._ver}`
          ),
        },
    )
        // Получаем текст ответа
        .then((res) => res.text())
        // Получаем фамилию, имя и почту
        .then((text) => (
          this.firstName = text.match(/Имя.+?value="(.*?)"/)?.[1],
          this.lastName = text.match(/Фамилия.+?value="(.*?)"/)?.[1],
          this.email = text.match(/E-Mail.+?value="(.*?)"/)?.[1],
          text
        ))
        // Парсим данные `appContext`
        .then((text) => (
          new Function(text
              // eslint-disable-next-line max-len
              .match(/\w+ appContext = {.+?};|appContext\.(?!ya)\w+ = (?!function).+?;/sg)
              .reduce((a, c) => a += c) +
              'return appContext',
          )()
        ))
        // Сохраняем нужные данные и получаем данные отчетов
        .then((data) => (
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
                  'at': this._at,
                },
              },
          )
        ))
        // Проверяем ответ и по возможности парсим в JSON
        .then(this.checkJSON)
        // Сохраняем данные отчетов
        .then(({filterSources}) => (
          this.userId = parseInt(filterSources[0].defaultValue),
          this.classId = parseInt(filterSources[1].defaultValue),
          this.range.start = new Date(filterSources[3].minValue),
          this.range.end = new Date(filterSources[3].maxValue),
          this.subjects = filterSources[2].items,
          this._timeParseInfo = Date.now(),
          this.readUserUpdate = false,
          void 0
        ))
        // Загружаем фото
        .then(() => fetch(
            (
              `${this.host}/webapi/users/photo` +
              `?at=${this._at}` +
              `&ver=${this._ver}` +
              `&userId=${this.userId}`
            ),
            {
              headers: this.headers,
            },
        ))
        // Получаем буфер
        .then((res) => res.buffer())
        // Сохраняем фото
        .then((buffer) => (
          this.photo = 'data:image/jpeg;base64,' + buffer.toString('base64'),
          this
        ));
  }

  /**
   * Получение типов работ
   * @return {Promise<JSON>}
   */
  getTypes() {
    return fetch(
        `${this.host}/webapi/grade/assignment/types?all=false`,
        {
          headers: {
            ...this.headers,
            'at': this._at,
          },
        },
    )
        // Проверяем ответ и по возможности парсим в JSON
        .then(this.checkJSON);
  }

  /**
   * Получение дневника
   * @param {Object} data Период получаемых данных
   * @param {Date} data.start Начало периода
   * @param {Date} data.end Конец периода
   * @return {Promise<JSON>}
   */
  getDiary(data) {
    return fetch(
        (
          `${this.host}/webapi/student/diary` +
          `?vers=${this._ver}` +
          `&yearId=${this.yearId}` +
          `&studentId=${this.userId}` +
          `&weekEnd=${data.end.toJSON().replace(/T.+/, '')}` +
          `&weekStart=${data.start.toJSON().replace(/T.+/, '')}`
        ),
        {
          headers: {
            ...this.headers,
            'at': this._at,
          },
        },
    )
        // Проверяем ответ и по возможности парсим в JSON
        .then(this.checkJSON)
        // Изменяем ответ
        .then(({weekDays}) => weekDays.map((day) => ({
          date: day.date,
          lessons: day.lessons.map((lesson) => ({
            id: lesson.classmeetingId,
            name: lesson.subjectName,
            room: lesson.room,
            homework: lesson.assignments
                ?.find((assignment) => assignment.typeId == 3)
                ?.assignmentName || '',
            number: lesson.number,
            endTime: lesson.endTime,
            startTime: lesson.startTime,
            assignments: lesson.assignments
                ?.filter((assignment) => assignment.mark)
                ?.map((assignment) => ({
                  id: assignment.id,
                  type: assignment.typeId,
                  mark: assignment.mark?.mark,
                })),
          })),
        })))
        // Отправляем провальный callback
        .catch((err) => {
          cb?.fail?.call(this, err);
          throw err;
        });
  }

  /**
   * Получение оценки
   * @param {Object} data Данные оценки
   * @param {Date} data.id ID оценки
   * @return {Promise<JSON>}
   */
  getMark(data) {
    return fetch(
        (
          `${this.host}/webapi/student/diary/assigns/${data.id}` +
          `?studentId=${this.userId}`
        ),
        {
          headers: {
            ...this.headers,
            'at': this._at,
          },
        },
    )
        // Проверяем ответ и по возможности парсим в JSON
        .then(this.checkJSON)
        // Изменяем ответ
        .then((data) => ({
          date: data.date,
          theme: data.assignmentName,
          weight: data.weight,
          teacher: data.teacher.name,
          subject: data.subjectGroup,
        }));
  }

  /**
   * Загрузка отчета
   * @param {String} queueURL Ссылка на страницу запроса
   * @param {*} selectedData Выбранные данные, которые нужно отправить
   * @param {Function} [parseHTML] Функция для обработки ответа
   * @return {Promise<JSON>}
   */
  getReportFile(queueURL, selectedData, parseHTML = (html) => html) {
    return fetch(
        (
          `${this.host}/WebApi/signalr/negotiate` +
          `?_=${this._ver}` +
          `&at=${this._at}` +
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
                `${this.host.replace('http', 'ws')}/WebApi/signalr/connect` +
                `?at=${this._at}` +
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
                `?at=${this._at}` +
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
                      'at': this._at,
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
                  `?at=${this._at}` +
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
                'at': this._at,
              },
            },
        ))
        // Получаем текст файла
        .then((res) => {
          if (!res.ok) throw new FetchError(res);
          else return res.text();
        })
        // Парсим результат
        .then(parseHTML);
  }

  /**
   * Получение оценок предмета
   * @param {Object} data Данные для парсинга
   * @param {String} data.id ID предмета
   * @param {Date} data.start Начало периода
   * @param {Date} data.end Конец периода
   * @return {Promise<JSON>}
   */
  getSubject(data) {
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
            (html) => {
              const root = htmlParser.parse(html);
              let assignments = root.querySelectorAll('table.table-print tr');
              assignments = assignments.splice(1, assignments.length - 2);
              assignments = assignments.map((a) => (
                a.childNodes = a.childNodes.filter((c) => c.tagName == 'TD'),
                {
                  type: a.childNodes[0].innerText,
                  name: a.childNodes[1].innerText,
                  date: str2date(a.childNodes[2].innerText),
                  issueDate: str2date(a.childNodes[3].innerText),
                  mark: +a.childNodes[4].innerText,
                }
              ));
              return {
                assignments,
                middleMark: +root
                    .querySelector('table.table-print tr.totals')
                    .childNodes.filter((c) => c.tagName == 'TD')[2]
                    .text.replace(',', '.').replace(/^\D+(?=\d)/, ''),
              };

              /**
               * Перевод строки в время
               * @param {String} str Строка в формате dd.mm.yy
               * @return {Date} Время
               */
              function str2date(str) {
                const [, date, month, year] = str
                    .match(/(\d{1,2})\.(\d{1,2})\.(\d{1,2})/);
                return new Date(`20${year}-${month}-${
                  date < 10 ?
                  '0' + date :
                  date
                }T00:00:00`);
              }
            },
        ));
  }

  /**
   * Получение всех предметов
   * @param {Object} data Данные для парсинга
   * @param {Date} data.start Начало периода
   * @param {Date} data.end Конец периода
   * @return {Promise<JSON>}
   */
  getJournal(data) {
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
        ));
  }

  /**
   * Получение итоговых оценок
   * @return {Promise<JSON>}
   */
  getTotalMarks() {
    return fetch(
        `${this.host}/asp/Reports/ReportStudentTotalMarks.asp`,
        {
          method: 'post',
          headers: this.headers,
          body: (
            `at=${this._at}` +
            `&ver=${this._ver}` +
            `&RPTID=StudentTotalMarks` +
            `&RPNAME=${encodeURI('Итоговые отметки')}`
          ),
        },
    )
        // Сохраняем куки
        .then((res) => this.cookie = res)
        // Получаем итоговые оценки
        .then(() => fetch(
            `${this.host}/asp/Reports/StudentTotalMarks.asp`,
            {
              method: 'post',
              headers: {
                ...this.headers,
                'at': this._at,
              },
              body: (
                `LoginType=0` +
                `&AT=${this._at}` +
                `&VER=${this._ver}` +
                `&SID=${this.userId}` +
                `&PCLID=${this.classId}`
              ),
            },
        ))
        // Получаем текст ответа
        .then((res) => res.text());
  }
};
