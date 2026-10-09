# skeleton — frontend

Base genérica de um frontend Angular v22 standalone (signals, novo control-flow `@if`/`@for`, zoneless — sem `zone.js`), extraída de um projeto real: autenticação JWT já ligada ao backend deste skeleton, os padrões `base-service`/`base-component`/`base-list-component`, um datepicker Material padronizado, i18n com Transloco, toasts, tema escuro pronto. Sem nenhuma feature de negócio — comece um projeto novo daqui.

## O que já vem pronto

- **`core/auth/`** — `AuthService`/`AuthTokenService` (JWT em `localStorage`, aceita e-mail/username/matrícula — bate com o backend deste skeleton), `authInterceptor` (injeta o Bearer token), `authGuard` (protege as rotas dentro do `Shell`).
- **`core/base/`** — `BaseModel`, `BaseService<T, F>` (CRUD genérico: `getList`/`getById`/`create`/`update`/`delete`), `BaseFilter`, `BasePaginatedResponse`, `BaseComponent` (loading/toast/navegação/logout prontos), `BaseListComponent<T, F>` (tabela + diálogo de criar/editar compartilhado, com hook `listFilters()` pra mandar query params extras, ex.: `expand` do drf-flex-fields).
- **`core/layout/shell/`** — sidenav com troca de idioma EN/PT ao vivo, pronta pra receber os itens de menu reais (`navItems` em `shell.ts` está vazio de propósito).
- **`shared/components/date-field/`** — datepicker Material (`ControlValueAccessor`, plugável com `formControlName` em qualquer form reativo), com um `LocaleDateAdapter` próprio corrigindo um bug real do `NativeDateAdapter` (ele delega pro `Date.parse()` do JS, que é cego a locale e falha silenciosamente em datas `DD/MM/YYYY` com dia > 12 — esse adapter faz o parse manualmente respeitando o idioma ativo).
- **`shared/toast/`**, **`shared/translate/`** (Transloco, JSON bundlado — sem round-trip HTTP), **`shared/validators/date-range.validator.ts`**, **`shared/utils/date.util.ts`** (conversão segura ISO string ↔ Date, sem os bugs de timezone do `new Date('yyyy-MM-dd')`).
- **`features/auth/pages/login/`** — tela de login pronta, já ligada ao `AuthService`.
- Tema Material escuro (`styles.scss`) mapeado nas variáveis CSS do projeto (`--accent`, `--bg-*` etc.) em vez da paleta genérica do Material — troque a cor em um lugar só.
- Docker (`Dockerfile` multi-stage + `nginx.conf` já proxyando `/api/`/`/media/` pro backend).

## Rodando localmente

### Pré-requisitos

Node via nvm (versão fixada em `.nvmrc`) — ou instale direto do [site oficial](https://nodejs.org/), não é obrigatório usar nvm.

```bash
nvm install
nvm use
```

### Instalar e rodar

```bash
npm install
npm start
```

Abre em `http://localhost:4202/` (porta fixada em `angular.json` pra não colidir com outros apps Angular na 4200). O dev server faz proxy de `/api/`, `/media/` e `/ws/` pro backend em `http://127.0.0.1:8002` (`proxy.conf.json`) — o app chama `/api/` relativo, igual em produção atrás do Nginx, então não precisa de CORS em dev. Mudou a porta do backend? Ajuste o `target` em `proxy.conf.json` e reinicie o `npm start`.

## Adicionando sua primeira feature de verdade

1. `src/app/shared/models/meu-modelo.model.ts` estendendo `BaseModel`.
2. `src/app/features/meu-recurso/services/meu-recurso-api.service.ts` estendendo `BaseService<MeuModelo>`.
3. Página de listagem estendendo `BaseListComponent<MeuModelo>` — ganha tabela + diálogo compartilhado de graça.
4. Adicione a rota em `app.routes.ts` (dentro dos `children` do `Shell`) e o item de menu em `shell.ts` (`navItems`).
5. Precisa de data? Use `<app-date-field formControlName="..." [label]="'...' | transloco">` — já é o padrão pronto, não crie outro input de data.
