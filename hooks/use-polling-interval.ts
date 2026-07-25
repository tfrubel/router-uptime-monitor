"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"

const DEFAULT_NORMAL = 5000
const DEFAULT_AGGRESSIVE = 500

export function usePollingInterval() {
  const { aggressiveMode } = useAppStore()
  const [intervals, setIntervals] = useState({
    normal: DEFAULT_NORMAL,
    aggressive: DEFAULT_AGGRESSIVE,
  })

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setIntervals({
          normal: parseInt(data.defaultPollingInterval) || DEFAULT_NORMAL,
          aggressive:
            parseInt(data.aggressivePollingInterval) || DEFAULT_AGGRESSIVE,
        })
      })
      .catch(() => {})
  }, [])

  return aggressiveMode.enabled ? intervals.aggressive : intervals.normal
}
