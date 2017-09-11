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
    /**
     * Интерфейс модального окна
     * @type {{openNew, close}}
     */
    var modalWindow = createModalWindow();
    /**
     * Интерфейс всплывающих подсказок
     * @type {{enableTooltips, disableTooltips}}
     */
    var tooltips = createTooltips();

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
     * @returns {Element}
     */
    function element(tag, className, text) {
        var el = document.createElement(tag);
        if (className)
            el.className = className;
        if (text)
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
        var wrapper = document.createElement("div");
        wrapper.innerHTML = loadTemplate("calendar_template.html");
        rootElement = wrapper.firstElementChild;

        //Заголовок календаря
        updateMonthHeader();
        rootElement.querySelector(".calendar__nav-prev").onclick = prevMonth;
        rootElement.querySelector(".calendar__nav-next").onclick = nextMonth;
        rootElement.querySelector(".calendar__nav-today").onclick = currentMonth;

        //Сетка календаря
        var grid = makeMonthGrid();
        rootElement.appendChild(grid);

        rootElement.onclick = function (event) {
            if (event.target.classList.contains("calendar__day_plus")) { //Новое событие
                var date = event.target.closest(".calendar__day_info").dataset.date;
                addEvent(new Date(date));
            }

            if (event.target.closest("[data-event-id]")) { //Редактировать событие
                editEvent(event.target.closest("[data-event-id]").dataset.eventId);
            }
        };

        //Включить всплывающие подсказки
        tooltips.enableTooltips();
    }

    /**
     * Возвращает шаблон. Кеширует ответы, так что запрос каждого вида выполнится ровно один раз.
     * @param url путь к шаблону
     * @returns {string} html представление данных
     */
    function loadTemplate(url) {
        loadTemplate.cache = loadTemplate.cache || {};
        if (loadTemplate.cache.hasOwnProperty(url))
            return loadTemplate.cache[url];

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.send();

        if (xhr.status == 200) {
            loadTemplate.cache[url] = xhr.responseText;
            return xhr.responseText;
        }
    }

    /**
     * Возвращает сетку с днями и событиями для текущего месяца.
     * @returns {Element}
     */
    function makeMonthGrid() {
        var grid = element("table", "calendar__grid");

        //make thead
        var tr = element("tr");
        for (var i = 0; i < WEEK_NAMES.length; i++) {
            var th = element("th", "calendar__week", WEEK_NAMES[i]);
            tr.appendChild(th);
        }
        grid.appendChild(element("thead")).appendChild(tr);

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
        grid.appendChild(tbody);

        //Заполняет сетку информацией
        fillGridWithDays(grid);
        fillGridWithEvents(grid);

        return grid;
    }

    /**
     * Заполняет данную ей сетку днями текущего месяца (отмечает предыдущий и следующий месяцы).
     * @param {HTMLTableElement} table
     */
    function fillGridWithDays(table) {
        var template = _.template(loadTemplate("calendar_day_template.html"));

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

        //Дни текущего месяца
        var i = 1, j = getDay();
        while (month == date.getMonth()) {
            var templateData = {date: date};
            if (j >= 5)
                templateData.weekend = true;
            table.rows[i].cells[j].innerHTML = template(templateData);

            //Если попали в текущий день
            if (equalDate(date, today))
                table.rows[i].cells[j].classList.add("calendar__day-today");

            //Следующий день
            date.setDate(date.getDate() + 1);
            j++;
            if (j == 7) {
                i++;
                j = 0;
            }
        }

        //Дни следующего месяца
        for (; i < table.rows.length; i++) {
            var row = table.rows[i];

            for (; j < row.cells.length; j++) {
                templateData = {date: date, adjacent: true};
                row.cells[j].innerHTML = template(templateData);

                //Следующий день
                date.setDate(date.getDate() + 1);
            }
            j = 0;
        }

        //Дни предыдущего месяца
        date = new Date(year, month, 1);
        date.setDate(0);

        for (j = (getDay() == 6 ? -1 : getDay()); j >= 0; j--) {
            templateData = {date: date, adjacent: true};
            table.rows[1].cells[j].innerHTML = template(templateData);

            //Предыдущий день
            date.setDate(date.getDate() - 1);
        }
    }

    /**
     * Заполняет данную ей таблицу событиями текущего месяца.
     * @param {HTMLTableElement} table
     */
    function fillGridWithEvents(table) {
        var monthEvents = CalendarEvent.getMonthEvents(year, month);
        CalendarEvent.sort(monthEvents);

        var getTime = function (event) {
            if (event.hasTime) {
                var h = event.date.getHours();
                var m = event.date.getMinutes();

                if (m == 0)
                    return String(h);
                if (m < 10)
                    m = "0" + m;
                return h + ":" + m;
            }
            else return "";
        };

        for (var i = 0; i < monthEvents.length; i++) {
            var dateStr = monthEvents[i].date.toDateString();
            var eventTable = table.querySelector("[data-date='" + dateStr + "']");

            //Новое событие
            var eventElement = element("td", "calendar__day_event");
            eventElement.appendChild(element("b", null, getTime(monthEvents[i])));
            eventElement.appendChild(document.createTextNode(" "));
            eventElement.appendChild(document.createTextNode(monthEvents[i].title));
            eventElement.setAttribute("data-event-id", monthEvents[i].id);

            //Добавить в DOM
            eventTable.querySelector("tbody").appendChild(element("tr")).appendChild(eventElement);
        }
    }

    /**
     * Устанавливет заголовок текущего экрана календаря в зависимости от значений {@link month} и {@link year}.
     */
    function updateMonthHeader() {
        var header = rootElement.querySelector(".calendar__title");
        header.textContent = MONTH_NAMES[month] + " " + year;

        var todayButton = rootElement.querySelector(".calendar__nav-today");
        var today = new Date();
        if (today.getFullYear() == year && today.getMonth() == month)
            todayButton.setAttribute("disabled", true);
        else
            todayButton.removeAttribute("disabled");
    }

    /**
     * Обновляет данные календаря в зависимости от значений {@link month} и {@link year}.
     */
    function updateCalendar() {
        updateMonthHeader();

        var table = rootElement.querySelector(".calendar__grid");
        table.parentNode.replaceChild(makeMonthGrid(), table);
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
     * Открывает диалоговое окно для создания события.
     * Если была нажата кнопка OK, событие добавляется в {@link localStorage}, а сам календарь обновляется.
     *
     * @param {Date} date дата, для которой будет создано событие
     */
    function addEvent(date) {
        modalWindow.openNew(
            date,
            function okCallback(calendarEvent) {
                //Сохранить событие
                addNewEvent(calendarEvent);
                //Открыть месяц с новым событием
                year = calendarEvent.date.getFullYear();
                month = calendarEvent.date.getMonth();
                updateCalendar();
            },
            undefined
        );
    }

    /**
     * Открывает страницу для редактирования события.
     * Если была нажата кнопка OK, данные события обновляются.
     * Если DELETE - событие удаляется из {@link localStorage}.
     * Календарь обновляется.
     * @param {String} eventId Идентификатор события, хранимого в {@link localStorage}.
     */
    function editEvent(eventId) {
        modalWindow.openEdit(
            CalendarEvent.fromId(eventId),
            function okCallback(calendarEvent) {
                //Сохранить событие
                deleteEvent(eventId);
                addNewEvent(calendarEvent);
                //Открыть месяц с новым событием
                year = calendarEvent.date.getFullYear();
                month = calendarEvent.date.getMonth();
                updateCalendar();
            },
            undefined,
            function deleteCallback() {
                //Удалить событие
                deleteEvent(eventId);
                //Открыть текущий месяц
                var date = new Date();
                year = date.getFullYear();
                month = date.getMonth();
                updateCalendar();
            }
        );
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
                    notifyEvent(eventId); //Разрешение получено, попробовать еще раз
            })
        }
        //иначе уже есть разрешение на показ события

        //Подготовить данные к выводу
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
        if (timeToEvent < 0) //Время вышло
            return;

        //Оповестить
        return setTimeout(function () {
            new Notification(event.title, {
                body: note + (event.description ? "\n" + event.description : "")
            });
        }, timeToEvent);
    }

    function createModalWindow() {
        var modal;

        /**
         * Создает DOM элемент модального окна
         * @param {Object} options опции
         * @param {boolean} options.edit если true - редуктируем событие, иначе создаем новое
         * @param {CalendarEvent} [options.event] событие, которое нужно редактировать
         * @param {Date} [options.date] изначальная дата, для которой нужно создать новое событие
         */
        function createModal(options) {
            modal = element("div");
            modal.innerHTML = _.template(loadTemplate("modal_template.html"))(options);
            modal = modal.firstElementChild;

            //Заполнить дату и время
            var form = modal.querySelector("form");

            //Можно выбрать другую дату
            $(form.datepicker).datetimepicker({
                timepicker: false,
                format: "d.m.Y",
                dayOfWeekStart: 1,
                value: options.date || options.event.date
            });

            //Можно выбрать время
            $(form.timepicker).datetimepicker({
                datepicker: false,
                format: "H:i",
                step: 30
            });
            if (options.event && options.event.hasTime) {
                $(form.timepicker).datetimepicker({
                    value: options.event.date
                });
            }

            //Выбрать опцию "напомнить", если нужно
            if (options.event) {
                form.remind.querySelector("[value='" + options.event.remindOption + "']").selected = true;
            }
        }

        /**
         * Закрывает окно
         */
        function closeModal() {
            if (modal) {
                modal.parentNode.removeChild(modal);
                modal = undefined;
                document.removeEventListener("click", closeOnOuterClick);
                //Восстановить подсказки
                tooltips.enableTooltips();
            }
        }

        /**
         * Проверяет обязательные поля модального окна. Выводит сообщение об ошибке, если хоть одно обязательное поле пустое.
         * @returns {boolean} поля прошли проверку и данные можно считывать
         */
        function checkFields() {
            var form = modal.querySelector("form");

            //Убрать пробелы с полей
            var fields = form.querySelectorAll("input, textarea");
            for (var i = 0; i < fields.length; i++)
                fields[i].value = fields[i].value.trim();

            //Проверка на пустые поля
            var empty = false;

            fields = [form.title, form.datepicker];
            for (i = 0; i < fields.length; i++) {
                if (!fields[i].value) {
                    empty = true;
                    fields[i].classList.add("error");
                } else {
                    fields[i].classList.remove("error");
                }
            }

            form.querySelector(".calendar__modal__error_message").hidden = !empty;
            return !empty;
        }

        /**
         * Срабатывает при нажатии на OK. Если все необходимые поля заполнены, возвращает новое событие.
         * @returns {(undefined|CalendarEvent)} событие, если все необходимые поля заполнены
         */
        function getCalendarEvent() {
            if (!checkFields())
                return;

            //Извлечь информацию
            var form = modal.querySelector("form");

            var title = form.title.value;
            var descr = form.description.value;
            var date = new Date($(form.datepicker).datetimepicker("getValue"));
            var time = $(form.timepicker).datetimepicker("getValue");
            if (time != null) {
                date.setHours(time.getHours());
                date.setMinutes(time.getMinutes());
            }
            var remindOption = form.remind.options[form.remind.selectedIndex].value;

            //Закрыть окно
            closeModal();

            //Вернуть новое событие
            return new CalendarEvent(title, descr, date, time != null, remindOption);
        }

        /**
         * Закрывает окно при клике вне его
         * @param event обычный click event
         */
        function closeOnOuterClick(event) {
            if (!event.target.closest(".calendar__modal"))
                closeModal();
        }

        /**
         * Навешивает обработчики событий на модальное окно.
         * @param {Function} [okCallback] срабатывает при нажатии OK, аргументом является созданное событие
         * @param {Function} [cancelCallback] срабатывает при нажатии CANCEL
         * @param {Function} [deleteCallback] срабатывает при нажатии DELETE (только в режиме редактирования)
         */
        function addListeners(okCallback, cancelCallback, deleteCallback) {
            var form = modal.querySelector("form");

            //Навесим обработчики
            form.querySelector(".calendar__button-ok").onclick = function () {
                var event = getCalendarEvent();
                if (event) {
                    closeModal();
                    if (okCallback)
                        okCallback(event);
                }
            };

            form.querySelector(".calendar__button-cancel").onclick = function () {
                closeModal();
                if (cancelCallback)
                    cancelCallback();
            };

            var deleteButton = form.querySelector(".calendar__button-delete");
            if (deleteButton) {
                deleteButton.onclick = function () {
                    closeModal();
                    if (deleteCallback)
                        deleteCallback();
                };
            }

            setTimeout(function () { //Чтобы сразу не закрыть окно
                document.addEventListener("click", closeOnOuterClick);
            }, 0);
        }

        /**
         * Позиционирует модальное окно таким образом, чтобы оно выходило из центра элемента
         * @param {HTMLElement} element элемент
         */
        function showModalFor(element) {
            function getAbsoluteRect(element) {
                var rect = element.getBoundingClientRect();
                return {
                    left: rect.left + pageXOffset,
                    right: rect.right + pageXOffset,
                    top: rect.top + pageYOffset,
                    bottom: rect.bottom + pageYOffset,
                    width: rect.width,
                    height: rect.height
                }
            }

            //Размеры и положение элементов
            var elementRect = getAbsoluteRect(element);
            var rootRect = getAbsoluteRect(rootElement);

            //Найдем центр элемента относительно календаря
            var centerX = elementRect.left + elementRect.width / 2 - rootRect.left;
            var centerY = elementRect.top + elementRect.height / 2 - rootRect.top;

            //Определить положение окна
            var arrow = modal.querySelector(".calendar__modal__arrow");

            //Определить вертикальное положение окна
            if (centerY + 10 + modal.offsetHeight > rootRect.bottom) {
                //окно нужно отобразить вверху
                arrow.classList.add("calendar__modal__arrow-top");
                var y = centerY - modal.offsetHeight - 10;
            } else {
                //окно нужно отобразить снизу
                arrow.classList.add("calendar__modal__arrow-bottom");
                y = centerY + 10;
            }

            //Определить горизонтальное положение окна

            //Левая граница
            var x = centerX - modal.offsetWidth / 2;
            if (x < 0) { //Выход за левую границу
                x = 0;
                arrow.style.left = centerX + "px";
            }

            //Правая граница
            if (x + modal.offsetWidth > rootRect.width) { //Выход за правую границу
                x = rootRect.width - modal.offsetWidth;
                arrow.style.left = centerX - x + "px";
            }

            //Изменить положение окна
            modal.style.left = x + "px";
            modal.style.top = y + "px";
        }

        return {
            /**
             * Открывает модальное окно для создания нового события
             * @param {Date} date изначальная дата события
             * @param {Function} [okCallback] срабатывает при нажатии OK, аргументом является созданное событие
             * @param {Function} [cancelCallback] срабатывает при нажатии CANCEL
             */
            openNew: function (date, okCallback, cancelCallback) {
                closeModal();
                createModal({edit: false, date: date});
                addListeners(okCallback, cancelCallback);

                //Расположим окно над соответствующей ячейкой
                var dayElement = rootElement.querySelector("[data-date='" + date.toDateString() + "']").firstElementChild;
                rootElement.appendChild(modal);
                showModalFor(dayElement);

                //Отключить подсказки
                tooltips.disableTooltips();
            },
            /**
             * Открывает модальное окно для редактирования существующего события
             * @param {CalendarEvent} event редактируемое событие
             * @param {Function} [okCallback] срабатывает при нажатии OK, аргументом является созданное событие
             * @param {Function} [cancelCallback] срабатывает при нажатии CANCEL
             * @param {Function} [deleteCallback] срабатывает при нажатии DELETE
             */
            openEdit: function (event, okCallback, cancelCallback, deleteCallback) {
                closeModal();
                createModal({edit: true, event: event});
                addListeners(okCallback, cancelCallback, deleteCallback);

                //Расположим окно под соответствующим событием
                var eventElement = rootElement.querySelector("[data-event-id='" + event.id + "']");
                rootElement.appendChild(modal);
                showModalFor(eventElement);

                //Отключить подсказки
                tooltips.disableTooltips();
            },
            close: function () {
                closeModal();
            }
        }
    }

    function createTooltips() {
        var currentTooltip = null; //Подсказка
        var currentTarget = null; //Запомним элемент, для которого выводится подсказка

        /**
         * Обработчик события MouseOver
         * @param {MouseEvent} event
         */
        function displayTooltips(event) {
            if (currentTooltip) //Выйти, если уже есть подсказка
                return;

            //Проверим, что зашли внутрь элемента с подсказкой
            var target = event.target;
            while (target !== rootElement) {
                if (target.dataset.eventId)
                    break;
                target = target.parentNode;
            }
            if (target === rootElement)
                return;

            //Переход на событие
            var eventId = target.dataset.eventId;
            var calendarEvent = CalendarEvent.fromId(eventId);

            currentTooltip = element("div", "calendar__tooltip");
            currentTooltip.appendChild(element("p", "calendar__tooltip_title", calendarEvent.title));
            if (calendarEvent.description)
                currentTooltip.appendChild(element("p", "calendar__tooltip_text", calendarEvent.description));

            //Подсчет координат
            var rect = target.getBoundingClientRect();
            currentTooltip.style.left = rect.right + 5 + "px";
            currentTooltip.style.top = rect.top + "px";

            //Вставить в DOM
            rootElement.appendChild(currentTooltip);

            //Отобразить слева, если не вмещается справа
            if (currentTooltip.offsetLeft + currentTooltip.offsetWidth > document.documentElement.clientWidth)
                currentTooltip.style.left = rect.left - currentTooltip.offsetWidth - 5 + "px";

            //Отобразить сверху, если не вмещается снизу
            if (currentTooltip.offsetTop + currentTooltip.offsetHeight > document.documentElement.clientHeight)
                currentTooltip.style.top = rect.bottom - currentTooltip.offsetHeight + "px";

            //Запомнить элемент
            currentTarget = target;
        }

        /**
         * Обработчик события MouseOut
         * @param {MouseEvent} event
         */
        function hideTooltips(event) {
            if (!currentTooltip) //Выйти, если подсказок нет
                return;

            //Проверим, вышли ли с элемента с подсказкой
            var target = event.relatedTarget;
            while (target && target !== rootElement) {
                if (target === currentTarget)
                    return;
                target = target.parentNode;
            }

            clearTooltip();
        }

        /**
         * Удаляет подсказку с экрана
         */
        function clearTooltip() {
            if (currentTooltip) {
                currentTooltip.parentNode.removeChild(currentTooltip);
                currentTooltip = null;
                currentTarget = null;
            }
        }

        return {
            enableTooltips: function () {
                rootElement.onmouseover = displayTooltips;
                rootElement.onmouseout = hideTooltips;
            },
            disableTooltips: function () {
                rootElement.onmouseover = undefined;
                rootElement.onmouseout = undefined;
                clearTooltip();
            }
        }
    }

    //API
    this.getElement = getElement;
    this.nextMonth = nextMonth;
    this.prevMonth = prevMonth;
    this.currentMonth = currentMonth;
    this.addEvent = addEvent;
    this.notifyEvents = notifyEvents;
}