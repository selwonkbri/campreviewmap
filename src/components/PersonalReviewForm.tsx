import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAddPersonalReview, type Park } from "@/lib/parks";
import { toast } from "sonner";

interface Props {
  park: Park;
  onClose: () => void;
  onSaved: () => void;
}

export function PersonalReviewForm({ park, onClose, onSaved }: Props) {
  const [stayStart, setStayStart] = useState(new Date().toISOString().slice(0, 10));
  const [stayEnd, setStayEnd] = useState("");
  const [rating, setRating] = useState(4);
  const [bigRigVerdict, setBigRigVerdict] = useState("yes");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useAddPersonalReview();

  return (
    <motion.div
      className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6"
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
        onSubmit={async (e) => {
          e.preventDefault();
          if (!notes.trim()) {
            toast.error("Add some thoughts before saving");
            return;
          }
          try {
            await mutation.mutateAsync({
              park_id: park.park_id,
              park_name: park.park_name,
              stay_start: stayStart,
              stay_end: stayEnd,
              rating_overall: rating,
              big_rig_verdict: bigRigVerdict,
              tags: tags.trim(),
              notes: notes.trim(),
            });
            toast.success("Saved to Google Sheet");
            onSaved();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Couldn't save to sheet");
          }
        }}
        className="w-full max-w-lg rounded-t-2xl bg-card p-6 shadow-2xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-accent">Field notes → reviews_personal</p>
            <h3 className="text-xl font-bold">{park.park_name}</h3>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="stayStart">Stay start</Label>
            <Input id="stayStart" type="date" value={stayStart} onChange={(e) => setStayStart(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="stayEnd">Stay end</Label>
            <Input id="stayEnd" type="date" value={stayEnd} onChange={(e) => setStayEnd(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bigRig">Big rig verdict</Label>
            <select
              id="bigRig"
              value={bigRigVerdict}
              onChange={(e) => setBigRigVerdict(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="yes">Yes</option>
              <option value="partial">Partial</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <Label htmlFor="rating">Overall: {rating}/5</Label>
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
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="quiet, level sites, weak wifi" />
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
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving…" : "Save to sheet"}
          </Button>
        </div>
      </motion.form>
    </motion.div>
  );
}
