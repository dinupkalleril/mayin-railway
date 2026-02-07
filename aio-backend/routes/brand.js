import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// Save brand information
router.post('/', async (req, res, next) => {
  try {
    const { userId, brand_name, tagline, product_details, website_url, location } = req.body;

    if (!userId || !brand_name || !product_details || !website_url || !location) {
      return res.status(400).json({ error: 'User ID, brand name, product details, website URL, and location are required' });
    }

    const result = await pool.query(
      `INSERT INTO brands (user_id, brand_name, tagline, product_details, website_url, location)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, brand_name, tagline || null, product_details, website_url, location]
    );

    res.json({ success: true, brand: result.rows[0] });
  } catch (error) {
    console.error('Error saving brand:', error);
    return res.status(400).json({ error: 'Failed to save brand information' });
  }
});

// Update brand information
router.put('/:brandId', async (req, res, next) => {
  try {
    const { brandId } = req.params;
    const { brand_name, tagline, product_details, website_url, location } = req.body;

    if (!brand_name || !product_details || !website_url || !location) {
      return res.status(400).json({
        error: 'Brand name, product details, website URL, and location are required'
      });
    }

    const result = await pool.query(
      `UPDATE brands
       SET brand_name = $1,
           tagline = $2,
           product_details = $3,
           website_url = $4,
           location = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        brand_name,
        tagline || null,
        product_details,
        website_url,
        location,
        brandId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    res.json({ success: true, brand: result.rows[0] });
  } catch (error) {
    console.error('Error updating brand:', error);
    return res.status(400).json({ error: 'Failed to update brand information' });
  }
});

// Get brand information for a user
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { brandId } = req.query; // Optional: filter to a single brand by id

    let query = `SELECT * FROM brands WHERE user_id = $1`;
    const params = [userId];

    if (brandId) {
      query += ` AND id = $2`;
      params.push(brandId);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);

    // Always return 200 with an array, even if empty (new users with no brands)
    return res.status(200).json({ brands: result.rows || [] });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return res.status(400).json({ error: 'Failed to fetch brand information' });
  }
});

// Get single brand by ID
router.get('/:brandId', async (req, res, next) => {
  try {
    const { brandId } = req.params;

    const result = await pool.query(
      `SELECT * FROM brands WHERE id = $1`,
      [brandId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    res.json({ brand: result.rows[0] });
  } catch (error) {
    console.error('Error fetching brand:', error);
    return res.status(404).json({ error: 'Brand not found' });
  }
});

// Delete brand
router.delete('/:brandId', async (req, res, next) => {
  try {
    const { brandId } = req.params;

    const result = await pool.query(
      `DELETE FROM brands WHERE id = $1 RETURNING id`,
      [brandId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    res.json({ success: true, message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    return res.status(400).json({ error: 'Failed to delete brand' });
  }
});

export default router;
