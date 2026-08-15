import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { SignInPanel } from "@/components/auth/SignInPanel";
import { CharacterRoster } from "@/components/game/CharacterRoster";
import { CharacterSheetDialog } from "@/components/game/CharacterSheetDialog";
import { ChatPanel } from "@/components/game/ChatPanel";
import { DesktopOnlyGate } from "@/components/game/DesktopOnlyGate";
import { FateDeckPanel } from "@/components/game/FateDeckPanel";
import { MapBoard, type BoardPosition } from "@/components/game/MapBoard";
import { StoryPanel } from "@/components/game/StoryPanel";
import { TopBar } from "@/components/game/TopBar";
import { displayNameOf, useAuth } from "@/hooks/use-auth";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useRealtimeSession } from "@/hooks/use-realtime-session";
import { rollFateDice } from "@/lib/ai/fate.functions";
import {
  addCard,
  cellsAround,
  claimGameMaster,
  revealFog,
  saveChapter,
  saveCharacterPosition,
  sendChatMessage,
  type StoryInput,
} from "@/lib/game/mutations";
import {
  cardsQuery,
  chaptersQuery,
  charactersQuery,
  chatQuery,
  fogQuery,
  gameKeys,
  mapsQuery,
  positionsQuery,
  sessionQuery,
} from "@/lib/game/queries";
import { enqueue, flush, pending } from "@/lib/offline/queue";
import { useGameStore } from "@/store/game-store";
import type { CardDraft, CharacterPosition, FateRollResult, MapKey } from "@/lib/game/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ashfall — D&D Game Master Console" },
      {
        name: "description",
        content:
          "A desktop Game Master console for the Ashfall Compact: a 3D tabletop with fog of war, live chat, an editable chronicle and a deck of magical omens.",
      },
      { property: "og:title", content: "Ashfall — D&D Game Master Console" },
      {
        property: "og:description",
        content:
          "Run a table on a Three.js map with fog of war, realtime chat, an editable chronicle and a deck of magical omens.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConsoleRoute,
});

function ConsoleRoute() {
  const { session, user, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading" />
      </main>
    );
  }

  if (!session || !user) return <SignInPanel />;

  return (
    <DesktopOnlyGate>
      <GameConsole userId={user.id} userName={displayNameOf(user)} />
    </DesktopOnlyGate>
  );
}

interface GameConsoleProps {
  userId: string;
  userName: string;
}

function GameConsole({ userId, userName }: GameConsoleProps) {
  const queryClient = useQueryClient();
  const online = useOnlineStatus();
  const [lastRoll, setLastRoll] = useState<FateRollResult | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const activeMapKey = useGameStore((state) => state.activeMapKey);
  const gridStyle = useGameStore((state) => state.gridStyle);
  const candleEnabled = useGameStore((state) => state.candleEnabled);
  const previewAsPlayer = useGameStore((state) => state.previewAsPlayer);
  const theme = useGameStore((state) => state.theme);
  const selectedCharacterId = useGameStore((state) => state.selectedCharacterId);
  const offeredCards = useGameStore((state) => state.offeredCards);
  const store = useGameStore.getState;

  const sessionResult = useQuery(sessionQuery());
  const sessionId = sessionResult.data?.id;

  const maps = useQuery({ ...mapsQuery(sessionId ?? ""), enabled: Boolean(sessionId) });
  const characters = useQuery({ ...charactersQuery(sessionId ?? ""), enabled: Boolean(sessionId) });
  const chapters = useQuery({ ...chaptersQuery(sessionId ?? ""), enabled: Boolean(sessionId) });
  const cards = useQuery({ ...cardsQuery(sessionId ?? ""), enabled: Boolean(sessionId) });
  const chat = useQuery({ ...chatQuery(sessionId ?? ""), enabled: Boolean(sessionId) });

  const activeMap =
    maps.data?.find((map) => map.key === activeMapKey) ?? maps.data?.[0] ?? undefined;

  const positions = useQuery({
    ...positionsQuery(activeMap?.id ?? ""),
    enabled: Boolean(activeMap?.id),
  });
  const fog = useQuery({ ...fogQuery(activeMap?.id ?? ""), enabled: Boolean(activeMap?.id) });

  useRealtimeSession(sessionId, maps.data?.map((map) => map.id) ?? []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  const isGm = sessionResult.data?.gm_user_id === userId;

  const positionMap = useMemo<Record<string, BoardPosition>>(() => {
    const entries: Record<string, BoardPosition> = {};
    for (const row of positions.data ?? []) {
      entries[row.character_id] = { x: row.x, y: row.y, onMap: row.on_map };
    }
    return entries;
  }, [positions.data]);

  const discovered = useMemo<[number, number][]>(
    () => (fog.data ?? []).map((cell) => [cell.cx, cell.cy] as [number, number]),
    [fog.data],
  );

  const refreshPendingCount = useCallback(() => setPendingCount(pending().length), []);
  useEffect(refreshPendingCount, [refreshPendingCount]);

  // Replay queued offline work as soon as the table is reachable again.
  useEffect(() => {
    if (!online) return;
    void flush({
      position: saveCharacterPosition,
      story: saveChapter,
    }).then((applied) => {
      refreshPendingCount();
      if (applied > 0) {
        toast.success(`Synced ${applied} offline change${applied === 1 ? "" : "s"}.`);
        void queryClient.invalidateQueries();
      }
    });
  }, [online, queryClient, refreshPendingCount]);

  const moveCharacter = useCallback(
    (characterId: string, next: BoardPosition) => {
      if (!activeMap) return;
      const payload = {
        mapId: activeMap.id,
        characterId,
        x: Number(next.x.toFixed(3)),
        y: Number(next.y.toFixed(3)),
        onMap: next.onMap,
      };

      queryClient.setQueryData(
        gameKeys.positions(activeMap.id),
        (rows: CharacterPosition[] | undefined) =>
          (rows ?? []).map((row) =>
            row.character_id === characterId
              ? { ...row, x: payload.x, y: payload.y, on_map: payload.onMap }
              : row,
          ),
      );

      if (!online) {
        enqueue({ kind: "position", payload });
        refreshPendingCount();
        toast.info("Move stored offline. It will sync when you reconnect.");
        return;
      }

      void saveCharacterPosition(payload)
        .then(() => {
          if (!payload.onMap) return;
          return revealFog(
            activeMap.id,
            cellsAround(payload.x, payload.y, activeMap.cols, activeMap.rows),
          );
        })
        .then(() => {
          void queryClient.invalidateQueries({ queryKey: gameKeys.fog(activeMap.id) });
        })
        .catch((error: Error) => {
          toast.error(error.message);
          void queryClient.invalidateQueries({ queryKey: gameKeys.positions(activeMap.id) });
        });
    },
    [activeMap, online, queryClient, refreshPendingCount],
  );

  const storyMutation = useMutation({
    mutationFn: async (input: StoryInput) => {
      if (!online) {
        enqueue({ kind: "story", payload: input });
        refreshPendingCount();
        return "queued" as const;
      }
      await saveChapter(input);
      return "saved" as const;
    },
    onSuccess: (result) => {
      if (result === "queued") toast.info("Chronicle saved offline. It will sync on reconnect.");
      else {
        toast.success("Chronicle saved.");
        if (sessionId)
          void queryClient.invalidateQueries({ queryKey: gameKeys.chapters(sessionId) });
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const claimMutation = useMutation({
    mutationFn: () => claimGameMaster(sessionId ?? ""),
    onSuccess: () => {
      toast.success("The table turns to you. You are the Game Master.");
      void queryClient.invalidateQueries({ queryKey: gameKeys.session });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const callFate = useServerFn(rollFateDice);
  const fateMutation = useMutation({
    mutationFn: (prompt: string) => callFate({ data: { sessionId: sessionId ?? "", prompt } }),
    onSuccess: (result) => {
      setLastRoll(result);
      store().offerCards(result.cards);
    },
    onError: () => toast.error("The dice would not answer."),
  });

  const chooseCard = useCallback(
    (card: CardDraft) => {
      if (!sessionId) return;
      store().clearOfferedCards();
      void addCard(sessionId, userId, card)
        .then(() => queryClient.invalidateQueries({ queryKey: gameKeys.cards(sessionId) }))
        .catch((error: Error) => toast.error(error.message));
    },
    [queryClient, sessionId, store, userId],
  );

  const sendMessage = useCallback(
    (body: string) => {
      if (!sessionId) return;
      void sendChatMessage(sessionId, userId, userName, body).catch((error: Error) =>
        toast.error(error.message),
      );
    },
    [sessionId, userId, userName],
  );

  if (sessionResult.isLoading || !sessionResult.data || !activeMap) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Preparing the table" />
      </main>
    );
  }

  const characterList = characters.data ?? [];
  const selectedCharacter = characterList.find((c) => c.id === selectedCharacterId) ?? null;
  const offMapIds = new Set(
    characterList.filter((c) => positionMap[c.id]?.onMap === false).map((c) => c.id),
  );

  return (
    <div className="grid h-screen grid-rows-[auto_1fr] gap-3 p-3">
      <TopBar
        sessionName={sessionResult.data.name}
        maps={maps.data ?? []}
        activeMapKey={activeMapKey}
        isGm={isGm}
        gmName={sessionResult.data.gm_user_id ? (isGm ? userName : "another player") : null}
        userName={userName}
        online={online}
        pendingCount={pendingCount}
        gridStyle={gridStyle}
        candleEnabled={candleEnabled}
        previewAsPlayer={previewAsPlayer}
        theme={theme}
        onSelectMap={(key: MapKey) => store().setActiveMap(key)}
        onClaimGm={() => claimMutation.mutate()}
        onCycleGrid={() => store().cycleGridStyle()}
        onToggleCandle={() => store().setCandleEnabled(!candleEnabled)}
        onTogglePreview={() => store().setPreviewAsPlayer(!previewAsPlayer)}
        onToggleTheme={() => store().toggleTheme()}
        onSignOut={() => void supabase.auth.signOut()}
      />

      <div className="grid min-h-0 grid-cols-[20rem_1fr_21rem] gap-3">
        <div className="grid min-h-0 grid-rows-[1fr_auto] gap-3">
          <StoryPanel
            chapters={chapters.data ?? []}
            isGm={isGm}
            online={online}
            saving={storyMutation.isPending}
            onSave={(input) => storyMutation.mutate(input)}
          />
          <FateDeckPanel
            isGm={isGm}
            rolling={fateMutation.isPending}
            lastRoll={lastRoll}
            offeredCards={offeredCards}
            deck={cards.data ?? []}
            onRoll={(prompt) => fateMutation.mutate(prompt)}
            onChooseCard={chooseCard}
          />
        </div>

        <div className="grid min-h-0 grid-rows-[1fr_auto] gap-3">
          <section
            className="panel min-h-0 overflow-hidden p-2"
            aria-label={`${activeMap.name} map`}
          >
            <MapBoard
              map={activeMap}
              characters={characterList}
              positions={positionMap}
              discovered={discovered}
              gridStyle={gridStyle}
              candleEnabled={candleEnabled && isGm}
              fogStrength={isGm && !previewAsPlayer ? 0.35 : 1}
              canMove={isGm}
              selectedCharacterId={selectedCharacterId}
              onSelectCharacter={(id) => store().selectCharacter(id)}
              onMoveCharacter={moveCharacter}
            />
          </section>
          <CharacterRoster
            characters={characterList}
            selectedId={selectedCharacterId}
            offMapIds={offMapIds}
            onSelect={(id) => store().selectCharacter(id)}
          />
        </div>

        <div className="grid min-h-0">
          <ChatPanel
            messages={chat.data ?? []}
            currentUserId={userId}
            disabled={!online}
            onSend={sendMessage}
          />
        </div>
      </div>

      <CharacterSheetDialog
        character={selectedCharacter}
        onClose={() => store().selectCharacter(null)}
      />
    </div>
  );
}
