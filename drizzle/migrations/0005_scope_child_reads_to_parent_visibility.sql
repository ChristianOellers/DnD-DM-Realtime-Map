DROP POLICY IF EXISTS "story readable by authenticated" ON public.story_chapters;
CREATE POLICY "story readable within visible session" ON public.story_chapters
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = story_chapters.session_id));

DROP POLICY IF EXISTS "items readable by authenticated" ON public.items;
CREATE POLICY "items readable via visible character" ON public.items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.characters c WHERE c.id = items.character_id));

DROP POLICY IF EXISTS "effects readable by authenticated" ON public.effects;
CREATE POLICY "effects readable via visible character" ON public.effects
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.characters c WHERE c.id = effects.character_id));

DROP POLICY IF EXISTS "positions readable by authenticated" ON public.character_positions;
CREATE POLICY "positions readable via visible map and character" ON public.character_positions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.maps m WHERE m.id = character_positions.map_id)
    AND EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_positions.character_id)
  );