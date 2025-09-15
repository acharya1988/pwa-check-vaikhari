

import type { SuperAdminContent } from ".";

export interface TaggedContent {
    tag: string;
    count: number;
    items: SuperAdminContent[];
}
