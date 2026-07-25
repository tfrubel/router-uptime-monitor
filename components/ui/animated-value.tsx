"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedValueProps {
  value: string | number
  className?: string
  as?: "p" | "span" | "div"
}

export function AnimatedValue({
  value,
  className,
  as: Tag = "span",
}: AnimatedValueProps) {
  const [display, setDisplay] = useState(value)
  const [animating, setAnimating] = useState(false)
  const prevRef = useRef(value)

  useEffect(() => {
    if (prevRef.current === value) return
    prevRef.current = value

    setAnimating(true)
    const t1 = setTimeout(() => {
      setDisplay(value)
      setAnimating(false)
    }, 150)

    return () => clearTimeout(t1)
  }, [value])

  return (
    <Tag
      className={cn(
        "transition-all duration-300 ease-out",
        animating
          ? "translate-y-[-2px] scale-[1.02] opacity-60 blur-[2px]"
          : "blur-0 translate-y-0 scale-100 opacity-100",
        className
      )}
    >
      {display}
    </Tag>
  )
}
