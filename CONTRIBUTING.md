# Getting Started

```bash
git clone git@github.com:kasir-barati/flagd-nestjs.git
cd flagd-nestjs
cp .env.example .env
pnpm install
docker compose up --build -d
```

Once the server is running, visit the Swagger UI: http://localhost:3000/api

# Bump Version

To release a new version your [commit message should follow these rules](https://github.com/semantic-release/semantic-release?tab=readme-ov-file#commit-message-format) which is the default behavior of `semantic-release`.

> [!CAUTION]
>
> `feat!: some message` won't release a new major version. So make sure to use the correct commit message:
>
> ```cmd
> git commit -m "perf: some message" -m "BREAKING CHANGE: extra details"
> ```

## Automated Docker Hub release

This repository is configured to auto-release Docker images from `Dockerfile` using Conventional Commits.

- Workflow: `.github/workflows/dockerhub-release.yml`.
- Release config: `.releaserc.json` ([semantic-release](https://www.npmjs.com/package/semantic-release)).
- Trigger: push to `main`.

How versioning works:

| Commit type(s)                                           | Release behavior       |
| -------------------------------------------------------- | ---------------------- |
| `feat:`                                                  | **minor** version bump |
| `fix:` or `perf:`                                        | **patch** version bump |
| `chore:`, `docs:`, `style:`, `refactor:`, `test:`, `ci:` | No release by default  |

For each release, the workflow builds from `Dockerfile` and pushes:

- `9109679196/flagd-nestjs:<semantic-version>`
- `9109679196/flagd-nestjs:latest`

# Testing

```bash
pnpm test
pnpm test:e2e
```

## Testing Conventions

- If you change/add something make sure to write/update and then run the unit/e2e tests.
- Use vitest.
- Use `it` instead of `test`.
- Use `it.each` whenever it make sense.
- Use jest-extended APIs whenever appropriate.
- Use AAA (Arrange, Act, Assert) style of writing test.
  - Use new line as an indicator of each step!
- Add fixtures only when it makes my tests more readable (but in general prefer to write them inside the test body).
- Try to mock using vitest instead of `@nestjs/testing`.
- Use `uut` (unit under test) **only** when you instantiate an object whose **methods** you will exercise in the test. For example: `uut = MyService(...)` followed by `uut.do_something()`.
- When testing a **function** (or a constructor where you just assert on the returned value), name the variable after what it represents — e.g. `result`, `settings`, `payload`, etc. Do **not** call it `uut` in that case.
- Always ask what we should and what we should **NOT** mock.
- For e2e tests use testcotnainers and the `Dockerfile` we have to stay as close as possible to the prod state.
- Feel free to add fixtures for stuff like building a docker image from my repo so our e2e tests is not bloated.

## Unit Test Example

```ts
import { Model } from 'mongoose';

import { UserRepository } from './repositories';
import { UserDocument } from './schemas';

describe(UserRepository.name, () => {
  let uut: UserRepository;
  let userModel: Model<UserDocument>;

  beforeEach(() => {
    userModel = {
      findById: vi.fn(),
    } as any;
    uut = new UserRepository(userModel);
  });

  it('should return the user', async () => {
    vi.mocked(userModel).mockResolvedValue({
      _id: '69b13a073469bd6633c282b2',
    });

    await uut.getUser('69b13a073469bd6633c282b2');

    expect(userModel.findById).toHaveBeenCalledWith({
      _id: '69b13a073469bd6633c282b2',
    });
  });
});
```
