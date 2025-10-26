export { supabase, setGlobalAuthErrorHandler } from "./client";
export { auth } from "./auth";
export * from "./database";

import { profiles } from "./database/profiles";
import { companies } from "./database/companies";
import { talents } from "./database/talents";
import { jobs } from "./database/jobs";
import { applications } from "./database/applications";
import { skills } from "./database/skills";
import { matches } from "./database/matches";
import { analytics } from "./database/analytics";

export const db = {
  ...profiles,
  ...companies,
  ...talents,
  ...jobs,
  ...applications,
  ...skills,
  ...matches,
  ...analytics,
};
