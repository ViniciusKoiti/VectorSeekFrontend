import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { ForgotPasswordComponent } from '@vectorseek/platform/auth/forgot-password.component';

type AuthStoryState = 'success' | 'error' | 'loading';

type ForgotPasswordStoryArgs = {
  state: AuthStoryState;
  message: string;
};

const QA_INSTRUCTIONS = `### QA rápido\n1. Abrir a rota \`/auth/forgot-password\` e informar e-mail cadastrado.\n2. Confirmar visualmente a mensagem de sucesso e o aviso de prazo de expiração.\n3. Testar retorno para login via link do rodapé.\n\n**Entradas válidas**\n- E-mail verificado na base VectorSeek.\n\n**Entradas inválidas**\n- E-mail inexistente ou com domínio bloqueado.\n- Campo vazio deve bloquear envio.\n\n**Referências**\n- ADR-001 — Fundação de Autenticação e App Shell (frontend/docs/adr/ADR-001-epico1-autenticacao-shell.md).`;

const meta: Meta<ForgotPasswordStoryArgs> = {
  title: 'Auth/Forgot Password Page',
  component: ForgotPasswordComponent,
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
      description: 'Estado do fluxo de recuperação exibido ao usuário.',
    },
    message: {
      control: 'text',
      description: 'Mensagem auxiliar exibida no banner de feedback.',
    },
  },
  render: (args) => ({
    props: args,
    moduleMetadata: {
      imports: [CommonModule, ForgotPasswordComponent],
    },
    template: `
      <div class="storybook-auth-wrapper">
        <vectorseek-forgot-password-page />
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
          <span class="sr-only">Gerando instruções de recuperação...</span>
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
    message: 'E-mail de recuperação enviado com sucesso. Link expira em 30 minutos.',
  },
} satisfies Meta<ForgotPasswordStoryArgs>;

type Story = StoryObj<ForgotPasswordStoryArgs>;

export const Success: Story = {
  name: 'E-mail enviado',
  parameters: {
    docs: {
      description: {
        story: 'Confirma que usuários recebem instruções quando informam e-mail válido.',
      },
    },
  },
};

export const Error: Story = {
  name: 'E-mail não encontrado',
  args: {
    state: 'error',
    message: 'Não encontramos uma conta com este e-mail. Tente novamente ou crie uma nova conta.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Simula resposta 404/422 quando o e-mail informado não corresponde a uma conta registrada.',
      },
    },
  },
};

export const Loading: Story = {
  name: 'Processando recuperação',
  args: {
    state: 'loading',
    message: 'Gerando token seguro e preparando instruções de redefinição...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Apresenta estado de carregamento enquanto o backend envia e-mail de recuperação.',
      },
    },
  },
};

export default meta;
