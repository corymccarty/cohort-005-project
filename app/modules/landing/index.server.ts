import { db } from "~/db";
import { getLandingPage, type Db } from "./lib/landing";

export type {
  CatalogueStats,
  FeaturedCourse,
  LandingPage,
} from "./lib/landing";

/**
 * The public landing page's data, bound to a database. The app uses
 * `landing`, which reads the app database; tests build their own against a
 * test database.
 */
export function createLanding(database: Db) {
  return {
    /**
     * The newest published course as the spotlight, the next newest as the
     * featured courses (each with its lesson count), and the catalogue totals
     * the landing page shows. Only published courses count.
     */
    get() {
      return getLandingPage(database);
    },
  };
}

// Pure so a route importing this only for its loader doesn't pull the
// database into the client bundle (see `~/db`).
export const landing = /* @__PURE__ */ createLanding(db);
