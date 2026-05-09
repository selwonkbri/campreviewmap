
CREATE TABLE public.parks (
  park_id text PRIMARY KEY,
  park_name text NOT NULL,
  membership_type text,
  state text,
  city text,
  region text,
  address text,
  lat double precision,
  lon double precision,
  big_rig_friendly text,
  cell_quality text,
  key_amenities text,
  nearby_highlights text,
  notes text,
  last_updated timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.reviews_community (
  review_id text PRIMARY KEY,
  park_id text REFERENCES public.parks(park_id) ON DELETE CASCADE,
  park_name text,
  source_type text,
  source_url text,
  review_date date,
  sentiment text,
  big_rig_flag text,
  tags text,
  summary text,
  raw_quote text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reviews_community_park_id_idx ON public.reviews_community(park_id);

CREATE TABLE public.reviews_personal (
  entry_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  park_id text REFERENCES public.parks(park_id) ON DELETE CASCADE,
  park_name text,
  stay_start date,
  stay_end date,
  rating_overall numeric,
  rating_sites numeric,
  rating_amenities numeric,
  rating_cell numeric,
  big_rig_verdict text,
  tags text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reviews_personal_park_id_idx ON public.reviews_personal(park_id);

ALTER TABLE public.parks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews_community ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews_personal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view parks" ON public.parks FOR SELECT USING (true);
CREATE POLICY "Public can view community reviews" ON public.reviews_community FOR SELECT USING (true);
CREATE POLICY "Public can view personal reviews" ON public.reviews_personal FOR SELECT USING (true);
CREATE POLICY "Public can add personal reviews" ON public.reviews_personal FOR INSERT WITH CHECK (true);
