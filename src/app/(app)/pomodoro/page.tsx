import React from "react";
import PomodoroClient from "./PomodoroClient";

export const metadata = {
  title: "Focus Sanctuary • MoonDay Pomodoro",
  description:
    "Distraction-free Pomodoro timer, soft illustrated backgrounds, ambient soundscapes, and minimalist task flow.",
};

export default function PomodoroPage() {
  return <PomodoroClient />;
}
