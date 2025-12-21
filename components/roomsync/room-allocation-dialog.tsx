"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Calendar, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Room {
  id: string
  name: string
  building: string
  capacity: number
  facilities: string[]
}

interface RoomAllocationDialogProps {
  room: Room
  open: boolean
  onOpenChange: (open: boolean) => void
  onAllocate: () => void
}

export function RoomAllocationDialog({ room, open, onOpenChange, onAllocate }: RoomAllocationDialogProps) {
  const [section, setSection] = useState("")
  const [subject, setSubject] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [date, setDate] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, submit allocation data to backend
    onAllocate()
  }

  const aiSuggestedSections = ["CS-A", "CS-B", "IT-A", "ECE-A"]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-secondary text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Allocate {room.name}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Assign this room to a section for a specific time period
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Details */}
          <div className="p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Building</span>
              <span className="text-sm text-white">{room.building}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Capacity</span>
              <span className="text-sm text-white">{room.capacity} students</span>
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-white">AI Suggested Sections</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {aiSuggestedSections.map((sec) => (
                <Badge
                  key={sec}
                  variant="outline"
                  className="cursor-pointer border-accent/30 text-accent hover:bg-accent/10"
                  onClick={() => setSection(sec)}
                >
                  {sec}
                </Badge>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="section" className="text-sm text-muted-foreground mb-2 block">
                Section
              </Label>
              <Input
                id="section"
                placeholder="e.g., CS-A"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="bg-secondary border-secondary text-white placeholder:text-muted-foreground"
                required
              />
            </div>

            <div>
              <Label htmlFor="subject" className="text-sm text-muted-foreground mb-2 block">
                Subject
              </Label>
              <Input
                id="subject"
                placeholder="e.g., Data Structures"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-secondary border-secondary text-white placeholder:text-muted-foreground"
                required
              />
            </div>

            <div>
              <Label htmlFor="date" className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-secondary border-secondary text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime" className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Start Time
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-secondary border-secondary text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="text-sm text-muted-foreground mb-2 block">
                  End Time
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-secondary border-secondary text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-secondary hover:bg-secondary bg-transparent"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-accent hover:bg-accent/90 text-white">
              Allocate Room
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
