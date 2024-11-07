import app from './app';
import { PORT } from './config';

app.listen(PORT, () => {
  console.log(`User service is running on port ${PORT}`);
});
