## Testing

```bash
pnpm test
```

### Testing Conventions

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

### Unit Test Example

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
