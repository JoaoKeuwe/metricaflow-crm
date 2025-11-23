-- Atualizar constraint do tema para incluir 'futurista'
ALTER TABLE public.companies
DROP CONSTRAINT IF EXISTS companies_theme_check;

ALTER TABLE public.companies
ADD CONSTRAINT companies_theme_check
CHECK (theme IN ('moderno', 'classico', 'vibrante', 'minimalista', 'rosa', 'neon', 'futurista'));