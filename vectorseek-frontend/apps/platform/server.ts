import express from 'express';
import { ngExpressEngine } from '@nguniversal/express-engine';
import { render } from './src/main.server';

const app = express();
const port = process.env['PORT'] ? Number(process.env['PORT']) : 4000;

app.engine('html', (_, options, callback) => ngExpressEngine()(options, callback));
app.set('view engine', 'html');
app.set('views', './dist/apps/platform/browser');

app.get('*', async (_req, res) => {
  try {
    const html = await render();
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send(String(error));
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Mock Angular Universal server listening on http://localhost:${port}`);
  });
}

export default app;
