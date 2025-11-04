# 🚀 Guia de Migração para Angular CLI

## Por que migrar?

Criar uma nova aplicação com Angular CLI é muito mais fácil porque:
- ✅ Já vem com tudo configurado (webpack, TypeScript, etc.)
- ✅ Comandos prontos (`ng serve`, `ng build`)
- ✅ Estrutura padrão e documentada
- ✅ Hot reload funcionando automaticamente
- ✅ Suporte completo a todos os recursos do Angular

## 📋 Passo a Passo

### 1. Criar Nova Aplicação Angular

```bash
# Navegar para o diretório pai
cd ..

# Criar nova aplicação Angular
npx @angular/cli@latest new vectorseek-platform --routing --style=css --skip-git

# Ou se preferir usar um nome diferente
npx @angular/cli@latest new vectorseek-new --routing --style=css --skip-git
```

**Opções:**
- `--routing`: Adiciona roteamento
- `--style=css`: Usa CSS (ou `scss`, `sass`, `less`)
- `--skip-git`: Não inicializa git (já que você já tem)

### 2. Copiar Estrutura de Código

Depois de criar a aplicação, copie os arquivos:

#### 2.1. Componentes e Rotas

```bash
# Copiar componentes de autenticação
cp -r vectorseek-frontend/apps/platform/src/app/auth vectorseek-platform/src/app/

# Copiar layouts
cp -r vectorseek-frontend/apps/platform/src/app/layouts vectorseek-platform/src/app/

# Copiar rotas
cp vectorseek-frontend/apps/platform/src/app/app.routes.ts vectorseek-platform/src/app/
```

#### 2.2. Assets e Configurações

```bash
# Copiar assets (i18n, etc)
cp -r vectorseek-frontend/apps/platform/src/assets vectorseek-platform/src/

# Copiar environments se existirem
cp -r vectorseek-frontend/apps/platform/src/environments vectorseek-platform/src/
```

#### 2.3. Bibliotecas (se necessário)

```bash
# Copiar libs se você quiser manter a estrutura de monorepo
# Ou simplesmente copiar o código para a nova aplicação
cp -r vectorseek-frontend/libs vectorseek-platform/
```

### 3. Atualizar main.ts

Substitua o `main.ts` da nova aplicação pelo seu:

```typescript
// vectorseek-platform/src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTranslate } from '@ngx-translate/core';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      appRoutes,
      withComponentInputBinding()
    ),
    provideTranslate({ defaultLanguage: 'pt-BR' })
  ]
}).catch(err => console.error(err));
```

### 4. Instalar Dependências

```bash
cd vectorseek-platform

# Instalar dependências do Angular (já vem instalado)
# Instalar dependências adicionais que você usa
npm install @ngx-translate/core @ngx-translate/http-loader
npm install zod @colsen1996/ng-zod-form
```

### 5. Atualizar app.component.ts

```typescript
// vectorseek-platform/src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class AppComponent {}
```

### 6. Testar

```bash
# Iniciar servidor de desenvolvimento
ng serve

# Ou
npm start
```

Acesse: http://localhost:4200

## 📁 Estrutura Final

```
vectorseek-platform/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login-page.component.ts
│   │   │   ├── register-page.component.ts
│   │   │   ├── forgot-password.component.ts
│   │   │   └── auth.routes.ts
│   │   ├── layouts/
│   │   │   ├── public-layout.component.ts
│   │   │   └── auth-layout.component.ts
│   │   ├── app.component.ts
│   │   └── app.routes.ts
│   ├── assets/
│   │   └── i18n/
│   └── main.ts
├── angular.json
├── package.json
└── tsconfig.json
```

## ✅ Vantagens

1. **Zero configuração**: Tudo já funciona
2. **Comandos padrão**: `ng serve`, `ng build`, `ng test`
3. **Hot reload**: Funciona automaticamente
4. **Documentação**: Toda a comunidade usa esta estrutura
5. **Manutenção**: Fácil de atualizar e manter

## 🎯 Próximos Passos

1. Criar a nova aplicação
2. Copiar os arquivos
3. Instalar dependências
4. Testar
5. Depois que tudo funcionar, pode deletar a pasta antiga

## 💡 Dica

Você pode manter ambas as pastas temporariamente para comparar e garantir que tudo está funcionando antes de deletar a antiga.

