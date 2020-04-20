# Rocketman
To-do сервис </br>
Более подробная информация об API ([здесь](docs/API%20documentation.md)) и системе (здесь) в целом в папке docs.

## Состав разработанной системы
+ task service - сервис, хранящий информацию обо всех заданиях
+ state service - сервис, хранящий историю изменения состояний каждого задания
+ router - сервис, распределяющий пользователей между экземплярами вышеописанных сервисов.

## Необходимое ПО
+ node.js
+ redis-server
+ mysql server
+ браузер не старше IE8

## Инструкция по запуску
1. Настроить конфигурационные файлы, внести в них адреса всех копий task service и state service
2. Запустить базы mysql (скрипты создания баз [taskService](docs/DB%20scripts/task.sql) и [stateService](docs/DB%20scripts/task.sql))
3. Запустить базу redis (команда redis-server)
4. Запустить router (в командной строке из директории router выполнить node index.js)
5. Запустить все копии task service и state service той же командой, находясь в соответствующих директориях.

## Инструкция по настройке конфигурационных файлов.
1. Router
   В config/hosts.json записываются адреса сервисов задач и статусов, каждый в свой массив.
   В config/config.json:
   + countOfThreads - количество потоков, которое будет запущено на данной машине, на одном порте
   + host и port - адрес, на котором запускается сервис, и порт, который сервис будет прослушивать.
   + пути к файлам, передаваемым на клиент.
2. TaskService
   В config.json первые три пункта совпалают по смыслу с router.
   + адрес и порт, который прослушивает хранилище redis
   + параметры доступа к БД
   + строка для шифрования сессий, естественно в реальных условиях должна генерироваться случайно 
   + адрес router'а.
3. StateService
   В config.json параметры совпадают по значению с task service
