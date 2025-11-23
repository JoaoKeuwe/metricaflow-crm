-- Atualizar todas as empresas para usar o tema futurista como padrão
UPDATE companies 
SET theme = 'futurista' 
WHERE theme IS NULL OR theme != 'futurista';

-- Definir futurista como valor padrão para novas empresas
ALTER TABLE companies 
ALTER COLUMN theme SET DEFAULT 'futurista';