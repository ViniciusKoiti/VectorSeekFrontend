import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { LoginPageComponent } from '@vectorseek/platform/auth/login-page.component';

type AuthStoryState = 'success' | 'error' | 'loading';

type LoginStoryArgs = {
  state: AuthStoryState;
  message: string;
};

const QA_INSTRUCTIONS = `### QA rápido\n1. Abrir a rota \`/auth/login\` em ambiente de homologação.\n2. Informar credenciais válidas e observar o banner de sucesso.\n3. Validar a navegação para "Criar conta" e "Esqueci minha senha".\n\n**Entradas válidas**\n- E-mail corporativo com domínio autorizado.\n- Senha com pelo menos 12 caracteres e combinação alfanumérica.\n\n**Entradas inválidas**\n- E-mail sem símbolo \`@\`.\n- Senha com menos de 8 caracteres.\n\n**Referências**\n- ADR-001 — Fundação de Autenticação e App Shell (frontend/docs/adr/ADR-001-epico1-autenticacao-shell.md).`;

const meta: Meta<LoginStoryArgs> = {
  title: 'Auth/Login Page',
  component: LoginPageComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: QA_INSTRUCTIONS,
      },
    },
    layout: 'centered',
  },
  argTypes: {
    state: {
      options: ['success', 'error', 'loading'],
      control: { type: 'radio' },
      description: 'Estado do fluxo de autenticação exibido ao usuário.',
    },
    message: {
      control: 'text',
      description: 'Mensagem auxiliar exibida no banner de feedback.',
    },
  },
  render: (args) => ({
    props: args,
    moduleMetadata: {
      imports: [CommonModule, LoginPageComponent],
    },
    template: `
      <div class="storybook-auth-wrapper">
        <vectorseek-login-page />
        <aside
          class="storybook-auth-feedback"
          [class.storybook-auth-feedback--success]="state === 'success'"
          [class.storybook-auth-feedback--error]="state === 'error'"
          [class.storybook-auth-feedback--loading]="state === 'loading'"
        >
          <h3>Feedback</h3>
          <p>{{ message }}</p>
        </aside>
        <div *ngIf="state === 'loading'" class="storybook-auth-overlay">
          <span class="spinner" aria-hidden="true"></span>
          <span class="sr-only">Validando credenciais...</span>
        </div>
      </div>
    `,
    styles: [
      `
        .storybook-auth-wrapper {
          position: relative;
          display: grid;
          gap: 1.5rem;
          max-width: 768px;
        }
        .storybook-auth-feedback {
          border-radius: 0.75rem;
          padding: 1rem 1.25rem;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          display: grid;
          gap: 0.5rem;
        }
        .storybook-auth-feedback--success {
          border-color: #22c55e;
          background: #ecfdf5;
        }
        .storybook-auth-feedback--error {
          border-color: #ef4444;
          background: #fef2f2;
        }
        .storybook-auth-feedback--loading {
          border-color: #38bdf8;
          background: #e0f2fe;
        }
        .storybook-auth-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.35);
          display: grid;
          place-items: center;
          border-radius: 1rem;
        }
        .spinner {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 999px;
          border: 3px solid rgba(255, 255, 255, 0.4);
          border-top-color: #f8fafc;
          animation: spin 0.8s linear infinite;
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `,
    ],
  }),
  args: {
    state: 'success',
    message: 'Usuário autenticado com sucesso e redirecionado para o dashboard.',
  },
} satisfies Meta<LoginStoryArgs>;

type Story = StoryObj<LoginStoryArgs>;

export const Success: Story = {
  name: 'Fluxo bem-sucedido',
  parameters: {
    docs: {
      description: {
        story: 'Confirma que o formulário permite login com credenciais válidas e libera navegação para áreas autenticadas.',
      },
    },
  },
};

export const Error: Story = {
  name: 'Erro de credenciais',
  args: {
    state: 'error',
    message: 'Não foi possível validar as credenciais. Revise e tente novamente.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Simula falha de autenticação retornando erro 401/422 e orienta usuário a revisar os dados.',
      },
    },
  },
};

export const Loading: Story = {
  name: 'Fluxo em validação',
  args: {
    state: 'loading',
    message: 'Validando credenciais no provedor de identidade...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Mostra feedback visual de carregamento enquanto aguarda resposta da API de login.',
      },
    },
  },
};

export default meta;
