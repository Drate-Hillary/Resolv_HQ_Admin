import { useEffect, useState } from "react"
import { ThinkingOrb, type OrbState } from "thinking-orbs"

const orbStates: OrbState[] = [
  "working",
  "searching",
  "solving",
  "listening",
  "connecting",
  "weaving",
  "composing",
  "breathing",
  "shaping",
]

/** Cycles through the orb states, or shows `state` when the caller knows what the agent is doing. */
export function AgentThinkingOrb({ size = 20, state: fixedState }: { size?: 20 | 64; state?: OrbState }) {
  const [stateIndex, setStateIndex] = useState(0)

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)")
    const interval = window.setInterval(() => {
      if (!motionPreference.matches) {
        setStateIndex((current) => (current + 1) % orbStates.length)
      }
    }, 1800)
    const handleMotionPreferenceChange = () => {
      if (motionPreference.matches) setStateIndex(0)
    }
    motionPreference.addEventListener("change", handleMotionPreferenceChange)

    return () => {
      window.clearInterval(interval)
      motionPreference.removeEventListener("change", handleMotionPreferenceChange)
    }
  }, [])

  const state = fixedState ?? orbStates[stateIndex]

  return <ThinkingOrb state={state} size={size} aria-label={`Agent ${state}…`} />
}
