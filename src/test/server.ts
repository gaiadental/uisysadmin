import { setupServer } from "msw/node"

import { handlers } from "./handlers"

/** The MSW server for Node-based tests. Started and reset in setup.ts. */
export const server = setupServer(...handlers)
