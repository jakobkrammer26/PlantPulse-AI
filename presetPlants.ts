import { Plant } from '../types';

export const INITIAL_PLANTS: Plant[] = [
  {
    id: 'plant-1',
    name: 'Monstera im Wohnzimmer',
    species: 'Monstera Deliciosa',
    botanicalName: 'Monstera deliciosa Liebm.',
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80',
    waterNeedLevel: 'Mittel',
    recommendedWateringDurationSec: 6,
    recommendedWaterAmountMl: 180,
    wateringFrequencyDays: 6,
    idealMoistureRange: { min: 40, max: 70 },
    sunlightRequirement: 'Heller, indirekter Sonnenplatz',
    careTips: [
      'Gieße erst, wenn die oberste Erdschicht angetrocknet ist.',
      'Große Blätter regelmäßig mit einem feuchten Tuch von Staub befreien.',
      'Mag hohe Luftfeuchtigkeit; Blätter gelegentlich einsprühen.'
    ],
    healthStatus: 'Sehr gut & kräftiger Wuchs',
    description: 'Eine imposante Tropenpflanze mit charakteristisch geschlitzten Blättern.',
    lastWatered: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    soilMoisturePercent: 48,
    targetMoisturePercent: 65,
    esp32Ip: '192.168.1.105',
    channelPin: 26,
    autoWateringEnabled: true,
    notes: 'An ESP32 Bewässerungsrelais Kanal 1 angeschlossen.'
  },
  {
    id: 'plant-2',
    name: 'Bogenhanf Büro',
    species: 'Sansevieria Trifasciata',
    botanicalName: 'Dracaena trifasciata',
    imageUrl: 'https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?auto=format&fit=crop&w=800&q=80',
    waterNeedLevel: 'Niedrig',
    recommendedWateringDurationSec: 3,
    recommendedWaterAmountMl: 90,
    wateringFrequencyDays: 14,
    idealMoistureRange: { min: 20, max: 45 },
    sunlightRequirement: 'Sonnig bis Halbschatten (sehr anspruchslos)',
    careTips: [
      'Äußerst sparsam gießen – Staunässe unbedingt vermeiden!',
      'Übersteht längere Trockenperioden ohne Probleme.',
      'Sorgt für exzellente Raumluftfilterung.'
    ],
    healthStatus: 'Gesund & Trockentolerant',
    description: 'Pflegeleichte Sukkulente mit aufrechten, grün-gelb marmorierten Blättern.',
    lastWatered: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    soilMoisturePercent: 28,
    targetMoisturePercent: 40,
    esp32Ip: '192.168.1.105',
    channelPin: 27,
    autoWateringEnabled: true,
    notes: 'Automatisches Gießintervall verlängert auf 14 Tage.'
  },
  {
    id: 'plant-3',
    name: 'Küchen-Basilikum',
    species: 'Ocimum Basilicum',
    botanicalName: 'Ocimum basilicum L.',
    imageUrl: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=800&q=80',
    waterNeedLevel: 'Hoch',
    recommendedWateringDurationSec: 8,
    recommendedWaterAmountMl: 250,
    wateringFrequencyDays: 2,
    idealMoistureRange: { min: 55, max: 80 },
    sunlightRequirement: 'Sehr viel Sonne & Wärme',
    careTips: [
      'Gleichmäßig feucht halten, Erde darf nie komplett austrocknen.',
      'Immer von unten gießen oder Wurzelbereich benetzen.',
      'Triebspitzen regelmäßig ernten, um buschigen Wuchs zu fördern.'
    ],
    healthStatus: 'Durstig – Nachgießen empfohlen',
    description: 'Aromatisches Küchenkraut mit hohem täglichem Wasser- und Sonnenbedarf.',
    lastWatered: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    soilMoisturePercent: 32,
    targetMoisturePercent: 70,
    esp32Ip: '192.168.1.105',
    channelPin: 14,
    autoWateringEnabled: true,
    notes: 'Bodenfeuchte aktuell abgesunken.'
  }
];
