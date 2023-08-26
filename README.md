## Known Bugs:
- Accounts:
  - Information disclosure, when signup return username not exists or email not exists
  - Store password in user when create user
  - Not transform data before save into DB
  - User was Inactivated, but when verify OTP it's will set to Actived
  - When signin not check status = Actived
  - JWT has no exp time
  - Return sensitive data when signup and signin
- Tasks:
  - Create task hasn't handle transaction
  - Tasks can be retrieved by crossover users

## Future Features
- Upload images into tasks
