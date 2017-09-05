/**
 * Создает экземпляр календаря.
 * @param {Object} [options] Содержит параметры отображения.
 * @param {Date} [options.date] День, для которого строится месячный календарь.
 * Иначе используется сегодняшная дата.
 * @constructor
 */
function Calendar(options) {
    var MONTH_NAMES = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    var WEEK_NAMES = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

    /**
     * Корневой HTML-элемент календаря.
     */
    var rootElement;
    /**
     * Отображаемый год.
     */
    var year;
    /**
     * Отображаемый месяц.
     */
    var month;
    if (options && options.hasOwnProperty("date"))
        setDate(options.date);

    /**
     * Устанавливает месяц, для которого строится календарь.
     * @param {Date} date Новый день.
     */
    function setDate(date) {
        year = date.getFullYear();
        month = date.getMonth();

        if (rootElement)
            buildMonthCalendar();
    }

    /**
     * Возвращает HTML-элемент для вставки в html страницу.
     * @returns {HTMLElement}
     */
    function getElement() {
        if (!rootElement)
            buildMonthCalendar();
        return rootElement;
    }

    /**
     * Создает новый HTMLElement по указанным параметром. Используется, для сокращения кода.
     * @param {String} tag Тэг элемента.
     * @param {String} [className] Имена классов, разделенные пробелом.
     * @param {String} [text] Внутренний текст элемента.
     * @param {bool} [textAsTextContent] Если true, внутренний текст элемента будет отображаться без обработки html-тэгов.
     * @returns {Element}
     */
    function element(tag, className, text, textAsTextContent) {
        var el = document.createElement(tag);
        if (className)
            el.className = className;
        if (text && !textAsTextContent)
            el.innerHTML = text;
        if (text && textAsTextContent)
            el.textContent = text;
        return el;
    }

    /**
     * Создает месячный календарь для текущих {@link year} и {@link month}. Созданный HTMLElement записывает в переменную {@link rootElement}.
     */
    function buildMonthCalendar() {
        if (month == null || year == null) {
            var date = new Date();
            month = date.getMonth();
            year = date.getFullYear();
        }

        //Загрузить оболочку календаря
        rootElement = loadTemplate();

        //Заголовок календаря
        updateMonthHeader();
        rootElement.querySelector(".calendar__nav-prev").onclick = prevMonth;
        rootElement.querySelector(".calendar__nav-next").onclick = nextMonth;
        rootElement.querySelector(".calendar__nav-today").onclick = currentMonth;

        //Сетка календаря
        var grid = makeMonthTable();
        rootElement.appendChild(grid);

        rootElement.onclick = function (event) {
            if (event.target.dataset.eventId) { //Редактировать событие
                editEvent(event.target.dataset.eventId);
            }
        };

        //всплывающая подсказка
        rootElement.onmouseover = function (event) {
            if (event.target.dataset.eventId) {
                var eventId = event.target.dataset.eventId;
                var calendarEvent = CalendarEvent.fromId(eventId);

                var tooltip = element("div", "calendar__tooltip");
                tooltip.setAttribute("data-tooltip-event-id", eventId);
                tooltip.appendChild(element("h3", null, calendarEvent.title, true));
                if (calendarEvent.description)
                    tooltip.appendChild(element("p", null, calendarEvent.description, true));

                //count coordinates
                var rect = event.target.getBoundingClientRect();
                tooltip.style.left = rect.right + pageXOffset + 5 + "px";
                tooltip.style.top = rect.top + pageYOffset + "px";

                //animation
                tooltip.style.opacity = "0";
                rootElement.querySelector(".calendar__grid").appendChild(tooltip);
                setTimeout(function () {
                    tooltip.style.opacity = "1";
                }, 0);

                //move tooltip left if windows is too small
                if (tooltip.offsetLeft + tooltip.offsetWidth > document.documentElement.clientWidth + pageXOffset)
                    tooltip.style.left = rect.left - tooltip.offsetWidth + pageXOffset - 5 + "px";

                //move top if needed
                if (tooltip.offsetTop + tooltip.offsetHeight > document.documentElement.clientHeight + pageYOffset)
                    tooltip.style.top = rect.bottom - tooltip.offsetHeight + pageYOffset + "px";

            }
        };
        rootElement.onmouseout = function (event) {
            if (event.target.dataset.eventId) {
                var eventId = event.target.dataset.eventId;
                var tooltip = rootElement.querySelector(".calendar__tooltip[data-tooltip-event-id='" + eventId + "']");
                if (tooltip)
                    tooltip.parentNode.removeChild(tooltip);
            }
        };
    }

    /**
     * Возвращает шаблон календаря
     * @returns {Element}
     */
    function loadTemplate() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "calendar_template.html", false);
        xhr.send();

        if (xhr.status == 200) {
            var wrapper = document.createElement("div");
            wrapper.innerHTML = xhr.responseText;
            return wrapper.firstElementChild;
        }
    }

    /**
     * Возвращает таблицу с днями и событиями для текущего месяца.
     * @returns {Element}
     */
    function makeMonthTable() {
        var table = element("table", "calendar__grid");

        //make thead
        var tr = element("tr");
        for (var i = 0; i < WEEK_NAMES.length; i++) {
            var th = element("th", "calendar__week", WEEK_NAMES[i]);
            tr.appendChild(th);
        }
        table.appendChild(element("thead")).appendChild(tr);

        //make tbody
        var tbody = element("tbody");

        for (i = 0; i < 6; i++) {
            tr = element("tr");
            for (var j = 0; j < 7; j++) {
                var td = element("td", "calendar__day");
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);

        //fill table with information
        fillTableWithDays(table);
        fillTableWithEvents(table);

        return table;
    }

    /**
     * Заполняет данную ей таблицу днями текущего месяца (если есть необходимость, отмечает предыдущий и следующий месяцы).
     * @param {HTMLTableElement} table
     */
    function fillTableWithDays(table) {
        var eventsTable = element("table", "calendar__day_info");
        eventsTable.appendChild(element("thead"))
                   .appendChild(element("tr"))
                   .appendChild(element("th", "calendar__day_date"));

        var date = new Date(year, month, 1);
        var today = new Date();
        var getDay = function () {
            var day = date.getDay();
            if (day == 0)
                return 6;
            return day - 1;
        };
        var equalDate = function (d1, d2) {
            return d1.getDate() == d2.getDate() && d1.getMonth() == d2.getMonth() && d1.getFullYear() == d2.getFullYear();
        };

        //this month days
        var i = 1, j = getDay();
        while (month == date.getMonth()) {
            var eventsTableClone = eventsTable.cloneNode(true);
            var th = eventsTableClone.getElementsByTagName("th")[0];
            th.textContent = date.getDate();
            if (j >= 5)
                th.classList.add("calendar__day_date-weekend");
            eventsTableClone.dataset.date = date.toDateString();

            table.rows[i].cells[j].appendChild(eventsTableClone);
            if (equalDate(date, today))
                table.rows[i].cells[j].classList.add("calendar__day-today");

            date.setDate(date.getDate() + 1);
            j++;
            if (j == 7) {
                i++;
                j = 0;
            }
        }

        //adjacent month days
        th = eventsTable.getElementsByTagName("th")[0];
        th.classList.add("calendar__day_date-adjacent");

        //next month days
        for (; i < table.rows.length; i++) {
            var row = table.rows[i];
            for (; j < row.cells.length; j++) {
                th = eventsTable.getElementsByTagName("th")[0];
                th.textContent = date.getDate();
                row.cells[j].appendChild(eventsTable.cloneNode(true));

                date.setDate(date.getDate() + 1);
            }
            j = 0;
        }

        //prev month days
        date = new Date(year, month, 1);
        date.setDate(0);

        for (j = (getDay() == 6 ? -1 : getDay()); j >= 0; j--) {
            th = eventsTable.getElementsByTagName("th")[0];
            th.textContent = date.getDate();
            table.rows[1].cells[j].appendChild(eventsTable.cloneNode(true));

            date.setDate(date.getDate() - 1);
        }
    }

    /**
     * Заполняет данную ей таблицу событиями текущего месяца.
     * @param {HTMLTableElement} table
     */
    function fillTableWithEvents(table) {
        var monthEvents = CalendarEvent.getMonthEvents(month);
        CalendarEvent.sort(monthEvents);

        var printEvent = function (event) {
            if (event.hasTime) {
                var h = event.date.getHours();
                if (h < 10)
                    h = "0" + h;
                var m = event.date.getMinutes();
                if (m < 10)
                    m = "0" + m;
                return h + ":" + m + " " + event.title;
            }
            else
                return event.title;
        };

        for (var i = 0; i < monthEvents.length; i++) {
            var dateStr = monthEvents[i].date.toDateString();
            var eventTable = table.querySelector("[data-date='" + dateStr + "']");

            var tbody = eventTable.getElementsByTagName("tbody")[0];
            if (!tbody) {
                tbody = element("tbody");
                eventTable.appendChild(tbody);
            }

            var td = element("td", "calendar__day_event", printEvent(monthEvents[i]), true);
            td.setAttribute("data-event-id", monthEvents[i].id);
            tbody.appendChild(element("tr"))
                 .appendChild(td);
        }
    }

    /**
     * Устанавливет заголовок текущего экрана календаря в зависимости от значений {@link month} и {@link year}.
     */
    function updateMonthHeader() {
        var header = rootElement.querySelector(".calendar__title");
        header.textContent = MONTH_NAMES[month] + " " + year;
    }

    /**
     * Обновляет данные календаря в зависимости от значений {@link month} и {@link year}.
     */
    function updateCalendar() {
        updateMonthHeader();

        var table = rootElement.querySelector(".calendar__grid");
        table.parentNode.replaceChild(makeMonthTable(), table);
    }

    /**
     * Отображает следующий месяц календаря.
     */
    function nextMonth() {
        month++;
        if (month == 12) {
            month = 0;
            year++;
        }

        updateCalendar();
    }

    /**
     * Отображает предыдущий месяц календаря.
     */
    function prevMonth() {
        month--;
        if (month == -1) {
            month = 11;
            year--;
        }

        updateCalendar();
    }

    /**
     * Отображает текущий месяц.
     */
    function currentMonth() {
        var date = new Date();
        month = date.getMonth();
        year = date.getFullYear();

        updateCalendar();
    }

    /**
     * Открывает страницу для создания нового события.
     * Если была нажата кнопка OK, событие добавляется в {@link localStorage}, а сам календарь обновляется.
     */
    function addEvent() {
        var eventWindow = window.open("new-event.html");

        eventWindow.onOKListener = function (event) {
            addNewEvent(event);

            year = event.date.getFullYear();
            month = event.date.getMonth();
            updateCalendar();
        };
    }

    /**
     * Открывает страницу для редактирования события.
     * Если была нажата кнопка OK, данные события обновляются.
     * Если DELETE - событие удаляется из {@link localStorage}.
     * Календарь обновляется.
     * @param {String} eventId Идентификатор события, хранимого в {@link localStorage}.
     */
    function editEvent(eventId) {
        var eventWindow = window.open("edit-event.html?eventId=" + eventId);

        eventWindow.onDeleteListener = function () {
            deleteEvent(eventId);

            var date = new Date();
            year = date.getFullYear();
            month = date.getMonth();
            updateCalendar();
        };

        eventWindow.onOKListener = function (event) {
            deleteEvent(eventId);
            addNewEvent(event);

            year = event.date.getFullYear();
            month = event.date.getMonth();
            updateCalendar();
        }
    }

    /**
     * Добавляет событие в {@link localStorage} и уведомления, если нужно.
     * @param {CalendarEvent} event Новое событие.
     */
    function addNewEvent(event) {
        localStorage.setItem(event.id, event.toString());
        var intervalId = notifyEvent(event);
        if (intervalId)
            event.intervalId = intervalId;
    }

    /**
     * Удаляет событие и отменяет уведомление, если есть.
     * @param eventId Идентификатор события.
     */
    function deleteEvent(eventId) {
        var event = CalendarEvent.fromId(eventId);
        if (event.intervalId)
            clearTimeout(event.intervalId);
        localStorage.removeItem(eventId);
    }

    /**
     * Включает уведомления для всех событий из {@link localStorage}, если нужно.
     */
    function notifyEvents() {
        var currentDate = new Date();
        for (var i = 0; i < localStorage.length; i++) {
            var event = CalendarEvent.fromId(localStorage.key(i));
            if (event.date < currentDate) {
                var intervalId = notifyEvent(event);
                if (intervalId)
                    event.intervalId = intervalId;
            }
        }
    }

    /**
     * Включает уведомления для данного события, если нужно.
     * @param {CalendarEvent} event
     * @returns {number} intervalId (при удалении события, таймер необходимо отключить)
     */
    function notifyEvent(event) {
        if (event.remindOption == "no")
            return;

        if (!("Notification" in window))
            return;

        if (Notification.permission == "denied")
            return;

        if (Notification.permission == "default") {
            Notification.requestPermission(function (permission) {
                if (permission == "granted")
                    notifyEvent(eventId);
            })
        }
        //else permission granted

        //count date
        var currentTime = new Date().getTime();
        var eventDate = new Date(event.date);
        var note = "";
        switch (event.remindOption) {
            case "1h":
                eventDate.setHours(eventDate.getHours() - 1);
                note = "(через 1 час)";
                break;
            case "5m":
                eventDate.setMinutes(eventDate.getMinutes() - 5);
                note = "(через 5 минут)";
                break;
        }
        var eventTime = eventDate.getTime();

        var timeToEvent = eventTime - currentTime;
        if (timeToEvent < 0) //time has passed
            return;

        //notify
        return setTimeout(function () {
            new Notification(event.title, {
                body: note + (event.description ? "\n" + event.description : "")
            });
        }, timeToEvent);
    }

    //open fields
    this.getElement = getElement;
    this.nextMonth = nextMonth;
    this.prevMonth = prevMonth;
    this.currentMonth = currentMonth;
    this.addEvent = addEvent;
    this.notifyEvents = notifyEvents;
}