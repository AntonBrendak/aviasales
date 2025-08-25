import { Router } from 'express';
import { http } from '../lib/http';
const r = Router();

r.post('/v1/search', async (req, res, next) => {
  try {
    const rr = await http.post(`${process.env.SVC_SEARCH_URL}/v1/search`, req.body, {
      headers: { 'X-Request-Id': req.headers['x-request-id'] || '' }
    });
    res.status(rr.status).json(rr.data);
  } catch (e) { next(e); }
});
export default r;