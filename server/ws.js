// eslint-disable-next-line new-cap
const router = require('express').Router();
const Parser = require('../parser');
const activeParsers = {};

// Подключаем базы данных
const Users = require('../database/users');
const Links = require('../database/links');
const Tokens = require('../database/tokens');

// События сокета
const events = [
  {
    // Проверка соединения с сервером
    name: 'Ping',
    auth: false,
    props: ['timestamp'],
    callback(data) {
      this.sendData(data);
    },
  },
  {
    // Проверка хоста
    name: 'CheckHost',
    auth: false,
    props: ['host'],
    callback(data) {
      Parser.checkHost(data.host)
          .then((fit) => this.sendData({fit}))
          .catch(this.sendCatch);
    },
  },
  {
    // Форма авторизации
    name: 'GetAuthForm',
    auth: false,
    props: ['host'],
    callback(data) {
      Parser.authForm(data.host)
          .then((form) => this.sendData({form}))
          .catch(this.sendCatch);
    },
  },
  {
    // Подгрузка форма авторизации
    name: 'UploadAuthForm',
    auth: false,
    props: ['host', 'allSelected', 'lastSelected'],
    callback(data) {
      Parser.uploadAuthForm(data.host, data.allSelected, data.lastSelected)
          .then((items) => this.sendData({items}))
          .catch(this.sendCatch);
    },
  },
  {
    // Добавить нового пользователя
    name: 'AddNewUser',
    auth: false,
    props: ['host', 'login', 'password', 'ttsLogin'],
    callback(data) {
      Parser.checkHost(data.host)
          .then((fit) => {
            if (!fit) {
              throw new Error(
                  `Этот сервер(${data.host}) не подходит для работы`,
              );
            } else {
              return new Parser(
                  data.host, data.login, data.password, data.ttsLogin,
              );
            }
          })
          .then((parser) => parser.logIn().then(() => parser))
          .then((parser) => Users.add({
            host: data.host,
            login: data.login,
            password: data.password,
            ttsLogin: data.ttsLogin,
            photo: parser.photo,
            email: parser.email,
            lastName: parser.lastName,
            firstName: parser.firstName,
          }).then((id) => (activeParsers[id] = parser, id)))
          .then((uid) => Tokens.add({
            uid,
            main: true,
            ctime: new Date(),
            limited: false,
            cdevice: this.deviceInfo(),
          }))
          .then((tid) => (
            this.appData.uid = tid,
            this.sendData({tid})
          ))
          .catch(this.sendCatch);
    },
  },
  {
    // Вход при помощи ссылки
    name: 'LogInViaLink',
    auth: false,
    props: ['id'],
    callback(data) {
      Links.write(data.id, {work: false})
          .then(({tid}) => Tokens.read(tid))
          .then(({uid, limited}) => {
            if (limited === true) {
              throw new Error('Эта ссылка не действительна');
            }
            return Tokens.add({
              uid,
              main: false,
              ctime: new Date(),
              limited: true,
              cdevice: this.deviceInfo(),
            });
          })
          .then((tid) => (
            this.appData.uid = tid,
            this.sendData({tid})
          ))
          .catch(this.sendCatch);
    },
  },
  {
    // Смена текущего пользователя
    name: 'ChangeUser',
    auth: false,
    props: ['id'],
    callback(data) {
      this.appData.uid = data.id;
      this.sendData({changed: this.checkToken()});
    },
  },
  {
    // Создание ссылки для входа
    name: 'GetAuthLink',
    callback() {
      this.tokenInfo()
          .then(({id, limited}) => {
            if (limited === true) {
              throw new Error('Вы не можете создавать ссылки');
            }
            return Links.connectionLink(id);
          })
          .then((id) => `http${this.req.secure ? 's' : ''}://${this.req.hostname}/login/${id}`)
          .then((link) => this.sendData({link}))
          .catch(this.sendCatch);
    },
  },
  {
    // Проверка прав
    name: 'CheckRights',
    callback() {
      this.tokenInfo()
          .then(({main, limited}) => ({main, limited}))
          .then((rights) => this.sendData({rights}))
          .catch(this.sendCatch);
    },
  },
  {
    // Изменить ограничения
    name: 'ChangeRestric',
    props: ['id', 'limited'],
    callback(data) {
      this.tokenInfo()
          .then(({main}) => {
            if (data.id === this.appData.uid) {
              throw new Error('Вы не можете изменить свои ограничения');
            }
            if (main !== true) {
              throw new Error('Вы не можете изменить ограничения пользователя');
            }
            return Tokens.write(data.id, {limited: data.limited});
          })
          .then(({limited}) => this.sendData({limited}))
          .catch(this.sendCatch);
    },
  },
  {
    // Удаление текущего пользователя
    name: 'RemoveCurrentUser',
    callback() {
      this.tokenInfo()
          .then(({id, uid, main}) => {
            if (main !== true) return Tokens.del(id);
            return Tokens.removeCommonUsers(uid).then(() => Users.del(uid));
          })
          .then(() => this.sendData({deleted: true}))
          .catch(this.sendCatch);
    },
  },
  {
    // Просмотр подключенных пользователей
    name: 'ConnectedUsers',
    callback() {
      this.tokenInfo()
          .then(({uid, limited}) => {
            if (limited === true) {
              throw new Error('Вы не можете посмотреть этот список');
            }
            return Tokens.commonUsers(uid);
          })
          .then((users) => this.sendData({users}))
          .catch(this.sendCatch);
    },
  },
  {
    // Удаление подключенного пользователя
    name: 'RemoveConnectedUser',
    props: ['id'],
    callback(data) {
      this.tokenInfo()
          .then(({main}) => {
            if (data.id === this.appData.uid) {
              throw new Error('Вы не можете удалить себя');
            }
            if (main === false) {
              throw new Error('Вы не можете удалить пользователя');
            }
            return Tokens.del(data.id);
          })
          .then((deleted) => this.sendData({deleted}))
          .catch(this.sendCatch);
    },
  },
  {
    // Проверка авторизации в сетевом
    name: 'CheckAuth',
    callback() {
      this.parser()
          .then((p) => p.needAuth)
          .then((need) => this.sendData({need}))
          .catch(this.sendCatch);
    },
  },
  {
    // Оставшееся время авторизации в сетевом
    name: 'LeftSessionTime',
    callback() {
      this.parser()
          .then((p) => p._sessionTime - Date.now())
          .then((time) => this.sendData({time}))
          .catch(this.sendCatch);
    },
  },
  {
    // Авторизация в сетевом
    name: 'LogIn',
    callback() {
      this.parser()
          .then((p) => p.needAuth ? p.logIn() : p)
          .then((p) => {})
          .then(() => this.sendData({auth: true}))
          .catch(this.sendCatch);
    },
  },
  {
    // Выход с сетевого
    name: 'LogOut',
    callback() {
      this.parser()
          .then((p) => !p.needAuth ? p.logOut() : void 0)
          .then(() => this.sendData({auth: false}))
          .catch(this.sendCatch);
    },
  },
  {
    // Доска объявлений
    name: 'GetAnnouncements',
    callback() {
      this.parser()
          .then((p) => p.announcements())
          .then((announcements) => this.sendData({announcements}))
          .catch(this.sendCatch);
    },
  },
  {
    // ID доступных объявлений
    name: 'GetAnnouncementsID',
    callback() {
      this.parser()
          .then((p) => p.announcements())
          .then((posts) => posts.map((p) => p.id))
          .then((ids) => this.sendData({ids}))
          .catch(this.sendCatch);
    },
  },
  {
    // Количество непрочитанных сообщений
    name: 'GetUnreadedMessages',
    callback() {
      this.parser()
          .then((p) => p.unreadedMessages())
          .then((number) => this.sendData({number}))
          .catch(this.sendCatch);
    },
  },
  {
    // Список дней рождений
    name: 'GetBirthdays',
    props: ['date'],
    callback({date, withParents}) {
      this.parser()
          .then((p) => p.birthdays(new Date(date), withParents))
          .then((birthdays) => this.sendData({birthdays}))
          .catch(this.sendCatch);
    },
  },
  {
    // Период обучения
    name: 'GetStudyYear',
    callback() {
      this.parser()
          .then((p) => p.studyYear)
          .then((studyYear) => this.sendData({studyYear}))
          .catch(this.sendCatch);
    },
  },
  {
    // Получить список предметов
    name: 'GetSubjectsList',
    callback() {
      this.parser()
          .then((p) => p.subjects)
          .then((subjectsList) => this.sendData({subjectsList}))
          .catch(this.sendCatch);
    },
  },
  {
    // Получить тип заданий
    name: 'GetAssignmentsType',
    callback() {
      this.parser()
          .then((p) => p.assignmentTypes())
          .then((types) => this.sendData({types}))
          .catch(this.sendCatch);
    },
  },
  {
    // Получение дневника по периоду
    name: 'GetDiaryRange',
    props: ['start', 'end'],
    callback({start, end}) {
      this.parser()
          .then((p) => p.diary(new Date(start), new Date(end)))
          .then((days) => this.sendData({days}))
          .catch(this.sendCatch);
    },
  },
  {
    // Получение задания
    name: 'GetAssignment',
    props: ['id'],
    callback({id}) {
      this.parser()
          .then((p) => p.assignment(id))
          .then((assignment) => this.sendData({assignment}))
          .catch(this.sendCatch);
    },
  },
  {
    // Получение отчета по предмету
    name: 'GetSubjectReport',
    props: ['id', 'start', 'end'],
    callback({id, start, end}) {
      this.parser()
          .then((p) => p.subject(id, new Date(start), new Date(end)))
          .then((subject) => this.sendData({subject}))
          .catch(this.sendCatch);
    },
  },
  {
    // Получение отчета об успеваемости
    name: 'GetStudyReport',
    props: ['start', 'end'],
    callback({start, end}) {
      this.parser()
          .then((p) => p.journal(new Date(start), new Date(end)))
          .then((journal) => this.sendData({journal}))
          .catch(this.sendCatch);
    },
  },
  {
    // Получение отчета об итоговых оценках
    name: 'GetTotalReport',
    callback() {
      this.parser()
          .then((p) => p.totalMarks())
          .then(this.sendData)
          .catch(this.sendCatch);
    },
  },
];

// Функции
/**
 * Получить парсер пользователя
 * @this {WebSocket}
 * @return {Promise<Parser>}
 */
function parser() {
  return this.userInfo()
      .then(({id, host, login, password, ttsLogin}) => {
        if (id in activeParsers) return activeParsers[id];
        return activeParsers[id] = new Parser(host, login, password, ttsLogin);
      });
};

/**
 * Получаем информацию о пользователе по токену
 * @this {WebSocket}
 * @return {Promise<Object>} информация о пользователе
 */
function userInfo() {
  return this.tokenInfo()
      .then(({uid}) => Users.read(uid));
};

/**
 * Получение данных токена
 * @this {WebSocket}
 * @return {Promise<{
 *  uid: String,
 *  main: Boolean,
 *  ctime: String,
 *  limited: Boolean,
 *  cdevice: {
 *    os: String,
 *    img: String,
 *    browser: String,
 *    version: String,
 *    platform: String,
 *  }
 * }>} Данные токена
 */
function tokenInfo() {
  return Tokens.read(this.appData.uid ?? 0);
}

/**
 * Проверяем существование токена в системе
 * @this {WebSocket}
 * @return {Boolean} `true` если токен существует
 */
function checkToken() {
  return Tokens.exist(this.appData.uid ?? 0);
};

/**
 * Получаем информацию об устройстве
 * @this {WebSocket}
 * @return {Object} информацию об устройстве
 */
function deviceInfo() {
  const {
    isDesktop,
    isAndroid,
    isWindows,
    isTablet,
    isMobile,
    platform,
    isiPhone,
    browser,
    version,
    isMac,
    os,
  } = this.req.useragent;
  return {
    os,
    browser,
    version,
    platform,
    img: isTablet ?
          (
            isAndroid ? 'tablet_android' :
            isMac ? 'tablet_mac' :
            'tablet'
          ) :
          isMobile ?
          (
            isAndroid ? 'phone_android' :
            isiPhone ? 'phone_iphone' :
            'smartphone'
          ) :
          isDesktop ?
          (
            isWindows ? 'desktop_windows' :
            isMac ? 'desktop_mac' :
            'computer'
          ) :
          'device_unknown',
  };
};

/**
 * Сохраняем информацию о пользователе по токену
 * @this {WebSocket}
 * @param {Object} data Новая информация о пользователе
 * @return {Promise<Object>} информация о пользователе
 */
function userSaveInfo(data) {
  return this.tokenInfo().then(({uid}) => Users.write(uid, data));
};


/**
 * Проверяем авторизацию пользователя в системе
 * @this {WebSocket}
 * @param {{mid: String, method: String}} request Обращение на сервер
 * @return {Boolean} `true` если пользователь авторизован
 */
function checkAuth(request) {
  const {mid = null, method = 'MessageErrors'} = request;
  if (!this.checkToken()) {
    this.send(JSON.stringify({
      ok: false,
      mid,
      method,
      error: {
        msg: `Для этого метода(${method}) нужно авторизоваться`,
        code: 4009,
      },
    }));
    return false;
  }
  return true;
};

/**
 * Проверка данных
 * @this {WebSocket}
 * @param {{
 *  mid: String,
 *  data: Object?,
 *  method: String
 * }} request Обращение на сервер
 * @param {String[]} keys Значения, которое должны быть в `data`
 * @return {Boolean} `true` если все ключи есть
 */
function checkData(request, keys) {
  const {mid = null, method, data = {}} = request;
  for (const key of keys) {
    if (key in data) continue;
    this.send(JSON.stringify({
      ok: false,
      mid,
      error: {
        msg: `Для метода '${method}' нужно передать значение '${key}'`,
        code: 4005,
      },
      method,
    }));
    return false;
  }
  return true;
}

/**
 * Функция для отправки ответа
 * @this {WebSocket}
 * @param {{mid: String, method: String}} request Обращение на сервер
 * @return {Function} Функция для ответа на ообщение
 */
function sendData(request = {}) {
  const {mid = null, method = 'MessageErrors'} = request;
  return (data) => {
    this.send(JSON.stringify({
      ok: true,
      mid,
      data,
      method,
    }));
  };
};

/**
 * Функция для отправки ошибки
 * @this {WebSocket}
 * @param {{mid: String, method: String}} request Обращение на сервер
 * @return {Function} Функция для ответа на ообщение
 */
function sendError(request = {}) {
  const {mid = null, method = 'MessageErrors'} = request;
  return (msg, code) => {
    this.send(JSON.stringify({
      ok: false,
      mid,
      method,
      error: {
        msg,
        code,
      },
    }));
  };
};

/**
 * Функция для отправки ошибки
 * @this {WebSocket}
 * @param {{mid: String, method: String}} request Обращение на сервер
 * @return {Function} Функция для ответа на ообщение
 */
function sendCatch(request) {
  const {mid = null, method = 'MessageErrors'} = request;
  return (err) => {
    const error = {
      msg: err.message,
      code: 4006,
    };
    if (err.fr === true && err.auth()) {
      error.code = 4007;
    } else if (err.fr === true && err.work()) {
      error.code = 4008;
    }
    this.send(JSON.stringify({
      ok: false,
      mid,
      error,
      method,
    }));
  };
};

/**
 * Разбор сообщений для вызова событий
 * @param {{
 *  name: String,
 *  auth: Boolean,
 *  props: String[],
 *  authSgo: Boolean,
 *  callback: Function
 * }[]} events Все события
 * @return {Function}
 */
function parseMessage(events) {
  return function(message = '') {
    let request = {
      mid: '',
      data: {},
      method: '',
    };
    // Чтение сообщения
    try {
      request = JSON.parse(message);
    } catch (e) {
      console.error(' Ошибка: \'ParseMessage\' '.error, e);
      sendError.call(this)('Не удалось прочесть сообщение', 4001);
      return;
    }

    // Проверка сообщения
    if (!request.method) {
      sendError
          ?.call(this)('Сообщение должно содержать значение \'method\'', 4002);
      return;
    }

    // Проверка наличия метода
    const event = events.find((e) => e.name == request.method);
    if (!event) {
      sendError.call(this)(`Метода '${request.method}' не существует`, 4004);
      return;
    }

    // Функции для работы с сообщением
    const functions = {
      sendData: sendData.call(this, request),
      sendError: sendError.call(this, request),
      sendCatch: sendCatch.call(this, request),
    };

    // Вызов события
    try {
      if (event.auth !== false && !checkAuth.call(this, request)) return;
      if (!checkData.call(this, request, event.props ?? [])) return;
      event.callback?.call({...this, ...functions}, request.data);
    } catch (err) {
      console.error(' Ошибка: \'CallEvent\' '.error, err);
      sendError.call(this)(`Произошла ошибка: ${err?.message}`, 4000);
    }
  };
}

router.ws('/', (ws, req) => {
  // Сохраняем данные запроса
  ws.req = req;
  ws.appData = {
    ...req.cookies,
    ...req.query,
    ...req.body,
  };

  // Функции
  ws.parser = parser.bind(ws);
  ws.userInfo = userInfo.bind(ws);
  ws.tokenInfo = tokenInfo.bind(ws);
  ws.checkToken = checkToken.bind(ws);
  ws.deviceInfo = deviceInfo.bind(ws);
  ws.userSaveInfo = userSaveInfo.bind(ws);

  // Парсим сообщения
  ws.on('message', parseMessage(events));

  // Говорим клиенту, что мы готовы
  ws.send(JSON.stringify({
    ok: true,
    method: 'Open',
  }));
});

module.exports = router;
