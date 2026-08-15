import {
  Compass,
  Eye,
  Flame,
  Gem,
  Key,
  Moon,
  Scroll,
  Shield,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  flame: Flame,
  gem: Gem,
  compass: Compass,
  scroll: Scroll,
  key: Key,
  eye: Eye,
  zap: Zap,
  moon: Moon,
  shield: Shield,
  coins: Gem,
};

export function cardIcon(name: string): LucideIcon {
  return ICONS[name] ?? Sparkles;
}
