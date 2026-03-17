"use client";

import { UserLocation } from "@kids-app/shared";

interface Props {
  onLocationGranted: (loc: UserLocation) => void;
}

export default function LocationPrompt({ onLocationGranted }: Props) {
  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationGranted({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        alert("Location access is needed to find activities near you.");
      }
    );
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
      <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
        Find the Perfect Activities<br />for Your Kids
      </h1>
      <p className="text-gray-500 text-base mb-8 max-w-md">
        Discover classes, sports, music lessons, and more near your home
      </p>
      <button
        onClick={requestLocation}
        className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-3 rounded-lg transition text-sm"
      >
        Share My Location to Get Started
      </button>
      <p className="text-xs text-gray-400 mt-3">Your location is never stored or shared.</p>
    </div>
  );
}
