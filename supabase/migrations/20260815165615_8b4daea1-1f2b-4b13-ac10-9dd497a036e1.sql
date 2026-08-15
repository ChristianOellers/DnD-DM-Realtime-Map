GRANT EXECUTE ON FUNCTION public.is_gm(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_gm(uuid) TO authenticated;

-- Game Master gets full control over table data
CREATE POLICY "gm deletes positions" ON public.character_positions FOR DELETE TO authenticated
  USING (public.is_gm((SELECT m.session_id FROM public.maps m WHERE m.id = character_positions.map_id)));

CREATE POLICY "gm deletes fog" ON public.fog_cells FOR DELETE TO authenticated
  USING (public.is_gm((SELECT m.session_id FROM public.maps m WHERE m.id = fog_cells.map_id)));

CREATE POLICY "gm inserts characters" ON public.characters FOR INSERT TO authenticated
  WITH CHECK (public.is_gm(session_id));
CREATE POLICY "gm deletes characters" ON public.characters FOR DELETE TO authenticated
  USING (public.is_gm(session_id));

CREATE POLICY "gm updates cards" ON public.cards FOR UPDATE TO authenticated
  USING (public.is_gm(session_id)) WITH CHECK (public.is_gm(session_id));
CREATE POLICY "gm deletes cards" ON public.cards FOR DELETE TO authenticated
  USING (public.is_gm(session_id));

CREATE POLICY "gm manages effects insert" ON public.effects FOR INSERT TO authenticated
  WITH CHECK (public.is_gm((SELECT c.session_id FROM public.characters c WHERE c.id = effects.character_id)));
CREATE POLICY "gm manages effects update" ON public.effects FOR UPDATE TO authenticated
  USING (public.is_gm((SELECT c.session_id FROM public.characters c WHERE c.id = effects.character_id)))
  WITH CHECK (public.is_gm((SELECT c.session_id FROM public.characters c WHERE c.id = effects.character_id)));
CREATE POLICY "gm manages effects delete" ON public.effects FOR DELETE TO authenticated
  USING (public.is_gm((SELECT c.session_id FROM public.characters c WHERE c.id = effects.character_id)));

CREATE POLICY "gm manages items insert" ON public.items FOR INSERT TO authenticated
  WITH CHECK (public.is_gm((SELECT c.session_id FROM public.characters c WHERE c.id = items.character_id)));
CREATE POLICY "gm manages items update" ON public.items FOR UPDATE TO authenticated
  USING (public.is_gm((SELECT c.session_id FROM public.characters c WHERE c.id = items.character_id)))
  WITH CHECK (public.is_gm((SELECT c.session_id FROM public.characters c WHERE c.id = items.character_id)));
CREATE POLICY "gm manages items delete" ON public.items FOR DELETE TO authenticated
  USING (public.is_gm((SELECT c.session_id FROM public.characters c WHERE c.id = items.character_id)));

CREATE POLICY "gm inserts story" ON public.story_chapters FOR INSERT TO authenticated
  WITH CHECK (public.is_gm(session_id));

-- Automatic game log entries, written by the Game Master's client
CREATE POLICY "gm logs events" ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (public.is_gm(session_id) AND kind = 'log');
