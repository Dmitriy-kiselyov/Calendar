/**
 * Создает экземпляр события календаря.
 * @param {String} title Наименование события.
 * @param {?String} description Описание события.
 * @param {Date} date Когда событие произойдет.
 * @param {bool} hasTime <i>true</i> - Событие произойдет в точное время, указанное в параметре date.
 * <i>false</i> - событие длится весь день.
 * @param {String} remindOption Содержит 4 возможных вариатна:
 * "no" - событие без уведомления;
 * "1h" - уведомление о событии приходит за час
 * "5m" - за 5 минут
 * "in_time" - вовремя
 * @param {number} [id] Идентификатор события для {@link localStorage}
 * @constructor
 */
function CalendarEvent(title, description, date, hasTime, remindOption, id) {
    this.title = title;
    this.description = description || null;
    this.date = date;
    this.hasTime = hasTime;
    this.remindOption = remindOption;
    this.id = id || "event_" + String(Math.random()).substr(2);
}

/**
 * Возвращает JSON представление объекта класса.
 * @returns {String} JSON строка.
 */
CalendarEvent.prototype.toString = function () {
    return JSON.stringify(this);
};

/**
 * Преобразует JSON строку в объект класса.
 * @param s JSON строка.
 * @returns {CalendarEvent}
 */
CalendarEvent.fromString = function (s) {
    var obj = JSON.parse(s, function (key, value) {
        if (value != null && key == "date")
            return new Date(value);
        return value;
    });

    return new CalendarEvent(obj.title, obj.description, obj.date, obj.hasTime, obj.remindOption, obj.id);
};

/**
 * Сравнивает 2 события по дате и наименованию.
 * @param {CalendarEvent} a
 * @param {CalendarEvent} b
 * @returns {number} 1, если a > b; -1, если a < b; иначе 0.
 */
CalendarEvent.comparator = function (a, b) {
    if (a.date.getTime() != b.date.getTime())
        return a.date.getTime() - b.date.getTime();

    return a.title < b.title ? -1 : a.title > b.title;
};

/**
 * Сортирует события по дате и наименованию.
 * @param {CalendarEvent[]} events Массив событий.
 */
CalendarEvent.sort = function (events) {
    events.sort(CalendarEvent.comparator);
};

/**
 * Выбирает события данного месяца из {@link localStorage}
 * @param {number} year
 * @param {number} month
 * @returns {CalendarEvent[]}
 */
CalendarEvent.getMonthEvents = function (year, month) {
    var monthEvents = [];

    for (var i = 0; i < localStorage.length; i++) {
        var event = CalendarEvent.fromString(localStorage.getItem(localStorage.key(i)));
        if (event.date.getFullYear() == year && event.date.getMonth() == month)
            monthEvents.push(event);
    }

    return monthEvents;
};

/**
 * Возвращает событие из {@link localStorage} по его идентификатору.
 * @param eventId Идентификатор события.
 * @returns {CalendarEvent}
 */
CalendarEvent.fromId = function (eventId) {
    return CalendarEvent.fromString(localStorage.getItem(eventId));
};

