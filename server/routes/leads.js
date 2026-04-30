import express from 'express';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// ─── Admin API Key (MUST be set in environment) ─────────────────────
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
if (!ADMIN_API_KEY) {
  console.error('[LEADS] WARNING: ADMIN_API_KEY not set! GET /api/leads will be disabled.');
}

// ─── Rate Limiting for lead submissions ────────────────────────────
const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 leads per IP per 15 min
  message: { error: 'Too many lead submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Supabase Helper ────────────────────────────────────────────────
let supabaseInstance = null;
async function getSupabase() {
  if (supabaseInstance) return supabaseInstance;
  
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.warn('[LEADS] Supabase env vars not set — using in-memory fallback');
    return null;
  }
  
  supabaseInstance = createClient(url, key);
  return supabaseInstance;
}

// In-memory fallback store (for when Supabase is unavailable)
const memoryLeads = [];

/**
 * POST /api/leads — Save a new lead
 */
router.post('/', leadLimiter, async (req, res) => {
  try {
    const lead = req.body;
    
    if (!lead.pincode || !lead.productCategory) {
      return res.status(400).json({ error: 'pincode and productCategory are required' });
    }

    // Basic validation
    if (lead.phone && !/^[6-9]\d{9}$/.test(lead.phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Sanitize lead name
    const sanitizedName = String(lead.name || '').replace(/[<>"'&]/g, '').substring(0, 100);
    const cleanLead = { 
      ...lead, 
      name: sanitizedName,
      received_at: new Date().toISOString(),
    };

    // Try Supabase first, fallback to memory
    const supabase = await getSupabase();
    
    if (supabase) {
      // Persist to Supabase
      const { data, error } = await supabase
        .from('leads')
        .insert(cleanLead)
        .select('id')
        .single();
      
      if (error) {
        console.error('[LEAD] Supabase insert failed:', error.message);
        // Fallback to memory
        memoryLeads.push(cleanLead);
      }
      
      console.log(`[LEAD] Saved: ${lead.productCategory} | ${lead.language} | phone: ${lead.phone || 'N/A'} | pincode: ${lead.pincode}`);
      res.json({ success: true, leadId: data?.id, message: 'Lead saved successfully' });
    } else {
      // Memory fallback
      const existingIndex = memoryLeads.findIndex(l => 
        l.phone === cleanLead.phone && l.productCategory === cleanLead.productCategory
      );
      
      if (existingIndex >= 0) {
        memoryLeads[existingIndex] = { ...memoryLeads[existingIndex], ...cleanLead, updatedAt: new Date().toISOString() };
      } else {
        memoryLeads.push(cleanLead);
      }

      console.log(`[LEAD] Saved (memory): ${lead.productCategory} | ${lead.language} | phone: ${lead.phone || 'N/A'} | pincode: ${lead.pincode}`);
      res.json({ success: true, leadId: lead.id, message: 'Lead saved successfully (memory mode)' });
    }
  } catch (error) {
    console.error('[LEAD] Save error:', error);
    res.status(500).json({ error: 'Failed to save lead' });
  }
});

/**
 * GET /api/leads — Get all leads (for admin/dashboard)
 * Requires ADMIN_API_KEY to be set
 */
router.get('/', async (req, res) => {
  // Enforce admin key requirement
  if (!ADMIN_API_KEY) {
    return res.status(503).json({ error: 'Admin API not configured. Set ADMIN_API_KEY environment variable.' });
  }
  
  if (req.headers['x-admin-key'] !== ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { category, limit = 100, offset = 0 } = req.query;
  
  try {
    const supabase = await getSupabase();
    
    if (supabase) {
      // Fetch from Supabase
      let query = supabase
        .from('leads')
        .select('*')
        .order('received_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);
      
      if (category) {
        query = query.eq('productCategory', category);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      res.json({
        total: count || data?.length || 0,
        leads: data || [],
        stats: {
          total: count || data?.length || 0,
          contactable: (data || []).filter(l => l.status === 'contactable').length,
          byCategory: (data || []).reduce((acc, l) => {
            acc[l.productCategory] = (acc[l.productCategory] || 0) + 1;
            return acc;
          }, {}),
        },
        source: 'supabase',
      });
    } else {
      // Memory fallback
      let filtered = memoryLeads;
      if (category) {
        filtered = memoryLeads.filter(l => l.productCategory === category);
      }
      
      const paginated = filtered.slice(Number(offset), Number(offset) + Number(limit));
      
      res.json({
        total: filtered.length,
        leads: paginated,
        stats: {
          total: memoryLeads.length,
          contactable: memoryLeads.filter(l => l.status === 'contactable').length,
          byCategory: memoryLeads.reduce((acc, l) => {
            acc[l.productCategory] = (acc[l.productCategory] || 0) + 1;
            return acc;
          }, {}),
        },
        source: 'memory',
      });
    }
  } catch (error) {
    console.error('[LEAD] Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

/**
 * DELETE /api/leads/:id — Delete a lead (admin only)
 */
router.delete('/:id', async (req, res) => {
  if (!ADMIN_API_KEY) {
    return res.status(503).json({ error: 'Admin API not configured' });
  }
  
  if (req.headers['x-admin-key'] !== ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = await getSupabase();
    
    if (supabase) {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', req.params.id);
      
      if (error) throw error;
    } else {
      // Memory fallback
      const idx = memoryLeads.findIndex(l => l.id === req.params.id);
      if (idx >= 0) memoryLeads.splice(idx, 1);
    }
    
    res.json({ success: true, message: 'Lead deleted' });
  } catch (error) {
    console.error('[LEAD] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

export default router;