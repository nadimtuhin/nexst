# Contributing to Nexst

Thank you for your interest in contributing to Nexst! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

1. **Clear title and description**
2. **Steps to reproduce** the bug
3. **Expected behavior**
4. **Actual behavior**
5. **Environment details** (OS, Node version, etc.)
6. **Code samples** or test cases if applicable

### Suggesting Features

Feature suggestions are welcome! Please include:

1. **Use case** - Why is this feature needed?
2. **Proposed solution** - How should it work?
3. **Alternatives** - What other solutions did you consider?
4. **Additional context** - Screenshots, mockups, etc.

### Pull Requests

1. **Fork** the repository
2. **Create a branch** from `main`
3. **Make your changes**
4. **Write tests** for your changes
5. **Update documentation** if needed
6. **Ensure tests pass**: `npm test`
7. **Submit a pull request**

#### PR Guidelines

- Keep changes focused and atomic
- Write clear commit messages
- Add tests for new features
- Update documentation
- Follow the existing code style
- Ensure all tests pass

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/nexst.git
cd nexst

# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type check
npm run type-check

# Lint code
npm run lint
```

## Project Structure

```
nexst/
├── src/
│   ├── app/              # Next.js App Router
│   ├── server/           # Backend NestJS-style code
│   │   ├── controllers/  # API controllers
│   │   ├── services/     # Business logic
│   │   ├── dto/          # Data transfer objects
│   │   ├── decorators/   # Custom decorators
│   │   ├── filters/      # Exception handling
│   │   ├── pipes/        # Validation pipes
│   │   ├── guards/       # Authorization guards
│   │   ├── container/    # DI container
│   │   └── core/         # Core functionality
│   └── shared/           # Shared utilities
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Use explicit types when beneficial
- Avoid `any` type unless absolutely necessary

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `user.service.ts`)
- **Classes**: `PascalCase` (e.g., `UserService`)
- **Functions**: `camelCase` (e.g., `createUser`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_URL`)
- **Interfaces**: `PascalCase` with descriptive names (e.g., `User`, `CreateUserRequest`)

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in objects/arrays
- Use async/await over promises
- Keep functions small and focused
- Comment complex logic

Example:

```typescript
// Good
async function createUser(dto: CreateUserDto): Promise<User> {
  const user = await this.repository.save(dto)
  return user
}

// Avoid
function createUser(dto: any) {
  return this.repository.save(dto).then(user => user)
}
```

### Decorators

- Use decorators for metadata
- Keep decorator logic simple
- Document decorator parameters

```typescript
/**
 * Marks a method as a GET route handler
 * @param path - The route path (default: '')
 */
export const Get = (path = '') => {
  // Implementation
}
```

### Services

- Keep services focused on single responsibility
- Use dependency injection
- Return typed results
- Throw typed exceptions

```typescript
@Injectable()
export class UserService {
  constructor(private emailService: EmailService) {}

  async create(dto: CreateUserDto): Promise<User> {
    // Implementation
  }
}
```

### Controllers

- Keep controllers thin
- Delegate to services
- Use DTOs for validation
- Return consistent response format

```typescript
@Controller('/users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const user = await this.userService.create(dto)
    return { data: user }
  }
}
```

### Error Handling

- Use typed exceptions
- Provide meaningful error messages
- Include context when helpful

```typescript
if (!user) {
  throw new NotFoundException(`User with ID ${id} not found`)
}
```

## Testing

### Writing Tests

- Write tests for all new features
- Test edge cases and error conditions
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

```typescript
describe('UserService', () => {
  describe('create', () => {
    it('should create a user with valid data', async () => {
      // Arrange
      const dto = { name: 'Test', email: 'test@example.com' }
      const service = new UserService()

      // Act
      const user = await service.create(dto)

      // Assert
      expect(user.name).toBe('Test')
      expect(user.id).toBeDefined()
    })
  })
})
```

### Test Coverage

- Aim for >80% code coverage
- Focus on critical paths
- Test business logic thoroughly
- Test error handling

## Documentation

### Code Comments

- Comment "why", not "what"
- Document complex algorithms
- Add JSDoc for public APIs

```typescript
/**
 * Creates a new user account and sends a welcome email
 * @param dto - User creation data
 * @returns The created user
 * @throws ConflictException if email already exists
 */
async createUser(dto: CreateUserDto): Promise<User> {
  // Implementation
}
```

### README Updates

- Update README for new features
- Add examples for new functionality
- Keep documentation in sync with code

## Commit Messages

Format: `<type>(<scope>): <subject>`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(users): add email verification
fix(validation): handle empty strings correctly
docs(readme): update installation instructions
test(users): add tests for user creation
```

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create a git tag
4. Push to GitHub
5. Create a GitHub release

## Getting Help

- Check existing [issues](https://github.com/yourusername/nexst/issues)
- Read the [documentation](README.md)
- Ask questions in [discussions](https://github.com/yourusername/nexst/discussions)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Nexst! 🚀
