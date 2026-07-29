import { defineMcp } from "@lovable.dev/mcp-js";
import searchParks from "./tools/search-parks";
import getPark from "./tools/get-park";
import listCommunityReviews from "./tools/list-community-reviews";
import reservationWindow from "./tools/reservation-window";
import addPersonalReview from "./tools/add-personal-review";

export default defineMcp({
  name: "campground-intelligence",
  title: "Campground Intelligence",
  version: "0.1.0",
  instructions:
    "Tools for a Thousand Trails / Trails Collection campground intelligence platform for full-time RVers. Use `search_parks` to find campgrounds by name, state, or membership; `get_park` for full detail including big-rig warnings and reviews; `list_community_reviews` to browse review sentiment; `reservation_window` to work out the date to call and book (120-day window for Thousand Trails standard, 60-day for Trails Collection); and `add_personal_review` to log a personal field note after a stay.",
  tools: [searchParks, getPark, listCommunityReviews, reservationWindow, addPersonalReview],
});
