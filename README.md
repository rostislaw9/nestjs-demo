# Rocket Space — Backend (NestJS)

REST API и WebSocket-сервер, демонстрирующий архитектурные практики на стеке NestJS + PostgreSQL + Redis.

## Технологии

| Слой | Технологии |
| --- | --- |
| Фреймворк | NestJS 11, Express |
| База данных | PostgreSQL + TypeORM 0.3 |
| Кеширование | Redis (ioredis) |
| Аутентификация | Firebase Admin SDK (JWT) |
| Real-time | WebSockets (Socket.IO, `@nestjs/websockets`) |
| Документация | Swagger / OpenAPI (`@nestjs/swagger`) |
| Валидация | class-validator + class-transformer |
| Rate limiting | `@nestjs/throttler` (30 req / 60 s) |
| Тестирование | Jest + Supertest |
| Язык | TypeScript 5 |

## Архитектура и паттерны

### Модульная структура

Приложение разделено на независимые feature-модули по принципу Single Responsibility:

- **UsersModule** — управление профилями пользователей
- **WorkItemsModule** — задачи рабочего пространства (Kanban/таблица)
- **CommentsModule** — комментарии к задачам
- **ActivitiesModule** — журнал действий пользователя
- **OrganizationsModule** — управление организациями и участниками
- **ChatModule** — прямые сообщения между пользователями (DM)
- **CacheModule** — Redis-обёртка с автоматическим отключением в dev-режиме

### Guards и авторизация

- **`AuthGuard`** — верифицирует Firebase JWT-токен на каждом защищённом маршруте; в dev-режиме пропускается для удобства разработки
- **`RolesGuard`** — декоратор `@Roles()` + ролевая проверка
- **`SelfOrRolesGuard`** — комбинированная проверка: доступ разрешён либо владельцу ресурса, либо пользователю с нужной ролью

### Глобальные провайдеры (APP_\*)

Зарегистрированы через DI-токены `APP_GUARD`, `APP_INTERCEPTOR`, `APP_FILTER`, `APP_PIPE`:

- **`ThrottlerGuard`** — rate limiting на уровне всего приложения
- **`RequestTimingInterceptor`** — логирует старт/конец каждого запроса с временем выполнения, размером ответа и `userId` (RxJS `tap` + `map`); оборачивает ответ в конверт `{ data, meta: { requestId, timestamp } }`
- **`AllExceptionsFilter`** — перехватывает все исключения, формирует единый JSON-формат ошибки с `requestId`, `timestamp` и цветным логом по статусу
- **`CompositePipe`** — цепочка из `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) и кастомного `TrimStringsPipe`

### Middleware

- **`RequestContextMiddleware`** — генерирует `x-request-id` (UUID v4) для каждого запроса, передаёт его через `req.requestId` и устанавливает заголовок ответа `x-request-id`; логирует завершение запроса с кодом и временем

### Кеширование с Redis

`UsersService` кеширует записи по ключам `user:{id}` и `user:email:{email}`. При обновлении или удалении пользователя оба ключа инвалидируются. В dev-режиме кеш автоматически отключён; в тестах используется `redis-mock`.

### WebSocket Gateways

**`WorkItemsGateway`** (`/` namespace) — рабочее пространство. При подключении клиент регистрируется в комнате `user:{userId}`. События:

`workItem:created` · `workItem:updated` · `workItem:deleted` · `workItem:reordered` · `comment:created` · `comment:updated` · `comment:deleted`

**`ChatGateway`** (`/chat` namespace) — прямые сообщения. Клиент регистрируется в комнате `chat:{userId}`. HTTP-эндпоинты отправки/редактирования/удаления сообщений эмитят WS-события обоим участникам через `ChatGateway`. События:

`dm:message` · `dm:edited` · `dm:deleted` · `dm:read` · `dm:conversation-deleted`

### Миграции базы данных

Schema-first подход: `synchronize: false`, все изменения схемы через явные TypeORM-миграции. 10 миграций охватывают: начальную схему, поля профиля, аватар (`text`-колонка), work items, позиционную сортировку (`position INT`), активности, комментарии, организации, таблицу `direct_messages`, поле `edited` для сообщений.

### Swagger / OpenAPI

Настроен только для non-production окружения (`/api/docs`). Операции отсортированы по HTTP-методу, теги — по алфавиту. Поддерживает Bearer-аутентификацию для ручного тестирования.

### Сериализация

`class-transformer` с `plainToInstance` сериализует entity в DTO перед отдачей клиенту, исключая чувствительные поля через `@Exclude()`.

### Docker

`docker-compose.yml` поднимает PostgreSQL и Redis. Firebase Auth эмулируется локально через Firebase Emulator Suite.

## Запуск

```bash
# Зависимости
yarn install

# Инфраструктура (PostgreSQL + Redis)
docker-compose up -d

# Firebase Auth Emulator
yarn start:emulator

# Dev-сервер с hot reload
yarn start:dev

# Применить миграции
yarn migration:run

# Тесты
yarn test
yarn test:cov
```

## Структура

```text
src/
├── common/
│   ├── decorators/     # @Roles()
│   ├── filters/        # AllExceptionsFilter
│   ├── guards/         # AuthGuard, RolesGuard, SelfOrRolesGuard
│   ├── interceptors/   # RequestTimingInterceptor
│   ├── middleware/     # RequestContextMiddleware
│   └── pipes/          # TrimStringsPipe, CompositePipe
├── config/             # ConfigModule, SwaggerModule
├── migrations/         # TypeORM-миграции (schema-first)
└── modules/
    ├── activities/
    ├── auth/           # Firebase JWT-верификация
    ├── cache/          # Redis (ioredis)
    ├── chat/           # DM: REST + ChatGateway (/chat namespace)
    ├── comments/
    ├── organizations/
    ├── users/
    └── work-items/     # REST + WorkItemsGateway
