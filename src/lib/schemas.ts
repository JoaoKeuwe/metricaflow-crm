import { z } from "zod";

// Schema para criação de Lead
export const leadFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Nome é obrigatório" })
    .max(100, { message: "Nome deve ter no máximo 100 caracteres" }),
  email: z.string()
    .trim()
    .email({ message: "Email inválido" })
    .max(255, { message: "Email deve ter no máximo 255 caracteres" })
    .optional()
    .or(z.literal("")),
  phone: z.string()
    .trim()
    .min(10, { message: "Telefone deve ter no mínimo 10 dígitos" })
    .max(15, { message: "Telefone deve ter no máximo 15 dígitos" })
    .regex(/^[\d\s\(\)\-\+]+$/, { message: "Telefone contém caracteres inválidos" }),
  company: z.string()
    .trim()
    .max(100, { message: "Empresa deve ter no máximo 100 caracteres" })
    .optional()
    .or(z.literal("")),
  source: z.string()
    .trim()
    .max(100, { message: "Origem deve ter no máximo 100 caracteres" })
    .optional()
    .or(z.literal("")),
  estimated_value: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, { message: "Valor estimado deve ser um número positivo" }),
  assigned_to: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;

// Schema para adicionar nota
export const noteFormSchema = z.object({
  content: z.string()
    .trim()
    .min(1, { message: "Conteúdo da nota é obrigatório" })
    .max(1000, { message: "Nota deve ter no máximo 1000 caracteres" }),
  note_type: z.string()
    .trim()
    .min(1, { message: "Tipo da nota é obrigatório" })
    .max(100, { message: "Tipo da nota deve ter no máximo 100 caracteres" }),
  return_date: z.date().optional(),
});

export type NoteFormData = z.infer<typeof noteFormSchema>;
