import { default as adminRolesGET } from "./admin.roles.get.js";
import { default as adminRolesPOST } from "./admin.roles.post.js";
import { default as adminDbInspectGET } from "./admin.db.inspect.get.js";
import { default as secureGET } from "./secure.get.js";
import { default as profileMeGET } from "./profile.me.get.js";
import { default as circlesIdPostsGET } from "./circles.id.posts.get.js";

export function registerMigratedEndpoints(router) {
  // Exact matches
  router.on("GET", "/api/admin/roles", adminRolesGET);
  router.on("POST", "/api/admin/roles", adminRolesPOST);
  router.on("GET", "/api/admin/db/inspect", adminDbInspectGET);
  router.on("GET", "/api/secure", secureGET);
  router.on("GET", "/api/profile/me", profileMeGET);
  // Note: /api/me is registered in server.js base (parity)
}

// Dynamic matches handled in server.js, export helpers
export const dynamicRoutes = [
  { method: "GET", pattern: /^\/api\/circles\/[^/]+\/posts$/, handler: circlesIdPostsGET },
  // Genkit catch-all placeholder – can be wired if needed
  // { method: "GET", pattern: /^\/api\/genkit\//, handler: genkitHandler }
];

