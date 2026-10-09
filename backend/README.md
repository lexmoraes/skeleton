# skeleton — backend

Base genérica de um backend Django + DRF, extraída de um projeto real: autenticação JWT, WebSocket (Channels), mensageria assíncrona (Celery + Redis), storage de objetos (SeaweedFS via S3), e uma organização de módulos por app com responsabilidades fixas (veja abaixo). Sem nenhuma feature de negócio — o ponto é começar um projeto novo daqui, não editar este.

## O que já vem pronto

- **`account/`** — modelo de usuário customizado (`AccountUser`) com login por **e-mail, username ou matrícula** (`registration_number`), JWT (`djangorestframework-simplejwt`) com rotação + blacklist de refresh token. Endpoints: `/api/account/login/`, `/login/refresh/`, `/users/` (só admin, filtrável) e `/users/me/`. Quando o perfil muda, o usuário recebe um push `account.updated` no WebSocket (receiver → task Celery → action → helper do Channels).
- **`core/`** — `BaseModel` (id/created_at/updated_at/is_active, abstrato, com `.active()`/`.inactive()` no manager — todo modelo novo deve estender essa classe), o consumer WebSocket de notificações, e os helpers compartilhados: envio pra grupos do Channels, storage SeaweedFS (namespaced por `owner`/`category`/`filename`, opcional) e `RequiredFieldsError`.
- **`config/`** — `settings.py`, `asgi.py` (HTTP + WebSocket via `ProtocolTypeRouter`), `routing.py` (rotas `ws/`), `celery.py` (filas `default`/`periodic` e o agendamento do beat).
- **i18n**: todo o código-fonte em inglês com `gettext_lazy`, catálogo `pt_BR` de exemplo já compilado (`locale/pt_BR/LC_MESSAGES/`).
- **django-filter** (+ `OrderingFilter`) e **drf-flex-fields** instalados — declare `filterset_class`/`ordering_fields`/`expandable_fields` nos seus viewsets/serializers.
- Docker (`Dockerfile`, `entrypoint.sh`, `compose.yml` com Postgres + SeaweedFS + Redis locais) e config via arquivo `.ini` (`skeleton.config`) com fallback pra variável de ambiente (`env_or_config` em `config/settings.py`).

## Organização de um app

Cada app tem os mesmos módulos, cada um com uma responsabilidade só. Crie só os que o app precisar.

| Módulo | Responsabilidade |
|---|---|
| `models.py` | Modelos (estendendo `core.models.BaseModel`). |
| `managers.py` | `QuerySet` + `Manager` customizados: consultas reutilizáveis encadeáveis (ex.: `AccountUser.objects.by_identifier(...)`). |
| `queries.py` | Funções de consulta avulsas usadas por tasks/actions (ex.: `get_user_by_id`). |
| `serializers.py` | Serializers DRF: validação de entrada e formato de saída. |
| `filters.py` | `FilterSet`s do django-filter usados pelos viewsets. |
| `viewsets.py` | Endpoints REST (`ModelViewSet` & cia., `@action` pra rotas extras). Só orquestram: delegam regra pra `actions` e trabalho pesado pra `tasks`. |
| `urls.py` | `DefaultRouter` registrando os viewsets. |
| `actions.py` | Regras de negócio: uma classe `{Model}Actions` por modelo, com `@staticmethod`s. Chamadas por viewsets, receivers e tasks. |
| `receivers.py` | Handlers de signals (`post_save` etc.), importados em `apps.py` → `ready()`. Disparam actions ou tasks. |
| `tasks.py` | Tasks Celery (`@shared_task(queue=...)`): finas, delegam pra `actions`. |
| `consumers.py` | Consumers WebSocket do Channels (rotas em `config/routing.py`). |
| `helpers.py` | Utilitários técnicos sem regra de negócio (em `core/`: grupos do Channels, storage, exceções DRF). |
| `admin.py` / `views.py` | Admin do Django / views Django comuns (não-API). |

Fluxo típico de um efeito colateral assíncrono: `receivers.py` → `tasks.py` (`.delay()` dentro de `transaction.on_commit`) → `actions.py` → `core.helpers.send_user_message(...)` → `core/consumers.py` entrega no socket.

## WebSocket

Conecte em `ws://<host>/ws/notifications/?token=<access token JWT>` (o mesmo `access` do login; navegadores não deixam mandar header no handshake). Sem token válido a conexão é recusada. Cada socket entra no grupo do seu usuário (`user_<id>`) e no grupo `broadcast`; de qualquer código síncrono:

```python
from core import helpers
helpers.send_user_message(user.id, {'event': 'algo.mudou', ...})
helpers.send_broadcast_message({'event': 'aviso.geral', ...})
```

## Erros estruturados

`core.helpers.RequiredFieldsError` é uma `APIException` (400) com a mensagem traduzida por campo. Nas views, `raise RequiredFieldsError(['name'])` em vez de montar um `Response(...)` na mão — o DRF converte a exceção na resposta HTTP automaticamente. Mensagens de validação ficam inline com `gettext_lazy` no serializer que as usa.

## Rodando localmente

### Pré-requisitos

Python 3.12, Docker + Docker Compose.

### Linux / macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements-dev.txt
```

### Windows (PowerShell)

```powershell
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements-dev.txt
```

### Subir Postgres + SeaweedFS + Redis e configurar

```bash
docker compose up -d --wait
cp skeleton.config.example skeleton.config
```

Os valores do `skeleton.config.example` já batem com o `compose.yml`, não precisa editar nada pra rodar localmente. O `--wait` só retorna quando os três serviços passam no healthcheck. O compose usa o nome de projeto fixo `skeleton-dev` e publica as portas só em `127.0.0.1` (as senhas de dev não ficam expostas na rede).

### Migrar e rodar

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8002
```

O `runserver` já é o do Daphne (ASGI), então serve HTTP e WebSocket juntos. API em `http://127.0.0.1:8002/api/`, WebSocket em `ws://127.0.0.1:8002/ws/notifications/`. Login aceita e-mail, username **ou** matrícula (o `/admin/` aceita só e-mail).

### Portas locais

Escolhidas pra não colidir com outros projetos comuns na mesma máquina (Django em 8000/8001, Redis em 6379, Postgres em 5432). Todas escutam só em `127.0.0.1`:

| Serviço | Porta no host |
|---|---|
| Django/Daphne (`runserver`) | 8002 |
| Postgres | 5436 |
| Redis | 6380 |
| SeaweedFS (S3) | 8333 |

Pra trocar alguma: ajuste o mapeamento em `compose.yml` e o valor correspondente no `skeleton.config` (e, no caso do Django, o `target` em `frontend/proxy.conf.json`).

### PyCharm

Abra a pasta `backend/` como projeto e use o `.venv` como interpretador. As configurações de execução já vêm em `.run/` e aparecem sozinhas no seletor do PyCharm:

- **Backend completo**: sobe Docker, aplica migrações, depois roda runserver + Celery worker + Celery beat juntos.
- **Django (Daphne) :8002**, **Celery worker**, **Celery beat**, **Django migrate**, **Django tests**, **Docker: serviços de dev**: cada passo isolado.

### Celery (outro terminal, com o venv ativo)

```bash
celery -A config worker -Q default,periodic -l info
celery -A config beat -l info    # só se precisar das tarefas agendadas (config/celery.py)
```

Sem o worker rodando, as tasks ficam enfileiradas no Redis e são processadas quando ele subir.

## Traduções

```bash
python manage.py makemessages -l pt_BR   # depois de mudar alguma string traduzível
python manage.py compilemessages         # precisa do gettext do sistema instalado
```

Sem `gettext` disponível (sem acesso root pra instalar), compile o `.po` já existente direto com `polib` (já no `requirements-dev.txt`):

```bash
python -c "import polib; polib.pofile('locale/pt_BR/LC_MESSAGES/django.po').save_as_mofile('locale/pt_BR/LC_MESSAGES/django.mo')"
```

## Testes

```bash
python manage.py test
```

Precisa do Postgres do `compose.yml` de pé; Redis e SeaweedFS não (os testes de WebSocket usam um channel layer em memória).

## Adicionando seu primeiro app de verdade

1. `python manage.py startapp meuapp`, adicione `'meuapp.apps.MeuappConfig'` em `INSTALLED_APPS` (`config/settings.py`).
2. `models.py` estendendo `core.models.BaseModel` (+ `managers.py` se tiver consultas reutilizáveis).
3. `serializers.py`, `filters.py`, `viewsets.py`, `urls.py` (router do DRF) — inclua em `config/urls.py`.
4. Regra de negócio em `actions.py`; efeitos colaterais de signals em `receivers.py` (importado no `ready()` do `apps.py`); trabalho assíncrono em `tasks.py`; WebSocket em `consumers.py` + rota em `config/routing.py`. Veja `account/` como exemplo de cada um.
