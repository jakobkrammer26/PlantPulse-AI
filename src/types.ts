export type WaterNeedLevel = 'Niedrig' | 'Mittel' | 'Hoch';

export interface IdealMoistureRange {
  min: number; // e.g. 30%
  max: number; // e.g. 70%
}

export interface PlantIdentificationResult {
  species: string;
  botanicalName: string;
  confidence: number;
  waterNeedLevel: WaterNeedLevel;
  recommendedWateringDurationSec: number;
  recommendedWaterAmountMl: number;
  wateringFrequencyDays: number;
  idealMoistureRange: IdealMoistureRange;
  sunlightRequirement: string;
  careTips: string[];
  healthStatus: string;
  diseaseOrWarning?: string;
  description: string;
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  botanicalName: string;
  imageUrl: string;
  waterNeedLevel: WaterNeedLevel;
  recommendedWateringDurationSec: number;
  recommendedWaterAmountMl: number;
  wateringFrequencyDays: number;
  idealMoistureRange: IdealMoistureRange;
  sunlightRequirement: string;
  careTips: string[];
  healthStatus: string;
  diseaseOrWarning?: string;
  description: string;
  lastWatered?: string; // ISO string
  soilMoisturePercent: number;
  targetMoisturePercent: number;
  esp32Ip: string;
  channelPin: number; // GPIO or Relay Channel
  autoWateringEnabled: boolean;
  notes?: string;
}

export interface ESP32State {
  ipAddress: string;
  isConnected: boolean;
  soilMoisturePercent: number;
  tankLevelPercent: number;
  isTankEmpty: boolean;
  isPumpActive: boolean;
  lastPingTime: string;
  firmwareVersion: string;
  dailyWateredMl: number;
  dailyWateringLimitMl: number;
  cooldownRemainingSec: number;
}

export type TriggerType = 'ai_auto' | 'manual' | 'scheduled' | 'esp32_sensor';
export type LogStatus = 'success' | 'failed_empty_tank' | 'failed_limit_reached' | 'failed_offline';

export interface WateringLog {
  id: string;
  plantId: string;
  plantName: string;
  timestamp: string; // ISO string
  durationSec: number;
  amountMl: number;
  triggerType: TriggerType;
  status: LogStatus;
  note?: string;
}

export interface SmartCalcRequest {
  species: string;
  currentMoisture: number;
  targetMoisture: number;
  potSizeCm?: number;
  temperatureC?: number;
  humidityPercent?: number;
}

export interface SmartCalcResponse {
  recommendedDurationSec: number;
  recommendedAmountMl: number;
  explanation: string;
}
