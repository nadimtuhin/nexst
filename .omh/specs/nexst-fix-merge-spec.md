---
title: Fix Failing Test Suites and Merge Conflicted States
status: confirmed
---

# Requirements Spec

Fix all failing tests in the `nexst` repository (UserController, Integration, UnitOfWork suites) and verify the entire test suite passes.

## Scope
1. **UserController Tests (`src/server/controllers/__tests__/user.controller.test.ts`)**
   - Ensure the database is correctly seeded before tests run.
   - Fix any `null` vs `undefined` mismatches in returned values.
2. **Integration Tests (`src/app/api/__tests__/integration.test.ts`)**
   - Resolve failing endpoint checks.
   - Verify that payload structures match the newly updated DTOs (e.g. `CreateUserDto` with password).
3. **UnitOfWork Tests (`src/server/database/__tests__/unit-of-work.test.ts`)**
   - Fix failing transaction tests.
   - Ensure repository operations within unit of work bounds roll back on errors.
