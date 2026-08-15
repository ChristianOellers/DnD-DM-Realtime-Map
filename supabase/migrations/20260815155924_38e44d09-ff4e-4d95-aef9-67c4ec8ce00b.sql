-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 40),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name',''), NULLIF(NEW.raw_user_meta_data->>'full_name',''), split_part(NEW.email, '@', 1), 'Adventurer'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- sessions
CREATE TABLE public.game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  gm_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  gm_claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.game_sessions TO authenticated;
GRANT ALL ON public.game_sessions TO service_role;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions readable by authenticated" ON public.game_sessions FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.is_gm(_session_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = _session_id AND s.gm_user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.claim_gm(_session_id uuid)
RETURNS public.game_sessions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result public.game_sessions;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  UPDATE public.game_sessions SET gm_user_id = auth.uid(), gm_claimed_at = now()
    WHERE id = _session_id RETURNING * INTO result;
  IF result.id IS NULL THEN RAISE EXCEPTION 'session not found'; END IF;
  RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.claim_gm(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.claim_gm(uuid) TO authenticated;

-- maps
CREATE TABLE public.maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  key text NOT NULL CHECK (key IN ('world','city','dungeon')),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  cols int NOT NULL CHECK (cols BETWEEN 4 AND 64),
  rows int NOT NULL CHECK (rows BETWEEN 4 AND 64),
  sort_order int NOT NULL DEFAULT 0,
  UNIQUE (session_id, key)
);
GRANT SELECT ON public.maps TO authenticated;
GRANT ALL ON public.maps TO service_role;
ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maps readable by authenticated" ON public.maps FOR SELECT TO authenticated USING (true);

-- characters
CREATE TABLE public.characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text NOT NULL DEFAULT '',
  archetype text NOT NULL,
  level int NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 20),
  hp int NOT NULL CHECK (hp >= 0),
  max_hp int NOT NULL CHECK (max_hp > 0),
  armor_class int NOT NULL DEFAULT 10,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  accent_color text NOT NULL DEFAULT '#c9a227',
  notes text NOT NULL DEFAULT '',
  is_npc boolean NOT NULL DEFAULT false,
  CHECK (hp <= max_hp)
);
GRANT SELECT, UPDATE ON public.characters TO authenticated;
GRANT ALL ON public.characters TO service_role;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "characters readable by authenticated" ON public.characters FOR SELECT TO authenticated USING (true);
CREATE POLICY "gm updates characters" ON public.characters FOR UPDATE TO authenticated USING (public.is_gm(session_id)) WITH CHECK (public.is_gm(session_id));

-- items
CREATE TABLE public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  name text NOT NULL,
  slot text NOT NULL DEFAULT 'inventory',
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','uncommon','rare','epic','relic')),
  icon text NOT NULL DEFAULT 'package',
  description text NOT NULL DEFAULT '',
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0)
);
GRANT SELECT ON public.items TO authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items readable by authenticated" ON public.items FOR SELECT TO authenticated USING (true);

-- effects (buffs / debuffs)
CREATE TABLE public.effects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('buff','debuff')),
  description text NOT NULL DEFAULT '',
  rounds_left int NOT NULL DEFAULT 1 CHECK (rounds_left >= 0)
);
GRANT SELECT ON public.effects TO authenticated;
GRANT ALL ON public.effects TO service_role;
ALTER TABLE public.effects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "effects readable by authenticated" ON public.effects FOR SELECT TO authenticated USING (true);

-- positions per map
CREATE TABLE public.character_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid NOT NULL REFERENCES public.maps(id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  x double precision NOT NULL,
  y double precision NOT NULL,
  on_map boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (map_id, character_id)
);
CREATE INDEX character_positions_map_idx ON public.character_positions(map_id);
GRANT SELECT, INSERT, UPDATE ON public.character_positions TO authenticated;
GRANT ALL ON public.character_positions TO service_role;
ALTER TABLE public.character_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "positions readable by authenticated" ON public.character_positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "gm writes positions" ON public.character_positions FOR INSERT TO authenticated
  WITH CHECK (public.is_gm((SELECT m.session_id FROM public.maps m WHERE m.id = map_id)));
CREATE POLICY "gm updates positions" ON public.character_positions FOR UPDATE TO authenticated
  USING (public.is_gm((SELECT m.session_id FROM public.maps m WHERE m.id = map_id)))
  WITH CHECK (public.is_gm((SELECT m.session_id FROM public.maps m WHERE m.id = map_id)));

-- fog / discovery
CREATE TABLE public.fog_cells (
  map_id uuid NOT NULL REFERENCES public.maps(id) ON DELETE CASCADE,
  cx int NOT NULL CHECK (cx >= 0),
  cy int NOT NULL CHECK (cy >= 0),
  revealed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (map_id, cx, cy)
);
GRANT SELECT, INSERT ON public.fog_cells TO authenticated;
GRANT ALL ON public.fog_cells TO service_role;
ALTER TABLE public.fog_cells ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fog readable by authenticated" ON public.fog_cells FOR SELECT TO authenticated USING (true);
CREATE POLICY "gm reveals fog" ON public.fog_cells FOR INSERT TO authenticated
  WITH CHECK (public.is_gm((SELECT m.session_id FROM public.maps m WHERE m.id = map_id)));

-- story
CREATE TABLE public.story_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  chapter_number int NOT NULL CHECK (chapter_number > 0),
  title text NOT NULL,
  mission text NOT NULL DEFAULT '',
  progress int NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  body text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, chapter_number)
);
GRANT SELECT, UPDATE ON public.story_chapters TO authenticated;
GRANT ALL ON public.story_chapters TO service_role;
ALTER TABLE public.story_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "story readable by authenticated" ON public.story_chapters FOR SELECT TO authenticated USING (true);
CREATE POLICY "gm updates story" ON public.story_chapters FOR UPDATE TO authenticated USING (public.is_gm(session_id)) WITH CHECK (public.is_gm(session_id));

-- cards
CREATE TABLE public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  effect text NOT NULL CHECK (char_length(effect) BETWEEN 1 AND 400),
  icon text NOT NULL DEFAULT 'sparkles',
  theme text NOT NULL DEFAULT 'ember',
  drawn_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.cards TO authenticated;
GRANT ALL ON public.cards TO service_role;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cards readable by authenticated" ON public.cards FOR SELECT TO authenticated USING (true);
CREATE POLICY "gm adds cards" ON public.cards FOR INSERT TO authenticated WITH CHECK (public.is_gm(session_id) AND drawn_by = auth.uid());

-- chat
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  kind text NOT NULL DEFAULT 'chat' CHECK (kind IN ('chat','system')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_session_created_idx ON public.chat_messages(session_id, created_at);
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat readable by authenticated" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "authors insert own chat" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND kind = 'chat');

-- realtime
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.character_positions REPLICA IDENTITY FULL;
ALTER TABLE public.fog_cells REPLICA IDENTITY FULL;
ALTER TABLE public.story_chapters REPLICA IDENTITY FULL;
ALTER TABLE public.cards REPLICA IDENTITY FULL;
ALTER TABLE public.game_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.character_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fog_cells;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_chapters;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;

-- ============ SEED ============
INSERT INTO public.game_sessions (id, slug, name) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'ashfall', 'The Ashfall Compact');

INSERT INTO public.maps (id, session_id, key, name, description, cols, rows, sort_order) VALUES
  ('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','world','The Ember Marches','Salt plains, glass craters and a road that hums when it rains.',24,16,1),
  ('b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000001','city','Vault-Town Karrhold','A walled city built into the ribs of something enormous and rusted.',20,14,2),
  ('b0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000001','dungeon','The Humming Deep','Corridors of dressed stone that turn, deeper down, into seamless white halls.',18,12,3);

INSERT INTO public.characters (id, session_id, name, title, archetype, level, hp, max_hp, armor_class, stats, accent_color, notes, is_npc) VALUES
  ('c0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','Bralk Ironmoor','Warden of the Third Gate','Fighter',6,48,58,18,'{"str":17,"dex":12,"con":16,"int":9,"wis":11,"cha":13}','#c9a227','Refuses to speak about what he found under the old chapel.',false),
  ('c0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000001','Sela Vane','Ashgrave Oracle','Cleric',6,38,44,16,'{"str":10,"dex":13,"con":14,"int":13,"wis":18,"cha":12}','#7fb3a4','Her prayers are answered by a voice that sometimes stutters and repeats.',false),
  ('c0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000001','Piquette','The Quiet Knife','Rogue',5,31,36,15,'{"str":9,"dex":19,"con":12,"int":14,"wis":12,"cha":15}','#9b6bd6','Collects small unbreakable rectangles of black glass. Won''t say why.',false),
  ('c0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000001','Morvane Kell','Hedge-Artificer','Wizard',6,29,34,13,'{"str":8,"dex":12,"con":13,"int":19,"wis":14,"cha":10}','#4f8fd6','Insists his spellbook''s diagrams are "circuits", a word he cannot define.',false),
  ('c0000000-0000-4000-8000-000000000005','a0000000-0000-4000-8000-000000000001','The Cartwright','Wandering Merchant','NPC',4,22,22,12,'{"str":11,"dex":11,"con":11,"int":15,"wis":16,"cha":17}','#b06a3b','Sells maps of roads that no longer exist. They are always accurate.',true),
  ('c0000000-0000-4000-8000-000000000006','a0000000-0000-4000-8000-000000000001','Unit SEXTON','The Chapel Warden','NPC',9,70,70,20,'{"str":18,"dex":10,"con":18,"int":12,"wis":8,"cha":6}','#c05c4a','Armoured figure that never removes its helm. Speaks in liturgy and numbers.',true);

INSERT INTO public.items (character_id, name, slot, rarity, icon, description, quantity) VALUES
  ('c0000000-0000-4000-8000-000000000001','Gatewarden''s Bastard Sword','weapon','rare','sword','Notched steel. The fuller is engraved with a serial no one can read.',1),
  ('c0000000-0000-4000-8000-000000000001','Salt-Scoured Plate','armor','uncommon','shield','Plate armour patched with a lighter, warmer metal.',1),
  ('c0000000-0000-4000-8000-000000000001','Ration Brick','inventory','common','package','Dense, sweet, wrapped in silver leaf that never tarnishes.',4),
  ('c0000000-0000-4000-8000-000000000002','Censer of the Stuttering Choir','weapon','epic','flame','Its smoke sometimes forms the same six symbols.',1),
  ('c0000000-0000-4000-8000-000000000002','Vial of Grey Light','inventory','rare','flask','Cold to hold. Illuminates without flame for exactly nine hours.',2),
  ('c0000000-0000-4000-8000-000000000003','Whisperfang','weapon','rare','dagger','Blade of black glass, edge one molecule thin.',1),
  ('c0000000-0000-4000-8000-000000000003','Dead Slate','inventory','relic','gem','A rectangle of dark glass. Warm on one side. Utterly inert.',3),
  ('c0000000-0000-4000-8000-000000000003','Thieves'' Kit','inventory','common','key','Picks, wires, and a small pronged tool of unknown purpose.',1),
  ('c0000000-0000-4000-8000-000000000004','Codex of Lesser Circuits','weapon','epic','book','Spell diagrams that resemble something schematic.',1),
  ('c0000000-0000-4000-8000-000000000004','Lodestone Compass','inventory','uncommon','compass','Points not north, but toward the deepest buried thing nearby.',1),
  ('c0000000-0000-4000-8000-000000000005','Ledger of Vanished Roads','inventory','rare','scroll','Trade routes drawn in a hand no living scribe uses.',1),
  ('c0000000-0000-4000-8000-000000000006','Liturgical Halberd','weapon','relic','sword','The haft is stamped: MAINT. UNIT 04 — DO NOT REMOVE.',1);

INSERT INTO public.effects (character_id, name, kind, description, rounds_left) VALUES
  ('c0000000-0000-4000-8000-000000000001','Warden''s Resolve','buff','+2 to saving throws while standing on worked stone.',5),
  ('c0000000-0000-4000-8000-000000000002','Choir Static','debuff','Disadvantage on hearing-based checks; a low hum will not stop.',3),
  ('c0000000-0000-4000-8000-000000000003','Glass-Touched','buff','Advantage on stealth in artificial light.',4),
  ('c0000000-0000-4000-8000-000000000004','Arcane Overdraw','debuff','-1 to spell attack rolls until a long rest.',8),
  ('c0000000-0000-4000-8000-000000000006','Sealed Protocol','buff','Immune to charm. Cannot be persuaded to open the lower doors.',99);

INSERT INTO public.character_positions (map_id, character_id, x, y, on_map)
SELECT m.id, c.id,
  (4 + (row_number() OVER (PARTITION BY m.id ORDER BY c.name)) * 2.0),
  (3 + ((row_number() OVER (PARTITION BY m.id ORDER BY c.name)) % 4) * 2.0),
  NOT (c.is_npc AND m.key = 'world')
FROM public.maps m CROSS JOIN public.characters c;

INSERT INTO public.fog_cells (map_id, cx, cy)
SELECT m.id, gx, gy
FROM public.maps m,
LATERAL generate_series(0, m.cols - 1) gx,
LATERAL generate_series(0, m.rows - 1) gy
WHERE (gx - m.cols/2)^2 + (gy - m.rows/2)^2 <= 20;

INSERT INTO public.story_chapters (session_id, chapter_number, title, mission, progress, body, is_active) VALUES
  ('a0000000-0000-4000-8000-000000000001',1,'Ash on the Wheat','Reach Karrhold before the second ashfall',100,'The harvest came up grey. Not blighted — grey, as though something upwind had burned for a very long time and only now let go of its smoke. The Compact took the old road east, past milestones carved with numbers instead of names.',false),
  ('a0000000-0000-4000-8000-000000000001',2,'The Humming Deep','Descend beneath the chapel and silence the choir',35,'Karrhold''s chapel has a crypt, and the crypt has a floor, and the floor is warm. Sela says the prayers below are answered too quickly — before they are finished. Morvane has started sketching the crypt''s "wards" and refuses to show anyone the drawings.

The Cartwright warned them: below the dressed stone the walls go smooth and white, and the corridors are lit by something that is not fire.',true),
  ('a0000000-0000-4000-8000-000000000001',3,'What the Marches Remember','—',0,'Sealed by the Game Master.',false);

INSERT INTO public.cards (session_id, title, effect, icon, theme) VALUES
  ('a0000000-0000-4000-8000-000000000001','The Stuttering Prayer','A blessing lands twice, a heartbeat apart. Sela gains a reroll but hears her own voice answer her.','sparkles','arcane'),
  ('a0000000-0000-4000-8000-000000000001','Warm Stone','The floor of the crypt is blood-warm. Anyone who sleeps on it wakes knowing a word in no living tongue.','flame','ember'),
  ('a0000000-0000-4000-8000-000000000001','The Merchant''s Discount','The Cartwright halves his price and will not explain why he is in a hurry to leave.','coins','gilded');

INSERT INTO public.chat_messages (session_id, author_name, body, kind) VALUES
  ('a0000000-0000-4000-8000-000000000001','Chronicle','The Ashfall Compact convenes. Whoever takes the Game Master role speaks for the world.','system'),
  ('a0000000-0000-4000-8000-000000000001','Chronicle','Chapter II — The Humming Deep. The chapel crypt stands open.','system');