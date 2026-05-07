import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addPersonalReview, type Park } from "@/lib/parks";
import { toast } from "sonner";

interface Props {
  park: Park;
  onClose: () => void;
  onSaved: () => void;
}

export function PersonalReviewForm({ park, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [site, setSite] = useState("");
  const [wifi, setWifi] = useState("good");
  const [rating, setRating] = useState(4);
  const [notes, setNotes] = useState("");

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!notes.trim()) {
            toast.error("Add some thoughts before saving");
            return;
          }
          addPersonalReview({
            park_id: park.park_id,
            park_name: park.park_name,
            stay_start: date,
            site_number: site,
            wifi_quality: wifi,
            rating_overall: rating,
            notes: `${name ? `[${name}] ` : ""}${notes}`,
          });
          toast.success("Field notes saved");
          onSaved();
        }}
        className="w-full max-w-lg rounded-t-2xl bg-card p-6 shadow-2xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-accent">Field notes</p>
            <h3 className="text-xl font-bold">{park.park_name}</h3>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="name">Your name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <Label htmlFor="date">Stay date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="site">Site #</Label>
            <Input id="site" value={site} onChange={(e) => setSite(e.target.value)} placeholder="e.g. 142" />
          </div>
          <div>
            <Label htmlFor="wifi">WiFi quality</Label>
            <select
              id="wifi"
              value={wifi}
              onChange={(e) => setWifi(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="ok">OK</option>
              <option value="poor">Poor</option>
              <option value="none">None</option>
            </select>
          </div>
          <div>
            <Label htmlFor="rating">Overall rating: {rating}/5</Label>
            <input
              id="rating"
              type="range"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--accent)]"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="notes">Raw thoughts</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Site was level, neighbors quiet, but the bathhouse..."
              rows={5}
              maxLength={2000}
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
            Save field notes
          </Button>
        </div>
      </motion.form>
    </motion.div>
  );
}
