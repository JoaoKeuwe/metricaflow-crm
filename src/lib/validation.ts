import { z } from 'zod';

export const leadSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().trim().email("Email inválido").max(255, "Email deve ter no máximo 255 caracteres").optional().or(z.literal("")),
  phone: z.string().trim().regex(/^\d{10,11}$/, "Telefone deve ter 10-11 dígitos").optional().or(z.literal("")),
  company: z.string().trim().max(100, "Empresa deve ter no máximo 100 caracteres").optional().or(z.literal("")),
  source: z.string().trim().max(50, "Fonte deve ter no máximo 50 caracteres").optional().or(z.literal("")),
  estimated_value: z.string().trim().optional().or(z.literal("")),
});

export const authSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255, "Email deve ter no máximo 255 caracteres"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres").max(100, "Senha deve ter no máximo 100 caracteres"),
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  company_name: z.string().trim().min(1, "Nome da empresa é obrigatório").max(100, "Nome da empresa deve ter no máximo 100 caracteres"),
});

export const inviteSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255, "Email deve ter no máximo 255 caracteres"),
  role: z.enum(["gestor", "vendedor"], {
    errorMap: () => ({ message: "Função deve ser 'gestor' ou 'vendedor'" })
  }),
});

export type LeadFormData = z.infer<typeof leadSchema>;
export type AuthFormData = z.infer<typeof authSchema>;
export type InviteFormData = z.infer<typeof inviteSchema>;
