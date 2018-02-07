# Calendar

Calendar widget with day events. Uses browser Notification API, can notify about events beforehand.

Calendar appearance was taken from
[google calendar](https://calendar.google.com)
and
[fullcalendar](https://fullcalendar.io/).
However, code part is independent.

## Structure
Consists of header and calendar net:
![Imgur](https://i.imgur.com/6ayuTUO.png)
Calendar net is always 6 rows in height, days of _previous_ and _next month_ are marked with _grey color_,
_day offs_ are marked _red_, _current day_ is marked _orange_.

Calendar is adapted only for Russian users, so it uses Russian language and week starts with monday.

## Events
![Imgur](https://i.imgur.com/SsN7wLF.png)
If some day contains events, calendar shows them in corresponding day in time sorted order.
Every event includes:
- __title__ (obligatory)
- __deskription__
- __date__ (obligatory)
- __time__

If event does not have __time__ options, it is considered as _whole day event_ and shown in
date cell first.

To see event whole title and description hover cursor over event. 
![Imgur](https://i.imgur.com/ARGwtxA.png)

## New event
When hover over calendar cell in up left corner sign "__+__" appears. Clicking it will lead to
event creation window.

![Imgur](https://i.imgur.com/lhklF8i.png)

Events are saved to browser __LocalStorage__, calendar does not use database. Clearing browser cache will
erase all events.

If you allow browser notifications you can receive memos about upcoming events. 

For choosing date and time widget uses 3d party _jQuery plug-in_.
![Imgur](https://i.imgur.com/Y776S2v.png)

## Edit event

Clicking event leads to editing event window. From this window it can be
also be deleted.

![Imgur](https://i.imgur.com/ND0Xmf8.png)

## Event drag'n'drop

To change event date you can drag it into another cell.

![Imgur](https://i.imgur.com/VGsxPfD.png) 