"use client"

import { useEffect, useRef, useState } from "react"
import { Shield, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QRCodeDisplayProps {
  eventId: string
  eventTitle: string
}

export function QRCodeDisplay({ eventId, eventTitle }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrGenerated, setQrGenerated] = useState(false)

  useEffect(() => {
    // Disable screenshots on this component (mock implementation - in production use native APIs)
    const preventScreenshot = (e: KeyboardEvent) => {
      // Prevent common screenshot shortcuts
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "3" || e.key === "4")) {
        e.preventDefault()
        alert("Screenshots are disabled for security purposes")
      }
    }

    document.addEventListener("keydown", preventScreenshot)
    return () => document.removeEventListener("keydown", preventScreenshot)
  }, [])

  useEffect(() => {
    generateQRCode()
  }, [eventId])

  const generateQRCode = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Generate unique QR data (in production, this would be a secure token)
    const qrData = `ATTENDAI-${eventId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Mock QR code generation - draw a grid pattern
    const size = 300
    const modules = 25
    const moduleSize = size / modules

    canvas.width = size
    canvas.height = size

    // White background
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, size, size)

    // Generate random pattern (in production, use actual QR library)
    ctx.fillStyle = "#000000"
    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        // Create a pseudo-random but consistent pattern based on qrData
        const seed = qrData.charCodeAt((row * modules + col) % qrData.length)
        if ((seed + row + col) % 2 === 0) {
          ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize)
        }
      }
    }

    // Draw corner markers (position detection patterns)
    drawCornerMarker(ctx, 0, 0, moduleSize)
    drawCornerMarker(ctx, size - 7 * moduleSize, 0, moduleSize)
    drawCornerMarker(ctx, 0, size - 7 * moduleSize, moduleSize)

    setQrGenerated(true)
  }

  const drawCornerMarker = (ctx: CanvasRenderingContext2D, x: number, y: number, moduleSize: number) => {
    // Outer square
    ctx.fillStyle = "#000000"
    ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize)

    // White square
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize)

    // Inner black square
    ctx.fillStyle = "#000000"
    ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center">
        <div className="relative p-6 rounded-2xl bg-white">
          <canvas ref={canvasRef} className="rounded-lg" style={{ imageRendering: "pixelated" }} />

          {qrGenerated && (
            <div className="absolute -top-2 -right-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Valid Until</p>
            <p className="text-sm text-white font-medium">
              {new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="h-8 w-px bg-secondary" />

          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <p className="text-sm text-primary font-medium">Active</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={generateQRCode}
          className="mt-6 border-secondary hover:bg-secondary bg-transparent"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Regenerate Code
        </Button>
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Show this QR code to the event coordinator for attendance verification
        </p>
      </div>
    </div>
  )
}
