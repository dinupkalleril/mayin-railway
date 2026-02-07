import express from 'express';
import bcrypt from 'bcryptjs';
import os from 'os';
import crypto from 'crypto';
import { pool } from '../config/db.js';
import { verifyLicenseKey, getExpiryDate } from '../utils/license.js';

const router = express.Router();

/* ----------------------------------------------------
   Generate stable machine ID
---------------------------------------------------- */
function getMachineId() {
  const raw = [
    os.hostname(),
    os.platform(),
    os.arch()
  ].join('|');

  return crypto
    .createHash('sha256')
    .update(raw)
    .digest('hex');
}

/* ----------------------------------------------------
   REGISTER (first-time setup)
---------------------------------------------------- */
router.post('/register', async (req, res, next) => {
  try {
    console.log('HIT /auth/register', req.body);

    const { username, password, licenseKey } = req.body;

    if (!username || !password || !licenseKey) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    /* ------------------------------------------------
       1. Verify license cryptographically (SIGNED)
    ------------------------------------------------ */
    const normalizedKey = String(licenseKey).trim();
    const verification = verifyLicenseKey(normalizedKey);
    if (verification.status === 'invalid') {
      return res.status(400).json({ error: 'Invalid license key' });
    }
    if (verification.status === 'expired') {
      return res.status(403).json({ error: 'License key has expired' });
    }
    const licensePayload = verification.payload;

    /* ------------------------------------------------
       2. Username must be unique
    ------------------------------------------------ */
    const existingUser = await pool.query(
      'SELECT 1 FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    /* ------------------------------------------------
       3. Machine binding
    ------------------------------------------------ */
    const machineId = getMachineId();

    /* ------------------------------------------------
       4. Check local license usage
    ------------------------------------------------ */
    const licRes = await pool.query(
      'SELECT * FROM licenses WHERE license_key = $1',
      [normalizedKey]
    );

    if (licRes.rows.length > 0) {
      const lic = licRes.rows[0];

      if (lic.machine_id && lic.machine_id !== machineId) {
        return res
          .status(403)
          .json({ error: 'License already used on another machine' });
      }
    }

    /* ------------------------------------------------
       5. Persist (transaction-safe)
    ------------------------------------------------ */
    const passwordHash = await bcrypt.hash(password, 10);
    const productTier = licensePayload?.tier || licensePayload?.type || 'standard';
    const expiresAt = getExpiryDate(licensePayload); // Date|null derived from multiple possible fields

    await pool.query('BEGIN');

    try {
      // Upsert license
      await pool.query(
        `
        INSERT INTO licenses (
          license_key,
          product_tier,
          expires_at,
          is_activated,
          activated_at,
          machine_id,
          assigned_to,
          assigned_at,
          status,
          activation_count
        )
        VALUES ($1, $2, $3, true, NOW(), $4, $5, NOW(), 'activated', 1)
        ON CONFLICT (license_key)
        DO UPDATE SET
          is_activated = true,
          activated_at = NOW(),
          assigned_to = EXCLUDED.assigned_to,
          assigned_at = COALESCE(licenses.assigned_at, EXCLUDED.assigned_at),
          product_tier = EXCLUDED.product_tier,
          expires_at = EXCLUDED.expires_at,
          activation_count = licenses.activation_count + 1
        `,
        [normalizedKey, productTier, expiresAt, machineId, username]
      );

      // Create user
      const userResult = await pool.query(
        `
        INSERT INTO users (username, password_hash, license_key)
        VALUES ($1, $2, $3)
        RETURNING id, username
        `,
        [username, passwordHash, normalizedKey]
      );

      await pool.query('COMMIT');

      return res.json({
        success: true,
        user: userResult.rows[0],
        tier: productTier,
      });
    } catch (dbErr) {
      await pool.query('ROLLBACK');
      throw dbErr;
    }
  } catch (error) {
    console.error('Error in /auth/register:', error);
    next(error);
  }
});

/* ----------------------------------------------------
   LOGIN
---------------------------------------------------- */
router.post('/login', async (req, res, next) => {
  try {
    console.log(
      'HIT /auth/login',
      req.body?.username ? `{username: ${req.body.username}}` : req.body
    );

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required',
      });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Enforce license expiry on login (DB and signed payload)
    if (user.license_key) {
      const licRes = await pool.query('SELECT * FROM licenses WHERE license_key = $1', [user.license_key]);
      const lic = licRes.rows[0];

      // First, check the signed license payload offline (source of truth)
      const signed = verifyLicenseKey(user.license_key);
      if (signed.status === 'expired') {
        try { await pool.query('UPDATE licenses SET status = $1 WHERE license_key = $2', ['expired', user.license_key]); } catch {}
        return res.status(403).json({ error: 'License has expired' });
      }
      if (signed.status === 'invalid') {
        return res.status(403).json({ error: 'Invalid license key' });
      }

      // Sync DB expires_at with payload if different
      const payloadExpiry = typeof signed.payload?.expires_at === 'number' ? new Date(signed.payload.expires_at * 1000) : null;
      const dbExpiry = lic?.expires_at ? new Date(lic.expires_at) : null;
      const mismatch = (payloadExpiry && !dbExpiry) || (!payloadExpiry && dbExpiry) || (payloadExpiry && dbExpiry && payloadExpiry.getTime() !== dbExpiry.getTime());
      if (mismatch) {
        try {
          await pool.query('UPDATE licenses SET expires_at = $1 WHERE license_key = $2', [payloadExpiry, user.license_key]);
        } catch {}
      }

      // Also respect DB expiry if set and past
      if (lic && lic.expires_at && new Date(lic.expires_at) < new Date()) {
        try { await pool.query('UPDATE licenses SET status = $1 WHERE license_key = $2', ['expired', user.license_key]); } catch {}
        return res.status(403).json({ error: 'License has expired' });
      }
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        license_key: user.license_key,
      },
    });
  } catch (error) {
    console.error('Error in /auth/login:', error);
    next(error);
  }
});

export default router;
