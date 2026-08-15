import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DndContext, useDraggable, type DragEndEvent } from "@dnd-kit/core";

import { MapScene, type FigureState } from "./map-scene";
import type { GridStyle } from "@/lib/game/constants";
import type { CharacterSheet, GameMap } from "@/lib/game/types";

const PALETTE_BY_KEY: Record<string, number> = { world: 0, city: 1, dungeon: 2 };

export interface BoardPosition {
  x: number;
  y: number;
  onMap: boolean;
}

interface MapBoardProps {
  map: GameMap;
  characters: CharacterSheet[];
  positions: Record<string, BoardPosition>;
  discovered: [number, number][];
  gridStyle: GridStyle;
  candleEnabled: boolean;
  fogStrength: number;
  canMove: boolean;
  selectedCharacterId: string | null;
  onSelectCharacter: (id: string) => void;
  onMoveCharacter: (characterId: string, next: BoardPosition) => void;
}

export function MapBoard({
  map,
  characters,
  positions,
  discovered,
  gridStyle,
  candleEnabled,
  fogStrength,
  canMove,
  selectedCharacterId,
  onSelectCharacter,
  onMoveCharacter,
}: MapBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<MapScene | null>(null);
  const [viewportVersion, setViewportVersion] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = new MapScene(canvas, {
      cols: map.cols,
      rows: map.rows,
      terrainSeed: hashSeed(map.id),
      palette: PALETTE_BY_KEY[map.key] ?? 0,
    });
    sceneRef.current = scene;
    setViewportVersion((v) => v + 1);

    const observer = new ResizeObserver(() => {
      scene.resize();
      setViewportVersion((v) => v + 1);
    });
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      scene.dispose();
      sceneRef.current = null;
    };
    // A new scene per map keeps the shader uniforms and fog texture honest.
  }, [map.id, map.cols, map.rows, map.key]);

  useEffect(() => sceneRef.current?.setGridStyle(gridStyle), [gridStyle, viewportVersion]);
  useEffect(() => sceneRef.current?.setFogStrength(fogStrength), [fogStrength, viewportVersion]);
  useEffect(() => sceneRef.current?.setDiscovered(discovered), [discovered, viewportVersion]);

  const figures = useMemo<FigureState[]>(
    () =>
      characters.map((character) => {
        const position = positions[character.id] ?? { x: 1, y: 1, onMap: false };
        return {
          id: character.id,
          x: position.x,
          y: position.y,
          color: character.accent_color,
          onMap: position.onMap,
          selected: character.id === selectedCharacterId,
        };
      }),
    [characters, positions, selectedCharacterId],
  );

  useEffect(() => sceneRef.current?.syncFigures(figures), [figures, viewportVersion]);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const scene = sceneRef.current;
      if (!scene) return;
      // Project the pointer onto the ground plane so the candle follows the
      // cursor in world space (shader uv.y runs bottom-up, screen y top-down).
      const grid = scene.clientToGrid(event.clientX, event.clientY);
      if (!grid) return;
      scene.setCandle(grid.x / map.cols, 1 - grid.y / map.rows, candleEnabled);
    },
    [candleEnabled, map.cols, map.rows],
  );

  useEffect(() => {
    if (!candleEnabled) sceneRef.current?.setCandle(-1, -1, false);
  }, [candleEnabled]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const characterId = String(event.active.id);
      const origin = event.active.rect.current.initial;
      if (!origin) return;
      const centerX = origin.left + origin.width / 2 + event.delta.x;
      const centerY = origin.top + origin.height / 2 + event.delta.y;
      const grid = sceneRef.current?.clientToGrid(centerX, centerY);
      if (!grid) return;

      const inside = grid.x >= 0 && grid.y >= 0 && grid.x <= map.cols && grid.y <= map.rows;
      onMoveCharacter(characterId, {
        x: clamp(grid.x, -4, map.cols + 4),
        y: clamp(grid.y, -4, map.rows + 4),
        onMap: inside,
      });
    },
    [map.cols, map.rows, onMoveCharacter],
  );

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div
        className="relative h-full w-full overflow-hidden rounded-lg"
        onPointerMove={handlePointerMove}
      >
        <canvas ref={canvasRef} className="block h-full w-full" aria-hidden />

        {/* Accessible, draggable handles projected onto the 3D figures. */}
        <div className="pointer-events-none absolute inset-0">
          {characters.map((character) => {
            const position = positions[character.id];
            if (!position?.onMap) return null;
            const point = sceneRef.current?.gridToClient(position.x, position.y);
            if (!point) return null;
            return (
              <FigureHandle
                key={`${character.id}-${viewportVersion}`}
                id={character.id}
                label={character.name}
                left={point.left}
                top={point.top}
                color={character.accent_color}
                selected={character.id === selectedCharacterId}
                canMove={canMove}
                onSelect={() => onSelectCharacter(character.id)}
              />
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}

interface FigureHandleProps {
  id: string;
  label: string;
  left: number;
  top: number;
  color: string;
  selected: boolean;
  canMove: boolean;
  onSelect: () => void;
}

function FigureHandle({
  id,
  label,
  left,
  top,
  color,
  selected,
  canMove,
  onSelect,
}: FigureHandleProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: !canMove,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onSelect}
      aria-label={canMove ? `Select or move ${label}` : `Select ${label}`}
      className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full border transition-shadow"
      style={{
        left,
        top,
        width: 46,
        height: 46,
        borderColor: selected ? color : "transparent",
        backgroundColor: isDragging ? `${color}33` : "transparent",
        boxShadow: selected ? `0 0 22px -4px ${color}` : undefined,
        cursor: canMove ? "grab" : "pointer",
        transform: transform
          ? `translate(-50%, -50%) translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        zIndex: isDragging ? 30 : 10,
      }}
      {...listeners}
      {...attributes}
    >
      <span className="sr-only">{label}</span>
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-background/80 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-foreground/80"
      >
        {label.split(" ")[0]}
      </span>
    </button>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hashSeed(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) % 9973;
  return hash / 9973;
}
