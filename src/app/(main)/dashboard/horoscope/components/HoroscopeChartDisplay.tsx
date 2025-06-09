
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlanetPosition {
  planet: string;
  sign: string;
  house?: number;
}

interface HoroscopeChartDisplayProps {
  ascendant: string;
  planetaryPositions: PlanetPosition[];
  title?: string;
}

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

// A common way to represent houses in a South Indian style chart visually in a grid
// Houses are typically counted clockwise.
// Grid mapping (example for visual layout, can be adjusted):
// 1  | 2  | 3  | 4
// 12 |    |    | 5
// 11 |    |    | 6
// 10 | 9  | 8  | 7
// For simplicity, we'll render them sequentially in a grid and note house numbers.
// Or, use a specific layout like South Indian:
const southIndianChartOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; 
// This is a simplified linear rendering. A true South Indian chart has a fixed visual layout 
// where signs are fixed and houses move. For this visual, we'll fix houses in cells
// and put the signs in them.

export const HoroscopeChartDisplay: React.FC<HoroscopeChartDisplayProps> = ({ ascendant, planetaryPositions, title }) => {
  if (!ascendant || !planetaryPositions) {
    return <p className="text-sm text-muted-foreground">Ascendant or planetary positions missing for chart display.</p>;
  }

  const ascendantIndex = ZODIAC_SIGNS.indexOf(ascendant);
  if (ascendantIndex === -1) {
    return <p className="text-sm text-destructive">Invalid Ascendant sign: {ascendant}</p>;
  }

  const housesData = Array(12).fill(null).map((_, i) => {
    const houseNumber = i + 1;
    const signIndex = (ascendantIndex + i) % 12;
    const sign = ZODIAC_SIGNS[signIndex];
    const planetsInHouse = planetaryPositions
      .filter(p => p.house === houseNumber)
      .map(p => p.planet);
    return {
      houseNumber,
      sign,
      planets: planetsInHouse,
    };
  });

  // Simple grid layout for 12 houses
  const houseGridCells = southIndianChartOrder.map(houseNum => housesData[houseNum - 1]);

  return (
    <Card className="mt-4 shadow-md">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary">
          {title || "Simplified Horoscope Chart"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-px bg-border border border-border rounded-md overflow-hidden">
          {houseGridCells.map(({ houseNumber, sign, planets }) => (
            <div key={houseNumber} className="bg-card p-2 min-h-[100px] flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-muted-foreground">
                  H{houseNumber}
                </div>
                <div className="text-sm font-medium text-foreground">{sign}</div>
              </div>
              {planets.length > 0 && (
                <div className="mt-1">
                  {planets.map(planet => (
                    <div key={planet} className="text-xs text-primary truncate">
                      {planet.substring(0,3)} {/* Abbreviate planet names if long */}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Note: This is a simplified visual representation based on AI-extracted data. Houses are numbered 1-12 starting with the Ascendant.
        </p>
      </CardContent>
    </Card>
  );
};
