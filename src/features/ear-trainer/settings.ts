import { loadPersisted, savePersisted } from "../../shared/persist";
import { isMelodyTone } from "../melodies/tone";
import {
  DEFAULT_EAR_TRAINER_SETTINGS, normalizeSettings, type EarTrainerSettings,
} from "./theory";

const STORAGE_KEY = "ear-trainer-settings";

export function loadEarTrainerSettings(): EarTrainerSettings {
  const stored = loadPersisted<Partial<EarTrainerSettings>>(STORAGE_KEY, {});
  const tone = isMelodyTone(stored.tone) ? stored.tone : DEFAULT_EAR_TRAINER_SETTINGS.tone;
  return normalizeSettings({ ...stored, tone });
}

export function saveEarTrainerSettings(settings: EarTrainerSettings): void {
  savePersisted(STORAGE_KEY, settings);
}
