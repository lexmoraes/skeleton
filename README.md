# skeleton

Base genérica full-stack (Django + DRF / Angular v22) pra começar um projeto novo, extraída de um projeto real em produção. **Sem nenhuma feature de negócio** — o objetivo é editar isso pra virar o seu projeto, não usar como está.

O que já vem resolvido:

- **Autenticação JWT** com login por e-mail, username ou matrícula, rotação + blacklist de refresh token.
- **Backend organizado por responsabilidade** — cada app Django com `models`/`managers`/`queries`/`serializers`/`filters`/`viewsets`/`urls`/`actions`/`receivers`/`tasks`/`consumers`/`helpers` (tabela completa em [`backend/README.md`](backend/README.md)).
- **WebSocket** (Django Channels + Daphne) com autenticação pelo mesmo JWT da API.
- **Mensageria** com Celery (worker + beat) sobre Redis.
- **Storage de objetos** no SeaweedFS via API S3 (opcional).
- **Frontend reutilizável**: `base-service`/`base-component`/`base-list-component`, datepicker Material corrigido pra locale, toasts, tema escuro.
- **i18n** dos dois lados (Django `gettext` + Transloco), inglês e português.
- **Docker** pra desenvolvimento (só os serviços de apoio) e pra produção (tudo atrás de um Nginx).

## Estrutura

```
skeleton/
├── backend/                 Django + DRF + Channels + Celery — veja backend/README.md
│   ├── compose.yml          serviços de apoio pra DEV (Postgres + SeaweedFS + Redis)
│   ├── skeleton.config.example   config local (copie pra skeleton.config)
│   └── .run/                configurações de execução do PyCharm
├── frontend/                Angular v22 — veja frontend/README.md
│   ├── proxy.conf.json      proxy do `ng serve` (/api, /media, /ws → backend)
│   └── nginx.conf           Nginx de produção (estáticos + proxy pro backend)
├── compose.yml              stack completa de PRODUÇÃO
└── .env.example             variáveis do compose.yml de produção
```

## Arquitetura

```
                       ┌──────────────── produção: só o Nginx é exposto ────────────────┐
navegador ──► Nginx ───┤  /            → arquivos do Angular (build)                    │
 (frontend)            │  /api/ /media/ → Daphne (Django, HTTP)                          │
                       │  /ws/          → Daphne (Django Channels, WebSocket)            │
                       └────────────────────────────────────────────────────────────────┘
Daphne ──► Postgres          (dados)
       ──► SeaweedFS :8333   (arquivos, API S3)
       ──► Redis  db 0       (fila do Celery)  ──► celery_worker  (filas default, periodic)
       ──► Redis  db 1       (channel layer)        celery_beat   (agenda → fila periodic)
```

Em desenvolvimento é igual, trocando o Nginx pelo proxy do `ng serve` e rodando Django/Celery direto no host (venv/PyCharm).

## Desenvolvimento

Backend e frontend rodam separados; cada README tem o passo a passo completo (Linux/Windows). O resumo:

```bash
# 1. serviços de apoio (de dentro de backend/)
cd backend
docker compose up -d --wait
cp skeleton.config.example skeleton.config

# 2. backend (venv com Python 3.12)
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8002                      # HTTP + WebSocket (Daphne)
celery -A config worker -Q default,periodic -l info           # outro terminal
celery -A config beat -l info                                 # outro terminal, se usar tarefas agendadas

# 3. frontend (de dentro de frontend/, Node da versão em .nvmrc)
npm install
npm start                                                     # http://localhost:4202
```

**IDEs:** abrindo `backend/` no PyCharm (interpretador `backend/.venv`), as configurações de `backend/.run/` aparecem prontas — **Backend completo** sobe Docker, migra e roda servidor + worker + beat de uma vez. No WebStorm, o `npm start` de `frontend/` já usa a porta e o proxy certos.

### Portas de desenvolvimento

Escolhidas pra não colidir com outros projetos na mesma máquina (Django em 8000/8001, Angular em 4200, Postgres em 5432, Redis em 6379). Os serviços Docker escutam só em `127.0.0.1` — as senhas de dev nunca ficam expostas na rede.

| Serviço | Endereço | Onde mudar |
|---|---|---|
| Frontend (`ng serve`) | `http://localhost:4202` | `frontend/angular.json` (`serve.options.port`) |
| Django/Daphne | `http://127.0.0.1:8002` | comando do `runserver` / `backend/.run/` e `target` em `frontend/proxy.conf.json` |
| Postgres | `127.0.0.1:5436` | `backend/compose.yml` + `backend/skeleton.config` |
| Redis | `127.0.0.1:6380` | idem |
| SeaweedFS (S3) | `http://127.0.0.1:8333` | idem |

O `backend/compose.yml` usa o nome de projeto fixo `skeleton-dev` (volumes `skeleton-dev_*`), então não se mistura com outros projetos que também tenham uma pasta `backend/`.

### Testes

```bash
(cd backend && python manage.py test)      # precisa só do Postgres de dev de pé
(cd frontend && npm test)
```

## Produção (Docker)

Da raiz deste repositório:

```bash
cp .env.example .env
# edite o .env: DB_PASSWORD, DJANGO_SECRET_KEY, DJANGO_ALLOWED_HOSTS, SEAWEEDFS_SECRET_KEY
docker compose up -d --build
docker compose exec backend python manage.py createsuperuser
```

Acesse em `http://<host>:${FRONTEND_PORT:-80}/`. O que sobe:

| Serviço | Papel | Exposto? |
|---|---|---|
| `frontend` | Nginx: build do Angular + proxy de `/api/`, `/media/`, `/ws/` | **sim**, porta `FRONTEND_PORT` |
| `backend` | Daphne (Django HTTP + WebSocket); aplica as migrações ao iniciar | não |
| `celery_worker` | executa as tasks (filas `default` e `periodic`) | não |
| `celery_beat` | dispara as tarefas agendadas (`backend/config/celery.py`) | não |
| `db` | Postgres 17 | não |
| `redis` | broker do Celery + channel layer do Channels | não |
| `seaweedfs` | storage de objetos (API S3) | não |

`backend`, `celery_worker` e `celery_beat` usam a mesma imagem (`skeleton-backend`, construída uma vez). Worker e beat só sobem depois que o `backend` está saudável — ou seja, depois das migrações. Cada serviço tem healthcheck (exceto o beat, que não tem o que sondar); os bancos e o storage ficam em volumes nomeados (`postgres_data`, `seaweedfs_data`, `redis_data`, `media_data`).

Comandos úteis:

```bash
docker compose ps                         # estado + saúde de cada serviço
docker compose logs -f backend celery_worker
docker compose up -d --build              # atualizar depois de um git pull
```

Pra depurar algo que não passa pelo Nginx (ex.: o `/admin/` do Django, que não é repassado), descomente o bloco `ports` do serviço em `compose.yml` — eles ficam presos a `127.0.0.1` de propósito.

## O que fazer a partir daqui

1. **Renomeie o projeto** — troque "skeleton" pelo nome real em:
   - backend: `config/settings.py` (comentários e o nome do arquivo `skeleton.config`, também em `.gitignore`/`.dockerignore`), `config/{asgi,wsgi,urls}.py` (docstrings), `skeleton.config.example` (bucket), `compose.yml` (`name` e `container_name`), `locale/pt_BR/LC_MESSAGES/django.po` (cabeçalho);
   - frontend: `package.json`/`angular.json` (`skeleton-web`), `Dockerfile` (caminho `dist/skeleton-web`), `src/index.html`, `src/app/core/layout/shell/shell.html`, `src/app/features/auth/pages/login/login.html`, e as chaves do `localStorage` em `src/app/core/auth/auth-token.service.ts` e `src/app/shared/translate/lang-storage.ts`;
   - raiz: `compose.yml` (`container_name`, imagem `skeleton-backend`) e `.env.example` (`DB_NAME`, `DB_USER`, `SEAWEEDFS_*`).
2. Crie seu primeiro app Django em `backend/` e sua primeira feature Angular em `frontend/` (passo a passo nos READMEs de cada um; `backend/account/` serve de exemplo de cada módulo).
3. Ajuste a cor de destaque do tema em `frontend/src/styles.scss` (`--accent` e a paleta do `mat.theme()`) se quiser fugir do vermelho padrão.

## Limitações conhecidas

- **URLs pré-assinadas do SeaweedFS** apontam pro endereço interno (`seaweedfs:8333` em produção); pro navegador baixar direto, publique o S3 e configure um endpoint público.
- **`/media/` em produção** é repassado ao Django, que só serve arquivos com `DEBUG=True` — pra uploads, prefira o SeaweedFS (`core/helpers.py`).
- **O login não tem throttling** e o JWT fica no `localStorage`; avalie os dois antes de expor o sistema publicamente.
- **O `/admin/` do Django não passa pelo Nginx** (veja acima como acessar).
