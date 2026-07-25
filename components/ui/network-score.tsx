"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface NetworkScoreProps {
  score: number
  label: "Excellent" | "Good" | "Warning" | "Critical"
}

export function NetworkScore({ score, label }: NetworkScoreProps) {
  const getColor = () => {
    if (score >= 95) return "text-green-500"
    if (score >= 70) return "text-amber-500"
    if (score >= 40) return "text-orange-500"
    return "text-red-500"
  }

  const getBgColor = () => {
    if (score >= 95) return "bg-green-500"
    if (score >= 70) return "bg-amber-500"
    if (score >= 40) return "bg-orange-500"
    return "bg-red-500"
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={getBgColor()}
            initial={{ strokeDasharray: "0 251.2" }}
            animate={{ strokeDasharray: `${(score / 100) * 251.2} 251.2` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={cn("text-2xl font-bold", getColor())}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
        </div>
      </div>
      <span className={cn("text-sm font-medium", getColor())}>{label}</span>
    </div>
  )
}
