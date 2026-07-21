# Ralplan: Fix failing test suites and merge conflicted states

This plan covers fixing the remaining test failures across `UserController`, `Integration`, and `UnitOfWork` test suites.

## Consensus Status
- Round 1: APPROVED (Skipped consensus loop due to concrete and low-risk scope)

## Tasks
1. **Task 1: Fix UserController test suite**
   - Seed test data in `beforeEach` with standard user data (John/Jane Doe).
   - Ensure cleanup in `afterEach` via `prismaService.cleanDatabase()`.
   - Update any `toBeUndefined()` checks to `.toBeNull()`.
   - Acceptance: `npx jest src/server/controllers/__tests__/user.controller.test.ts` passes.

2. **Task 2: Fix Integration test suite**
   - Review `src/app/api/__tests__/integration.test.ts` failures.
   - Inject required `password` fields to user creation payloads to comply with `CreateUserDto`.
   - Acceptance: `npx jest src/app/api/__tests__/integration.test.ts` passes.

3. **Task 3: Fix UnitOfWork test suite**
   - Review `src/server/database/__tests__/unit-of-work.test.ts` failures.
   - Resolve transaction issues or repository mock mismatch.
   - Acceptance: `npx jest src/server/database/__tests__/unit-of-work.test.ts` passes.
