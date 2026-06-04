INSERT INTO public.missions (id, title, description, requirement_type, requirement_count, xp_reward, icon)
VALUES 
  (gen_random_uuid(), 'Mestre dos Fechamentos', 'Gere 5 fechamentos matemáticos profissionais.', 'generate_games', 5, 250, 'Grid3X3'),
  (gen_random_uuid(), 'Estrategista Titan', 'Utilize o recomendador IA para aplicar um fechamento.', 'simulation', 3, 150, 'Brain'),
  (gen_random_uuid(), 'Rei dos Ciclos', 'Analise o Farol Estatístico.', 'page_view', 5, 100, 'Zap');
