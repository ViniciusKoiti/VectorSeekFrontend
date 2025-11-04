# 🔄 Script Rápido de Migração

## Comandos para Executar

### 1. Criar Nova Aplicação

```powershell
# No PowerShell
cd ..
npx @angular/cli@latest new vectorseek-platform --routing --style=css --skip-git
cd vectorseek-platform
```

### 2. Copiar Arquivos (Windows PowerShell)

```powershell
# Copiar componentes de autenticação
Copy-Item -Recurse ..\vectorseek-frontend\apps\platform\src\app\auth .\src\app\

# Copiar layouts
Copy-Item -Recurse ..\vectorseek-frontend\apps\platform\src\app\layouts .\src\app\

# Copiar rotas
Copy-Item ..\vectorseek-frontend\apps\platform\src\app\app.routes.ts .\src\app\

# Copiar assets
Copy-Item -Recurse ..\vectorseek-frontend\apps\platform\src\assets .\src\

# Copiar environments (se existirem)
if (Test-Path ..\vectorseek-frontend\apps\platform\src\environments) {
    Copy-Item -Recurse ..\vectorseek-frontend\apps\platform\src\environments .\src\
}
```

### 3. Instalar Dependências Adicionais

```powershell
npm install @ngx-translate/core @ngx-translate/http-loader
npm install zod @colsen1996/ng-zod-form
```

### 4. Atualizar Arquivos Principais

#### main.ts
Substitua o conteúdo por:
```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      appRoutes,
      withComponentInputBinding()
    )
  ]
}).catch(err => console.error(err));
```

#### app.component.ts
Substitua por:
```typescript
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

### 5. Testar

```powershell
ng serve
```

## ✅ Checklist

- [ ] Nova aplicação criada
- [ ] Arquivos copiados
- [ ] Dependências instaladas
- [ ] main.ts atualizado
- [ ] app.component.ts atualizado
- [ ] Servidor iniciado com sucesso
- [ ] Rotas funcionando
- [ ] Componentes carregando

## 🎉 Resultado

Depois desses passos, você terá uma aplicação Angular totalmente funcional com:
- ✅ Roteamento funcionando
- ✅ Componentes standalone
- ✅ Lazy loading
- ✅ Hot reload
- ✅ Build de produção
- ✅ Tudo configurado e funcionando

