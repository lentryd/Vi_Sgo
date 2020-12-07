const crypto = require('crypto');
const WebSocket = require('ws');
const nodeFetch = require('node-fetch');
const htmlParser = require('node-html-parser');

/**
 * MD5 хэш
 * @param {String} str Исходная строка
 * @return {String}
 */
function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * Сохранить контекс приложения
 * @this {Parser}
 * @param {String} link ссылка на запрос
 * @param {*} data данные запроса
 * @param {String} token токен соединения
 * @return {Promise<Number>}
 */
function makeWSRequest(link, data, token) {
  token = encodeURIComponent(token);
  return new Promise((res, rej) => {
    const ws = new WebSocket(
        `ws${this._secure ? 's' : ''}://${this._host}/WebApi/signalr/connect` +
          `?at=${this._at}` +
          `&clientProtocol=1.5` +
          `&transport=webSockets` +
          `&connectionData=%5B%7B%22name%22%3A%22queuehub%22%7D%5D` +
          `&connectionToken=${token}`,
        {
          headers: {'cookie': this.cookie},
        },
    );

    ws.on('open', () => {
      this.fetch(
          `/WebApi/signalr/start` +
            `?at=${this._at}` +
            `&clientProtocol=1.5` +
            `&transport=webSockets` +
            `&connectionData=%5B%7B%22name%22%3A%22queuehub%22%7D%5D` +
            `&connectionToken=${token}`,
      )
          .then(() => this.fetch(
              `/${link}`,
              {
                method: 'post',
                headers: {
                  'content-type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify({
                  selectedData: data,
                  params: [
                    {
                      name: 'SCHOOLYEARID',
                      value: this._yearId,
                    },
                    {
                      name: 'SERVERTIMEZONE',
                      value: this._serverTimeZone,
                    },
                    {
                      name: 'DATEFORMAT',
                      value: this._dateForamt,
                    },
                    {
                      name: 'FULLSCHOOLNAME',
                      value: this._skoolName,
                    },
                  ],
                }),
              },
          ))
          .then(({taskId}) => ws.send(
              JSON.stringify({
                I: 0,
                H: 'queuehub',
                M: 'StartTask',
                A: [taskId],
              }),
          ))
          .catch(() => ws.close(4001, 'Не удалось открыть соединение'));
    });

    ws.on('message', (msg) => {
      try {
        msg = JSON.parse(msg);
      } catch (e) {
        return;
      }

      switch (msg?.M?.[0]?.M) {
        case 'complete':
          res(msg.M[0].A[0].Data);
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
     * @this {Parser}
     * @param {Number} code Код закрытия
     * @param {String} msg Сообщение закрытия
     * @param {Boolean} close Нужно ли закрыть соединение
     */
    function close(code, msg, close = false) {
      if (close) ws.close(4009);
      switch (code) {
        case 4000: break;
        case 4001:
          rej(new WorkError('Error during initialization.', 12));
          break;
        case 4002:
          rej(new WorkError('Error in socket.\nError: ' + msg, 13));
          break;
        case 4003:
          rej(new WorkError('Error in task.\nError: ' + msg, 14));
          break;
        case 4009:
          return;
        default:
          rej(new WorkError('Unknown error.\nError: ' + msg, -10));
      }

      this.fetch(
          `/WebApi/signalr/abort` +
            `?at=${this._at}` +
            `&clientProtocol=1.5` +
            `&transport=webSockets` +
            `&connectionData=%5B%7B%22name%22%3A%22queuehub%22%7D%5D` +
            `&connectionToken=${token}`,
      );
    }
  });
}

/**
 * Перевод html в json для итогов об успеваемости
 * @this {Parser}
 * @param {String} html
 * @return {{
 *  middleMark: Number,
 *  assignments: {
 *    type: String,
 *    mark: String,
 *    name: String,
 *    date: String,
 *    issueDate: String
 *  }[]
 * }}
 */
function parseSubject(html) {
  const root = htmlParser.parse(html);
  let assignments = root.querySelectorAll('table.table-print tr') ?? [];
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
        ?.querySelector('table.table-print tr.totals')
        ?.childNodes.filter((c) => c.tagName == 'TD')?.[2]
        ?.text.replace(',', '.').replace(/^\D+(?=\d)/, '') ?? null,
  };

  /**
   * Перевод строки в время
   * @param {String} str Строка в формате dd.mm.yy
   * @return {Date} Время
   */
  function str2date(str) {
    const [, date, month, year] = str
        .match(/(\d{1,2})\.(\d{1,2})\.(\d{1,2})/);
    return new Date(`${month}-${date}-${year}`);
  }
}

/**
 * Перевод html в json для итогов об успеваемости и посещаемости
 * @this {Parser}
 * @param {String} html
 * @return {{
 *  name: String,
 *  middleMark: Number,
 *  assignments: {
 *    value: String,
 *    date: Date
 *  }[]
 * }[]}
  */
function parseJournal(html) {
  // Начало учебного года
  const studyYear = this._currYear.slice(0, 4);
  // Индекс месяца
  const monthIndex = {
    Сентябрь: 8,
    Октябрь: 9,
    Ноябрь: 10,
    Декабрь: 11,
    Январь: 12,
    Февраль: 13,
    Март: 14,
    Апрель: 15,
    Май: 16,
    Июнь: 17,
    Июль: 18,
    Август: 19,
  };
  // Получаем таблицу
  const table = htmlParser.parse(`<body>${html}</body>`)
      .querySelector('.table-print');
  if (!table) return [];
  // Получаем средний балл
  const middleMarks = table.querySelectorAll('td.cell-num');
  // Получаем предметы
  const subjects = table.querySelectorAll('td.cell-text');
  // Получаем месяца
  const months = table.querySelectorAll('tr')[0].querySelectorAll('th');
  // Получаем даты
  const dates = table.querySelectorAll('tr')[1].querySelectorAll('th');

  // Получаем период месяцев и удаляем строку с месяцами
  const journalMonths = [];
  for (const i in months) {
    if (!i) continue;
    const m = months[i];
    const to = +m?.getAttribute?.('colspan');
    const from = journalMonths[journalMonths.length - 1]?.to ?? 0;
    if (!to) continue;

    journalMonths.push({
      id: m.innerText,
      from,
      to: from + to,
    });
  }
  table.querySelectorAll('tr')[0].remove();

  // Получаем даты в формате Date и удаляем строку c датами
  const journalDates = [];
  for (const i in dates) {
    if (!i) continue;
    const d = dates[i];
    const date = new Date(
        studyYear +
        '-01-' +
        (d.innerText < 10 ? 0 : '') +
        d.innerText +
        'T00:00:00.000Z',
    );
    const month = journalMonths.find((m) => i >= m.from && i < m.to)?.id;
    if (!month) continue;

    date.setMonth(monthIndex[month]);
    journalDates.push(date);
  }
  table.querySelectorAll('tr')[0].remove();

  // Получаем название предметов и удаляем HTML элемент
  const journalSubjects = [];
  for (const i in subjects) {
    if (!i) continue;
    const s = subjects[i];
    const name = s?.innerText;
    if (!name) continue;

    journalSubjects.push(name);
    s.remove();
  }

  // Получаем средний балл и удаляем HTML элемент
  const journalMiddleMarks = [];
  for (const i in middleMarks) {
    if (!i) continue;
    const m = middleMarks[i];
    const num = +m?.innerText?.replace?.(',', '.');
    if (!num) continue;

    journalMiddleMarks.push(num);
    m.remove();
  }

  // Получаем оценки и готовим результат
  const result = [];
  const assignmentsRow = table.querySelectorAll('tr');
  for (const i in assignmentsRow) {
    if (!i) continue;
    const row = assignmentsRow[i];
    if (!row?.innerHTML) continue;
    result.push({
      name: journalSubjects[i],
      middleMark: journalMiddleMarks[i],
      assignments: [],
    });

    const assignments = row.querySelectorAll('td');
    for (const i1 in assignments) {
      if (!i) continue;
      const a = assignments[i1];
      if (!a?.structuredText) continue;
      result[i].assignments.push({
        value: a.structuredText.replace(/&nbsp;/g, ' '),
        date: journalDates[i1],
      });
    }
  }

  return result;
}

/**
 * Сохранить контекс приложения
 * @this {Parser}
 * @param {String} html страница сетевого
 * @return {void}
 */
function parseAppContext(html) {
  const appContext = new Function(html
      // eslint-disable-next-line max-len
      ?.match(/\w+ appContext = {.+?};|appContext\.(?!ya)\w+ = (?!function).+?;/sg)
      ?.reduce((a, c) => a += c) +
      'return appContext;',
  )();

  this._yearId = appContext.yearId;
  this._skoolId = appContext.schoolId;
  this._currYear = appContext.currYear;
  this._skoolName = appContext.fullSchoolName;
  this._dateFormat = appContext.dateFormat;
  this._timeForamt = appContext.timeFormat;
  this._serverTimeZone = appContext.serverTimeZone;

  return void 0;
}

/**
 * Найти информацию о пользователе
 * @this {Parser}
 * @param {String} html страница с настройками сетевого
 * @return {{
 *  email: String,
 *  phone: Number,
 *  lastName: String,
 *  firstName: String,
 *  birthDate: Date,
 *  patronymic: String,
 * }}
 */
function parseUserInfo(html) {
  const email = html.match(/E-Mail.+?value="(.*?)"/)?.[1] ?? '';
  const phone = +(html.match(/Мобильный телефон.+?value="(.*?)"/)?.[1] ?? 0);
  const lastName = html.match(/Фамилия.+?value="(.*?)"/)?.[1] ?? '';
  const firstName = html.match(/Имя.+?value="(.*?)"/)?.[1] ?? '';
  const patronymic = html.match(/Отчество.+?value="(.*?)"/)?.[1] ?? '';
  const birthDateRaw = html.match(/Дата рождения.+?value="(.*?)"/)?.[1] ?? '';
  const match = birthDateRaw.match(/(\d{2})\.(\d{2})\.*(\d{0,4})/);
  const birthDate = new Date(`${match[2]} ${match[1]} ${match[3]}`);

  return {
    email,
    phone,
    lastName,
    firstName,
    birthDate,
    patronymic,
  };
}

/**
 * Перевод html в json для списка дней рождений
 * @this {Parser}
 * @param {String} html страница со списком
 * @return {{
 *  date: Date,
 *  name: String,
 *  role: String,
 *  class: String
 * }[]}
 */
function parseBirthdays(html) {
  const root = htmlParser.parse(html);
  const table = root.querySelector('.table.print-block');
  table.querySelector('tr').remove();
  const people = table.querySelectorAll('tr');
  const result = [];
  people.forEach((p) => {
    const data = p.querySelectorAll('td');
    result.push({
      date: str2date(data[2].structuredText),
      name: data[3].structuredText,
      role: data[1].structuredText,
      class: data[0].structuredText,
    });
  });
  result.sort((a, b) => +a.date - +b.date);
  return result;

  /**
   * Функция для получения даты
   * @param {String} str строка с датой типа `8.06`
   * @return {Date}
   */
  function str2date(str) {
    const match = str?.match(/(\d{1,2})\.(\d{2})/);
    const day = +(match?.[1] ?? 20);
    const month = +(match?.[2] ?? 4);
    const date = new Date();

    date.setDate(day);
    date.setHours(0, 0, 0);
    date.setMonth(month - 1);

    return date;
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

/** Обработка ошибки во время запросов */
class FetchError {
  /**
   * Инициализация ошибки
   * @param {Response} res Ответ сервера
   */
  constructor(res) {
    this.fr = true;
    this.status = res.status;
    this.statusText = res.statusText;
  }

  /**
   * Проверяет работу сервера (статус 500)
   * @return {Boolean} `true` если сервер лег
   */
  get work() {
    return this.status >= 500;
  }

  /**
   * Проверяет авторизацию (статуст 401, 403, 409)
   * @return {Boolean} `true` если есть проблемы с авторизацие
   */
  get auth() {
    return this.status == 409 || this.status == 401 || this.status == 403;
  }

  /**
   * Сообщение об ошибке
   * @return {string}
   */
  get message() {
    return `${this.status}: ${this.statusText}`;
  }
}

/** Парсинг информации с сетевого города */
class Parser {
  /**
   * Проверка домена
   * @param {String} host Домен
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
   * @param {String} host Домен
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
   * Создать парсер
   * @param {String} host Домен сайта
   * @param {String} login Логин пользователя
   * @param {String} password Пароль пользователя
   * @param {String} ttslogin Данные для входа
  */
  constructor(host, login, password, ttslogin) {
    this._host = host;
    this._login = login;
    this._password = password;
    this._ttslogin = ttslogin;

    this._at = null;
    this._ver = null;
    this._cookie = {};
    this._secure = false;
    this._sessionTime = 0;

    this._userId = null;
    this._yearId = null;
    this._classId = null;
    this._skoolId = null;
    this._currYear = null;
    this._skoolName = null;
    this._timeForamt = null;
    this._dateForamt = null;
    this._serverTimeZone = null;

    this.subjects = [];
    this.studyYear = {
      start: null,
      end: null,
    };
  }

  // Данные
  /**
   * Куки
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
   * Нужна ли авторизация в сетевом
   * @return {boolean} `true` если нужна
   */
  get needAuth() {
    return this._sessionTime - Date.now() <= 1000;
  }

  // Функции
  /**
   * Запросы на сервер
   * @param {String} link ссылка
   * @param {Object} [params] данные запроса
   * @param {String} [params.method] метод
   * @param {Object | String} [params.body] данные
   * @param {Boolean} [raw] `true` если нужно вернуть ответ
   * @return {Promise<Response>}
   */
  fetch(link, params = {}, raw = false) {
    const href = `http${this._secure?'s':''}://${this._host}`;
    const headers = {
      'at': this._at,
      'host': this._host,
      'cookie': this.cookie,
      'referer': href,
      'content-type': 'application/x-www-form-urlencoded',
      'x-requested-with': 'xmlhttprequest',
    };
    if (!this._at) delete headers.at;
    if (!params.body) delete headers['content-type'];
    else if (params.body.toString() == '[object Object]') {
      let str = '';
      for (const name in params.body) {
        if (!params.body[name]) continue;
        if (str) str += '&';
        if (name == '!-!') str += params.body[name];
        else str += `${name}=${params.body[name]}`;
      }
      params.body = str;
    }

    return nodeFetch(
        href+link,
        {
          ...params,
          headers: {
            ...headers,
            ...params.headers,
          },
        },
    )
        .then((res) => {
          if (!res.ok) throw new FetchError(res);
          this.saveCookie(res);
          if (raw) {
            return res;
          } else if (
            res.headers.get('content-type').startsWith('application/json')
          ) {
            return res.json();
          } else {
            return res.text();
          }
        });
  }

  /**
   * Сохранение куки
   * @param {Response} res Ответ сервера
   */
  saveCookie(res) {
    for (const c of res.headers.raw()['set-cookie'] || []) {
      if (typeof c != 'string') continue;
      const [, name, value] = c.match(/^(.+?)=(.+?)(?=;|$)/) || [];
      if (!name || !value) continue;
      this._cookie[name] = value;
    }
  }

  /**
   * Загрузка отчета
   * @param {String} link ссылка на запрос
   * @param {*} data данные запроса
   * @return {Promise<String>}
   */
  reportFile(link, data) {
    return this.fetch(
        `/WebApi/signalr/negotiate` +
          `?_=${this._ver}` +
          `&at=${this._at}` +
          `&clientProtocol=1.5` +
          `&transport=webSockets` +
          `&connectionData=%5B%7B%22name%22%3A%22queuehub%22%7D%5D`,
    )
        .then(({ConnectionToken}) =>
          makeWSRequest.call(this, link, data, ConnectionToken),
        )
        .then((id) => this.fetch(`/webapi/files/${id}`));
  }

  // Авторизация и данные пользователя
  /**
   * Авторизация в сетевом
   * @return {Promise<void>}
   */
  logIn() {
    return this.fetch('/', {}, true)
        .then((res) => this._secure = res.url.startsWith('https'))
        .then(() => this.fetch('/webapi/auth/getdata', {method: 'post'}))
        .then(({lt, ver, salt}) => {
          this._ver = ver;
          const password = md5(salt + md5(this._password));
          const body = {
            lt,
            ver,
            '!-!': this._ttslogin,
            'UN': encodeURI(this._login),
            'PW': password.substring(0, this._password.length),
            'pw2': password,
            'LoginType': 1,
          };

          return this.fetch('/webapi/login', {method: 'post', body});
        })
        .then(({at, timeOut}) => {
          this._at = at;
          this._sessionTime = Date.now() + timeOut;
          if (!this._userId) return this.appContext();
        })
        .then(() => void 0);
  }

  /**
   * Выход со сетевом
   * @return {Promise<void>}
   */
  logOut() {
    return this.fetch(
        '/asp/logout.asp',
        {
          method: 'post',
          body: {
            AT: this._at,
            VER: this._ver,
          },
        },
    )
        .then(() => {
          this._at = null;
          this._ver = null;
          this._sessionTime = null;
        })
        .then(() => void 0);
  }

  /**
   * Данные приложения
   * @return {Promise<void>}
   */
  appContext() {
    return this.fetch(
        '/angular/school/main/',
        {
          method: 'post',
          body: {
            AT: this._at,
            VER: this._ver,
            LoginType: 0,
          },
        },
    )
        .then(parseAppContext.bind(this))
        .then(() => this.fetch('/webapi/reports/studentgrades'))
        .then(({filterSources}) => {
          this._userId = parseInt(filterSources[0].defaultValue);
          this._classId = parseInt(filterSources[1].defaultValue);
          this.subjects = filterSources[2].items.map(
              (s) => ({id: s.value, name: s.title}),
          );
          this.studyYear.end = new Date(filterSources[3].maxValue);
          this.studyYear.start = new Date(filterSources[3].minValue);
          return void 0;
        });
  }

  /**
   * Данные пользователя
   * @return {Promise<{
   *  email: String,
   *  phone: Number,
   *  lastName: String,
   *  firstName: String,
   *  birthDate: Date,
   *  patronymic: String,
   * }>}
   */
  userInfo() {
    return this.fetch(
        `/asp/MySettings/MySettings.asp?at=${this._at}`,
        {
          method: 'post',
          body: {
            AT: this._at,
            VER: this._ver,
          },
        },
    )
        .then(parseUserInfo);
  }

  /**
   * Фото пользователя
   * @return {Promise<Buffer>}
   */
  userPhoto() {
    return this.fetch(
        `/webapi/users/photo` +
          `?at=${this._at}` +
          `&ver=${this._ver}` +
          `&userId=${this._userId}`,
        {},
        true,
    )
        .then((res) => res.buffer());
  }

  // Парсинг страниц
  /**
   * Дневник
   * @param {Date} start начало недели
   * @param {Date} end конец недели
   * @return {Promise<{
   *  date: Date,
   *  lessons: {
   *    id: String,
   *    name: String,
   *    room: String,
   *    number: Number,
   *    endTime: String,
   *    homework: String,
   *    startTime: String,
   *    assignments: {
   *      id: String,
   *      type: Number,
   *      mark: Number
   *    }[]
   *  }[]
   * }[]>}
  */
  diary(start, end) {
    return this.fetch(
        '/webapi/student/diary' +
          `?vers=${this._ver}` +
          `&yearId=${this._yearId}` +
          `&studentId=${this._userId}` +
          `&weekEnd=${end.toJSON()}` +
          `&weekStart=${start.toJSON()}`,
    )
        .then(({weekDays}) =>weekDays.map((day) => ({
          date: new Date(day.date),
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
        })));
  }

  /**
   * Отчет об успеваемости
   * @param {Number} id id предмета
   * @param {Date} start начало отчета
   * @param {Data} end конец отчета
   * @return {Promise<{
   *  middleMark: Number,
   *  assignments: {
   *    type: String,
   *    mark: String,
   *    name: String,
   *    date: String,
   *    issueDate: String
   *  }[]
   * }>}
   */
  subject(id, start, end) {
    return this.reportFile(
        'webapi/reports/studentgrades/queue',
        [
          {
            filterId: 'SID',
            filterValue: this._userId,
          },
          {
            filterId: 'PCLID_IUP',
            filterValue: this._classId + '_0',
          },
          {
            filterId: 'SGID',
            filterValue: id,
          },
          {
            filterId: 'period',
            filterValue: start.toJSON() + ' - ' + end.toJSON(),
          },
        ],
    )
        .then(parseSubject.bind(this));
  }

  /**
   * Отчет об успеваемости
   * @param {Date} start начало отчета
   * @param {Data} end конец отчета
   * @return {Promise<{
   *  name: String,
   *  middleMark: Number,
   *  assignments: {
   *    value: String,
   *    date: Date
   *  }[]
   * }[]>}
   */
  journal(start, end) {
    return this.reportFile(
        'webapi/reports/studenttotal/queue',
        [
          {
            filterId: 'SID',
            filterValue: this._userId,
          },
          {
            filterId: 'PCLID',
            filterValue: this._classId,
          },
          {
            filterId: 'period',
            filterValue: start.toJSON() + ' - ' + end.toJSON(),
          },
        ],
    )
        .then(parseJournal.bind(this));
  }

  /**
   * Список именинников
   * @param {Date} date Месяц и год, для которого нужен список
   * @param {Boolean} [withParents] Отображать родителей
   * @return {Promise<{
   *  date: Date,
   *  name: String,
   *  role: String,
   *  class: String
   * }[]>}
  */
  birthdays(date, withParents = false) {
    return this.fetch(
        '/asp/Calendar/MonthBirth.asp',
        {
          method: 'post',
          body: {
            AT: this._at,
            VER: this._ver,
            Year: date.getFullYear(),
            Month: date.getMonth() + 1,
            PCLID: this._classId,
            ViewType: 1,
            LoginType: 0,
            BIRTH_STAFF: 1,
            BIRTH_PARENT: withParents ? 2 : 0,
            BIRTH_STUDENT: 2,
            From_MonthBirth: 1,
            MonthYear: date.getMonth() + 1 + ',' + date.getFullYear(),
          },
        },
    )
        .then(parseBirthdays.bind(this));
  }

  /**
   * Информация об задании
   * @param {Number | String} id id задания
   * @return {Promise<{
   *  date: Date,
   *  theme: String,
   *  weight: Number,
   *  teacher: String,
   *  subject: {
   *    id: Number,
   *    name: String
   *  }
   * }>}
   */
  assignment(id) {
    return this.fetch(
        `/webapi/student/diary/assigns/${id}?studentId=${this._userId}`,
    )
        .then((a) => ({
          date: new Date(a.date),
          theme: a.assignmentName,
          weight: a.weight,
          teacher: a.teacher.name,
          subject: a.subjectGroup,
        }));
  }

  /**
   * Итоговые оценки
   * @return {Promise<JSON>}
   */
  totalMarks() {
    return this.fetch(
        '/asp/Reports/ReportStudentTotalMarks.asp',
        {
          method: 'post',
          body: {
            AT: this._at,
            VER: this._ver,
            RPTID: 'StudentTotalMarks',
            RPNAME: encodeURI('Итоговые отметки'),
          },
        },
    )
        .then(() => this.fetch(
            '/asp/Reports/StudentTotalMarks.asp',
            {
              method: 'post',
              body: {
                AT: this._at,
                VET: this._ver,
                SID: this._userId,
                PCLID: this._classId,
                LoginType: 0,
              },
            },
        ));
  }

  /**
   * Объявления
   * @return {Promise<{
   *  id: Number,
   *  date: Date,
   *  name: String,
   *  author: String,
   *  description: String,
   * }[]>}
   */
  announcements() {
    return this.fetch('/webapi/announcements?take=-1')
        .then((posts) =>
          posts.map((p) => ({
            id: p.id,
            date: new Date(p.postDate),
            name: p.name,
            author: p.author.fio,
            description: p.description,
          })),
        );
  }

  /**
   * Типы заданий
   * @return {Promise<{id: Number, name: String}[]>}
   */
  assignmentTypes() {
    return this.fetch('/webapi/grade/assignment/types?all=false')
        .then((types) =>
          types.map((t) => ({
            id: t.id,
            name: t.name,
          })),
        );
  }

  /**
   * Количество непрочитанных сообщений
   * @return {Promise<Number>}
   */
  unreadedMessages() {
    return this.fetch('/webapi/mail/messages/unreaded');
  }
}

module.exports = Parser;
