import test from "node:test";
import assert from "node:assert/strict";

import type { User } from "../src/lib/data.ts";
import { canCommentOnSops, canUploadSops } from "../src/lib/rbac.ts";

const buildUser = (role: User["role"]): User => ({
  id: `user-${role}`,
  username: role,
  password: "change-me",
  name: role,
  role,
});

test("SOP uploads are allowed for everyone except engineers", () => {
  assert.equal(canUploadSops(buildUser("engineer")), false);
  assert.equal(canUploadSops(buildUser("shift-lead")), true);
  assert.equal(canUploadSops(buildUser("manager")), true);
  assert.equal(canUploadSops(buildUser("executive")), true);
  assert.equal(canUploadSops(buildUser("admin")), true);
});

test("engineers can comment on SOP modifications while other roles keep access", () => {
  assert.equal(canCommentOnSops(buildUser("engineer")), true);
  assert.equal(canCommentOnSops(buildUser("shift-lead")), true);
  assert.equal(canCommentOnSops(buildUser("manager")), true);
  assert.equal(canCommentOnSops(buildUser("executive")), true);
  assert.equal(canCommentOnSops(buildUser("admin")), true);
  assert.equal(canCommentOnSops(null), false);
});
